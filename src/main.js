/**
 * Game bootstrap.
 *
 * Flow:
 *   1. Create the Phaser game with the boot scene.
 *   2. After boot finishes loading, inspect the manifest:
 *      - if no backgrounds → start the WaitingScene placeholder.
 *      - else → register every game scene + the title screen + the global
 *        UI / inventory layers.
 *   3. Title screen runs first; first user click on Start unlocks the audio
 *      context (browsers block autoplay until user gesture) and routes to
 *      the hub or the tutorial scene.
 */

import Phaser from 'phaser';

import { BootScene } from './scenes/BootScene.js';
import { WaitingScene } from './scenes/WaitingScene.js';
import { GameScene, setWorldCollectedSave, resetWorldCollected } from './scenes/GameScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { TutorialScene } from './scenes/TutorialScene.js';
import { GlobalUIScene } from './systems/GlobalUI.js';
import { InventoryScene } from './systems/Inventory.js';
import { GemHUDScene } from './systems/GemHUD.js';
import { GemBag } from './systems/GemBag.js';
import { QuestManager } from './systems/Quests.js';
import { QuestHUDScene } from './systems/QuestHUD.js';
import { Protagonist } from './systems/Protagonist.js';
import { AudioManager } from './systems/AudioManager.js';
import { SceneRouter } from './systems/SceneRouter.js';
import { SaveGame } from './systems/SaveGame.js';
import { BuddyTeam } from './systems/BuddyTeam.js';
import { BattleScene } from './scenes/BattleScene.js';
import { buildSceneCatalog } from './content/sceneCatalog.js';

// Fixed design resolution. Phaser scales the canvas to fit the
// viewport (with letterboxing to preserve aspect). All UI is laid
// out against this size, so a phone, tablet, and laptop all see the
// same proportional layout. Mobile-responsive without per-component
// font math.
const GAME_WIDTH = 1600;
const GAME_HEIGHT = 900;
const FIRST_LAUNCH_KEY = 'conaloo.firstLaunchSeen.v1';

function makeGame() {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'app',
    backgroundColor: '#fff8e7',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT
    },
    render: {
      pixelArt: false,
      antialias: true,
      roundPixels: true
    },
    audio: {
      disableWebAudio: false
    },
    fps: { target: 60, smoothStep: true },
    scene: []
  });
}

function start() {
  const game = makeGame();
  const audio = new AudioManager(game);
  const router = new SceneRouter(game);
  const saveGame = new SaveGame();
  const protagonist = new Protagonist({ saveGame });
  const gemBag = new GemBag({ saveGame });
  const quests = new QuestManager({ saveGame });
  const buddyTeam = new BuddyTeam({ saveGame });
  setWorldCollectedSave(saveGame);
  // Session-wide set so a quiz isn't asked twice — even after a scene
  // transition. Cleared on page reload (intentionally not persisted —
  // a kid who's been away for a day would enjoy seeing the quizzes
  // again).
  const seenQuizzes = new Set();

  // Wire game-system events into the quest tracker. Quests get rich
  // context — current totals, current inventory — so weirder
  // predicates can check "do I have 8 things at once?" without us
  // tracking that state inside each quest.
  gemBag.onChange(({ delta, newTotal }) => {
    if (delta > 0) {
      quests.report({ type: 'gem-collected', value: delta, gemTotal: newTotal });
    }
  });
  protagonist.onCollectChange((thingKey, inventorySnapshot) => {
    if (!thingKey) return;
    const inv = inventorySnapshot || protagonist.inventory();
    const uniqueCount = inv.length;
    const totalCount = inv.reduce((s, it) => s + (it.count || 0), 0);
    quests.report({
      type: 'thing-collected',
      key: thingKey,
      inventory: inv,
      uniqueCount,
      totalCount
    });
  });

  // Replay persisted inventory + gem total into quest progress, so a
  // kid who left mid-quest (3/5 things, 17/25 gems) sees the right
  // progress bars on resume. This is safe: completed-flag quests have
  // already been hydrated and report() skips completed entries, so no
  // duplicate celebrations. No HUDs are listening yet at this point.
  if (saveGame.hasSave()) {
    if (gemBag.total > 0) {
      quests.report({ type: 'gem-collected', value: gemBag.total, gemTotal: gemBag.total });
    }
    const inv = protagonist.inventory();
    for (const it of inv) {
      for (let i = 0; i < it.count; i++) {
        quests.report({
          type: 'thing-collected',
          key: it.key,
          inventory: inv,
          uniqueCount: inv.length,
          totalCount: inv.reduce((s, x) => s + (x.count || 0), 0)
        });
      }
    }
  }

  // Replay buddy roster so the "collect all 5 buddies" quest knows
  // which species the kid already owns. Always runs (even on fresh
  // launch with just the starter) so the starter counts toward the
  // collection quest.
  for (const buddy of buddyTeam.list()) {
    quests.report({ type: 'buddy-starter', speciesId: buddy.speciesId });
  }

  // Expose for dev-time debugging only.
  if (import.meta.env?.DEV) {
    window.__game = game;
    window.__router = router;
    window.__protagonist = protagonist;
    window.__gemBag = gemBag;
    window.__quests = quests;
    window.__save = saveGame;
    window.__buddyTeam = buddyTeam;
  }

  // Phaser calls scene.init(data) when it starts a scene, so pass
  // onReady through the start-data hand-off (init() would be clobbered).
  game.scene.add('boot', BootScene, true, {
    onReady: (loader) => onAssetsReady(game, loader, audio, router, protagonist, gemBag, seenQuizzes, quests, saveGame, buddyTeam)
  });
  console.log('[main] game created, boot scene queued');
}

function onAssetsReady(game, loader, audio, router, protagonist, gemBag, seenQuizzes, quests, saveGame, buddyTeam) {
  if (!loader.hasAnyBackground) {
    game.scene.add('scene:waiting', new WaitingScene(), true);
    game.scene.stop('boot');
    return;
  }

  const catalog = buildSceneCatalog(loader);
  router.setHubSlug(catalog.hubSlug);

  // IMPORTANT scene-add order: gameplay + title scenes FIRST, HUD scenes
  // LAST. Phaser renders scenes in the order they were added; the last-
  // added scene draws on top. If HUDs are added before gameplay, they
  // render BEHIND gameplay (the v1.2.1 bug — gem counter was hidden by
  // every game scene).
  for (const slug of Object.keys(catalog.scenes)) {
    const def = catalog.scenes[slug];
    const scene = new GameScene(slug, def, { audio, router, loader, protagonist, gemBag, seenQuizzes, quests, buddyTeam });
    game.scene.add(`scene:${slug}`, scene, false);
  }
  game.scene.add('scene:title', new TitleScene(), false);
  game.scene.add('scene:tutorial', new TutorialScene(), false);
  // BattleScene is launched on-demand from GameScene._startBuddyBattle.
  game.scene.add('scene:battle', new BattleScene(), false);

  // HUDs go on TOP — added last, so they render last.
  const ui = new GlobalUIScene();
  ui.init({ router, buddyTeam });
  game.scene.add('global:ui', ui, true);

  const inv = new InventoryScene();
  inv.init({ protagonist });
  game.scene.add('global:inventory', inv, true);

  const gemHud = new GemHUDScene();
  gemHud.init({ gemBag });
  game.scene.add('global:gemhud', gemHud, true);

  const questHud = new QuestHUDScene();
  questHud.init({ questManager: quests, gemBag });
  game.scene.add('global:questhud', questHud, true);

  const firstLaunch = !localStorage.getItem(FIRST_LAUNCH_KEY);
  console.log('[main] firstLaunch =', firstLaunch, ' hasSave =', saveGame.hasSave());

  /**
   * Both "Let's go" (start fresh) and "Continue" route through here.
   * `mode` is 'new' or 'continue'. The HUDs read live from the
   * services we already constructed, so resetting state on 'new'
   * means clearing those services in place — no scene rebuild
   * required (the services are wired into all the HUDs).
   */
  const beginGame = (mode) => {
    if (mode === 'new') {
      saveGame.clear();
      // Clear in-memory state too. Each system was hydrated from the
      // (now-cleared) save at construction time.
      gemBag.total = 0;
      gemBag.byGem.clear();
      // Inform listeners (gem HUD) so the counter resets visually.
      for (const fn of gemBag._listeners) {
        fn({ gemKey: null, delta: 0, previousTotal: 0, newTotal: 0 });
      }
      protagonist._collected.clear();
      for (const fn of protagonist._collectListeners) fn(null, protagonist.inventory());
      for (const entry of quests.state.values()) {
        entry.progress = 0;
        entry.completed = false;
        entry.claimed = false;
        // Per-quest scratchpads (seen Sets, compound-state objects)
        // are stashed on the def itself. Wipe them so a fresh run
        // earns each quest cleanly without ghost progress.
        if (entry.def._seen) entry.def._seen.clear();
        if (entry.def._state) entry.def._state = null;
      }
      quests._sceneCount = 0;
      for (const fn of quests._listeners) fn({ updated: true, newlyCompleted: [] });
      resetWorldCollected();
      seenQuizzes.clear();
      // Reset buddy roster back to a fresh starter Conaloo.
      buddyTeam.reset();
    }

    const showTutorial = mode === 'new' && firstLaunch;
    try { localStorage.setItem(FIRST_LAUNCH_KEY, '1'); } catch { /* ignore */ }

    if (showTutorial) {
      game.scene.stop('scene:title');
      game.scene.start('scene:tutorial', {
        audio,
        onContinue: () => {
          game.scene.stop('scene:tutorial');
          router.goToScene(catalog.hubSlug);
        }
      });
    } else {
      // Use the router so the destination has a normal scene fade-in.
      router.goToScene(catalog.hubSlug);
    }
  };

  game.scene.start('scene:title', {
    audio,
    hasSave: saveGame.hasSave(),
    onStart:    () => beginGame('new'),
    onContinue: () => beginGame('continue')
  });
  game.scene.stop('boot');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}

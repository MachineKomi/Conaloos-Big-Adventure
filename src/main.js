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
import { GameScene } from './scenes/GameScene.js';
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
  const protagonist = new Protagonist();
  const gemBag = new GemBag();
  const quests = new QuestManager();
  // Session-wide set so a quiz isn't asked twice — even after a scene
  // transition. Cleared on page reload (no localStorage).
  const seenQuizzes = new Set();

  // Wire game-system events into the quest tracker.
  gemBag.onChange(({ delta }) => {
    quests.report({ type: 'gem-collected', value: delta });
  });
  protagonist.onCollectChange((thingKey) => {
    quests.report({ type: 'thing-collected', key: thingKey });
  });

  // Expose for dev-time debugging only.
  if (import.meta.env?.DEV) {
    window.__game = game;
    window.__router = router;
    window.__protagonist = protagonist;
    window.__gemBag = gemBag;
    window.__quests = quests;
  }

  // Phaser calls scene.init(data) when it starts a scene, so pass
  // onReady through the start-data hand-off (init() would be clobbered).
  game.scene.add('boot', BootScene, true, {
    onReady: (loader) => onAssetsReady(game, loader, audio, router, protagonist, gemBag, seenQuizzes, quests)
  });
  console.log('[main] game created, boot scene queued');
}

function onAssetsReady(game, loader, audio, router, protagonist, gemBag, seenQuizzes, quests) {
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
    const scene = new GameScene(slug, def, { audio, router, loader, protagonist, gemBag, seenQuizzes, quests });
    game.scene.add(`scene:${slug}`, scene, false);
  }
  game.scene.add('scene:title', new TitleScene(), false);
  game.scene.add('scene:tutorial', new TutorialScene(), false);

  // HUDs go on TOP — added last, so they render last.
  const ui = new GlobalUIScene();
  ui.init({ router });
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
  console.log('[main] firstLaunch =', firstLaunch);

  game.scene.start('scene:title', {
    audio,
    onStart: () => {
      console.log('[main] onStart fired, firstLaunch=', firstLaunch);
      try { localStorage.setItem(FIRST_LAUNCH_KEY, '1'); } catch { /* ignore */ }

      // Whichever next scene we start, we need the title to stop. Fade
      // the title's camera, and only after fade-out do the swap.
      const titleScene = game.scene.getScene('scene:title');
      const after = () => {
        console.log('[main] fading complete, switching to next scene');
        if (firstLaunch) {
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
          // The router checks for an active scene with key starting "scene:"
          // — title qualifies — and handles the fade-out + stop itself.
          router.goToScene(catalog.hubSlug);
        }
      };
      // Title hand-off: skip the camera fade here because router/start will
      // handle their own. Just go.
      after();
    }
  });
  game.scene.stop('boot');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}

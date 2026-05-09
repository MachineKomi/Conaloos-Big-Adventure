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
import { Protagonist } from './systems/Protagonist.js';
import { AudioManager } from './systems/AudioManager.js';
import { SceneRouter } from './systems/SceneRouter.js';
import { buildSceneCatalog } from './content/sceneCatalog.js';

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 800;
const FIRST_LAUNCH_KEY = 'conaloo.firstLaunchSeen.v1';

function makeGame() {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'app',
    backgroundColor: '#fff8e7',
    scale: {
      mode: Phaser.Scale.RESIZE,
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

  // Expose for dev-time debugging only.
  if (import.meta.env?.DEV) {
    window.__game = game;
    window.__router = router;
    window.__protagonist = protagonist;
    window.__gemBag = gemBag;
  }

  // Phaser calls scene.init(data) when it starts a scene, so pass
  // onReady through the start-data hand-off (init() would be clobbered).
  game.scene.add('boot', BootScene, true, {
    onReady: (loader) => onAssetsReady(game, loader, audio, router, protagonist, gemBag)
  });
  console.log('[main] game created, boot scene queued');
}

function onAssetsReady(game, loader, audio, router, protagonist, gemBag) {
  // GlobalUI + Inventory + GemHUD run above gameplay scenes.
  const ui = new GlobalUIScene();
  ui.init({ router });
  game.scene.add('global:ui', ui, true);

  const inv = new InventoryScene();
  inv.init({ protagonist });
  game.scene.add('global:inventory', inv, true);

  const gemHud = new GemHUDScene();
  gemHud.init({ gemBag });
  game.scene.add('global:gemhud', gemHud, true);

  if (!loader.hasAnyBackground) {
    game.scene.add('scene:waiting', new WaitingScene(), true);
    game.scene.stop('boot');
    return;
  }

  const catalog = buildSceneCatalog(loader);
  router.setHubSlug(catalog.hubSlug);

  // Register every scene up front; we navigate via scene.start() with data.
  for (const slug of Object.keys(catalog.scenes)) {
    const def = catalog.scenes[slug];
    const scene = new GameScene(slug, def, { audio, router, loader, protagonist, gemBag });
    game.scene.add(`scene:${slug}`, scene, false);
  }

  // Title + tutorial — title runs first; first launch routes through tutorial.
  game.scene.add('scene:title', new TitleScene(), false);
  game.scene.add('scene:tutorial', new TutorialScene(), false);

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

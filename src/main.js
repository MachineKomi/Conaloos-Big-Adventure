/**
 * Game bootstrap.
 *
 * Flow:
 *   1. Create the Phaser game with the boot scene.
 *   2. After boot finishes loading, inspect the manifest:
 *      - if no backgrounds → start the WaitingScene placeholder.
 *      - else → build a scene catalog (designed scenes + auto-generated
 *        fallback scenes for any background without a bespoke definition),
 *        register them all with Phaser, and start the hub.
 *   3. Run the GlobalUI scene in parallel for persistent corner controls.
 */

import Phaser from 'phaser';

import { BootScene } from './scenes/BootScene.js';
import { WaitingScene } from './scenes/WaitingScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GlobalUIScene } from './systems/GlobalUI.js';
import { AudioManager } from './systems/AudioManager.js';
import { SceneRouter } from './systems/SceneRouter.js';
import { buildSceneCatalog } from './content/sceneCatalog.js';

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 800;

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

  // Expose for dev-time debugging only.
  if (import.meta.env?.DEV) {
    window.__game = game;
    window.__router = router;
  }

  // Phaser calls scene.init(data) when it starts a scene, so we have to pass
  // onReady through the start-data hand-off instead of mutating BootScene
  // directly (which Phaser would clobber on init).
  game.scene.add('boot', BootScene, true, {
    onReady: (loader) => onAssetsReady(game, loader, audio, router)
  });
  console.log('[main] game created, boot scene queued');
}

function onAssetsReady(game, loader, audio, router) {
  // GlobalUI runs above gameplay scenes.
  const ui = new GlobalUIScene();
  ui.init({ router });
  game.scene.add('global:ui', ui, true);

  if (!loader.hasAnyBackground) {
    game.scene.add('scene:waiting', new WaitingScene(), true);
    game.scene.stop('boot');
    return;
  }

  const catalog = buildSceneCatalog(loader);
  for (const slug of Object.keys(catalog.scenes)) {
    const def = catalog.scenes[slug];
    const scene = new GameScene(slug, def, { audio, router, loader });
    game.scene.add(`scene:${slug}`, scene, false);
  }

  router.setHubSlug(catalog.hubSlug);
  router.goToScene(catalog.hubSlug);
  game.scene.stop('boot');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}

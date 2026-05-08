/**
 * SceneRouter — central scene navigator.
 *
 * Wraps Phaser's scene manager so callers can ask for a scene by slug
 * (matching a `bg_*` background or a special name like 'hub'/'wait')
 * and not worry about Phaser scene-key bookkeeping.
 *
 * Maintains a soft history stack so a "back" portal could be added later;
 * not used in MVP but free to keep around.
 */

import { Accessibility } from './Accessibility.js';

const FADE_MS = 600;
const HUB_SLUG_FALLBACK = 'hub';

export class SceneRouter {
  constructor(game, { hubSlug } = {}) {
    this.game = game;
    this.history = [];
    this.hubSlug = hubSlug || HUB_SLUG_FALLBACK;
  }

  setHubSlug(slug) { this.hubSlug = slug; }

  current() { return this.history[this.history.length - 1] || null; }

  /**
   * Navigate to a scene. The target scene must already be registered
   * with Phaser's scene manager under key `scene:${slug}`.
   */
  goToScene(slug) {
    const fromKey = this._currentSceneKey();
    const toKey = `scene:${slug}`;
    if (!this.game.scene.getScene(toKey)) {
      // eslint-disable-next-line no-console
      console.warn(`[router] no scene registered for "${slug}"`);
      return;
    }

    this.history.push(slug);

    const reduce = Accessibility.reducedMotion;
    if (!fromKey || reduce) {
      if (fromKey) this.game.scene.stop(fromKey);
      this.game.scene.start(toKey);
      return;
    }

    // Fade through white.
    const fromScene = this.game.scene.getScene(fromKey);
    if (fromScene && fromScene.cameras?.main) {
      fromScene.cameras.main.fadeOut(FADE_MS / 2, 255, 248, 231);
      fromScene.cameras.main.once('camerafadeoutcomplete', () => {
        this.game.scene.stop(fromKey);
        this.game.scene.start(toKey);
        const toScene = this.game.scene.getScene(toKey);
        toScene?.cameras?.main?.fadeIn(FADE_MS / 2, 255, 248, 231);
      });
    } else {
      this.game.scene.start(toKey);
    }
  }

  goHome() {
    if (this.hubSlug) this.goToScene(this.hubSlug);
  }

  _currentSceneKey() {
    const active = this.game.scene
      .getScenes(true)
      .find((s) => s.scene.key.startsWith('scene:'));
    return active ? active.scene.key : null;
  }
}

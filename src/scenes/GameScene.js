/**
 * GameScene — generic scene driver.
 *
 * Each entry in /src/content/scenes.js is rendered through a fresh instance
 * of GameScene. We register one Phaser scene per slug at game-build time
 * with a per-slug key of `scene:${slug}`.
 *
 * Responsibilities:
 *   - Stretch the background to fit the viewport (cover).
 *   - Place characters & things at normalized coordinates.
 *   - Light idle motion (bob, sway) unless reducedMotion.
 *   - Drive HotspotManager + DialogueBox + AudioManager.
 *   - Apply remix effects from rare responses (e.g. parent a thing to a character).
 */

import Phaser from 'phaser';
import { HotspotManager } from '../systems/HotspotManager.js';
import { DialogueBox } from '../systems/DialogueBox.js';
import { Accessibility } from '../systems/Accessibility.js';

const IDLE_BOB_AMPL = 8;
const IDLE_BOB_MS = 1900;
const IDLE_SWAY_DEG = 2.5;
const IDLE_SWAY_MS = 2400;

export class GameScene extends Phaser.Scene {
  /**
   * @param {string} slug
   * @param {object} def         scene definition from scenes.js
   * @param {object} services    { audio, router, loader }
   */
  constructor(slug, def, services) {
    super({ key: `scene:${slug}` });
    this.slug = slug;
    this.def = def;
    this.services = services;
    this.spritesByKey = new Map();
  }

  create() {
    const { width, height } = this.scale;

    this._renderBackground(width, height);
    this._renderThings(width, height);
    this._renderCharacters(width, height);

    this.dialogue = new DialogueBox(this);

    this.hotspots = new HotspotManager(this, {
      audio: this.services.audio,
      dialogue: this.dialogue,
      router: this.services.router,
      onResponse: (h, response) => this._applyRemix(response)
    });
    this.hotspots.createAll(this.def.hotspots || [], { w: width, h: height });

    if (this.def.music) {
      this.services.audio.playMusic(this.def.music, this);
    }

    // Allow a tap on empty space to dismiss an open dialogue early.
    this.input.on('pointerup', (pointer, currentlyOver) => {
      if (currentlyOver.length === 0 && this.dialogue.isVisible()) {
        this.dialogue.dismiss();
      }
    });

    this.scale.on('resize', () => {
      // Crude: full re-create on resize. Scenes are cheap.
      this.scene.restart();
    });

    this.events.on('shutdown', () => {
      this.dialogue?.destroy();
      this.hotspots?.destroy();
      this.spritesByKey.clear();
    });
  }

  _renderBackground(w, h) {
    const bgKey = this.def.background;
    if (!bgKey || !this.textures.exists(bgKey)) {
      this.cameras.main.setBackgroundColor('#fff8e7');
      return;
    }
    const img = this.add.image(w / 2, h / 2, bgKey).setOrigin(0.5);
    const tex = this.textures.get(bgKey).getSourceImage();
    const sx = w / tex.width;
    const sy = h / tex.height;
    const s = Math.max(sx, sy);
    img.setScale(s);
  }

  _renderThings(w, h) {
    for (const t of this.def.things || []) {
      if (!this.textures.exists(t.sprite)) continue;
      const img = this.add
        .image((t.x ?? 0.5) * w, (t.y ?? 0.5) * h, t.sprite)
        .setOrigin(0.5);
      applyDisplaySize(img, t, h, 0.22);
      this.spritesByKey.set(t.sprite, img);
    }
  }

  _renderCharacters(w, h) {
    for (const c of this.def.characters || []) {
      if (!this.textures.exists(c.sprite)) continue;
      const img = this.add
        .image((c.x ?? 0.5) * w, (c.y ?? 0.5) * h, c.sprite)
        .setOrigin(0.5, 1);
      applyDisplaySize(img, c, h, 0.45);
      this.spritesByKey.set(c.sprite, img);

      if (Accessibility.reducedMotion) continue;

      if (c.idle === 'bob') {
        this.tweens.add({
          targets: img,
          y: img.y - IDLE_BOB_AMPL,
          duration: IDLE_BOB_MS,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      } else if (c.idle === 'sway') {
        this.tweens.add({
          targets: img,
          angle: { from: -IDLE_SWAY_DEG, to: IDLE_SWAY_DEG },
          duration: IDLE_SWAY_MS,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    }
  }

  /**
   * Apply a remix from a rare response.
   * Supported recipe: { add_sprite, on_top_of, scale, as }.
   */
  _applyRemix(response) {
    const remix = response?.remix;
    if (!remix || !remix.add_sprite) return;
    if (!this.textures.exists(remix.add_sprite)) return;

    const target = this.spritesByKey.get(remix.on_top_of);
    if (!target) return;

    const overlay = this.add.image(target.x, target.y, remix.add_sprite).setOrigin(0.5, 1);
    overlay.setScale(remix.scale ?? 0.4);
    // Stack above the target's "head" — origin is bottom-centre, so subtract height.
    overlay.y = target.y - target.displayHeight + 4;
    overlay.setDepth((target.depth ?? 0) + 1);

    // Soft pop-in.
    if (!Accessibility.reducedMotion) {
      overlay.setScale(0.05);
      this.tweens.add({
        targets: overlay,
        scale: remix.scale ?? 0.4,
        duration: 300,
        ease: 'Back.easeOut'
      });
    }
  }
}

/**
 * Size a sprite either by explicit `scale` (multiplier) or by `heightFrac`
 * (target display height as a fraction of the scene height — preferred,
 * since source PNGs vary wildly in resolution).
 */
function applyDisplaySize(img, def, sceneH, defaultHeightFrac) {
  if (typeof def.scale === 'number') {
    img.setScale(def.scale);
    return;
  }
  const frac = typeof def.heightFrac === 'number' ? def.heightFrac : defaultHeightFrac;
  const targetH = sceneH * frac;
  const sourceH = img.height || 1;
  img.setScale(targetH / sourceH);
}

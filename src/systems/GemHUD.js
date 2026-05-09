/**
 * GemHUDScene — top-CENTRE panel showing the player's running gem total
 * with an animated equation reveal on each pickup:
 *
 *   "5"  →  "5 + 3"  →  "5 + 3 = 8"  →  "8"
 *
 * Each step is added to the panel one at a time over ~1.6s so a child
 * watching can see the addition happen, character by character. The
 * gems flying in from gameplay scenes target this panel's icon area.
 *
 * Always visible (per Dad's request) so the running total is part of
 * the constant world state.
 */

import Phaser from 'phaser';

const PANEL_W = 280;
const PANEL_H = 64;
const PANEL_TOP = 12;
const PANEL_RADIUS = 22;
const PANEL_BG = 0xfff8e7;
const PANEL_BG_ALPHA = 0.94;
const PANEL_STROKE = 0x4a3a1f;
const PANEL_STROKE_W = 4;

const ICON_GEM_KEY = 'gem_5';
const TEXT_COLOUR = '#4a3a1f';
const REVEAL_STEP_MS = 460;

export class GemHUDScene extends Phaser.Scene {
  constructor() {
    super({ key: 'global:gemhud', active: false });
  }

  init({ gemBag } = {}) {
    this.gemBag = gemBag || this.gemBag;
  }

  create() {
    this._unsubscribe = this.gemBag.onChange((evt) => this._onChange(evt));
    this._build();
    this.scale.on('resize', () => this._reposition());
    this.events.on('shutdown', () => this._unsubscribe?.());
  }

  _build() {
    this._panel = this.add.graphics();
    this._panel.setDepth(8000);

    const iconKey = this.textures.exists(ICON_GEM_KEY) ? ICON_GEM_KEY : null;
    if (iconKey) {
      this._icon = this.add.image(0, 0, iconKey).setOrigin(0.5).setDepth(8001);
    }

    this._totalText = this.add.text(0, 0, `${this.gemBag.total}`, {
      fontFamily: '"Fredoka", "Atkinson Hyperlegible", system-ui, sans-serif',
      fontSize: '32px',
      color: TEXT_COLOUR
    }).setOrigin(0, 0.5).setDepth(8001);

    this._reposition();
  }

  _reposition() {
    const { width } = this.scale;
    const cx = width / 2;
    const x = cx - PANEL_W / 2;
    const y = PANEL_TOP;

    this._panel.clear();
    this._panel.fillStyle(PANEL_BG, PANEL_BG_ALPHA);
    this._panel.lineStyle(PANEL_STROKE_W, PANEL_STROKE, 1);
    this._panel.fillRoundedRect(x, y, PANEL_W, PANEL_H, PANEL_RADIUS);
    this._panel.strokeRoundedRect(x, y, PANEL_W, PANEL_H, PANEL_RADIUS);

    if (this._icon) {
      this._icon.setPosition(x + 36, y + PANEL_H / 2);
      const tex = this.textures.get(ICON_GEM_KEY).getSourceImage();
      this._icon.setScale((PANEL_H - 16) / tex.height);
    }
    this._totalText.setPosition(x + 70, y + PANEL_H / 2);
  }

  _onChange({ delta, previousTotal, newTotal }) {
    if (!this._totalText) return;
    if (this._revealRunning) {
      // Skip animation; just snap to new total.
      this._totalText.setText(`${newTotal}`);
      return;
    }
    this._revealRunning = true;

    // Hide running total during reveal; we'll re-show at the end.
    this._totalText.setText('');

    const equationParts = [
      `${previousTotal}`,
      ` + ${delta}`,
      ` = ${newTotal}`
    ];

    const showStep = (i) => {
      if (i >= equationParts.length) {
        // Final: replace with just the new total, with a celebratory pop.
        this.time.delayedCall(REVEAL_STEP_MS, () => {
          this._totalText.setText(`${newTotal}`);
          this.tweens.add({
            targets: this._totalText,
            scale: { from: 1.4, to: 1.0 },
            duration: 280,
            ease: 'Back.easeOut',
            onComplete: () => { this._revealRunning = false; }
          });
        });
        return;
      }
      const partial = equationParts.slice(0, i + 1).join('');
      this._totalText.setText(partial);
      // Tiny scale pop on each new chunk.
      this.tweens.add({
        targets: this._totalText,
        scale: { from: 1.15, to: 1.0 },
        duration: 200,
        ease: 'Sine.easeOut'
      });
      this.time.delayedCall(REVEAL_STEP_MS, () => showStep(i + 1));
    };

    showStep(0);
  }
}

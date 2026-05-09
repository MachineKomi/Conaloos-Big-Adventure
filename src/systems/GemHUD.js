/**
 * GemHUDScene — top-left panel showing the player's running gem total.
 *
 * Subscribes to GemBag change events. On each collection, animates a
 * little math reveal: "+3 → 12" floats up next to the counter, the
 * counter ticks up to the new total, then the math fades.
 *
 * The panel sits above gameplay scenes (depth-wise) and below the
 * GlobalUI corner buttons (we render inventory in another scene which
 * sits at the bottom).
 */

import Phaser from 'phaser';

const PANEL_X = 16;
const PANEL_Y = 16;
const PANEL_W = 168;
const PANEL_H = 56;
const PANEL_RADIUS = 18;
const PANEL_BG = 0xfff8e7;
const PANEL_BG_ALPHA = 0.92;
const PANEL_STROKE = 0x4a3a1f;
const PANEL_STROKE_W = 3;

const ICON_GEM_KEY = 'gem_5'; // fallback icon (any gem will do)
const TEXT_COLOUR = '#4a3a1f';

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
    this.events.on('shutdown', () => this._unsubscribe?.());
  }

  _build() {
    this._panel = this.add.graphics();
    this._panel.fillStyle(PANEL_BG, PANEL_BG_ALPHA);
    this._panel.lineStyle(PANEL_STROKE_W, PANEL_STROKE, 1);
    this._panel.fillRoundedRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, PANEL_RADIUS);
    this._panel.strokeRoundedRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, PANEL_RADIUS);
    this._panel.setDepth(8000);

    // Gem icon — a small, crisp gem sprite if available.
    const iconKey = this.textures.exists(ICON_GEM_KEY) ? ICON_GEM_KEY : null;
    if (iconKey) {
      this._icon = this.add.image(PANEL_X + 30, PANEL_Y + PANEL_H / 2, iconKey)
        .setOrigin(0.5)
        .setDepth(8001);
      const tex = this.textures.get(iconKey).getSourceImage();
      const targetH = PANEL_H - 16;
      this._icon.setScale(targetH / tex.height);
    }

    this._totalText = this.add.text(
      PANEL_X + 60,
      PANEL_Y + PANEL_H / 2,
      `${this.gemBag.total}`,
      {
        fontFamily: '"Fredoka", "Atkinson Hyperlegible", system-ui, sans-serif',
        fontSize: '28px',
        color: TEXT_COLOUR
      }
    ).setOrigin(0, 0.5).setDepth(8001);
  }

  _onChange({ delta, previousTotal, newTotal }) {
    if (!this._totalText) return;

    // Pop the math reveal: "+3 → 14"
    const popX = PANEL_X + PANEL_W + 12;
    const popY = PANEL_Y + PANEL_H / 2;
    const pop = this.add.text(popX, popY, `+${delta} → ${newTotal}`, {
      fontFamily: '"Fredoka", "Atkinson Hyperlegible", system-ui, sans-serif',
      fontSize: '22px',
      color: '#c98c2e',
      stroke: '#ffffff',
      strokeThickness: 4
    }).setOrigin(0, 0.5).setDepth(8002);

    this.tweens.add({
      targets: pop,
      x: popX + 30,
      alpha: { from: 1, to: 0 },
      duration: 1300,
      ease: 'Sine.easeOut',
      onComplete: () => pop.destroy()
    });

    // Counter tick: count up from previousTotal to newTotal.
    const start = previousTotal;
    const end = newTotal;
    const duration = 500;
    const startedAt = this.time.now;
    const tickFn = () => {
      const elapsed = this.time.now - startedAt;
      const t = Math.min(1, elapsed / duration);
      const value = Math.round(start + (end - start) * easeOut(t));
      this._totalText.setText(`${value}`);
      if (t < 1) {
        this.time.delayedCall(16, tickFn);
      } else {
        this._totalText.setText(`${end}`);
        // Quick scale pop on the total.
        this.tweens.add({
          targets: this._totalText,
          scale: { from: 1.2, to: 1.0 },
          duration: 220,
          ease: 'Back.easeOut'
        });
      }
    };
    tickFn();
  }
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

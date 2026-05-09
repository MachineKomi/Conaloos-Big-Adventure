/**
 * GemHUDScene — top-CENTRE counter showing the player's running total.
 *
 * - Always visible (the panel is added last so nothing renders over it).
 * - Icon shows the LAST gem the player picked up (so kids see a small
 *   variety, not always gem_5).
 * - Panel width auto-fits the number of digits in the total.
 * - On each pickup, an animated equation reveal:
 *     "5"  →  "5 + 3"  →  "5 + 3 = 8"  →  "8"
 *
 * Gems flying in from gameplay scenes target this panel's icon.
 */

import Phaser from 'phaser';

const PANEL_TOP = 12;
const PANEL_H = 80;          // Bigger so the bigger icon fits.
const PANEL_RADIUS = 24;
const PANEL_PADDING_X = 18;
const PANEL_BG = 0xfff8e7;
const PANEL_BG_ALPHA = 0.94;
const PANEL_STROKE = 0x4a3a1f;
const PANEL_STROKE_W = 4;

const ICON_SIZE = 56;        // ~50% bigger than before (36 → 56).
const ICON_GAP = 12;
const TEXT_FONT_PX = 36;
const TEXT_COLOUR = '#4a3a1f';
const REVEAL_STEP_MS = 460;

export class GemHUDScene extends Phaser.Scene {
  constructor() {
    super({ key: 'global:gemhud', active: false });
    this._lastGemKey = null;
    this._displayingText = '';
  }

  init({ gemBag } = {}) {
    this.gemBag = gemBag || this.gemBag;
  }

  create() {
    this._unsubscribe = this.gemBag.onChange((evt) => this._onChange(evt));
    this._build();
    this.scene.bringToTop();
    this.scale.on('resize', () => this._reposition());
    this.events.on('shutdown', () => this._unsubscribe?.());
  }

  _build() {
    this._panel = this.add.graphics().setDepth(8000);
    this._icon = null;       // Created/updated lazily once we have a key.
    this._totalText = this.add.text(0, 0, `${this.gemBag.total}`, {
      fontFamily: '"Fredoka", "Atkinson Hyperlegible", system-ui, sans-serif',
      fontSize: `${TEXT_FONT_PX}px`,
      color: TEXT_COLOUR
    }).setOrigin(0, 0.5).setDepth(8002);
    this._displayingText = `${this.gemBag.total}`;
    // Default icon to gem_5 just so something's there before any pickup.
    this._setIconKey('gem_5');
    this._reposition();
  }

  /** Get the gem-icon's screen position (used as the fly-target). */
  getIconPosition() {
    if (!this._icon) return { x: this.scale.width / 2, y: PANEL_TOP + PANEL_H / 2 };
    return { x: this._icon.x, y: this._icon.y };
  }

  _setIconKey(key) {
    if (!key || !this.textures.exists(key)) return;
    this._lastGemKey = key;
    if (!this._icon) {
      this._icon = this.add.image(0, 0, key)
        .setOrigin(0.5)
        .setDepth(8001);
    } else {
      this._icon.setTexture(key);
    }
    const tex = this.textures.get(key).getSourceImage();
    this._icon.setScale(ICON_SIZE / tex.height);
  }

  _reposition() {
    const { width } = this.scale;

    // Width fits: padding + icon + gap + text + padding.
    const textW = this._totalText.width || 32;
    const panelW = PANEL_PADDING_X + ICON_SIZE + ICON_GAP + textW + PANEL_PADDING_X;
    const x = (width - panelW) / 2;
    const y = PANEL_TOP;

    this._panel.clear();
    this._panel.fillStyle(PANEL_BG, PANEL_BG_ALPHA);
    this._panel.lineStyle(PANEL_STROKE_W, PANEL_STROKE, 1);
    this._panel.fillRoundedRect(x, y, panelW, PANEL_H, PANEL_RADIUS);
    this._panel.strokeRoundedRect(x, y, panelW, PANEL_H, PANEL_RADIUS);

    if (this._icon) {
      this._icon.setPosition(x + PANEL_PADDING_X + ICON_SIZE / 2, y + PANEL_H / 2);
    }
    this._totalText.setPosition(x + PANEL_PADDING_X + ICON_SIZE + ICON_GAP, y + PANEL_H / 2);
  }

  _setText(s) {
    this._displayingText = s;
    this._totalText.setText(s);
    this._reposition();
  }

  _onChange({ gemKey, delta, previousTotal, newTotal }) {
    if (!this._totalText) return;
    if (gemKey) this._setIconKey(gemKey);

    if (this._revealRunning) {
      this._setText(`${newTotal}`);
      return;
    }
    this._revealRunning = true;
    this._setText('');

    const equationParts = [
      `${previousTotal}`,
      ` + ${delta}`,
      ` = ${newTotal}`
    ];

    const showStep = (i) => {
      if (i >= equationParts.length) {
        this.time.delayedCall(REVEAL_STEP_MS, () => {
          this._setText(`${newTotal}`);
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
      this._setText(partial);
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

/**
 * GlobalUI — persistent corner controls (mute, reduced motion, home, text size).
 *
 * Lives on its own Phaser scene that runs above the active scene so it
 * stays visible during fades and transitions. Each control is a clickable
 * label drawn in Phaser; we deliberately avoid HTML overlay so it scales
 * with the canvas.
 */

import Phaser from 'phaser';
import { Accessibility } from './Accessibility.js';

const UI_DEPTH = 5000;
const PADDING = 18;
const BUTTON_SIZE = 56;
const BUTTON_RADIUS = 16;
const BUTTON_BG = 0xfff8e7;
const BUTTON_BG_ALPHA = 0.85;
const BUTTON_STROKE = 0x4a3a1f;
const BUTTON_STROKE_WIDTH = 3;
const ICON_COLOUR = '#4a3a1f';

export class GlobalUIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'global:ui', active: false });
    this.router = null;
  }

  init({ router } = {}) {
    this.router = router || this.router;
  }

  create() {
    this.buttons = [];
    this._build();
    this.scale.on('resize', () => this._reposition());
    Accessibility.on(() => this._refreshIcons());
  }

  _build() {
    // Top-right cluster: home, mute, reduce-motion, text-size.
    this._home = this._makeButton('home', () => this.router?.goHome?.());
    this._mute = this._makeButton(this._muteIcon(), () => Accessibility.toggleMuted());
    this._motion = this._makeButton(this._motionIcon(), () => {
      const cur = Accessibility.reducedMotion;
      Accessibility.setReducedMotion(!cur);
    });
    this._text = this._makeButton(`A${Accessibility.textSize}`, () => Accessibility.cycleTextSize());

    this.buttons = [this._home, this._mute, this._motion, this._text];
    this._reposition();
  }

  _muteIcon() { return Accessibility.muted ? 'mute' : 'sound'; }
  _motionIcon() { return Accessibility.reducedMotion ? 'still' : 'wind'; }

  _refreshIcons() {
    this._setLabel(this._mute, this._muteIcon());
    this._setLabel(this._motion, this._motionIcon());
    this._setLabel(this._text, `A${Accessibility.textSize}`);
  }

  _setLabel(btn, label) {
    btn.label.setText(label);
  }

  /**
   * Build a UI button. Uses a Zone for hit detection (independent from
   * the visual graphics + label) so clicks register exactly on the
   * visible square, no offset weirdness.
   */
  _makeButton(labelText, onClick) {
    const bg = this.add.graphics();
    const label = this.add.text(0, 0, labelText, {
      fontFamily: '"Fredoka", "Atkinson Hyperlegible", system-ui, sans-serif',
      fontSize: '16px',
      color: ICON_COLOUR,
      align: 'center'
    }).setOrigin(0.5);

    const zone = this.add.zone(0, 0, BUTTON_SIZE, BUTTON_SIZE).setOrigin(0, 0);
    zone.setInteractive({ useHandCursor: true });

    bg.setDepth(UI_DEPTH);
    label.setDepth(UI_DEPTH + 1);
    zone.setDepth(UI_DEPTH + 2);

    const btn = { bg, label, zone, x: 0, y: 0 };
    btn.setPosition = (x, y) => {
      btn.x = x;
      btn.y = y;
      bg.clear();
      bg.fillStyle(BUTTON_BG, BUTTON_BG_ALPHA);
      bg.lineStyle(BUTTON_STROKE_WIDTH, BUTTON_STROKE, 1);
      bg.fillRoundedRect(x, y, BUTTON_SIZE, BUTTON_SIZE, BUTTON_RADIUS);
      bg.strokeRoundedRect(x, y, BUTTON_SIZE, BUTTON_SIZE, BUTTON_RADIUS);
      label.setPosition(x + BUTTON_SIZE / 2, y + BUTTON_SIZE / 2);
      zone.setPosition(x, y);
    };

    zone.on('pointerover', () => label.setScale(1.10));
    zone.on('pointerout',  () => label.setScale(1.00));
    zone.on('pointerup', () => {
      this.tweens.killTweensOf(label);
      this.tweens.add({ targets: label, scale: 0.85, duration: 80, yoyo: true });
      onClick();
    });

    return btn;
  }

  _reposition() {
    const { width } = this.scale;
    let x = width - PADDING - BUTTON_SIZE;
    const y = PADDING;
    // right-to-left so home is closest to the corner
    for (const btn of [this._text, this._motion, this._mute, this._home]) {
      btn.setPosition(x, y);
      x -= BUTTON_SIZE + 10;
    }
  }
}

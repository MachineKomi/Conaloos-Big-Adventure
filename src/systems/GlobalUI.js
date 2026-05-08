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

  _makeButton(labelText, onClick) {
    const bg = this.add.graphics();
    bg.fillStyle(BUTTON_BG, BUTTON_BG_ALPHA);
    bg.lineStyle(BUTTON_STROKE_WIDTH, BUTTON_STROKE, 1);
    bg.fillRoundedRect(0, 0, BUTTON_SIZE, BUTTON_SIZE, BUTTON_RADIUS);
    bg.strokeRoundedRect(0, 0, BUTTON_SIZE, BUTTON_SIZE, BUTTON_RADIUS);

    const label = this.add.text(BUTTON_SIZE / 2, BUTTON_SIZE / 2, labelText, {
      fontFamily: '"Fredoka", "Atkinson Hyperlegible", system-ui, sans-serif',
      fontSize: '16px',
      color: ICON_COLOUR,
      align: 'center'
    }).setOrigin(0.5);

    const container = this.add.container(0, 0, [bg, label]);
    container.setSize(BUTTON_SIZE, BUTTON_SIZE);
    container.setDepth(UI_DEPTH);
    container.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, BUTTON_SIZE, BUTTON_SIZE),
      Phaser.Geom.Rectangle.Contains
    );
    container.on('pointerup', onClick);
    container.label = label;
    container.bg = bg;
    return container;
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

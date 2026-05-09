/**
 * GlobalUIScene — corner controls.
 *
 * v1.3: collapsed into a single "≡" burger button in the top-right.
 * Tap the burger to expand a vertical settings panel with three large,
 * clearly-labelled buttons: HOME, SOUND (toggle), TEXT SIZE (cycler).
 * The motion toggle has been REMOVED — motion is always on now;
 * disabling it broke the protagonist mechanic and confused the
 * 4-year-old.
 */

import Phaser from 'phaser';
import { Accessibility } from './Accessibility.js';

const UI_DEPTH = 9500;
const PADDING = 16;

const BURGER_SIZE = 64;
const BURGER_RADIUS = 18;

const ITEM_W = 180;
const ITEM_H = 64;
const ITEM_RADIUS = 16;
const ITEM_GAP = 10;

const BG_COLOUR = 0xfff8e7;
const BG_ALPHA = 0.94;
const STROKE_COLOUR = 0x4a3a1f;
const STROKE_WIDTH = 4;
const TEXT_COLOUR = '#4a3a1f';
const TEXT_FONT_PX = 22;

export class GlobalUIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'global:ui', active: false });
    this.router = null;
    this.expanded = false;
    this._items = [];
  }

  init({ router } = {}) {
    this.router = router || this.router;
  }

  create() {
    this._buildBurger();
    this.scale.on('resize', () => this._reposition());
    Accessibility.on(() => this._refreshLabels());
    this.scene.bringToTop();
  }

  _buildBurger() {
    const x = this.scale.width - PADDING - BURGER_SIZE;
    const y = PADDING;

    const bg = this.add.graphics().setDepth(UI_DEPTH);
    bg.fillStyle(BG_COLOUR, BG_ALPHA);
    bg.lineStyle(STROKE_WIDTH, STROKE_COLOUR, 1);
    bg.fillRoundedRect(x, y, BURGER_SIZE, BURGER_SIZE, BURGER_RADIUS);
    bg.strokeRoundedRect(x, y, BURGER_SIZE, BURGER_SIZE, BURGER_RADIUS);

    // Three lines for the burger icon.
    const icon = this.add.graphics().setDepth(UI_DEPTH + 1);
    icon.lineStyle(4, STROKE_COLOUR, 1);
    const cx = x + BURGER_SIZE / 2;
    const cy = y + BURGER_SIZE / 2;
    icon.lineBetween(cx - 14, cy - 10, cx + 14, cy - 10);
    icon.lineBetween(cx - 14, cy,      cx + 14, cy);
    icon.lineBetween(cx - 14, cy + 10, cx + 14, cy + 10);

    const zone = this.add.zone(x, y, BURGER_SIZE, BURGER_SIZE).setOrigin(0, 0);
    zone.setInteractive({ useHandCursor: true });
    zone.setDepth(UI_DEPTH + 2);
    zone.on('pointerover', () => this.tweens.add({ targets: bg, alpha: 1, duration: 100 }));
    zone.on('pointerout',  () => this.tweens.add({ targets: bg, alpha: BG_ALPHA, duration: 100 }));
    zone.on('pointerup', () => {
      this.expanded = !this.expanded;
      this._renderItems();
    });

    this._burger = { bg, icon, zone, x, y };
  }

  _reposition() {
    if (this._burger) {
      const x = this.scale.width - PADDING - BURGER_SIZE;
      const y = PADDING;
      this._burger.x = x; this._burger.y = y;
      this._burger.bg.clear();
      this._burger.bg.fillStyle(BG_COLOUR, BG_ALPHA);
      this._burger.bg.lineStyle(STROKE_WIDTH, STROKE_COLOUR, 1);
      this._burger.bg.fillRoundedRect(x, y, BURGER_SIZE, BURGER_SIZE, BURGER_RADIUS);
      this._burger.bg.strokeRoundedRect(x, y, BURGER_SIZE, BURGER_SIZE, BURGER_RADIUS);
      this._burger.icon.clear();
      this._burger.icon.lineStyle(4, STROKE_COLOUR, 1);
      const cx = x + BURGER_SIZE / 2;
      const cy = y + BURGER_SIZE / 2;
      this._burger.icon.lineBetween(cx - 14, cy - 10, cx + 14, cy - 10);
      this._burger.icon.lineBetween(cx - 14, cy,      cx + 14, cy);
      this._burger.icon.lineBetween(cx - 14, cy + 10, cx + 14, cy + 10);
      this._burger.zone.setPosition(x, y);
    }
    this._renderItems();
  }

  _renderItems() {
    for (const item of this._items) {
      item.bg?.destroy();
      item.label?.destroy();
      item.zone?.destroy();
    }
    this._items = [];

    if (!this.expanded) return;

    const baseX = this.scale.width - PADDING - ITEM_W;
    let y = PADDING + BURGER_SIZE + ITEM_GAP;

    const buttons = [
      { label: 'home',                      onClick: () => this.router?.goHome?.() },
      { label: this._soundLabel(),          onClick: () => Accessibility.toggleMuted() },
      { label: this._textLabel(),           onClick: () => Accessibility.cycleTextSize() }
    ];

    for (const def of buttons) {
      const item = this._makeItem(baseX, y, def.label, def.onClick);
      this._items.push(item);
      y += ITEM_H + ITEM_GAP;
    }
  }

  _makeItem(x, y, labelText, onClick) {
    const bg = this.add.graphics().setDepth(UI_DEPTH);
    bg.fillStyle(BG_COLOUR, BG_ALPHA);
    bg.lineStyle(STROKE_WIDTH, STROKE_COLOUR, 1);
    bg.fillRoundedRect(x, y, ITEM_W, ITEM_H, ITEM_RADIUS);
    bg.strokeRoundedRect(x, y, ITEM_W, ITEM_H, ITEM_RADIUS);

    const label = this.add.text(x + ITEM_W / 2, y + ITEM_H / 2, labelText, {
      fontFamily: '"Fredoka", "Atkinson Hyperlegible", system-ui, sans-serif',
      fontSize: `${TEXT_FONT_PX}px`,
      color: TEXT_COLOUR
    }).setOrigin(0.5).setDepth(UI_DEPTH + 1);

    const zone = this.add.zone(x, y, ITEM_W, ITEM_H).setOrigin(0, 0);
    zone.setInteractive({ useHandCursor: true });
    zone.setDepth(UI_DEPTH + 2);
    zone.on('pointerover', () => this.tweens.add({ targets: bg, alpha: 1, duration: 100 }));
    zone.on('pointerout',  () => this.tweens.add({ targets: bg, alpha: BG_ALPHA, duration: 100 }));
    zone.on('pointerup', () => {
      onClick();
      // After action, refresh labels (toggles can change them).
      this._refreshLabels();
    });

    return { bg, label, zone };
  }

  _soundLabel() { return Accessibility.muted ? 'sound: off' : 'sound: on'; }
  _textLabel()  { return `text: ${Accessibility.textSize.toLowerCase()}`; }

  _refreshLabels() {
    if (!this._items.length) return;
    // items[0] = home (no label change), items[1] = sound, items[2] = text
    if (this._items[1]?.label) this._items[1].label.setText(this._soundLabel());
    if (this._items[2]?.label) this._items[2].label.setText(this._textLabel());
  }
}

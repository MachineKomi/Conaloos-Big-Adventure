/**
 * GlobalUIScene — corner controls.
 *
 * v1.7 polish:
 *   - Burger button matches the bag/star/gem chip (80px, drawPanel).
 *   - Dropdown items use drawPanel + slide-in, with hover highlight,
 *     and a soft icon glyph next to each label so a 4-year-old can
 *     read the panel by shape, not just by word.
 *   - Motion toggle stays REMOVED — disabling motion broke the
 *     protagonist mechanic and confused the kid.
 */

import Phaser from 'phaser';
import { Accessibility } from './Accessibility.js';
import { COL, RADIUS, STROKE, TOPBAR, TYPE, ANIM, drawPanel } from './UITokens.js';

const UI_DEPTH = 9500;

const BURGER_SIZE = TOPBAR.itemH;     // 80 — same as the bag + star + gem panel

const ITEM_W = 240;
const ITEM_H = 64;
const ITEM_GAP = 10;
const ITEM_PADDING_X = 18;

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
    if (this._burger) {
      this._burger.bg?.destroy();
      this._burger.icon?.destroy();
      this._burger.zone?.destroy();
    }

    const x = this.scale.width - TOPBAR.paddingX - BURGER_SIZE;
    const y = TOPBAR.paddingTop;

    const bg = this.add.graphics().setDepth(UI_DEPTH);
    drawPanel(bg, x, y, BURGER_SIZE, BURGER_SIZE, { radius: RADIUS.card });

    // Three burger lines, sized to the new bigger button.
    const icon = this.add.graphics().setDepth(UI_DEPTH + 1);
    icon.lineStyle(5, COL.ink, 1);
    const cx = x + BURGER_SIZE / 2;
    const cy = y + BURGER_SIZE / 2;
    icon.lineBetween(cx - 16, cy - 12, cx + 16, cy - 12);
    icon.lineBetween(cx - 16, cy,      cx + 16, cy);
    icon.lineBetween(cx - 16, cy + 12, cx + 16, cy + 12);

    const zone = this.add.zone(x, y, BURGER_SIZE, BURGER_SIZE).setOrigin(0, 0);
    zone.setInteractive({ useHandCursor: true });
    zone.setDepth(UI_DEPTH + 2);
    const redrawAlpha = (alpha) => {
      bg.clear();
      drawPanel(bg, x, y, BURGER_SIZE, BURGER_SIZE, { radius: RADIUS.card, fillAlpha: alpha });
    };
    zone.on('pointerover', () => redrawAlpha(1.0));
    zone.on('pointerout',  () => redrawAlpha(0.96));
    zone.on('pointerup', () => {
      this.tweens.add({
        targets: icon,
        scale: { from: 0.85, to: 1.0 },
        duration: ANIM.press,
        ease: 'Back.easeOut'
      });
      this.expanded = !this.expanded;
      this._renderItems();
    });

    this._burger = { bg, icon, zone, x, y };
  }

  _reposition() {
    this._buildBurger();
    this._renderItems();
  }

  _renderItems() {
    for (const item of this._items) {
      item.bg?.destroy();
      item.label?.destroy();
      item.icon?.destroy();
      item.zone?.destroy();
    }
    this._items = [];

    if (!this.expanded) return;

    const baseX = this.scale.width - TOPBAR.paddingX - ITEM_W;
    let y = TOPBAR.paddingTop + BURGER_SIZE + ITEM_GAP;

    const buttons = [
      // "warp back" = jump back to the hub scene from anywhere. We
      // call it warp-back rather than 'home' because it doesn't exit
      // to the title screen — it teleports inside the world.
      { glyph: '⌂', label: 'warp home',          onClick: () => this.router?.goHome?.() },
      { glyph: '♪', label: this._soundLabel(),   onClick: () => Accessibility.toggleMuted() },
      { glyph: 'A', label: this._textLabel(),    onClick: () => Accessibility.cycleTextSize() }
    ];

    // Slide-in animation: stage all items offset, then tween in.
    const slidIn = [];
    for (const def of buttons) {
      const item = this._makeItem(baseX, y, def.glyph, def.label, def.onClick);
      this._items.push(item);
      slidIn.push(item);
      y += ITEM_H + ITEM_GAP;
    }

    const all = slidIn.flatMap((it) => [it.bg, it.icon, it.label, it.zone]);
    all.forEach((o) => { if (o) { o.y = (o.y ?? 0) - 12; o.alpha = 0; } });
    this.tweens.add({
      targets: all,
      y: '+=12',
      alpha: 1,
      duration: ANIM.panelOpen,
      ease: 'Sine.easeOut'
    });
  }

  _makeItem(x, y, glyph, labelText, onClick) {
    const bg = this.add.graphics().setDepth(UI_DEPTH);
    drawPanel(bg, x, y, ITEM_W, ITEM_H, { radius: RADIUS.card });

    const iconText = this.add.text(x + ITEM_PADDING_X, y + ITEM_H / 2, glyph, {
      fontFamily: TYPE.family,
      fontSize: '28px',
      color: COL.orangeHex
    }).setOrigin(0, 0.5).setDepth(UI_DEPTH + 1);

    const label = this.add.text(x + ITEM_PADDING_X + 36, y + ITEM_H / 2, labelText, {
      fontFamily: TYPE.family,
      fontSize: `${TYPE.body}px`,
      color: COL.inkHex
    }).setOrigin(0, 0.5).setDepth(UI_DEPTH + 1);

    const zone = this.add.zone(x, y, ITEM_W, ITEM_H).setOrigin(0, 0);
    zone.setInteractive({ useHandCursor: true });
    zone.setDepth(UI_DEPTH + 2);

    const redrawAlpha = (alpha) => {
      bg.clear();
      drawPanel(bg, x, y, ITEM_W, ITEM_H, { radius: RADIUS.card, fillAlpha: alpha });
    };
    zone.on('pointerover', () => redrawAlpha(1.0));
    zone.on('pointerout',  () => redrawAlpha(0.96));
    zone.on('pointerup', () => {
      // Quick squish-and-spring on press — the row feels real.
      this.tweens.add({
        targets: [iconText, label],
        scale: { from: 0.94, to: 1.0 },
        duration: ANIM.press,
        ease: 'Back.easeOut'
      });
      onClick();
      // After action, refresh labels (toggles can change them).
      this._refreshLabels();
    });

    return { bg, icon: iconText, label, zone };
  }

  _soundLabel() { return Accessibility.muted ? 'sound: off' : 'sound: on'; }
  _textLabel()  { return `text: ${Accessibility.textSize.toLowerCase()}`; }

  _refreshLabels() {
    if (!this._items.length) return;
    // items[0] = home (no label change), items[1] = sound, items[2] = text
    this._items[1]?.label?.setText(this._soundLabel());
    this._items[2]?.label?.setText(this._textLabel());
  }
}

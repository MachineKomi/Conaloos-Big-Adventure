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
import { getSpecies } from '../content/buddySpecies.js';

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

  init({ router, buddyTeam } = {}) {
    this.router = router || this.router;
    this.buddyTeam = buddyTeam || this.buddyTeam;
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
      { glyph: '✦', label: 'buddies',            onClick: () => this._openRoster() },
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
    // items[0] = home (no label change), items[1] = buddies (no label change),
    // items[2] = sound, items[3] = text
    this._items[2]?.label?.setText(this._soundLabel());
    this._items[3]?.label?.setText(this._textLabel());
  }

  // ─────────────────────── Buddies roster modal ───────────────────────

  /** Open the buddy roster picker. Modal — translucent backdrop
   *  swallows other clicks. Tap a buddy card to set it as the
   *  active follower; tap the close button (or backdrop) to
   *  dismiss without changing. */
  _openRoster() {
    if (!this.buddyTeam) return;
    if (this._rosterOpen) return;
    this._rosterOpen = true;
    // Also collapse the burger panel so it doesn't sit beside the
    // modal.
    this.expanded = false;
    this._renderItems();

    const { width, height } = this.scale;
    const items = [];

    // Backdrop veil + input blocker.
    const veil = this.add.graphics().setDepth(UI_DEPTH + 50);
    veil.fillStyle(COL.ink, 0.5);
    veil.fillRect(0, 0, width, height);
    items.push(veil);
    const blocker = this.add.zone(0, 0, width, height).setOrigin(0, 0).setDepth(UI_DEPTH + 51);
    blocker.setInteractive();
    blocker.on('pointerup', () => closeRoster());
    items.push(blocker);

    const buddies = this.buddyTeam.list();
    const activeIdx = buddies.indexOf(this.buddyTeam.active());

    // Panel sized to fit all cards in a row.
    const cardW = 200;
    const cardH = 220;
    const cardGap = 18;
    const panelPad = 32;
    const panelW = Math.min(width - 80, panelPad * 2 + buddies.length * cardW + (buddies.length - 1) * cardGap);
    const panelH = panelPad * 2 + cardH + 90;
    const panelX = (width - panelW) / 2;
    const panelY = (height - panelH) / 2;

    const panelBg = this.add.graphics().setDepth(UI_DEPTH + 60);
    drawPanel(panelBg, panelX, panelY, panelW, panelH, { radius: RADIUS.panel });
    items.push(panelBg);

    const title = this.add.text(width / 2, panelY + 18, 'Your buddies', {
      fontFamily: TYPE.family,
      fontSize: `${TYPE.heading}px`,
      color: COL.inkHex
    }).setOrigin(0.5, 0).setDepth(UI_DEPTH + 61);
    items.push(title);

    const subtitle = this.add.text(width / 2, panelY + 50,
      'Tap a buddy to pick who walks with Amelia.', {
      fontFamily: TYPE.bodyFamily,
      fontSize: `${TYPE.caption}px`,
      color: COL.inkSoft
    }).setOrigin(0.5, 0).setDepth(UI_DEPTH + 61);
    items.push(subtitle);

    // Cards.
    const totalCardsW = buddies.length * cardW + (buddies.length - 1) * cardGap;
    const cardsStartX = (width - totalCardsW) / 2;
    const cardsY = panelY + 88;

    buddies.forEach((buddy, i) => {
      const species = getSpecies(buddy.speciesId);
      if (!species) return;
      const cx = cardsStartX + i * (cardW + cardGap);
      const cy = cardsY;
      const isActive = i === activeIdx;

      const cardBg = this.add.graphics().setDepth(UI_DEPTH + 62);
      drawPanel(cardBg, cx, cy, cardW, cardH, {
        radius: RADIUS.card,
        fill: isActive ? COL.gold : COL.paperWarm,
        fillAlpha: 1
      });
      items.push(cardBg);

      // Sprite.
      if (this.textures.exists(species.sprite)) {
        const img = this.add.image(cx + cardW / 2, cy + 100, species.sprite).setOrigin(0.5).setDepth(UI_DEPTH + 63);
        const tex = this.textures.get(species.sprite).getSourceImage();
        img.setScale(120 / tex.height);
        items.push(img);
      }

      const name = this.add.text(cx + cardW / 2, cy + 12, species.displayName, {
        fontFamily: TYPE.family,
        fontSize: '20px',
        color: COL.inkHex
      }).setOrigin(0.5, 0).setDepth(UI_DEPTH + 63);
      items.push(name);

      const lvl = this.add.text(cx + cardW / 2, cy + cardH - 36, `Lv${buddy.level}`, {
        fontFamily: TYPE.family,
        fontSize: '18px',
        color: COL.orangeHex
      }).setOrigin(0.5, 0).setDepth(UI_DEPTH + 63);
      items.push(lvl);

      if (isActive) {
        const tag = this.add.text(cx + cardW / 2, cy + cardH - 14, '✓ active', {
          fontFamily: TYPE.family,
          fontSize: '14px',
          color: '#ffffff',
          backgroundColor: COL.orangeHex,
          padding: { left: 8, right: 8, top: 2, bottom: 2 }
        }).setOrigin(0.5, 0).setDepth(UI_DEPTH + 64);
        items.push(tag);
      }

      const zone = this.add.zone(cx, cy, cardW, cardH).setOrigin(0, 0).setDepth(UI_DEPTH + 65);
      zone.setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => {
        this.buddyTeam.setActiveIdx(i);
        closeRoster();
      });
      items.push(zone);
    });

    // Close X (top-right of the panel).
    const closeX = panelX + panelW - 40;
    const closeY = panelY + 10;
    const closeBg = this.add.graphics().setDepth(UI_DEPTH + 62);
    drawPanel(closeBg, closeX, closeY, 30, 30, { radius: RADIUS.pill, fill: COL.paper });
    items.push(closeBg);
    const closeLabel = this.add.text(closeX + 15, closeY + 15, '✕', {
      fontFamily: TYPE.family,
      fontSize: '20px',
      color: COL.inkHex
    }).setOrigin(0.5).setDepth(UI_DEPTH + 63);
    items.push(closeLabel);
    const closeZone = this.add.zone(closeX, closeY, 30, 30).setOrigin(0, 0).setDepth(UI_DEPTH + 65);
    closeZone.setInteractive({ useHandCursor: true });
    closeZone.on('pointerup', () => closeRoster());
    items.push(closeZone);

    const closeRoster = () => {
      this._rosterOpen = false;
      this.tweens.add({
        targets: items,
        alpha: 0,
        duration: ANIM.panelClose,
        ease: 'Sine.easeIn',
        onComplete: () => items.forEach((o) => o.destroy())
      });
    };

    // Slide in.
    for (const o of items) o.alpha = 0;
    this.tweens.add({
      targets: items,
      alpha: 1,
      duration: ANIM.panelOpen,
      ease: 'Sine.easeOut'
    });
  }
}

/**
 * QuestHUDScene — the quests button + panel + "quest complete" toast.
 *
 * - A small "✓" badge button sits in the top-left next to the
 *   inventory bag. Tap to open the quests panel.
 * - The panel lists every quest with progress (filled bar / "DONE")
 *   and reward.
 * - When a quest completes, a celebratory toast pops in for ~3s and
 *   the gem reward is granted automatically (so the kid sees gems
 *   fly into the bag).
 */

import Phaser from 'phaser';
import { COL, RADIUS, STROKE, TOPBAR, TYPE, ANIM, drawPanel } from './UITokens.js';

// Place the quest button right beside the inventory bag.
const ICON_X = TOPBAR.paddingX + TOPBAR.itemH + TOPBAR.gap;
const ICON_Y = TOPBAR.paddingTop;
const ICON_SIZE = TOPBAR.itemH;       // 80 — aligned with bag + burger + gem hud

const PANEL_W = 520;
const ROW_H = 72;
const ROW_GAP = 8;
const ROW_PADDING_X = 18;

const TOAST_W = 480;
const TOAST_H = 120;

export class QuestHUDScene extends Phaser.Scene {
  constructor() {
    super({ key: 'global:questhud', active: false });
    this.open = false;
  }

  init({ questManager, gemBag } = {}) {
    this.questManager = questManager || this.questManager;
    this.gemBag = gemBag || this.gemBag;
  }

  create() {
    this._buildIcon();
    this._panelG = this.add.graphics().setDepth(7600);
    this._panelItems = [];
    this._unsubscribe = this.questManager.onChange((evt) => this._onChange(evt));
    this.scale.on('resize', () => {
      this._buildIcon();
      this._renderPanel();
    });
    this.events.on('shutdown', () => this._unsubscribe?.());
    this.scene.bringToTop();
  }

  _buildIcon() {
    [this._iconBg, this._iconLabel, this._iconBadge, this._iconZone].forEach((o) => o?.destroy());

    const x = ICON_X;
    const y = ICON_Y;

    const bg = this.add.graphics().setDepth(7700);
    drawPanel(bg, x, y, ICON_SIZE, ICON_SIZE, { radius: RADIUS.card });
    this._iconBg = bg;

    const label = this.add.text(x + ICON_SIZE / 2, y + ICON_SIZE / 2 - 2, '★', {
      fontFamily: TYPE.family,
      fontSize: '44px',
      color: COL.inkHex
    }).setOrigin(0.5).setDepth(7701);
    this._iconLabel = label;

    // Tiny "n done" badge in the top-right corner.
    const completed = this.questManager.completedCount();
    const total = this.questManager.list().length;
    const badge = this.add.text(
      x + ICON_SIZE - 6,
      y + 4,
      `${completed}/${total}`,
      {
        fontFamily: TYPE.family,
        fontSize: `${TYPE.badge}px`,
        color: '#ffffff',
        backgroundColor: COL.inkHex,
        padding: { left: 6, right: 6, top: 2, bottom: 2 }
      }
    ).setOrigin(1, 0).setDepth(7702);
    this._iconBadge = badge;

    const zone = this.add.zone(x, y, ICON_SIZE, ICON_SIZE).setOrigin(0, 0);
    zone.setInteractive({ useHandCursor: true });
    zone.setDepth(7703);
    const redrawAlpha = (alpha) => {
      bg.clear();
      drawPanel(bg, x, y, ICON_SIZE, ICON_SIZE, { radius: RADIUS.card, fillAlpha: alpha });
    };
    zone.on('pointerover', () => redrawAlpha(1.0));
    zone.on('pointerout',  () => redrawAlpha(0.96));
    zone.on('pointerup', () => {
      this.tweens.add({
        targets: label,
        scale: { from: 0.85, to: 1.0 },
        duration: ANIM.press,
        ease: 'Back.easeOut'
      });
      this.open = !this.open;
      this._renderPanel();
    });
    this._iconZone = zone;
  }

  _onChange(evt) {
    this._buildIcon(); // refresh badge count
    if (this.open) this._renderPanel();

    // For each newly completed quest, fire a toast and auto-grant
    // the gem reward (so the kid sees gems fly into the counter).
    if (evt.newlyCompleted?.length) {
      for (const entry of evt.newlyCompleted) {
        this._showToast(entry.def);
        // Auto-claim — credit gems via gemBag (uses a fake gem key
        // so the icon updates).
        const reward = entry.def.reward || 0;
        if (reward > 0 && this.gemBag) {
          // Pick gem_5 as the visual icon for the reward chunk.
          this.gemBag.add('gem_5', reward);
        }
        this.questManager.claim(entry.def.id);
      }
    }
  }

  _showToast(def) {
    const { width } = this.scale;
    const x = (width - TOAST_W) / 2;
    const yResting = 120;

    const bg = this.add.graphics().setDepth(8800);
    drawPanel(bg, x, yResting, TOAST_W, TOAST_H, {
      radius: RADIUS.panel,
      fill: COL.gold,
      fillAlpha: 0.97
    });

    const headline = this.add.text(x + TOAST_W / 2, yResting + 22, '★ Quest done!', {
      fontFamily: TYPE.family,
      fontSize: `${TYPE.heading}px`,
      color: COL.orangeHex
    }).setOrigin(0.5, 0).setDepth(8801);

    const title = this.add.text(x + TOAST_W / 2, yResting + 58, `"${def.title}"`, {
      fontFamily: TYPE.family,
      fontSize: '22px',
      color: COL.inkHex
    }).setOrigin(0.5, 0).setDepth(8801);

    const reward = this.add.text(x + TOAST_W / 2, yResting + 90, `+${def.reward} stones`, {
      fontFamily: TYPE.bodyFamily,
      fontSize: `${TYPE.body}px`,
      color: COL.inkHex
    }).setOrigin(0.5, 0).setDepth(8801);

    const items = [bg, headline, title, reward];

    // Drop in from above.
    items.forEach((o) => { o.alpha = 0; o.y = (o.y ?? 0) - 16; });
    this.tweens.add({
      targets: items,
      alpha: 1,
      y: '+=16',
      duration: ANIM.toast,
      ease: 'Back.easeOut'
    });

    this.time.delayedCall(2800, () => {
      this.tweens.add({
        targets: items,
        alpha: 0,
        y: '-=12',
        duration: ANIM.toast,
        ease: 'Sine.easeIn',
        onComplete: () => items.forEach((o) => o.destroy())
      });
    });
  }

  _renderPanel() {
    this._panelG.clear();
    for (const o of this._panelItems) o.destroy();
    this._panelItems = [];
    if (!this.open) return;

    const list = this.questManager.list();
    const { height } = this.scale;
    const x = ICON_X;
    const y = ICON_Y + ICON_SIZE + 8;
    const maxRows = Math.min(list.length, Math.floor((height - y - 24) / (ROW_H + ROW_GAP)));
    const totalH = 60 + maxRows * (ROW_H + ROW_GAP) + 16;

    drawPanel(this._panelG, x, y, PANEL_W, totalH, { radius: RADIUS.panel });

    const title = this.add.text(x + PANEL_W / 2, y + 16, "Quests", {
      fontFamily: TYPE.family,
      fontSize: `${TYPE.heading}px`,
      color: COL.inkHex
    }).setOrigin(0.5, 0).setDepth(7601);
    this._panelItems.push(title);

    let rowY = y + 56;
    for (let i = 0; i < maxRows; i++) {
      const entry = list[i];
      const def = entry.def;
      const rowX = x + ROW_PADDING_X;
      const rowW = PANEL_W - ROW_PADDING_X * 2;

      // Row background tinted by completion state.
      const rowBg = this.add.graphics().setDepth(7601);
      const rowColour = entry.completed ? COL.green : COL.gold;
      rowBg.fillStyle(rowColour, 0.5);
      rowBg.fillRoundedRect(rowX, rowY, rowW, ROW_H, RADIUS.chip);
      this._panelItems.push(rowBg);

      const titleText = entry.completed ? `✓  ${def.title}` : def.title;
      const t = this.add.text(rowX + 12, rowY + 8, titleText, {
        fontFamily: TYPE.family,
        fontSize: '20px',
        color: COL.inkHex
      }).setOrigin(0, 0).setDepth(7602);
      this._panelItems.push(t);

      const descText = entry.completed
        ? `(+${def.reward} stones — collected)`
        : def.desc;
      const p = this.add.text(rowX + 12, rowY + 36, descText, {
        fontFamily: TYPE.bodyFamily,
        fontSize: `${TYPE.caption}px`,
        color: COL.inkSoft
      }).setOrigin(0, 0).setDepth(7602);
      this._panelItems.push(p);

      // Progress bar on the right (only for incomplete quests).
      if (!entry.completed) {
        const barW = 130;
        const barH = 14;
        const barX = rowX + rowW - barW - 12;
        const barY = rowY + ROW_H / 2 - barH / 2;
        const fill = Math.max(0, Math.min(1, entry.progress / def.target));

        const bar = this.add.graphics().setDepth(7602);
        // Background track
        bar.fillStyle(COL.ink, 0.18);
        bar.fillRoundedRect(barX, barY, barW, barH, barH / 2);
        // Filled portion
        bar.fillStyle(COL.orange, 1);
        bar.fillRoundedRect(barX, barY, Math.max(barH, barW * fill), barH, barH / 2);
        this._panelItems.push(bar);

        const progressLabel = this.add.text(
          barX + barW / 2,
          barY + barH / 2,
          `${entry.progress}/${def.target}`,
          {
            fontFamily: TYPE.family,
            fontSize: '12px',
            color: '#ffffff',
            stroke: COL.inkHex,
            strokeThickness: 3
          }
        ).setOrigin(0.5).setDepth(7603);
        this._panelItems.push(progressLabel);
      } else {
        const rewardChip = this.add.text(
          rowX + rowW - 12,
          rowY + ROW_H / 2,
          `+${def.reward}`,
          {
            fontFamily: TYPE.family,
            fontSize: '20px',
            color: '#ffffff',
            backgroundColor: COL.orangeHex,
            padding: { left: 10, right: 10, top: 4, bottom: 4 }
          }
        ).setOrigin(1, 0.5).setDepth(7603);
        this._panelItems.push(rewardChip);
      }

      rowY += ROW_H + ROW_GAP;
    }

    // Slide the panel down from the icon.
    this._slideDown(this._panelG, this._panelItems, y);
  }

  _slideDown(panelG, items, restingY) {
    const SLIDE = 24;
    const all = [panelG, ...items];
    all.forEach((o) => {
      o.y = (o.y ?? 0) - SLIDE;
      o.alpha = 0;
    });
    this.tweens.add({
      targets: all,
      y: '+=' + SLIDE,
      alpha: 1,
      duration: ANIM.panelOpen,
      ease: 'Sine.easeOut'
    });
  }
}

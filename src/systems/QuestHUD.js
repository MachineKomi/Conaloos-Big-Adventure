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

const ICON_X = 130;        // right of the inventory bag (which sits at x=16, w=100)
const ICON_Y = 12;
const ICON_SIZE = 100;
const ICON_RADIUS = 26;
const ICON_BG = 0xfff8e7;
const ICON_BG_ALPHA = 0.92;
const ICON_STROKE = 0x4a3a1f;
const ICON_STROKE_W = 4;
const ICON_TEXT_COLOUR = '#4a3a1f';

const PANEL_W = 480;
const PANEL_BG = 0xfff8e7;
const PANEL_BG_ALPHA = 0.96;
const PANEL_STROKE = 0x4a3a1f;
const PANEL_STROKE_W = 4;
const PANEL_RADIUS = 22;

const ROW_H = 64;
const ROW_GAP = 6;
const ROW_PADDING_X = 16;

const TOAST_BG = 0xfff2a8;
const TOAST_BG_ALPHA = 0.97;
const TOAST_W = 460;
const TOAST_H = 110;

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
    bg.fillStyle(ICON_BG, ICON_BG_ALPHA);
    bg.lineStyle(ICON_STROKE_W, ICON_STROKE, 1);
    bg.fillRoundedRect(x, y, ICON_SIZE, ICON_SIZE, ICON_RADIUS);
    bg.strokeRoundedRect(x, y, ICON_SIZE, ICON_SIZE, ICON_RADIUS);
    this._iconBg = bg;

    const label = this.add.text(x + ICON_SIZE / 2, y + ICON_SIZE / 2, '★', {
      fontFamily: '"Fredoka", "Atkinson Hyperlegible", system-ui, sans-serif',
      fontSize: '46px',
      color: ICON_TEXT_COLOUR
    }).setOrigin(0.5).setDepth(7701);
    this._iconLabel = label;

    // Tiny "n done" badge in the corner — shows progress at a glance.
    const completed = this.questManager.completedCount();
    const total = this.questManager.list().length;
    const badge = this.add.text(
      x + ICON_SIZE - 6,
      y + 4,
      `${completed}/${total}`,
      {
        fontFamily: '"Fredoka", system-ui, sans-serif',
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#4a3a1f',
        padding: { left: 6, right: 6, top: 2, bottom: 2 }
      }
    ).setOrigin(1, 0).setDepth(7702);
    this._iconBadge = badge;

    const zone = this.add.zone(x, y, ICON_SIZE, ICON_SIZE).setOrigin(0, 0);
    zone.setInteractive({ useHandCursor: true });
    zone.setDepth(7703);
    zone.on('pointerover', () => this.tweens.add({ targets: bg, alpha: 1, duration: 100 }));
    zone.on('pointerout',  () => this.tweens.add({ targets: bg, alpha: ICON_BG_ALPHA, duration: 100 }));
    zone.on('pointerup', () => {
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
    const y = 110;

    const bg = this.add.graphics().setDepth(8800);
    bg.fillStyle(TOAST_BG, TOAST_BG_ALPHA);
    bg.lineStyle(4, PANEL_STROKE, 1);
    bg.fillRoundedRect(x, y, TOAST_W, TOAST_H, 20);
    bg.strokeRoundedRect(x, y, TOAST_W, TOAST_H, 20);

    const headline = this.add.text(x + TOAST_W / 2, y + 22, '★ Quest done!', {
      fontFamily: '"Fredoka", system-ui, sans-serif',
      fontSize: '24px',
      color: '#a45e08'
    }).setOrigin(0.5, 0).setDepth(8801);

    const title = this.add.text(x + TOAST_W / 2, y + 56, `"${def.title}"`, {
      fontFamily: '"Fredoka", system-ui, sans-serif',
      fontSize: '22px',
      color: '#4a3a1f'
    }).setOrigin(0.5, 0).setDepth(8801);

    const reward = this.add.text(x + TOAST_W / 2, y + 86, `+${def.reward} stones`, {
      fontFamily: '"Atkinson Hyperlegible", system-ui, sans-serif',
      fontSize: '18px',
      color: '#4a3a1f'
    }).setOrigin(0.5, 0).setDepth(8801);

    const items = [bg, headline, title, reward];

    items.forEach((o) => o.setAlpha(0));
    this.tweens.add({
      targets: items,
      alpha: 1,
      duration: 220,
      ease: 'Sine.easeOut'
    });

    this.time.delayedCall(2800, () => {
      this.tweens.add({
        targets: items,
        alpha: 0,
        duration: 320,
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
    const { width, height } = this.scale;
    const x = ICON_X;
    const y = ICON_Y + ICON_SIZE + 8;
    const maxRows = Math.min(list.length, Math.floor((height - y - 24) / (ROW_H + ROW_GAP)));
    const totalH = 60 + maxRows * (ROW_H + ROW_GAP) + 12;

    this._panelG.fillStyle(PANEL_BG, PANEL_BG_ALPHA);
    this._panelG.lineStyle(PANEL_STROKE_W, PANEL_STROKE, 1);
    this._panelG.fillRoundedRect(x, y, PANEL_W, totalH, PANEL_RADIUS);
    this._panelG.strokeRoundedRect(x, y, PANEL_W, totalH, PANEL_RADIUS);

    const title = this.add.text(x + PANEL_W / 2, y + 14, "Quests", {
      fontFamily: '"Fredoka", system-ui, sans-serif',
      fontSize: '24px',
      color: '#4a3a1f'
    }).setOrigin(0.5, 0).setDepth(7601);
    this._panelItems.push(title);

    let rowY = y + 50;
    for (let i = 0; i < maxRows; i++) {
      const entry = list[i];
      const def = entry.def;
      const rowX = x + ROW_PADDING_X;
      const rowW = PANEL_W - ROW_PADDING_X * 2;

      const rowBg = this.add.graphics().setDepth(7601);
      const rowColour = entry.completed ? 0xc8e7c8 : 0xfff2a8;
      rowBg.fillStyle(rowColour, 0.6);
      rowBg.fillRoundedRect(rowX, rowY, rowW, ROW_H, 12);
      this._panelItems.push(rowBg);

      const titleText = entry.completed ? `✓ ${def.title}` : def.title;
      const t = this.add.text(rowX + 10, rowY + 6, titleText, {
        fontFamily: '"Fredoka", system-ui, sans-serif',
        fontSize: '18px',
        color: '#4a3a1f'
      }).setOrigin(0, 0).setDepth(7602);
      this._panelItems.push(t);

      const progressText = entry.completed
        ? `(+${def.reward} stones rewarded)`
        : `${def.desc}  —  ${entry.progress}/${def.target}`;
      const p = this.add.text(rowX + 10, rowY + 30, progressText, {
        fontFamily: '"Atkinson Hyperlegible", system-ui, sans-serif',
        fontSize: '14px',
        color: '#5a4a2a'
      }).setOrigin(0, 0).setDepth(7602);
      this._panelItems.push(p);

      rowY += ROW_H + ROW_GAP;
    }
  }
}

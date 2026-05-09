/**
 * Inventory HUD — a small row of thing sprites along the bottom of the
 * screen showing what Amelia is currently carrying. Multiples of the
 * same item show as a single sprite with a small "×N" badge.
 */

import Phaser from 'phaser';

const SLOT_SIZE = 56;
const SLOT_GAP = 8;
const PANEL_PADDING = 10;
const PANEL_RADIUS = 16;
const PANEL_BG = 0xfff8e7;
const PANEL_BG_ALPHA = 0.85;
const PANEL_STROKE = 0x4a3a1f;
const PANEL_STROKE_W = 3;
const COUNT_FONT = 14;

export class InventoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'global:inventory', active: false });
  }

  init({ protagonist } = {}) {
    this.protagonist = protagonist || this.protagonist;
  }

  create() {
    this._panelG = this.add.graphics();
    this._slotImages = [];
    this._unsubscribe = this.protagonist.onCollectChange(() => this._render());
    this.scale.on('resize', () => this._render());
    this._render();
    this.events.on('shutdown', () => this._unsubscribe?.());
  }

  _render() {
    const items = this.protagonist?.inventory?.() || [];
    this._panelG.clear();
    for (const obj of this._slotImages) obj.destroy();
    this._slotImages = [];

    if (items.length === 0) return;

    const { width, height } = this.scale;
    const totalW = items.length * SLOT_SIZE + (items.length - 1) * SLOT_GAP + PANEL_PADDING * 2;
    const totalH = SLOT_SIZE + PANEL_PADDING * 2;
    const x = (width - totalW) / 2;
    const y = height - totalH - 12;

    this._panelG.fillStyle(PANEL_BG, PANEL_BG_ALPHA);
    this._panelG.lineStyle(PANEL_STROKE_W, PANEL_STROKE, 1);
    this._panelG.fillRoundedRect(x, y, totalW, totalH, PANEL_RADIUS);
    this._panelG.strokeRoundedRect(x, y, totalW, totalH, PANEL_RADIUS);

    items.forEach((item, i) => {
      const key = item.key;
      const count = item.count;
      if (!this.textures.exists(key)) return;
      const cx = x + PANEL_PADDING + i * (SLOT_SIZE + SLOT_GAP) + SLOT_SIZE / 2;
      const cy = y + PANEL_PADDING + SLOT_SIZE / 2;

      const img = this.add.image(cx, cy, key).setOrigin(0.5);
      const tex = this.textures.get(key).getSourceImage();
      const targetH = SLOT_SIZE - 8;
      img.setScale(targetH / tex.height);
      img.setDepth(10);
      this._slotImages.push(img);

      if (count > 1) {
        // Small "×N" badge on the bottom-right corner.
        const badge = this.add.text(
          cx + SLOT_SIZE / 2 - 4,
          cy + SLOT_SIZE / 2 - 4,
          `×${count}`,
          {
            fontFamily: '"Fredoka", system-ui, sans-serif',
            fontSize: `${COUNT_FONT}px`,
            color: '#ffffff',
            backgroundColor: '#4a3a1f',
            padding: { left: 4, right: 4, top: 1, bottom: 1 }
          }
        ).setOrigin(1, 1).setDepth(11);
        this._slotImages.push(badge);
      }
    });

    this.scene.bringToTop();
  }
}

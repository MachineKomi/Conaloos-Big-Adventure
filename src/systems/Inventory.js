/**
 * Inventory HUD — a small row of thing sprites along the bottom of the screen
 * showing what Amelia is currently carrying. Lives on its own Phaser scene
 * so it persists above gameplay scenes (like the GlobalUI scene does).
 *
 * Inventory state itself is kept on the Protagonist; this scene just
 * subscribes and re-renders.
 */

import Phaser from 'phaser';

const SLOT_SIZE = 64;
const SLOT_GAP = 10;
const PANEL_PADDING = 12;
const PANEL_RADIUS = 18;
const PANEL_BG = 0xfff8e7;
const PANEL_BG_ALPHA = 0.85;
const PANEL_STROKE = 0x4a3a1f;
const PANEL_STROKE_W = 3;
const TARGET_HEIGHT_FRAC = 0.10;

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
    for (const img of this._slotImages) img.destroy();
    this._slotImages = [];

    if (items.length === 0) return;

    const { width, height } = this.scale;
    const totalW = items.length * SLOT_SIZE + (items.length - 1) * SLOT_GAP + PANEL_PADDING * 2;
    const totalH = SLOT_SIZE + PANEL_PADDING * 2;
    const x = (width - totalW) / 2;
    const y = height - totalH - 16;

    this._panelG.fillStyle(PANEL_BG, PANEL_BG_ALPHA);
    this._panelG.lineStyle(PANEL_STROKE_W, PANEL_STROKE, 1);
    this._panelG.fillRoundedRect(x, y, totalW, totalH, PANEL_RADIUS);
    this._panelG.strokeRoundedRect(x, y, totalW, totalH, PANEL_RADIUS);

    items.forEach((key, i) => {
      if (!this.textures.exists(key)) return;
      const cx = x + PANEL_PADDING + i * (SLOT_SIZE + SLOT_GAP) + SLOT_SIZE / 2;
      const cy = y + PANEL_PADDING + SLOT_SIZE / 2;
      const img = this.add.image(cx, cy, key).setOrigin(0.5);
      const tex = this.textures.get(key).getSourceImage();
      const targetH = SLOT_SIZE - 6;
      img.setScale(targetH / tex.height);
      img.setDepth(10);
      this._slotImages.push(img);
    });

    // Bring this scene above gameplay.
    this.scene.bringToTop();
  }
}

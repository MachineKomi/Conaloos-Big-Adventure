/**
 * InventoryScene — Amelia's bag.
 *
 * - A backpack-icon button sits in the top-LEFT corner; click it to
 *   toggle the bag drawer.
 * - The drawer shows held items along the bottom of the screen.
 *   Multiples of the same item show as one sprite with a "×N" badge.
 * - Drawer auto-OPENS for ~3 seconds whenever a new item is collected,
 *   then auto-closes (unless the user has manually toggled it open).
 * - Slots are bigger than v1.2.2 so the items are properly visible.
 */

import Phaser from 'phaser';

const ICON_X = 16;
const ICON_Y = 12;
const ICON_SIZE = 100;             // bigger so kids can find it (was 80).
const ICON_RADIUS = 26;
const ICON_BG = 0xfff8e7;
const ICON_BG_ALPHA = 0.92;
const ICON_STROKE = 0x4a3a1f;
const ICON_STROKE_W = 4;
// Over-scale the backpack image rather than cropping it (cropping cut
// off the corners of some sprites). The over-scale factor is roughly
// the inverse of the average opaque-region fraction.
const BACKPACK_OVERSCALE = 1.45;

const SLOT_SIZE = 120;
const SLOT_GAP = 12;
const PANEL_PADDING = 18;
const PANEL_RADIUS = 26;
const PANEL_BG = 0xfff8e7;
const PANEL_BG_ALPHA = 0.94;
const PANEL_STROKE = 0x4a3a1f;
const PANEL_STROKE_W = 4;
const COUNT_FONT = 22;
// Slot items: over-scale (no crop, since cropping cut off the edges
// of teddy bears, books, etc.).
const SLOT_THING_OVERSCALE = 1.50;

const BACKPACK_KEY = 'thing_backpack';
const AUTO_HIDE_MS = 3000;

export class InventoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'global:inventory', active: false });
    this.open = false;
    this._userToggled = false;     // Manual toggle pins the drawer open.
    this._autoHideTimer = null;
  }

  init({ protagonist } = {}) {
    this.protagonist = protagonist || this.protagonist;
  }

  create() {
    this._buildIcon();
    this._panelG = this.add.graphics().setDepth(7000);
    this._slotImages = [];
    this._unsubscribe = this.protagonist.onCollectChange(() => this._onCollectChange());
    this.scale.on('resize', () => {
      this._buildIcon();
      this._renderPanel();
    });
    this.scene.bringToTop();
    this.events.on('shutdown', () => this._unsubscribe?.());
  }

  _buildIcon() {
    if (this._iconBg) {
      this._iconBg.destroy();
      this._iconImg?.destroy();
      this._iconLabel?.destroy();
      this._iconZone?.destroy();
    }

    const x = ICON_X;
    const y = ICON_Y;

    const bg = this.add.graphics().setDepth(7100);
    bg.fillStyle(ICON_BG, ICON_BG_ALPHA);
    bg.lineStyle(ICON_STROKE_W, ICON_STROKE, 1);
    bg.fillRoundedRect(x, y, ICON_SIZE, ICON_SIZE, ICON_RADIUS);
    bg.strokeRoundedRect(x, y, ICON_SIZE, ICON_SIZE, ICON_RADIUS);
    this._iconBg = bg;

    if (this.textures.exists(BACKPACK_KEY)) {
      const img = this.add.image(x + ICON_SIZE / 2, y + ICON_SIZE / 2, BACKPACK_KEY)
        .setOrigin(0.5)
        .setDepth(7101);
      const tex = this.textures.get(BACKPACK_KEY).getSourceImage();
      // Over-scale (no crop) — keeps the full bag silhouette but
      // makes the visible content fill the icon. Some pixels render
      // outside the icon's rounded-rect area; that's fine because
      // the bag's empty corners ARE transparent.
      img.setScale(((ICON_SIZE - 8) * BACKPACK_OVERSCALE) / tex.height);
      this._iconImg = img;
    } else {
      this._iconLabel = this.add.text(x + ICON_SIZE / 2, y + ICON_SIZE / 2, 'bag', {
        fontFamily: '"Fredoka", system-ui, sans-serif',
        fontSize: '22px',
        color: '#4a3a1f'
      }).setOrigin(0.5).setDepth(7101);
    }

    const zone = this.add.zone(x, y, ICON_SIZE, ICON_SIZE).setOrigin(0, 0);
    zone.setInteractive({ useHandCursor: true });
    zone.setDepth(7102);
    zone.on('pointerover', () => this.tweens.add({ targets: bg, alpha: 1, duration: 100 }));
    zone.on('pointerout',  () => this.tweens.add({ targets: bg, alpha: ICON_BG_ALPHA, duration: 100 }));
    zone.on('pointerup', () => {
      this._userToggled = !this.open;       // tracks: did user just open it manually?
      this.open = !this.open;
      this._cancelAutoHide();
      this._renderPanel();
    });
    this._iconZone = zone;
  }

  _onCollectChange() {
    // Pop the icon to draw attention.
    this._bumpIcon();
    // Auto-show the drawer briefly so the player sees the new item, then
    // auto-hide (unless the user has it pinned open).
    this.open = true;
    this._renderPanel();
    if (!this._userToggled) {
      this._scheduleAutoHide();
    }
  }

  _scheduleAutoHide() {
    this._cancelAutoHide();
    this._autoHideTimer = this.time.delayedCall(AUTO_HIDE_MS, () => {
      if (this._userToggled) return;
      this.open = false;
      this._renderPanel();
    });
  }

  _cancelAutoHide() {
    if (this._autoHideTimer) {
      this._autoHideTimer.remove(false);
      this._autoHideTimer = null;
    }
  }

  _bumpIcon() {
    if (!this._iconImg) return;
    this.tweens.killTweensOf(this._iconImg);
    this.tweens.add({
      targets: this._iconImg,
      scale: { from: this._iconImg.scale * 1.30, to: this._iconImg.scale },
      duration: 320,
      ease: 'Back.easeOut'
    });
  }

  _renderPanel() {
    this._panelG.clear();
    for (const obj of this._slotImages) obj.destroy();
    this._slotImages = [];

    if (!this.open) return;

    const items = this.protagonist?.inventory?.() || [];
    const { width, height } = this.scale;

    const placeholder = items.length === 0 ? [{ key: '__empty', count: 0 }] : items;
    const totalW = placeholder.length * SLOT_SIZE + (placeholder.length - 1) * SLOT_GAP + PANEL_PADDING * 2;
    const totalH = SLOT_SIZE + PANEL_PADDING * 2 + 30;
    const x = (width - totalW) / 2;
    const y = height - totalH - 14;

    this._panelG.fillStyle(PANEL_BG, PANEL_BG_ALPHA);
    this._panelG.lineStyle(PANEL_STROKE_W, PANEL_STROKE, 1);
    this._panelG.fillRoundedRect(x, y, totalW, totalH, PANEL_RADIUS);
    this._panelG.strokeRoundedRect(x, y, totalW, totalH, PANEL_RADIUS);

    const title = this.add.text(x + totalW / 2, y + 16, "Amelia's bag", {
      fontFamily: '"Fredoka", system-ui, sans-serif',
      fontSize: '22px',
      color: '#4a3a1f'
    }).setOrigin(0.5, 0).setDepth(7001);
    this._slotImages.push(title);

    if (items.length === 0) {
      const empty = this.add.text(x + totalW / 2, y + 16 + SLOT_SIZE / 2 + PANEL_PADDING, '(empty so far)', {
        fontFamily: '"Atkinson Hyperlegible", system-ui, sans-serif',
        fontSize: '24px',
        color: '#8a7a4a'
      }).setOrigin(0.5).setDepth(7001);
      this._slotImages.push(empty);
      return;
    }

    items.forEach((item, i) => {
      const key = item.key;
      const count = item.count;
      if (!this.textures.exists(key)) return;
      const cx = x + PANEL_PADDING + i * (SLOT_SIZE + SLOT_GAP) + SLOT_SIZE / 2;
      const cy = y + 30 + PANEL_PADDING + SLOT_SIZE / 2;

      const img = this.add.image(cx, cy, key).setOrigin(0.5);
      const tex = this.textures.get(key).getSourceImage();
      // Over-scale things (no crop) so the bag/teddy/etc visible
      // content fills the slot. Gems already fill their textures.
      const isGem = key.startsWith('gem_');
      const overscale = isGem ? 1.0 : SLOT_THING_OVERSCALE;
      const targetH = (SLOT_SIZE - 8) * overscale;
      img.setScale(targetH / tex.height);
      img.setDepth(7001);

      // Slot click — show the item's collect-dialogue (if any) WITHOUT
      // re-collecting. Used to be a bug: clicks passed through to game
      // sprites and re-triggered collection.
      img.setInteractive({ useHandCursor: true });
      img.on('pointerup', () => this._onSlotClicked(key));
      this._slotImages.push(img);

      if (count > 1) {
        const badge = this.add.text(
          cx + SLOT_SIZE / 2 - 4,
          cy + SLOT_SIZE / 2 - 4,
          `×${count}`,
          {
            fontFamily: '"Fredoka", system-ui, sans-serif',
            fontSize: `${COUNT_FONT}px`,
            color: '#ffffff',
            backgroundColor: '#4a3a1f',
            padding: { left: 8, right: 8, top: 3, bottom: 3 }
          }
        ).setOrigin(1, 1).setDepth(7002);
        this._slotImages.push(badge);
      }
    });

    // CRITICAL: a transparent zone covering the whole panel that
    // captures clicks. Without this, taps on the inventory pass
    // through to the game scene below (the v1.2.3 bug Dad reported
    // — clicking a bucket in the inventory was re-collecting a
    // bucket from the scene because the click went through).
    const blocker = this.add.zone(x, y, totalW, totalH).setOrigin(0, 0);
    blocker.setInteractive();
    blocker.setDepth(7000); // below items (which are 7001) but above gameplay
    this._slotImages.push(blocker);
  }

  /** Show the inventory item's lore dialogue without re-collecting. */
  _onSlotClicked(thingKey) {
    // Forward to the active gameplay scene's dialogue, since the
    // inventory itself doesn't own a dialogue box. Find the scene
    // that has an open dialogue.
    const game = this.scene.manager;
    const liveGameplay = game.getScenes(true).find((s) => s.scene.key.startsWith('scene:') && s.dialogue);
    if (!liveGameplay) return;

    // Build a one-off line for this item — try to find an authored
    // hotspot somewhere with this collect key, fall back to a generic.
    const text = inventoryDescription(thingKey);
    const sprite = liveGameplay.spritesByKey?.get(thingKey);
    liveGameplay.dialogue.show(text, { speakerSprite: sprite || null });
  }
}

/** A tiny poem per item — what's that thing in your bag, exactly?
 *  Read aloud they should each scan as a couplet, not a label. */
function inventoryDescription(key) {
  const map = {
    'thing_birthday-cake-with-one-candle':
      "A cake. With *one* candle, all on its own.\nIt's somebody's somewhere. (You'll know when it's known.)",

    'thing_books':
      "A book, half-read, with a leaf for a marker --\nthe story has *paused*, in a thicket, a parker.",

    'thing_teddybear':
      "A teddy, polite, who's a *very* good listener.\nHe is paid in small hugs. (His salary's *whisker*.)",

    'thing_flashlight':
      "A torch, with a sun in its small metal head --\nit makes morning wherever you stand. (Or your bed.)",

    'thing_microscope':
      "A brass eye for *tiny*. A fly's wing's a window;\na grain of small dust is a galaxy, in show.",

    'thing_globe':
      "A whole world, in a hand. Spin it. Point. *Imagine.*\nThe spot where you stop is where somebody's grinnin'.",

    'thing_hourglass':
      "Sand falling slowly: a *now* into *was*.\nThe heap at the bottom is *story*, because.",

    'thing_bucket':
      "A bucket of seaside, a bucket of lake.\nWhatever you pour in -- the bucket will take.",

    'thing_banana':
      "A snack with a wrapper its grew, on its own.\nUnzip the small zipper. (No teeth. Just bone-known.)",

    'thing_tyre':
      "A round thing that *rolls* if you give it a shove.\nWhich means it loves *forward*. (Which I love. I love.)"
  };
  return map[key] || "Tucked safely inside the bag.\nIt waits, in the warm of the dark.";
}

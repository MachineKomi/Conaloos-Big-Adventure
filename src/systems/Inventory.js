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
import { COL, RADIUS, STROKE, TOPBAR, TYPE, ANIM, drawPanel } from './UITokens.js';

const ICON_X = TOPBAR.paddingX;
const ICON_Y = TOPBAR.paddingTop;
const ICON_SIZE = TOPBAR.itemH;       // 80 — aligned with all top-bar items
const BACKPACK_OVERSCALE = 1.45;

const SLOT_SIZE = 120;
const SLOT_GAP = 14;
const PANEL_PADDING = 20;
const COUNT_FONT = 22;
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

  /** Public: open the inventory drawer externally (used by the
   *  Adventure Book menu). Equivalent to tapping the old bag icon.
   *  Always opens in "modal" mode — backdrop blocker that closes
   *  on outside-tap, since the bag icon is no longer there to
   *  toggle it off. */
  openPanel() {
    if (this.open) return;
    this._userToggled = true;
    this.open = true;
    this._modal = true;
    this._cancelAutoHide();
    this._renderPanel();
  }

  closePanel() {
    if (!this.open) return;
    this._userToggled = false;
    this.open = false;
    this._modal = false;
    this._cancelAutoHide();
    this._renderPanel();
  }

  _buildIcon() {
    // v1.15: the bag icon is gone — the Adventure Book menu owns
    // the "open inventory" entry point now. We still build & tear
    // down the lifecycle but skip the visible icon.
    if (this._iconBg) {
      this._iconBg.destroy();
      this._iconImg?.destroy();
      this._iconLabel?.destroy();
      this._iconZone?.destroy();
      this._iconBg = null;
      this._iconImg = null;
      this._iconLabel = null;
      this._iconZone = null;
    }
    return;
    // Legacy bag-icon code retained below for reference / rollback.
    /* eslint-disable no-unreachable */
    const x = ICON_X;
    const y = ICON_Y;

    const bg = this.add.graphics().setDepth(7100);
    drawPanel(bg, x, y, ICON_SIZE, ICON_SIZE, { radius: RADIUS.card });
    this._iconBg = bg;

    if (this.textures.exists(BACKPACK_KEY)) {
      const img = this.add.image(x + ICON_SIZE / 2, y + ICON_SIZE / 2, BACKPACK_KEY)
        .setOrigin(0.5)
        .setDepth(7101);
      const tex = this.textures.get(BACKPACK_KEY).getSourceImage();
      img.setScale(((ICON_SIZE - 8) * BACKPACK_OVERSCALE) / tex.height);
      this._iconImg = img;
    } else {
      this._iconLabel = this.add.text(x + ICON_SIZE / 2, y + ICON_SIZE / 2, 'bag', {
        fontFamily: TYPE.family,
        fontSize: '22px',
        color: COL.inkHex
      }).setOrigin(0.5).setDepth(7101);
    }

    const zone = this.add.zone(x, y, ICON_SIZE, ICON_SIZE).setOrigin(0, 0);
    zone.setInteractive({ useHandCursor: true });
    zone.setDepth(7102);
    // Hover: redraw with brighter fill alpha; pointer leaves: redraw normal.
    const redrawAlpha = (alpha) => {
      bg.clear();
      drawPanel(bg, x, y, ICON_SIZE, ICON_SIZE, { radius: RADIUS.card, fillAlpha: alpha });
    };
    zone.on('pointerover', () => redrawAlpha(1.0));
    zone.on('pointerout',  () => redrawAlpha(0.96));
    zone.on('pointerup', () => {
      // Tiny dip-and-spring on click — feels like a real button.
      this.tweens.add({
        targets: this._iconImg ?? this._iconLabel,
        scale: { from: (this._iconImg?.scale ?? 1) * 0.92, to: this._iconImg?.scale ?? 1 },
        duration: ANIM.press,
        ease: 'Back.easeOut'
      });
      this._userToggled = !this.open;
      this.open = !this.open;
      this._cancelAutoHide();
      this._renderPanel();
    });
    this._iconZone = zone;
    /* eslint-enable no-unreachable */
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
    const totalH = SLOT_SIZE + PANEL_PADDING * 2 + 36;
    const x = (width - totalW) / 2;
    const yResting = height - totalH - 16;

    // Modal backdrop — only when opened via the Adventure Book.
    // Tapping anywhere outside the panel closes it. The auto-show
    // drawer (on item pickup) does NOT have a backdrop so the kid
    // doesn't have to dismiss it before keeping playing.
    if (this._modal) {
      const veil = this.add.graphics().setDepth(6990);
      veil.fillStyle(COL.ink, 0.35);
      veil.fillRect(0, 0, width, height);
      this._slotImages.push(veil);

      const outsideBlocker = this.add.zone(0, 0, width, height).setOrigin(0, 0).setDepth(6991);
      outsideBlocker.setInteractive();
      outsideBlocker.on('pointerup', () => this.closePanel());
      this._slotImages.push(outsideBlocker);
    }

    drawPanel(this._panelG, x, yResting, totalW, totalH, { radius: RADIUS.panel });

    const title = this.add.text(x + totalW / 2, yResting + 16, "Amelia's bag", {
      fontFamily: TYPE.family,
      fontSize: `${TYPE.heading}px`,
      color: COL.inkHex
    }).setOrigin(0.5, 0).setDepth(7001);
    this._slotImages.push(title);

    // Close X (top-right of the panel) — visible in modal mode so
    // the kid has an explicit "close" target too.
    if (this._modal) {
      const closeX = x + totalW - 36;
      const closeY = yResting + 8;
      const closeBg = this.add.graphics().setDepth(7001);
      drawPanel(closeBg, closeX, closeY, 28, 28, { radius: RADIUS.pill, fill: COL.paper });
      const closeLabel = this.add.text(closeX + 14, closeY + 14, '✕', {
        fontFamily: TYPE.family,
        fontSize: '18px',
        color: COL.inkHex
      }).setOrigin(0.5).setDepth(7002);
      const closeZone = this.add.zone(closeX, closeY, 28, 28).setOrigin(0, 0).setDepth(7003);
      closeZone.setInteractive({ useHandCursor: true });
      closeZone.on('pointerup', (pointer, lx, ly, evt) => {
        evt?.stopPropagation?.();
        this.closePanel();
      });
      this._slotImages.push(closeBg, closeLabel, closeZone);
    }

    if (items.length === 0) {
      const empty = this.add.text(x + totalW / 2, yResting + 16 + SLOT_SIZE / 2 + PANEL_PADDING, '(empty so far)', {
        fontFamily: TYPE.bodyFamily,
        fontSize: `${TYPE.body}px`,
        color: COL.inkSoft
      }).setOrigin(0.5).setDepth(7001);
      this._slotImages.push(empty);
      this._slidePanelIn(this._panelG, this._slotImages, yResting);
      return;
    }

    const y = yResting;
    items.forEach((item, i) => {
      const key = item.key;
      const count = item.count;
      if (!this.textures.exists(key)) return;
      const cx = x + PANEL_PADDING + i * (SLOT_SIZE + SLOT_GAP) + SLOT_SIZE / 2;
      const cy = y + 36 + PANEL_PADDING + SLOT_SIZE / 2;

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
    // captures clicks (so taps don't fall through to the game scene
    // below and re-collect things).
    const blocker = this.add.zone(x, y, totalW, totalH).setOrigin(0, 0);
    blocker.setInteractive();
    blocker.setDepth(7000); // below items (which are 7001) but above gameplay
    this._slotImages.push(blocker);

    this._slidePanelIn(this._panelG, this._slotImages, y);
  }

  /**
   * Slide the inventory panel up from the bottom of the screen with a
   * gentle ease, so opening the bag feels like a *drawer*. Called once
   * per render. No-op under reduced-motion.
   */
  _slidePanelIn(panelG, items, restingY) {
    const SLIDE = 32; // pixels offset from rest
    const all = [panelG, ...items];
    all.forEach((o) => {
      o.y = (o.y ?? 0) + SLIDE;
      o.alpha = 0;
    });
    this.tweens.add({
      targets: all,
      y: '-=' + SLIDE,
      alpha: 1,
      duration: ANIM.panelOpen,
      ease: 'Sine.easeOut'
    });
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

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

const TOAST_W = 720;
const TOAST_H = 280;
const TOAST_GEM_KEY = 'gem_5';   // visual icon for "+N gems"

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

    // For each newly completed quest, enqueue a toast and auto-grant
    // the gem reward (so the kid sees gems fly into the counter
    // immediately — the math reveal and the toast share the moment).
    // Toasts QUEUE (one at a time): two quests completing in quick
    // succession used to draw their toasts on top of each other and
    // the text became a jumble. Now they appear in order, each
    // clearly readable, with a small gap between.
    if (evt.newlyCompleted?.length) {
      for (const entry of evt.newlyCompleted) {
        this._enqueueToast(entry.def);
        const reward = entry.def.reward || 0;
        // CRITICAL: defer the gemBag.add by one frame.
        //
        // We're being called *inside* gemBag.add's own listener loop
        // (the kid collected a gem → main.js fired quests.report →
        // we got here). Calling gemBag.add synchronously now would
        // recurse: the recursive add mutates gemBag.total, fires all
        // listeners again with the reward, and then the outer add's
        // remaining listeners (notably GemHUD's batch handler) read a
        // mutated gemBag.total via `newTotal`. The result is a tangle
        // of out-of-order events that produced the "double equation"
        // bug. Deferring by one frame lets the outer add's loop
        // finish first; then the reward arrives as a fresh, in-order
        // event that joins the kid's still-open batch cleanly.
        if (reward > 0 && this.gemBag) {
          this.time.delayedCall(0, () => this.gemBag.add('gem_5', reward));
        }
        this.questManager.claim(entry.def.id);
      }
    }
  }

  /** Push a quest-complete toast onto the queue. If nothing's
   *  currently showing, also kick off the next toast immediately. */
  _enqueueToast(def) {
    if (!this._toastQueue) this._toastQueue = [];
    this._toastQueue.push(def);
    if (!this._toastActive) this._processToastQueue();
  }

  _processToastQueue() {
    if (!this._toastQueue || this._toastQueue.length === 0) {
      this._toastActive = false;
      return;
    }
    this._toastActive = true;
    const def = this._toastQueue.shift();
    this._renderToast(def);
  }

  _renderToast(def) {
    const { width, height } = this.scale;
    // Center of the screen, not under the gem HUD — that way the
    // kid can SEE the gem counter ticking up while the toast holds.
    const cx = width / 2;
    const cy = height / 2;
    const x = cx - TOAST_W / 2;
    const yResting = cy - TOAST_H / 2;

    const items = [];

    // 1. Bursting starburst halo BEHIND the panel — golden glow that
    //    expands and fades. First fanfare beat.
    const halo = this.add.graphics().setDepth(8780);
    halo.fillStyle(COL.gold, 0.9);
    halo.fillCircle(cx, cy, 60);
    items.push(halo);
    this.tweens.add({
      targets: halo,
      scale: { from: 0.4, to: 6 },
      alpha: { from: 0.85, to: 0 },
      duration: 900,
      ease: 'Sine.easeOut'
    });

    // 2. The toast panel itself (drop shadow + warm gold fill).
    const bg = this.add.graphics().setDepth(8800);
    drawPanel(bg, x, yResting, TOAST_W, TOAST_H, {
      radius: RADIUS.panel,
      fill: COL.gold,
      fillAlpha: 0.98
    });
    items.push(bg);

    // 3. Headline: "★ Quest done! ★"
    const headline = this.add.text(cx, yResting + 28, '★  Quest done!  ★', {
      fontFamily: TYPE.family,
      fontSize: '38px',
      color: COL.orangeHex
    }).setOrigin(0.5, 0).setDepth(8801);
    items.push(headline);

    // 4. Quest title.
    const title = this.add.text(cx, yResting + 86, `"${def.title}"`, {
      fontFamily: TYPE.family,
      fontSize: '26px',
      color: COL.inkHex,
      align: 'center',
      wordWrap: { width: TOAST_W - 60 }
    }).setOrigin(0.5, 0).setDepth(8801);
    items.push(title);

    // 5. Reward row — gem icon + "+N gems" rendered as a chip so
    //    the kid clearly *sees* what they get.
    const rewardRowY = yResting + TOAST_H - 78;
    const rewardLabel = this.add.text(0, 0, `+${def.reward} gems`, {
      fontFamily: TYPE.family,
      fontSize: '32px',
      color: '#ffffff',
      stroke: COL.inkHex,
      strokeThickness: 4
    }).setOrigin(0, 0.5).setDepth(8802);

    let gemIcon = null;
    let gemNaturalScale = 1;
    let rowW = rewardLabel.width;
    if (this.textures.exists(TOAST_GEM_KEY)) {
      gemIcon = this.add.image(0, rewardRowY, TOAST_GEM_KEY).setOrigin(0.5).setDepth(8802);
      const tex = this.textures.get(TOAST_GEM_KEY).getSourceImage();
      gemNaturalScale = 56 / tex.height;
      gemIcon.setScale(gemNaturalScale);
      rowW = gemIcon.displayWidth + 14 + rewardLabel.width;
    }
    const rowStartX = cx - rowW / 2;
    if (gemIcon) {
      gemIcon.setX(rowStartX + gemIcon.displayWidth / 2);
      rewardLabel.setX(rowStartX + gemIcon.displayWidth + 14);
    } else {
      rewardLabel.setX(rowStartX);
    }
    rewardLabel.setY(rewardRowY);
    if (gemIcon) items.push(gemIcon);
    items.push(rewardLabel);

    // 6. Drop-in fanfare. The panel bg fades in flat (it's drawn
    //    in absolute coords, so scaling would mis-position it).
    //    Headline + title + reward scale-pop in for celebration.
    bg.alpha = 0;
    this.tweens.add({ targets: bg, alpha: 1, duration: 320, ease: 'Sine.easeOut' });

    const popItems = [
      { obj: headline,    base: 1 },
      { obj: title,       base: 1 },
      { obj: rewardLabel, base: 1 }
    ];
    if (gemIcon) popItems.push({ obj: gemIcon, base: gemNaturalScale });
    popItems.forEach(({ obj, base }) => {
      obj.alpha = 0;
      obj.setScale(base * 0.7);
      this.tweens.add({
        targets: obj,
        alpha: 1,
        scale: base,
        duration: 480,
        ease: 'Back.easeOut'
      });
    });

    // 7. Confetti — small coloured circles bursting from the centre.
    const confettiColours = [COL.orange, COL.pink, COL.gold, COL.green, 0xc8e7ff];
    const confettiPieces = [];
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2 + Math.random() * 0.3;
      const dist = 200 + Math.random() * 160;
      const colour = confettiColours[i % confettiColours.length];
      const piece = this.add.circle(cx, cy, 6 + Math.random() * 4, colour, 1).setDepth(8803);
      confettiPieces.push(piece);
      this.tweens.add({
        targets: piece,
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist + 60, // gentle gravity
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 0.4 },
        duration: 1100 + Math.random() * 400,
        ease: 'Quad.easeOut',
        onComplete: () => piece.destroy()
      });
    }

    // 8. Gentle bobble on the headline while it holds — keeps the
    //    moment feeling alive.
    this.tweens.add({
      targets: headline,
      y: headline.y - 6,
      duration: 700,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
      delay: 480
    });

    // 9. Small star sparkle pulse on the gem icon to draw the eye to
    //    the reward — the *thing the kid is getting*.
    if (gemIcon) {
      this.tweens.add({
        targets: gemIcon,
        scale: { from: gemNaturalScale, to: gemNaturalScale * 1.18 },
        duration: 360,
        yoyo: true,
        repeat: 3,
        ease: 'Sine.easeInOut',
        delay: 600
      });
    }

    // 10. Hold longer than before (3.5s) — there's more to read, and
    //     the kid needs time to spot the gem reward. After the fade,
    //     a small gap (320ms) before the next toast plays so two
    //     pop-ups don't bleed into each other when several quests
    //     complete back-to-back.
    this.time.delayedCall(3500, () => {
      this.tweens.add({
        targets: items,
        alpha: 0,
        y: '-=12',
        duration: ANIM.toast,
        ease: 'Sine.easeIn',
        onComplete: () => {
          items.forEach((o) => o.destroy());
          this.time.delayedCall(320, () => this._processToastQueue());
        }
      });
    });
  }

  _renderPanel() {
    this._panelG.clear();
    for (const o of this._panelItems) o.destroy();
    this._panelItems = [];
    this._teardownScroll();
    if (!this.open) return;

    const list = this.questManager.list();
    const { height } = this.scale;
    const x = ICON_X;
    const y = ICON_Y + ICON_SIZE + 8;

    // Panel grows to fill available vertical room (capped). Quests
    // beyond the visible area are reachable via scroll.
    const panelH = Math.min(height - y - 24, 700);
    const headerH = 56;
    const footerPad = 16;
    const visibleH = panelH - headerH - footerPad;

    drawPanel(this._panelG, x, y, PANEL_W, panelH, { radius: RADIUS.panel });

    const title = this.add.text(x + PANEL_W / 2, y + 16, "Quests", {
      fontFamily: TYPE.family,
      fontSize: `${TYPE.heading}px`,
      color: COL.inkHex
    }).setOrigin(0.5, 0).setDepth(7601);
    this._panelItems.push(title);

    // Completed/total chip just under the title — quick "how am I doing"
    // glance for the parent.
    const completed = this.questManager.completedCount();
    const totalQ = list.length;
    const summary = this.add.text(x + PANEL_W / 2, y + 44, `${completed} / ${totalQ} done`, {
      fontFamily: TYPE.bodyFamily,
      fontSize: `${TYPE.caption}px`,
      color: COL.inkSoft
    }).setOrigin(0.5, 0).setDepth(7601);
    this._panelItems.push(summary);

    // Container holds every row. Scrolling = adjusting container.y.
    const rowsTopY = y + headerH;
    const rowContainer = this.add.container(0, 0).setDepth(7601);
    this._rowContainer = rowContainer;

    let rowY = rowsTopY;
    for (let i = 0; i < list.length; i++) {
      this._buildRow(rowContainer, list[i], x + ROW_PADDING_X, rowY, PANEL_W - ROW_PADDING_X * 2);
      rowY += ROW_H + ROW_GAP;
    }

    const totalContentH = rowY - rowsTopY;
    this._scrollOffset = 0;
    this._maxScroll = Math.max(0, totalContentH - visibleH);

    // Geometry mask clips the rows to the visible area. The mask
    // graphics is created via `make` (not added to the scene) — it
    // exists only as a stencil shape.
    const maskG = this.make.graphics({ x: 0, y: 0, add: false });
    maskG.fillStyle(0xffffff);
    maskG.fillRect(x, rowsTopY, PANEL_W, visibleH);
    rowContainer.setMask(maskG.createGeometryMask());
    this._scrollMaskGfx = maskG;

    // Scrollbar (right edge) — only visible when content overflows.
    if (this._maxScroll > 0) {
      this._buildScrollbar(x, rowsTopY, PANEL_W, visibleH);
      this._wireScrollInput(x, rowsTopY, PANEL_W, visibleH);
    }

    this._panelItems.push(rowContainer);
    if (this._scrollbarTrack) this._panelItems.push(this._scrollbarTrack);
    if (this._scrollbarThumb) this._panelItems.push(this._scrollbarThumb);

    // Slide the panel down from the icon.
    this._slideDown(this._panelG, this._panelItems, y);
  }

  /** Add one row's visuals into the row container. Coordinates are
   *  absolute (scene-space) — the container itself is at (0, 0) and
   *  pans by changing container.y, with the mask clipping content. */
  _buildRow(container, entry, rowX, rowY, rowW) {
    const def = entry.def;

    // Row background tinted by completion state.
    const bg = this.add.graphics();
    const rowColour = entry.completed ? COL.green : COL.gold;
    bg.fillStyle(rowColour, 0.5);
    bg.fillRoundedRect(rowX, rowY, rowW, ROW_H, RADIUS.chip);
    container.add(bg);

    const titleText = entry.completed ? `✓  ${def.title}` : def.title;
    const t = this.add.text(rowX + 12, rowY + 8, titleText, {
      fontFamily: TYPE.family,
      fontSize: '20px',
      color: COL.inkHex,
      wordWrap: { width: rowW - 160, useAdvancedWrap: true }
    }).setOrigin(0, 0);
    container.add(t);

    const descText = entry.completed
      ? `(+${def.reward} gems — collected)`
      : def.desc;
    const p = this.add.text(rowX + 12, rowY + 36, descText, {
      fontFamily: TYPE.bodyFamily,
      fontSize: `${TYPE.caption}px`,
      color: COL.inkSoft,
      wordWrap: { width: rowW - 160, useAdvancedWrap: true }
    }).setOrigin(0, 0);
    container.add(p);

    if (!entry.completed) {
      const barW = 130;
      const barH = 14;
      const barX = rowX + rowW - barW - 12;
      const barY = rowY + ROW_H / 2 - barH / 2;
      const fill = Math.max(0, Math.min(1, entry.progress / def.target));

      const bar = this.add.graphics();
      bar.fillStyle(COL.ink, 0.18);
      bar.fillRoundedRect(barX, barY, barW, barH, barH / 2);
      bar.fillStyle(COL.orange, 1);
      bar.fillRoundedRect(barX, barY, Math.max(barH, barW * fill), barH, barH / 2);
      container.add(bar);

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
      ).setOrigin(0.5);
      container.add(progressLabel);
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
      ).setOrigin(1, 0.5);
      container.add(rewardChip);
    }
  }

  /** Build the scrollbar (right edge of the panel). */
  _buildScrollbar(panelX, areaY, panelW, areaH) {
    const trackX = panelX + panelW - 16;
    const trackW = 6;
    const trackY = areaY + 4;
    const trackH = areaH - 8;

    const track = this.add.graphics().setDepth(7604);
    track.fillStyle(COL.ink, 0.12);
    track.fillRoundedRect(trackX, trackY, trackW, trackH, trackW / 2);
    this._scrollbarTrack = track;

    const thumb = this.add.graphics().setDepth(7605);
    this._scrollbarThumb = thumb;
    this._scrollbarBounds = { trackX, trackW, trackY, trackH };
    this._renderScrollbarThumb();
  }

  _renderScrollbarThumb() {
    if (!this._scrollbarThumb || !this._scrollbarBounds) return;
    const { trackX, trackW, trackY, trackH } = this._scrollbarBounds;
    const visibleFrac = trackH / (trackH + this._maxScroll);
    const thumbH = Math.max(28, trackH * visibleFrac);
    const thumbY = trackY + (trackH - thumbH) * (this._scrollOffset / this._maxScroll || 0);
    this._scrollbarThumb.clear();
    this._scrollbarThumb.fillStyle(COL.orange, 0.85);
    this._scrollbarThumb.fillRoundedRect(trackX, thumbY, trackW, thumbH, trackW / 2);
  }

  /** Mouse wheel + drag scrolling on the panel area. */
  _wireScrollInput(panelX, areaY, panelW, areaH) {
    // An invisible zone over the rows area catches drags + signals
    // "wheel within the panel" by tracking pointerover state.
    const zone = this.add.zone(panelX, areaY, panelW, areaH).setOrigin(0, 0);
    zone.setInteractive({ useHandCursor: false, draggable: true });
    zone.setDepth(7600); // below everything else
    this._scrollZone = zone;

    let dragStartY = 0;
    let dragStartOffset = 0;
    zone.on('pointerdown', (pointer) => {
      dragStartY = pointer.y;
      dragStartOffset = this._scrollOffset;
    });
    zone.on('pointermove', (pointer) => {
      if (pointer.isDown) {
        const dy = dragStartY - pointer.y;
        this._setScroll(dragStartOffset + dy);
      }
    });

    // Wheel anywhere over the panel scrolls.
    this._wheelHandler = (pointer, gameObjects, dx, dy) => {
      const px = pointer.x, py = pointer.y;
      if (px < panelX || px > panelX + panelW) return;
      if (py < areaY || py > areaY + areaH) return;
      this._setScroll(this._scrollOffset + dy * 0.5);
    };
    this.input.on('wheel', this._wheelHandler);
  }

  _setScroll(v) {
    const next = Math.max(0, Math.min(this._maxScroll, v));
    if (next === this._scrollOffset) return;
    this._scrollOffset = next;
    if (this._rowContainer) this._rowContainer.y = -next;
    this._renderScrollbarThumb();
  }

  _teardownScroll() {
    if (this._wheelHandler) {
      this.input.off('wheel', this._wheelHandler);
      this._wheelHandler = null;
    }
    if (this._scrollZone) { this._scrollZone.destroy(); this._scrollZone = null; }
    if (this._scrollbarTrack) { this._scrollbarTrack.destroy(); this._scrollbarTrack = null; }
    if (this._scrollbarThumb) { this._scrollbarThumb.destroy(); this._scrollbarThumb = null; }
    if (this._rowContainer) { this._rowContainer.destroy(); this._rowContainer = null; }
    if (this._scrollMaskGfx) { this._scrollMaskGfx.destroy(); this._scrollMaskGfx = null; }
    this._scrollOffset = 0;
    this._maxScroll = 0;
    this._scrollbarBounds = null;
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

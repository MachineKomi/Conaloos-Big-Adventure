/**
 * GlobalUIScene — corner controls.
 *
 * v1.15 reorg:
 *   - Top-LEFT: 📖 *Adventure Book* — a single icon that, on tap,
 *     opens a 4-chip menu: Items / Quests / Buddies / 🏠 Home.
 *     This consolidates what used to be the bag icon, the star
 *     icon, the burger-menu "buddies" entry, and the burger-menu
 *     "warp home" entry. One place for "the kid's stuff".
 *   - Top-RIGHT: ⚙ *Settings* cog — was the burger. Now only
 *     holds sound + text-size toggles.
 *   - Auto-show behaviour for the inventory drawer (on item
 *     collect) and the quest-complete toast still fire from the
 *     InventoryScene and QuestHUDScene respectively; those scenes
 *     just no longer draw their own permanent icon (the Adventure
 *     Book owns those entry points).
 */

import Phaser from 'phaser';
import { Accessibility } from './Accessibility.js';
import { COL, RADIUS, STROKE, TOPBAR, TYPE, ANIM, drawPanel } from './UITokens.js';
import { getSpecies, computeStats, expForNextLevel } from '../content/buddySpecies.js';
import { typeEmoji } from '../content/typeChart.js';

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
    this._bookExpanded = false;
    this._settingsExpanded = false;
    this._bookItems = [];
    this._settingsItems = [];
  }

  init({ router, buddyTeam } = {}) {
    this.router = router || this.router;
    this.buddyTeam = buddyTeam || this.buddyTeam;
  }

  create() {
    this._buildAdventureBookIcon();
    this._buildSettingsIcon();
    this.scale.on('resize', () => this._reposition());
    Accessibility.on(() => this._refreshSettingsLabels());
    this.scene.bringToTop();
  }

  // ─────────────────── Adventure Book (top-left) ───────────────────

  _buildAdventureBookIcon() {
    if (this._bookBtn) {
      this._bookBtn.bg?.destroy();
      this._bookBtn.icon?.destroy();
      this._bookBtn.zone?.destroy();
    }

    const x = TOPBAR.paddingX;
    const y = TOPBAR.paddingTop;

    const bg = this.add.graphics().setDepth(UI_DEPTH);
    drawPanel(bg, x, y, BURGER_SIZE, BURGER_SIZE, { radius: RADIUS.card });

    // Book glyph — 📖 emoji renders cleanly in modern browsers and
    // reads as a book at a glance. Fallback to drawn lines if the
    // emoji font is missing in some environment.
    const icon = this.add.text(x + BURGER_SIZE / 2, y + BURGER_SIZE / 2, '📖', {
      fontFamily: TYPE.family,
      fontSize: '40px',
      color: COL.inkHex
    }).setOrigin(0.5).setDepth(UI_DEPTH + 1);

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
      // Open the four-chip menu (or close it if already open).
      this._bookExpanded = !this._bookExpanded;
      // Close the other menu if open — only one drops down at a
      // time so the kid doesn't see two stacks.
      this._settingsExpanded = false;
      this._renderSettingsItems();
      this._renderBookItems();
    });

    this._bookBtn = { bg, icon, zone, x, y };
  }

  _renderBookItems() {
    for (const item of this._bookItems) {
      item.bg?.destroy();
      item.label?.destroy();
      item.icon?.destroy();
      item.zone?.destroy();
    }
    this._bookItems = [];
    if (!this._bookExpanded) return;

    const baseX = TOPBAR.paddingX;
    let y = TOPBAR.paddingTop + BURGER_SIZE + ITEM_GAP;

    const buttons = [
      { glyph: '📦', label: 'items',   onClick: () => this._openItems() },
      { glyph: '⭐', label: 'quests',  onClick: () => this._openQuests() },
      { glyph: '✦',  label: 'buddies', onClick: () => this._openRoster() },
      { glyph: '🏠', label: 'warp home', onClick: () => this.router?.goHome?.() }
    ];

    const slidIn = [];
    for (const def of buttons) {
      const item = this._makeItem(baseX, y, def.glyph, def.label, def.onClick, /*closeAfter=*/true);
      this._bookItems.push(item);
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

  _openItems() {
    const inv = this.scene.manager.getScene('global:inventory');
    inv?.openPanel?.();
  }
  _openQuests() {
    const quests = this.scene.manager.getScene('global:questhud');
    quests?.openPanel?.();
  }

  // ─────────────────── Settings (top-right) ───────────────────

  _buildSettingsIcon() {
    if (this._cogBtn) {
      this._cogBtn.bg?.destroy();
      this._cogBtn.icon?.destroy();
      this._cogBtn.zone?.destroy();
    }

    const x = this.scale.width - TOPBAR.paddingX - BURGER_SIZE;
    const y = TOPBAR.paddingTop;

    const bg = this.add.graphics().setDepth(UI_DEPTH);
    drawPanel(bg, x, y, BURGER_SIZE, BURGER_SIZE, { radius: RADIUS.card });

    const icon = this.add.text(x + BURGER_SIZE / 2, y + BURGER_SIZE / 2, '⚙', {
      fontFamily: TYPE.family,
      fontSize: '44px',
      color: COL.inkHex
    }).setOrigin(0.5).setDepth(UI_DEPTH + 1);

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
        angle: '+=30',
        duration: ANIM.press,
        ease: 'Back.easeOut'
      });
      this._settingsExpanded = !this._settingsExpanded;
      this._bookExpanded = false;
      this._renderBookItems();
      this._renderSettingsItems();
    });

    this._cogBtn = { bg, icon, zone, x, y };
  }

  _renderSettingsItems() {
    for (const item of this._settingsItems) {
      item.bg?.destroy();
      item.label?.destroy();
      item.icon?.destroy();
      item.zone?.destroy();
    }
    this._settingsItems = [];
    if (!this._settingsExpanded) return;

    const baseX = this.scale.width - TOPBAR.paddingX - ITEM_W;
    let y = TOPBAR.paddingTop + BURGER_SIZE + ITEM_GAP;

    const buttons = [
      { glyph: '♪', label: this._soundLabel(), onClick: () => Accessibility.toggleMuted() },
      { glyph: 'A', label: this._textLabel(),  onClick: () => Accessibility.cycleTextSize() }
    ];

    const slidIn = [];
    for (const def of buttons) {
      const item = this._makeItem(baseX, y, def.glyph, def.label, def.onClick, /*closeAfter=*/false);
      this._settingsItems.push(item);
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

  _reposition() {
    this._buildAdventureBookIcon();
    this._buildSettingsIcon();
    this._renderBookItems();
    this._renderSettingsItems();
  }

  _makeItem(x, y, glyph, labelText, onClick, closeAfter) {
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
      this.tweens.add({
        targets: [iconText, label],
        scale: { from: 0.94, to: 1.0 },
        duration: ANIM.press,
        ease: 'Back.easeOut'
      });
      onClick();
      this._refreshSettingsLabels();
      // For Adventure Book actions (closeAfter=true), close the
      // menu after the kid taps — they're moving on to the panel
      // we just opened (or warping home). For settings (toggles),
      // keep the menu open so the kid can flip multiple settings.
      if (closeAfter) {
        this._bookExpanded = false;
        this._renderBookItems();
      }
    });

    return { bg, icon: iconText, label, zone };
  }

  _soundLabel() { return Accessibility.muted ? 'sound: off' : 'sound: on'; }
  _textLabel()  { return `text: ${Accessibility.textSize.toLowerCase()}`; }

  _refreshSettingsLabels() {
    if (this._settingsItems.length < 2) return;
    this._settingsItems[0]?.label?.setText(this._soundLabel());
    this._settingsItems[1]?.label?.setText(this._textLabel());
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
    // Collapse both top-bar dropdowns so the modal doesn't sit
    // beside a stack of chips.
    this._bookExpanded = false;
    this._settingsExpanded = false;
    this._renderBookItems();
    this._renderSettingsItems();

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

      const lvl = this.add.text(cx + cardW / 2, cy + cardH - 56, `Lv${buddy.level}`, {
        fontFamily: TYPE.family,
        fontSize: '18px',
        color: COL.orangeHex
      }).setOrigin(0.5, 0).setDepth(UI_DEPTH + 63);
      items.push(lvl);

      // Mini EXP bar so the parent + kid can see how close each
      // buddy is to levelling up at a glance.
      const expNeeded = expForNextLevel(buddy.level);
      const expFrac = Math.max(0, Math.min(1, buddy.exp / expNeeded));
      const barW = cardW - 32;
      const barH = 8;
      const barX = cx + 16;
      const barY = cy + cardH - 28;
      const expBg = this.add.graphics().setDepth(UI_DEPTH + 63);
      expBg.fillStyle(COL.ink, 0.18);
      expBg.fillRoundedRect(barX, barY, barW, barH, barH / 2);
      const expFill = this.add.graphics().setDepth(UI_DEPTH + 64);
      expFill.fillStyle(0xffd24a, 1);
      expFill.fillRoundedRect(barX, barY, Math.max(barH, barW * expFrac), barH, barH / 2);
      items.push(expBg, expFill);

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
      // Tap card -> open the detail view (bio + stats + moves +
      // "set as my buddy" button). v1.13 used to just set active
      // on tap, but the kid had no way to see what each buddy was
      // good at. The detail view fixes that.
      zone.on('pointerup', () => this._openBuddyDetail(buddy, i));
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
      this._closeRosterFn = null;
      this.tweens.add({
        targets: items,
        alpha: 0,
        duration: ANIM.panelClose,
        ease: 'Sine.easeIn',
        onComplete: () => items.forEach((o) => o.destroy())
      });
    };
    // Expose so the detail view can dismiss BOTH layers when the
    // kid taps "Set as my buddy".
    this._closeRosterFn = closeRoster;

    // Slide in.
    for (const o of items) o.alpha = 0;
    this.tweens.add({
      targets: items,
      alpha: 1,
      duration: ANIM.panelOpen,
      ease: 'Sine.easeOut'
    });
  }

  /** Drill-down detail view for one buddy. Shows the bio (a small
   *  couplet from the species data), level + stats, and the three
   *  moves with their types + costs. Bottom-of-card "Set as my
   *  buddy" button switches the active buddy and closes both
   *  modals; a back arrow returns to the roster grid. */
  _openBuddyDetail(buddyInstance, idx) {
    const species = getSpecies(buddyInstance.speciesId);
    if (!species) return;
    const isActive = idx === this.buddyTeam._activeIdx;

    const { width, height } = this.scale;
    const items = [];

    // Layer above the roster panel.
    const veil = this.add.graphics().setDepth(UI_DEPTH + 80);
    veil.fillStyle(COL.ink, 0.5);
    veil.fillRect(0, 0, width, height);
    items.push(veil);
    const blocker = this.add.zone(0, 0, width, height).setOrigin(0, 0).setDepth(UI_DEPTH + 81);
    blocker.setInteractive();
    blocker.on('pointerup', () => closeDetail());
    items.push(blocker);

    // Detail panel.
    const cardW = 620;
    const cardH = 540;
    const cx = (width - cardW) / 2;
    const cy = (height - cardH) / 2;
    const bg = this.add.graphics().setDepth(UI_DEPTH + 90);
    drawPanel(bg, cx, cy, cardW, cardH, { radius: RADIUS.panel });
    items.push(bg);

    // Sprite left side.
    if (this.textures.exists(species.sprite)) {
      const img = this.add.image(cx + 150, cy + 200, species.sprite).setOrigin(0.5).setDepth(UI_DEPTH + 91);
      const tex = this.textures.get(species.sprite).getSourceImage();
      img.setScale(240 / tex.height);
      items.push(img);
    }

    // Type chip under the sprite.
    const typeChip = this.add.text(cx + 150, cy + 340,
      `${typeEmoji(species.type)}  ${species.type}`, {
      fontFamily: TYPE.family,
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: COL.orangeHex,
      padding: { left: 12, right: 12, top: 4, bottom: 4 }
    }).setOrigin(0.5).setDepth(UI_DEPTH + 92);
    items.push(typeChip);

    // Right side: name, level, bio, stats, moves.
    const rightX = cx + 300;
    const headline = this.add.text(rightX, cy + 28,
      `${species.displayName}  Lv${buddyInstance.level}`, {
      fontFamily: TYPE.family,
      fontSize: '34px',
      color: COL.inkHex
    }).setOrigin(0, 0).setDepth(UI_DEPTH + 91);
    items.push(headline);

    const bio = this.add.text(rightX, cy + 76, species.bio || '', {
      fontFamily: TYPE.bodyFamily,
      fontSize: '18px',
      color: COL.inkSoft,
      wordWrap: { width: cardW - 320 }
    }).setOrigin(0, 0).setDepth(UI_DEPTH + 91);
    items.push(bio);

    // Stats table.
    const stats = computeStats(buddyInstance.speciesId, buddyInstance.level);
    const expNeeded = expForNextLevel(buddyInstance.level);
    if (stats) {
      const rows = [
        ['HP',     `${stats.maxHP}`],
        ['Attack', `${Math.round(stats.atk)}`],
        ['Defense',`${Math.round(stats.def)}`],
        ['Speed',  `${Math.round(stats.spd)}`],
        ['Energy', `${stats.maxEnergy}`],
        ['XP',     `${buddyInstance.exp} / ${expNeeded} → Lv${buddyInstance.level + 1}`]
      ];
      const tableY = cy + 168;
      rows.forEach(([k, v], i) => {
        const rowY = tableY + i * 26;
        const keyText = this.add.text(rightX, rowY, k, {
          fontFamily: TYPE.family,
          fontSize: '16px',
          color: COL.inkSoft
        }).setOrigin(0, 0).setDepth(UI_DEPTH + 91);
        const valText = this.add.text(rightX + 110, rowY, v, {
          fontFamily: TYPE.family,
          fontSize: '16px',
          color: COL.inkHex
        }).setOrigin(0, 0).setDepth(UI_DEPTH + 91);
        items.push(keyText, valText);
      });
    }

    // Moves list.
    const movesY = cy + 330;
    const movesHeader = this.add.text(rightX, movesY, 'Moves', {
      fontFamily: TYPE.family,
      fontSize: '20px',
      color: COL.inkHex
    }).setOrigin(0, 0).setDepth(UI_DEPTH + 91);
    items.push(movesHeader);

    species.moves.forEach((move, i) => {
      const rowY = movesY + 32 + i * 30;
      const energyText = move.energyCost === 0 ? 'basic' : `⚡${move.energyCost}`;
      const effectText = move.effect
        ? (move.effect.kind === 'heal' ? `heals ${move.effect.amount}` : `+${move.effect.amount} ⚡`)
        : `power ${move.power}`;
      const line = `${typeEmoji(move.type)}  ${move.name}  ·  ${energyText}  ·  ${effectText}`;
      const t = this.add.text(rightX, rowY, line, {
        fontFamily: TYPE.bodyFamily,
        fontSize: '16px',
        color: COL.inkSoft
      }).setOrigin(0, 0).setDepth(UI_DEPTH + 91);
      items.push(t);
    });

    // Action button at bottom: "Set as my buddy" (or "✓ already")
    const btnW = 280;
    const btnH = 56;
    const btnX = cx + (cardW - btnW) / 2;
    const btnY = cy + cardH - btnH - 24;
    const btnBg = this.add.graphics().setDepth(UI_DEPTH + 92);
    drawPanel(btnBg, btnX, btnY, btnW, btnH, {
      radius: RADIUS.card,
      fill: isActive ? COL.paperWarm : COL.orange,
      fillAlpha: 1
    });
    items.push(btnBg);
    const btnLabel = this.add.text(btnX + btnW / 2, btnY + btnH / 2,
      isActive ? '✓ Already your buddy' : 'Set as my buddy', {
      fontFamily: TYPE.family,
      fontSize: '22px',
      color: isActive ? COL.inkHex : '#ffffff',
      stroke: isActive ? null : COL.inkHex,
      strokeThickness: isActive ? 0 : 3
    }).setOrigin(0.5).setDepth(UI_DEPTH + 93);
    items.push(btnLabel);

    if (!isActive) {
      const btnZone = this.add.zone(btnX, btnY, btnW, btnH).setOrigin(0, 0).setDepth(UI_DEPTH + 94);
      btnZone.setInteractive({ useHandCursor: true });
      btnZone.on('pointerup', () => {
        this.buddyTeam.setActiveIdx(idx);
        // Close BOTH layers — the kid picked, we're done.
        closeDetail();
        this._closeRosterFn?.();
      });
      items.push(btnZone);
    }

    // Back / close arrow top-left.
    const backX = cx + 12;
    const backY = cy + 10;
    const backBg = this.add.graphics().setDepth(UI_DEPTH + 92);
    drawPanel(backBg, backX, backY, 36, 30, { radius: RADIUS.pill, fill: COL.paper });
    items.push(backBg);
    const backLabel = this.add.text(backX + 18, backY + 15, '←', {
      fontFamily: TYPE.family,
      fontSize: '22px',
      color: COL.inkHex
    }).setOrigin(0.5).setDepth(UI_DEPTH + 93);
    items.push(backLabel);
    const backZone = this.add.zone(backX, backY, 36, 30).setOrigin(0, 0).setDepth(UI_DEPTH + 94);
    backZone.setInteractive({ useHandCursor: true });
    backZone.on('pointerup', () => closeDetail());
    items.push(backZone);

    const closeDetail = () => {
      this.tweens.add({
        targets: items,
        alpha: 0,
        duration: ANIM.panelClose,
        ease: 'Sine.easeIn',
        onComplete: () => items.forEach((o) => o.destroy())
      });
    };

    for (const o of items) o.alpha = 0;
    this.tweens.add({
      targets: items,
      alpha: 1,
      duration: ANIM.panelOpen,
      ease: 'Sine.easeOut'
    });
  }
}

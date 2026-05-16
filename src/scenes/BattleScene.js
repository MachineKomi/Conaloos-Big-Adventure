/**
 * BattleScene — Pokémon-style turn-based combat (v1.13 polish).
 *
 * Big changes vs v1.12:
 *   - Sprites are MUCH bigger and arranged with proper "platforms"
 *     (soft elliptical shadows) so they read as living things in a
 *     small stage, not tiny icons floating in space.
 *   - The basic move is 0-cost so you can never softlock yourself
 *     by running out of energy.
 *   - Animations got juicier: camera shake on heavy hits, hit-stop
 *     freeze frames on impact, bigger particle bursts, scale-pop on
 *     damage numbers, sprite flashes white on heavy hits.
 *   - Multi-buddy battles: if you have more than one buddy on your
 *     team, the next one auto-switches in when the current one
 *     faints — Pokémon-style. Battle only ends when ALL your
 *     buddies have fainted (or the opponent has).
 *   - Recruitment: winning against an NPC adds that buddy's species
 *     to your team (if you don't already have it).
 *
 * Pillar: no fail states. Losing still gives consolation gems +
 * a kind line. The "Game Over" feeling never happens — you can
 * walk away and try again.
 */

import Phaser from 'phaser';
import { COL, RADIUS, STROKE, TYPE, ANIM, drawPanel, drawDropShadow } from '../systems/UITokens.js';
import { typeMultiplier, typeEmoji } from '../content/typeChart.js';
import { expReward, expForNextLevel, getSpecies } from '../content/buddySpecies.js';

const Z = {
  veil: 11000,
  stage: 11020,
  platform: 11040,
  sprite: 11100,
  panel: 11200,
  bar: 11220,
  text: 11240,
  buttons: 11300,
  fx: 11400,
  banner: 11500,
  modal: 11600
};

// Type colours for move buttons & badges — match the chip we already
// use elsewhere for type icons. (Subtle, not gaudy.)
const TYPE_COLOUR = {
  water:  0x6fb3d4,
  nature: 0xa3c97a,
  wind:   0xd6e2f0,
  sweet:  0xf3b8c8,
  heart:  0xf28c8c
};

export class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'scene:battle', active: false });
  }

  /**
   * @param {object} data
   * @param {Array<object>} data.playerTeam       — array of BattleParticipants (filled team)
   * @param {object} data.opponentParticipant     — BattleParticipant
   * @param {string} data.previousSceneKey
   * @param {function} data.onComplete            — ({won, gems, expGained, recruited?}) => void
   * @param {object} data.services                — {audio, gemBag, quests, buddyTeam}
   * @param {string} [data.opponentLabel]
   */
  init(data) {
    // Multi-buddy team support: data.playerTeam is the full roster
    // (each entry already a battle participant). Falls back to a
    // single-participant array for backwards compatibility.
    this.playerTeam = data.playerTeam || (data.playerParticipant ? [data.playerParticipant] : []);
    this.playerIdx = 0;
    this.player = this.playerTeam[this.playerIdx];
    this.opponent = data.opponentParticipant;
    this.previousSceneKey = data.previousSceneKey;
    this.onComplete = data.onComplete || (() => {});
    this.services = data.services || {};
    this.opponentLabel = data.opponentLabel || `Wild ${this.opponent.species.displayName}`;
    this.backgroundKey = data.backgroundKey || null;
    this._battleOver = false;
    this._movesEnabled = false;
    this._allObjs = [];   // every display object — used for the exit fade
  }

  create() {
    const { width, height } = this.scale;

    // 1. Soft cinematic veil over the gameplay scene below.
    this.veil = this.add.graphics().setDepth(Z.veil);
    this.veil.fillStyle(0x3a2a14, 0.65);
    this.veil.fillRect(0, 0, width, height);
    this._allObjs.push(this.veil);

    // 2. Stage area — bigger now, with a subtle two-tone backdrop
    //    so the buddies pop against it.
    const STAGE_PAD_X = 40;
    const STAGE_PAD_TOP = 40;
    const STAGE_PAD_BOTTOM = 220; // leaves room for the move buttons
    const stageX = STAGE_PAD_X;
    const stageY = STAGE_PAD_TOP;
    const stageW = width - STAGE_PAD_X * 2;
    const stageH = height - STAGE_PAD_TOP - STAGE_PAD_BOTTOM;
    this._stageRect = { x: stageX, y: stageY, w: stageW, h: stageH };

    // Drop shadow + cream fallback fill UNDER the stage, in case
    // the background image is missing or fails to load. drawPanel
    // also draws a stroke here, but it's beneath the masked bg
    // image — we draw a *visible* stroke separately on top later.
    this.stageBg = this.add.graphics().setDepth(Z.stage);
    drawPanel(this.stageBg, stageX, stageY, stageW, stageH, {
      radius: RADIUS.panel,
      fill: COL.paper,
      fillAlpha: 0.98
    });
    this._allObjs.push(this.stageBg);

    // The scene's background image, cropped to the rounded stage
    // rect via a GeometryMask. Cover-fit so the stage feels like
    // a *window* into the world, not a sticker.
    if (this.backgroundKey && this.textures.exists(this.backgroundKey)) {
      const bgImg = this.add.image(stageX + stageW / 2, stageY + stageH / 2, this.backgroundKey)
        .setOrigin(0.5)
        .setDepth(Z.stage + 1);
      const tex = this.textures.get(this.backgroundKey).getSourceImage();
      const scale = Math.max(stageW / tex.width, stageH / tex.height);
      bgImg.setScale(scale);
      // Slight desaturation effect via dark tint blended at low
      // alpha — keeps focus on the buddies in the foreground.
      const maskG = this.make.graphics({ add: false });
      maskG.fillStyle(0xffffff);
      maskG.fillRoundedRect(stageX, stageY, stageW, stageH, RADIUS.panel);
      bgImg.setMask(maskG.createGeometryMask());
      this._stageMaskGfx = maskG;
      this._allObjs.push(bgImg);

      // A soft cream wash over the bg image to keep contrast high
      // enough that the buddies still read clearly against detailed
      // scene art. Subtle — about 22% paper.
      const wash = this.add.graphics().setDepth(Z.stage + 2);
      wash.fillStyle(COL.paper, 0.22);
      wash.fillRoundedRect(stageX, stageY, stageW, stageH, RADIUS.panel);
      this._allObjs.push(wash);
    }

    // Stroke on top so it crisps the edge of the rounded window,
    // whether or not the bg image rendered.
    this.stageStroke = this.add.graphics().setDepth(Z.stage + 3);
    this.stageStroke.lineStyle(STROKE.panel, COL.ink, 1);
    this.stageStroke.strokeRoundedRect(stageX, stageY, stageW, stageH, RADIUS.panel);
    this._allObjs.push(this.stageStroke);

    // 3. Sprite "platforms" — soft elliptical shadows the buddies
    //    stand on. Gives them weight + a sense of place.
    const oppPlatform = { x: stageX + stageW * 0.72, y: stageY + stageH * 0.50, rx: 180, ry: 30 };
    const plyPlatform = { x: stageX + stageW * 0.28, y: stageY + stageH * 0.86, rx: 220, ry: 36 };
    this._drawPlatform(oppPlatform.x, oppPlatform.y, oppPlatform.rx, oppPlatform.ry);
    this._drawPlatform(plyPlatform.x, plyPlatform.y, plyPlatform.rx, plyPlatform.ry);

    // 4. Sprites — MUCH bigger than v1.12. Opponent in the back
    //    (slightly smaller for depth feel), player in the front.
    this._oppSprite = this._renderBattleSprite(
      this.opponent.species.sprite,
      oppPlatform.x, oppPlatform.y,
      stageH * 0.46,
      true
    );
    this._plySprite = this._renderBattleSprite(
      this.player.species.sprite,
      plyPlatform.x, plyPlatform.y,
      stageH * 0.58,
      false
    );

    // 5. Stats panels — anchored to the opposite corner of each
    //    sprite so they don't crowd the action.
    this._oppPanel = this._renderStatPanel(
      stageX + 24, stageY + 24, this.opponent, this.opponentLabel
    );
    this._plyPanel = this._renderStatPanel(
      stageX + stageW - 380, stageY + stageH - 138, this.player, this._playerLabel()
    );

    // 6. Move buttons.
    this._moveButtons = [];
    this._renderMoveButtons(stageY + stageH + 30, width);

    // 7. Battle banner (announce moves + type effectiveness).
    //    NOT added to _allObjs — its alpha is managed exclusively
    //    by _showBanner (which calls tweens.killTweensOf on it).
    //    Including it in the slide-in multi-target tween would
    //    cause the very first _showBanner call to kill the
    //    slide-in tween entirely, leaving everything else stuck
    //    at alpha 0 (the v1.14 "blank battle screen" bug).
    this._banner = this.add.text(width / 2, stageY + stageH - 50, '', {
      fontFamily: TYPE.family,
      fontSize: '26px',
      color: COL.inkHex,
      align: 'center',
      backgroundColor: '#fff8e7',
      padding: { left: 22, right: 22, top: 8, bottom: 8 },
      stroke: COL.inkHex,
      strokeThickness: 1
    }).setOrigin(0.5).setDepth(Z.banner).setAlpha(0);

    // 8. Drop-in.
    this._slideIn();

    // 9. Switch to battle music. We remember the previous track so
    //    the gameplay scene's music resumes on battle exit. Quick
    //    Pick Up is brisk and energetic — fits a duel.
    this._previousMusicKey = this.services.audio?.currentMusicKey || null;
    this.services.audio?.playMusic?.('music_quick', this);

    // 10. Intro banners — written to *not* sound like Pokémon. We
    //     want the world's gentle, slightly-British voice here too.
    this._showBanner(`Here comes ${this.opponent.species.displayName}!`, 1500, () => {
      this._showBanner(`${this.player.species.displayName}, off you trot!`, 1200, () => {
        this._setMovesEnabled(true);
      });
    });

    this.services.quests?.report?.({ type: 'buddy-battle-started' });
  }

  // ─────────────────────────────── render helpers ───────────────────────────────

  _drawPlatform(cx, cy, rx, ry) {
    const g = this.add.graphics().setDepth(Z.platform);
    // Slight gradient effect with two filled ellipses.
    g.fillStyle(COL.ink, 0.10);
    g.fillEllipse(cx, cy, rx * 2, ry * 2);
    g.fillStyle(COL.ink, 0.16);
    g.fillEllipse(cx, cy, rx * 1.4, ry * 1.4);
    this._allObjs.push(g);
    return g;
  }

  _renderBattleSprite(textureKey, cx, cy, targetH, isOpponent) {
    if (!this.textures.exists(textureKey)) {
      const placeholder = this.add.circle(cx, cy, 60, COL.orange, 1).setDepth(Z.sprite);
      this._allObjs.push(placeholder);
      return placeholder;
    }
    const img = this.add.image(cx, cy, textureKey).setOrigin(0.5, 1).setDepth(Z.sprite);
    const tex = this.textures.get(textureKey).getSourceImage();
    img.setScale(targetH / tex.height);
    if (isOpponent) img.setFlipX(true);
    // Position the sprite so its feet sit on the platform centre.
    img.y = cy + 8;
    // Track "rest" position for the lunge animation to return to.
    img._restX = img.x;
    img._restY = img.y;
    // Gentle idle bob.
    this.tweens.add({
      targets: img,
      y: img.y - 10,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this._allObjs.push(img);
    return img;
  }

  _renderStatPanel(x, y, participant, label) {
    const panelW = 360;
    const hasExp = !!participant.buddyInstance;
    // Player panel gets an extra EXP bar at the bottom; opponent
    // doesn't (they're wild — no level-up state to show).
    const panelH = hasExp ? 138 : 114;
    const bg = this.add.graphics().setDepth(Z.panel);
    drawPanel(bg, x, y, panelW, panelH, { radius: RADIUS.card });
    this._allObjs.push(bg);

    const speciesLabel = `${participant.species.displayName}  ${typeEmoji(participant.species.type)}  Lv${participant.level}`;
    const nameText = this.add.text(x + 16, y + 10, speciesLabel, {
      fontFamily: TYPE.family,
      fontSize: '24px',
      color: COL.inkHex
    }).setOrigin(0, 0).setDepth(Z.text);
    this._allObjs.push(nameText);

    const ownerText = this.add.text(x + 16, y + 38, label, {
      fontFamily: TYPE.bodyFamily,
      fontSize: '16px',
      color: COL.inkSoft
    }).setOrigin(0, 0).setDepth(Z.text);
    this._allObjs.push(ownerText);

    const hpBar = this._makeBar(x + 16, y + 62, panelW - 32, 20, COL.orange, 'HP');
    const eBar  = this._makeBar(x + 16, y + 88, (panelW - 32) * 0.7, 14, 0x6fb3d4, '⚡');

    let expBar = null;
    let expLabel = null;
    if (hasExp) {
      // Skinnier EXP bar so it reads as "progress toward next level"
      // not "another vital stat".
      expBar = this._makeBar(x + 16 + 40, y + 112, panelW - 32 - 40, 12, 0xffd24a, 'XP');
      expLabel = this.add.text(x + 16, y + 112 + 6, 'XP', {
        fontFamily: TYPE.family,
        fontSize: '14px',
        color: COL.inkHex
      }).setOrigin(0, 0.5).setDepth(Z.bar + 2);
      this._allObjs.push(expLabel);
    }

    const panel = { bg, nameText, ownerText, hpBar, eBar, expBar, expLabel, participant };
    this._refreshBars(panel);
    return panel;
  }

  _makeBar(x, y, w, h, fillColour, prefix) {
    const track = this.add.graphics().setDepth(Z.bar);
    track.fillStyle(COL.ink, 0.16);
    track.fillRoundedRect(x, y, w, h, h / 2);
    track.lineStyle(2, COL.ink, 0.5);
    track.strokeRoundedRect(x, y, w, h, h / 2);
    this._allObjs.push(track);

    const fill = this.add.graphics().setDepth(Z.bar + 1);
    this._allObjs.push(fill);

    const label = this.add.text(x + w / 2, y + h / 2, '', {
      fontFamily: TYPE.family,
      fontSize: `${Math.max(11, Math.floor(h * 0.7))}px`,
      color: '#ffffff',
      stroke: COL.inkHex,
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(Z.bar + 2);
    this._allObjs.push(label);

    return { x, y, w, h, fillColour, fill, label, prefix, currentFrac: 1, track };
  }

  _refreshBars(panel) {
    const p = panel.participant;
    this._setBar(panel.hpBar, p.hp, p.maxHP, p.hp / p.maxHP < 0.3);
    this._setBar(panel.eBar, p.energy, p.maxEnergy, false);
    if (panel.expBar && p.buddyInstance) {
      const needed = expForNextLevel(p.buddyInstance.level);
      this._setBar(panel.expBar, p.buddyInstance.exp, needed, false);
    }
  }

  _setBar(bar, value, max, lowFlash = false) {
    const frac = Math.max(0, Math.min(1, value / max));
    const colour = lowFlash ? 0xd54e4e : bar.fillColour;
    this.tweens.add({
      targets: bar,
      currentFrac: frac,
      duration: 380,
      ease: 'Sine.easeOut',
      onUpdate: () => {
        bar.fill.clear();
        bar.fill.fillStyle(colour, 1);
        const fw = Math.max(bar.h, bar.w * bar.currentFrac);
        bar.fill.fillRoundedRect(bar.x, bar.y, fw, bar.h, bar.h / 2);
      }
    });
    bar.label.setText(`${Math.max(0, Math.ceil(value))} / ${Math.ceil(max)}`);
  }

  _playerLabel() {
    // If there are more buddies waiting, hint at that on the panel.
    const remaining = this.playerTeam.filter((p, i) => i > this.playerIdx && p.hp > 0).length;
    if (remaining > 0) return `Your buddy  (+${remaining} waiting)`;
    return 'Your buddy';
  }

  _renderMoveButtons(topY, sceneWidth) {
    const moves = this.player.species.moves;
    const btnW = 220;
    const btnH = 96;
    const gap = 22;
    const totalW = moves.length * btnW + (moves.length - 1) * gap;
    const startX = (sceneWidth - totalW) / 2;
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      const x = startX + i * (btnW + gap);
      this._moveButtons.push(this._makeMoveButton(x, topY, btnW, btnH, move));
    }
  }

  _makeMoveButton(x, y, w, h, move) {
    const bg = this.add.graphics().setDepth(Z.buttons);
    this._allObjs.push(bg);

    // Type-coloured stripe down the left edge of the button.
    const stripe = this.add.graphics().setDepth(Z.buttons + 1);
    this._allObjs.push(stripe);

    // Top row: type emoji + move name, big and clear.
    const titleRow = this.add.text(x + 28, y + 16,
      `${typeEmoji(move.type)}  ${move.name}`, {
      fontFamily: TYPE.family,
      fontSize: '22px',
      color: COL.inkHex
    }).setOrigin(0, 0).setDepth(Z.buttons + 2);
    this._allObjs.push(titleRow);

    // Bottom row: at-a-glance "what does this do" using symbols
    // a four-year-old can read by *shape*:
    //   ⚔  N   damage
    //   ❤  +N  heal
    //   ⚡  +N  restores energy
    //   ⚡  N   energy cost (orange)
    //   ⚡  free  zero-cost / always-available
    //
    // Damage moves show: ⚔ N  (then) ⚡ cost or "free"
    // Heal moves show:   ❤ +N (then) ⚡ cost
    // Energy moves show: ⚡ +N (then) ⚡ cost
    let primary = '';
    let primaryColour = '#a45e08';
    if (move.effect?.kind === 'heal') {
      primary = `❤  +${move.effect.amount}`;
      primaryColour = '#5a8a3a';
    } else if (move.effect?.kind === 'energy') {
      primary = `⚡  +${move.effect.amount}`;
      primaryColour = '#4a8ab3';
    } else {
      primary = `⚔  ${move.power}`;
      primaryColour = '#a45e08';
    }
    const costStr = move.energyCost === 0 ? 'free' : `⚡  ${move.energyCost}`;
    const costColour = move.energyCost === 0 ? '#5a8a3a' : '#a45e08';

    const primaryText = this.add.text(x + 28, y + h - 32, primary, {
      fontFamily: TYPE.family,
      fontSize: '20px',
      color: primaryColour
    }).setOrigin(0, 0).setDepth(Z.buttons + 2);
    this._allObjs.push(primaryText);

    const costText = this.add.text(x + w - 28, y + h - 32, costStr, {
      fontFamily: TYPE.family,
      fontSize: '20px',
      color: costColour
    }).setOrigin(1, 0).setDepth(Z.buttons + 2);
    this._allObjs.push(costText);

    const zone = this.add.zone(x, y, w, h).setOrigin(0, 0).setDepth(Z.buttons + 3);
    zone.setInteractive({ useHandCursor: true });
    this._allObjs.push(zone);

    const draw = (state) => {
      bg.clear();
      stripe.clear();
      const enabled = state !== 'disabled';
      const fill = state === 'hover' ? COL.paperWarm : COL.gold;
      drawPanel(bg, x, y, w, h, {
        radius: RADIUS.card,
        fill,
        fillAlpha: enabled ? 1 : 0.45
      });
      const stripeColour = TYPE_COLOUR[move.type] || COL.orange;
      stripe.fillStyle(stripeColour, enabled ? 1 : 0.4);
      stripe.fillRoundedRect(x + 6, y + 8, 10, h - 16, 5);
    };
    draw('disabled');

    zone.on('pointerover', () => { if (this._movesEnabled && this._canAfford(move)) draw('hover'); });
    zone.on('pointerout',  () => { if (this._movesEnabled && this._canAfford(move)) draw('idle'); });
    zone.on('pointerup',   () => {
      if (!this._movesEnabled) return;
      if (!this._canAfford(move)) {
        this._showBanner(`Not enough ⚡ for ${move.name}.`, 900);
        return;
      }
      this._setMovesEnabled(false);
      this._takeTurn(move);
    });

    return { bg, stripe, titleRow, primaryText, costText, zone, x, y, w, h, move, draw };
  }

  _canAfford(move) {
    return this.player.energy >= move.energyCost;
  }

  _setMovesEnabled(enabled) {
    this._movesEnabled = enabled;
    for (const btn of this._moveButtons) {
      const ok = enabled && this._canAfford(btn.move);
      btn.draw(ok ? 'idle' : 'disabled');
    }
  }

  _showBanner(text, ms = 1400, onDone) {
    this._banner.setText(text);
    this.tweens.killTweensOf(this._banner);
    this._banner.setAlpha(0).setScale(0.92);
    this.tweens.add({
      targets: this._banner,
      alpha: 1,
      scale: 1,
      duration: 220,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(ms, () => {
          this.tweens.add({
            targets: this._banner,
            alpha: 0,
            duration: 220,
            onComplete: () => onDone && onDone()
          });
        });
      }
    });
  }

  // ────────────────────────────── turn / combat ──────────────────────────────

  _takeTurn(playerMove) {
    if (this._battleOver) return;
    const opponentMove = this._opponentAI();
    const playerGoesFirst = this.player.spd >= this.opponent.spd;

    const plays = playerGoesFirst
      ? [{ attacker: this.player, defender: this.opponent, move: playerMove, who: 'player' },
         { attacker: this.opponent, defender: this.player, move: opponentMove, who: 'opponent' }]
      : [{ attacker: this.opponent, defender: this.player, move: opponentMove, who: 'opponent' },
         { attacker: this.player, defender: this.opponent, move: playerMove, who: 'player' }];

    this._runStep(plays, 0);
  }

  _runStep(plays, i) {
    if (this._battleOver) return;
    if (i >= plays.length) {
      // End of turn — refresh meta on buttons (afford state may
      // have changed) and re-enable input.
      this._refreshBars(this._oppPanel);
      this._refreshBars(this._plyPanel);
      this._setMovesEnabled(true);
      return;
    }
    const { attacker, defender, move, who } = plays[i];
    if (attacker.hp <= 0) {
      this._runStep(plays, i + 1);
      return;
    }
    this._performMove(attacker, defender, move, who, () => {
      if (defender.hp <= 0) {
        this._faint(defender, () => {
          // Different paths depending on whose buddy fainted.
          if (defender === this.opponent) {
            this._concludeBattle(true);
          } else {
            // Player's buddy fainted — switch to next on team, or lose.
            this._switchInOrLose();
          }
        });
        return;
      }
      this.time.delayedCall(280, () => this._runStep(plays, i + 1));
    });
  }

  _switchInOrLose() {
    // Find the next buddy on the team with HP > 0.
    let nextIdx = -1;
    for (let i = this.playerIdx + 1; i < this.playerTeam.length; i++) {
      if (this.playerTeam[i].hp > 0) { nextIdx = i; break; }
    }
    if (nextIdx === -1) {
      // No more buddies — lose.
      this._concludeBattle(false);
      return;
    }
    // Slot the next buddy in.
    this.playerIdx = nextIdx;
    this.player = this.playerTeam[nextIdx];
    this._showBanner(`${this.player.species.displayName}, your turn now!`, 1100, () => {
      // Re-render the player sprite + stat panel + move buttons.
      this._replacePlayerVisuals();
      this._setMovesEnabled(true);
    });
  }

  _replacePlayerVisuals() {
    // Destroy old sprite + panel + move buttons. CRITICAL: remove
    // them from _allObjs too — otherwise the dead refs accumulate
    // and the _exit tween targets destroyed objects, which (under
    // some conditions) freezes the scene on lose. v1.14.1 hotfix.
    const toDestroy = [];
    if (this._plySprite) toDestroy.push(this._plySprite);
    if (this._plyPanel) {
      toDestroy.push(
        this._plyPanel.bg,
        this._plyPanel.nameText,
        this._plyPanel.ownerText,
        this._plyPanel.hpBar?.track,
        this._plyPanel.hpBar?.fill,
        this._plyPanel.hpBar?.label,
        this._plyPanel.eBar?.track,
        this._plyPanel.eBar?.fill,
        this._plyPanel.eBar?.label,
        this._plyPanel.expBar?.track,
        this._plyPanel.expBar?.fill,
        this._plyPanel.expBar?.label,
        this._plyPanel.expLabel
      );
    }
    for (const b of this._moveButtons) {
      toDestroy.push(b.bg, b.stripe, b.titleRow, b.primaryText, b.costText, b.zone);
    }
    this._moveButtons = [];

    // Remove from _allObjs first, then destroy.
    const dead = new Set(toDestroy.filter(Boolean));
    this._allObjs = this._allObjs.filter((o) => !dead.has(o));
    for (const o of dead) o.destroy();

    // Re-create at the same anchor coordinates.
    const { x: sx, y: sy, w: sw, h: sh } = this._stageRect;
    const plyPlatform = { x: sx + sw * 0.28, y: sy + sh * 0.86 };
    this._plySprite = this._renderBattleSprite(
      this.player.species.sprite,
      plyPlatform.x, plyPlatform.y,
      sh * 0.58,
      false
    );
    this._plyPanel = this._renderStatPanel(
      sx + sw - 380, sy + sh - 138, this.player, this._playerLabel()
    );
    this._renderMoveButtons(sy + sh + 30, this.scale.width);
  }

  _opponentAI() {
    const moves = this.opponent.species.moves;
    const affordable = moves.filter((m) => this.opponent.energy >= m.energyCost);
    // Should always include the 0-cost basic now.
    if (affordable.length === 0) return moves[0];
    const lowHP = this.opponent.hp / this.opponent.maxHP < 0.4;
    if (lowHP) {
      const heal = affordable.find((m) => m.effect?.kind === 'heal');
      if (heal && Math.random() < 0.65) return heal;
    }
    const attackish = affordable.filter((m) => !m.effect);
    if (attackish.length > 0) {
      // 60% chance to use the heaviest affordable attack, else random.
      if (Math.random() < 0.6) {
        return attackish.reduce((a, b) => (a.power >= b.power ? a : b));
      }
      return attackish[Math.floor(Math.random() * attackish.length)];
    }
    return affordable[Math.floor(Math.random() * affordable.length)];
  }

  // ────────────────────────────── move animations ──────────────────────────────

  _performMove(attacker, defender, move, who, onDone) {
    attacker.energy = Math.max(0, attacker.energy - move.energyCost);

    const attackerSprite = (who === 'player') ? this._plySprite : this._oppSprite;
    const defenderSprite = (who === 'player') ? this._oppSprite : this._plySprite;
    const attackerPanel  = (who === 'player') ? this._plyPanel : this._oppPanel;
    const defenderPanel  = (who === 'player') ? this._oppPanel : this._plyPanel;

    this._showBanner(`${attacker.species.displayName} tries a ${move.name}!`, 800);
    this._refreshBars(attackerPanel);

    if (move.effect) {
      this.time.delayedCall(200, () => {
        this._playHealFx(attackerSprite, attacker, move.effect);
        this.time.delayedCall(700, () => {
          this._refreshBars(attackerPanel);
          onDone();
        });
      });
      return;
    }

    const hit = Math.random() < move.accuracy;
    this.time.delayedCall(200, () => {
      this._playLungeFx(attackerSprite, who);
      this.time.delayedCall(160, () => {
        if (!hit) {
          this._floatText(defenderSprite.x, defenderSprite.y - 100, 'oof — missed!', '#5a4a2a', 34);
          this.time.delayedCall(400, () => onDone());
          return;
        }
        const dmg = this._damageOf(attacker, defender, move);
        const typeMul = typeMultiplier(move.type, defender.species.type);
        defender.hp = Math.max(0, defender.hp - dmg);

        const dmgColour = typeMul > 1 ? '#d54e4e' : (typeMul < 1 ? '#7a6a4a' : COL.orangeHex);
        const dmgSize = move.fx === 'heavy' ? 64 : (typeMul > 1 ? 56 : 48);
        this._floatText(defenderSprite.x, defenderSprite.y - 100, `−${dmg}`, dmgColour, dmgSize);

        if (typeMul > 1) {
          this._showBanner('That *really* worked!', 900);
        } else if (typeMul < 1) {
          this._showBanner('Only a *little* worked.', 900);
        }

        // Heavy hit: hit-stop freeze + camera shake.
        if (move.fx === 'heavy') {
          this.cameras.main.shake(220, 0.012);
          this._hitStopFlash(defenderSprite);
        } else {
          this._playHitFx(defenderSprite, 'basic', typeMul);
        }
        this._refreshBars(defenderPanel);
        this.time.delayedCall(750, () => onDone());
      });
    });
  }

  _damageOf(attacker, defender, move) {
    const base = move.power + attacker.level * 0.4;
    const typeMul = typeMultiplier(move.type, defender.species.type);
    const defMul = Math.max(0.4, 1 - defender.def * 0.04);
    const roll = 0.85 + Math.random() * 0.30;
    return Math.max(1, Math.ceil(base * typeMul * defMul * roll));
  }

  _playLungeFx(attackerSprite, who) {
    const dx = (who === 'player') ? 60 : -60;
    const fromX = attackerSprite._restX ?? attackerSprite.x;
    attackerSprite.x = fromX;
    this.tweens.add({
      targets: attackerSprite,
      x: fromX + dx,
      duration: 130,
      ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: () => { attackerSprite.x = fromX; }
    });
  }

  _playHitFx(defenderSprite, fx, typeMul) {
    const fromX = defenderSprite._restX ?? defenderSprite.x;
    const fromY = defenderSprite._restY ?? defenderSprite.y;
    // Red tint flash on the defender.
    defenderSprite.setTint?.(0xff8484);
    this.time.delayedCall(240, () => defenderSprite.clearTint?.());
    // Shake.
    this.tweens.add({
      targets: defenderSprite,
      x: { from: fromX - 8, to: fromX + 8 },
      duration: 60,
      yoyo: true,
      repeat: 3,
      onComplete: () => { defenderSprite.x = fromX; defenderSprite.y = fromY; }
    });
    // If type was super-effective, extra impact sparkle.
    if (typeMul > 1) {
      this._burstParticles(defenderSprite.x, defenderSprite.y - 40, COL.orange, 14, 100);
    }
  }

  /** Hit-stop on heavy: freeze the frame briefly, then flash. */
  _hitStopFlash(defenderSprite) {
    const fromX = defenderSprite._restX ?? defenderSprite.x;
    const fromY = defenderSprite._restY ?? defenderSprite.y;
    // White-tint impact frame, hold briefly.
    defenderSprite.setTint?.(0xffffff);
    this.tweens.killTweensOf(defenderSprite);
    this.time.delayedCall(120, () => {
      defenderSprite.setTint?.(0xff7373);
      this.time.delayedCall(280, () => defenderSprite.clearTint?.());
      // Bigger shake after the freeze.
      this.tweens.add({
        targets: defenderSprite,
        x: { from: fromX - 14, to: fromX + 14 },
        duration: 70,
        yoyo: true,
        repeat: 4,
        onComplete: () => { defenderSprite.x = fromX; defenderSprite.y = fromY; }
      });
      // Big particle burst.
      this._burstParticles(defenderSprite.x, defenderSprite.y - 50, COL.orange, 18, 130);
    });
  }

  _playHealFx(targetSprite, target, effect) {
    if (effect.kind === 'heal') {
      const oldHP = target.hp;
      target.hp = Math.min(target.maxHP, target.hp + effect.amount);
      const gained = target.hp - oldHP;
      this._floatText(targetSprite.x, targetSprite.y - 100, `+${gained}`, '#5a8a3a', 52);
    } else if (effect.kind === 'energy') {
      const oldE = target.energy;
      target.energy = Math.min(target.maxEnergy, target.energy + effect.amount);
      const gained = target.energy - oldE;
      this._floatText(targetSprite.x, targetSprite.y - 100, `+${gained}⚡`, '#4a8ab3', 52);
    }
    // Sparkle ring around the buddy.
    const ring = this.add.graphics().setDepth(Z.fx);
    ring.lineStyle(6, 0xffe066, 1);
    ring.strokeCircle(targetSprite.x, targetSprite.y - 40, 50);
    this.tweens.add({
      targets: ring,
      scale: 2.8,
      alpha: 0,
      duration: 800,
      ease: 'Sine.easeOut',
      onComplete: () => ring.destroy()
    });
    // A few falling sparkles.
    for (let i = 0; i < 6; i++) {
      const star = this.add.text(
        targetSprite.x + (Math.random() - 0.5) * 80,
        targetSprite.y - 80 - Math.random() * 60,
        '✦',
        { fontFamily: TYPE.family, fontSize: '28px', color: '#ffd860' }
      ).setOrigin(0.5).setDepth(Z.fx);
      this.tweens.add({
        targets: star,
        y: star.y - 40,
        alpha: 0,
        duration: 800 + Math.random() * 400,
        ease: 'Sine.easeOut',
        onComplete: () => star.destroy()
      });
    }
  }

  /** A big scale-pop + rise damage number. */
  _floatText(x, y, text, colour, size = 48) {
    const t = this.add.text(x, y, text, {
      fontFamily: TYPE.family,
      fontSize: `${size}px`,
      color: colour,
      stroke: '#ffffff',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(Z.fx);
    t.setScale(0.4);
    this.tweens.add({
      targets: t,
      scale: 1.1,
      duration: 180,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: t,
          y: y - 100,
          alpha: { from: 1, to: 0 },
          scale: 1.0,
          duration: 800,
          ease: 'Sine.easeOut',
          onComplete: () => t.destroy()
        });
      }
    });
  }

  _burstParticles(x, y, colour, count, dist) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const d = dist * (0.8 + Math.random() * 0.4);
      const p = this.add.circle(x, y, 6 + Math.random() * 4, colour, 1).setDepth(Z.fx);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * d,
        y: y + Math.sin(angle) * d,
        alpha: { from: 1, to: 0 },
        scale: { from: 1.2, to: 0.3 },
        duration: 700 + Math.random() * 200,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy()
      });
    }
  }

  _faint(participant, onDone) {
    const sprite = (participant === this.player) ? this._plySprite : this._oppSprite;
    this._showBanner(`${participant.species.displayName} needs a lie-down.`, 1100);
    this.tweens.killTweensOf(sprite);
    this.tweens.add({
      targets: sprite,
      y: sprite.y + 60,
      angle: -45,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeIn',
      onComplete: () => onDone()
    });
  }

  // ─────────────────────────────── end of battle ───────────────────────────────

  _concludeBattle(playerWon) {
    if (this._battleOver) return;
    this._battleOver = true;
    this._setMovesEnabled(false);

    let gems = 0;
    let expGained = 0;
    let levelsGained = 0;
    let recruited = null;

    // EXP goes to whichever player buddy "finished it" — the
    // currently active one. (Pokémon does roughly the same; full
    // EXP-share is a v1.14 thing.)
    const finisher = this.player.buddyInstance;

    if (playerWon) {
      gems = 5 + this.opponent.level * 3;
      expGained = expReward(this.opponent.level);
      if (finisher && this.services.buddyTeam) {
        levelsGained = this.services.buddyTeam.grantExp(finisher, expGained);
        if (levelsGained > 0) {
          this.services.quests?.report?.({ type: 'buddy-leveled-up', speciesId: this.player.species.id });
        }
        // Refresh the EXP bar after grant. The _setBar tween animates
        // the fill from old to new, so the kid sees the progress.
        // For a level-up, the bar resets and continues from 0 — visible
        // as a satisfying "max out, snap, keep filling" motion.
        this._refreshBars(this._plyPanel);
        // Floating "+N EXP" near the player's panel for clarity.
        if (this._plyPanel?.bg) {
          this._floatText(this._plyPanel.bg.x + 180, this._plyPanel.bg.y + 80,
            `+${expGained} XP`, '#a08020', 36);
        }
        if (levelsGained > 0) {
          // Level-up flash near the player sprite.
          this._floatText(this._plySprite.x, this._plySprite.y - 220,
            `LV ${finisher.level}!`, '#ffb020', 64);
        }
      }
      // Recruitment: if the player doesn't already have this
      // species on their team, they get it for free at level 1.
      // (The gem reward + EXP applies regardless.)
      if (this.services.buddyTeam && !this.services.buddyTeam.has(this.opponent.species.id)) {
        const newBuddy = this.services.buddyTeam.recruit(this.opponent.species.id, 1);
        if (newBuddy) {
          recruited = this.opponent.species;
          this.services.quests?.report?.({ type: 'buddy-recruited', speciesId: newBuddy.speciesId });
        }
      }
      this.services.gemBag?.add('gem_5', gems);
      this.services.audio?.playSfx?.('sfx_jackpot');
      this.services.quests?.report?.({ type: 'buddy-battle-won', opponentSpecies: this.opponent.species.id, opponentLevel: this.opponent.level });

      // Big "you won" banner with reward summary.
      const winLine = levelsGained > 0
        ? `Hooray! +${gems} gems · +${expGained} EXP · (${finisher.speciesId} grew → Lv${finisher.level})`
        : `Hooray! +${gems} gems · +${expGained} EXP`;
      this._showBanner(winLine, 2600, () => {
        if (recruited) {
          this._showBanner(`Look — ${recruited.displayName} would like to come along! 🎉`, 2400,
            () => this._exit({ won: true, gems, expGained, levelsGained, recruited: recruited.id }));
        } else {
          this._exit({ won: true, gems, expGained, levelsGained, recruited: null });
        }
      });
    } else {
      // Consolation. No fail state. v1.16: bumped from 20% to 35%
      // so a kid who's losing still feels progress toward levelling
      // up after a few attempts.
      gems = 3;
      expGained = Math.max(8, Math.floor(expReward(this.opponent.level) * 0.35));
      if (finisher && this.services.buddyTeam) {
        levelsGained = this.services.buddyTeam.grantExp(finisher, expGained);
        if (levelsGained > 0) {
          this.services.quests?.report?.({ type: 'buddy-leveled-up', speciesId: this.player.species.id });
        }
        // Refresh the EXP bar quietly. We guard on .scene because
        // the panel may have been torn down by _replacePlayerVisuals
        // earlier in this battle and we don't want to tween a dead
        // reference (the v1.14.x lose-path freeze cause).
        if (this._plyPanel?.expBar?.fill?.scene) {
          this._refreshBars(this._plyPanel);
        }
      }
      this.services.gemBag?.add('gem_5', gems);
      this.services.audio?.playSfx?.('sfx_descend');
      this._showBanner(
        `${this.opponent.species.displayName} won this one. Here's a small gift: +${gems} gems.`,
        2400,
        () => this._exit({ won: false, gems, expGained, levelsGained, recruited: null })
      );
    }
  }

  _exit(result) {
    // Restore the gameplay scene's music before we stop the battle
    // scene — so the cross-fade overlaps the visual fade-out.
    if (this._previousMusicKey && this.services.audio) {
      this.services.audio.playMusic(this._previousMusicKey, this);
    }
    // Defensive: filter to live objects only. If _replacePlayerVisuals
    // ever leaves a dead ref in _allObjs, Phaser can freeze when it
    // tweens a destroyed target. (Lose-path freeze, v1.14.x.)
    const liveTargets = [...this._allObjs, this._banner]
      .filter((o) => o && o.scene);
    this.tweens.killTweensOf(this._banner);
    if (liveTargets.length === 0) {
      // Nothing to fade — exit immediately.
      const cb = this.onComplete;
      const prev = this.previousSceneKey;
      this.scene.stop();
      cb(result, prev);
      return;
    }
    this.tweens.add({
      targets: liveTargets,
      alpha: 0,
      duration: 320,
      ease: 'Sine.easeIn',
      onComplete: () => {
        const cb = this.onComplete;
        const prev = this.previousSceneKey;
        this.scene.stop();
        cb(result, prev);
      }
    });
  }

  _slideIn() {
    const live = this._allObjs.filter((o) => o && o.scene);
    for (const o of live) o.alpha = 0;
    this.tweens.add({
      targets: live,
      alpha: 1,
      duration: 400,
      ease: 'Sine.easeOut'
    });
  }
}

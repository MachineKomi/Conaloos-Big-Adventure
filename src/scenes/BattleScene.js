/**
 * BattleScene — the Pokémon-style turn-based combat overlay.
 *
 * Launched as an overlay scene (sleeps the underlying gameplay
 * scene; on close, wakes it back up). Single buddy per side for
 * the MVP. Player picks a move; both moves resolve in speed order;
 * animations + damage numbers play; HP bars tween; check for faint;
 * repeat until one side has 0 HP. Winner gets EXP + gems; loser
 * gets a small consolation reward (no fail states).
 *
 * Designed for 4-year-old legibility:
 *   - Three big move buttons, always visible, with energy cost.
 *   - HP and energy bars filled and labelled.
 *   - Big damage numbers, slow-ish animations.
 *   - Every tap rewards (an animation always plays, even on miss).
 */

import Phaser from 'phaser';
import { COL, RADIUS, STROKE, TYPE, ANIM, drawPanel } from '../systems/UITokens.js';
import { typeMultiplier, typeEmoji } from '../content/typeChart.js';
import { expReward } from '../content/buddySpecies.js';

const Z = {
  veil: 11000,
  panel: 11050,
  sprite: 11100,
  bar: 11200,
  text: 11250,
  buttons: 11300,
  fx: 11400,
  banner: 11500
};

const BAR_W = 280;
const BAR_H = 18;
const MOVE_BTN_W = 200;
const MOVE_BTN_H = 86;
const MOVE_BTN_GAP = 18;

export class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'scene:battle', active: false });
  }

  /**
   * @param {object} data
   * @param {object} data.playerParticipant      — from BuddyTeam.makeBattleParticipant
   * @param {object} data.opponentParticipant    — from BuddyTeam.makeOpponent
   * @param {string} data.previousSceneKey       — to wake on close
   * @param {function} data.onComplete           — ({won, gems, expGained, levelsGained}) => void
   * @param {object} data.services               — game services bag (audio, gemBag, quests, buddyTeam)
   * @param {string} [data.opponentLabel]        — e.g. "Cosenae's buddy"
   */
  init(data) {
    this.player = data.playerParticipant;
    this.opponent = data.opponentParticipant;
    this.previousSceneKey = data.previousSceneKey;
    this.onComplete = data.onComplete || (() => {});
    this.services = data.services || {};
    this.opponentLabel = data.opponentLabel || `Wild ${this.opponent.species.displayName}`;
    this._busy = false;
    this._battleOver = false;
    // Moves are disabled until the intro banner finishes so a fast
    // tap can't fire before the kid sees what's going on.
    this._movesEnabled = false;
  }

  create() {
    const { width, height } = this.scale;

    // Translucent veil over the gameplay scene below.
    this.veil = this.add.graphics().setDepth(Z.veil);
    this.veil.fillStyle(0x3a2a14, 0.55);
    this.veil.fillRect(0, 0, width, height);

    // Stage panel — the big "battle arena" backdrop.
    const stageX = 60;
    const stageY = 60;
    const stageW = width - 120;
    const stageH = height - 220;
    this.stageBg = this.add.graphics().setDepth(Z.panel);
    drawPanel(this.stageBg, stageX, stageY, stageW, stageH, {
      radius: RADIUS.panel,
      fill: COL.paper,
      fillAlpha: 0.98
    });

    // Layout: opponent top-right, player bottom-left.
    const oppCenterX = stageX + stageW * 0.70;
    const oppCenterY = stageY + stageH * 0.36;
    const plyCenterX = stageX + stageW * 0.30;
    const plyCenterY = stageY + stageH * 0.72;

    // Sprites.
    this._oppSprite = this._renderBattleSprite(this.opponent.species.sprite, oppCenterX, oppCenterY, stageH * 0.32, true);
    this._plySprite = this._renderBattleSprite(this.player.species.sprite, plyCenterX, plyCenterY, stageH * 0.42, false);

    // Stats panels (name + level + HP/energy bars).
    this._oppPanel = this._renderStatPanel(stageX + 40, stageY + 30, this.opponent, this.opponentLabel);
    this._plyPanel = this._renderStatPanel(stageX + stageW - BAR_W - 80, stageY + stageH - 100, this.player, 'Your buddy', true);

    // Move buttons below the stage.
    this._moveButtons = [];
    this._renderMoveButtons(stageY + stageH + 16, width);

    // Battle log banner (centred above the move buttons).
    this._banner = this.add.text(width / 2, stageY + stageH - 24, '', {
      fontFamily: TYPE.family,
      fontSize: '22px',
      color: COL.inkHex,
      align: 'center',
      backgroundColor: '#ffffff',
      padding: { left: 12, right: 12, top: 4, bottom: 4 }
    }).setOrigin(0.5).setDepth(Z.banner).setAlpha(0);

    // Drop-in entrance.
    this._slideIn();

    // Intro line + enable moves.
    this._showBanner(`A wild battle! ${this.opponent.species.displayName} appeared!`, 1800, () => {
      this._showBanner(`Go, ${this.player.species.displayName}!`, 1200, () => {
        this._setMovesEnabled(true);
      });
    });

    // Tell the quest tracker.
    this.services.quests?.report?.({ type: 'buddy-battle-started' });
  }

  // ──────────────────────────── render helpers ────────────────────────────

  _renderBattleSprite(textureKey, cx, cy, targetH, isOpponent) {
    if (!this.textures.exists(textureKey)) {
      // Placeholder if sprite is missing.
      const placeholder = this.add.circle(cx, cy, 40, COL.orange, 1).setDepth(Z.sprite);
      return placeholder;
    }
    const img = this.add.image(cx, cy, textureKey).setOrigin(0.5).setDepth(Z.sprite);
    const tex = this.textures.get(textureKey).getSourceImage();
    img.setScale(targetH / tex.height);
    if (isOpponent) img.setFlipX(true); // face each other
    // Gentle idle bob.
    this.tweens.add({
      targets: img,
      y: cy - 6,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    return img;
  }

  _renderStatPanel(x, y, participant, label, isPlayer = false) {
    const panelW = BAR_W + 24;
    const panelH = 90;
    const bg = this.add.graphics().setDepth(Z.panel + 1);
    drawPanel(bg, x, y, panelW, panelH, { radius: RADIUS.card });

    const speciesLabel = `${participant.species.displayName}  ${typeEmoji(participant.species.type)}  Lv${participant.level}`;
    const nameText = this.add.text(x + 12, y + 8, speciesLabel, {
      fontFamily: TYPE.family,
      fontSize: '20px',
      color: COL.inkHex
    }).setOrigin(0, 0).setDepth(Z.text);

    const ownerText = this.add.text(x + 12, y + 32, label, {
      fontFamily: TYPE.bodyFamily,
      fontSize: '14px',
      color: COL.inkSoft
    }).setOrigin(0, 0).setDepth(Z.text);

    // HP bar.
    const hpBar = this._makeBar(x + 12, y + 50, BAR_W, BAR_H, COL.orange, COL.ink);
    // Energy bar (skinnier).
    const eBar  = this._makeBar(x + 12, y + 72, BAR_W * 0.7, 12, 0x4ab3e4, COL.ink);

    const panel = { bg, nameText, ownerText, hpBar, eBar, participant };
    this._refreshBars(panel);
    return panel;
  }

  _makeBar(x, y, w, h, fillColour, strokeColour) {
    const track = this.add.graphics().setDepth(Z.bar);
    track.fillStyle(COL.ink, 0.18);
    track.fillRoundedRect(x, y, w, h, h / 2);
    track.lineStyle(2, strokeColour, 0.7);
    track.strokeRoundedRect(x, y, w, h, h / 2);

    const fill = this.add.graphics().setDepth(Z.bar + 1);

    // Numeric label on top of the bar.
    const label = this.add.text(x + w / 2, y + h / 2, '', {
      fontFamily: TYPE.family,
      fontSize: '12px',
      color: '#ffffff',
      stroke: COL.inkHex,
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(Z.bar + 2);

    return { x, y, w, h, fillColour, fill, label, currentFrac: 1 };
  }

  _refreshBars(panel) {
    const { participant, hpBar, eBar } = panel;
    this._setBar(hpBar, participant.hp, participant.maxHP);
    this._setBar(eBar, participant.energy, participant.maxEnergy);
  }

  _setBar(bar, value, max) {
    const frac = Math.max(0, Math.min(1, value / max));
    // Tween the visible fill width.
    this.tweens.add({
      targets: bar,
      currentFrac: frac,
      duration: 320,
      ease: 'Sine.easeOut',
      onUpdate: () => {
        bar.fill.clear();
        bar.fill.fillStyle(bar.fillColour, 1);
        const fw = Math.max(bar.h, bar.w * bar.currentFrac);
        bar.fill.fillRoundedRect(bar.x, bar.y, fw, bar.h, bar.h / 2);
      }
    });
    bar.label.setText(`${Math.max(0, Math.ceil(value))} / ${Math.ceil(max)}`);
  }

  _renderMoveButtons(topY, sceneWidth) {
    const moves = this.player.species.moves;
    const totalW = moves.length * MOVE_BTN_W + (moves.length - 1) * MOVE_BTN_GAP;
    const startX = (sceneWidth - totalW) / 2;

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      const x = startX + i * (MOVE_BTN_W + MOVE_BTN_GAP);
      const y = topY;
      const btn = this._makeMoveButton(x, y, move);
      this._moveButtons.push(btn);
    }
  }

  _makeMoveButton(x, y, move) {
    const bg = this.add.graphics().setDepth(Z.buttons);
    const name = this.add.text(x + MOVE_BTN_W / 2, y + 18, move.name, {
      fontFamily: TYPE.family,
      fontSize: '22px',
      color: COL.inkHex
    }).setOrigin(0.5, 0).setDepth(Z.buttons + 1);
    const meta = this.add.text(
      x + MOVE_BTN_W / 2,
      y + MOVE_BTN_H - 24,
      `${typeEmoji(move.type)} ⚡${move.energyCost}`,
      {
        fontFamily: TYPE.family,
        fontSize: '18px',
        color: COL.orangeHex
      }
    ).setOrigin(0.5, 0).setDepth(Z.buttons + 1);

    const zone = this.add.zone(x, y, MOVE_BTN_W, MOVE_BTN_H).setOrigin(0, 0).setDepth(Z.buttons + 2);
    zone.setInteractive({ useHandCursor: true });

    const draw = (state) => {
      bg.clear();
      const enabled = state !== 'disabled';
      const fill = state === 'hover' ? COL.paperWarm : COL.gold;
      drawPanel(bg, x, y, MOVE_BTN_W, MOVE_BTN_H, {
        radius: RADIUS.card,
        fill,
        fillAlpha: enabled ? 1 : 0.5
      });
    };
    // Start disabled — _setMovesEnabled(true) after intro enables it.
    draw('disabled');

    zone.on('pointerover', () => { if (this._movesEnabled) draw('hover'); });
    zone.on('pointerout',  () => { if (this._movesEnabled) draw('idle'); });
    zone.on('pointerup',   () => {
      if (!this._movesEnabled) return;
      if (this.player.energy < move.energyCost) {
        this._showBanner(`Not enough ⚡ for ${move.name}.`, 1100);
        return;
      }
      this._setMovesEnabled(false);
      this._takeTurn(move);
    });

    return { bg, name, meta, zone, x, y, move, draw };
  }

  _setMovesEnabled(enabled) {
    this._movesEnabled = enabled;
    for (const btn of this._moveButtons) {
      const canAfford = this.player.energy >= btn.move.energyCost;
      btn.draw(enabled && canAfford ? 'idle' : 'disabled');
    }
  }

  _showBanner(text, ms = 1400, onDone) {
    this._banner.setText(text);
    this.tweens.killTweensOf(this._banner);
    this._banner.setAlpha(0);
    this.tweens.add({
      targets: this._banner,
      alpha: 1,
      duration: 200,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.time.delayedCall(ms, () => {
          this.tweens.add({
            targets: this._banner,
            alpha: 0,
            duration: 200,
            onComplete: () => onDone && onDone()
          });
        });
      }
    });
  }

  // ──────────────────────────── turn logic ────────────────────────────

  /** Resolve a full turn: player picks `move`; opponent picks its
   *  own move via simple AI; faster goes first; check faint. */
  _takeTurn(playerMove) {
    if (this._battleOver) return;

    const opponentMove = this._opponentAI();
    const playerGoesFirst = this.player.spd >= this.opponent.spd;

    const playOrder = playerGoesFirst
      ? [{ attacker: this.player, defender: this.opponent, move: playerMove, who: 'player' },
         { attacker: this.opponent, defender: this.player, move: opponentMove, who: 'opponent' }]
      : [{ attacker: this.opponent, defender: this.player, move: opponentMove, who: 'opponent' },
         { attacker: this.player, defender: this.opponent, move: playerMove, who: 'player' }];

    this._runStep(playOrder, 0);
  }

  _runStep(plays, i) {
    if (this._battleOver) return;
    if (i >= plays.length) {
      // End of turn — re-enable moves.
      this._setMovesEnabled(true);
      return;
    }
    const { attacker, defender, move, who } = plays[i];
    if (attacker.hp <= 0) {
      // Attacker fainted earlier this turn (e.g. before being able
      // to swing back). Skip its action.
      this._runStep(plays, i + 1);
      return;
    }

    this._performMove(attacker, defender, move, who, () => {
      // Check defender faint AFTER damage / heal animation settles.
      if (defender.hp <= 0) {
        this._faint(defender, () => this._concludeBattle(attacker === this.player));
        return;
      }
      if (attacker.hp <= 0) {
        // Self-defeat (very rare; here only via future status).
        this._faint(attacker, () => this._concludeBattle(attacker === this.opponent));
        return;
      }
      // Continue.
      this.time.delayedCall(280, () => this._runStep(plays, i + 1));
    });
  }

  /** Simple opponent AI: prefer affordable strong moves, but
   *  occasionally use utility (heal/recover) if HP/energy low. */
  _opponentAI() {
    const moves = this.opponent.species.moves;
    const affordable = moves.filter((m) => this.opponent.energy >= m.energyCost);
    if (affordable.length === 0) {
      // Pick the cheapest move regardless (game grants min damage of 1).
      return moves.reduce((a, b) => (a.energyCost <= b.energyCost ? a : b));
    }
    const lowHP = this.opponent.hp / this.opponent.maxHP < 0.4;
    const lowEnergy = this.opponent.energy / this.opponent.maxEnergy < 0.3;
    // Prefer heal if low HP.
    if (lowHP) {
      const heal = affordable.find((m) => m.effect?.kind === 'heal');
      if (heal && Math.random() < 0.7) return heal;
    }
    if (lowEnergy) {
      const eMove = affordable.find((m) => m.effect?.kind === 'energy');
      if (eMove && Math.random() < 0.6) return eMove;
    }
    // Else pick a random attack-ish move (any non-utility).
    const attackish = affordable.filter((m) => !m.effect);
    if (attackish.length > 0) {
      return attackish[Math.floor(Math.random() * attackish.length)];
    }
    return affordable[Math.floor(Math.random() * affordable.length)];
  }

  // ──────────────────────────── move animations ────────────────────────────

  _performMove(attacker, defender, move, who, onDone) {
    attacker.energy = Math.max(0, attacker.energy - move.energyCost);

    const attackerSprite = (who === 'player') ? this._plySprite : this._oppSprite;
    const defenderSprite = (who === 'player') ? this._oppSprite : this._plySprite;
    const attackerPanel  = (who === 'player') ? this._plyPanel : this._oppPanel;
    const defenderPanel  = (who === 'player') ? this._oppPanel : this._plyPanel;

    const tellLine = `${attacker.species.displayName} used ${move.name}!`;
    this._showBanner(tellLine, 900);

    // Refresh attacker's energy bar.
    this._refreshBars(attackerPanel);

    // Utility move = heal / energy.
    if (move.effect) {
      this.time.delayedCall(220, () => {
        this._playHealFx(attackerSprite, attacker, move.effect);
        this.time.delayedCall(700, () => {
          this._refreshBars(attackerPanel);
          onDone();
        });
      });
      return;
    }

    // Attack move.
    const hit = Math.random() < move.accuracy;
    this.time.delayedCall(220, () => {
      this._playLungeFx(attackerSprite, who);
      this.time.delayedCall(180, () => {
        if (!hit) {
          this._floatText(defenderSprite.x, defenderSprite.y - 60, 'miss!', COL.inkSoft);
          this.time.delayedCall(500, () => onDone());
          return;
        }
        const dmg = this._damageOf(attacker, defender, move);
        defender.hp = Math.max(0, defender.hp - dmg);

        const typeMul = typeMultiplier(move.type, defender.species.type);
        const colour = typeMul > 1 ? '#a45e08' : (typeMul < 1 ? '#5a4a2a' : '#a45e08');
        this._floatText(defenderSprite.x, defenderSprite.y - 60, `−${dmg}`, colour);
        if (typeMul > 1) {
          this._showBanner('It\'s really effective!', 900);
        } else if (typeMul < 1) {
          this._showBanner('It\'s only a little effective.', 900);
        }
        this._playHitFx(defenderSprite, move.fx);
        this._refreshBars(defenderPanel);
        this.time.delayedCall(700, () => onDone());
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
    const dx = (who === 'player') ? 40 : -40;
    const fromX = attackerSprite.x;
    this.tweens.add({
      targets: attackerSprite,
      x: fromX + dx,
      duration: 110,
      ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: () => { attackerSprite.x = fromX; }
    });
  }

  _playHitFx(defenderSprite, fx) {
    const fromX = defenderSprite.x;
    const fromY = defenderSprite.y;
    // Red tint flash.
    defenderSprite.setTint?.(0xff7373);
    this.time.delayedCall(220, () => defenderSprite.clearTint?.());
    // Shake.
    this.tweens.add({
      targets: defenderSprite,
      x: { from: fromX - 6, to: fromX + 6 },
      duration: 60,
      yoyo: true,
      repeat: fx === 'heavy' ? 4 : 2,
      onComplete: () => { defenderSprite.x = fromX; defenderSprite.y = fromY; }
    });
    // Heavy: small particle burst.
    if (fx === 'heavy') {
      this._burstParticles(defenderSprite.x, defenderSprite.y, COL.orange, 10);
    }
  }

  _playHealFx(targetSprite, target, effect) {
    if (effect.kind === 'heal') {
      const oldHP = target.hp;
      target.hp = Math.min(target.maxHP, target.hp + effect.amount);
      const gained = target.hp - oldHP;
      this._floatText(targetSprite.x, targetSprite.y - 60, `+${gained}`, '#5a8a3a');
    } else if (effect.kind === 'energy') {
      const oldE = target.energy;
      target.energy = Math.min(target.maxEnergy, target.energy + effect.amount);
      const gained = target.energy - oldE;
      this._floatText(targetSprite.x, targetSprite.y - 60, `+${gained}⚡`, '#4a8ab3');
    }
    // Sparkle ring.
    const ring = this.add.graphics().setDepth(Z.fx);
    ring.lineStyle(4, 0xffe066, 1);
    ring.strokeCircle(targetSprite.x, targetSprite.y, 30);
    this.tweens.add({
      targets: ring,
      scale: 2.4,
      alpha: 0,
      duration: 700,
      ease: 'Sine.easeOut',
      onComplete: () => ring.destroy()
    });
  }

  _floatText(x, y, text, colour) {
    const t = this.add.text(x, y, text, {
      fontFamily: TYPE.family,
      fontSize: '42px',
      color: colour,
      stroke: '#ffffff',
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(Z.fx);
    this.tweens.add({
      targets: t,
      y: y - 80,
      alpha: { from: 1, to: 0 },
      duration: 900,
      ease: 'Sine.easeOut',
      onComplete: () => t.destroy()
    });
  }

  _burstParticles(x, y, colour, count) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = 80 + Math.random() * 40;
      const p = this.add.circle(x, y, 5, colour, 1).setDepth(Z.fx);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 0.3 },
        duration: 600,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy()
      });
    }
  }

  _faint(participant, onDone) {
    const sprite = (participant === this.player) ? this._plySprite : this._oppSprite;
    this._showBanner(`${participant.species.displayName} fainted!`, 1100);
    this.tweens.killTweensOf(sprite);
    this.tweens.add({
      targets: sprite,
      y: sprite.y + 60,
      angle: -45,
      alpha: 0,
      duration: 700,
      ease: 'Quad.easeIn',
      onComplete: () => onDone()
    });
  }

  // ──────────────────────────── end of battle ────────────────────────────

  _concludeBattle(playerWon) {
    if (this._battleOver) return;
    this._battleOver = true;
    this._setMovesEnabled(false);

    let gems = 0;
    let expGained = 0;
    let levelsGained = 0;

    if (playerWon) {
      gems = 5 + this.opponent.level * 3;
      expGained = expReward(this.opponent.level);
      if (this.player.buddyInstance && this.services.buddyTeam) {
        levelsGained = this.services.buddyTeam.grantExp(this.player.buddyInstance, expGained);
        if (levelsGained > 0) {
          this.services.quests?.report?.({ type: 'buddy-leveled-up', speciesId: this.player.species.id });
        }
      }
      this.services.gemBag?.add('gem_5', gems);
      this.services.audio?.playSfx?.('sfx_jackpot');
      this._showBanner(
        levelsGained > 0
          ? `You won! +${gems} gems · +${expGained} EXP · LEVEL UP! Lv${this.player.buddyInstance.level}`
          : `You won! +${gems} gems · +${expGained} EXP`,
        2600,
        () => this._exit({ won: true, gems, expGained, levelsGained })
      );
      this.services.quests?.report?.({ type: 'buddy-battle-won', opponentSpecies: this.opponent.species.id, opponentLevel: this.opponent.level });
    } else {
      // Consolation. No fail state.
      gems = 3;
      expGained = Math.max(4, Math.floor(expReward(this.opponent.level) * 0.2));
      if (this.player.buddyInstance && this.services.buddyTeam) {
        levelsGained = this.services.buddyTeam.grantExp(this.player.buddyInstance, expGained);
        if (levelsGained > 0) {
          this.services.quests?.report?.({ type: 'buddy-leveled-up', speciesId: this.player.species.id });
        }
      }
      this.services.gemBag?.add('gem_5', gems);
      this.services.audio?.playSfx?.('sfx_descend');
      this._showBanner(
        `${this.opponent.species.displayName} won! But you got +${gems} gems for trying.`,
        2400,
        () => this._exit({ won: false, gems, expGained, levelsGained })
      );
    }
  }

  _exit(result) {
    // Fade out + return to the previous scene.
    const targets = [this.veil, this.stageBg, this._oppSprite, this._plySprite, this._banner,
                     ...this._panelObjs(this._oppPanel),
                     ...this._panelObjs(this._plyPanel),
                     ...this._moveButtons.flatMap((b) => [b.bg, b.name, b.meta, b.zone])];
    this.tweens.add({
      targets,
      alpha: 0,
      duration: 320,
      ease: 'Sine.easeIn',
      onComplete: () => {
        const cb = this.onComplete;
        const prev = this.previousSceneKey;
        // Stop this scene; the launcher in GameScene wakes the gameplay scene.
        this.scene.stop();
        cb(result, prev);
      }
    });
  }

  _panelObjs(panel) {
    if (!panel) return [];
    return [
      panel.bg, panel.nameText, panel.ownerText,
      panel.hpBar.fill, panel.hpBar.label,
      panel.eBar.fill, panel.eBar.label
    ];
  }

  _slideIn() {
    // Just fade in. (Sprites already on-screen; nice subtle entrance.)
    const targets = [this.veil, this.stageBg, this._oppSprite, this._plySprite,
                     ...this._panelObjs(this._oppPanel),
                     ...this._panelObjs(this._plyPanel),
                     ...this._moveButtons.flatMap((b) => [b.bg, b.name, b.meta])];
    for (const o of targets) o.alpha = 0;
    this.tweens.add({
      targets,
      alpha: 1,
      duration: 360,
      ease: 'Sine.easeOut'
    });
  }
}

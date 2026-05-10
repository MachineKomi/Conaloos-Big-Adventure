/**
 * HotspotManager — wires up every hotspot in a scene definition.
 *
 * Responsibilities:
 *  - Builds an interactive zone per hotspot at the right normalized bounds,
 *    padded to a minimum 64×64 hit area.
 *  - Sprite-anchored hover/click feedback: the speaker sprite gets a soft
 *    tint + slight scale-up on hover, and a quick bounce + sparkle on click.
 *    NO rectangles or halos are ever drawn over the background.
 *  - Exhaustive shuffle cycle: every unique response is shown once before any
 *    repeats, so a 4-year-old isn't subjected to the same line twice while
 *    there's still fresh content available.
 *  - Triggers the speech bubble and audio on click; forwards portal hotspots
 *    to the SceneRouter.
 *
 * The previous implementation showed a transparent halo `Graphics` rectangle
 * on hover and again on click. That was the "ugly hit-box flash" Dad reported
 * in playtest. It is now gone.
 */

import { Accessibility } from './Accessibility.js';
import { pickClickSfx } from '../content/sfxPools.js';
import { pickQuizFor, quizzes } from '../content/quizzes.js';
import { pickInventoryReaction } from '../content/inventoryReactions.js';
import { QuizDialog } from './QuizDialog.js';

const QUIZ_FIRE_CHANCE = 0.25;          // 25% chance a click fires a quiz
const INVENTORY_REACTION_CHANCE = 0.4;  // 40% chance to pick an inventory-aware line if applicable
const QUIZ_FREEZE_MS = 2500;            // Block other clicks for 2.5s after quiz opens

const MIN_HIT_PX = 64;
const HOVER_TINT = 0xfff5d0;
const HOVER_SCALE_FACTOR = 1.04;
const CLICK_SCALE_FACTOR = 1.12;
const HOVER_TWEEN_MS = 140;
const CLICK_TWEEN_MS = 130;
const SPARKLE_COUNT = 8;
const SPARKLE_RADIUS_PX = 36;
const SPARKLE_LIFE_MS = 360;
const SPARKLE_COLOUR = 0xfff2a8;

export class HotspotManager {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} services - { audio, dialogue, router, onResponse, spritesByKey }
   */
  constructor(scene, services) {
    this.scene = scene;
    this.audio = services.audio;
    this.dialogue = services.dialogue;
    this.router = services.router;
    this.onResponse = services.onResponse;
    this.spritesByKey = services.spritesByKey || new Map();
    this.zones = [];
    /** Per-hotspot queues of unseen responses. */
    this.unseen = new Map();
    /** Per-session quiz tracking — Set of "characterKey:quizIdx" strings. */
    this.seenQuizzes = services.seenQuizzes || new Set();
    this.quizDialog = new QuizDialog(scene);
  }

  destroy() {
    for (const z of this.zones) z.destroy();
    this.zones = [];
    this.unseen.clear();
  }

  /**
   * @param {Array<HotspotDef>} hotspots
   * @param {{w:number,h:number}} sceneSize
   */
  createAll(hotspots, sceneSize) {
    for (const h of hotspots) this._create(h, sceneSize);
  }

  _create(hotspot, sceneSize) {
    const scene = this.scene;
    const sw = sceneSize.w;
    const sh = sceneSize.h;

    const px = (hotspot.bounds.x ?? 0) * sw;
    const py = (hotspot.bounds.y ?? 0) * sh;
    let pw = (hotspot.bounds.w ?? 0.1) * sw;
    let ph = (hotspot.bounds.h ?? 0.1) * sh;

    // Centre on midpoint, then pad to minimum hit area without changing centre.
    const cx = px + pw / 2;
    const cy = py + ph / 2;
    if (pw < MIN_HIT_PX) pw = MIN_HIT_PX;
    if (ph < MIN_HIT_PX) ph = MIN_HIT_PX;
    const ax = cx - pw / 2;
    const ay = cy - ph / 2;

    const zone = scene.add.zone(ax, ay, pw, ph).setOrigin(0, 0);
    zone.setInteractive({ useHandCursor: true });
    zone.setData('hotspot', hotspot);

    // Hover/click feedback rides the speaker sprite (if any). Narrator-only
    // hotspots (no speaker) get only the cursor change.
    const sprite = hotspot.speaker ? this.spritesByKey.get(hotspot.speaker) : null;

    // Match the zone's depth to the speaker sprite (if any) so clicks
    // route to the visually-front character when zones overlap. Phaser
    // input with topOnly=true picks the highest-depth interactive hit.
    if (sprite) zone.setDepth(sprite.depth + 0.5);
    else zone.setDepth(ay);

    // Resolve baseScale dynamically per event (NOT captured once),
    // because some characters opt-in to "buddy growth" — their
    // _baseScale increases with each click, capped. If we captured
    // the value at zone-creation time, hover tweens would always
    // shrink them back to the original size, which would fight the
    // growth feature.
    const getBase = () => (sprite ? (sprite._baseScale ?? sprite.scale) : 1);
    let hoverTween = null;

    zone.on('pointerover', () => {
      if (!sprite) return;
      sprite.setTint(HOVER_TINT);
      const baseScale = getBase();
      if (Accessibility.reducedMotion) {
        sprite.setScale(baseScale * HOVER_SCALE_FACTOR);
        return;
      }
      hoverTween?.remove();
      scene.tweens.killTweensOf(sprite);
      hoverTween = scene.tweens.add({
        targets: sprite,
        scale: baseScale * HOVER_SCALE_FACTOR,
        duration: HOVER_TWEEN_MS,
        ease: 'Sine.easeOut'
      });
    });

    zone.on('pointerout', () => {
      if (!sprite) return;
      sprite.clearTint();
      hoverTween?.remove();
      hoverTween = null;
      const baseScale = getBase();
      scene.tweens.killTweensOf(sprite);
      if (Accessibility.reducedMotion) {
        sprite.setScale(baseScale);
        return;
      }
      scene.tweens.add({
        targets: sprite,
        scale: baseScale,
        duration: HOVER_TWEEN_MS,
        ease: 'Sine.easeOut'
      });
    });

    zone.on('pointerup', (pointer) => {
      // Quiz-active grace period: ignore other clicks while a quiz is
      // up so the kid (or accidental tap) can't dismiss it. The quiz
      // dialog itself stays interactive.
      if (this._quizFreezeUntil && Date.now() < this._quizFreezeUntil) {
        return;
      }

      const clickPos = pointer && pointer.worldX !== undefined
        ? { x: pointer.worldX, y: pointer.worldY }
        : { x: cx, y: cy };
      this._bounceSprite(sprite, getBase());
      this._emitSparkle(clickPos.x, clickPos.y);

      // Walk Amelia toward the speaker (stopping a sprite-width away)
      // before delivering the line.
      const protagonist = this.scene.services?.protagonist;
      if (protagonist && hotspot.type !== 'portal') {
        const approachX = sprite ? sprite.x : clickPos.x;
        protagonist.walkTo(approachX, 0, () => this._onClick(hotspot, clickPos), { approach: true });
      } else {
        this._onClick(hotspot, clickPos);
      }
    });

    this.zones.push(zone);
  }

  _bounceSprite(sprite, baseScale) {
    if (!sprite) return;
    if (Accessibility.reducedMotion) {
      sprite.setTint(HOVER_TINT);
      this.scene.time.delayedCall(120, () => sprite.clearTint());
      return;
    }
    // Kill any pending hover-tween so this bounce doesn't fight it,
    // then explicitly set the start scale so the yoyo returns to it.
    this.scene.tweens.killTweensOf(sprite);
    sprite.setScale(baseScale * HOVER_SCALE_FACTOR); // start state
    this.scene.tweens.add({
      targets: sprite,
      scale: baseScale * CLICK_SCALE_FACTOR,
      duration: CLICK_TWEEN_MS,
      ease: 'Back.easeOut',
      yoyo: true,
      onComplete: () => {
        // Snap to a deterministic value when bounce ends, regardless
        // of whether we're still hovered.
        if (sprite && sprite.active) {
          sprite.setScale(baseScale * HOVER_SCALE_FACTOR);
        }
      }
    });
  }

  _emitSparkle(x, y) {
    if (Accessibility.reducedMotion) return;
    const scene = this.scene;
    for (let i = 0; i < SPARKLE_COUNT; i++) {
      const angle = (i / SPARKLE_COUNT) * Math.PI * 2 + Math.random() * 0.5;
      const dist = SPARKLE_RADIUS_PX * (0.6 + Math.random() * 0.4);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      const dot = scene.add.circle(x, y, 4, SPARKLE_COLOUR, 1);
      dot.setDepth(900);
      scene.tweens.add({
        targets: dot,
        x: x + dx,
        y: y + dy,
        alpha: { from: 1, to: 0 },
        scale: { from: 1.2, to: 0.2 },
        duration: SPARKLE_LIFE_MS,
        ease: 'Quad.easeOut',
        onComplete: () => dot.destroy()
      });
    }
  }

  _onClick(hotspot, pos) {
    // Portal hotspots fire the response, then transition once dialogue dismisses.
    if (hotspot.type === 'portal' && hotspot.target) {
      const line = this._nextResponse(hotspot);
      const portalSfx = pickClickSfx(hotspot.speaker, 'portal', line?.sfx);
      this.audio?.playSfx(portalSfx);
      if (line?.text) {
        this.dialogue.show(line.text, {
          avoid: pos,
          speakerSprite: hotspot.speaker ? this.spritesByKey.get(hotspot.speaker) : null,
          onDismiss: () => this.router?.goToScene(hotspot.target)
        });
      } else {
        this.router?.goToScene(hotspot.target);
      }
      this.onResponse?.(hotspot, line);
      return;
    }

    // Maybe a quiz instead of a regular line.
    if (hotspot.speaker && quizzes[hotspot.speaker] && Math.random() < QUIZ_FIRE_CHANCE) {
      this._fireQuiz(hotspot, pos);
      return;
    }

    // Maybe an inventory-aware reaction (if Amelia carries something
    // this character has lines about).
    if (hotspot.speaker && Math.random() < INVENTORY_REACTION_CHANCE) {
      const protag = this.scene.services?.protagonist;
      const inv = protag?.inventory?.() || [];
      const reactionText = pickInventoryReaction(hotspot.speaker, inv);
      if (reactionText) {
        this.audio?.playSfx(pickClickSfx(hotspot.speaker, hotspot.type));
        this.dialogue.show(reactionText, {
          avoid: pos,
          speakerSprite: this.spritesByKey.get(hotspot.speaker)
        });
        this.onResponse?.(hotspot, { text: reactionText, fromInventoryReaction: true });
        return;
      }
    }

    const response = this._nextResponse(hotspot);
    const sfx = pickClickSfx(hotspot.speaker, hotspot.type, response?.sfx);
    if (sfx) this.audio?.playSfx(sfx);

    if (response?.text) {
      this.dialogue.show(response.text, {
        avoid: pos,
        speakerSprite: hotspot.speaker ? this.spritesByKey.get(hotspot.speaker) : null
      });
    }

    this.onResponse?.(hotspot, response);
  }

  _fireQuiz(hotspot, pos) {
    const quiz = pickQuizFor(hotspot.speaker, this.seenQuizzes);
    if (!quiz) {
      // Fallback to normal response if no quiz available.
      const response = this._nextResponse(hotspot);
      const sfx = pickClickSfx(hotspot.speaker, hotspot.type, response?.sfx);
      if (sfx) this.audio?.playSfx(sfx);
      if (response?.text) {
        this.dialogue.show(response.text, {
          avoid: pos,
          speakerSprite: this.spritesByKey.get(hotspot.speaker)
        });
      }
      this.onResponse?.(hotspot, response);
      return;
    }

    this.audio?.playSfx('sfx_chime');
    const speakerSprite = this.spritesByKey.get(hotspot.speaker);
    // Freeze hotspot clicks for 2.5s so the kid focuses on the quiz
    // and doesn't accidentally dismiss it. The quiz answer buttons
    // remain clickable since they're owned by QuizDialog (different
    // event path).
    this._quizFreezeUntil = Date.now() + QUIZ_FREEZE_MS;
    this.quizDialog.show(quiz, {
      speakerSprite,
      onAnswer: (result) => {
        this._quizFreezeUntil = 0;
        this._onQuizAnswered(hotspot, quiz, result, pos);
      }
    });
  }

  _onQuizAnswered(hotspot, quiz, result, pos) {
    const speakerSprite = this.spritesByKey.get(hotspot.speaker);
    // Reaction line.
    let reactionText;
    if (result.isPreference) reactionText = quiz.onCorrect;
    else reactionText = result.isCorrect ? quiz.onCorrect : quiz.onWrong;

    if (reactionText) {
      this.dialogue.show(reactionText, { speakerSprite });
    }

    if (result.isCorrect) {
      this.audio?.playSfx('sfx_jackpot');
      // Reward gem spray from the speaker (if any).
      if (this.scene._spawnGemBurst && speakerSprite) {
        this.scene._spawnGemBurst(speakerSprite);
      }
      // Quest tracking: a correct answer counts.
      this.scene.services?.quests?.report?.({
        type: 'quiz-correct',
        speaker: hotspot.speaker
      });
    } else {
      this.audio?.playSfx('sfx_descend');
    }

    this.onResponse?.(hotspot, { text: reactionText, fromQuiz: true });
  }

  /**
   * Pick the next response for a hotspot using an exhaustive-shuffle queue.
   * Every unique line is shown once before any line repeats. When the queue
   * empties, refill with a fresh shuffled copy. Any legacy `rare_response`
   * folds into the pool so it's still seen.
   */
  _nextResponse(hotspot) {
    let queue = this.unseen.get(hotspot.id);
    if (!queue || queue.length === 0) {
      const pool = [...(hotspot.responses || [])];
      if (hotspot.rare_response) pool.push(hotspot.rare_response);
      shuffle(pool);
      queue = pool;
      this.unseen.set(hotspot.id, queue);
    }
    return queue.shift() ?? null;
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

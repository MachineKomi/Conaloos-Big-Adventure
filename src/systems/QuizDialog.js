/**
 * QuizDialog — speech-bubble style panel anchored to a speaker, with
 * a question and 2–4 tappable answer options.
 *
 * v1.7 polish:
 *   - Pulls colour, stroke, radius, type, and animation timings from
 *     UITokens so the quiz reads as part of the same world.
 *   - Buttons now have proper hover (gentle lift + brighter fill),
 *     press (squish-and-spring), and choose feedback (brief flash on
 *     the chosen answer before the dialog dismisses) so a 4-year-old
 *     gets clear "yes, that's the one" confirmation.
 *   - Drop-in entrance with a Back.easeOut tween for warmth.
 *
 * On answer, the dialog dismisses itself and fires onAnswer({ option,
 * isCorrect, isPreference }) so the caller (HotspotManager) can play
 * the right reaction line and reward gems.
 */

import Phaser from 'phaser';
import { COL, RADIUS, STROKE, TYPE, ANIM, drawPanel } from './UITokens.js';

const PADDING_X = 24;
const PADDING_Y = 18;
const QUESTION_FONT_PX = 26;
const OPTION_FONT_PX = 22;
const OPTION_HEIGHT = 52;
const OPTION_GAP = 10;
const OPTION_PADDING_X = 16;
const OPTION_RADIUS = RADIUS.chip;

export class QuizDialog {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
  }

  destroy() {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }

  isVisible() { return !!this.container; }

  /**
   * Show a quiz.
   *
   * @param {object} quiz
   * @param {string} quiz.question
   * @param {Array<{ text: string, isCorrect?: boolean }>} quiz.options
   * @param {boolean} [quiz.isPreference]  All options "correct" if true
   * @param {object} opts
   * @param {Phaser.GameObjects.Image} [opts.speakerSprite]
   * @param {function} opts.onAnswer       (option, idx) => void
   */
  show(quiz, opts = {}) {
    this.destroy();
    if (!quiz?.question || !Array.isArray(quiz.options) || quiz.options.length === 0) return;

    const scene = this.scene;
    const { width, height } = scene.scale;
    const speakerSprite = opts.speakerSprite || null;
    const maxBubbleW = Math.min(width * 0.72, 720);

    // Build question text first to compute width.
    const questionText = scene.add.text(0, 0, quiz.question, {
      fontFamily: TYPE.bodyFamily,
      fontSize: `${QUESTION_FONT_PX}px`,
      color: COL.inkHex,
      align: 'center',
      lineSpacing: 6,
      wordWrap: { width: maxBubbleW - PADDING_X * 2, useAdvancedWrap: true }
    }).setOrigin(0.5, 0);

    // Compute option widths (laid out vertically as full-width buttons).
    const optionLabels = quiz.options.map((o) =>
      scene.add.text(0, 0, o.text, {
        fontFamily: TYPE.family,
        fontSize: `${OPTION_FONT_PX}px`,
        color: COL.inkHex,
        align: 'center',
        wordWrap: { width: maxBubbleW - PADDING_X * 2 - OPTION_PADDING_X * 2, useAdvancedWrap: true }
      }).setOrigin(0.5, 0.5)
    );

    const contentW = Math.min(
      Math.max(
        questionText.width,
        ...optionLabels.map((l) => l.width + OPTION_PADDING_X * 2)
      ),
      maxBubbleW - PADDING_X * 2
    );
    const boxW = contentW + PADDING_X * 2;
    const optionsTotalH = optionLabels.length * OPTION_HEIGHT + (optionLabels.length - 1) * OPTION_GAP;
    const boxH = PADDING_Y + questionText.height + 14 + optionsTotalH + PADDING_Y;

    // Position the quiz panel. The top of the screen is reserved
    // for the gem HUD (separate scene that renders above this one),
    // so the quiz must always sit below that band — otherwise the
    // question gets hidden behind the gem counter (v1.12 bug).
    const HUD_RESERVED_TOP = 130;
    let cx, cy;
    if (speakerSprite) {
      const speakerCx = speakerSprite.x;
      const speakerTop = speakerSprite.y - speakerSprite.displayHeight;
      cx = clamp(speakerCx, boxW / 2 + 16, width - boxW / 2 - 16);
      const above = speakerTop - 24 - boxH / 2;
      const below = speakerSprite.y + 24 + boxH / 2;
      const placeAbove = above - boxH / 2 > HUD_RESERVED_TOP;
      cy = placeAbove
        ? above
        : Math.min(below, height - boxH / 2 - 24);
    } else {
      cx = width / 2;
      cy = HUD_RESERVED_TOP + boxH / 2 + 12;
    }
    // Final guard: never let the box top creep into the HUD band.
    cy = Math.max(cy, HUD_RESERVED_TOP + boxH / 2);

    // Bubble background — use drawPanel so it matches every other
    // panel in the world (drop shadow + cream + warm-brown stroke).
    const bg = scene.add.graphics();
    drawPanel(bg, -boxW / 2, -boxH / 2, boxW, boxH, { radius: RADIUS.panel });

    questionText.setPosition(0, -boxH / 2 + PADDING_Y);

    // Lay out option buttons. Each button is its own little graphics +
    // label + zone trio so we can independently animate hover/press
    // and the eventual "chosen" flash.
    const optionItems = [];
    const buttons = []; // { btnBg, label, zone, x, y, w, h, idx }
    let currentY = -boxH / 2 + PADDING_Y + questionText.height + 14;
    optionLabels.forEach((label, i) => {
      const btnW = boxW - PADDING_X * 2;
      const btnX = -btnW / 2;
      const btnY = currentY;

      const btnBg = scene.add.graphics();
      drawOptionButton(btnBg, btnX, btnY, btnW, OPTION_HEIGHT, OPTION_RADIUS, COL.gold, 1.0);

      label.setPosition(0, btnY + OPTION_HEIGHT / 2);

      const zone = scene.add.zone(btnX, btnY, btnW, OPTION_HEIGHT).setOrigin(0, 0);
      zone.setInteractive({ useHandCursor: true });

      let isOver = false;
      zone.on('pointerover', () => {
        isOver = true;
        // Brighter fill + tiny scale-up on the label only (graphics
        // can't be tween-scaled cleanly without re-drawing, so we
        // re-draw the bg at higher fill alpha and tween the label).
        drawOptionButton(btnBg, btnX, btnY, btnW, OPTION_HEIGHT, OPTION_RADIUS, COL.paperWarm, 1.0);
        scene.tweens.add({
          targets: label,
          scale: 1.04,
          duration: ANIM.hover,
          ease: 'Sine.easeOut'
        });
      });
      zone.on('pointerout', () => {
        isOver = false;
        drawOptionButton(btnBg, btnX, btnY, btnW, OPTION_HEIGHT, OPTION_RADIUS, COL.gold, 1.0);
        scene.tweens.add({
          targets: label,
          scale: 1.0,
          duration: ANIM.hover,
          ease: 'Sine.easeOut'
        });
      });
      zone.on('pointerdown', () => {
        // Press squish — bounces back on release/up.
        scene.tweens.add({
          targets: label,
          scale: 0.94,
          duration: 80,
          ease: 'Sine.easeIn'
        });
      });
      zone.on('pointerup', () => {
        const opt = quiz.options[i];
        const isCorrect = !!quiz.isPreference || !!opt.isCorrect;
        // Brief "chosen" flash on the picked button — orange ring of
        // confirmation. Then dismiss + fire callback.
        this._flashChosen(btnBg, btnX, btnY, btnW, OPTION_HEIGHT, isCorrect);
        scene.tweens.add({
          targets: label,
          scale: { from: 1.04, to: 1.0 },
          duration: ANIM.press,
          ease: 'Back.easeOut'
        });
        scene.time.delayedCall(260, () => {
          opts.onAnswer?.({ option: opt, idx: i, isCorrect, isPreference: !!quiz.isPreference });
          this.destroy();
        });
      });

      optionItems.push(btnBg, label, zone);
      buttons.push({ btnBg, label, zone, x: btnX, y: btnY, w: btnW, h: OPTION_HEIGHT, idx: i });
      currentY += OPTION_HEIGHT + OPTION_GAP;
    });

    const container = scene.add.container(cx, cy, [bg, questionText, ...optionItems]);
    container.setDepth(10000);

    // Drop-in entrance.
    container.setAlpha(0);
    container.y += 12;
    container.setScale(0.97);
    scene.tweens.add({
      targets: container,
      alpha: 1,
      y: cy,
      scale: 1,
      duration: ANIM.panelOpen,
      ease: 'Back.easeOut'
    });

    this.container = container;
  }

  /** Brief orange ring + brighter fill on the chosen button. */
  _flashChosen(btnBg, x, y, w, h, isCorrect) {
    const flashColour = isCorrect ? COL.green : COL.gold;
    btnBg.clear();
    drawOptionButton(btnBg, x, y, w, h, OPTION_RADIUS, flashColour, 1.0, true);
  }
}

/**
 * Draw a single quiz option button with cream/gold fill + brown
 * stroke. The `bright` flag emphasises the stroke for the "chosen"
 * confirmation flash so the kid sees which one they picked.
 */
function drawOptionButton(g, x, y, w, h, radius, fillColour, fillAlpha, bright = false) {
  g.clear();
  g.fillStyle(fillColour, fillAlpha);
  g.lineStyle(bright ? STROKE.panel : STROKE.small, COL.ink, 1);
  g.fillRoundedRect(x, y, w, h, radius);
  g.strokeRoundedRect(x, y, w, h, radius);
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

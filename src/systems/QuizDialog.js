/**
 * QuizDialog — speech-bubble style panel anchored to a speaker, with
 * a question and 2–4 tappable answer options.
 *
 * On answer, the dialog dismisses itself and fires onAnswer({ option,
 * isCorrect, isPreference }) so the caller (HotspotManager) can play
 * the right reaction line and reward gems.
 *
 * Visual style mirrors DialogueBox so the world reads consistently.
 */

import Phaser from 'phaser';

const PADDING_X = 24;
const PADDING_Y = 18;
const BUBBLE_BG = 0xfff8e7;
const BUBBLE_BG_ALPHA = 0.96;
const BUBBLE_STROKE = 0x4a3a1f;
const STROKE_WIDTH = 4;
const CORNER_RADIUS = 22;

const TEXT_COLOUR = '#2b2b2b';
const QUESTION_FONT_PX = 26;
const OPTION_FONT_PX = 22;
const OPTION_HEIGHT = 48;
const OPTION_GAP = 8;
const OPTION_PADDING_X = 14;
const OPTION_BG = 0xfff2a8;
const OPTION_BG_ALPHA = 1;

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
      fontFamily: '"Atkinson Hyperlegible", system-ui, sans-serif',
      fontSize: `${QUESTION_FONT_PX}px`,
      color: TEXT_COLOUR,
      align: 'center',
      lineSpacing: 6,
      wordWrap: { width: maxBubbleW - PADDING_X * 2, useAdvancedWrap: true }
    }).setOrigin(0.5, 0);

    // Compute option widths (laid out vertically as full-width buttons).
    const optionLabels = quiz.options.map((o) =>
      scene.add.text(0, 0, o.text, {
        fontFamily: '"Fredoka", system-ui, sans-serif',
        fontSize: `${OPTION_FONT_PX}px`,
        color: '#4a3a1f',
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

    // Position above speaker (or top-of-screen banner if none).
    let cx, cy;
    if (speakerSprite) {
      const speakerCx = speakerSprite.x;
      const speakerTop = speakerSprite.y - speakerSprite.displayHeight;
      cx = clamp(speakerCx, boxW / 2 + 16, width - boxW / 2 - 16);
      cy = Math.max(boxH / 2 + 16, speakerTop - 24 - boxH / 2);
    } else {
      cx = width / 2;
      cy = boxH / 2 + 24;
    }

    const bg = scene.add.graphics();
    bg.fillStyle(BUBBLE_BG, BUBBLE_BG_ALPHA);
    bg.lineStyle(STROKE_WIDTH, BUBBLE_STROKE, 1);
    bg.fillRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, CORNER_RADIUS);
    bg.strokeRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, CORNER_RADIUS);

    questionText.setPosition(0, -boxH / 2 + PADDING_Y);

    // Lay out option buttons.
    const optionItems = [];
    let currentY = -boxH / 2 + PADDING_Y + questionText.height + 14;
    optionLabels.forEach((label, i) => {
      const btnW = boxW - PADDING_X * 2;
      const btnX = -btnW / 2;
      const btnY = currentY;

      const btnBg = scene.add.graphics();
      btnBg.fillStyle(OPTION_BG, OPTION_BG_ALPHA);
      btnBg.lineStyle(3, BUBBLE_STROKE, 1);
      btnBg.fillRoundedRect(btnX, btnY, btnW, OPTION_HEIGHT, 12);
      btnBg.strokeRoundedRect(btnX, btnY, btnW, OPTION_HEIGHT, 12);

      label.setPosition(0, btnY + OPTION_HEIGHT / 2);

      const zone = scene.add.zone(btnX, btnY, btnW, OPTION_HEIGHT).setOrigin(0, 0);
      zone.setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => { btnBg.alpha = 0.8; });
      zone.on('pointerout',  () => { btnBg.alpha = 1.0; });
      zone.on('pointerup', () => {
        const opt = quiz.options[i];
        const isCorrect = !!quiz.isPreference || !!opt.isCorrect;
        opts.onAnswer?.({ option: opt, idx: i, isCorrect, isPreference: !!quiz.isPreference });
        this.destroy();
      });

      optionItems.push(btnBg, label, zone);
      currentY += OPTION_HEIGHT + OPTION_GAP;
    });

    const container = scene.add.container(cx, cy, [bg, questionText, ...optionItems]);
    container.setDepth(10000);

    container.setAlpha(0);
    scene.tweens.add({
      targets: container,
      alpha: 1,
      duration: 200,
      ease: 'Sine.easeOut'
    });

    this.container = container;
  }
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

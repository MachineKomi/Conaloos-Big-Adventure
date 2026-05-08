/**
 * DialogueBox — translucent rounded text panel.
 * Auto-positions to avoid overlapping the speaking character.
 * Auto-dismisses based on word count; click anywhere to dismiss early.
 */

import { Accessibility } from './Accessibility.js';

const PADDING_X = 28;
const PADDING_Y = 22;
const MAX_WIDTH_FRACTION = 0.85;
const MARGIN_FROM_EDGE = 32;
const CORNER_RADIUS = 24;
const BG_COLOUR = 0xfff8e7;
const BG_ALPHA = 0.94;
const STROKE_COLOUR = 0x4a3a1f;
const STROKE_WIDTH = 4;
const TEXT_COLOUR = '#2b2b2b';
const READ_MS_PER_WORD = 280;
const MIN_DISPLAY_MS = 2200;
const TAIL_BUFFER_MS = 1200;

export class DialogueBox {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.dismissTimer = null;
    this.activeTween = null;
  }

  destroy() {
    this._clear();
  }

  _clear() {
    if (this.dismissTimer) {
      this.dismissTimer.remove(false);
      this.dismissTimer = null;
    }
    if (this.activeTween) {
      this.activeTween.remove();
      this.activeTween = null;
    }
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }

  /**
   * Show a multi-line block of text.
   *
   *   show("Two lines\nof verse", { avoid: { x, y } })
   *
   * @param {string} text         Newline-delimited dialogue.
   * @param {object} [opts]
   * @param {{x:number,y:number}} [opts.avoid]   Speaker position to dodge.
   * @param {function} [opts.onDismiss]
   */
  show(text, opts = {}) {
    this._clear();
    if (!text) return;

    const scene = this.scene;
    const { width, height } = scene.scale;
    const fontSize = Accessibility.textSizePx;
    const maxTextWidth = Math.floor(width * MAX_WIDTH_FRACTION) - PADDING_X * 2;

    const textObj = scene.add.text(0, 0, text, {
      fontFamily: '"Atkinson Hyperlegible", "Fredoka", system-ui, sans-serif',
      fontSize: `${fontSize}px`,
      color: TEXT_COLOUR,
      align: 'center',
      lineSpacing: Math.round(fontSize * 0.25),
      wordWrap: { width: maxTextWidth, useAdvancedWrap: true }
    });
    textObj.setOrigin(0.5, 0.5);

    const boxW = textObj.width + PADDING_X * 2;
    const boxH = textObj.height + PADDING_Y * 2;

    const bg = scene.add.graphics();
    bg.fillStyle(BG_COLOUR, BG_ALPHA);
    bg.lineStyle(STROKE_WIDTH, STROKE_COLOUR, 1);
    bg.fillRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, CORNER_RADIUS);
    bg.strokeRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, CORNER_RADIUS);

    const container = scene.add.container(0, 0, [bg, textObj]);
    container.setDepth(1000);

    // Position: bottom by default, top if speaker is in the bottom half.
    const placeBottom = !(opts.avoid && opts.avoid.y > height * 0.55);
    const cx = Phaser_clamp(
      opts.avoid?.x ?? width / 2,
      boxW / 2 + MARGIN_FROM_EDGE,
      width - boxW / 2 - MARGIN_FROM_EDGE
    );
    const cy = placeBottom
      ? height - boxH / 2 - MARGIN_FROM_EDGE
      : boxH / 2 + MARGIN_FROM_EDGE;
    container.setPosition(cx, cy);

    this.container = container;

    if (Accessibility.reducedMotion) {
      container.setAlpha(1);
    } else {
      container.setAlpha(0);
      container.y += 12;
      this.activeTween = scene.tweens.add({
        targets: container,
        alpha: 1,
        y: cy,
        duration: 260,
        ease: 'Sine.easeOut'
      });
    }

    const wordCount = text.trim().split(/\s+/).length;
    const dismissAfter = Math.max(
      MIN_DISPLAY_MS,
      wordCount * READ_MS_PER_WORD + TAIL_BUFFER_MS
    );
    this.dismissTimer = scene.time.delayedCall(dismissAfter, () => {
      this.dismiss(opts.onDismiss);
    });
  }

  dismiss(onDismiss) {
    if (!this.container) {
      onDismiss?.();
      return;
    }
    const c = this.container;
    this.container = null;
    if (Accessibility.reducedMotion) {
      c.destroy();
      onDismiss?.();
      return;
    }
    this.scene.tweens.add({
      targets: c,
      alpha: 0,
      y: c.y + 10,
      duration: 220,
      ease: 'Sine.easeIn',
      onComplete: () => {
        c.destroy();
        onDismiss?.();
      }
    });
  }

  isVisible() { return !!this.container; }
}

function Phaser_clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

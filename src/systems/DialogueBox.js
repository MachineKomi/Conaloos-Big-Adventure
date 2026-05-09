/**
 * DialogueBox / SpeechBubble — translucent rounded text panel with a
 * triangular tail pointing at the speaker.
 *
 * - If a `speakerSprite` is provided, the bubble anchors to that sprite
 *   (above its head, or to the side if there's not enough room) with a
 *   tail pointing at it.
 * - If no speaker (e.g. a Tiny Museum or Question Stone hotspot whose
 *   "speaker" is the narrator), the bubble appears as a soft top-of-
 *   screen banner with no tail.
 * - Auto-dismisses based on word count; click anywhere to dismiss early.
 */

import { Accessibility } from './Accessibility.js';

const PADDING_X = 22;
const PADDING_Y = 18;
const MAX_WIDTH_FRACTION = 0.62;
const MAX_NARRATOR_WIDTH_FRACTION = 0.78;
const MARGIN_FROM_EDGE = 24;
const CORNER_RADIUS = 22;
const BG_COLOUR = 0xfff8e7;
const BG_ALPHA = 0.96;
const STROKE_COLOUR = 0x4a3a1f;
const STROKE_WIDTH = 4;
const TEXT_COLOUR = '#2b2b2b';
const READ_MS_PER_WORD = 280;
const MIN_DISPLAY_MS = 2200;
const TAIL_BUFFER_MS = 1200;
const TAIL_HEIGHT = 16;
const TAIL_WIDTH = 24;

export class DialogueBox {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.dismissTimer = null;
    this.activeTween = null;
  }

  destroy() { this._clear(); }

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
   *   show("Two lines\nof verse", { speakerSprite, avoid, onDismiss })
   *
   * @param {string} text         Newline-delimited dialogue.
   * @param {object} [opts]
   * @param {Phaser.GameObjects.Image} [opts.speakerSprite]
   *        Sprite to anchor + point the tail at. If omitted, bubble is
   *        rendered as a narrator banner at the top of the screen.
   * @param {{x:number,y:number}} [opts.avoid]   Click position fallback.
   * @param {function} [opts.onDismiss]
   */
  show(text, opts = {}) {
    this._clear();
    if (!text) return;

    const scene = this.scene;
    const { width, height } = scene.scale;
    const fontSize = Accessibility.textSizePx;
    const speakerSprite = opts.speakerSprite || null;
    const maxFraction = speakerSprite ? MAX_WIDTH_FRACTION : MAX_NARRATOR_WIDTH_FRACTION;
    const maxTextWidth = Math.floor(width * maxFraction) - PADDING_X * 2;

    const textObj = scene.add.text(0, 0, text, {
      fontFamily: '"Atkinson Hyperlegible", "Fredoka", system-ui, sans-serif',
      fontSize: `${fontSize}px`,
      color: TEXT_COLOUR,
      align: 'center',
      lineSpacing: Math.round(fontSize * 0.25),
      wordWrap: { width: maxTextWidth, useAdvancedWrap: true }
    }).setOrigin(0.5, 0.5);

    const boxW = textObj.width + PADDING_X * 2;
    const boxH = textObj.height + PADDING_Y * 2;

    const bg = scene.add.graphics();

    const items = [bg, textObj];

    // Compute position + tail data first, then draw bg + tail as a
    // single combined path so the stroke goes around the OUTSIDE of
    // the whole shape (no line crossing the tail base).
    let cx, cy, tailAnchorX = null, tailAbove = false;
    // Reserve top region for the gem HUD (a fixed-size centred panel).
    // Bubbles never enter this band so the HUD's number stays readable.
    const HUD_RESERVED_TOP = 120;

    if (speakerSprite) {
      const speakerCx = speakerSprite.x;
      const speakerTop = speakerSprite.y - speakerSprite.displayHeight;
      const aboveTopY = speakerTop - 28 - boxH / 2;
      const belowTopY = speakerSprite.y + 24 + boxH / 2;
      tailAbove = aboveTopY - boxH / 2 > HUD_RESERVED_TOP;

      cx = clamp(
        speakerCx,
        boxW / 2 + MARGIN_FROM_EDGE,
        width - boxW / 2 - MARGIN_FROM_EDGE
      );
      cy = tailAbove
        ? Math.max(aboveTopY, HUD_RESERVED_TOP + boxH / 2)
        : Math.min(belowTopY, height - boxH / 2 - MARGIN_FROM_EDGE);

      tailAnchorX = clamp(speakerCx - cx, -boxW / 2 + 30, boxW / 2 - 30);
    } else {
      // Narrator banner — sits below the HUD, not over it.
      cx = width / 2;
      cy = HUD_RESERVED_TOP + boxH / 2 + 8;
    }

    drawBubbleWithTail(bg, boxW, boxH, CORNER_RADIUS, tailAnchorX, tailAbove);

    const container = scene.add.container(cx, cy, items);
    container.setDepth(10000); // Always above gameplay sprites
    this.container = container;

    if (Accessibility.reducedMotion) {
      container.setAlpha(1);
    } else {
      container.setAlpha(0);
      container.y += 8;
      this.activeTween = scene.tweens.add({
        targets: container,
        alpha: 1,
        y: cy,
        duration: 220,
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
      y: c.y + 8,
      duration: 200,
      ease: 'Sine.easeIn',
      onComplete: () => {
        c.destroy();
        onDismiss?.();
      }
    });
  }

  isVisible() { return !!this.container; }
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Draw a rounded rectangle with an optional triangular tail as ONE
 * combined path. The stroke wraps the whole outline, so there's no
 * line crossing the base of the tail.
 *
 *   tailAnchorX  — local x where the tail meets the bubble (or null)
 *   tailAbove    — true if the tail points upward (bubble below speaker)
 */
function drawBubbleWithTail(g, w, h, radius, tailAnchorX, tailAbove) {
  const r  = Math.min(radius, h / 2 - 1, w / 2 - 1);
  const hx = w / 2;
  const hy = h / 2;

  // Build a path that traces the rounded rect, with the tail bulging
  // out at one of the long edges.
  g.beginPath();
  // Top-left arc start
  g.moveTo(-hx + r, -hy);

  // Top edge (with optional tail going UP)
  if (tailAnchorX !== null && !tailAbove) {
    // tail points upward (bubble is BELOW speaker), so it sits on the top edge
    const ax = tailAnchorX;
    g.lineTo(ax - TAIL_WIDTH / 2, -hy);
    g.lineTo(ax,                  -hy - TAIL_HEIGHT);
    g.lineTo(ax + TAIL_WIDTH / 2, -hy);
  }
  g.lineTo(hx - r, -hy);
  // Top-right corner
  g.arc(hx - r, -hy + r, r, -Math.PI / 2, 0);
  g.lineTo(hx, hy - r);
  // Bottom-right corner
  g.arc(hx - r, hy - r, r, 0, Math.PI / 2);

  // Bottom edge (with optional tail going DOWN)
  if (tailAnchorX !== null && tailAbove) {
    // tail points downward (bubble is ABOVE speaker), so it sits on bottom edge
    const ax = tailAnchorX;
    g.lineTo(ax + TAIL_WIDTH / 2, hy);
    g.lineTo(ax,                  hy + TAIL_HEIGHT);
    g.lineTo(ax - TAIL_WIDTH / 2, hy);
  }
  g.lineTo(-hx + r, hy);
  // Bottom-left corner
  g.arc(-hx + r, hy - r, r, Math.PI / 2, Math.PI);
  g.lineTo(-hx, -hy + r);
  // Top-left corner
  g.arc(-hx + r, -hy + r, r, Math.PI, -Math.PI / 2);

  g.closePath();

  g.fillStyle(BG_COLOUR, BG_ALPHA);
  g.fillPath();
  g.lineStyle(STROKE_WIDTH, STROKE_COLOUR, 1);
  g.strokePath();
}

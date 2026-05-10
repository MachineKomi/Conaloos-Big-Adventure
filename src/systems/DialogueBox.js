/**
 * DialogueBox / SpeechBubble — translucent rounded text panel with a
 * triangular tail pointing at the speaker.
 *
 * v1.7 polish: pulls colour/stroke/typography from UITokens so bubbles
 * speak the same visual language as panels and chips. A soft drop
 * shadow underneath gives the bubble lift without making it heavy.
 *
 * - If a `speakerSprite` is provided, the bubble anchors above (or below)
 *   the sprite with a tail pointing at it.
 * - If no speaker (Tiny Museum / Question Stone narrator), the bubble
 *   appears as a soft top-of-screen banner with no tail.
 * - Tap anywhere — bubble or background — to dismiss. No auto-timer:
 *   the kid (or grown-up reading aloud) has all the time they need.
 */

import { Accessibility } from './Accessibility.js';
import { COL, STROKE, RADIUS, TYPE, ANIM } from './UITokens.js';

const PADDING_X = 22;
const PADDING_Y = 18;
const MAX_WIDTH_FRACTION = 0.62;
const MAX_NARRATOR_WIDTH_FRACTION = 0.78;
const MARGIN_FROM_EDGE = 24;
const CORNER_RADIUS = RADIUS.panel;
const TAIL_HEIGHT = 16;
const TAIL_WIDTH = 26;
const HUD_RESERVED_TOP = 120;

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
      fontFamily: TYPE.bodyFamily,
      fontSize: `${fontSize}px`,
      color: COL.inkHex,
      align: 'center',
      lineSpacing: Math.round(fontSize * 0.25),
      wordWrap: { width: maxTextWidth, useAdvancedWrap: true }
    }).setOrigin(0.5, 0.5);

    const boxW = textObj.width + PADDING_X * 2;
    const boxH = textObj.height + PADDING_Y * 2;

    // Drop shadow + bubble drawn as one combined path so the stroke
    // wraps the OUTSIDE of the whole shape (no line crossing the
    // tail base).
    const shadow = scene.add.graphics();
    const bg = scene.add.graphics();

    const items = [shadow, bg, textObj];

    let cx, cy, tailAnchorX = null, tailAbove = false;

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

    drawBubbleShadow(shadow, boxW, boxH, CORNER_RADIUS, tailAnchorX, tailAbove);
    drawBubbleWithTail(bg, boxW, boxH, CORNER_RADIUS, tailAnchorX, tailAbove);

    const container = scene.add.container(cx, cy, items);
    container.setDepth(10000); // Always above gameplay sprites
    this.container = container;
    this._onDismiss = opts.onDismiss || null;

    if (Accessibility.reducedMotion) {
      container.setAlpha(1);
    } else {
      container.setAlpha(0);
      container.y += 10;
      // Subtle scale-from for a "popping into being" feel.
      container.setScale(0.96);
      this.activeTween = scene.tweens.add({
        targets: container,
        alpha: 1,
        y: cy,
        scale: 1,
        duration: ANIM.panelOpen,
        ease: 'Back.easeOut'
      });
    }

    // Tap on the bubble itself dismisses (transparent zone on top).
    // Tap on the background is handled by GameScene's pointerup.
    const hitH = boxH + (tailAnchorX !== null ? TAIL_HEIGHT : 0) + 8;
    const tapZone = scene.add.zone(0, 0, boxW + 8, hitH).setOrigin(0.5);
    tapZone.setInteractive({ useHandCursor: true });
    tapZone.on('pointerup', () => this.dismiss(this._onDismiss));
    container.add(tapZone);
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
      duration: ANIM.panelClose,
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
 * Three soft layers of shadow, each progressively wider and lighter,
 * matching the drawDropShadow helper in UITokens — but we have to
 * trace the bubble+tail outline ourselves because of the tail.
 */
function drawBubbleShadow(g, w, h, radius, tailAnchorX, tailAbove) {
  const layers = [
    { o: 4, alpha: 0.08 },
    { o: 8, alpha: 0.05 },
    { o: 12, alpha: 0.03 }
  ];
  for (const l of layers) {
    g.fillStyle(COL.shadow, l.alpha);
    tracePath(g, w + l.o * 2 - 4, h + l.o, radius + l.o, tailAnchorX, tailAbove,
              -l.o + 2, l.o);
    g.fillPath();
  }
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
  tracePath(g, w, h, radius, tailAnchorX, tailAbove, 0, 0);
  g.fillStyle(COL.paper, 0.97);
  g.fillPath();
  g.lineStyle(STROKE.panel, COL.ink, 1);
  g.strokePath();
}

/** Build the bubble+tail path. dx/dy translate the whole shape. */
function tracePath(g, w, h, radius, tailAnchorX, tailAbove, dx, dy) {
  const r  = Math.min(radius, h / 2 - 1, w / 2 - 1);
  const hx = w / 2;
  const hy = h / 2;

  g.beginPath();
  g.moveTo(dx + -hx + r, dy + -hy);

  // Top edge (with optional tail going UP)
  if (tailAnchorX !== null && !tailAbove) {
    const ax = tailAnchorX;
    g.lineTo(dx + ax - TAIL_WIDTH / 2, dy + -hy);
    g.lineTo(dx + ax,                  dy + -hy - TAIL_HEIGHT);
    g.lineTo(dx + ax + TAIL_WIDTH / 2, dy + -hy);
  }
  g.lineTo(dx + hx - r, dy + -hy);
  g.arc(dx + hx - r, dy + -hy + r, r, -Math.PI / 2, 0);
  g.lineTo(dx + hx, dy + hy - r);
  g.arc(dx + hx - r, dy + hy - r, r, 0, Math.PI / 2);

  // Bottom edge (with optional tail going DOWN)
  if (tailAnchorX !== null && tailAbove) {
    const ax = tailAnchorX;
    g.lineTo(dx + ax + TAIL_WIDTH / 2, dy + hy);
    g.lineTo(dx + ax,                  dy + hy + TAIL_HEIGHT);
    g.lineTo(dx + ax - TAIL_WIDTH / 2, dy + hy);
  }
  g.lineTo(dx + -hx + r, dy + hy);
  g.arc(dx + -hx + r, dy + hy - r, r, Math.PI / 2, Math.PI);
  g.lineTo(dx + -hx, dy + -hy + r);
  g.arc(dx + -hx + r, dy + -hy + r, r, Math.PI, -Math.PI / 2);

  g.closePath();
}

/**
 * GemHUDScene — top-CENTRE counter showing the player's running total.
 *
 * Two-stage feedback so rapid pickups still get a visible math beat:
 *
 *   1. While gems are arriving, a "running batch" panel sits BELOW the
 *      total counter and shows the live additions: "+3", then "+3 +5",
 *      then "+3 +5 +1", etc. Each pickup pops in.
 *   2. After ~1.4s of no new pickups, the batch settles: it animates
 *      the equation "previousTotal + batchSum = newTotal" beneath the
 *      counter, then the running total updates with a celebratory pop.
 *      The batch panel fades out.
 *
 * This way every gem registers visually (no missed math reveals when
 * the kid is rapid-tapping) AND every batch resolves into a math
 * lesson that holds together regardless of tap speed.
 */

import Phaser from 'phaser';
import { COL, RADIUS, STROKE, TOPBAR, TYPE, drawPanel } from './UITokens.js';

const PANEL_TOP = TOPBAR.paddingTop;
const PANEL_H = TOPBAR.itemH;
const PANEL_PADDING_X = 18;

const ICON_SIZE = 56;
const ICON_GAP = 12;

const BATCH_PANEL_BG = COL.gold;
const BATCH_PANEL_BG_ALPHA = 0.95;
const BATCH_PANEL_PADDING = 16;
const BATCH_PANEL_GAP = 10;

const BATCH_SETTLE_MS = 1400;
const REVEAL_STEP_MS = 460;

const ICON_DEFAULT_KEY = 'gem_5';

export class GemHUDScene extends Phaser.Scene {
  constructor() {
    super({ key: 'global:gemhud', active: false });
    this._lastGemKey = null;

    // Batch state — accumulates gems collected in quick succession.
    this._batchActive = false;
    this._batchSubtotal = 0;
    this._batchPickups = [];   // array of values for display
    this._batchStartTotal = 0;
    this._batchSettleTimer = null;
    this._batchPanelG = null;
    this._batchText = null;
  }

  init({ gemBag } = {}) {
    this.gemBag = gemBag || this.gemBag;
  }

  create() {
    this._unsubscribe = this.gemBag.onChange((evt) => this._onChange(evt));
    this._build();
    this.scene.bringToTop();
    this.scale.on('resize', () => this._reposition());
    this.events.on('shutdown', () => {
      this._unsubscribe?.();
      this._batchSettleTimer?.remove(false);
    });
  }

  _build() {
    this._panel = this.add.graphics().setDepth(8000);
    this._totalText = this.add.text(0, 0, `${this.gemBag.total}`, {
      fontFamily: TYPE.family,
      fontSize: `${TYPE.hero}px`,
      color: COL.inkHex
    }).setOrigin(0, 0.5).setDepth(8002);

    // Batch (running additions) panel — hidden until first pickup.
    this._batchPanelG = this.add.graphics().setDepth(7980);
    this._batchText = this.add.text(0, 0, '', {
      fontFamily: TYPE.family,
      fontSize: `${TYPE.heading}px`,
      color: COL.orangeHex
    }).setOrigin(0.5, 0.5).setDepth(7981);
    this._hideBatchPanel();

    this._setIconKey(ICON_DEFAULT_KEY);
    this._reposition();
  }

  /** Used by GameScene._flyGemToHud to know where to fly to. */
  getIconPosition() {
    if (!this._icon) return { x: this.scale.width / 2, y: PANEL_TOP + PANEL_H / 2 };
    return { x: this._icon.x, y: this._icon.y };
  }

  _setIconKey(key) {
    if (!key || !this.textures.exists(key)) return;
    this._lastGemKey = key;
    if (!this._icon) {
      this._icon = this.add.image(0, 0, key).setOrigin(0.5).setDepth(8001);
    } else {
      this._icon.setTexture(key);
    }
    const tex = this.textures.get(key).getSourceImage();
    this._icon.setScale(ICON_SIZE / tex.height);
  }

  _reposition() {
    const { width } = this.scale;
    const textW = Math.max(this._totalText.width, 56); // floor so single-digit doesn't look cramped
    const panelW = PANEL_PADDING_X + ICON_SIZE + ICON_GAP + textW + PANEL_PADDING_X;
    const x = (width - panelW) / 2;
    const y = PANEL_TOP;

    this._panel.clear();
    drawPanel(this._panel, x, y, panelW, PANEL_H, { radius: RADIUS.card });

    if (this._icon) {
      this._icon.setPosition(x + PANEL_PADDING_X + ICON_SIZE / 2, y + PANEL_H / 2);
    }
    this._totalText.setPosition(x + PANEL_PADDING_X + ICON_SIZE + ICON_GAP, y + PANEL_H / 2);

    this._renderBatchPanel();
  }

  _setText(s) {
    this._totalText.setText(s);
    this._reposition();
  }

  // -------------------------------------------------------------- //
  //                          batch logic                           //
  // -------------------------------------------------------------- //

  _onChange({ gemKey, delta, previousTotal, newTotal }) {
    if (!this._totalText) return;
    if (gemKey) this._setIconKey(gemKey);

    if (!this._batchActive) {
      this._batchActive = true;
      this._batchStartTotal = previousTotal;
      this._batchSubtotal = 0;
      this._batchPickups = [];
    }
    this._batchSubtotal += delta;
    this._batchPickups.push(delta);

    // The total counter always tracks the bag's authoritative total
    // immediately, so the kid can see it ticking up too.
    this._totalText.setText(`${newTotal}`);
    this._reposition();
    this._popTotalCounter();

    this._renderBatchPanel();

    // Reset settle timer.
    this._batchSettleTimer?.remove(false);
    this._batchSettleTimer = this.time.delayedCall(BATCH_SETTLE_MS, () => {
      this._settleBatch();
    });
  }

  _renderBatchPanel() {
    if (!this._batchActive || this._batchPickups.length === 0) {
      this._hideBatchPanel();
      return;
    }
    // Build the running expression. The FIRST number is bare so the
    // panel reads as a real sum, not "+3 +5 +1". Subsequent numbers
    // get a "+" prefix.
    //
    //   pickups [3]         → "3"
    //   pickups [3, 5]      → "3 + 5"
    //   pickups [3, 5, 1]   → "3 + 5 + 1"
    const pickups = this._batchPickups;
    let text = `${pickups[0]}`;
    for (let i = 1; i < pickups.length; i++) text += ` + ${pickups[i]}`;
    this._batchText.setText(text);

    const { width } = this.scale;
    const w = this._batchText.width + BATCH_PANEL_PADDING * 2;
    const h = this._batchText.height + BATCH_PANEL_PADDING * 2 - 6;
    const x = (width - w) / 2;
    const y = PANEL_TOP + PANEL_H + BATCH_PANEL_GAP;

    this._batchPanelG.clear();
    drawPanel(this._batchPanelG, x, y, w, h, {
      radius: RADIUS.chip,
      stroke: STROKE.small,
      fill: BATCH_PANEL_BG,
      fillAlpha: BATCH_PANEL_BG_ALPHA
    });
    this._batchText.setPosition(x + w / 2, y + h / 2);
    this._batchPanelG.setAlpha(1);
    this._batchText.setAlpha(1);

    // Quick pop on the most recent addition.
    this.tweens.add({
      targets: this._batchText,
      scale: { from: 1.18, to: 1.0 },
      duration: 200,
      ease: 'Back.easeOut'
    });
  }

  _hideBatchPanel() {
    this._batchPanelG.clear();
    this._batchText.setAlpha(0);
  }

  _popTotalCounter() {
    this.tweens.killTweensOf(this._totalText);
    this.tweens.add({
      targets: this._totalText,
      scale: { from: 1.18, to: 1.0 },
      duration: 200,
      ease: 'Back.easeOut'
    });
  }

  /**
   * After the batch settles (~1.4s of quiet), reveal the math in
   * two stages so the kid sees the full chain:
   *
   *   Stage 1 (subtotal):  "3 + 5 + 1"          → "3 + 5 + 1 = 9"
   *   pause...
   *   Stage 2 (total):     "12 + 9"             → "12 + 9 = 21"
   *
   * That way every gem in the burst contributes visibly to the
   * subtotal, and the subtotal contributes visibly to the new total.
   */
  _settleBatch() {
    if (!this._batchActive) return;
    const startTotal = this._batchStartTotal;
    const subtotal = this._batchSubtotal;
    const newTotal = startTotal + subtotal;
    const pickups = this._batchPickups.slice();

    // The current text is already "n1 + n2 + n3" from live updates.
    // Step 1: append " = subtotal".
    const subtotalExpr = pickups[0]
      + pickups.slice(1).map((v) => ` + ${v}`).join('')
      + ` = ${subtotal}`;

    const showAndPop = (text) => {
      this._batchText.setText(text);
      this._renderBatchPanelLayout();
      this.tweens.add({
        targets: this._batchText,
        scale: { from: 1.15, to: 1.0 },
        duration: 200,
        ease: 'Sine.easeOut'
      });
    };

    // Stage 1: subtotal reveal.
    showAndPop(subtotalExpr);

    // Stage 2: build the parts of "startTotal + subtotal = newTotal"
    // and reveal them one by one after a beat.
    this.time.delayedCall(REVEAL_STEP_MS + 600, () => {
      if (!this._batchActive) return;
      // Wipe to the new equation (clean transition rather than a
      // confusing one-line "subtotal expr + total expr").
      const totalParts = [
        `${startTotal}`,
        ` + ${subtotal}`,
        ` = ${newTotal}`
      ];
      let i = 0;
      const stepTotal = () => {
        if (!this._batchActive) return;
        showAndPop(totalParts.slice(0, i + 1).join(''));
        if (i < totalParts.length - 1) {
          i++;
          this.time.delayedCall(REVEAL_STEP_MS, stepTotal);
        } else {
          // Hold the final equation, then fade.
          this.time.delayedCall(REVEAL_STEP_MS + 400, () => {
            this.tweens.add({
              targets: [this._batchPanelG, this._batchText],
              alpha: 0,
              duration: 360,
              ease: 'Sine.easeOut',
              onComplete: () => {
                this._batchActive = false;
                this._batchSubtotal = 0;
                this._batchPickups = [];
                this._batchPanelG.clear();
              }
            });
          });
        }
      };
      stepTotal();
    });
  }

  /** Re-fit the batch panel to whatever text is in it right now. */
  _renderBatchPanelLayout() {
    const { width } = this.scale;
    const w = this._batchText.width + BATCH_PANEL_PADDING * 2;
    const h = this._batchText.height + BATCH_PANEL_PADDING * 2 - 6;
    const x = (width - w) / 2;
    const y = PANEL_TOP + PANEL_H + BATCH_PANEL_GAP;

    this._batchPanelG.clear();
    drawPanel(this._batchPanelG, x, y, w, h, {
      radius: RADIUS.chip,
      stroke: STROKE.small,
      fill: BATCH_PANEL_BG,
      fillAlpha: BATCH_PANEL_BG_ALPHA
    });
    this._batchText.setPosition(x + w / 2, y + h / 2);
  }
}

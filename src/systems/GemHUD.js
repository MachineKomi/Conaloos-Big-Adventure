/**
 * GemHUDScene — top-CENTRE counter showing the player's running total,
 * with a "math reveal" panel underneath that animates the equation
 * for each burst of gem pickups.
 *
 * State machine (simple and *strict*, so two equations can never
 * appear at the same time):
 *
 *   idle  ── gem arrives ──▶  collecting
 *   collecting ── gem arrives ──▶  collecting (resets settle timer)
 *   collecting ── 1.4s of quiet ──▶  settling (animation runs)
 *   settling  ── animation done ──▶  idle (or back to collecting if
 *                                    gems queued up during settle)
 *   settling  ── gem arrives ──▶  pushed to a *pending* queue,
 *                                  state stays settling
 *
 * The pending queue is the key fix for v1.9.2: previously, gems that
 * arrived during a settle could RESET the settle timer, leaving the
 * still-running animation chain to mutate the panel mid-flight (with
 * stale closure values) AND cause a second `_settleBatch` to fire on
 * the new timer, which produced an unexplained second equation. Now,
 * a settle in progress runs to completion with its captured values,
 * and any queued gems start a fresh batch when the panel fades.
 *
 * Counter behaviour stays the same as v1.8: the top counter is
 * locked at the *batch start total* through every collecting +
 * animation step; only the final "= newTotal" reveal flashes it to
 * the new value (orange + scale pop).
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
const FADE_HOLD_MS = REVEAL_STEP_MS + 400;
const FADE_MS = 360;

const ICON_DEFAULT_KEY = 'gem_5';

const STATE_IDLE = 'idle';
const STATE_COLLECTING = 'collecting';
const STATE_SETTLING = 'settling';

export class GemHUDScene extends Phaser.Scene {
  constructor() {
    super({ key: 'global:gemhud', active: false });
    this._lastGemKey = null;

    this._state = STATE_IDLE;
    this._batchStartTotal = 0;
    this._batchPickups = [];        // [int, int, ...] — deltas in this batch
    this._settleTimer = null;       // Phaser TimerEvent — fires _beginSettle
    this._animTimers = [];          // delayedCalls owned by the in-flight settle
    this._pendingPickups = [];      // {delta, prev} arrived during settle, drained next

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
      this._cancelAllTimers();
    });
  }

  _build() {
    this._panel = this.add.graphics().setDepth(8000);
    this._totalText = this.add.text(0, 0, `${this.gemBag.total}`, {
      fontFamily: TYPE.family,
      fontSize: `${TYPE.hero}px`,
      color: COL.inkHex
    }).setOrigin(0, 0.5).setDepth(8002);

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
    const textW = Math.max(this._totalText.width, 56);
    const panelW = PANEL_PADDING_X + ICON_SIZE + ICON_GAP + textW + PANEL_PADDING_X;
    const x = (width - panelW) / 2;
    const y = PANEL_TOP;

    this._panel.clear();
    drawPanel(this._panel, x, y, panelW, PANEL_H, { radius: RADIUS.card });

    if (this._icon) {
      this._icon.setPosition(x + PANEL_PADDING_X + ICON_SIZE / 2, y + PANEL_H / 2);
    }
    this._totalText.setPosition(x + PANEL_PADDING_X + ICON_SIZE + ICON_GAP, y + PANEL_H / 2);

    // Only re-render the live "3 + 5 + 1" panel during the
    // collecting phase. During settling, the panel is showing
    // captured equation text and must NOT be overwritten by a
    // resize event mid-animation.
    if (this._state === STATE_COLLECTING) this._renderBatchPanelLive();
  }

  // -------------------------------------------------------------- //
  //                          batch logic                           //
  // -------------------------------------------------------------- //

  _onChange({ gemKey, delta, previousTotal, newTotal }) {
    if (!this._totalText) return;
    if (gemKey) this._setIconKey(gemKey);

    // External reset (new game from title): snap to whatever the bag
    // says, drop any in-flight animation, clear queue.
    if (!gemKey && delta === 0) {
      this._fullReset(newTotal);
      return;
    }

    if (this._state === STATE_SETTLING) {
      // Don't disturb the in-flight equation. Queue this gem; a fresh
      // batch will start when the animation finishes fading.
      this._pendingPickups.push({ delta, previousTotal });
      return;
    }

    if (this._state === STATE_IDLE) {
      this._state = STATE_COLLECTING;
      this._batchStartTotal = previousTotal;
      this._batchPickups = [];
      // Lock the top counter to the start total until the equation
      // resolves. The counter only flashes to the new total at the
      // very end of settle, so the kid sees the equation actually
      // *become* the new total.
      this._totalText.setText(`${this._batchStartTotal}`);
      this._reposition();
    }

    this._batchPickups.push(delta);
    this._renderBatchPanelLive();

    // Reset settle timer — every new pickup pushes it back.
    this._settleTimer?.remove(false);
    this._settleTimer = this.time.delayedCall(BATCH_SETTLE_MS, () => this._beginSettle());
  }

  /** Render the running "3 + 5 + 1" panel (collecting state). */
  _renderBatchPanelLive() {
    if (this._batchPickups.length === 0) {
      this._hideBatchPanel();
      return;
    }
    let text = `${this._batchPickups[0]}`;
    for (let i = 1; i < this._batchPickups.length; i++) {
      text += ` + ${this._batchPickups[i]}`;
    }
    this._setBatchText(text);

    // Quick pop on the most recent addition.
    this.tweens.add({
      targets: this._batchText,
      scale: { from: 1.18, to: 1.0 },
      duration: 200,
      ease: 'Back.easeOut'
    });
  }

  /** Set batch text + redraw the panel sized to fit. */
  _setBatchText(text) {
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
  }

  _hideBatchPanel() {
    this._batchPanelG.clear();
    this._batchText.setAlpha(0);
  }

  /** Snap the counter to a value with an extra-celebratory pop +
   *  colour flash. Called at the final "= newTotal" reveal. */
  _flashTotalCounterTo(newTotal) {
    this.tweens.killTweensOf(this._totalText);
    this._totalText.setText(`${newTotal}`);
    this._reposition();
    this._totalText.setColor(COL.orangeHex);
    this.tweens.add({
      targets: this._totalText,
      scale: { from: 1.35, to: 1.0 },
      duration: 320,
      ease: 'Back.easeOut',
      onComplete: () => this._totalText.setColor(COL.inkHex)
    });
  }

  /**
   * Settle the current collecting batch into the equation animation:
   *
   *   subtotal reveal:   "3 + 5 + 1 = 9"
   *   pause...
   *   total reveal:      "12"  →  "12 + 9"  →  "12 + 9 = 21" (counter flashes)
   *   pause...
   *   fade panel.
   *
   * Captures all values up-front in local consts; the closure never
   * reads `this._batchPickups` again, so a gem that arrives
   * mid-animation can't poison the running equation.
   */
  _beginSettle() {
    if (this._state !== STATE_COLLECTING) return;
    if (this._batchPickups.length === 0) {
      // Nothing to settle (shouldn't happen, but be safe).
      this._state = STATE_IDLE;
      return;
    }
    this._state = STATE_SETTLING;
    this._settleTimer = null;

    const startTotal = this._batchStartTotal;
    const pickups = this._batchPickups.slice();
    const subtotal = pickups.reduce((s, v) => s + v, 0);
    const newTotal = startTotal + subtotal;

    const showAndPop = (text) => {
      // Guard: if we got reset (new game) mid-animation, bail.
      if (this._state !== STATE_SETTLING) return;
      this._setBatchText(text);
      this.tweens.add({
        targets: this._batchText,
        scale: { from: 1.15, to: 1.0 },
        duration: 200,
        ease: 'Sine.easeOut'
      });
    };

    const pushTimer = (delay, fn) => {
      const t = this.time.delayedCall(delay, fn);
      this._animTimers.push(t);
      return t;
    };

    // Stage 1 — the subtotal reveal.
    //   "3 + 5 + 1" is already on-screen from the live render; we
    //   just append " = 9" for continuity.
    const subtotalExpr = pickups[0]
      + pickups.slice(1).map((v) => ` + ${v}`).join('')
      + ` = ${subtotal}`;
    showAndPop(subtotalExpr);

    // Stage 2 — wipe to the new equation, reveal it part by part.
    const totalParts = [
      `${startTotal}`,
      ` + ${subtotal}`,
      ` = ${newTotal}`
    ];

    pushTimer(REVEAL_STEP_MS + 600, () => {
      let i = 0;
      const stepTotal = () => {
        if (this._state !== STATE_SETTLING) return;
        showAndPop(totalParts.slice(0, i + 1).join(''));
        // Final "= newTotal" — flash the top counter NOW so the kid
        // sees the equation *become* the new total.
        if (i === totalParts.length - 1) this._flashTotalCounterTo(newTotal);

        if (i < totalParts.length - 1) {
          i++;
          pushTimer(REVEAL_STEP_MS, stepTotal);
        } else {
          // Hold the final equation, then fade.
          pushTimer(FADE_HOLD_MS, () => {
            if (this._state !== STATE_SETTLING) return;
            this.tweens.add({
              targets: [this._batchPanelG, this._batchText],
              alpha: 0,
              duration: FADE_MS,
              ease: 'Sine.easeOut',
              onComplete: () => this._onSettleFadeDone()
            });
          });
        }
      };
      stepTotal();
    });
  }

  /** Called when the settle's fade completes. Drain any pending
   *  pickups into a fresh batch, or return to idle. */
  _onSettleFadeDone() {
    if (this._state !== STATE_SETTLING) return;
    this._batchPanelG.clear();
    this._batchText.setText('');
    this._batchText.setAlpha(0);
    this._batchPickups = [];
    this._animTimers = [];

    const pending = this._pendingPickups;
    this._pendingPickups = [];

    if (pending.length === 0) {
      this._state = STATE_IDLE;
      return;
    }

    // Drain pending into a fresh collecting batch. Pending items come
    // in arrival order; pending[0].previousTotal is the bag's total
    // *before* the first queued gem was added — exactly the right
    // start for the new equation.
    this._state = STATE_COLLECTING;
    this._batchStartTotal = pending[0].previousTotal;
    this._batchPickups = pending.map((p) => p.delta);

    this._totalText.setText(`${this._batchStartTotal}`);
    this._reposition();
    this._renderBatchPanelLive();

    this._settleTimer?.remove(false);
    this._settleTimer = this.time.delayedCall(BATCH_SETTLE_MS, () => this._beginSettle());
  }

  /** Drop EVERY in-flight timer / tween, reset state to idle. Used
   *  on shutdown and on "new game" external reset. */
  _cancelAllTimers() {
    this._settleTimer?.remove(false);
    this._settleTimer = null;
    for (const t of this._animTimers) t?.remove?.(false);
    this._animTimers = [];
    this.tweens.killTweensOf([this._batchText, this._batchPanelG, this._totalText]);
  }

  _fullReset(newTotal) {
    this._cancelAllTimers();
    this._state = STATE_IDLE;
    this._batchPickups = [];
    this._pendingPickups = [];
    this._batchStartTotal = 0;
    this._totalText.setText(`${newTotal ?? 0}`);
    this._totalText.setColor(COL.inkHex);
    this._totalText.setScale(1);
    this._reposition();
    this._hideBatchPanel();
  }
}

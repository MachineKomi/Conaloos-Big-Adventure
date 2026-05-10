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

const PANEL_TOP = 12;
const PANEL_H = 80;
const PANEL_RADIUS = 24;
const PANEL_PADDING_X = 18;
const PANEL_BG = 0xfff8e7;
const PANEL_BG_ALPHA = 0.94;
const PANEL_STROKE = 0x4a3a1f;
const PANEL_STROKE_W = 4;

const ICON_SIZE = 56;
const ICON_GAP = 12;
const TEXT_FONT_PX = 36;
const TEXT_COLOUR = '#4a3a1f';

const BATCH_PANEL_BG = 0xfff2a8;
const BATCH_PANEL_BG_ALPHA = 0.95;
const BATCH_PANEL_PADDING = 16;
const BATCH_FONT_PX = 32;
const BATCH_PANEL_GAP = 10;       // distance below the total panel

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
      fontFamily: '"Fredoka", "Atkinson Hyperlegible", system-ui, sans-serif',
      fontSize: `${TEXT_FONT_PX}px`,
      color: TEXT_COLOUR
    }).setOrigin(0, 0.5).setDepth(8002);

    // Batch (running additions) panel — hidden until first pickup.
    this._batchPanelG = this.add.graphics().setDepth(7980);
    this._batchText = this.add.text(0, 0, '', {
      fontFamily: '"Fredoka", "Atkinson Hyperlegible", system-ui, sans-serif',
      fontSize: `${BATCH_FONT_PX}px`,
      color: '#a45e08'
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
    const textW = this._totalText.width || 32;
    const panelW = PANEL_PADDING_X + ICON_SIZE + ICON_GAP + textW + PANEL_PADDING_X;
    const x = (width - panelW) / 2;
    const y = PANEL_TOP;

    this._panel.clear();
    this._panel.fillStyle(PANEL_BG, PANEL_BG_ALPHA);
    this._panel.lineStyle(PANEL_STROKE_W, PANEL_STROKE, 1);
    this._panel.fillRoundedRect(x, y, panelW, PANEL_H, PANEL_RADIUS);
    this._panel.strokeRoundedRect(x, y, panelW, PANEL_H, PANEL_RADIUS);

    if (this._icon) {
      this._icon.setPosition(x + PANEL_PADDING_X + ICON_SIZE / 2, y + PANEL_H / 2);
    }
    this._totalText.setPosition(x + PANEL_PADDING_X + ICON_SIZE + ICON_GAP, y + PANEL_H / 2);

    // Reposition the batch panel underneath the total.
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
    // Build the running text: "+3 +5 +1"
    const text = this._batchPickups.map((v) => `+${v}`).join('  ');
    this._batchText.setText(text);

    const { width } = this.scale;
    const w = this._batchText.width + BATCH_PANEL_PADDING * 2;
    const h = this._batchText.height + BATCH_PANEL_PADDING * 2 - 6;
    const x = (width - w) / 2;
    const y = PANEL_TOP + PANEL_H + BATCH_PANEL_GAP;

    this._batchPanelG.clear();
    this._batchPanelG.fillStyle(BATCH_PANEL_BG, BATCH_PANEL_BG_ALPHA);
    this._batchPanelG.lineStyle(3, PANEL_STROKE, 1);
    this._batchPanelG.fillRoundedRect(x, y, w, h, 16);
    this._batchPanelG.strokeRoundedRect(x, y, w, h, 16);

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
   * After the batch settles (no new pickups for ~1.4s), animate an
   * equation reveal that turns the running additions into the new
   * total, then fade the batch panel.
   */
  _settleBatch() {
    if (!this._batchActive) return;
    const startTotal = this._batchStartTotal;
    const subtotal = this._batchSubtotal;
    const newTotal = startTotal + subtotal;

    // Build the equation step-by-step.
    const equationParts = [
      `${startTotal}`,
      ` + ${subtotal}`,
      ` = ${newTotal}`
    ];

    let i = 0;
    const showStep = () => {
      if (!this._batchActive) return;
      const partial = equationParts.slice(0, i + 1).join('');
      this._batchText.setText(partial);
      this._renderBatchPanelLayout();
      this.tweens.add({
        targets: this._batchText,
        scale: { from: 1.15, to: 1.0 },
        duration: 200,
        ease: 'Sine.easeOut'
      });
      if (i < equationParts.length - 1) {
        i++;
        this.time.delayedCall(REVEAL_STEP_MS, showStep);
      } else {
        // Final hold, then fade out.
        this.time.delayedCall(REVEAL_STEP_MS + 300, () => {
          this.tweens.add({
            targets: [this._batchPanelG, this._batchText],
            alpha: 0,
            duration: 320,
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
    showStep();
  }

  /** Re-fit the batch panel to whatever text is in it right now. */
  _renderBatchPanelLayout() {
    const { width } = this.scale;
    const w = this._batchText.width + BATCH_PANEL_PADDING * 2;
    const h = this._batchText.height + BATCH_PANEL_PADDING * 2 - 6;
    const x = (width - w) / 2;
    const y = PANEL_TOP + PANEL_H + BATCH_PANEL_GAP;

    this._batchPanelG.clear();
    this._batchPanelG.fillStyle(BATCH_PANEL_BG, BATCH_PANEL_BG_ALPHA);
    this._batchPanelG.lineStyle(3, PANEL_STROKE, 1);
    this._batchPanelG.fillRoundedRect(x, y, w, h, 16);
    this._batchPanelG.strokeRoundedRect(x, y, w, h, 16);

    this._batchText.setPosition(x + w / 2, y + h / 2);
  }
}

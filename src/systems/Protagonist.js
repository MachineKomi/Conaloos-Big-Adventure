/**
 * Protagonist — owns Amelia's sprite across scenes.
 *
 * One singleton per game. Each `GameScene.create()` calls `attach(scene)`
 * which (re)creates her sprite in the new scene at the appropriate entry
 * point. Click anywhere → Amelia tweens horizontally toward the click,
 * then a callback fires (so the click target can do its thing AFTER she
 * arrives — e.g. a portal navigates only once she's reached it).
 *
 * She does not pathfind; she does a straight horizontal-then-vertical
 * tween, capped to the scene floor so she stays grounded. This keeps the
 * "no drag, one input" pillar intact while giving the world a player-
 * character that visibly moves on every click.
 */

import { Accessibility } from './Accessibility.js';

const FLOOR_Y_FRAC = 0.95;
const WALK_SPEED_PX_PER_SEC = 600;
const MIN_WALK_MS = 220;
const MAX_WALK_MS = 900;
const REDUCED_MOTION_MS = 0;
const HEIGHT_FRAC = 0.55;
const SPRITE_KEY = 'peep_Amelia_F_4';
const Z_DEPTH = 800;

export class Protagonist {
  constructor() {
    this.scene = null;
    this.sprite = null;
    this._walkTween = null;
    this._collected = new Set();          // thing keys Amelia has picked up
    this._collectListeners = new Set();
    this._lastDirection = 'right';
  }

  /**
   * Spawn Amelia in the given scene at an entry point determined by the
   * portal we just came through. `fromEdge` is one of 'left' | 'right' |
   * 'top' | 'bottom' | null (default: bottom-centre).
   */
  attach(scene, { fromEdge = null } = {}) {
    this.scene = scene;
    if (!scene.textures.exists(SPRITE_KEY)) {
      // Sprite not loaded — silent fail; another character takes the lead.
      return;
    }

    const { width, height } = scene.scale;
    const floorY = height * FLOOR_Y_FRAC;

    let startX, startY = floorY;
    switch (fromEdge) {
      case 'left':   startX = -width * 0.10; break;
      case 'right':  startX = width * 1.10; break;
      case 'top':    startX = width * 0.50; startY = -height * 0.10; break;
      case 'bottom': startX = width * 0.50; startY = height * 1.10; break;
      default:       startX = width * 0.50;
    }

    this.sprite = scene.add
      .image(startX, startY, SPRITE_KEY)
      .setOrigin(0.5, 1)
      .setDepth(Z_DEPTH);

    const sourceH = this.sprite.height || 1;
    this.sprite.setScale((height * HEIGHT_FRAC) / sourceH);

    // Walk to the resting position from the entry edge.
    const restX = width * 0.50;
    const restY = floorY;
    if (fromEdge && !Accessibility.reducedMotion) {
      this._tweenTo(restX, restY, this._durationFor(startX, restX));
    } else {
      this.sprite.setPosition(restX, restY);
    }

    // Capture the sprite + tween references so the shutdown listener
    // destroys *this* scene's sprite, not whatever sprite the singleton
    // happens to be holding by the time the listener fires (which would
    // be the *next* scene's sprite, since attach() runs synchronously
    // during the new scene's create() but the old scene's shutdown event
    // fires later).
    const localSprite = this.sprite;
    const captureWalkTween = () => this._walkTween;
    scene.events.once('shutdown', () => {
      const wt = captureWalkTween();
      if (wt && wt !== this._walkTween_owned_by_other) {
        // Only stop the tween if it's still ours.
        if (this._walkTween === wt) {
          wt.remove();
          this._walkTween = null;
        }
      }
      // Always destroy the local sprite this attach() created.
      localSprite?.destroy();
      // If the singleton's current sprite is the one we just destroyed,
      // null it out. Otherwise leave it alone (next scene already owns it).
      if (this.sprite === localSprite) this.sprite = null;
    });
  }

  /** True if Amelia is currently walking. */
  get isWalking() { return !!this._walkTween && this._walkTween.isPlaying?.(); }

  /** Sprite reference (may be null if not yet attached). */
  getSprite() { return this.sprite; }

  /** Current world position; null if no scene. */
  getPosition() {
    if (!this.sprite) return null;
    return { x: this.sprite.x, y: this.sprite.y };
  }

  /**
   * Walk Amelia toward a click point, then call onArrive.
   * `targetX` is clamped to the visible scene; targetY is clamped to floor.
   */
  walkTo(targetX, _targetYIgnored, onArrive) {
    if (!this.sprite || !this.scene) {
      onArrive?.();
      return;
    }
    const { width, height } = this.scene.scale;
    const tx = clamp(targetX, width * 0.05, width * 0.95);
    const ty = height * FLOOR_Y_FRAC;
    const fromX = this.sprite.x;
    this._lastDirection = tx >= fromX ? 'right' : 'left';
    this.sprite.flipX = (this._lastDirection === 'left');

    if (Accessibility.reducedMotion) {
      this.sprite.setPosition(tx, ty);
      onArrive?.();
      return;
    }

    const ms = this._durationFor(fromX, tx);
    this._tweenTo(tx, ty, ms, onArrive);
  }

  _tweenTo(x, y, durationMs, onComplete) {
    this._walkTween?.remove();
    this._walkTween = this.scene.tweens.add({
      targets: this.sprite,
      x,
      y,
      duration: durationMs || MIN_WALK_MS,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this._walkTween = null;
        onComplete?.();
      }
    });
  }

  _durationFor(fromX, toX) {
    const dist = Math.abs(toX - fromX);
    return clamp((dist / WALK_SPEED_PX_PER_SEC) * 1000, MIN_WALK_MS, MAX_WALK_MS);
  }

  // -------- Inventory --------

  /** True if Amelia has collected this thing key. */
  has(thingKey) { return this._collected.has(thingKey); }

  /** Snapshot of inventory (array of keys). */
  inventory() { return Array.from(this._collected); }

  /** Add a thing to inventory. Idempotent. Notifies listeners. */
  collect(thingKey) {
    if (this._collected.has(thingKey)) return false;
    this._collected.add(thingKey);
    for (const fn of this._collectListeners) fn(thingKey, this.inventory());
    return true;
  }

  /** Remove a thing (rarely used; primarily for "give to..." moments). */
  drop(thingKey) {
    if (!this._collected.has(thingKey)) return false;
    this._collected.delete(thingKey);
    for (const fn of this._collectListeners) fn(thingKey, this.inventory());
    return true;
  }

  onCollectChange(fn) {
    this._collectListeners.add(fn);
    return () => this._collectListeners.delete(fn);
  }
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

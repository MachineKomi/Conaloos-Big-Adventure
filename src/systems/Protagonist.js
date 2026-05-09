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
    /** Map<thingKey, count> — Amelia's inventory with stacking. */
    this._collected = new Map();
    this._collectListeners = new Set();
    this._lastDirection = 'right';
  }

  /**
   * Spawn Amelia in the given scene at an entry point determined by the
   * portal we just came through. `fromEdge` is one of 'left' | 'right' |
   * 'top' | 'bottom' | null (default: middle).
   *
   * The resting position is chosen to avoid covering any portal sprite
   * in the scene, and is always inside the visible bounds. We pick from
   * three rest points (left third / centre / right third) and use the
   * one that's furthest from any existing portal.
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
      case 'left':   startX = -width * 0.05; break;
      case 'right':  startX = width * 1.05;  break;
      case 'top':    startX = width * 0.50;  startY = -height * 0.05; break;
      case 'bottom': startX = width * 0.50;  startY = height * 1.05; break;
      default:       startX = width * 0.50;
    }

    // Compute scale FIRST so we can size-aware pick a rest point.
    const tempSprite = scene.add
      .image(startX, startY, SPRITE_KEY)
      .setOrigin(0.5, 1)
      .setDepth(Z_DEPTH);
    const sourceH = tempSprite.height || 1;
    tempSprite.setScale((height * HEIGHT_FRAC) / sourceH);
    this.sprite = tempSprite;
    this.sprite.setDepth(this.sprite.y); // y-based depth (matches GameScene)

    // Pick a rest point that doesn't cover a portal. Try centre first,
    // then left third, then right third — first one that's at least
    // half a sprite-width from every portal wins.
    const restY = floorY;
    const halfW = (this.sprite.displayWidth || width * 0.2) * 0.5;
    const candidates = [width * 0.50, width * 0.30, width * 0.70, width * 0.40, width * 0.60];
    const portals = this._collectPortalCenters(scene);
    let restX = candidates[0];
    for (const cand of candidates) {
      const ok = portals.every((p) => Math.abs(p.x - cand) > halfW + p.r);
      if (ok) { restX = cand; break; }
    }

    if (fromEdge && !Accessibility.reducedMotion) {
      this._tweenTo(restX, restY, this._durationFor(startX, restX));
    } else {
      this.sprite.setPosition(restX, restY);
      this.sprite.setDepth(restY);
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
      this.sprite.setDepth(ty);
      onArrive?.();
      return;
    }

    const ms = this._durationFor(fromX, tx);
    this._tweenTo(tx, ty, ms, onArrive);
  }

  _collectPortalCenters(scene) {
    const out = [];
    for (const def of (scene.def?.hotspots || [])) {
      if (def.type === 'portal' && def.sprite) {
        const cx = (def.x ?? 0.5) * scene.scale.width;
        const r  = (def.heightFrac ?? 0.30) * scene.scale.height * 0.5;
        out.push({ x: cx, r });
      }
    }
    return out;
  }

  _tweenTo(x, y, durationMs, onComplete) {
    this._walkTween?.remove();
    const sprite = this.sprite;
    this._walkTween = this.scene.tweens.add({
      targets: sprite,
      x,
      y,
      duration: durationMs || MIN_WALK_MS,
      ease: 'Sine.easeInOut',
      onUpdate: () => { if (sprite) sprite.setDepth(sprite.y); },
      onComplete: () => {
        if (sprite) sprite.setDepth(sprite.y);
        this._walkTween = null;
        onComplete?.();
      }
    });
  }

  _durationFor(fromX, toX) {
    const dist = Math.abs(toX - fromX);
    return clamp((dist / WALK_SPEED_PX_PER_SEC) * 1000, MIN_WALK_MS, MAX_WALK_MS);
  }

  // -------- Inventory (with stacking) --------

  /** True if Amelia has at least one of this thing key. */
  has(thingKey) { return (this._collected.get(thingKey) ?? 0) > 0; }

  /** Count of this thing in inventory. */
  countOf(thingKey) { return this._collected.get(thingKey) ?? 0; }

  /** Snapshot of inventory as array of { key, count } for HUD render. */
  inventory() {
    return Array.from(this._collected.entries()).map(([key, count]) => ({ key, count }));
  }

  /** Add a thing. Always succeeds. Returns the new count. */
  collect(thingKey) {
    const next = (this._collected.get(thingKey) ?? 0) + 1;
    this._collected.set(thingKey, next);
    for (const fn of this._collectListeners) fn(thingKey, this.inventory());
    return next;
  }

  /** Remove one of a thing. */
  drop(thingKey) {
    const cur = this._collected.get(thingKey) ?? 0;
    if (cur <= 0) return 0;
    if (cur === 1) this._collected.delete(thingKey);
    else this._collected.set(thingKey, cur - 1);
    for (const fn of this._collectListeners) fn(thingKey, this.inventory());
    return Math.max(0, cur - 1);
  }

  onCollectChange(fn) {
    this._collectListeners.add(fn);
    return () => this._collectListeners.delete(fn);
  }
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

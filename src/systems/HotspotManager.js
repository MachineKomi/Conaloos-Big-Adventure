/**
 * HotspotManager — wires up every hotspot in a scene definition.
 *
 * Responsibilities:
 *  - Builds an interactive zone per hotspot at the right normalized bounds,
 *    padded to a minimum 64×64 hit area.
 *  - Sprite-anchored hover/click feedback: the speaker sprite gets a soft
 *    tint + slight scale-up on hover, and a quick bounce + sparkle on click.
 *    NO rectangles or halos are ever drawn over the background.
 *  - Exhaustive shuffle cycle: every unique response is shown once before any
 *    repeats, so a 4-year-old isn't subjected to the same line twice while
 *    there's still fresh content available.
 *  - Triggers the speech bubble and audio on click; forwards portal hotspots
 *    to the SceneRouter.
 *
 * The previous implementation showed a transparent halo `Graphics` rectangle
 * on hover and again on click. That was the "ugly hit-box flash" Dad reported
 * in playtest. It is now gone.
 */

import { Accessibility } from './Accessibility.js';

const MIN_HIT_PX = 64;
const HOVER_TINT = 0xfff5d0;
const HOVER_SCALE_FACTOR = 1.04;
const CLICK_SCALE_FACTOR = 1.12;
const HOVER_TWEEN_MS = 140;
const CLICK_TWEEN_MS = 130;
const SPARKLE_COUNT = 8;
const SPARKLE_RADIUS_PX = 36;
const SPARKLE_LIFE_MS = 360;
const SPARKLE_COLOUR = 0xfff2a8;

export class HotspotManager {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} services - { audio, dialogue, router, onResponse, spritesByKey }
   */
  constructor(scene, services) {
    this.scene = scene;
    this.audio = services.audio;
    this.dialogue = services.dialogue;
    this.router = services.router;
    this.onResponse = services.onResponse;
    this.spritesByKey = services.spritesByKey || new Map();
    this.zones = [];
    /** Per-hotspot queues of unseen responses. */
    this.unseen = new Map();
  }

  destroy() {
    for (const z of this.zones) z.destroy();
    this.zones = [];
    this.unseen.clear();
  }

  /**
   * @param {Array<HotspotDef>} hotspots
   * @param {{w:number,h:number}} sceneSize
   */
  createAll(hotspots, sceneSize) {
    for (const h of hotspots) this._create(h, sceneSize);
  }

  _create(hotspot, sceneSize) {
    const scene = this.scene;
    const sw = sceneSize.w;
    const sh = sceneSize.h;

    const px = (hotspot.bounds.x ?? 0) * sw;
    const py = (hotspot.bounds.y ?? 0) * sh;
    let pw = (hotspot.bounds.w ?? 0.1) * sw;
    let ph = (hotspot.bounds.h ?? 0.1) * sh;

    // Centre on midpoint, then pad to minimum hit area without changing centre.
    const cx = px + pw / 2;
    const cy = py + ph / 2;
    if (pw < MIN_HIT_PX) pw = MIN_HIT_PX;
    if (ph < MIN_HIT_PX) ph = MIN_HIT_PX;
    const ax = cx - pw / 2;
    const ay = cy - ph / 2;

    const zone = scene.add.zone(ax, ay, pw, ph).setOrigin(0, 0);
    zone.setInteractive({ useHandCursor: true });
    zone.setData('hotspot', hotspot);

    // Hover/click feedback rides the speaker sprite (if any). Narrator-only
    // hotspots (no speaker) get only the cursor change.
    const sprite = hotspot.speaker ? this.spritesByKey.get(hotspot.speaker) : null;
    let savedScale = sprite ? sprite.scale : 1;
    let hoverTween = null;
    let clickTween = null;

    zone.on('pointerover', () => {
      if (!sprite) return;
      savedScale = sprite.scale;
      sprite.setTint(HOVER_TINT);
      if (Accessibility.reducedMotion) {
        sprite.setScale(savedScale * HOVER_SCALE_FACTOR);
        return;
      }
      hoverTween?.remove();
      hoverTween = scene.tweens.add({
        targets: sprite,
        scale: savedScale * HOVER_SCALE_FACTOR,
        duration: HOVER_TWEEN_MS,
        ease: 'Sine.easeOut'
      });
    });

    zone.on('pointerout', () => {
      if (!sprite) return;
      sprite.clearTint();
      hoverTween?.remove();
      hoverTween = null;
      if (Accessibility.reducedMotion) {
        sprite.setScale(savedScale);
        return;
      }
      scene.tweens.add({
        targets: sprite,
        scale: savedScale,
        duration: HOVER_TWEEN_MS,
        ease: 'Sine.easeOut'
      });
    });

    zone.on('pointerup', (pointer) => {
      const clickPos = { x: pointer.worldX, y: pointer.worldY };
      this._bounceSprite(sprite, savedScale);
      this._emitSparkle(clickPos.x, clickPos.y);
      this._onClick(hotspot, clickPos.x === undefined ? { x: cx, y: cy } : clickPos);
    });

    this.zones.push(zone);
  }

  _bounceSprite(sprite, baseScale) {
    if (!sprite) return;
    if (Accessibility.reducedMotion) {
      sprite.setTint(HOVER_TINT);
      this.scene.time.delayedCall(120, () => sprite.clearTint());
      return;
    }
    this.scene.tweens.add({
      targets: sprite,
      scale: baseScale * CLICK_SCALE_FACTOR,
      duration: CLICK_TWEEN_MS,
      ease: 'Back.easeOut',
      yoyo: true
    });
  }

  _emitSparkle(x, y) {
    if (Accessibility.reducedMotion) return;
    const scene = this.scene;
    for (let i = 0; i < SPARKLE_COUNT; i++) {
      const angle = (i / SPARKLE_COUNT) * Math.PI * 2 + Math.random() * 0.5;
      const dist = SPARKLE_RADIUS_PX * (0.6 + Math.random() * 0.4);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      const dot = scene.add.circle(x, y, 4, SPARKLE_COLOUR, 1);
      dot.setDepth(900);
      scene.tweens.add({
        targets: dot,
        x: x + dx,
        y: y + dy,
        alpha: { from: 1, to: 0 },
        scale: { from: 1.2, to: 0.2 },
        duration: SPARKLE_LIFE_MS,
        ease: 'Quad.easeOut',
        onComplete: () => dot.destroy()
      });
    }
  }

  _onClick(hotspot, pos) {
    // Portal hotspots fire the response, then transition once dialogue dismisses.
    if (hotspot.type === 'portal' && hotspot.target) {
      const line = this._nextResponse(hotspot);
      if (line?.sfx) this.audio?.playSfx(line.sfx);
      if (line?.text) {
        this.dialogue.show(line.text, {
          avoid: pos,
          speaker: hotspot.speaker || null,
          onDismiss: () => this.router?.goToScene(hotspot.target)
        });
      } else {
        this.router?.goToScene(hotspot.target);
      }
      this.onResponse?.(hotspot, line);
      return;
    }

    const response = this._nextResponse(hotspot);
    if (response?.sfx) this.audio?.playSfx(response.sfx);
    else this.audio?.playSfx('sfx_pop');

    if (response?.text) {
      this.dialogue.show(response.text, {
        avoid: pos,
        speaker: hotspot.speaker || null
      });
    }

    this.onResponse?.(hotspot, response);
  }

  /**
   * Pick the next response for a hotspot using an exhaustive-shuffle queue.
   * Every unique line is shown once before any line repeats. When the queue
   * empties, refill with a fresh shuffled copy. Any legacy `rare_response`
   * folds into the pool so it's still seen.
   */
  _nextResponse(hotspot) {
    let queue = this.unseen.get(hotspot.id);
    if (!queue || queue.length === 0) {
      const pool = [...(hotspot.responses || [])];
      if (hotspot.rare_response) pool.push(hotspot.rare_response);
      shuffle(pool);
      queue = pool;
      this.unseen.set(hotspot.id, queue);
    }
    return queue.shift() ?? null;
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

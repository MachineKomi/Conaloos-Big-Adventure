/**
 * GameScene — generic scene driver.
 *
 * Each entry in /src/content/scenes.js is rendered through a fresh instance
 * of GameScene. We register one Phaser scene per slug at game-build time
 * with a per-slug key of `scene:${slug}`.
 *
 * Responsibilities:
 *   - Stretch the background to fit the viewport (cover).
 *   - Place characters & things at normalized coordinates.
 *   - Render visible portal sprites with floating labels.
 *   - Light idle motion (bob, sway) unless reducedMotion.
 *   - Drive HotspotManager + DialogueBox + AudioManager.
 *   - Wire the Protagonist (Amelia): she walks toward every click, and a
 *     portal click only fires AFTER she reaches it.
 *   - Apply remix effects from rare responses (e.g. parent a thing to a character).
 *   - Allow Amelia to collect `thing_*` items into her inventory.
 */

import Phaser from 'phaser';
import { HotspotManager } from '../systems/HotspotManager.js';
import { DialogueBox } from '../systems/DialogueBox.js';
import { Accessibility } from '../systems/Accessibility.js';
import { growsOnClick, GROW_FACTOR, GROW_CAP } from '../content/growsOnClick.js';

const IDLE_BOB_AMPL = 8;
const IDLE_BOB_MS = 1900;
const IDLE_SWAY_DEG = 2.5;
const IDLE_SWAY_MS = 2400;
const SCENE_FADE_MS = 600;
const PORTAL_LABEL_FONT_PX = 22;
const PORTAL_PULSE_AMPL = 0.06;
const PORTAL_PULSE_MS = 1600;
const COLLECTABLE_THINGS = new Set([
  'thing_birthday-cake-with-one-candle'
  // The rocketship and trees stay decorative; only collectables go here.
]);

/**
 * Module-level set of "scene:slug:hotspot.id" or
 * "scene:slug:gem:key:x:y" entries that have already been collected.
 * Persists across scene revisits within a single playthrough — and,
 * if a SaveGame is registered via `setWorldCollectedSave()`, also
 * across page reloads (so things don't respawn after the kid comes
 * back the next morning).
 */
const worldCollected = new Set();
let _wcSaveGame = null;

/** Wire the world-collected persistence to a SaveGame. Called once
 *  in main.js after the SaveGame is built. Hydrates the Set from the
 *  save's existing entries. */
export function setWorldCollectedSave(saveGame) {
  _wcSaveGame = saveGame;
  if (saveGame) {
    for (const key of saveGame.getWorldCollected()) worldCollected.add(key);
  }
}

/** Wipe the in-memory set. Used by "start a fresh adventure". The
 *  SaveGame.clear() handles its own copy. */
export function resetWorldCollected() {
  worldCollected.clear();
}

function rememberCollected(key) {
  worldCollected.add(key);
  _wcSaveGame?.addWorldCollected(key);
}

export class GameScene extends Phaser.Scene {
  /**
   * @param {string} slug
   * @param {object} def         scene definition from scenes.js
   * @param {object} services    { audio, router, loader, protagonist }
   */
  constructor(slug, def, services) {
    super({ key: `scene:${slug}` });
    this.slug = slug;
    this.def = def;
    this.services = services;
    this.spritesByKey = new Map();
    this._portalSprites = [];
    this._portalDefsById = new Map();
    this._isTransitioning = false;
  }

  init(data) {
    this._enterEdge = data?.enterEdge || null;
    // CRITICAL: GameScene instances are constructed once in main.js and
    // reused on every visit. Without resetting these, a portal click
    // sets _isTransitioning=true, the scene shuts down, comes back...
    // and the flag is still true. Then no portal in this scene works
    // again until full page reload. This was the "portals stop being
    // clickable after a few rooms" bug.
    this._isTransitioning = false;
    this._portalSprites = [];
    this._portalDefsById = new Map();
    this.spritesByKey = new Map();
  }

  create() {
    const { width, height } = this.scale;

    // Fade in from the white the previous scene faded out to.
    if (!Accessibility.reducedMotion) {
      this.cameras.main.fadeIn(SCENE_FADE_MS, 255, 248, 231);
    }

    // Make the input plane full-scene so background clicks are catchable.
    this.input.topOnly = true;

    this._renderBackground(width, height);
    this._renderThings(width, height);
    this._renderCharacters(width, height);
    this._renderPortalSprites(width, height);
    this._renderGems(width, height);

    // Spawn Amelia at the entry edge for this scene (or default centre).
    this.services.protagonist?.attach(this, { fromEdge: this._enterEdge });

    this.dialogue = new DialogueBox(this);

    this.hotspots = new HotspotManager(this, {
      audio: this.services.audio,
      dialogue: this.dialogue,
      router: null, // we handle navigation ourselves to walk Amelia first
      onResponse: (h, response) => this._afterResponse(h, response),
      spritesByKey: this.spritesByKey,
      seenQuizzes: this.services.seenQuizzes
    });
    // Skip hotspots for things Amelia has already collected this session.
    const liveHotspots = (this.def.hotspots || []).filter((h) => {
      if (!h.collect) return true;
      return !worldCollected.has(`${this.slug}:${h.id}`);
    });
    this.hotspots.createAll(liveHotspots, { w: width, h: height });

    // Override the manager's portal click — we want to walk Amelia to the
    // portal sprite before transitioning.
    this._wirePortalClicks();

    if (this.def.music) {
      this.services.audio.playMusic(this.def.music, this);
    }

    // Tell the quest tracker we visited this scene.
    this.services.quests?.report?.({ type: 'scene-visited', slug: this.slug });

    // Random tiny idle reactions — every 6-14 seconds, a random
    // character does a small wiggle / tiny hop. Adds a sense the
    // world is alive even when the kid hasn't clicked recently.
    this._idleReactionTimer = this.time.addEvent({
      delay: 6000 + Math.random() * 8000,
      loop: true,
      callback: () => this._randomIdleReaction()
    });

    // Occasional ambient sparkle drifting across the background —
    // pure delight, no interaction.
    this._ambientSparkleTimer = this.time.addEvent({
      delay: 4000 + Math.random() * 5000,
      loop: true,
      callback: () => this._ambientSparkle()
    });

    // Background click: walk Amelia to that x. Lets the child move her
    // around without needing to hit a hotspot.
    this.input.on('pointerup', (pointer, currentlyOver) => {
      if (this._isTransitioning) return;
      // Quiz active — ignore stray bg clicks so they don't dismiss
      // dialogue or distract the kid mid-question.
      if (this.hotspots?._quizFreezeUntil && Date.now() < this.hotspots._quizFreezeUntil) return;
      if (this.hotspots?.quizDialog?.isVisible?.()) return;
      // If a UI button on global scenes was clicked, skip.
      if (currentlyOver && currentlyOver.length > 0) return;
      // Dismiss any open dialogue first.
      if (this.dialogue.isVisible()) {
        this.dialogue.dismiss();
        return;
      }
      this._tapRipple(pointer.worldX, pointer.worldY);
      this.services.protagonist?.walkTo(pointer.worldX, pointer.worldY);
    });

    this.scale.on('resize', () => {
      // Crude: full re-create on resize.
      this.scene.restart({ enterEdge: this._enterEdge });
    });

    this.events.on('shutdown', () => {
      this.dialogue?.destroy();
      this.hotspots?.destroy();
      this.spritesByKey.clear();
      for (const p of this._portalSprites) p.destroy();
      this._portalSprites = [];
      this._portalDefsById.clear();
      this._idleReactionTimer?.remove(false);
      this._ambientSparkleTimer?.remove(false);
    });
  }

  // ------------------------------- rendering -------------------------------

  _renderBackground(w, h) {
    const bgKey = this.def.background;
    if (!bgKey || !this.textures.exists(bgKey)) {
      this.cameras.main.setBackgroundColor('#fff8e7');
      return;
    }
    const img = this.add.image(w / 2, h / 2, bgKey).setOrigin(0.5);
    const tex = this.textures.get(bgKey).getSourceImage();
    const sx = w / tex.width;
    const sy = h / tex.height;
    img.setScale(Math.max(sx, sy));
    img.setDepth(-100);
  }

  _renderThings(w, h) {
    // Find which thing-sprites are part of a collectable hotspot AND
    // which have already been collected this session.
    const collectableSprites = new Set();
    const collectedSpriteKeys = new Set();
    for (const h of this.def.hotspots || []) {
      if (h.collect) {
        collectableSprites.add(h.collect);
        if (worldCollected.has(`${this.slug}:${h.id}`)) {
          collectedSpriteKeys.add(h.collect);
        }
      }
    }

    for (const t of this.def.things || []) {
      if (!this.textures.exists(t.sprite)) continue;
      if (collectedSpriteKeys.has(t.sprite)) continue;
      const isCollectable = collectableSprites.has(t.sprite);
      const img = this.add
        .image((t.x ?? 0.5) * w, (t.y ?? 0.5) * h, t.sprite)
        .setOrigin(0.5, 1);

      if (isCollectable) {
        // Over-scale (no crop) so the visible content reads big.
        const overscale = 1.45;
        const defaultFrac = 0.32;
        const heightFrac = (typeof t.heightFrac === 'number') ? t.heightFrac : defaultFrac;
        const targetH = h * heightFrac * overscale;
        img.setScale(targetH / img.height);
      } else {
        applyDisplaySize(img, t, h, 0.22);
      }

      // Lock in baseScale so hover/click tweens revert correctly.
      img._baseScale = img.scale;

      if (isCollectable) {
        img.setDepth(8500 + (img.y / h));
      } else {
        img.setDepth(img.y);
      }
      this.spritesByKey.set(t.sprite, img);
    }
  }

  _renderCharacters(w, h) {
    for (const c of this.def.characters || []) {
      if (!this.textures.exists(c.sprite)) continue;
      // Skip Amelia in scene-level character lists — Protagonist owns her.
      if (c.sprite === 'peep_Amelia_F_4') continue;

      const img = this.add
        .image((c.x ?? 0.5) * w, (c.y ?? 0.5) * h, c.sprite)
        .setOrigin(0.5, 1);
      applyDisplaySize(img, c, h, 0.45);
      // Lock in the base scale RIGHT NOW so hover/click tweens
      // always go back to the same value. Without this, repeated
      // clicks left the sprite slightly larger each time (race
      // between competing tweens) and characters slowly grew until
      // they walked off the screen.
      img._baseScale = img.scale;
      img.setDepth(img.y);
      this.spritesByKey.set(c.sprite, img);

      if (Accessibility.reducedMotion) continue;

      if (c.idle === 'bob') {
        this.tweens.add({
          targets: img,
          y: img.y - IDLE_BOB_AMPL,
          duration: IDLE_BOB_MS,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      } else if (c.idle === 'sway') {
        this.tweens.add({
          targets: img,
          angle: { from: -IDLE_SWAY_DEG, to: IDLE_SWAY_DEG },
          duration: IDLE_SWAY_MS,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    }
  }

  _renderGems(w, h) {
    const gems = this.def.gems || [];
    for (const g of gems) {
      const key = g.key;             // e.g. 'gem_3'
      const fromName = Number.parseInt(key.replace(/^gem_/, ''), 10);
      const value = (g.value ?? fromName) || 1;
      if (!this.textures.exists(key)) continue;
      const x = (g.x ?? 0.5) * w;
      const y = (g.y ?? 0.5) * h;

      // Skip if this exact placement was already collected this session.
      const placementId = `${this.slug}:gem:${key}:${Math.round(x)}:${Math.round(y)}`;
      if (worldCollected.has(placementId)) continue;
      const img = this.add.image(x, y, key).setOrigin(0.5);
      const tex = this.textures.get(key).getSourceImage();
      // Middle-ground gem size — consistent between scattered gems
      // and reward burst gems (was 0.16 in scenes vs 0.10 in bursts).
      const targetH = h * (g.heightFrac ?? 0.13);
      img.setScale(targetH / tex.height);
      img.setRotation(g.rotation ?? (Math.random() - 0.5) * 0.5);
      // CRITICAL: always render on top of every other sprite so they're
      // never hidden behind a peep / portal / thing.
      img.setDepth(9000 + (y / h));

      // Subtle bob/twinkle so the gems read as collectible.
      if (!Accessibility.reducedMotion) {
        this.tweens.add({
          targets: img,
          y: y - 4,
          duration: 1100 + Math.random() * 700,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }

      img.setInteractive({ useHandCursor: true });
      // Hover tint when not collecting.
      img.on('pointerover', (pointer) => {
        // Drag-to-collect: if the user is already holding the
        // pointer down, this hover counts as a pickup. Lets the kid
        // sweep their finger across a row of gems and grab them all.
        if (pointer && pointer.isDown) {
          this._collectGem(img, key, value);
        } else {
          img.setTint(0xfff5d0);
        }
      });
      img.on('pointerout', () => img.clearTint());
      // pointerdown fires before pointerup — picking up on the press
      // (not release) means stacked / overlapping gems can be tapped
      // in rapid succession without waiting for the previous tap to
      // resolve.
      img.on('pointerdown', () => this._collectGem(img, key, value));
    }
  }

  /**
   * Click → swap to glowing variant → glow + bob in place for a beat →
   * fly toward the top-centre GemHUD → on arrival, GemBag.add fires
   * the equation reveal in the HUD.
   *
   * Important: hit-detection is disabled the instant we mark the gem
   * collected so that any gem rendered behind / overlapping this one
   * becomes instantly tappable. Without this, the kid's second tap
   * would still hit the (now glowing, but still-interactive) first
   * gem, and the pickup felt sticky.
   */
  _collectGem(img, key, value) {
    if (img._collected) return;
    img._collected = true;
    img.disableInteractive(); // pass clicks straight through immediately
    // Persist this gem placement so it doesn't respawn on revisit.
    rememberCollected(`${this.slug}:gem:${key}:${Math.round(img.x)}:${Math.round(img.y)}`);

    // Swap to glowing variant.
    const glowKey = `${key}_glowing`;
    if (this.textures.exists(glowKey)) img.setTexture(glowKey);

    this.services.audio?.playSfx?.('sfx_twinkle');
    this.services.protagonist?.jumpCelebrate?.();

    if (Accessibility.reducedMotion) {
      img.destroy();
      this.services.gemBag?.add(key, value);
      return;
    }

    // Step 1: glow longer in place — pulse + slight scale up.
    const glowTween = this.tweens.add({
      targets: img,
      scale: { from: img.scale, to: img.scale * 1.4 },
      alpha: { from: 1, to: 0.85 },
      duration: 280,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
      onComplete: () => this._flyGemToHud(img, key, value)
    });
    img._glowTween = glowTween;
  }

  _flyGemToHud(img, key, value) {
    // Ask the HUD scene for its icon position — adapts to scene size
    // and dynamic panel width.
    const hud = this.scene.manager.getScene('global:gemhud');
    const target = hud?.getIconPosition?.() || { x: this.scale.width / 2, y: 56 };
    this.services.audio?.playSfx?.('sfx_coin');
    this.tweens.add({
      targets: img,
      x: target.x,
      y: target.y,
      scale: img.scale * 0.4,
      duration: 700,
      ease: 'Cubic.easeIn',
      onUpdate: () => img.setRotation(img.rotation + 0.18),
      onComplete: () => {
        img.destroy();
        this.services.gemBag?.add(key, value);
      }
    });
  }

  _renderPortalSprites(w, h) {
    const portals = (this.def.hotspots || []).filter((h) => h.type === 'portal' && h.sprite);
    for (const p of portals) {
      if (!this.textures.exists(p.sprite)) continue;

      const x = (p.x ?? 0.5) * w;
      let y = (p.y ?? 0.95) * h;
      const img = this.add.image(x, y, p.sprite).setOrigin(0.5, 1);
      applyDisplaySize(img, { heightFrac: p.heightFrac ?? 0.30 }, h, 0.30);
      // Ensure the portal's TOP doesn't go above the HUD reserved
      // zone, otherwise its label gets clipped. Clamp y down if the
      // sprite would extend above ~y=120.
      const minTopY = 120;
      if (y - img.displayHeight < minTopY) {
        y = minTopY + img.displayHeight;
        img.y = y;
      }
      // Same y-based depth as characters so they sort naturally.
      img.setDepth(y);
      this.spritesByKey.set(p.sprite, img);
      this._portalSprites.push(img);
      this._portalDefsById.set(p.id, { def: p, sprite: img });

      // Soft pulse so the eye finds it.
      if (!Accessibility.reducedMotion) {
        const baseScale = img.scale;
        this.tweens.add({
          targets: img,
          scale: baseScale * (1 + PORTAL_PULSE_AMPL),
          duration: PORTAL_PULSE_MS,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }

      // Floating label sits above the portal sprite by default. If
      // that would push it into the reserved-top area (gem HUD), put
      // it BELOW the portal instead so it never gets clipped.
      if (p.label) {
        const HUD_RESERVED_TOP = 110;
        const portalTop = y - img.displayHeight;
        const labelGoesAbove = portalTop - 28 > HUD_RESERVED_TOP;
        const label = this.add
          .text(x, 0, p.label, {
            fontFamily: '"Fredoka", "Atkinson Hyperlegible", system-ui, sans-serif',
            fontSize: `${PORTAL_LABEL_FONT_PX}px`,
            color: '#2b2b2b',
            backgroundColor: 'rgba(255,248,231,0.85)',
            padding: { left: 10, right: 10, top: 4, bottom: 4 }
          })
          .setDepth(y + 1);
        if (labelGoesAbove) {
          label.setOrigin(0.5, 1);
          label.y = portalTop - 8;
        } else {
          label.setOrigin(0.5, 0);
          label.y = y + 6;
        }
        this._portalSprites.push(label);
      }
    }
  }

  // ------------------------- click & transition flow -----------------------

  _wirePortalClicks() {
    // HotspotManager already attached pointerup handlers that call
    // _afterResponse via onResponse. For portals, we want to:
    //   1. Walk Amelia to the portal sprite
    //   2. Then fade out + start the destination scene
    // The HotspotManager doesn't know about Protagonist, so we intercept
    // here by replacing its inner _onClick logic for portals via the
    // onResponse callback (called after the click is processed).
    //
    // Simpler path used here: we listen on the portal sprite directly so
    // the portal sprite IS the click target, not just an invisible zone.
    for (const { def, sprite } of this._portalDefsById.values()) {
      sprite.setInteractive({ useHandCursor: true });
      sprite.on('pointerover', () => sprite.setTint(0xfff5d0));
      sprite.on('pointerout', () => sprite.clearTint());
      sprite.on('pointerup', () => this._enterPortal(def, sprite));
    }
  }

  _enterPortal(portalDef, portalSprite) {
    if (this._isTransitioning) return;

    const protagonist = this.services.protagonist;
    const arriveX = portalSprite.x;
    const targetKey = `scene:${portalDef.target}`;
    const enterEdge = portalDef.enterEdge || 'left';

    // Defensive: if the target scene was removed (e.g. its background
    // got deleted between content edits), don't lock the player by
    // walking to a portal that goes nowhere.
    if (!this.scene.manager.getScene(targetKey)) {
      console.warn(`[portal] target scene missing: ${portalDef.target}`);
      return;
    }

    const doFade = () => {
      // Set the lock NOW (not before the walk). If the user clicks
      // a different hotspot mid-walk, the walk's onArrive (this
      // function) is orphaned by Protagonist.walkTo overwriting the
      // tween — and we never reach this point. With the lock here,
      // _isTransitioning stays false, and the next portal click
      // works correctly. (Bug v1.3.x: clicks were getting stuck.)
      if (this._isTransitioning) return;
      this._isTransitioning = true;

      this.services.audio?.playSfx('sfx_swoosh');
      this.cameras.main.fadeOut(SCENE_FADE_MS, 255, 248, 231);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        const mgr = this.scene.manager;
        const myKey = this.scene.key;
        mgr.start(targetKey, { enterEdge });
        mgr.stop(myKey);
      });
    };

    if (protagonist && !Accessibility.reducedMotion) {
      protagonist.walkTo(arriveX, 0, doFade);
    } else {
      doFade();
    }
  }

  cameraFadeIn() {
    this.cameras.main.fadeIn(SCENE_FADE_MS, 255, 248, 231);
  }

  // ------------------------------- responses -------------------------------

  _afterResponse(hotspot, response) {
    this._applyRemix(response);

    // Tell the quest tracker every hotspot tick. Lets puzzly quests
    // match on hotspot id / type / speaker / theme without needing
    // a new event type per category.
    if (hotspot) {
      this.services.quests?.report?.({
        type: 'hotspot-clicked',
        id: hotspot.id,
        hotspotType: hotspot.type,
        speaker: hotspot.speaker || null,
        theme: response?.theme || null,
        slug: this.slug
      });
    }

    // Rocketship: launch on first tap, every time. Otherwise: chance
    // of a small special animation.
    if (hotspot?.speaker === 'thing_rocketship') {
      this._rocketTick(hotspot);
    } else if (Math.random() < 0.30) {
      this._maybeSpecialAnimation(hotspot);
    }

    // Buddy growth: certain characters puff up a bit with each tap,
    // capped at 3x their original size. Resets per scene visit.
    if (hotspot?.speaker && growsOnClick.has(hotspot.speaker)) {
      const sprite = this.spritesByKey.get(hotspot.speaker);
      if (sprite && sprite._baseScale) {
        const original = sprite._originalBaseScale ?? sprite._baseScale;
        if (!sprite._originalBaseScale) sprite._originalBaseScale = original;
        const cap = original * GROW_CAP;
        const next = Math.min(sprite._baseScale * GROW_FACTOR, cap);
        sprite._baseScale = next;
        // Quick puff tween up to the new base scale.
        this.tweens.add({
          targets: sprite,
          scale: next,
          duration: 220,
          ease: 'Back.easeOut'
        });
      }
    }

    // Inventory pickup: collect on first click, the thing-sprite pops
    // and hides, Amelia hops in celebration, and the placement is
    // persisted so the item doesn't respawn on a scene revisit.
    if (hotspot?.collect && this.services.protagonist) {
      const placementKey = `${this.slug}:${hotspot.id}`;
      // Mark the placement collected; render-time skip will hide it next visit.
      rememberCollected(placementKey);

      this.services.protagonist.collect(hotspot.collect);
      const thingSprite = this.spritesByKey.get(hotspot.collect);
      if (thingSprite) this._popAndHide(thingSprite);
      this.services.audio?.playSfx?.('sfx_coin');
      this.services.protagonist.jumpCelebrate?.();
    }

    // Some character clicks reward the player with a gem spray.
    if (hotspot?.speaker && hotspot.type === 'reactor' && hotspot.rewardGemChance) {
      if (Math.random() < hotspot.rewardGemChance) {
        const sourceSprite = this.spritesByKey.get(hotspot.speaker);
        if (sourceSprite) this._spawnGemBurst(sourceSprite);
      }
    }
  }

  /** Pick a random character/thing in the scene and play a tiny idle
   *  reaction (wiggle / hop). Skips Amelia and any sprite that's
   *  currently playing another animation. */
  _randomIdleReaction() {
    if (Accessibility.reducedMotion) return;
    const candidates = [];
    for (const [key, sprite] of this.spritesByKey.entries()) {
      if (!sprite || !sprite.active) continue;
      if (key === 'peep_Amelia_F_4') continue;
      if (sprite._launching || sprite._flipping || sprite._buzzing || sprite._flitting || sprite._wiggling) continue;
      candidates.push(sprite);
    }
    if (candidates.length === 0) return;
    const sprite = candidates[Math.floor(Math.random() * candidates.length)];
    sprite._wiggling = true;
    const baseAngle = sprite.angle || 0;
    const baseY = sprite.y;
    this.tweens.chain({
      targets: sprite,
      tweens: [
        { angle: baseAngle - 4, duration: 130, ease: 'Sine.easeInOut' },
        { angle: baseAngle + 4, duration: 130, ease: 'Sine.easeInOut' },
        { angle: baseAngle - 3, y: baseY - 8, duration: 130, ease: 'Sine.easeOut' },
        { angle: baseAngle, y: baseY, duration: 130, ease: 'Sine.easeIn' }
      ],
      onComplete: () => { sprite._wiggling = false; }
    });
  }

  /**
   * A soft "tap landed" ripple at the click point — two concentric
   * rings that expand and fade. Tells the kid "yes, I heard you" even
   * before Amelia starts walking. Subtle, warm-cream stroke matching
   * the rest of the UI chrome.
   */
  _tapRipple(x, y) {
    if (Accessibility.reducedMotion) return;
    // Don't paint ripples WAY off-screen (e.g. negative worldY from a
    // weird pointer event).
    const { width, height } = this.scale;
    if (x < -40 || x > width + 40 || y < -40 || y > height + 40) return;

    const draw = (delay, startR, endR, alpha, lineW) => {
      const ring = this.add.graphics().setDepth(8500);
      ring.lineStyle(lineW, 0x4a3a1f, alpha);
      ring.strokeCircle(x, y, startR);
      this.tweens.add({
        targets: ring,
        alpha: { from: alpha, to: 0 },
        duration: 480,
        delay,
        ease: 'Sine.easeOut',
        onUpdate: (tw) => {
          const t = tw.progress;
          ring.clear();
          ring.lineStyle(lineW, 0x4a3a1f, alpha * (1 - t));
          ring.strokeCircle(x, y, startR + (endR - startR) * t);
        },
        onComplete: () => ring.destroy()
      });
    };
    draw(0,    8,  34, 0.55, 3);
    draw(90,  4,  22, 0.35, 2);
  }

  _ambientSparkle() {
    if (Accessibility.reducedMotion) return;
    const { width, height } = this.scale;
    const x = Math.random() * width;
    const y = height * 0.1 + Math.random() * height * 0.4;
    const colours = [0xfff2a8, 0xffd4f0, 0xc8e7ff, 0xfff8e7];
    const colour = colours[Math.floor(Math.random() * colours.length)];
    const dot = this.add.circle(x, y, 5, colour, 1).setDepth(7500);
    this.tweens.add({
      targets: dot,
      x: x + (Math.random() - 0.5) * 80,
      y: y + 60 + Math.random() * 40,
      alpha: { from: 1, to: 0 },
      scale: { from: 1.3, to: 0.4 },
      duration: 1400 + Math.random() * 600,
      ease: 'Quad.easeIn',
      onComplete: () => dot.destroy()
    });
  }

  /**
   * Trigger a special animation for certain speakers — adds visual
   * delight without breaking the click-and-listen loop.
   */
  _maybeSpecialAnimation(hotspot) {
    if (!hotspot?.speaker) return;
    const sprite = this.spritesByKey.get(hotspot.speaker);
    if (!sprite || !sprite.active) return;

    if (hotspot.speaker === 'thing_rocketship') {
      this._rocketLaunch(sprite);
    } else if (hotspot.speaker === 'animal_Pepsi_dog-thing') {
      this._dogFlip(sprite);
    } else if (hotspot.speaker === 'animal_Seesa_pink-bee') {
      this._beeBuzz(sprite);
    } else if (hotspot.speaker === 'animal_Monaloo_butterfly') {
      this._butterflyFlit(sprite);
    }
  }

  /** Rocketship: launch on the very first tap, every time. Reliable
   *  because there's no random count or extra dialogue to skip. The
   *  rocket leaves the screen and stays gone until the scene is
   *  re-entered. */
  _rocketTick(hotspot) {
    const sprite = this.spritesByKey.get(hotspot.speaker);
    if (!sprite || !sprite.active || sprite._launched) return;
    this._rocketLaunch(sprite);
  }

  _rocketLaunch(sprite) {
    if (sprite._launched || sprite._launching) return;
    // Mark BOTH flags up-front. _launched stops re-entry from the
    // hotspot logic; _launching tells the HotspotManager to bail on
    // any pointerover/out/up events on this sprite for the duration
    // of the launch (otherwise hover/click would killTweensOf and
    // strand the rocket mid-air — the v1.8 "starts to launch and
    // then stops" bug). Both stay true until the sprite is destroyed.
    sprite._launching = true;
    sprite._launched = true;
    sprite.disableInteractive(); // belt + braces

    // Tell the quest tracker so we can reward rocket fans.
    this.services.quests?.report?.({
      type: 'rocket-launched',
      slug: this.slug
    });

    const startY = sprite.y;
    const startX = sprite.x;
    const sceneH = this.scale.height;

    this.services.audio?.playSfx?.('sfx_powerup');

    // Phase 1: pre-launch quiver.
    this.tweens.add({
      targets: sprite,
      x: { from: startX - 4, to: startX + 4 },
      duration: 60,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        if (!sprite.active) return;
        sprite.x = startX;
        this.services.audio?.playSfx?.('sfx_swoosh');

        // Smoke puff at the base — three quick expanding circles.
        for (let i = 0; i < 3; i++) {
          this.time.delayedCall(i * 60, () => {
            const puff = this.add.circle(startX + (Math.random() - 0.5) * 40, startY, 18, 0xffffff, 0.7).setDepth(sprite.depth - 1);
            this.tweens.add({
              targets: puff,
              scale: 3.5,
              alpha: 0,
              duration: 700,
              onComplete: () => puff.destroy()
            });
          });
        }

        // Tiny celebratory hop from Amelia — she watches it go.
        this.services.protagonist?.jumpCelebrate?.();

        // Phase 2: full launch off the top of the screen (and gone).
        this.tweens.add({
          targets: sprite,
          y: -sceneH * 0.4,           // well above the visible area
          x: startX + 12,
          angle: -3,
          scale: sprite.scale * 0.7,  // shrinks as it disappears into the sky
          duration: 1200,
          ease: 'Cubic.easeIn',
          onComplete: () => {
            // Destroy so the rocket stays gone for this visit.
            // (It re-renders next time the scene is entered.)
            this.spritesByKey.delete('thing_rocketship');
            sprite._launching = false; // (sprite is being destroyed anyway)
            sprite.destroy();
          }
        });
      }
    });
  }

  _dogFlip(sprite) {
    if (sprite._flipping) return;
    sprite._flipping = true;
    const startY = sprite.y;
    this.services.audio?.playSfx?.('sfx_voice_yip');
    this.tweens.add({
      targets: sprite,
      y: startY - 60,
      angle: 360,
      duration: 600,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        sprite.angle = 0;
        sprite.y = startY;
        this.services.audio?.playSfx?.('sfx_thud');
        sprite._flipping = false;
      }
    });
  }

  _beeBuzz(sprite) {
    if (sprite._buzzing) return;
    sprite._buzzing = true;
    const startX = sprite.x;
    const startY = sprite.y;
    this.services.audio?.playSfx?.('sfx_swoosh');
    this.tweens.chain({
      targets: sprite,
      tweens: [
        { x: startX + 60, y: startY - 30, duration: 240, ease: 'Sine.easeInOut' },
        { x: startX - 40, y: startY - 50, duration: 240, ease: 'Sine.easeInOut' },
        { x: startX + 30, y: startY - 20, duration: 240, ease: 'Sine.easeInOut' },
        { x: startX,      y: startY,      duration: 240, ease: 'Sine.easeInOut' }
      ],
      onComplete: () => { sprite._buzzing = false; }
    });
  }

  _butterflyFlit(sprite) {
    if (sprite._flitting) return;
    sprite._flitting = true;
    const startX = sprite.x;
    const startY = sprite.y;
    this.tweens.chain({
      targets: sprite,
      tweens: [
        { x: startX + 80, y: startY - 50, angle: 12,  duration: 500, ease: 'Sine.easeInOut' },
        { x: startX - 60, y: startY - 80, angle: -10, duration: 500, ease: 'Sine.easeInOut' },
        { x: startX,      y: startY,      angle: 0,   duration: 500, ease: 'Sine.easeInOut' }
      ],
      onComplete: () => { sprite._flitting = false; }
    });
  }

  /**
   * Burst of 2-5 random gems out of a sprite's head — reward for
   * talking to certain characters or correctly answering a quiz.
   * Reward gems use the same size as scattered gems for consistency.
   */
  _spawnGemBurst(sourceSprite) {
    const count = 2 + Math.floor(Math.random() * 4); // 2..5
    const gemKeys = [];
    for (let i = 1; i <= 9; i++) {
      if (this.textures.exists(`gem_${i}`)) gemKeys.push(`gem_${i}`);
    }
    if (gemKeys.length === 0) return;
    for (let i = 0; i < count; i++) {
      const key = gemKeys[Math.floor(Math.random() * gemKeys.length)];
      const value = Number.parseInt(key.replace(/^gem_/, ''), 10) || 1;
      const startX = sourceSprite.x;
      const startY = sourceSprite.y - sourceSprite.displayHeight + 8;
      const angle = (-Math.PI / 2) + (Math.random() - 0.5) * 1.6;
      const dist = 60 + Math.random() * 100;
      const restX = startX + Math.cos(angle) * dist;
      const restY = startY + Math.sin(angle) * dist;
      const gem = this.add.image(startX, startY, key).setOrigin(0.5);
      const tex = this.textures.get(key).getSourceImage();
      // Same size as scattered gems for visual consistency.
      gem.setScale((this.scale.height * 0.13) / tex.height);
      gem.setRotation((Math.random() - 0.5) * 0.6);
      gem.setDepth(9000 + (startY / this.scale.height));

      this.tweens.add({
        targets: gem,
        x: restX,
        y: restY,
        duration: 400 + Math.random() * 200,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          gem.setInteractive({ useHandCursor: true });
          if (!Accessibility.reducedMotion) {
            this.tweens.add({
              targets: gem,
              y: gem.y - 6,
              duration: 1100 + Math.random() * 500,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut'
            });
          }
          gem.on('pointerover', (pointer) => {
            if (pointer && pointer.isDown) {
              this._collectGem(gem, key, value);
            } else {
              gem.setTint(0xfff5d0);
            }
          });
          gem.on('pointerout', () => gem.clearTint());
          gem.on('pointerdown', () => this._collectGem(gem, key, value));
        }
      });
    }
  }

  /**
   * On collect: tween the thing-sprite up to the inventory bag icon
   * (top-left), shrinking + spinning slightly. Mirrors gems flying to
   * the counter so collection always reads as "this just went into
   * the bag".
   */
  _popAndHide(sprite) {
    if (Accessibility.reducedMotion) {
      sprite.setVisible(false);
      return;
    }
    // Inventory icon centre (matches Inventory.js ICON_X+ICON_SIZE/2).
    const target = { x: 16 + 100 / 2, y: 12 + 100 / 2 };
    this.tweens.add({
      targets: sprite,
      x: target.x,
      y: target.y,
      scale: sprite.scale * 0.35,
      alpha: 0,
      duration: 600,
      ease: 'Cubic.easeIn',
      onUpdate: () => sprite.setRotation(sprite.rotation + 0.1),
      onComplete: () => sprite.setVisible(false)
    });
  }

  /** Apply a remix from a rare response. */
  _applyRemix(response) {
    const remix = response?.remix;
    if (!remix || !remix.add_sprite) return;
    if (!this.textures.exists(remix.add_sprite)) return;
    const target = this.spritesByKey.get(remix.on_top_of);
    if (!target) return;
    const overlay = this.add.image(target.x, target.y, remix.add_sprite).setOrigin(0.5, 1);
    overlay.setScale(remix.scale ?? 0.4);
    overlay.y = target.y - target.displayHeight + 4;
    overlay.setDepth((target.depth ?? 0) + 1);
    if (!Accessibility.reducedMotion) {
      overlay.setScale(0.05);
      this.tweens.add({
        targets: overlay,
        scale: remix.scale ?? 0.4,
        duration: 300,
        ease: 'Back.easeOut'
      });
    }
  }
}

function applyDisplaySize(img, def, sceneH, defaultHeightFrac) {
  if (typeof def.scale === 'number') {
    img.setScale(def.scale);
    return;
  }
  const frac = typeof def.heightFrac === 'number' ? def.heightFrac : defaultHeightFrac;
  const targetH = sceneH * frac;
  const sourceH = img.height || 1;
  img.setScale(targetH / sourceH);
}

// Keep the export of a marker so unused-asset audits can pick this up if
// future code paths import it.
export { COLLECTABLE_THINGS };

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
 * "scene:slug:gem:key:x:y" entries that have been collected this session.
 * Persists across scene revisits within a single playthrough; cleared on
 * page reload.
 */
const worldCollected = new Set();

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
      spritesByKey: this.spritesByKey
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

    // Background click: walk Amelia to that x. Lets the child move her
    // around without needing to hit a hotspot.
    this.input.on('pointerup', (pointer, currentlyOver) => {
      if (this._isTransitioning) return;
      // If a UI button on global scenes was clicked, skip.
      if (currentlyOver && currentlyOver.length > 0) return;
      // Dismiss any open dialogue first.
      if (this.dialogue.isVisible()) {
        this.dialogue.dismiss();
        return;
      }
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
    // Find all hotspot ids whose `collect` matches a thing sprite —
    // used to skip rendering collected things by checking if any
    // hotspot for the same scene+sprite was already collected.
    const collectedSpriteKeys = new Set();
    for (const h of this.def.hotspots || []) {
      if (h.collect && worldCollected.has(`${this.slug}:${h.id}`)) {
        collectedSpriteKeys.add(h.collect);
      }
    }

    for (const t of this.def.things || []) {
      if (!this.textures.exists(t.sprite)) continue;
      if (collectedSpriteKeys.has(t.sprite)) continue;  // already picked up
      const img = this.add
        .image((t.x ?? 0.5) * w, (t.y ?? 0.5) * h, t.sprite)
        .setOrigin(0.5, 1);
      applyDisplaySize(img, t, h, 0.22);
      // Depth = y so things lower on screen appear in front.
      img.setDepth(img.y);
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
      // Depth = y so character lower on screen appears in front of one
      // higher up. Avoids "Amelia walks behind a peep that's visually
      // in front of her" weirdness.
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
      const targetH = h * (g.heightFrac ?? 0.10);
      img.setScale(targetH / tex.height);
      img.setRotation(g.rotation ?? (Math.random() - 0.5) * 0.5);
      img.setDepth(y + 1);

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
      img.on('pointerover', () => img.setTint(0xfff5d0));
      img.on('pointerout', () => img.clearTint());
      img.on('pointerup', () => this._collectGem(img, key, value));
    }
  }

  /**
   * Click → swap to glowing variant → glow + bob in place for a beat →
   * fly toward the top-centre GemHUD → on arrival, GemBag.add fires
   * the equation reveal in the HUD. Amelia hops in celebration.
   */
  _collectGem(img, key, value) {
    if (img._collected) return;
    img._collected = true;
    // Persist this gem placement so it doesn't respawn on revisit.
    worldCollected.add(`${this.slug}:gem:${key}:${Math.round(img.x)}:${Math.round(img.y)}`);

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
    // Target = top-centre HUD icon position.
    const target = { x: this.scale.width / 2 - 12, y: 56 };
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
      const y = (p.y ?? 0.95) * h;
      const img = this.add.image(x, y, p.sprite).setOrigin(0.5, 1);
      applyDisplaySize(img, { heightFrac: p.heightFrac ?? 0.30 }, h, 0.30);
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

      // Floating label always sits above its portal sprite (depth+1).
      if (p.label) {
        const labelY = y - img.displayHeight - 8;
        const label = this.add
          .text(x, labelY, p.label, {
            fontFamily: '"Fredoka", "Atkinson Hyperlegible", system-ui, sans-serif',
            fontSize: `${PORTAL_LABEL_FONT_PX}px`,
            color: '#2b2b2b',
            backgroundColor: 'rgba(255,248,231,0.85)',
            padding: { left: 10, right: 10, top: 4, bottom: 4 }
          })
          .setOrigin(0.5, 1)
          .setDepth(y + 1);
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
    this._isTransitioning = true;

    const protagonist = this.services.protagonist;
    const arriveX = portalSprite.x;
    const targetKey = `scene:${portalDef.target}`;
    const enterEdge = portalDef.enterEdge || 'left';

    const doFade = () => {
      this.services.audio?.playSfx('sfx_swoosh');
      this.cameras.main.fadeOut(SCENE_FADE_MS, 255, 248, 231);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        // Be explicit: stop ourselves, then start the destination. Phaser's
        // `this.scene.start` should do this via its op queue, but in some
        // configurations the calling scene stays running in the background,
        // which leaves two scenes ticking and a frozen-feeling transition.
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
    // Inventory pickup: collect on first click, the thing-sprite pops
    // and hides, Amelia hops in celebration, and the placement is
    // persisted so the item doesn't respawn on a scene revisit.
    if (hotspot?.collect && this.services.protagonist) {
      const placementKey = `${this.slug}:${hotspot.id}`;
      // Mark the placement collected; render-time skip will hide it next visit.
      worldCollected.add(placementKey);

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

  /**
   * Burst of 1-3 random gems out of a sprite's head — used as a
   * "reward" for talking to certain characters.
   */
  _spawnGemBurst(sourceSprite) {
    const count = 1 + Math.floor(Math.random() * 3);
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
      const angle = (-Math.PI / 2) + (Math.random() - 0.5) * 1.4;
      const dist = 50 + Math.random() * 80;
      const restX = startX + Math.cos(angle) * dist;
      const restY = startY + Math.sin(angle) * dist;
      const gem = this.add.image(startX, startY, key).setOrigin(0.5);
      const tex = this.textures.get(key).getSourceImage();
      gem.setScale((this.scale.height * 0.10) / tex.height);
      gem.setRotation((Math.random() - 0.5) * 0.6);
      gem.setDepth(startY + 1);

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
          gem.on('pointerover', () => gem.setTint(0xfff5d0));
          gem.on('pointerout', () => gem.clearTint());
          gem.on('pointerup', () => this._collectGem(gem, key, value));
        }
      });
    }
  }

  _popAndHide(sprite) {
    if (Accessibility.reducedMotion) {
      sprite.setVisible(false);
      return;
    }
    this.tweens.add({
      targets: sprite,
      scale: sprite.scale * 0.1,
      alpha: 0,
      duration: 280,
      ease: 'Back.easeIn',
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

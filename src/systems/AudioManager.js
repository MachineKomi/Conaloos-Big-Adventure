/**
 * AudioManager — one looping music channel with crossfade, polyphonic SFX,
 * global mute that honours Accessibility settings.
 */

import { Accessibility } from './Accessibility.js';
import { resolveAudio } from '../content/audioAliases.js';

const MUSIC_VOLUME = 0.35;
const SFX_VOLUME = 0.7;
const CROSSFADE_MS = 1500;

export class AudioManager {
  constructor(game) {
    this.game = game;
    this.currentMusicKey = null;
    this.currentMusic = null;
    this._unsubscribe = Accessibility.on(() => this.applyMute());
    this.applyMute();
  }

  applyMute() {
    this.game.sound.mute = Accessibility.muted;
  }

  destroy() {
    this._unsubscribe?.();
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic.destroy();
      this.currentMusic = null;
    }
  }

  /**
   * Switch background music. No-op if same key. Crossfades 1.5s.
   * Pass any active scene so we can borrow its tween manager (Phaser tweens
   * are scene-scoped, not game-scoped).
   */
  playMusic(key, scene) {
    if (!key) return this.stopMusic(scene);
    const resolved = resolveAudio(key);
    if (this.currentMusicKey === resolved && this.currentMusic?.isPlaying) return;
    if (!this.game.cache.audio.exists(resolved)) {
      // not loaded — silent fail, this is a software toy
      return;
    }

    const next = this.game.sound.add(resolved, { loop: true, volume: 0 });
    next.play();
    this._fade(scene, next, MUSIC_VOLUME, CROSSFADE_MS);

    if (this.currentMusic) {
      const old = this.currentMusic;
      this._fade(scene, old, 0, CROSSFADE_MS, () => {
        old.stop();
        old.destroy();
      });
    }

    this.currentMusic = next;
    this.currentMusicKey = resolved;
  }

  stopMusic(scene) {
    if (!this.currentMusic) return;
    const old = this.currentMusic;
    this.currentMusic = null;
    this.currentMusicKey = null;
    this._fade(scene, old, 0, 600, () => { old.stop(); old.destroy(); });
  }

  /**
   * Fade a sound's volume. Uses the given scene's tween manager when
   * available; otherwise falls back to a stepped setInterval.
   */
  _fade(scene, sound, target, durationMs, onComplete) {
    const tweens = scene?.tweens || this._anyActiveSceneTweens();
    if (tweens) {
      tweens.add({
        targets: sound,
        volume: target,
        duration: durationMs,
        ease: 'Sine.easeInOut',
        onComplete
      });
      return;
    }
    // Fallback: hard set + immediate complete (no fade).
    sound.setVolume?.(target);
    onComplete?.();
  }

  _anyActiveSceneTweens() {
    const active = this.game.scene.getScenes(true).find((s) => s.tweens);
    return active?.tweens || null;
  }

  /** Fire-and-forget one-shot. Safe if the key is missing. */
  playSfx(key) {
    if (!key) return;
    const resolved = resolveAudio(key);
    if (!this.game.cache.audio.exists(resolved)) return;
    this.game.sound.play(resolved, { volume: SFX_VOLUME });
  }
}

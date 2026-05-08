/**
 * AudioManager — one looping music channel with crossfade, polyphonic SFX,
 * global mute that honours Accessibility settings.
 */

import { Accessibility } from './Accessibility.js';

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

  /** Switch background music. No-op if same key. Crossfades 1.5s. */
  playMusic(key) {
    if (!key) return this.stopMusic();
    if (this.currentMusicKey === key && this.currentMusic?.isPlaying) return;
    if (!this.game.sound.get(key) && !this.game.cache.audio.exists(key)) {
      // not loaded — silent fail, this is a software toy
      return;
    }

    const next = this.game.sound.add(key, { loop: true, volume: 0 });
    next.play();
    this.game.tweens.add({
      targets: next,
      volume: MUSIC_VOLUME,
      duration: CROSSFADE_MS,
      ease: 'Sine.easeOut'
    });

    if (this.currentMusic) {
      const old = this.currentMusic;
      this.game.tweens.add({
        targets: old,
        volume: 0,
        duration: CROSSFADE_MS,
        ease: 'Sine.easeIn',
        onComplete: () => {
          old.stop();
          old.destroy();
        }
      });
    }

    this.currentMusic = next;
    this.currentMusicKey = key;
  }

  stopMusic() {
    if (!this.currentMusic) return;
    const old = this.currentMusic;
    this.currentMusic = null;
    this.currentMusicKey = null;
    this.game.tweens.add({
      targets: old,
      volume: 0,
      duration: 600,
      onComplete: () => { old.stop(); old.destroy(); }
    });
  }

  /** Fire-and-forget one-shot. Safe if the key is missing. */
  playSfx(key) {
    if (!key) return;
    if (!this.game.cache.audio.exists(key)) return;
    this.game.sound.play(key, { volume: SFX_VOLUME });
  }
}

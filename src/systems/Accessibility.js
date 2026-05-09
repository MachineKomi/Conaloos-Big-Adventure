/**
 * Accessibility — central source of truth for mute, reduced-motion, text size.
 * Persists to localStorage. Honours OS-level prefers-reduced-motion on first run.
 */

const KEY = 'conaloo.a11y.v1';

const DEFAULTS = {
  muted: false,
  // Default `false` (NOT null/inherit) — Dad's tablet had OS-level
  // prefers-reduced-motion enabled which made Amelia teleport instead
  // of walk, defeating the protagonist mechanic. The user can still
  // toggle it on via the corner button.
  reducedMotion: false,
  textSize: 'M'          // 'S' | 'M' | 'L'
};

const TEXT_SIZE_PX = { S: 26, M: 32, L: 40 };

class AccessibilityImpl {
  constructor() {
    this.state = { ...DEFAULTS, ...this.#load() };
    this.listeners = new Set();

    // Watch OS-level reduced-motion changes when the user hasn't overridden.
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.osReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.osReducedMotion.addEventListener?.('change', () => this.#emit());
    }
  }

  #load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  #save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state));
    } catch {
      /* ignore quota errors */
    }
  }

  #emit() {
    for (const fn of this.listeners) fn(this);
  }

  on(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  get muted() { return this.state.muted; }
  setMuted(v) { this.state.muted = !!v; this.#save(); this.#emit(); }
  toggleMuted() { this.setMuted(!this.muted); }

  /** True if reduced motion is in effect (override or OS). */
  get reducedMotion() {
    if (this.state.reducedMotion !== null) return this.state.reducedMotion;
    return !!this.osReducedMotion?.matches;
  }
  setReducedMotion(v) { this.state.reducedMotion = v === null ? null : !!v; this.#save(); this.#emit(); }

  get textSize() { return this.state.textSize; }
  get textSizePx() { return TEXT_SIZE_PX[this.state.textSize] || TEXT_SIZE_PX.M; }
  cycleTextSize() {
    const order = ['S', 'M', 'L'];
    const idx = order.indexOf(this.state.textSize);
    this.state.textSize = order[(idx + 1) % order.length];
    this.#save();
    this.#emit();
  }
}

export const Accessibility = new AccessibilityImpl();

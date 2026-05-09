/**
 * GemBag — tracks how many "stones" (the in-game currency made of gems
 * 1..9) the player has gathered, plus per-gem counts. Persists for the
 * session; not saved to localStorage in this MVP — if the page reloads,
 * the bag empties (we want a child to be able to play again from zero).
 *
 * The bag also emits change events so the GemHUDScene can animate
 * "+N → total" math reveals each time a gem is collected.
 */

export class GemBag {
  constructor() {
    this.total = 0;
    this.byGem = new Map(); // gemKey -> times collected
    this._listeners = new Set();
  }

  /**
   * Add a gem to the bag.
   * @param {string} gemKey   asset key like 'gem_3'
   * @param {number} value    numeric value of the gem (1..9)
   */
  add(gemKey, value) {
    const previousTotal = this.total;
    const v = Math.max(0, Math.floor(value || 0));
    this.total += v;
    this.byGem.set(gemKey, (this.byGem.get(gemKey) ?? 0) + 1);
    for (const fn of this._listeners) {
      fn({
        gemKey,
        delta: v,
        previousTotal,
        newTotal: this.total
      });
    }
    return this.total;
  }

  /** Subscribe to changes. Returns an unsubscribe function. */
  onChange(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }
}

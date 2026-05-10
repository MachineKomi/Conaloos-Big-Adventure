/**
 * GemBag — tracks how many gems (values 1..9) the player has gathered,
 * plus per-gem-key counts. (Earlier versions called the running total
 * "stones"; the in-game wording is now consistently "gems".)
 *
 * v1.8: optionally backed by SaveGame. If a `saveGame` is passed in,
 * the bag rehydrates from it on construction and persists on every
 * change. With no saveGame, behaves session-only as before.
 *
 * The bag emits change events so the GemHUDScene can animate
 * "+N → total" math reveals each time a gem is collected.
 */

export class GemBag {
  constructor({ saveGame = null } = {}) {
    this.total = 0;
    this.byGem = new Map(); // gemKey -> times collected
    this._listeners = new Set();
    this._saveGame = saveGame;

    if (saveGame) {
      this.total = saveGame.getGemTotal();
      const byGem = saveGame.getGemByGem();
      for (const [k, v] of Object.entries(byGem)) {
        const n = Number(v) || 0;
        if (n > 0) this.byGem.set(k, n);
      }
    }
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
    this._persist();
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

  _persist() {
    if (!this._saveGame) return;
    const byGem = {};
    for (const [k, v] of this.byGem) byGem[k] = v;
    this._saveGame.setGems(this.total, byGem);
  }
}

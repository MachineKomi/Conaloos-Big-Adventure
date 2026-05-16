/**
 * SaveGame — flexible localStorage persistence.
 *
 * Stores ONLY the bare facts needed to resume: gem total, per-gem
 * counts (so the bag's last-collected icon stays right), inventory
 * (key + count for each thing carried), and the *flag* of which
 * quests have been completed. Everything else (quest progress,
 * scenes seen, quizzes seen, batch math state) recomputes on the
 * fly — that's the "flexible on update" property: shipping a new
 * version of the game with new quests / new scenes won't blow up
 * an old save, because every field has a sane default.
 *
 * Schema:
 *   {
 *     v: 1,
 *     gemTotal: 47,
 *     gemByGem: { 'gem_3': 2, 'gem_5': 9 },
 *     inventory: [{ key: 'thing_teddybear', count: 1 }, ...],
 *     questsCompleted: ['first-gem', 'first-thing'],
 *     worldCollected: ['scene:big-field:gem:gem_3:412:520', ...],
 *     buddies: [{ speciesId: 'conaloo', level: 1, exp: 0 }, ...],
 *     activeBuddyIdx: 0
 *   }
 *
 * The schema version `v` lets future versions migrate or discard
 * incompatible fields without losing the rest. Right now everything
 * is forward-compatible by ignoring unknown fields.
 */

const KEY = 'take-the-long-way.save.v1';
const SCHEMA_VERSION = 1;

export class SaveGame {
  constructor() {
    this.data = this._readFromStorage() || {};
  }

  /** True if there's anything worth resuming. */
  hasSave() {
    const d = this.data || {};
    return (
      (typeof d.gemTotal === 'number' && d.gemTotal > 0) ||
      (Array.isArray(d.inventory) && d.inventory.length > 0) ||
      (Array.isArray(d.questsCompleted) && d.questsCompleted.length > 0) ||
      (Array.isArray(d.worldCollected) && d.worldCollected.length > 0) ||
      (Array.isArray(d.buddies) && d.buddies.length > 0)
    );
  }

  // ---- Getters (always return defaults so callers don't need to guard) ----

  getGemTotal()   { return Number(this.data.gemTotal) || 0; }
  getGemByGem()   { return (this.data.gemByGem && typeof this.data.gemByGem === 'object') ? this.data.gemByGem : {}; }
  getInventory()  {
    const inv = Array.isArray(this.data.inventory) ? this.data.inventory : [];
    return inv.filter((it) => it && typeof it.key === 'string' && typeof it.count === 'number');
  }
  getQuestsCompleted() {
    return Array.isArray(this.data.questsCompleted) ? this.data.questsCompleted.filter((s) => typeof s === 'string') : [];
  }
  getWorldCollected() {
    return Array.isArray(this.data.worldCollected) ? this.data.worldCollected.filter((s) => typeof s === 'string') : [];
  }
  /** Buddy roster — array of `{ speciesId, level, exp, nickname? }`.
   *  Each field defended individually so a partial / future save
   *  doesn't bomb out the load. */
  getBuddies() {
    const arr = Array.isArray(this.data.buddies) ? this.data.buddies : [];
    return arr
      .filter((b) => b && typeof b.speciesId === 'string')
      .map((b) => ({
        speciesId: b.speciesId,
        level: Math.max(1, Number(b.level) || 1),
        exp: Math.max(0, Number(b.exp) || 0),
        nickname: typeof b.nickname === 'string' ? b.nickname : null
      }));
  }
  getActiveBuddyIdx() {
    return Math.max(0, Number(this.data.activeBuddyIdx) || 0);
  }

  // ---- Setters (each one persists immediately) ----

  setGems(total, byGem) {
    this.data.gemTotal = Math.max(0, Math.floor(total || 0));
    this.data.gemByGem = byGem && typeof byGem === 'object' ? { ...byGem } : {};
    this._persist();
  }
  setInventory(items) {
    this.data.inventory = (Array.isArray(items) ? items : [])
      .map((it) => ({ key: String(it.key), count: Number(it.count) || 0 }))
      .filter((it) => it.count > 0);
    this._persist();
  }
  setQuestsCompleted(ids) {
    this.data.questsCompleted = Array.isArray(ids) ? ids.map(String) : [];
    this._persist();
  }
  addWorldCollected(key) {
    if (!key) return;
    if (!Array.isArray(this.data.worldCollected)) this.data.worldCollected = [];
    if (this.data.worldCollected.includes(key)) return;
    this.data.worldCollected.push(key);
    this._persist();
  }
  setBuddies(buddies) {
    this.data.buddies = (Array.isArray(buddies) ? buddies : [])
      .map((b) => ({
        speciesId: String(b.speciesId),
        level: Math.max(1, Math.floor(Number(b.level) || 1)),
        exp: Math.max(0, Math.floor(Number(b.exp) || 0)),
        nickname: typeof b.nickname === 'string' ? b.nickname : null
      }));
    this._persist();
  }
  setActiveBuddyIdx(i) {
    this.data.activeBuddyIdx = Math.max(0, Math.floor(Number(i) || 0));
    this._persist();
  }

  /** Wipe the save entirely. Used by "start a fresh adventure". */
  clear() {
    this.data = {};
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  }

  // ---- Internals ----

  _readFromStorage() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      // Forward-compatible: unknown version still readable; we just
      // trust each getter to defend itself.
      return parsed;
    } catch {
      return null;
    }
  }

  _persist() {
    try {
      this.data.v = SCHEMA_VERSION;
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      // Quota exceeded / privacy mode / etc — just skip. The session
      // continues; the kid keeps playing; we just won't resume.
    }
  }
}

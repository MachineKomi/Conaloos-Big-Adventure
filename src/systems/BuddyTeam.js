/**
 * BuddyTeam — manages the player's buddy roster.
 *
 * Wraps an array of buddy *instances* (each `{speciesId, level,
 * exp, nickname?}`), with helpers for the battle scene:
 * - active() returns the buddy that follows Amelia & enters battle
 * - makeBattleParticipant(buddy) returns the fully-stat'd struct
 *   the BattleScene works with
 * - grantExp(buddy, amount) handles level-up bookkeeping
 *
 * Persists to SaveGame: schema is forward-compatible so future
 * versions can add status, nicknames, held items, etc, without
 * breaking old saves.
 *
 * v1.12 MVP: the team only ever has ONE buddy (Conaloo, given
 * for free at first launch). The data model supports more so the
 * recruitment feature in v1.13 can just push onto the array.
 */

import { getSpecies, computeStats, expForNextLevel } from '../content/buddySpecies.js';

/** Normalise any overflow EXP into actual level-ups. Used after
 *  hydrating from a save written with a different (slower) EXP
 *  curve — without this, a buddy with exp >= old threshold but >=
 *  new threshold gets "stuck" at its saved level even though they
 *  should have grown. */
function normaliseLevels(buddy) {
  let needed = expForNextLevel(buddy.level);
  while (buddy.exp >= needed) {
    buddy.exp -= needed;
    buddy.level += 1;
    needed = expForNextLevel(buddy.level);
  }
}

const STARTER_SPECIES_ID = 'conaloo';

export class BuddyTeam {
  constructor({ saveGame = null } = {}) {
    this.saveGame = saveGame;
    this._buddies = [];
    this._activeIdx = 0;
    this._listeners = new Set();
    this._hydrate();
  }

  _hydrate() {
    let buddies = [];
    let activeIdx = 0;
    if (this.saveGame) {
      buddies = this.saveGame.getBuddies();
      activeIdx = this.saveGame.getActiveBuddyIdx();
    }
    if (!buddies.length) {
      buddies = [{ speciesId: STARTER_SPECIES_ID, level: 1, exp: 0 }];
      activeIdx = 0;
    }
    // Sanity-filter: drop any instance whose species id no longer
    // exists in this build of the game (lets us rename/remove
    // species without bricking old saves).
    this._buddies = buddies.filter((b) => !!getSpecies(b.speciesId));
    if (this._buddies.length === 0) {
      this._buddies = [{ speciesId: STARTER_SPECIES_ID, level: 1, exp: 0 }];
    }
    // Cascade any saved EXP overflow into level-ups. Handles save
    // data written under older (slower) EXP curves.
    let migrated = false;
    for (const b of this._buddies) {
      const beforeLv = b.level;
      normaliseLevels(b);
      if (b.level !== beforeLv) migrated = true;
    }
    this._activeIdx = Math.min(Math.max(0, activeIdx), this._buddies.length - 1);
    if (migrated) this._persist();
  }

  /** All buddies on the team, in order. */
  list() { return this._buddies.slice(); }

  /** The buddy that follows Amelia & enters battle first. */
  active() { return this._buddies[this._activeIdx] || null; }

  /** Set which buddy is the active follower / battle starter. */
  setActiveIdx(i) {
    if (i < 0 || i >= this._buddies.length) return;
    this._activeIdx = i;
    this._persist();
    this._notify();
  }

  /** Find a buddy by species id (returns first match, null if none). */
  bySpecies(speciesId) {
    return this._buddies.find((b) => b.speciesId === speciesId) || null;
  }

  /** True if the team already has this species. */
  has(speciesId) {
    return !!this.bySpecies(speciesId);
  }

  /** Add a fresh buddy of the given species at the given level.
   *  Used by the (future) recruitment flow; harmless to call now.
   *  Returns the buddy instance. */
  recruit(speciesId, level = 1) {
    const species = getSpecies(speciesId);
    if (!species) return null;
    const buddy = { speciesId, level, exp: 0 };
    this._buddies.push(buddy);
    this._persist();
    this._notify();
    return buddy;
  }

  /** Grant EXP to a buddy. Auto-applies level-ups. Returns the
   *  number of levels gained so the BattleScene can show a
   *  "LEVEL UP!" beat. */
  grantExp(buddy, amount) {
    if (!buddy || amount <= 0) return 0;
    let levels = 0;
    buddy.exp = (buddy.exp || 0) + amount;
    // Cascade level-ups (rare but possible after a big battle).
    let needed = expForNextLevel(buddy.level);
    while (buddy.exp >= needed) {
      buddy.exp -= needed;
      buddy.level += 1;
      levels += 1;
      needed = expForNextLevel(buddy.level);
    }
    this._persist();
    this._notify();
    return levels;
  }

  /** Build the transient battle participant struct from a buddy
   *  instance. Always returns full HP / full energy — that's the
   *  user-spec ("HP resets after combat"). */
  makeBattleParticipant(buddy) {
    if (!buddy) return null;
    const species = getSpecies(buddy.speciesId);
    if (!species) return null;
    const stats = computeStats(buddy.speciesId, buddy.level);
    return {
      buddyInstance: buddy,     // back-reference for EXP grant
      species,
      level: buddy.level,
      hp: stats.maxHP,
      maxHP: stats.maxHP,
      energy: stats.maxEnergy,
      maxEnergy: stats.maxEnergy,
      atk: stats.atk,
      def: stats.def,
      spd: stats.spd
    };
  }

  /** Build a battle participant for a wild/NPC opponent (not on
   *  the player's team). Same as above but with no buddyInstance
   *  back-ref (so EXP / level-up flow knows it's a one-off). */
  makeOpponent(speciesId, level) {
    const species = getSpecies(speciesId);
    if (!species) return null;
    const stats = computeStats(speciesId, level);
    return {
      buddyInstance: null,
      species,
      level,
      hp: stats.maxHP,
      maxHP: stats.maxHP,
      energy: stats.maxEnergy,
      maxEnergy: stats.maxEnergy,
      atk: stats.atk,
      def: stats.def,
      spd: stats.spd
    };
  }

  /** Subscribe to team changes (active buddy, level-ups, new
   *  recruits). Returns an unsubscribe fn. */
  onChange(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  _notify() {
    for (const fn of this._listeners) fn(this);
  }

  _persist() {
    if (!this.saveGame) return;
    this.saveGame.setBuddies(this._buddies);
    this.saveGame.setActiveBuddyIdx(this._activeIdx);
  }

  /** Used by main.js's "new game" reset. */
  reset() {
    this._buddies = [{ speciesId: STARTER_SPECIES_ID, level: 1, exp: 0 }];
    this._activeIdx = 0;
    this._persist();
    this._notify();
  }
}

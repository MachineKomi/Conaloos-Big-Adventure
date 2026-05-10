/**
 * Quests + achievements.
 *
 * A simple event-driven tracker. Game systems emit events
 * (gem-collected, thing-collected, quiz-correct, scene-visited)
 * via QuestManager.report(). Each quest definition owns a small
 * predicate that maps the event into a progress increment.
 *
 * On completion, a quest auto-grants its reward (currently always
 * gems → GemBag) and pops a celebratory banner.
 *
 * Progress is session-only (no persistence) for now, matching the
 * rest of the game. Page reload = fresh start.
 */

export const QUEST_DEFS = [
  // -- Easy starter quests ----------------------------------------
  {
    id: 'first-gem',
    title: "First sparkle",
    desc: "Collect your first gem.",
    target: 1,
    reward: 3,
    matches: (evt) => (evt.type === 'gem-collected' ? 1 : 0)
  },
  {
    id: 'first-thing',
    title: "First treasure",
    desc: "Pick up your first thing.",
    target: 1,
    reward: 5,
    matches: (evt) => (evt.type === 'thing-collected' ? 1 : 0)
  },
  {
    id: 'first-portal',
    title: "First wander",
    desc: "Travel to a new scene.",
    target: 1,
    reward: 4,
    // Counts only visits AFTER the first scene.
    matches: (evt) => (evt.type === 'scene-visited' && !evt.firstScene ? 1 : 0)
  },

  // -- Mid-game collectathons -------------------------------------
  {
    id: 'gem-rookie',
    title: "Gem rookie",
    desc: "Collect 25 stones.",
    target: 25,
    reward: 8,
    matches: (evt) => (evt.type === 'gem-collected' ? evt.value : 0)
  },
  {
    id: 'gem-hoarder',
    title: "Gem hoarder",
    desc: "Collect 100 stones.",
    target: 100,
    reward: 20,
    matches: (evt) => (evt.type === 'gem-collected' ? evt.value : 0)
  },
  {
    id: 'thing-collector',
    title: "Pocket of plenty",
    desc: "Collect 5 different things.",
    target: 5,
    reward: 10,
    // Each unique thing key counts once.
    _seen: new Set(),
    matches: function (evt) {
      if (evt.type !== 'thing-collected') return 0;
      if (this._seen.has(evt.key)) return 0;
      this._seen.add(evt.key);
      return 1;
    }
  },
  {
    id: 'quiz-novice',
    title: "Bright spark",
    desc: "Get 3 quiz answers right.",
    target: 3,
    reward: 8,
    matches: (evt) => (evt.type === 'quiz-correct' ? 1 : 0)
  },
  {
    id: 'quiz-scholar',
    title: "Scholar of small things",
    desc: "Get 10 quiz answers right.",
    target: 10,
    reward: 18,
    matches: (evt) => (evt.type === 'quiz-correct' ? 1 : 0)
  },
  {
    id: 'wanderer',
    title: "Long-way wanderer",
    desc: "Visit 5 different scenes.",
    target: 5,
    reward: 15,
    _seen: new Set(),
    matches: function (evt) {
      if (evt.type !== 'scene-visited') return 0;
      if (this._seen.has(evt.slug)) return 0;
      this._seen.add(evt.slug);
      return 1;
    }
  },
  {
    id: 'globetrotter',
    title: "Whole-world walker",
    desc: "Visit every scene.",
    target: 11, // matches current scene count; quest will simply
                // require all when more land
    reward: 30,
    _seen: new Set(),
    matches: function (evt) {
      if (evt.type !== 'scene-visited') return 0;
      if (this._seen.has(evt.slug)) return 0;
      this._seen.add(evt.slug);
      return 1;
    }
  },

  // -- Specific items ---------------------------------------------
  {
    id: 'sweet-tooth',
    title: "Sweet tooth",
    desc: "Find the birthday cake.",
    target: 1,
    reward: 5,
    matches: (evt) => (evt.type === 'thing-collected' && evt.key === 'thing_birthday-cake-with-one-candle' ? 1 : 0)
  },
  {
    id: 'bring-your-buddy',
    title: "Comfort along",
    desc: "Find the teddy bear.",
    target: 1,
    reward: 5,
    matches: (evt) => (evt.type === 'thing-collected' && evt.key === 'thing_teddybear' ? 1 : 0)
  }
];

export class QuestManager {
  constructor() {
    /** Map<questId, { progress, completed, claimed, def }> */
    this.state = new Map();
    for (const def of QUEST_DEFS) {
      this.state.set(def.id, { progress: 0, completed: false, claimed: false, def });
    }
    this._listeners = new Set();
    this._sceneCount = 0;
  }

  /**
   * Game systems call this with an event. Each quest's `matches`
   * predicate decides if/how much to advance.
   *
   * @param {object} evt
   * @param {'gem-collected'|'thing-collected'|'quiz-correct'|'scene-visited'} evt.type
   */
  report(evt) {
    if (evt.type === 'scene-visited') {
      this._sceneCount += 1;
      evt.firstScene = this._sceneCount === 1;
    }
    const newlyCompleted = [];
    for (const entry of this.state.values()) {
      if (entry.completed) continue;
      const delta = entry.def.matches.call(entry.def, evt);
      if (!delta) continue;
      entry.progress = Math.min(entry.def.target, entry.progress + delta);
      if (entry.progress >= entry.def.target) {
        entry.completed = true;
        newlyCompleted.push(entry);
      }
    }
    for (const fn of this._listeners) fn({ updated: true, newlyCompleted });
    return newlyCompleted;
  }

  /** Mark a completed quest's reward as claimed. */
  claim(questId) {
    const entry = this.state.get(questId);
    if (!entry || !entry.completed || entry.claimed) return null;
    entry.claimed = true;
    for (const fn of this._listeners) fn({ updated: true, newlyCompleted: [] });
    return entry;
  }

  /** All quests, in declared order. */
  list() {
    return Array.from(this.state.values());
  }

  /** Count of completed quests. */
  completedCount() {
    return Array.from(this.state.values()).filter((e) => e.completed).length;
  }

  onChange(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }
}

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
  // -- First-step beats --------------------------------------------
  {
    id: 'first-gem',
    title: "A first small sparkle",
    desc: "Pick up your very first gem.",
    target: 1,
    reward: 3,
    matches: (evt) => (evt.type === 'gem-collected' ? 1 : 0)
  },
  {
    id: 'first-thing',
    title: "A pocket begins",
    desc: "Pick up your first something to carry.",
    target: 1,
    reward: 5,
    matches: (evt) => (evt.type === 'thing-collected' ? 1 : 0)
  },
  {
    id: 'first-portal',
    title: "Out the door, then",
    desc: "Take a portal to somewhere new.",
    target: 1,
    reward: 4,
    matches: (evt) => (evt.type === 'scene-visited' && !evt.firstScene ? 1 : 0)
  },

  // -- Stone-collectors --------------------------------------------
  {
    id: 'gem-rookie',
    title: "A handful of stones",
    desc: "Add 25 stones to the bag.",
    target: 25,
    reward: 8,
    matches: (evt) => (evt.type === 'gem-collected' ? evt.value : 0)
  },
  {
    id: 'gem-hoarder',
    title: "Properly-good hoarder",
    desc: "Get the bag up to 100 stones.",
    target: 100,
    reward: 20,
    matches: (evt) => (evt.type === 'gem-collected' ? evt.value : 0)
  },

  // -- Thing-collectors --------------------------------------------
  {
    id: 'thing-collector',
    title: "A clever, busy bag",
    desc: "Carry five different things at once (or by turns).",
    target: 5,
    reward: 10,
    _seen: new Set(),
    matches: function (evt) {
      if (evt.type !== 'thing-collected') return 0;
      if (this._seen.has(evt.key)) return 0;
      this._seen.add(evt.key);
      return 1;
    }
  },

  // -- Bright sparks (quiz-correct) --------------------------------
  {
    id: 'quiz-novice',
    title: "A bright little spark",
    desc: "Get three quiz questions right.",
    target: 3,
    reward: 8,
    matches: (evt) => (evt.type === 'quiz-correct' ? 1 : 0)
  },
  {
    id: 'quiz-scholar',
    title: "Scholar of small things",
    desc: "Get ten quiz questions right.",
    target: 10,
    reward: 18,
    matches: (evt) => (evt.type === 'quiz-correct' ? 1 : 0)
  },

  // -- Wanderers ---------------------------------------------------
  {
    id: 'wanderer',
    title: "Off the beaten path",
    desc: "Visit five different scenes.",
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
    title: "The whole-world walker",
    desc: "Visit every scene there is.",
    target: 11,
    reward: 30,
    _seen: new Set(),
    matches: function (evt) {
      if (evt.type !== 'scene-visited') return 0;
      if (this._seen.has(evt.slug)) return 0;
      this._seen.add(evt.slug);
      return 1;
    }
  },

  // -- Specific finds ---------------------------------------------
  {
    id: 'sweet-tooth',
    title: "Whose birthday's this?",
    desc: "Find the cake with the one little candle.",
    target: 1,
    reward: 5,
    matches: (evt) => (evt.type === 'thing-collected' && evt.key === 'thing_birthday-cake-with-one-candle' ? 1 : 0)
  },
  {
    id: 'bring-your-buddy',
    title: "Soft and quiet",
    desc: "Find the teddy who waits at the door.",
    target: 1,
    reward: 5,
    matches: (evt) => (evt.type === 'thing-collected' && evt.key === 'thing_teddybear' ? 1 : 0)
  },
  {
    id: 'star-finder',
    title: "Stars in pockets",
    desc: "Hold the hourglass in your hand.",
    target: 1,
    reward: 6,
    matches: (evt) => (evt.type === 'thing-collected' && evt.key === 'thing_hourglass' ? 1 : 0)
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

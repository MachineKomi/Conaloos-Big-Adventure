/**
 * Quests + achievements (in this game they're the same thing — every
 * entry is a small earned thing the kid can find in the star panel).
 *
 * Architecture: an event-driven tracker. Game systems emit events
 * (gem-collected, thing-collected, quiz-correct, scene-visited,
 * rocket-launched, hotspot-clicked) via QuestManager.report(). Each
 * quest definition owns a small predicate that maps the event into
 * a progress increment. On completion the QuestHUD shows a toast
 * + auto-grants the gem reward.
 *
 * v1.9: large expansion. The save format only persists the COMPLETED
 * flag of each quest, so adding new ones doesn't break old saves; on
 * load, the in-memory state hydrates from the persisted gem total
 * and inventory, so progress bars on incomplete quests start in the
 * right place.
 *
 * Each quest's `_seen` Set is created lazily inside its matches()
 * function (see ensure()) so the Sets are present after construction
 * even though the QUEST_DEFS array is constant.
 */

/**
 * Helper: ensure a per-quest mutable bag exists. We store it on the
 * def itself for simplicity. Reset by main.js on "start fresh".
 */
function ensureSet(def, key = '_seen') {
  if (!def[key]) def[key] = new Set();
  return def[key];
}

// Inventory keys we care about for the "one of each collectable" quest.
const ALL_COLLECTABLES = [
  'thing_birthday-cake-with-one-candle',
  'thing_books',
  'thing_teddybear',
  'thing_flashlight',
  'thing_microscope',
  'thing_globe',
  'thing_hourglass',
  'thing_bucket',
  'thing_banana',
  'thing_tyre'
];

export const QUEST_DEFS = [
  // ─────────────────── tiny first beats ───────────────────
  {
    id: 'first-gem',
    title: "A first small sparkle",
    desc: "Pick up your very first gem.",
    target: 1, reward: 3,
    matches: (evt) => (evt.type === 'gem-collected' ? 1 : 0)
  },
  {
    id: 'first-thing',
    title: "A pocket begins",
    desc: "Pick up your first something to carry.",
    target: 1, reward: 5,
    matches: (evt) => (evt.type === 'thing-collected' ? 1 : 0)
  },
  {
    id: 'first-portal',
    title: "Out the door, then",
    desc: "Take a portal to somewhere new.",
    target: 1, reward: 4,
    matches: (evt) => (evt.type === 'scene-visited' && !evt.firstScene ? 1 : 0)
  },
  {
    id: 'first-rocket',
    title: "Up she goes!",
    desc: "Send a rocket all the way to the sky.",
    target: 1, reward: 5,
    matches: (evt) => (evt.type === 'rocket-launched' ? 1 : 0)
  },

  // ─────────────────── stone collectors ───────────────────
  {
    id: 'gem-rookie',
    title: "A handful of stones",
    desc: "Add 25 stones to the bag.",
    target: 25, reward: 8,
    matches: (evt) => (evt.type === 'gem-collected' ? evt.value : 0)
  },
  {
    id: 'gem-hoarder',
    title: "Properly-good hoarder",
    desc: "Get the bag up to 100 stones.",
    target: 100, reward: 20,
    matches: (evt) => (evt.type === 'gem-collected' ? evt.value : 0)
  },
  {
    id: 'gem-tycoon',
    title: "Pockets full of *quite* a lot",
    desc: "Reach a hoard of 250 stones.",
    target: 250, reward: 35,
    matches: (evt) => (evt.type === 'gem-collected' ? evt.value : 0)
  },
  {
    id: 'gem-emperor',
    title: "The five-hundred-stone friend",
    desc: "Reach 500 stones — quite a lot of pockets.",
    target: 500, reward: 60,
    matches: (evt) => (evt.type === 'gem-collected' ? evt.value : 0)
  },

  // ─────────────────── bag-of-things collectors ───────────────────
  {
    id: 'thing-collector',
    title: "A clever, busy bag",
    desc: "Carry five different things at once (or by turns).",
    target: 5, reward: 10,
    matches: function (evt) {
      if (evt.type !== 'thing-collected') return 0;
      const seen = ensureSet(this);
      if (seen.has(evt.key)) return 0;
      seen.add(evt.key);
      return 1;
    }
  },
  {
    id: 'thing-archivist',
    title: "A bag for an *archivist*",
    desc: "Discover ten different things.",
    target: 10, reward: 18,
    matches: function (evt) {
      if (evt.type !== 'thing-collected') return 0;
      const seen = ensureSet(this);
      if (seen.has(evt.key)) return 0;
      seen.add(evt.key);
      return 1;
    }
  },
  {
    id: 'one-of-each',
    title: "*Exactly* one of *each*",
    desc: "Hold one of every collectable thing in the world at once.",
    target: 1, reward: 30,
    matches: function (evt) {
      if (evt.type !== 'thing-collected') return 0;
      const inv = evt.inventory || [];
      const have = new Set(inv.map((it) => it.key));
      if (ALL_COLLECTABLES.every((k) => have.has(k))) return 1;
      return 0;
    }
  },
  {
    id: 'a-full-bag',
    title: "A heavy little bag",
    desc: "Carry eight things at once (no, the bag won't *quite* burst).",
    target: 1, reward: 14,
    matches: function (evt) {
      if (evt.type !== 'thing-collected') return 0;
      return (evt.totalCount >= 8) ? 1 : 0;
    }
  },

  // ─────────────────── bright sparks (quizzes) ───────────────────
  {
    id: 'quiz-novice',
    title: "A bright little spark",
    desc: "Get three quiz questions right.",
    target: 3, reward: 8,
    matches: (evt) => (evt.type === 'quiz-correct' ? 1 : 0)
  },
  {
    id: 'quiz-scholar',
    title: "Scholar of small things",
    desc: "Get ten quiz questions right.",
    target: 10, reward: 18,
    matches: (evt) => (evt.type === 'quiz-correct' ? 1 : 0)
  },
  {
    id: 'quiz-doctor',
    title: "A *doctor* of small things",
    desc: "Get twenty-five quiz questions right.",
    target: 25, reward: 32,
    matches: (evt) => (evt.type === 'quiz-correct' ? 1 : 0)
  },

  // ─────────────────── wanderers ───────────────────
  {
    id: 'wanderer',
    title: "Off the beaten path",
    desc: "Visit five different scenes.",
    target: 5, reward: 15,
    matches: function (evt) {
      if (evt.type !== 'scene-visited') return 0;
      const seen = ensureSet(this);
      if (seen.has(evt.slug)) return 0;
      seen.add(evt.slug);
      return 1;
    }
  },
  {
    id: 'globetrotter',
    title: "The whole-world walker",
    desc: "Visit every scene there is.",
    target: 11, reward: 30,
    matches: function (evt) {
      if (evt.type !== 'scene-visited') return 0;
      const seen = ensureSet(this);
      if (seen.has(evt.slug)) return 0;
      seen.add(evt.slug);
      return 1;
    }
  },

  // ─────────────────── rockets (a little space programme) ───────────────────
  {
    id: 'both-rockets',
    title: "Two rockets, two skies",
    desc: "Launch the rocket in *both* gardens.",
    target: 2, reward: 12,
    matches: function (evt) {
      if (evt.type !== 'rocket-launched') return 0;
      const seen = ensureSet(this);
      if (seen.has(evt.slug)) return 0;
      seen.add(evt.slug);
      return 1;
    }
  },
  {
    id: 'rocket-fan',
    title: "Rocket fan, *first class*",
    desc: "Launch ten rockets in total.",
    target: 10, reward: 25,
    matches: (evt) => (evt.type === 'rocket-launched' ? 1 : 0)
  },

  // ─────────────────── *specific finds* (proper finds, properly) ───────────────────
  {
    id: 'sweet-tooth',
    title: "Whose birthday's this?",
    desc: "Find the cake with the one little candle.",
    target: 1, reward: 5,
    matches: (evt) => (evt.type === 'thing-collected' && evt.key === 'thing_birthday-cake-with-one-candle' ? 1 : 0)
  },
  {
    id: 'bring-your-buddy',
    title: "Soft and quiet",
    desc: "Find the teddy who waits at the door.",
    target: 1, reward: 5,
    matches: (evt) => (evt.type === 'thing-collected' && evt.key === 'thing_teddybear' ? 1 : 0)
  },
  {
    id: 'star-finder',
    title: "Stars in pockets",
    desc: "Hold the hourglass in your hand.",
    target: 1, reward: 6,
    matches: (evt) => (evt.type === 'thing-collected' && evt.key === 'thing_hourglass' ? 1 : 0)
  },
  {
    id: 'find-globe',
    title: "A whole world, in a hand",
    desc: "Find the small spinning globe.",
    target: 1, reward: 6,
    matches: (evt) => (evt.type === 'thing-collected' && evt.key === 'thing_globe' ? 1 : 0)
  },
  {
    id: 'find-microscope',
    title: "Eyes for the *tiny*",
    desc: "Find the brass microscope.",
    target: 1, reward: 6,
    matches: (evt) => (evt.type === 'thing-collected' && evt.key === 'thing_microscope' ? 1 : 0)
  },
  {
    id: 'find-flashlight',
    title: "A small sun in a hand",
    desc: "Find the flashlight.",
    target: 1, reward: 5,
    matches: (evt) => (evt.type === 'thing-collected' && evt.key === 'thing_flashlight' ? 1 : 0)
  },
  {
    id: 'find-bucket',
    title: "A bucket of *anything*",
    desc: "Find the bucket. (Carry the seaside.)",
    target: 1, reward: 5,
    matches: (evt) => (evt.type === 'thing-collected' && evt.key === 'thing_bucket' ? 1 : 0)
  },
  {
    id: 'find-banana',
    title: "Cosenae's mislaid lunch",
    desc: "Find the banana that wandered off.",
    target: 1, reward: 4,
    matches: (evt) => (evt.type === 'thing-collected' && evt.key === 'thing_banana' ? 1 : 0)
  },
  {
    id: 'find-tyre',
    title: "A *very round* friend",
    desc: "Find the tyre that loves *forward*.",
    target: 1, reward: 5,
    matches: (evt) => (evt.type === 'thing-collected' && evt.key === 'thing_tyre' ? 1 : 0)
  },
  {
    id: 'find-books',
    title: "Half-read, half-marked",
    desc: "Find the book left by the fire.",
    target: 1, reward: 5,
    matches: (evt) => (evt.type === 'thing-collected' && evt.key === 'thing_books' ? 1 : 0)
  },

  // ─────────────────── puzzly + riddly ───────────────────
  {
    id: 'museum-curator',
    title: "Curator of *small* museums",
    desc: "Tap five different *Tiny Museum* hotspots (the little fact-stones).",
    target: 5, reward: 12,
    matches: function (evt) {
      if (evt.type !== 'hotspot-clicked') return 0;
      // Tiny museums have no speaker but their ids are not portals.
      // We tag them with a `museum:` id-prefix in scene defs, but for
      // back-compat we sniff "museum-y" ids (they're the ones whose
      // hotspot returns a fact). Simpler: count any reactor without
      // a speaker as a "stone" (museums + question stones). To keep
      // them distinct from question stones, we use a per-id seen set.
      if (evt.hotspotType !== 'reactor' || evt.speaker) return 0;
      const seen = ensureSet(this);
      if (seen.has(evt.id)) return 0;
      seen.add(evt.id);
      return 1;
    }
  },
  {
    id: 'wonderer',
    title: "A small good-wonderer",
    desc: "Tap ten different *Question Stones* across the world.",
    target: 10, reward: 18,
    matches: function (evt) {
      if (evt.type !== 'hotspot-clicked') return 0;
      if (evt.hotspotType !== 'reactor' || evt.speaker) return 0;
      const seen = ensureSet(this);
      if (seen.has(evt.id)) return 0;
      seen.add(evt.id);
      return 1;
    }
  },
  {
    id: 'friend-list',
    title: "Hello to *everyone*",
    desc: "Say hello to twelve different friends. (One tap each.)",
    target: 12, reward: 16,
    matches: function (evt) {
      if (evt.type !== 'hotspot-clicked') return 0;
      // Speakers that look like a peep_ or animal_ are friends.
      if (!evt.speaker) return 0;
      if (!/^(peep_|animal_)/.test(evt.speaker)) return 0;
      const seen = ensureSet(this);
      if (seen.has(evt.speaker)) return 0;
      seen.add(evt.speaker);
      return 1;
    }
  },
  {
    id: 'tap-a-hundred',
    title: "*Tap, tap, tap.* (×100.)",
    desc: "Tap a hundred things in the world.",
    target: 100, reward: 22,
    matches: (evt) => (evt.type === 'hotspot-clicked' ? 1 : 0)
  },
  {
    id: 'philosopher',
    title: "A small *thinker*",
    desc: "Tap five different philosophy hotspots (the wondering kind).",
    target: 5, reward: 10,
    matches: function (evt) {
      if (evt.type !== 'hotspot-clicked') return 0;
      if (evt.theme !== 'philosophy') return 0;
      const seen = ensureSet(this);
      if (seen.has(evt.id)) return 0;
      seen.add(evt.id);
      return 1;
    }
  },
  {
    id: 'naturalist',
    title: "A small *naturalist*",
    desc: "Find six animal-themed lines.",
    target: 6, reward: 10,
    matches: function (evt) {
      if (evt.type !== 'hotspot-clicked') return 0;
      if (evt.theme !== 'animals') return 0;
      const seen = ensureSet(this);
      if (seen.has(evt.id)) return 0;
      seen.add(evt.id);
      return 1;
    }
  },
  {
    id: 'budding-scientist',
    title: "A small *scientist*",
    desc: "Find six science-themed lines.",
    target: 6, reward: 10,
    matches: function (evt) {
      if (evt.type !== 'hotspot-clicked') return 0;
      if (evt.theme !== 'science') return 0;
      const seen = ensureSet(this);
      if (seen.has(evt.id)) return 0;
      seen.add(evt.id);
      return 1;
    }
  },
  {
    id: 'language-friend',
    title: "Words like *small bells*",
    desc: "Find six language-themed lines.",
    target: 6, reward: 10,
    matches: function (evt) {
      if (evt.type !== 'hotspot-clicked') return 0;
      if (evt.theme !== 'language') return 0;
      const seen = ensureSet(this);
      if (seen.has(evt.id)) return 0;
      seen.add(evt.id);
      return 1;
    }
  },

  // ─────────────────── dodgy weird ones ───────────────────
  {
    id: 'big-thinker',
    title: "Five rounds of \"hmm.\"",
    desc: "Take five portals. (Walking thinks for you, mostly.)",
    target: 5, reward: 9,
    matches: (evt) => (evt.type === 'scene-visited' && !evt.firstScene ? 1 : 0)
  },
  {
    id: 'scholar-and-stones',
    title: "A *scholarly* hoard",
    desc: "Hold 100 stones AND find the microscope.",
    target: 1, reward: 12,
    matches: function (evt) {
      // We need both conditions met. We track them via a hidden state.
      if (!this._state) this._state = { hasMicroscope: false, hasHundred: false };
      if (evt.type === 'thing-collected' && evt.key === 'thing_microscope') this._state.hasMicroscope = true;
      if (evt.type === 'gem-collected' && evt.gemTotal >= 100) this._state.hasHundred = true;
      return (this._state.hasMicroscope && this._state.hasHundred) ? 1 : 0;
    }
  },
  {
    id: 'evening-quiet',
    title: "Hush, then.",
    desc: "Step into the cottage, where things are quiet.",
    target: 1, reward: 4,
    matches: (evt) => (evt.type === 'scene-visited' && evt.slug === 'cosy-cottage-interior' ? 1 : 0)
  },
  {
    id: 'morning-bright',
    title: "Off into the bright.",
    desc: "Step out onto the lake one fine morning.",
    target: 1, reward: 4,
    matches: (evt) => (evt.type === 'scene-visited' && evt.slug === 'mountain-lake-childlike' ? 1 : 0)
  }
];

export class QuestManager {
  constructor({ saveGame = null } = {}) {
    /** Map<questId, { progress, completed, claimed, def }> */
    this.state = new Map();
    for (const def of QUEST_DEFS) {
      this.state.set(def.id, { progress: 0, completed: false, claimed: false, def });
    }
    this._listeners = new Set();
    this._sceneCount = 0;
    this._saveGame = saveGame;

    // Hydrate completed flags from save. We deliberately *don't*
    // persist progress, so a fresh launch starts fresh — except for
    // the binary "this quest is done" flag. Means a kid who's already
    // earned "first gem" doesn't see the celebration twice on reload.
    // Quests that are completed are also pre-claimed (the gems were
    // already credited last session).
    if (saveGame) {
      for (const id of saveGame.getQuestsCompleted()) {
        const entry = this.state.get(id);
        if (entry) {
          entry.completed = true;
          entry.claimed = true;
          entry.progress = entry.def.target;
        }
      }
    }
  }

  /**
   * Game systems call this with an event. Each quest's `matches`
   * predicate decides if/how much to advance.
   *
   * @param {object} evt
   * @param {'gem-collected'|'thing-collected'|'quiz-correct'|'scene-visited'|'rocket-launched'|'hotspot-clicked'} evt.type
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
    if (newlyCompleted.length) this._persist();
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

  _persist() {
    if (!this._saveGame) return;
    const completedIds = [];
    for (const entry of this.state.values()) {
      if (entry.completed) completedIds.push(entry.def.id);
    }
    this._saveGame.setQuestsCompleted(completedIds);
  }
}

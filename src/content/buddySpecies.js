/**
 * Buddy species — the five starting buddies for the Pokémon-style
 * combat system.
 *
 * Each species is immutable data: base stats, type, three moves,
 * and a small bio that flavours the battle log.
 *
 * Level scaling (applied per-instance at battle start, see
 * BuddyTeam.makeBattleParticipant):
 *   maxHP     = base.hp  + level * 3
 *   atk       = base.atk + level * 0.6
 *   def       = base.def + level * 0.4
 *   spd       = base.spd + level * 0.3
 *   maxEnergy = 8 + floor(level / 2)
 *
 * Moves shape:
 *   {
 *     id, name, type, power, energyCost, accuracy,
 *     effect?: { kind: 'heal'|'energy', amount: number },
 *     fx: 'basic'|'heavy'|'heal'
 *   }
 *
 * Move-balance guidelines:
 *   - basic (always available) ~ power 7-9,  energy 0,    acc 0.95
 *   - heavy hit                 ~ power 14-16, energy 4-5, acc 0.80
 *   - utility                   ~ heal 8-12 OR restore 3-4 energy, energy 1-2
 *
 * The 0-energy basic move is intentional: it means buddies can
 * ALWAYS swing at each other, even if the kid burns through energy
 * on heavy hits. No more "we both ran out and now we're stuck"
 * stalemates. Heavy moves still feel valuable because they hit
 * roughly twice as hard.
 */

export const buddySpecies = {
  // ============================================================
  conaloo: {
    id: 'conaloo',
    sprite: 'animal_Conaloo_bear-butterly',
    displayName: 'Conaloo',
    type: 'nature',
    base: { hp: 32, atk: 8, def: 9, spd: 7 },
    bio: 'Half bear, half butterly. Warm. Wandering. Mostly honey.',
    moves: [
      {
        id: 'paw-tap',
        name: 'Paw-tap',
        type: 'nature',
        power: 8,
        energyCost: 0,
        accuracy: 0.95,
        fx: 'basic'
      },
      {
        id: 'honey-hug',
        name: 'Honey-hug',
        type: 'nature',
        power: 15,
        energyCost: 4,
        accuracy: 0.85,
        fx: 'heavy'
      },
      {
        id: 'hum-a-bit',
        name: 'Hum-a-bit',
        type: 'nature',
        power: 0,
        energyCost: 2,
        accuracy: 1.0,
        effect: { kind: 'heal', amount: 10 },
        fx: 'heal'
      }
    ]
  },

  // ============================================================
  monaloo: {
    id: 'monaloo',
    sprite: 'animal_Monaloo_butterfly',
    displayName: 'Monaloo',
    type: 'wind',
    base: { hp: 22, atk: 7, def: 5, spd: 14 },
    bio: 'Light, two-line thoughts. Tastes with her feet.',
    moves: [
      {
        id: 'wing-flick',
        name: 'Wing-flick',
        type: 'wind',
        power: 7,
        energyCost: 0,
        accuracy: 0.95,
        fx: 'basic'
      },
      {
        id: 'gust',
        name: 'Gust',
        type: 'wind',
        power: 15,
        energyCost: 4,
        accuracy: 0.85,
        fx: 'heavy'
      },
      {
        id: 'flutter-on',
        name: 'Flutter-on',
        type: 'wind',
        power: 0,
        energyCost: 1,
        accuracy: 1.0,
        effect: { kind: 'energy', amount: 4 },
        fx: 'heal'
      }
    ]
  },

  // ============================================================
  umi: {
    id: 'umi',
    sprite: 'animal_Umi_jelly-fish',
    displayName: 'Umi',
    type: 'water',
    base: { hp: 28, atk: 7, def: 11, spd: 8 },
    bio: 'A jellyfish, mostly water and bother. Soft. Patient.',
    moves: [
      {
        id: 'sting',
        name: 'Sting',
        type: 'water',
        power: 8,
        energyCost: 0,
        accuracy: 0.95,
        fx: 'basic'
      },
      {
        id: 'rinse',
        name: 'Rinse',
        type: 'water',
        power: 16,
        energyCost: 5,
        accuracy: 0.85,
        fx: 'heavy'
      },
      {
        id: 'drift',
        name: 'Drift',
        type: 'water',
        power: 0,
        energyCost: 2,
        accuracy: 1.0,
        effect: { kind: 'heal', amount: 9 },
        fx: 'heal'
      }
    ]
  },

  // ============================================================
  seesa: {
    id: 'seesa',
    sprite: 'animal_Seesa_pink-bee',
    displayName: 'Seesa',
    type: 'sweet',
    base: { hp: 24, atk: 10, def: 5, spd: 13 },
    bio: 'PINK and FAST. Buzzes. Knows which flower is best today.',
    moves: [
      {
        id: 'buzz-jab',
        name: 'Buzz-jab',
        type: 'sweet',
        power: 7,
        energyCost: 0,
        accuracy: 0.95,
        fx: 'basic'
      },
      {
        id: 'pollen-puff',
        name: 'Pollen-puff',
        type: 'sweet',
        power: 14,
        energyCost: 4,
        accuracy: 0.85,
        fx: 'heavy'
      },
      {
        id: 'sip-nectar',
        name: 'Sip-nectar',
        type: 'sweet',
        power: 0,
        energyCost: 2,
        accuracy: 1.0,
        effect: { kind: 'heal', amount: 8 },
        fx: 'heal'
      }
    ]
  },

  // ============================================================
  pepsi: {
    id: 'pepsi',
    sprite: 'animal_Pepsi_dog-thing',
    displayName: 'Pepsi',
    type: 'heart',
    base: { hp: 30, atk: 9, def: 10, spd: 8 },
    bio: 'A dog-thing. Sticks. Boofs. Knows the size of your sadness.',
    moves: [
      {
        id: 'nuzzle',
        name: 'Nuzzle',
        type: 'heart',
        power: 8,
        energyCost: 0,
        accuracy: 0.95,
        fx: 'basic'
      },
      {
        id: 'big-boof',
        name: 'Big-boof',
        type: 'heart',
        power: 16,
        energyCost: 5,
        accuracy: 0.85,
        fx: 'heavy'
      },
      {
        id: 'good-sit',
        name: 'Good-sit',
        type: 'heart',
        power: 0,
        energyCost: 2,
        accuracy: 1.0,
        effect: { kind: 'heal', amount: 10 },
        fx: 'heal'
      }
    ]
  }
};

/** Lookup helper. Returns null if the id is unknown. */
export function getSpecies(id) {
  return buddySpecies[id] || null;
}

/** Compute level-scaled stats for a buddy instance. */
export function computeStats(speciesId, level) {
  const species = buddySpecies[speciesId];
  if (!species) return null;
  const base = species.base;
  const lv = Math.max(1, level);
  return {
    maxHP:     Math.round(base.hp + lv * 3),
    atk:       base.atk + lv * 0.6,
    def:       base.def + lv * 0.4,
    spd:       base.spd + lv * 0.3,
    maxEnergy: 8 + Math.floor(lv / 2)
  };
}

/** EXP needed to reach the *next* level from `level`.
 *  L1→L2 = 30; L2→L3 = 70; L3→L4 = 130; quadratic-ish. */
export function expForNextLevel(level) {
  const lv = Math.max(1, level);
  return 30 + 40 * (lv - 1) + 10 * (lv - 1) * (lv - 1);
}

/** EXP a defeated opponent grants. */
export function expReward(opponentLevel) {
  return 20 * Math.max(1, opponentLevel);
}

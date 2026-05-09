/**
 * Per-character (and per-hotspot-type) SFX pools.
 *
 * On each character click, HotspotManager picks one SFX uniformly from
 * the character's pool (so the same character doesn't always make the
 * same sound). Pools are tuned to the character's voice — e.g. Pepsi
 * gets short barky things, Wawoo gets airy mechanical things, Conaloo
 * gets warm chime-y things.
 *
 * Fall-through pools (`portal`, `thing`, `narrator`, `default`) are
 * used when the hotspot doesn't have a speaker-specific entry.
 */

export const characterSfx = {
  // Humans
  'peep_Amelia_F_4':            ['sfx_pop', 'sfx_twinkle', 'sfx_chime'],
  'peep_Poona_F_4':             ['sfx_pop', 'sfx_celebrate', 'sfx_voice_yip'],
  'peep_Cosenae_M_5':           ['sfx_pop', 'sfx_coin', 'sfx_powerup'],
  'peep_Lulumi_F_14':           ['sfx_chime', 'sfx_twinkle', 'sfx_pop'],
  'peep_Keefa_M_25':            ['sfx_chime', 'sfx_descend', 'sfx_twinkle'],
  'peep_mommy_F_30ish':         ['sfx_chime', 'sfx_pop', 'sfx_voice_soft'],
  'peep_daddy_M_30ish':         ['sfx_pop', 'sfx_chime', 'sfx_thud'],

  // Plant-folk + robo-folk
  'peep_Loosa_cactus':          ['sfx_descend', 'sfx_pop'],
  'peep_Tootsie_friendly-cactus': ['sfx_celebrate', 'sfx_pop', 'sfx_voice_yip'],
  'peep_Wawoo_robo-snowman':    ['sfx_swoosh', 'sfx_descend', 'sfx_powerup'],
  'peep_Konessa_has-flower':    ['sfx_twinkle', 'sfx_chime'],

  // Animals
  'animal_Conaloo_bear-butterly':       ['sfx_chime', 'sfx_twinkle', 'sfx_descend'],
  'animal_Monaloo_butterfly':           ['sfx_twinkle', 'sfx_chime'],
  'animal_Cofeenie_Queen-of-Rabbits-Twin': ['sfx_pop', 'sfx_celebrate', 'sfx_chime'],
  'animal_Lucy_Queen-of-Rabbits-Twin':  ['sfx_chime', 'sfx_pop', 'sfx_twinkle'],
  'animal_Pepsi_dog-thing':             ['sfx_voice_yip', 'sfx_pop', 'sfx_thud'],
  'animal_Seesa_pink-bee':              ['sfx_voice_yip', 'sfx_pop', 'sfx_celebrate'],

  // Things — referenced when a thing is the speaker (Tiny Museum tag)
  'thing_birthday-cake-with-one-candle': ['sfx_celebrate', 'sfx_jackpot', 'sfx_chime'],
  'thing_rocketship':           ['sfx_powerup', 'sfx_swoosh', 'sfx_whistle']
};

/** Pools used when no character-specific entry matches. */
export const defaultPools = {
  portal:   ['sfx_swoosh', 'sfx_step'],
  thing:    ['sfx_pop', 'sfx_coin', 'sfx_chime'],
  narrator: ['sfx_chime', 'sfx_twinkle', 'sfx_descend'],
  default:  ['sfx_pop', 'sfx_chime']
};

/**
 * Pick a SFX key for a hotspot click.
 *   speaker      — the hotspot.speaker (character/thing key) if any
 *   hotspotType  — 'portal' | 'reactor' | etc
 *   responseSfx  — explicit sfx on the response (rare; takes priority)
 */
export function pickClickSfx(speaker, hotspotType, responseSfx) {
  if (responseSfx) return responseSfx;
  if (speaker && characterSfx[speaker]) return pickRandom(characterSfx[speaker]);
  if (hotspotType && defaultPools[hotspotType]) return pickRandom(defaultPools[hotspotType]);
  return pickRandom(defaultPools.default);
}

function pickRandom(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Audio aliases.
 *
 * Scenes reference SFX/music with friendly names like 'sfx_pop', 'sfx_chime',
 * 'music_calm', 'music_curious'. The actual files dropped into /assets/ have
 * long descriptive names (Epidemic Sound titles, named music tracks).
 *
 * This map lets scenes keep using friendly names while AudioManager resolves
 * them to whatever file is actually present in the manifest. If a friendly
 * name has no alias here, AudioManager falls back to looking up the literal
 * key in Phaser's audio cache.
 *
 * To wire a new file, add an entry whose KEY is the friendly alias used in
 * scenes.js and whose VALUE is the asset key (filename without extension)
 * from /assets/.
 */

export const audioAliases = {
  // ---- music ----
  // Friendly tone alias  →  actual filename stem
  'music_calm':     'music_Sunlight_on_the_Garden_Path',
  'music_curious':  'music_Nose_Cone_Waltz',
  'music_silly':    'music_Button_Mash_Sunshine',
  'music_lullaby':  'music_Seven_Clocks_And_One_Key',
  'music_journey':  'music_Across_The_Threshold',
  'music_quick':    'music_Quick_Pick_Up',
  'music_skyward':  'music_Skyward_Bound_Sprint',

  // ---- sfx ----
  // Tiny library of friendly SFX names. Scenes use these; we map to whatever
  // long-named file is present in /assets/.
  'sfx_pop':       'sfx_ES_Cartoon, Misc, Funny Toy Sound - Epidemic Sound',
  'sfx_step':      'sfx_ES_Swooshes, Whoosh, Watery, Fizzy, Bubbly, Slow - Epidemic Sound',
  'sfx_swoosh':    'sfx_ES_Swooshes, Whoosh, Water, Wave, Surge, Cinematic 01 - Epidemic Sound',
  'sfx_chime':     'sfx_ES_Magic, Shimmer, Christmas, Chimes, Sparkle, Magic, Shimmer Dust 03 - Epidemic Sound',
  'sfx_twinkle':   'sfx_ES_Magic, Shimmer, Wand, Ping, Twinkle, Sweet - Epidemic Sound',
  'sfx_descend':   'sfx_ES_Magic, Shimmer, Classic Descending, Bright, Cartoonish 02 - Epidemic Sound',
  'sfx_spell':     'sfx_ES_Magic, Spell, Cast, Strike, Short, Shoot, Wizard, Video Game, Anime - Epidemic Sound',
  'sfx_powerup':   'sfx_ES_Designed, Misc, Anime, Power Up, Charge, Shing 06 - Epidemic Sound',
  'sfx_jackpot':   'sfx_ES_Games, Casino, Gambling, Machine, Jackpot, Win, Melody, Coin - Epidemic Sound',
  'sfx_coin':      'sfx_ES_Games, Video, Retro, 8 Bit, Coin Pick Up, Collect - Epidemic Sound',
  'sfx_magic':     'sfx_ES_Games, Video, Cartoon Magic, Anime 02 - Epidemic Sound',
  'sfx_celebrate': 'sfx_ES_Horns, Celebration, Party Blower Happy - Epidemic Sound',
  'sfx_honk':      'sfx_ES_Cartoon, Horn, Clown, Comical, Honk - Epidemic Sound',
  'sfx_airhorn':   'sfx_ES_Musical, Misc, Air Horn, Dancehall Style, Meme - Epidemic Sound',
  'sfx_thud':      'sfx_ES_Cartoon, Impact, Thud, Anvil Hit, Goofy, Meme Redesign - Epidemic Sound',
  'sfx_punch':     'sfx_ES_Cartoon, Impact, Anime Punch, Powerful, Hit, Fight, Meme Redesign - Epidemic Sound',
  'sfx_whistle':   'sfx_ES_Cartoon, Whistle, Bomb Fall Whistle Reverb - Epidemic Sound',
  'sfx_fail':      'sfx_ES_Musical, Brass, Tuba, Sloppy, Fail, Meme Redesign - Epidemic Sound',
  'sfx_voice_soft':'sfx_ES_Voices, Female, Anime, Fairy Fighter Exhale 01 - Epidemic Sound',
  'sfx_voice_yip': 'sfx_ES_Voices, Female, Type 01, High Pitched, Attack, Combat, Video Game, Anime 03 - Epidemic Sound',
  'sfx_silly':     'sfx_ES_Farts, Designed, Very Reverberant, Short, Meme Redesign - Epidemic Sound'
};

/**
 * Resolve a friendly key into an actual asset key. Falls through if no alias
 * exists — the caller will look up the literal in the audio cache.
 */
export function resolveAudio(key) {
  return audioAliases[key] || key;
}

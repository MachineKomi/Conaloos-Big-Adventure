/**
 * Hand-authored scene definitions.
 *
 * Each key is a slug that matches a `bg_${slug}` background filename.
 * See /docs/scenes/{slug}.md for design notes per scene.
 *
 * Schema: see SPEC.md §3.
 */

import { characters as bios } from './characters.js';
import { themedLines, genericLines, portalLines } from './lines.js';

/** Build a hotspot whose responses are pulled from a character's bio lines.
 *  All bio lines go into the response pool — HotspotManager exhausts the
 *  whole pool (in shuffled order) before any line repeats.
 *
 *  IMPORTANT: we do NOT bake `sfx` into responses any more — the
 *  HotspotManager picks from the speaker's per-character pool defined
 *  in `src/content/sfxPools.js`, so each character's clicks vary. The
 *  v1.2 version baked sfx='sfx_pop' here which always overrode the
 *  pool — every character ended up making the same sound. */
function characterHotspot(id, character, bounds, opts = {}) {
  const lines = bios[character]?.lines || genericLines.character;
  const responses = lines.map((text) => ({
    text,
    speaker: character,
    theme: opts.theme
  }));
  return {
    id,
    type: 'reactor',
    cursor: 'sparkle',
    speaker: character,
    bounds,
    rewardGemChance: opts.rewardGemChance ?? 0.45,
    responses
  };
}

/** Build a Question Stone hotspot — different open-ended question on each click. */
function questionStone(id, bounds, questions, theme = 'philosophy') {
  return {
    id,
    type: 'reactor',
    cursor: 'sparkle',
    bounds,
    // No sfx field — let HotspotManager pick from the narrator pool.
    responses: questions.map((text) => ({ text, theme }))
  };
}

/** Build a Tiny Museum hotspot — facts that build on each other. */
function tinyMuseum(id, bounds, facts, theme) {
  return {
    id,
    type: 'reactor',
    cursor: 'sparkle',
    bounds,
    responses: facts.map((text) => ({ text, theme }))
  };
}

/**
 * Build a portal hotspot — a visible sprite the child can click to travel
 * to another scene. The sprite IS the click target; bounds are derived
 * from the sprite's display rectangle at render time.
 *
 * @param {string} id
 * @param {string} target            destination scene slug
 * @param {object} opts
 * @param {string} opts.sprite       portal_* asset key
 * @param {number} opts.x            normalized 0..1
 * @param {number} opts.y            normalized 0..1 (sprite anchored bottom-centre)
 * @param {number} [opts.heightFrac=0.30]   target display height as fraction of scene
 * @param {'left'|'right'|'top'|'bottom'} opts.enterEdge
 *        Which edge of the destination Amelia walks in from when she arrives.
 */
function portal(id, target, opts) {
  const heightFrac = opts.heightFrac ?? 0.30;
  // Provide bounds as a fallback hit area; the GameScene will replace with the
  // actual sprite display rect when rendering.
  const halfW = 0.07;
  const halfH = heightFrac * 0.5;
  return {
    id,
    type: 'portal',
    cursor: 'walk',
    target,
    sprite: opts.sprite,
    x: opts.x,
    y: opts.y,
    heightFrac,
    enterEdge: opts.enterEdge,
    label: opts.label || null,
    bounds: {
      x: opts.x - halfW,
      y: opts.y - heightFrac,
      w: halfW * 2,
      h: heightFrac
    },
    // No popup before transition — the walk + fade is the reward.
    responses: []
  };
}

// ---------------------------------------------------------------------------

export const scenes = {
  // -------- HUB --------
  'sunny-rocket-garden': {
    background: 'bg_sunny-rocket-garden',
    music: 'music_curious',
    ambient_sfx: [],
    themes: ['science', 'philosophy', 'language', 'animals'],
    characters: [
      { sprite: 'animal_Conaloo_bear-butterly', x: 0.50, y: 0.95, heightFrac: 0.50, idle: 'sway' },
      { sprite: 'peep_Amelia_F_4',              x: 0.22, y: 0.95, heightFrac: 0.55, idle: 'sway' },
      { sprite: 'peep_Cosenae_M_5',             x: 0.78, y: 0.95, heightFrac: 0.55, idle: 'bob'  },
      { sprite: 'animal_Seesa_pink-bee',        x: 0.85, y: 0.30, heightFrac: 0.10, idle: 'bob'  },
      { sprite: 'animal_Monaloo_butterfly',     x: 0.42, y: 0.55, heightFrac: 0.10, idle: 'bob'  },
      { sprite: 'animal_Pepsi_dog-thing',       x: 0.10, y: 0.96, heightFrac: 0.30, idle: 'sway' }
    ],
    things: [
      { sprite: 'thing_rocketship', x: 0.66, y: 0.85, heightFrac: 0.45 },
      { sprite: 'thing_banana',     x: 0.45, y: 0.92, heightFrac: 0.10 },
      { sprite: 'thing_teddybear',  x: 0.92, y: 0.95, heightFrac: 0.18 }
    ],
    hotspots: [
      characterHotspot('conaloo', 'animal_Conaloo_bear-butterly',
        { x: 0.42, y: 0.55, w: 0.16, h: 0.40 },
        { theme: 'philosophy' }),

      characterHotspot('amelia', 'peep_Amelia_F_4',
        { x: 0.14, y: 0.55, w: 0.16, h: 0.40 },
        { theme: 'language' }),

      characterHotspot('cosenae', 'peep_Cosenae_M_5',
        { x: 0.70, y: 0.55, w: 0.16, h: 0.40 },
        { theme: 'science' }),

      characterHotspot('seesa', 'animal_Seesa_pink-bee',
        { x: 0.78, y: 0.22, w: 0.14, h: 0.16 },
        { theme: 'animals' }),

      characterHotspot('pepsi', 'animal_Pepsi_dog-thing',
        { x: 0.04, y: 0.78, w: 0.16, h: 0.20 },
        { theme: 'emotions' }),

      characterHotspot('monaloo', 'animal_Monaloo_butterfly',
        { x: 0.36, y: 0.48, w: 0.14, h: 0.14 },
        { theme: 'animals' }),

      // Rocketship: ALWAYS launches on first tap, no walk-up, no
      // dialogue. The launch IS the response.
      // - `instant: true` skips the walk-up so the kid taps and
      //   the rocket goes — feels right.
      // - `priority: 'high'` makes the zone win click-overlap
      //   against neighbouring character zones (Conaloo, Cosenae)
      //   even though the sprite renders visually behind them.
      // - Bounds cover the rocket body so any tap on it lands.
      {
        id: 'rocketship',
        type: 'reactor',
        cursor: 'sparkle',
        instant: true,
        priority: 'high',
        bounds: { x: 0.56, y: 0.42, w: 0.20, h: 0.43 },
        speaker: 'thing_rocketship',
        rewardGemChance: 0,
        responses: []
      },

      tinyMuseum('countdown',
        { x: 0.50, y: 0.20, w: 0.16, h: 0.18 },
        [
          "*Five! Four! Three! Two! One!* -- and the rocket would go.\nA countdown's *backwards*. Did you know? Did you know?",
          "Why *backwards*? Because *zero* is the moment of *go*.\nSo we count *toward* the zero, all small in a row.",
          "Five fingers. Four toes-on-a-paw. Three small bears.\nTwo eyes-on-a-Conaloo. One *nose*. (Then up there.)",
          "Counting *backwards* is harder than counting up forward.\nIt's the brain doing pull-ups -- not running, just *toward*."
        ],
        'numbers'),

      {
        id: 'hub-teddy', type: 'reactor', cursor: 'sparkle',
        bounds: { x: 0.86, y: 0.80, w: 0.12, h: 0.18 },
        speaker: 'thing_teddybear',
        collect: 'thing_teddybear',
        responses: [
          { text: "A teddy left out, in the rocket's broad shadow --\nhe'd come to watch lift-off. He's *almost* ready, though.", theme: 'emotions' }
        ]
      },

      tinyMuseum('trade',
        { x: 0.30, y: 0.78, w: 0.10, h: 0.12 },
        [
          "A *trade* is a swap of one thing for another --\na pebble for peach, or a pear from your brother.",
          "The trick about trading? Both people should *gain*.\nIf one of you doesn't, the trade is in *vain*.",
          "Sometimes the best trade is *nothing for nothing* --\nwhich means: 'keep your peach. You're already *something*.'",
          "Long, long ago, before *money* was made,\npeople just *bartered*: a pot for a spade."
        ],
        'economics'),

      {
        id: 'banana-hub', type: 'reactor', cursor: 'sparkle',
        bounds: { x: 0.40, y: 0.80, w: 0.12, h: 0.16 },
        speaker: 'thing_banana',
        collect: 'thing_banana',
        responses: [
          { text: "Cosenae mislaid a banana, today --\na yellow surprise on his after-lunch way.", theme: 'language' }
        ]
      },

      questionStone('sun',
        { x: 0.10, y: 0.04, w: 0.20, h: 0.20 },
        [
          "The sun is a *star*. (Did you know? It's quite true.)\nA terribly-far-away friend, looking at you.",
          "Hold up your hand -- you can *blot out* the sun.\nWhich means hands are *bigger*. (Well, sort of. Sort-of-one.)",
          "The sunlight that lands here took *eight whole minutes* --\nso the sun you see *now* is the *sun-from-eight-minutes-ago*-ed."
        ],
        'science'),

      portal('to-cottage', 'cosy-cottage-interior', {
        sprite: 'portal_heart_door',     x: 0.05, y: 0.62, heightFrac: 0.28,
        enterEdge: 'right',        label: 'home'
      }),

      portal('to-lake', 'mountain-lake-childlike', {
        sprite: 'portal_magic_swirl', x: 0.97, y: 0.62, heightFrac: 0.28,
        enterEdge: 'left',         label: 'the lake'
      }),

      portal('to-playground', 'fantasy-garden-playground', {
        sprite: 'portal_magic_flower_door',   x: 0.32, y: 0.97, heightFrac: 0.26,
        enterEdge: 'top',          label: 'the playground'
      })
    ],
    gems: [
      { key: 'gem_1', x: 0.06, y: 0.16 },
      { key: 'gem_4', x: 0.38, y: 0.20 },
      { key: 'gem_6', x: 0.55, y: 0.40 },
      { key: 'gem_8', x: 0.82, y: 0.22 },
      { key: 'gem_5', x: 0.94, y: 0.10 }
    ],
    // Cosenae has his pink bee Seesa with him. Tapping the chip
    // starts a buddy battle.
    challenges: [
      {
        id: 'cosenae-vs-seesa',
        npc: 'peep_Cosenae_M_5',
        buddySpeciesId: 'seesa',
        buddyLevel: 1,
        x: 0.86, y: 0.55,
        label: "Cosenae's bee"
      }
    ]
  },

  // -------- HOME INTERIOR --------
  'cosy-cottage-interior': {
    background: 'bg_cosy-cottage-interior',
    music: 'music_lullaby',
    ambient_sfx: [],
    themes: ['emotions', 'culture-history', 'art-history'],
    characters: [
      { sprite: 'peep_mommy_F_30ish',   x: 0.25, y: 0.95, heightFrac: 0.65, idle: 'sway' },
      { sprite: 'peep_daddy_M_30ish',   x: 0.75, y: 0.95, heightFrac: 0.65, idle: 'sway' },
      { sprite: 'animal_Pepsi_dog-thing', x: 0.50, y: 0.97, heightFrac: 0.28, idle: 'bob' }
    ],
    things: [
      { sprite: 'thing_books',     x: 0.42, y: 0.93, heightFrac: 0.12 },
      { sprite: 'thing_teddybear', x: 0.58, y: 0.93, heightFrac: 0.16 }
    ],
    hotspots: [
      characterHotspot('mommy', 'peep_mommy_F_30ish',
        { x: 0.16, y: 0.40, w: 0.20, h: 0.55 },
        { theme: 'art-history' }),

      characterHotspot('daddy', 'peep_daddy_M_30ish',
        { x: 0.66, y: 0.40, w: 0.20, h: 0.55 },
        { theme: 'emotions' }),

      characterHotspot('pepsi', 'animal_Pepsi_dog-thing',
        { x: 0.42, y: 0.78, w: 0.18, h: 0.20 },
        { theme: 'emotions' }),

      {
        id: 'cottage-books', type: 'reactor', cursor: 'sparkle',
        bounds: { x: 0.38, y: 0.83, w: 0.10, h: 0.12 },
        speaker: 'thing_books',
        collect: 'thing_books',
        responses: [
          { text: "A book on the table, half-read and half-marked --\nThe story is paused (but it'll come back, embarked).", theme: 'language' }
        ]
      },

      {
        id: 'cottage-teddy', type: 'reactor', cursor: 'sparkle',
        bounds: { x: 0.54, y: 0.81, w: 0.10, h: 0.14 },
        speaker: 'thing_teddybear',
        collect: 'thing_teddybear',
        responses: [
          { text: "A teddy left out on the rug at the door --\nHe waited for someone, and now waits for more.", theme: 'emotions' }
        ]
      },

      tinyMuseum('hearth',
        { x: 0.40, y: 0.20, w: 0.20, h: 0.40 },
        [
          "A *hearth* is a hole where we politely ask *fire*.\nIt warms a whole room and a half of a choir.",
          "Long ago, the hearth was the *heart* of a place --\na warm in the dark, and a light on a face.",
          "The smoke goes up through a hat in the roof --\nthat hat is a *chimney*. (That fact is the proof.)",
          "Stories are *told* by the fire's small glow.\nThey're warmer that way -- and listeners know."
        ],
        'culture-history'),

      questionStone('window',
        { x: 0.04, y: 0.10, w: 0.20, h: 0.30 },
        [
          "What's on the *other* side of a window, today?\nA bird? A whole forest? A field full of hay?",
          "Why is it that windows make *outside* more outside,\nand *inside* more inside? (Ah, you decide.)",
          "If a window remembered what passed through its glass --\nwould it tell you the *geese*, or the breath of the grass?",
          "Glass is a *liquid* that's frozen in place.\nIf you waited a thousand years, it'd droop in its face."
        ],
        'philosophy'),

      tinyMuseum('tea',
        { x: 0.30, y: 0.55, w: 0.10, h: 0.18 },
        [
          "A cup of warm tea, when it's *split* into two,\nis not halved at all -- it's *doubled*, with you.",
          "The recipe's simple: a leaf, and some heat,\na cup, and a moment, and someone to meet.",
          "*Enough* is a feeling -- it's quiet, and round.\nIt is not a *too-little*. It is not a *too-found*.",
          "Tea is a leaf that has gone for a swim.\nIt's worth waiting for. (And so are *thim*.)"
        ],
        'economics'),

      tinyMuseum('shelf',
        { x: 0.78, y: 0.30, w: 0.18, h: 0.30 },
        [
          "One book. Then *two* books. Then *three* books. Then *four*.\nThe shelf is a *list* you can hold -- nothing more.",
          "Sorting's just *putting the smalls before bigs*.\nIt works just as well for your toes as for figs.",
          "A *list* is a line of the things in a row --\nthen, if you fancy, *rearrange them*. (Just so.)",
          "Computers do this trick a *billion* times a second.\nWe call it a *sort*. (And nobody quite reckoned.)"
        ],
        'computer-science'),

      portal('to-garden', 'sunny-rocket-garden', {
        sprite: 'portal_magic_flower_door',     x: 0.05, y: 0.62, heightFrac: 0.32,
        enterEdge: 'left',         label: 'the garden'
      }),

      portal('to-bedroom', 'girls-bedroom', {
        sprite: 'portal_simple_heart_door', x: 0.95, y: 0.62, heightFrac: 0.32,
        enterEdge: 'left',         label: 'the bedroom'
      })
    ],
    gems: [
      { key: 'gem_3', x: 0.10, y: 0.28 },
      { key: 'gem_5', x: 0.92, y: 0.30 },
      { key: 'gem_2', x: 0.55, y: 0.18 },
      { key: 'gem_7', x: 0.30, y: 0.55 },
      { key: 'gem_8', x: 0.78, y: 0.62 }
    ],
    // Mommy's quietly competitive — Pepsi the dog-thing is "her"
    // buddy in this scene. (Pepsi sleeps in the cottage anyway,
    // so it fits.)
    challenges: [
      {
        id: 'mommy-vs-pepsi',
        npc: 'peep_mommy_F_30ish',
        buddySpeciesId: 'pepsi',
        buddyLevel: 3,
        x: 0.18, y: 0.40,
        label: "Mommy's good dog"
      }
    ]
  },

  // -------- LAKE (CHILDLIKE) --------
  'mountain-lake-childlike': {
    background: 'bg_mountain-lake-childlike',
    music: 'music_calm',
    ambient_sfx: [],
    themes: ['animals', 'science', 'philosophy'],
    characters: [
      { sprite: 'animal_Conaloo_bear-butterly', x: 0.50, y: 0.95, heightFrac: 0.42, idle: 'sway' },
      { sprite: 'animal_Lucy_Queen-of-Rabbits-Twin', x: 0.20, y: 0.96, heightFrac: 0.38, idle: 'bob' },
      { sprite: 'animal_Cofeenie_Queen-of-Rabbits-Twin', x: 0.80, y: 0.96, heightFrac: 0.38, idle: 'sway' }
    ],
    things: [
      { sprite: 'thing_bucket',  x: 0.34, y: 0.94, heightFrac: 0.16 },
      { sprite: 'thing_banana',  x: 0.62, y: 0.94, heightFrac: 0.10 }
    ],
    hotspots: [
      characterHotspot('conaloo', 'animal_Conaloo_bear-butterly',
        { x: 0.42, y: 0.55, w: 0.16, h: 0.40 },
        { theme: 'philosophy' }),

      characterHotspot('lucy', 'animal_Lucy_Queen-of-Rabbits-Twin',
        { x: 0.10, y: 0.62, w: 0.18, h: 0.36 },
        { theme: 'animals' }),

      characterHotspot('cofeenie', 'animal_Cofeenie_Queen-of-Rabbits-Twin',
        { x: 0.72, y: 0.62, w: 0.18, h: 0.36 },
        { theme: 'culture-history' }),

      {
        id: 'lake-bucket', type: 'reactor', cursor: 'sparkle',
        bounds: { x: 0.30, y: 0.82, w: 0.10, h: 0.14 },
        speaker: 'thing_bucket',
        collect: 'thing_bucket',
        responses: [
          { text: "A bucket by the lake -- a fine sort of haul.\nFor catching the small things that fall when they fall.", theme: 'science' }
        ]
      },

      {
        id: 'lake-banana', type: 'reactor', cursor: 'sparkle',
        bounds: { x: 0.58, y: 0.86, w: 0.10, h: 0.12 },
        speaker: 'thing_banana',
        collect: 'thing_banana',
        responses: [
          { text: "A banana left out on a lake-side stone --\nLucy says she didn't bring it. (No-one will own.)", theme: 'language' }
        ]
      },

      tinyMuseum('lake',
        { x: 0.20, y: 0.40, w: 0.60, h: 0.20 },
        [
          "A *lake* is a puddle that decided to *stay*.\nIt's gathered the rain of a long, long, long day.",
          "Still on the top -- but it's *busy* below,\nwith fishes and snail-folk and weeds in a row.",
          "It mirrors the mountains, the sky, and the trees.\nThe trick of a mirror is just standing at ease.",
          "A lake holds the colours of all that's around --\nthen hands them *right back*, when the wind isn't loud.",
          "The *deepest* lakes go down for a *kilometre*.\nThat's *one thousand metres* -- and then six and a metre."
        ],
        'science'),

      questionStone('mountain',
        { x: 0.05, y: 0.08, w: 0.40, h: 0.30 },
        [
          "How long has that mountain been *standing* up there?\nLonger than rabbits. Longer than care.",
          "If a mountain could *whisper*, what would it confide?\nThe weather of *years*? The *names* of the tide?",
          "What lives at the top of a mountain *that* high?\nA wind? A small shrew? A whole *house* of sky?",
          "Mountains *grow* (very slowly), each year by a *bit*.\nLike fingernails -- only with stone, in a fit."
        ],
        'philosophy'),

      tinyMuseum('pebbles',
        { x: 0.40, y: 0.78, w: 0.20, h: 0.18 },
        [
          "*One* pebble, *two* pebbles, *three* pebbles, *four*.\nAnd after that's done, you can ask for some more.",
          "*Five* pebbles, *six* pebbles, *seven*, then *eight*.\nThe pile of pebbles is starting to *weight*.",
          "A *number* is a name that we give to a *count* --\na way to say HOW MUCH, a way to say AMOUNT.",
          "And here's a small secret: there's *no biggest number*.\nThe numbers go on. (Past your bedtime, past slumber.)"
        ],
        'numbers'),

      portal('to-ice', 'ice-level', {
        sprite: 'portal_donut_portal',   x: 0.95, y: 0.40, heightFrac: 0.30,
        enterEdge: 'left',         label: 'up to the snow'
      }),

      portal('to-garden', 'sunny-rocket-garden', {
        sprite: 'portal_magic_flower_door', x: 0.04, y: 0.40, heightFrac: 0.28,
        enterEdge: 'right',        label: 'the garden'
      }),

      portal('to-waterfall', 'waterfall-mt-fuji-in-distance', {
        sprite: 'portal_magic_swirl', x: 0.50, y: 0.45, heightFrac: 0.20,
        enterEdge: 'left',         label: 'far away'
      })
    ],
    gems: [
      { key: 'gem_2', x: 0.08, y: 0.18 },
      { key: 'gem_6', x: 0.92, y: 0.78 },
      { key: 'gem_8', x: 0.40, y: 0.10 },
      { key: 'gem_5', x: 0.72, y: 0.20 },
      { key: 'gem_9', x: 0.78, y: 0.62 }
    ]
  },

  // -------- FANTASY GARDEN PLAYGROUND --------
  'fantasy-garden-playground': {
    background: 'bg_fantasy-garden-playground',
    music: 'music_silly',
    ambient_sfx: [],
    themes: ['animals', 'philosophy', 'emotions', 'language'],
    characters: [
      { sprite: 'peep_Loosa_cactus',              x: 0.16, y: 0.95, heightFrac: 0.55, idle: 'sway' },
      { sprite: 'peep_Tootsie_friendly-cactus',   x: 0.30, y: 0.95, heightFrac: 0.55, idle: 'sway' },
      { sprite: 'peep_Amelia_F_4',                x: 0.50, y: 0.95, heightFrac: 0.55, idle: 'bob'  },
      { sprite: 'peep_Poona_F_4',                 x: 0.62, y: 0.95, heightFrac: 0.55, idle: 'bob'  },
      { sprite: 'animal_Seesa_pink-bee',          x: 0.78, y: 0.32, heightFrac: 0.10, idle: 'bob'  }
    ],
    things: [
      { sprite: 'thing_colourful_tree_A',          x: 0.08, y: 0.85, heightFrac: 0.55 },
      { sprite: 'thing_colourful_tree_B',          x: 0.92, y: 0.85, heightFrac: 0.55 },
      { sprite: 'thing_birthday-cake-with-one-candle', x: 0.78, y: 0.92, heightFrac: 0.16 },
      // A second rocketship in the playground — there's a rocket in
      // the background art, so it fits. Launches when clicked
      // (special animation in GameScene). Re-renders fresh each visit.
      { sprite: 'thing_rocketship',                x: 0.46, y: 0.92, heightFrac: 0.36 }
    ],
    hotspots: [
      characterHotspot('loosa', 'peep_Loosa_cactus',
        { x: 0.10, y: 0.45, w: 0.18, h: 0.50 },
        { theme: 'philosophy' }),

      characterHotspot('tootsie', 'peep_Tootsie_friendly-cactus',
        { x: 0.26, y: 0.45, w: 0.18, h: 0.50 },
        { theme: 'emotions' }),

      characterHotspot('amelia', 'peep_Amelia_F_4',
        { x: 0.42, y: 0.50, w: 0.16, h: 0.45 },
        { theme: 'language' }),

      characterHotspot('poona', 'peep_Poona_F_4',
        { x: 0.54, y: 0.50, w: 0.16, h: 0.45 },
        { theme: 'language' }),

      characterHotspot('seesa', 'animal_Seesa_pink-bee',
        { x: 0.70, y: 0.24, w: 0.16, h: 0.16 },
        { theme: 'animals' }),

      // Playground rocket. The playground's character zones overlap
      // each other heavily, so `priority: 'high'` is the only clean
      // way to make sure the rocket wins clicks against Tootsie,
      // Amelia, and Poona standing around it. `instant: true` skips
      // the walk-up.
      {
        id: 'playground-rocket',
        type: 'reactor',
        cursor: 'sparkle',
        instant: true,
        priority: 'high',
        bounds: { x: 0.40, y: 0.55, w: 0.16, h: 0.38 },
        speaker: 'thing_rocketship',
        rewardGemChance: 0,
        responses: []
      },

      {
        id: 'cake',
        type: 'reactor',
        cursor: 'sparkle',
        bounds: { x: 0.72, y: 0.78, w: 0.14, h: 0.20 },
        speaker: 'thing_birthday-cake-with-one-candle',
        collect: 'thing_birthday-cake-with-one-candle',
        responses: [
          { text: "A cake is a thing for a *somebody's* day --\nA candle, a wish, and a 'hooray-and-yay.'", sfx: 'sfx_chime', theme: 'culture-history' },
          { text: "Take it along! Carry it gentle and slow --\nThe cake comes with you, wherever you go.", sfx: 'sfx_coin', theme: 'culture-history' },
          { text: "Different lands have a different cake --\nSome with no candles, some sweet, some opaque.", sfx: 'sfx_chime', theme: 'culture-history' },
          { text: "One candle means one of a year that is new.\nSo: somebody, somewhere, just turned into TWO.", sfx: 'sfx_chime', theme: 'numbers' }
        ]
      },

      tinyMuseum('tree-A',
        { x: 0.0, y: 0.30, w: 0.18, h: 0.55 },
        [
          "A tree, all in colours, is *mostly* a green --\nbut every leaf carries a *different* sheen.",
          "*Two* greens make a tree-green: a yellow and blue.\nThe trees know this trick. (Now you know it too.)",
          "Each leaf is a hand that the wind likes to shake.\nThe tree doesn't mind. The tree's *wide* awake.",
          "A leaf is a *factory*: in the back, sun is *eaten*\nand turned into food. (Plants, my friend, are quite *neat-en*.)"
        ],
        'art-history'),

      tinyMuseum('tree-B',
        { x: 0.82, y: 0.30, w: 0.18, h: 0.55 },
        [
          "*Tree* in some languages: arbre, baum, ki, ya.\nThe shape is the same -- but the *names* go quite far.",
          "A tree is so quiet it sounds like a *bell* --\nthe slow kind of bell that you ring just to *dwell*.",
          "It stands and it stands. And the standing's the *song*.\nWe're walking past trees that have stood -- oh, so long.",
          "Some trees are *older* than every grandparent stacked.\nA redwood remembers when *Romans* relaxed."
        ],
        'language'),

      portal('to-hub', 'sunny-rocket-garden', {
        sprite: 'portal_magic_flower_door',   x: 0.04, y: 0.55, heightFrac: 0.30,
        enterEdge: 'bottom',       label: 'the garden'
      }),

      portal('to-village', 'whimsical-villiage', {
        sprite: 'portal_heart_door',     x: 0.55, y: 0.10, heightFrac: 0.22,
        enterEdge: 'left',         label: 'the village'
      }),

      portal('to-school', 'school-courtyard', {
        sprite: 'portal_simple_heart_door', x: 0.95, y: 0.55, heightFrac: 0.32,
        enterEdge: 'left',         label: 'the school'
      })
    ],
    gems: [
      { key: 'gem_1', x: 0.06, y: 0.20 },
      { key: 'gem_4', x: 0.96, y: 0.18 },
      { key: 'gem_7', x: 0.40, y: 0.30 },
      { key: 'gem_5', x: 0.70, y: 0.40 },
      { key: 'gem_2', x: 0.55, y: 0.62 }
    ],
    // Loosa stands here patiently with his jellyfish Umi (who, like
    // him, takes his time). Tap the chip to challenge.
    challenges: [
      {
        id: 'loosa-vs-umi',
        npc: 'peep_Loosa_cactus',
        buddySpeciesId: 'umi',
        buddyLevel: 2,
        x: 0.13, y: 0.36,
        label: "Loosa's jellyfish"
      }
    ]
  },

  // -------- SEASIDE VILLAGE AT SUNSET --------
  'seaside-village-sunset': {
    background: 'bg_seaside-village-sunset',
    music: 'music_calm',
    ambient_sfx: [],
    themes: ['art-history', 'philosophy', 'language', 'science'],
    characters: [
      { sprite: 'peep_Keefa_M_25',                x: 0.50, y: 0.95, heightFrac: 0.60, idle: 'sway' },
      { sprite: 'peep_Konessa_has-flower',        x: 0.32, y: 0.95, heightFrac: 0.55, idle: 'sway' },
      { sprite: 'animal_Conaloo_bear-butterly',   x: 0.16, y: 0.94, heightFrac: 0.30, idle: 'sway' },
      { sprite: 'animal_Pepsi_dog-thing',         x: 0.85, y: 0.96, heightFrac: 0.22, idle: 'bob'  }
    ],
    things: [
      { sprite: 'thing_bucket',     x: 0.68, y: 0.94, heightFrac: 0.14 },
      { sprite: 'thing_flashlight', x: 0.78, y: 0.94, heightFrac: 0.12 }
    ],
    hotspots: [
      characterHotspot('keefa', 'peep_Keefa_M_25',
        { x: 0.44, y: 0.40, w: 0.16, h: 0.55 },
        { theme: 'language' }),

      characterHotspot('konessa', 'peep_Konessa_has-flower',
        { x: 0.26, y: 0.45, w: 0.16, h: 0.50 },
        { theme: 'art-history' }),

      {
        id: 'seaside-bucket', type: 'reactor', cursor: 'sparkle',
        bounds: { x: 0.62, y: 0.82, w: 0.12, h: 0.16 },
        speaker: 'thing_bucket',
        collect: 'thing_bucket',
        responses: [
          { text: "A bucket of seaside, full to the brim --\nFor minnows and shells and the salt-of-the-swim.", theme: 'science' }
        ]
      },

      {
        id: 'seaside-flashlight', type: 'reactor', cursor: 'sparkle',
        bounds: { x: 0.74, y: 0.86, w: 0.10, h: 0.12 },
        speaker: 'thing_flashlight',
        collect: 'thing_flashlight',
        responses: [
          { text: "A torch by the wall, for the dimming of light --\nKeefa says: 'Take it. The walk home is bright.'", theme: 'emotions' }
        ]
      },

      characterHotspot('conaloo', 'animal_Conaloo_bear-butterly',
        { x: 0.08, y: 0.70, w: 0.16, h: 0.28 },
        { theme: 'philosophy' }),

      characterHotspot('pepsi', 'animal_Pepsi_dog-thing',
        { x: 0.78, y: 0.78, w: 0.18, h: 0.20 },
        { theme: 'emotions' }),

      tinyMuseum('sunset',
        { x: 0.20, y: 0.05, w: 0.60, h: 0.25 },
        [
          "A sunset is light that has travelled all day --\nIt's tired, it's pinker, it's slowing its way.",
          "The blue gets all scattered when sun is so low --\nWhich leaves us the orange, and red, and the glow.",
          "Painters love sunset because it has *all* --\nThe colours arranged on a thin canvas wall.",
          "The trick of a sunset: it's never the same.\nEach evening's a one-of, with no proper name."
        ],
        'art-history'),

      tinyMuseum('waves',
        { x: 0.10, y: 0.78, w: 0.30, h: 0.18 },
        [
          "A wave is a story the water decides --\nIt rolls to the shore and then quietly hides.",
          "The moon -- you know -- pulls at the sea every day,\nWhich is why all the waves feel a need to obey.",
          "No wave ever comes in just twice, in the same.\nEach one is a one-of. (The sea doesn't claim.)"
        ],
        'science'),

      questionStone('seagull',
        { x: 0.55, y: 0.10, w: 0.20, h: 0.18 },
        [
          "What is a seagull saying, do you think?\nIs it a 'hello'? Or a 'bring me a drink'?",
          "Every gull-call is a conversation, perhaps --\nWith news of the fish, and the weather, and traps.",
          "If we wrote down the words for the sounds that they say --\nWe'd need a new alphabet just for the day."
        ],
        'language'),

      portal('to-waterfall', 'waterfall-mt-fuji-in-distance', {
        sprite: 'portal_magic_swirl', x: 0.05, y: 0.55, heightFrac: 0.28,
        enterEdge: 'right',        label: 'far away'
      }),

      portal('to-village', 'whimsical-villiage', {
        sprite: 'portal_heart_door',     x: 0.95, y: 0.55, heightFrac: 0.30,
        enterEdge: 'left',         label: 'the village'
      })
    ],
    gems: [
      { key: 'gem_3', x: 0.07, y: 0.16 },
      { key: 'gem_9', x: 0.95, y: 0.08 },
      { key: 'gem_5', x: 0.40, y: 0.70 },
      { key: 'gem_6', x: 0.30, y: 0.18 },
      { key: 'gem_8', x: 0.72, y: 0.78 }
    ]
  },

  // -------- WHIMSICAL VILLAGE --------
  // Note: filename has a typo ("villiage") — preserved per CLAUDE.md §3.
  'whimsical-villiage': {
    background: 'bg_whimsical-villiage',
    music: 'music_quick',
    ambient_sfx: [],
    themes: ['culture-history', 'economics', 'language', 'philosophy'],
    characters: [
      { sprite: 'peep_mommy_F_30ish',     x: 0.16, y: 0.95, heightFrac: 0.55, idle: 'sway' },
      { sprite: 'peep_daddy_M_30ish',     x: 0.32, y: 0.95, heightFrac: 0.55, idle: 'sway' },
      { sprite: 'peep_Cosenae_M_5',       x: 0.52, y: 0.95, heightFrac: 0.45, idle: 'bob'  },
      { sprite: 'peep_Lulumi_F_14',       x: 0.70, y: 0.95, heightFrac: 0.55, idle: 'sway' },
      { sprite: 'peep_Wawoo_robo-snowman', x: 0.88, y: 0.95, heightFrac: 0.55, idle: 'bob'  }
    ],
    things: [
      { sprite: 'thing_funky-house-glass-colourful', x: 0.46, y: 0.55, heightFrac: 0.40 },
      { sprite: 'thing_books',  x: 0.20, y: 0.95, heightFrac: 0.16 },
      { sprite: 'thing_banana', x: 0.95, y: 0.95, heightFrac: 0.12 }
    ],
    hotspots: [
      characterHotspot('mommy', 'peep_mommy_F_30ish',
        { x: 0.08, y: 0.50, w: 0.16, h: 0.45 },
        { theme: 'art-history' }),

      characterHotspot('daddy', 'peep_daddy_M_30ish',
        { x: 0.24, y: 0.50, w: 0.16, h: 0.45 },
        { theme: 'economics' }),

      characterHotspot('cosenae', 'peep_Cosenae_M_5',
        { x: 0.44, y: 0.55, w: 0.16, h: 0.40 },
        { theme: 'science' }),

      characterHotspot('lulumi', 'peep_Lulumi_F_14',
        { x: 0.62, y: 0.50, w: 0.16, h: 0.45 },
        { theme: 'language' }),

      characterHotspot('wawoo', 'peep_Wawoo_robo-snowman',
        { x: 0.80, y: 0.50, w: 0.16, h: 0.45 },
        { theme: 'science' }),

      {
        id: 'village-books', type: 'reactor', cursor: 'sparkle',
        bounds: { x: 0.16, y: 0.83, w: 0.12, h: 0.18 },
        speaker: 'thing_books',
        collect: 'thing_books',
        responses: [
          { text: "A stack of village library books at the gate --\nReturned, perhaps. Or perhaps just *running late*.", theme: 'culture-history' }
        ]
      },

      {
        id: 'village-banana', type: 'reactor', cursor: 'sparkle',
        bounds: { x: 0.91, y: 0.85, w: 0.10, h: 0.16 },
        speaker: 'thing_banana',
        collect: 'thing_banana',
        responses: [
          { text: "Daddy's banana, dropped by the village square --\nHe'll laugh when he finds it. (Bring it. We'll share.)", theme: 'language' }
        ]
      },

      tinyMuseum('glass-house',
        { x: 0.40, y: 0.20, w: 0.24, h: 0.40 },
        [
          "A house can be brick. A house can be wood.\nA house can be GLASS! (If you handle it good.)",
          "Long ago, glass was a thing of the rich --\nA window was magic, a wonder, a stitch.",
          "Each home is a different shape and a sound --\nAnd all of them, all of them, sit on the ground."
        ],
        'culture-history'),

      questionStone('village-square',
        { x: 0.30, y: 0.05, w: 0.40, h: 0.18 },
        [
          "What makes a village more than a few of a house?\nIs it a square? Is it a baker? A mouse?",
          "If you could invent a new village to live --\nWhat would you put in? And what would you give?",
          "What do you call your favourite small place?\nThe kind that you carry inside, not by chase?"
        ],
        'philosophy'),

      portal('to-garden', 'fantasy-garden-playground', {
        sprite: 'portal_magic_flower_door',     x: 0.04, y: 0.62, heightFrac: 0.32,
        enterEdge: 'right',        label: 'the playground'
      }),

      portal('to-school', 'school-courtyard', {
        sprite: 'portal_simple_heart_door', x: 0.50, y: 0.40, heightFrac: 0.26,
        enterEdge: 'right',        label: 'the school'
      }),

      portal('to-seaside', 'seaside-village-sunset', {
        sprite: 'portal_heart_door',     x: 0.96, y: 0.62, heightFrac: 0.32,
        enterEdge: 'left',         label: 'the seaside'
      })
    ],
    gems: [
      { key: 'gem_3', x: 0.10, y: 0.20 },
      { key: 'gem_8', x: 0.85, y: 0.30 },
      { key: 'gem_6', x: 0.70, y: 0.65 },
      { key: 'gem_4', x: 0.40, y: 0.10 },
      { key: 'gem_5', x: 0.20, y: 0.32 }
    ]
  },

  // -------- LAKE (VISTA) --------
  // --------------------------------------------------------------
  //                            ICE LEVEL
  // --------------------------------------------------------------
  // Used to be `mountain-lake-vista` until v1.11; the background
  // was replaced with Amelia's hand-drawn ice scene, so the whole
  // location turned into a cold place. Wawoo (the robo-snowman who
  // worries about being warm) is finally in his element here.
  // The two portals (to-childlike, to-roof) stayed: this scene is
  // still the "up high" point in the map, just frozen now.
  'ice-level': {
    background: 'bg_ice-level',
    music: 'music_skyward',
    ambient_sfx: [],
    themes: ['science', 'philosophy', 'language', 'emotions'],
    characters: [
      // Wawoo's perfect spot — at last, the cold he was looking for.
      { sprite: 'peep_Wawoo_robo-snowman',      x: 0.30, y: 0.95, heightFrac: 0.55, idle: 'sway' },
      // Conaloo's a bear; bears like the cold. (Mostly. He's also
      // a butterfly. The butterfly half is *less* sure.)
      { sprite: 'animal_Conaloo_bear-butterly', x: 0.75, y: 0.95, heightFrac: 0.32, idle: 'sway' }
    ],
    things: [
      // A flashlight — useful in a place this white.
      { sprite: 'thing_flashlight', x: 0.50, y: 0.94, heightFrac: 0.14 },
      // A microscope — ice crystals are six-sided, every time. The
      // microscope IS the lesson, slowly delivered through the kid
      // picking it up and asking what it does.
      { sprite: 'thing_microscope', x: 0.60, y: 0.94, heightFrac: 0.14 }
    ],
    hotspots: [
      characterHotspot('wawoo', 'peep_Wawoo_robo-snowman',
        { x: 0.22, y: 0.45, w: 0.20, h: 0.50 },
        { theme: 'emotions' }),

      characterHotspot('conaloo', 'animal_Conaloo_bear-butterly',
        { x: 0.68, y: 0.68, w: 0.18, h: 0.30 },
        { theme: 'philosophy' }),

      {
        id: 'ice-flashlight', type: 'reactor', cursor: 'sparkle',
        bounds: { x: 0.46, y: 0.84, w: 0.10, h: 0.14 },
        speaker: 'thing_flashlight',
        collect: 'thing_flashlight',
        responses: [
          { text: "A torch on the snow makes a *yellow*-shaped patch --\nA small sun-on-pause, with a click for the catch.", theme: 'science' }
        ]
      },

      {
        id: 'ice-microscope', type: 'reactor', cursor: 'sparkle',
        bounds: { x: 0.56, y: 0.84, w: 0.10, h: 0.14 },
        speaker: 'thing_microscope',
        collect: 'thing_microscope',
        responses: [
          { text: "A brass eye for *tiny*, half-buried in white --\nthe snowflakes are waiting, all six-sided, *bright*.", theme: 'science' }
        ]
      },

      tinyMuseum('snowflakes',
        { x: 0.10, y: 0.10, w: 0.30, h: 0.25 },
        [
          "A *snowflake* has *six* little arms, every one --\nlike a *star* who's quite small, and is freshly begun.",
          "*No two snowflakes* are the same, it is said.\n(*Most* aren't, anyway. -- The rest haven't been read.)",
          "A snowflake's a *raindrop* who's gone *very still* --\nand decided, mid-fall, to *shape up* with a will.",
          "Under a microscope, each one's a *jewel*.\n*Sixfold*, and *bright*, and the maths is the *rule*."
        ],
        'science'),

      tinyMuseum('ice',
        { x: 0.40, y: 0.20, w: 0.30, h: 0.25 },
        [
          "*Ice* is *water* that's stopped, in a hurry, to rest.\nIt's the *slowest* of waters. (It's also the *best*.)",
          "If you held a small *cube* in your hand, very still,\nit would *give* you its cold. (And it would, with goodwill.)",
          "Ice is *less heavy* than water. (Strange, but it's true.)\nWhich is *why* it can *float*. (Some boats wish they knew.)",
          "*Frozen* means *holding-quite-still*. Like a thought\nthat has stopped to consider. (And quite a lot's caught.)"
        ],
        'science'),

      questionStone('cold',
        { x: 0.30, y: 0.04, w: 0.40, h: 0.16 },
        [
          "Where *does* the cold go, when it isn't *here*?\nIs it *waiting* somewhere? In a *cupboard*, my dear?",
          "Are *some* days too cold to *think* through, or is it\nthat thinking just *slows*, like the water it visits?",
          "*If* you could *catch* the cold in a *jar* --\nwould the *jar* feel it, then? (How clever you are.)",
          "*Is the snow* a *quiet* the wind has *laid down*?\n-- Or is it the *clouds*, gone unfastened, on town?"
        ],
        'philosophy'),

      tinyMuseum('cold-words',
        { x: 0.05, y: 0.65, w: 0.10, h: 0.20 },
        [
          "*Cold* in some languages: *froid*, *kalt*, *frio*, *samui*.\nThe shape is the same; the *names* warm and chewy.",
          "*Brrr* is a sound that's a word that's a *shiver*.\nMost languages have one. (Like a small built-in river.)",
          "The Inuit have *many* words for *snow* --\n*qanik* is *falling*; *aput* is *below*."
        ],
        'language'),

      portal('to-childlike', 'mountain-lake-childlike', {
        sprite: 'portal_magic_swirl',   x: 0.04, y: 0.52, heightFrac: 0.32,
        enterEdge: 'right',        label: 'down to the lake'
      }),

      portal('to-roof', 'skyscraper-roof', {
        sprite: 'portal_donut_portal', x: 0.96, y: 0.40, heightFrac: 0.32,
        enterEdge: 'left',         label: 'the rooftop'
      })
    ],
    gems: [
      { key: 'gem_2', x: 0.08, y: 0.14 },
      { key: 'gem_7', x: 0.94, y: 0.78 },
      { key: 'gem_5', x: 0.42, y: 0.40 },
      { key: 'gem_3', x: 0.65, y: 0.18 },
      { key: 'gem_9', x: 0.20, y: 0.78 }
    ]
  },

  // ==============================================================
  //                    NEW SCENES (v1.2)
  // ==============================================================

  // -------- AMELIA'S BEDROOM --------
  'girls-bedroom': {
    background: 'bg_girls-bedroom',
    music: 'music_lullaby',
    ambient_sfx: [],
    themes: ['emotions', 'philosophy'],
    characters: [
      { sprite: 'animal_Pepsi_dog-thing', x: 0.18, y: 0.95, heightFrac: 0.28, idle: 'bob' }
    ],
    things: [
      { sprite: 'thing_teddybear', x: 0.78, y: 0.95, heightFrac: 0.20 },
      { sprite: 'thing_books',     x: 0.50, y: 0.96, heightFrac: 0.18 },
      { sprite: 'thing_flashlight',x: 0.65, y: 0.95, heightFrac: 0.16 }
    ],
    hotspots: [
      characterHotspot('pepsi', 'animal_Pepsi_dog-thing',
        { x: 0.10, y: 0.78, w: 0.18, h: 0.20 },
        { theme: 'emotions' }),

      {
        id: 'teddy', type: 'reactor', cursor: 'sparkle',
        bounds: { x: 0.70, y: 0.80, w: 0.16, h: 0.18 },
        speaker: 'thing_teddybear',
        collect: 'thing_teddybear',
        responses: [
          { text: "A teddy is the bravest of all of the friends --\nHe sits very still, but he never pretends.", theme: 'emotions' },
          { text: "Tucked under your arm or beside you in bed,\nHe listens to everything else that you've said.", theme: 'emotions' }
        ]
      },

      {
        id: 'books', type: 'reactor', cursor: 'sparkle',
        bounds: { x: 0.42, y: 0.80, w: 0.16, h: 0.18 },
        speaker: 'thing_books',
        collect: 'thing_books',
        responses: [
          { text: "A book is a place that you carry inside --\nA window, a door, and sometimes a slide.", theme: 'language' },
          { text: "Some books are quiet, and some books are loud.\nSome books are private, and some are a crowd.", theme: 'language' }
        ]
      },

      {
        id: 'flashlight', type: 'reactor', cursor: 'sparkle',
        bounds: { x: 0.58, y: 0.80, w: 0.14, h: 0.18 },
        speaker: 'thing_flashlight',
        collect: 'thing_flashlight',
        responses: [
          { text: "A torch is a sun that you carry by hand --\nIt makes a small daytime wherever you stand.", theme: 'science' },
          { text: "The dark isn't scary, the dark is a thing\nThat sometimes wants company. Bring it a sing.", theme: 'emotions' }
        ]
      },

      questionStone('window-bedroom',
        { x: 0.05, y: 0.10, w: 0.30, h: 0.30 },
        [
          "When you're tucked in, what do you imagine, what do you see?\nA forest of clouds? Or a moon-made-of-tea?",
          "What sound is the very last sound in the day?\nThe creak of the house? Or a friend, far away?"
        ],
        'philosophy'),

      portal('to-cottage', 'cosy-cottage-interior', {
        sprite: 'portal_heart_door', x: 0.05, y: 0.55, heightFrac: 0.36,
        enterEdge: 'right',        label: 'home'
      })
    ],
    gems: [
      { key: 'gem_5', x: 0.08, y: 0.20 },
      { key: 'gem_1', x: 0.94, y: 0.18 },
      { key: 'gem_6', x: 0.40, y: 0.30 },
      { key: 'gem_3', x: 0.55, y: 0.62 },
      { key: 'gem_9', x: 0.30, y: 0.18 }
    ]
  },

  // -------- SCHOOL COURTYARD --------
  'school-courtyard': {
    background: 'bg_school-courtyard',
    music: 'music_quick',
    ambient_sfx: [],
    themes: ['science', 'computer-science', 'numbers', 'language'],
    characters: [
      { sprite: 'peep_Cosenae_M_5',  x: 0.30, y: 0.95, heightFrac: 0.55, idle: 'bob' },
      { sprite: 'peep_Lulumi_F_14',  x: 0.70, y: 0.95, heightFrac: 0.55, idle: 'sway' }
    ],
    things: [
      { sprite: 'thing_microscope', x: 0.50, y: 0.95, heightFrac: 0.18 },
      { sprite: 'thing_globe',      x: 0.85, y: 0.95, heightFrac: 0.22 },
      // backpack is now the inventory toggle icon — replaced with a tyre.
      { sprite: 'thing_tyre',       x: 0.15, y: 0.95, heightFrac: 0.18 }
    ],
    hotspots: [
      characterHotspot('cosenae', 'peep_Cosenae_M_5',
        { x: 0.22, y: 0.55, w: 0.18, h: 0.40 },
        { theme: 'science' }),

      characterHotspot('lulumi', 'peep_Lulumi_F_14',
        { x: 0.62, y: 0.50, w: 0.18, h: 0.45 },
        { theme: 'computer-science' }),

      {
        id: 'microscope', type: 'reactor', cursor: 'sparkle',
        bounds: { x: 0.42, y: 0.80, w: 0.16, h: 0.18 },
        speaker: 'thing_microscope',
        collect: 'thing_microscope',
        responses: [
          { text: "A microscope makes the small *huge*, like a hand --\nA fly's wing turns into a stained-glass land.", theme: 'science' },
          { text: "What's smaller than tiny? It's tinier still.\nThe more that you look, the more wonder you fill.", theme: 'science' }
        ]
      },

      {
        id: 'globe', type: 'reactor', cursor: 'sparkle',
        bounds: { x: 0.78, y: 0.78, w: 0.16, h: 0.20 },
        speaker: 'thing_globe',
        collect: 'thing_globe',
        responses: [
          { text: "A globe is the world that has shrunk to your hand --\nWith oceans and mountains and tiny-print land.", theme: 'culture-history' },
          { text: "Spin it, and ask it: where shall we go next?\nA hop and a finger -- the answer's the *text*.", theme: 'culture-history' }
        ]
      },

      {
        id: 'tyre', type: 'reactor', cursor: 'sparkle',
        bounds: { x: 0.07, y: 0.80, w: 0.16, h: 0.18 },
        speaker: 'thing_tyre',
        collect: 'thing_tyre',
        responses: [
          { text: "A tyre's a circle, of rubber and tread --\nIt rolls, and it bounces, and goes where you've said.", theme: 'science' },
          { text: "Round things, round things -- the world is full plenty:\nA wheel, a planet, a coin (or twenty).", theme: 'numbers' }
        ]
      },

      tinyMuseum('chalkboard',
        { x: 0.30, y: 0.10, w: 0.40, h: 0.30 },
        [
          "On chalkboards in classrooms, the numbers all dance:\n*Two and two is four* — they line up in advance.",
          "An ABC is a list that we sing when we learn:\n*A* is for *Apple*; the rest take a turn.",
          "If THIS, then do THAT — that's the rule of a sum.\n(A *recipe*, really. A how-do-you-come.)"
        ],
        'numbers'),

      portal('to-playground', 'fantasy-garden-playground', {
        sprite: 'portal_magic_flower_door', x: 0.05, y: 0.55, heightFrac: 0.32,
        enterEdge: 'right',        label: 'the playground'
      }),

      portal('to-village', 'whimsical-villiage', {
        sprite: 'portal_heart_door',     x: 0.95, y: 0.55, heightFrac: 0.32,
        enterEdge: 'left',         label: 'the village'
      })
    ],
    gems: [
      { key: 'gem_8', x: 0.07, y: 0.20 },
      { key: 'gem_4', x: 0.94, y: 0.10 },
      { key: 'gem_2', x: 0.45, y: 0.30 },
      { key: 'gem_6', x: 0.30, y: 0.55 },
      { key: 'gem_9', x: 0.65, y: 0.40 }
    ]
  },

  // -------- SKYSCRAPER ROOF --------
  'skyscraper-roof': {
    background: 'bg_skyscraper-roof',
    music: 'music_journey',
    ambient_sfx: [],
    themes: ['philosophy', 'science', 'culture-history'],
    characters: [
      { sprite: 'animal_Conaloo_bear-butterly', x: 0.30, y: 0.94, heightFrac: 0.30, idle: 'sway' },
      { sprite: 'peep_Wawoo_robo-snowman',      x: 0.78, y: 0.95, heightFrac: 0.55, idle: 'bob' }
    ],
    things: [
      { sprite: 'thing_hourglass', x: 0.55, y: 0.95, heightFrac: 0.18 }
    ],
    hotspots: [
      characterHotspot('conaloo', 'animal_Conaloo_bear-butterly',
        { x: 0.22, y: 0.70, w: 0.18, h: 0.28 },
        { theme: 'philosophy' }),

      characterHotspot('wawoo', 'peep_Wawoo_robo-snowman',
        { x: 0.70, y: 0.50, w: 0.18, h: 0.45 },
        { theme: 'science' }),

      {
        id: 'hourglass', type: 'reactor', cursor: 'sparkle',
        bounds: { x: 0.47, y: 0.80, w: 0.16, h: 0.18 },
        speaker: 'thing_hourglass',
        collect: 'thing_hourglass',
        responses: [
          { text: "An hourglass measures the falling of sand --\nA minute, an hour, a held-out small hand.", theme: 'science' },
          { text: "Each grain is a *now* that is going to *was*.\nThe pile underneath is the *story*, because.", theme: 'philosophy' }
        ]
      },

      questionStone('skyline',
        { x: 0.10, y: 0.10, w: 0.80, h: 0.30 },
        [
          "If you stood on a roof, what would you do first?\nWave at the wind? Or invent your own thirst?",
          "From up here, the people are tiny and slow.\n(They're not, really. But it *looks* like, you know?)",
          "The city's a hundred small stories, all stacked --\nAnd most are still being lived, never quite packed."
        ],
        'philosophy'),

      portal('to-ice', 'ice-level', {
        sprite: 'portal_donut_portal',   x: 0.05, y: 0.55, heightFrac: 0.32,
        enterEdge: 'right',        label: 'off to the snow'
      })
    ],
    gems: [
      { key: 'gem_9', x: 0.45, y: 0.18 },
      { key: 'gem_2', x: 0.93, y: 0.20 },
      { key: 'gem_5', x: 0.62, y: 0.55 },
      { key: 'gem_7', x: 0.16, y: 0.30 },
      { key: 'gem_4', x: 0.85, y: 0.62 }
    ]
  },

  // -------- WATERFALL (MT FUJI IN DISTANCE) --------
  'waterfall-mt-fuji-in-distance': {
    background: 'bg_waterfall-mt-fuji-in-distance',
    music: 'music_calm',
    ambient_sfx: [],
    themes: ['art-history', 'science', 'culture-history'],
    characters: [
      { sprite: 'animal_Lucy_Queen-of-Rabbits-Twin', x: 0.30, y: 0.95, heightFrac: 0.40, idle: 'bob' },
      { sprite: 'animal_Cofeenie_Queen-of-Rabbits-Twin', x: 0.65, y: 0.95, heightFrac: 0.40, idle: 'sway' }
    ],
    things: [
      { sprite: 'thing_bucket', x: 0.50, y: 0.96, heightFrac: 0.18 },
      { sprite: 'thing_banana', x: 0.85, y: 0.96, heightFrac: 0.12 }
    ],
    hotspots: [
      characterHotspot('lucy', 'animal_Lucy_Queen-of-Rabbits-Twin',
        { x: 0.22, y: 0.65, w: 0.18, h: 0.32 },
        { theme: 'animals' }),

      characterHotspot('cofeenie', 'animal_Cofeenie_Queen-of-Rabbits-Twin',
        { x: 0.57, y: 0.65, w: 0.18, h: 0.32 },
        { theme: 'culture-history' }),

      {
        id: 'bucket', type: 'reactor', cursor: 'sparkle',
        bounds: { x: 0.42, y: 0.82, w: 0.16, h: 0.16 },
        speaker: 'thing_bucket',
        collect: 'thing_bucket',
        responses: [
          { text: "A bucket can carry a river, in slices --\nIn handfuls and helpings of cool, cold *nice-es*.", theme: 'science' },
          { text: "Half full or half empty? That's not the right ask.\nIt's *carrying water*. (That's quite a brave task.)", theme: 'philosophy' }
        ]
      },

      {
        id: 'banana', type: 'reactor', cursor: 'sparkle',
        bounds: { x: 0.78, y: 0.86, w: 0.14, h: 0.14 },
        speaker: 'thing_banana',
        collect: 'thing_banana',
        responses: [
          { text: "A banana's a smile that has ripened to gold --\nIt's slippy outside, but inside it's quite bold.", theme: 'language' },
          { text: "It comes in a peel of its own clever making --\nWhich means that the wrapping is part of the taking.", theme: 'animals' }
        ]
      },

      tinyMuseum('waterfall',
        { x: 0.35, y: 0.05, w: 0.35, h: 0.50 },
        [
          "A waterfall's water deciding to *fall* --\nA river that finally noticed a *call*.",
          "The mist at the bottom is small clouds, you know --\nNot up in the sky. They're just down here, for show.",
          "Far behind, that white shape is a mountain quite famous,\nQuite tall and quite old. (We don't need to name us.)"
        ],
        'art-history'),

      portal('to-lake', 'mountain-lake-childlike', {
        sprite: 'portal_magic_swirl', x: 0.05, y: 0.55, heightFrac: 0.32,
        enterEdge: 'right',        label: 'the lake'
      }),

      portal('to-seaside', 'seaside-village-sunset', {
        sprite: 'portal_heart_door',     x: 0.95, y: 0.55, heightFrac: 0.32,
        enterEdge: 'left',         label: 'the seaside'
      })
    ],
    gems: [
      { key: 'gem_6', x: 0.10, y: 0.50 },
      { key: 'gem_4', x: 0.50, y: 0.30 },
      { key: 'gem_8', x: 0.30, y: 0.18 },
      { key: 'gem_5', x: 0.86, y: 0.55 },
      { key: 'gem_1', x: 0.45, y: 0.68 }
    ]
  }
};

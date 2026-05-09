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
 *  whole pool (in shuffled order) before any line repeats. */
function characterHotspot(id, character, bounds, opts = {}) {
  const lines = bios[character]?.lines || genericLines.character;
  const responses = lines.map((text) => ({
    text,
    sfx: 'sfx_pop',
    speaker: character,
    theme: opts.theme
  }));
  return {
    id,
    type: 'reactor',
    cursor: 'sparkle',
    speaker: character,
    bounds,
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
    responses: questions.map((text) => ({ text, sfx: 'sfx_chime', theme }))
  };
}

/** Build a Tiny Museum hotspot — facts that build on each other. */
function tinyMuseum(id, bounds, facts, theme) {
  return {
    id,
    type: 'reactor',
    cursor: 'sparkle',
    bounds,
    responses: facts.map((text) => ({ text, sfx: 'sfx_chime', theme }))
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
      { sprite: 'thing_rocketship', x: 0.66, y: 0.85, heightFrac: 0.45 }
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

      tinyMuseum('rocketship',
        { x: 0.58, y: 0.55, w: 0.18, h: 0.35 },
        [
          "A rocket's a ship that has gone for a climb,\nIt borrows the sky for a chunk of its time.",
          "It pushes the air from its nose to its tail --\nAnd the push is the thing that decides if you sail.",
          "Out there, where it's quiet, the stars are quite near.\nThe trip is so long, you forget to feel fear.",
          "And mostly, a rocket is parked, not in flight.\nA parked rocket counts. It's a *plan* that holds tight."
        ],
        'science'),

      tinyMuseum('countdown',
        { x: 0.50, y: 0.20, w: 0.16, h: 0.18 },
        [
          "Five! Four! Three! Two! One! -- and the rocket would go.\nA countdown is *backwards*, in case you don't know.",
          "Why backwards? Well, ZERO's the moment of go.\nSo we count toward the zero, all small, in a row.",
          "Five fingers, four toes-on-a-paw, three small bears,\nTwo eyes-on-a-Conaloo, one nose. (Then up there.)"
        ],
        'numbers'),

      tinyMuseum('trade',
        { x: 0.30, y: 0.78, w: 0.10, h: 0.12 },
        [
          "A trade is a swap of one thing for another --\nA pebble for peach, or a pear from your brother.",
          "The thing about trading is *both* people gain --\nIf one of you doesn't, you ought to abstain.",
          "Sometimes the best trade is *nothing for nothing* --\nWhich means: keep your peach. (We're already enough thing.)"
        ],
        'economics'),

      questionStone('sun',
        { x: 0.10, y: 0.04, w: 0.20, h: 0.20 },
        [
          "The sun is a star, did you know it? It's true.\nA terrible-far-away friend, looking at you.",
          "If you hold up a hand, you can blot out the sun --\nWhich means hands are bigger. (Well, sort of. Sort of one.)",
          "The light that arrives took a while to be here.\nWhat you're seeing is yesterday, mostly, my dear."
        ],
        'science'),

      portal('to-cottage', 'cosy-cottage-interior', {
        sprite: 'portal_door',     x: 0.05, y: 0.86, heightFrac: 0.32,
        enterEdge: 'right',        label: 'home'
      }),

      portal('to-lake', 'mountain-lake-childlike', {
        sprite: 'portal_portal_blue', x: 0.96, y: 0.86, heightFrac: 0.32,
        enterEdge: 'left',         label: 'the lake'
      }),

      portal('to-playground', 'fantasy-garden-playground', {
        sprite: 'portal_ladder',   x: 0.18, y: 0.97, heightFrac: 0.30,
        enterEdge: 'top',          label: 'the playground'
      }),

      portal('to-seaside', 'seaside-village-sunset', {
        sprite: 'portal_slime-portal', x: 0.82, y: 0.96, heightFrac: 0.30,
        enterEdge: 'left',         label: 'the seaside'
      })
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
    things: [],
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

      tinyMuseum('hearth',
        { x: 0.40, y: 0.20, w: 0.20, h: 0.40 },
        [
          "A hearth is a hole that we ask for a fire,\nIt warms a whole room and a half of a choir.",
          "Long ago, hearths were the heart of a place --\nA warm in the dark and a light on a face.",
          "The smoke would go up through a hat in the roof.\n(That hat is a chimney. That fact is a proof.)"
        ],
        'culture-history'),

      questionStone('window',
        { x: 0.04, y: 0.10, w: 0.20, h: 0.30 },
        [
          "What's on the other side of a window, today?\nA bird? A whole forest? A field full of hay?",
          "Why is it that windows make outside more outside?\nAnd inside more inside? (You decide.)",
          "If a window remembered what passed through its glass,\nWould it tell you the geese, or the breath of the grass?"
        ],
        'philosophy'),

      tinyMuseum('tea',
        { x: 0.30, y: 0.55, w: 0.10, h: 0.18 },
        [
          "A cup of warm tea, when it's split into two,\nIs not really halved -- it is *doubled*, with you.",
          "The recipe? Simple. A leaf and some heat.\nA cup, and a moment, and someone to meet.",
          "Enough is a feeling that's quiet and round --\nIt's not a *too little*, and not a *too found*."
        ],
        'economics'),

      tinyMuseum('shelf',
        { x: 0.78, y: 0.30, w: 0.18, h: 0.30 },
        [
          "One book on the shelf. Then a second. Then three.\nFour books all in order, just lined up to be.",
          "Sorting is putting the smalls before bigs --\nWhich works just as well for your toes as for figs.",
          "A list is a line of the things in a row --\nAnd then, if you'd like, you can rearrange so."
        ],
        'computer-science'),

      portal('to-garden', 'sunny-rocket-garden', {
        sprite: 'portal_door',     x: 0.05, y: 0.92, heightFrac: 0.40,
        enterEdge: 'left',         label: 'the garden'
      })
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
    things: [],
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

      tinyMuseum('lake',
        { x: 0.20, y: 0.40, w: 0.60, h: 0.20 },
        [
          "A lake is a puddle that decided to stay,\nIt's gathered the rain of a long, long, long day.",
          "It's still on the top, but it's busy below --\nWith fishes and snail-folk and weeds in a row.",
          "It mirrors the mountains, the sky, and the trees.\nThe trick of the mirror is just standing at ease.",
          "A lake holds the colours of all that's around --\nAnd hands them right back, when the wind isn't loud."
        ],
        'science'),

      questionStone('mountain',
        { x: 0.05, y: 0.08, w: 0.40, h: 0.30 },
        [
          "How long, do you think, has that mountain been there?\nLonger than rabbits. Longer than care.",
          "If a mountain could whisper, what would it confide?\nThe weather of years? The names of the tide?",
          "What lives at the top of a mountain that high?\nA wind? A small shrew? A whole house of sky?"
        ],
        'philosophy'),

      tinyMuseum('pebbles',
        { x: 0.40, y: 0.78, w: 0.20, h: 0.18 },
        [
          "One pebble, two pebbles, three pebbles, four --\nAnd after that's done, you can ask for some more.",
          "Five pebbles, six pebbles, seven, then eight --\nThe pile of pebbles is starting to weight.",
          "A number's a name that we give to a count --\nA way to say HOW MUCH, a way to say AMOUNT."
        ],
        'numbers'),

      portal('to-vista', 'mountain-lake-vista', {
        sprite: 'portal_ladder',   x: 0.94, y: 0.93, heightFrac: 0.32,
        enterEdge: 'left',         label: 'up the mountain'
      }),

      portal('to-garden', 'sunny-rocket-garden', {
        sprite: 'portal_portal_green', x: 0.05, y: 0.86, heightFrac: 0.30,
        enterEdge: 'right',        label: 'the garden'
      })
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
      { sprite: 'thing_birthday-cake-with-one-candle', x: 0.78, y: 0.92, heightFrac: 0.16 }
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
          "A tree, all in colours, is mostly a green --\nBut every leaf carries a different sheen.",
          "Two greens, made together: a yellow and blue.\nThe trees know this trick. (Now you know it too.)",
          "Each leaf is a hand that the wind likes to shake.\nThe tree doesn't mind. The tree's wide awake."
        ],
        'art-history'),

      tinyMuseum('tree-B',
        { x: 0.82, y: 0.30, w: 0.18, h: 0.55 },
        [
          "*Tree* in some languages: arbre, baum, ki, ya --\nThe shape is the same, but the names go quite far.",
          "A tree is so quiet it sounds like a bell --\nThe slow kind of bell that you ring just to dwell.",
          "It stands and it stands. And the standing's the song.\nWe're walking past trees that have stood -- oh, so long."
        ],
        'language'),

      portal('to-hub', 'sunny-rocket-garden', {
        sprite: 'portal_ladder',   x: 0.05, y: 0.92, heightFrac: 0.32,
        enterEdge: 'bottom',       label: 'the garden'
      }),

      portal('to-village', 'whimsical-villiage', {
        sprite: 'portal_door',     x: 0.94, y: 0.92, heightFrac: 0.32,
        enterEdge: 'left',         label: 'the village'
      })
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
    things: [],
    hotspots: [
      characterHotspot('keefa', 'peep_Keefa_M_25',
        { x: 0.44, y: 0.40, w: 0.16, h: 0.55 },
        { theme: 'language' }),

      characterHotspot('konessa', 'peep_Konessa_has-flower',
        { x: 0.26, y: 0.45, w: 0.16, h: 0.50 },
        { theme: 'art-history' }),

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

      portal('to-hub', 'sunny-rocket-garden', {
        sprite: 'portal_slime-portal', x: 0.05, y: 0.93, heightFrac: 0.32,
        enterEdge: 'right',        label: 'the garden'
      }),

      portal('to-village', 'whimsical-villiage', {
        sprite: 'portal_door',     x: 0.94, y: 0.93, heightFrac: 0.32,
        enterEdge: 'left',         label: 'the village'
      })
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
      { sprite: 'thing_funky-house-glass-colourful', x: 0.46, y: 0.55, heightFrac: 0.40 }
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
        sprite: 'portal_door',     x: 0.05, y: 0.93, heightFrac: 0.32,
        enterEdge: 'right',        label: 'the playground'
      }),

      portal('to-seaside', 'seaside-village-sunset', {
        sprite: 'portal_door',     x: 0.94, y: 0.93, heightFrac: 0.32,
        enterEdge: 'left',         label: 'the seaside'
      })
    ]
  },

  // -------- LAKE (VISTA) --------
  'mountain-lake-vista': {
    background: 'bg_mountain-lake-vista',
    music: 'music_journey',
    ambient_sfx: [],
    themes: ['science', 'art-history', 'philosophy', 'language'],
    characters: [
      { sprite: 'animal_Conaloo_bear-butterly', x: 0.20, y: 0.94, heightFrac: 0.30, idle: 'sway' },
      { sprite: 'peep_Lulumi_F_14',             x: 0.78, y: 0.95, heightFrac: 0.55, idle: 'sway' }
    ],
    things: [],
    hotspots: [
      characterHotspot('conaloo', 'animal_Conaloo_bear-butterly',
        { x: 0.12, y: 0.68, w: 0.18, h: 0.30 },
        { theme: 'philosophy' }),

      characterHotspot('lulumi', 'peep_Lulumi_F_14',
        { x: 0.70, y: 0.45, w: 0.20, h: 0.50 },
        { theme: 'language' }),

      tinyMuseum('peak',
        { x: 0.30, y: 0.05, w: 0.40, h: 0.30 },
        [
          "A peak is the top of a mountain's slow climb,\nIt's been on its way there for *plenty* of time.",
          "The wind at the top is a whole different sort --\nIt's thinner, and colder, and rude in retort.",
          "Some peaks are so old, they have lost all their snow,\nAnd some are so new, they're not finished, you know."
        ],
        'science'),

      tinyMuseum('lake',
        { x: 0.30, y: 0.55, w: 0.40, h: 0.25 },
        [
          "Look how the lake has decided on blue,\nThe colour the painter who painted you knew.",
          "Two pictures, two lakes, but they're really one place --\nDrawn twice, two ways, with a different face.",
          "A blue made of yellows and reds piled deep --\nA painter's a poet who's mixed it for keep."
        ],
        'art-history'),

      questionStone('horizon',
        { x: 0.10, y: 0.30, w: 0.80, h: 0.10 },
        [
          "The horizon -- the line where the sky meets the ground --\nIs always *just there*, but it's never *just* found.",
          "If you ran for a year toward where the sky lands,\nYou'd never quite touch it. (You'd touch other lands.)",
          "Some questions are horizons -- they move when you do.\nThe walking's the answer. The asking is, too."
        ],
        'philosophy'),

      tinyMuseum('notebook',
        { x: 0.74, y: 0.62, w: 0.14, h: 0.14 },
        [
          "Lulumi's small notebook is full of small things.\nA list, in the order they came on the wings.",
          "If THIS, then do THAT -- that's a recipe rule.\nIt's how you make porridge, and how you teach school.",
          "A list can be sorted. A sort is a switch --\nUntil all the smalls are quite under the bigs, which..."
        ],
        'computer-science'),

      portal('to-childlike', 'mountain-lake-childlike', {
        sprite: 'portal_ladder',   x: 0.05, y: 0.92, heightFrac: 0.32,
        enterEdge: 'right',        label: 'down to the lake'
      }),

      portal('to-garden', 'sunny-rocket-garden', {
        sprite: 'portal_portal_blue', x: 0.94, y: 0.92, heightFrac: 0.32,
        enterEdge: 'right',        label: 'the garden'
      })
    ]
  }
};

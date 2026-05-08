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

/** Build a hotspot whose responses are pulled from a character's bio lines. */
function characterHotspot(id, character, bounds, opts = {}) {
  const lines = bios[character]?.lines || genericLines.character;
  const cycle = (lines.length >= 3 ? lines.slice(0, 3) : lines).map((text) => ({
    text,
    sfx: 'sfx_pop',
    speaker: character,
    theme: opts.theme
  }));
  const rare = lines[3] ? { text: lines[3], sfx: 'sfx_chime', speaker: character } : null;
  return {
    id,
    type: 'reactor',
    cursor: 'sparkle',
    bounds,
    responses: cycle,
    rare_response: opts.rare ?? rare
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

/** Build a portal hotspot to another scene. */
function portal(id, bounds, target) {
  return {
    id,
    type: 'portal',
    cursor: 'walk',
    bounds,
    target,
    responses: portalLines.map((text) => ({ text, sfx: 'sfx_step' }))
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

      portal('to-cottage',
        { x: 0.0, y: 0.40, w: 0.10, h: 0.50 },
        'cosy-cottage-interior'),

      portal('to-lake',
        { x: 0.90, y: 0.40, w: 0.10, h: 0.50 },
        'mountain-lake-childlike')
    ]
  },

  // -------- HOME INTERIOR --------
  'cosy-cottage-interior': {
    background: 'bg_cosy-cottage-interior',
    music: 'music_calm',
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

      portal('to-garden',
        { x: 0.0, y: 0.50, w: 0.10, h: 0.40 },
        'sunny-rocket-garden')
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

      portal('to-vista',
        { x: 0.90, y: 0.40, w: 0.10, h: 0.50 },
        'mountain-lake-vista'),

      portal('to-garden',
        { x: 0.0, y: 0.40, w: 0.10, h: 0.50 },
        'sunny-rocket-garden')
    ]
  },

  // -------- LAKE (VISTA) --------
  'mountain-lake-vista': {
    background: 'bg_mountain-lake-vista',
    music: 'music_calm',
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

      portal('to-childlike',
        { x: 0.0, y: 0.40, w: 0.10, h: 0.50 },
        'mountain-lake-childlike'),

      portal('to-garden',
        { x: 0.90, y: 0.40, w: 0.10, h: 0.50 },
        'sunny-rocket-garden')
    ]
  }
};

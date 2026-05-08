/**
 * Shared rhyme pool.
 *
 * These are the *generic* lines used by auto-generated scenes when a
 * designer hasn't yet written bespoke verse. They are pre-vetted against
 * the rules in CLAUDE.md §4 — anapestic-leaning, true rhymes, no flattery,
 * no fourth-wall breaks.
 *
 * When you (the next agent) write scene-specific rhymes, prefer those over
 * these. These are the fallback so the child is never met with silence.
 */

export const genericLines = {
  // Used over peep_/animal_ sprites.
  character: [
    "A friend in the field, with a wave and a wink,\nIs softer to find than a feather can sink.",
    "They look at the world like a window of words,\nAnd hum like the hummingest hum of the birds.",
    "Some friends are tall and some friends are small,\nBut friendship, it turns out, has no size at all.",
    "They blink and they breathe and they wonder, like you,\nWhat is on the other side of the blue?"
  ],
  // Used over thing_ sprites.
  thing: [
    "A thing is a thing, and a thing has a name,\nAnd no two things, ever, are quite the same.",
    "It rests where it rests and it sits where it sits,\nAnd holds all the world that it holds, bit by bit.",
    "Each thing has a story it whispers in still --\nIt only takes listening, soft as a hill.",
    "Look carefully now: does it wobble? Does it lean?\nThe quietest things are the loudest, I mean."
  ],
  // Used in upper-region (sky/canopy/horizon) hotspots.
  sky: [
    "The sky has no edges, no corners, no walls --\nIt's bigger than mountains and softer than calls.",
    "A cloud is a puddle that climbed up a hill,\nAnd then forgot home, and just stayed where it will.",
    "If you ever should wonder what colour is blue,\nLook up. It's a colour that's looking at you.",
    "The wind has a shape that you cannot quite see,\nBut a leaf or a kite knows the wind awfully."
  ]
};

export const portalLines = [
  "A path? Well, why not -- let us go for a peek.\nThe place at the end is the place that we seek.",
  "Off we go, over and under and through,\nTo somewhere a little less ordinary, too.",
  "One foot, then another, then onward we tread.\nA new place is waiting, just up there ahead."
];

/**
 * Per-theme rhymes — used by Teacher hotspots when the designer
 * tags a hotspot with a theme but hasn't written specific lines.
 *
 * Themes match GDD §8: animals, numbers, computer-science, philosophy,
 * art-history, culture-history, economics, language, science, emotions.
 */
export const themedLines = {
  animals: [
    "A butterfly tastes with the soles of her feet --\nWhich means every flower is something to eat.",
    "An octopus thinks with each one of his arms,\nEight little brainlets that purr like alarms.",
    "A bird in the morning is singing, you know,\nThe same kind of song that her grandmothers know."
  ],
  numbers: [
    "A number's a name that we give to a count --\nA way to say HOW MUCH, a way to say AMOUNT.\nOne pebble, two pebbles, three pebbles, four --\nAnd after that's done, you can ask for some more.",
    "Zero's a number, and zero is real --\nThe size of a hole, or the speed of a peel.",
    "A half is a thing that is split into two,\nLike sharing a pancake, the same as you do."
  ],
  'computer-science': [
    "A list is a line of the things in a row --\nFirst, second, third, and the next ones to go.",
    "If THIS, then do THAT -- that's a recipe rule.\nIt's how you make porridge, and how you teach school.",
    "To sort is to put all the smalls before bigs --\nWhich works just as well for your toes as for figs."
  ],
  philosophy: [
    "Some questions take seconds. Some questions take years.\nAnd some? Well, you carry them all your life, dears.",
    "I think -- and I know -- are not quite the same.\nOne wears a question, and one wears a name.",
    "Be kind to the small things, the slow things, the new --\nYou were once each of those, and they once will be you."
  ],
  'art-history': [
    "Long ago, people drew pictures in caves,\nWith soot, and with berries, and ochre that saves.",
    "A painting is colour that holds very still --\nA window invented to hang on a wall.",
    "Two colours that meet have a third that they make:\nA blue and a yellow, a green for your sake."
  ],
  'culture-history': [
    "The songs that we sing are the songs that were sung\nA hundred years back, when the world was young.",
    "Old places have stories tucked under each stone --\nIf you sit there a moment, you'll feel less alone.",
    "Each kitchen, each language, each laugh has a where --\nAnd none is the right one. They all of them care."
  ],
  economics: [
    "To trade is to swap what you have for what's there --\nA pebble, a peach, or a chair for a chair.",
    "Enough is a wonderful number to know --\nMore than too little, less than too-too-too-so.",
    "To share is to make a small thing become two,\nWithout any cutting, in the kindest of glue."
  ],
  language: [
    "A rhyme is a kind of a magic, you see --\nTwo words that agree at the end, secretly.",
    "BEAR is a word that means TWO different things:\nThe shaggy old fellow, OR what your arm brings.",
    "In other lands, water is l'eau, agua, mizu --\nThe puddle's the same; the names crowd it like zoo."
  ],
  science: [
    "The sun is a star, and it's terribly far,\nAnd we are a planet that spins where we are.",
    "Rain is a sea that has gone for a fly,\nThen tripped on a cloud and fell back from the sky.",
    "Why does it fall? There's a pull in the ground.\nThe earth, you see, likes when its things are around."
  ],
  emotions: [
    "Some days are a sunshine, some days are a sigh --\nAnd both of them, both of them, deserve a why.",
    "It's fine to be shy and it's fine to be loud,\nThe inside of you is allowed to be proud.",
    "When something feels big and your eyes feel like rain,\nThat's not a wrong feeling. It just needs a name."
  ]
};

export const cursorTypes = ['default', 'sparkle', 'walk'];

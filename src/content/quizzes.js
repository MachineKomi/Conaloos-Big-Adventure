/**
 * Per-character quiz pools.
 *
 * Some character clicks (~30% chance when a quiz pool exists) fire a
 * quiz instead of normal dialogue. Quizzes have either:
 *   - a single correct answer (kid gets gems for getting it right,
 *     a teaching response if they pick wrong), or
 *   - `isPreference: true` (no wrong answer; gems for any choice)
 *
 * Pitched at a smart 4–6 year old. Answers are concise and concrete.
 *
 * Schema:
 *   {
 *     question:      "Which thing is biggest?",
 *     options:       [{ text: "An ant", isCorrect: false }, …],
 *     isPreference:  false,
 *     onCorrect:     "Yes! A whale is enormous — bigger than a bus.",
 *     onWrong:       "Hmm, a whale is the biggest of those. They live in the sea and can be longer than a bus."
 *   }
 *
 * Authored ones live here keyed by character. Unkeyed characters have
 * no quiz pool and just speak their normal lines.
 */

export const quizzes = {
  'peep_Cosenae_M_5': [
    {
      question: "Quick! Which is bigger?",
      options: [
        { text: "A bumblebee", isCorrect: false },
        { text: "A tiger",     isCorrect: true },
        { text: "A daisy",     isCorrect: false }
      ],
      onCorrect: "A *tiger*! Yes! Tigers are gigantic -- they have stripes\nand teeth and a tail as long as a chair.",
      onWrong:   "Hmm -- a tiger is the biggest. They live in forests far away\nand have stripes that look like sunlight on the leaves."
    },
    {
      question: "Which one is a number?",
      options: [
        { text: "Seven",  isCorrect: true },
        { text: "Tuesday", isCorrect: false },
        { text: "Carrot", isCorrect: false }
      ],
      onCorrect: "Seven! Right. Tuesday's a *day* and a carrot's a *snack*.\nNumbers tell us how MANY of a thing.",
      onWrong:   "Tuesday's a day, carrot's a snack -- but seven\nis a *number*, like 1, 2, 3 ...up to seven!"
    },
    {
      question: "How many legs does a spider have?",
      options: [
        { text: "Four",   isCorrect: false },
        { text: "Six",    isCorrect: false },
        { text: "Eight",  isCorrect: true }
      ],
      onCorrect: "EIGHT! Spiders have eight legs -- that's *two more*\nthan an insect, which only has six.",
      onWrong:   "Spiders have eight! Insects have six legs, but spiders\nare different -- they're called *arachnids*."
    },
    {
      question: "What's 2 plus 2?",
      options: [
        { text: "Three",  isCorrect: false },
        { text: "Four",   isCorrect: true },
        { text: "Five",   isCorrect: false }
      ],
      onCorrect: "FOUR! Two pebbles + two pebbles = four pebbles.\nThat's how addition works.",
      onWrong:   "Two and two makes *four*. Try counting on your fingers:\none-two ... three-four. See?"
    },
    {
      question: "Where does the SUN go at night?",
      options: [
        { text: "It hides behind the moon", isCorrect: false },
        { text: "It shines on the other side of the world", isCorrect: true },
        { text: "It goes to bed", isCorrect: false }
      ],
      onCorrect: "Yes! The Earth is spinning, so the sun is on the\nOTHER side. Right now somewhere it's morning.",
      onWrong:   "Actually -- the Earth spins! When it's night here,\nthe sun is shining somewhere else. It never sleeps."
    },
    {
      question: "Which animal lays eggs?",
      options: [
        { text: "A cat",     isCorrect: false },
        { text: "A chicken", isCorrect: true },
        { text: "A horse",   isCorrect: false }
      ],
      onCorrect: "Chickens! Yes. Birds lay eggs. Cats and horses\nhave babies that grow inside their tummies.",
      onWrong:   "Chickens lay eggs. So do most birds, fish, frogs, and lizards.\nCats and horses are *mammals* -- their babies grow inside."
    },
    {
      question: "What do plants need to grow?",
      options: [
        { text: "Cake",          isCorrect: false },
        { text: "Sun and water", isCorrect: true },
        { text: "Wifi",          isCorrect: false }
      ],
      onCorrect: "Sun and water! Plants drink water through their roots\nand eat sunlight through their leaves. (How clever!)",
      onWrong:   "Sun and water! Plants are amazing -- they make their\nfood from sunshine. They don't need cake. Or wifi."
    },
    {
      question: "Which is the SMALLEST?",
      options: [
        { text: "An ant",     isCorrect: true },
        { text: "A puppy",    isCorrect: false },
        { text: "A car",      isCorrect: false }
      ],
      onCorrect: "An ant! Tiny but *mighty* -- they can carry things\nway bigger than themselves.",
      onWrong:   "Ants are the smallest of those. They're so small you can\nfit hundreds of them on your hand."
    }
  ],

  'peep_Lulumi_F_14': [
    {
      question: "Which one rhymes with 'moon'?",
      options: [
        { text: "Spoon",  isCorrect: true },
        { text: "Tree",   isCorrect: false },
        { text: "Cat",    isCorrect: false }
      ],
      onCorrect: "Yes! Spoon rhymes with moon -- they end with the same sound.\n*Spoon, moon, tune, balloon* -- try saying them aloud.",
      onWrong:   "Spoon rhymes with moon -- they share an *oon* sound at the end.\nTry saying them: spoon-moon, spoon-moon."
    },
    {
      question: "Which season has snow?",
      options: [
        { text: "Summer",  isCorrect: false },
        { text: "Winter",  isCorrect: true },
        { text: "Spring",  isCorrect: false }
      ],
      onCorrect: "Winter! Yes. The cold months when frost paints the windows\nand snow turns the world into a quiet white page.",
      onWrong:   "It's winter! Summer is hot, spring is when flowers wake up,\nand winter is the cold one with snow."
    },
    {
      question: "Which colour comes from yellow + blue?",
      options: [
        { text: "Pink",   isCorrect: false },
        { text: "Green",  isCorrect: true },
        { text: "Purple", isCorrect: false }
      ],
      onCorrect: "Green! Yellow and blue make green -- like grass\nor leaves. Mix them in your head: it really works.",
      onWrong:   "Green! Yellow + blue = green. Try it with paints sometime.\n(Yellow + red = orange. Red + blue = purple.)"
    },
    {
      question: "How many sides does a triangle have?",
      options: [
        { text: "Two",   isCorrect: false },
        { text: "Three", isCorrect: true },
        { text: "Four",  isCorrect: false }
      ],
      onCorrect: "Three! *Tri* means three. Triangles have three sides\nand three corners. Always.",
      onWrong:   "Three! The word *triangle* even has 'tri' for three.\nA shape with four sides is a square or rectangle."
    },
    {
      question: "What letter does APPLE start with?",
      options: [
        { text: "A", isCorrect: true },
        { text: "P", isCorrect: false },
        { text: "B", isCorrect: false }
      ],
      onCorrect: "A! *A* is for *Apple* -- and for ant, alligator,\nand of course Amelia.",
      onWrong:   "Apple starts with A. Try saying it slowly:\n*Aaa-pple*. The first sound is the letter A."
    },
    {
      question: "Which one is a SHAPE?",
      options: [
        { text: "Circle", isCorrect: true },
        { text: "Tuesday",isCorrect: false },
        { text: "Yellow", isCorrect: false }
      ],
      onCorrect: "Circle! Round, like a coin or a wheel.\nShapes are how things look. Tuesday's a day, yellow's a colour.",
      onWrong:   "Circle is a shape -- round, like the moon or a coin.\nTuesday is a day. Yellow is a colour. Different categories!"
    }
  ],

  'animal_Conaloo_bear-butterly': [
    {
      isPreference: true,
      question: "What is your favourite colour today?",
      options: [
        { text: "Pink"   },
        { text: "Blue"   },
        { text: "Yellow" },
        { text: "Green"  }
      ],
      onCorrect: "A fine choice. Each of those is a *good* colour,\nand each of them holds a different kind of day.",
      onWrong: ""  // unused for preference
    },
    {
      isPreference: true,
      question: "If you could be any creature for one day, which?",
      options: [
        { text: "A bird"   },
        { text: "A fish"   },
        { text: "A turtle" },
        { text: "A bear-butterly (like me)" }
      ],
      onCorrect: "Mm. I think you'd be very good at being that.\nYou'd notice things that the rest of us miss.",
      onWrong: ""
    }
  ],

  'peep_Amelia_F_4': [
    {
      isPreference: true,
      question: "What do you most want to eat right now?",
      options: [
        { text: "An apple"     },
        { text: "Some toast"   },
        { text: "A whole cake" },
        { text: "A banana"     }
      ],
      onCorrect: "Excellent! That sounds like a brilliant idea.\nIf I could be hungry, I would be hungry for that.",
      onWrong: ""
    }
  ],

  'peep_mommy_F_30ish': [
    {
      question: "Which one of these is a TREE?",
      options: [
        { text: "Oak",     isCorrect: true },
        { text: "Sneaker", isCorrect: false },
        { text: "Soup",    isCorrect: false }
      ],
      onCorrect: "An oak! Right. Oaks are the kind of tree\nwith very small leaves and very large stories.",
      onWrong:   "Oak is the tree. Sneaker's a shoe and soup's for dinner.\n(Though imagine eating a tree...)"
    }
  ],

  'animal_Pepsi_dog-thing': [
    {
      isPreference: true,
      question: "Pepsi wants you to choose his favourite stick today!",
      options: [
        { text: "Long stick"   },
        { text: "Short stick"  },
        { text: "Curly stick"  }
      ],
      onCorrect: "A perfect choice. (boof.) Pepsi is now proud of *all* sticks,\nbut especially yours.",
      onWrong: ""
    }
  ]
};

/**
 * Get a random unseen quiz for a character. Returns null if the
 * character has no pool, or a specific quiz object.
 *
 * `seenSet` is a Set used to track per-character "seen" quizzes so
 * each one can be asked once before any repeats.
 */
export function pickQuizFor(characterKey, seenSet) {
  const pool = quizzes[characterKey];
  if (!pool || pool.length === 0) return null;
  const unseen = pool.filter((_, i) => !seenSet.has(`${characterKey}:${i}`));
  const list = unseen.length > 0 ? unseen : pool;
  const idx = Math.floor(Math.random() * list.length);
  const quiz = list[idx];
  // Mark this quiz as seen.
  const realIdx = pool.indexOf(quiz);
  seenSet.add(`${characterKey}:${realIdx}`);
  return quiz;
}

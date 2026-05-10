/**
 * Per-character quiz pools.
 *
 * ~25% of clicks fire a quiz. Two flavours:
 *   1. KNOWLEDGE quizzes have a single correct answer. Right →
 *      affirming reaction + 2-5 gem reward. Wrong → a kind, warm,
 *      *teaching* reaction that explains the answer without making
 *      the kid feel small.
 *   2. PREFERENCE questions have `isPreference: true` and no wrong
 *      answer. Always rewarded. Used for "what's your favourite..."
 *      questions; the response speaks to the chosen option.
 *
 * Pitched at a smart 4–6 year old. Concrete, surprising, never
 * patronising. We aim for a Maxis edutainment feel — facts smuggled
 * in, never lectured.
 */

export const quizzes = {

  // -------- Cosenae: confident half-facts, sometimes right --------
  'peep_Cosenae_M_5': [
    {
      question: "Quick! Which of these is BIGGEST?",
      options: [
        { text: "A bumblebee", isCorrect: false },
        { text: "A tiger",     isCorrect: true },
        { text: "A daisy",     isCorrect: false }
      ],
      onCorrect: "Yes! A *tiger*! Tigers are *huge* and stripy --\nsome are as long as a small bath, all wipey.",
      onWrong:   "Mm -- it's the tiger. They live in big forests\nand have stripes that look like sun through the leaves."
    },
    {
      question: "Which of these is a *number*?",
      options: [
        { text: "Seven",   isCorrect: true },
        { text: "Tuesday", isCorrect: false },
        { text: "Carrot",  isCorrect: false }
      ],
      onCorrect: "*Seven*! Right. Tuesday is a *day*, carrot's a *snack*.\nNumbers are for counting -- they fit on the back.",
      onWrong:   "It's *seven*! Tuesday's a *day*. Carrot's a *snack*.\nNumbers tell us *how many* -- they keep the count's track."
    },
    {
      question: "How many legs does a *spider* have?",
      options: [
        { text: "Four",  isCorrect: false },
        { text: "Six",   isCorrect: false },
        { text: "Eight", isCorrect: true }
      ],
      onCorrect: "EIGHT! Yes! Spiders have eight little legs --\n*two more than insects*. (Which only have eggs.)",
      onWrong:   "Spiders have *eight*! Insects only have *six*.\nSpiders aren't insects -- they're *arachnids*. Tricks!"
    },
    {
      question: "What's two plus two?",
      options: [
        { text: "Three", isCorrect: false },
        { text: "Four",  isCorrect: true },
        { text: "Five",  isCorrect: false }
      ],
      onCorrect: "*FOUR*! Two pebbles plus two pebbles makes four.\nThat's *adding*. The pile gets a little bit more.",
      onWrong:   "Two plus two is *four*. Try counting your fingers:\n*one-two ... three-four*. (Like a song that sort of lingers.)"
    },
    {
      question: "Where does the SUN go at night?",
      options: [
        { text: "It hides behind the moon",       isCorrect: false },
        { text: "The other side of the world",    isCorrect: true },
        { text: "It goes to bed in a cloud",      isCorrect: false }
      ],
      onCorrect: "Yes! The Earth is *spinning*. When it's dark for us,\nthe sun is shining elsewhere. (No fuss.)",
      onWrong:   "It's the *other side*. The Earth turns slowly round.\nAs we head into night, the sun's morning is found."
    },
    {
      question: "Which animal lays *eggs*?",
      options: [
        { text: "A cat",     isCorrect: false },
        { text: "A chicken", isCorrect: true },
        { text: "A horse",   isCorrect: false }
      ],
      onCorrect: "A *chicken*! Yes! Birds lay eggs all the time.\nFish, frogs, and lizards do too -- it's a kind of *prime*.",
      onWrong:   "It's chickens! Birds lay eggs. So do fish and frogs.\nCats and horses? Their babies grow inside, snug as logs."
    },
    {
      question: "What do plants need to grow?",
      options: [
        { text: "Cake and candy",  isCorrect: false },
        { text: "Sun and water",   isCorrect: true },
        { text: "Wifi",            isCorrect: false }
      ],
      onCorrect: "*Sun and water*! Yes. Plants drink through their roots\nand they *eat the sunshine* through every leaf-shoot.",
      onWrong:   "*Sun and water!* Plants are amazing -- they make\ntheir own food from sunshine. (No oven. No bake.)"
    },
    {
      question: "Which is the *smallest*?",
      options: [
        { text: "An ant",  isCorrect: true },
        { text: "A puppy", isCorrect: false },
        { text: "A car",   isCorrect: false }
      ],
      onCorrect: "An *ant*! Tiny but *mighty* -- they can carry things\nway bigger than themselves. (They've great little wings of will.)",
      onWrong:   "Ants are smallest. So *small* you can fit a hundred\non one of your hands -- and they'll all stay un-thunder-ed."
    },
    {
      question: "Which one of these is *not* alive?",
      options: [
        { text: "A puppy", isCorrect: false },
        { text: "A tree",  isCorrect: false },
        { text: "A spoon", isCorrect: true }
      ],
      onCorrect: "Yes -- *spoons* are not alive. (They never were.)\nPuppies and trees both *grow*. Spoons just stir.",
      onWrong:   "Spoons aren't alive! Puppies grow. Trees grow.\nSpoons just *help us eat*. They are mostly stainless, you know."
    }
  ],

  // -------- Lulumi: rhyme, colour, shape, words ------------------
  'peep_Lulumi_F_14': [
    {
      question: "Which of these *rhymes* with the word 'moon'?",
      options: [
        { text: "Spoon", isCorrect: true },
        { text: "Tree",  isCorrect: false },
        { text: "Cat",   isCorrect: false }
      ],
      onCorrect: "Yes -- *spoon* and *moon* end the same way.\nTry *spoon, moon, tune, balloon*: they sway.",
      onWrong:   "*Spoon* rhymes with *moon* -- they share an *-oon* sound.\nSay them aloud: *spoon, moon*. (Round, round.)"
    },
    {
      question: "Which season has *snow*?",
      options: [
        { text: "Summer", isCorrect: false },
        { text: "Winter", isCorrect: true },
        { text: "Spring", isCorrect: false }
      ],
      onCorrect: "*Winter*! Yes. The cold months, when frost\npaints the windows and snow muffles all that is lost.",
      onWrong:   "It's *winter*! Summer is hot. Spring is when\nflowers wake up. Winter has the snow, again."
    },
    {
      question: "What colour comes from *yellow + blue*?",
      options: [
        { text: "Pink",   isCorrect: false },
        { text: "Green",  isCorrect: true },
        { text: "Purple", isCorrect: false }
      ],
      onCorrect: "*Green*! Yellow and blue mix into green --\nlike grass, like leaves, like the freshest you've seen.",
      onWrong:   "Yellow + blue = *green*. Try it with paints!\n(Yellow + red = orange. Red + blue = purple, no taints.)"
    },
    {
      question: "How many sides does a *triangle* have?",
      options: [
        { text: "Two",   isCorrect: false },
        { text: "Three", isCorrect: true },
        { text: "Four",  isCorrect: false }
      ],
      onCorrect: "*Three*! 'Tri' means three -- it's even in the word.\nTri-angle. Tri-cycle. Tri-pod. (And every third bird.)",
      onWrong:   "*Three*! 'Tri' is hidden in the word for it -- look:\n*tri*-angle. *Tri*-cycle. (You'll find them in a book.)"
    },
    {
      question: "What letter does *APPLE* start with?",
      options: [
        { text: "A", isCorrect: true },
        { text: "P", isCorrect: false },
        { text: "B", isCorrect: false }
      ],
      onCorrect: "*A*! A is for Apple, and Ant, and Amelia,\nand Awesome, and Ankle, and Always-believe-ya.",
      onWrong:   "Apple starts with *A*. Try saying it slow:\n*Aaa*-pple. The first sound is the letter, just so."
    },
    {
      question: "Which of these is a *shape*?",
      options: [
        { text: "Circle", isCorrect: true },
        { text: "Tuesday",isCorrect: false },
        { text: "Yellow", isCorrect: false }
      ],
      onCorrect: "*Circle*! Round -- like a coin, or a wheel, or the moon.\nTuesday's a day, yellow's a colour. Different soon.",
      onWrong:   "*Circle* is the shape! Round, like a coin.\nTuesday is a day. Yellow is a colour. Each one, alone-going."
    },
    {
      question: "How many legs does a *cat* have?",
      options: [
        { text: "Two",   isCorrect: false },
        { text: "Four",  isCorrect: true },
        { text: "Eight", isCorrect: false }
      ],
      onCorrect: "*Four*! Cats walk on four. So do dogs, cows, and horses --\nthey're all called *quadrupeds*. (Fancy! Of courses.)",
      onWrong:   "Cats have *four*. Same as dogs and horses.\nThey're 'quadrupeds' -- four-foot, in four-legged forces."
    }
  ],

  // -------- Conaloo: gentle preference questions -----------------
  'animal_Conaloo_bear-butterly': [
    {
      isPreference: true,
      question: "What is your favourite *colour*, today?",
      options: [
        { text: "Pink"   },
        { text: "Blue"   },
        { text: "Yellow" },
        { text: "Green"  }
      ],
      onCorrect: "Mm. A fine choice. Each colour, you see,\nholds a different *feeling* -- and yours suits *thee*.",
      onWrong: ""
    },
    {
      isPreference: true,
      question: "If you could *be* any creature, just for one day --",
      options: [
        { text: "A bird"     },
        { text: "A fish"     },
        { text: "A turtle"   },
        { text: "A bear-butterly (like me)" }
      ],
      onCorrect: "Mm. I think you'd be *very* good at being that.\nYou'd notice things the rest of us miss.",
      onWrong: ""
    },
    {
      isPreference: true,
      question: "Which is your favourite *time* of day?",
      options: [
        { text: "Morning"             },
        { text: "Lunchtime"           },
        { text: "Afternoon (slow)"    },
        { text: "Bedtime (with lamps)"}
      ],
      onCorrect: "Mm. Yes. That hour, especially -- has a *colour*.\nIt's the colour of you, choosing your own dollar.",
      onWrong: ""
    }
  ],

  // -------- Amelia: preference questions, kid-pitched ------------
  'peep_Amelia_F_4': [
    {
      isPreference: true,
      question: "What do you most want to *eat* right now?",
      options: [
        { text: "An apple"     },
        { text: "Some toast"   },
        { text: "A whole cake" },
        { text: "A banana"     }
      ],
      onCorrect: "Excellent! Brilliant! A wonderful pick!\n(If I could eat, I would also be quick.)",
      onWrong: ""
    },
    {
      isPreference: true,
      question: "If you found a small door in your wall -- what's behind?",
      options: [
        { text: "A garden in winter"      },
        { text: "A library of EVERY book" },
        { text: "A tiny cafe for friends" },
        { text: "A wide blue sea"         }
      ],
      onCorrect: "Yes! That's the right answer for *you*. Doors\npick *people* -- and pick them based on what they're for.",
      onWrong: ""
    }
  ],

  // -------- mommy: gentle vocabulary ------------------------------
  'peep_mommy_F_30ish': [
    {
      question: "Which of these is a *tree*?",
      options: [
        { text: "Oak",     isCorrect: true },
        { text: "Sneaker", isCorrect: false },
        { text: "Soup",    isCorrect: false }
      ],
      onCorrect: "An *oak*! Yes -- one of the *biggest* of trees,\nwith small leaves and very long histories.",
      onWrong:   "Oak is the tree. Sneaker's a *shoe*, soup's for *dinner*.\n(Imagine eating a tree. You'd be a *very slow* winner.)"
    },
    {
      question: "Which of these *sounds* nicest, to you, today?",
      options: [
        { text: "A wind chime"          },
        { text: "Cooking on a stovetop" },
        { text: "Footsteps on a path"   }
      ],
      isPreference: true,
      onCorrect: "Lovely. The world makes such *quiet music* if you listen.\nEvery sound's a small song, on the wind it's been christened.",
      onWrong: ""
    },
    {
      question: "Which thing makes a *shadow*?",
      options: [
        { text: "Air",      isCorrect: false },
        { text: "Anything", isCorrect: true },
        { text: "Nothing",  isCorrect: false }
      ],
      onCorrect: "*Anything* -- yes! If light hits a thing,\nthe other side darkens. (A shadow's a *swing*.)",
      onWrong:   "*Anything* in the light makes a shadow behind.\nThe shadow's the *back* of the thing, in the kind."
    }
  ],

  // -------- Pepsi: silly preference -------------------------------
  'animal_Pepsi_dog-thing': [
    {
      isPreference: true,
      question: "Pepsi wants you to pick his *favourite stick* today!",
      options: [
        { text: "Long stick"  },
        { text: "Short stick" },
        { text: "Curly stick" }
      ],
      onCorrect: "A perfect choice! (boof.) Pepsi is now\nproud of *all* sticks -- but yours is the *bow*.",
      onWrong: ""
    },
    {
      isPreference: true,
      question: "What sound does Pepsi make when he's *very* happy?",
      options: [
        { text: "Boof"  },
        { text: "Woof"  },
        { text: "Snorf" }
      ],
      onCorrect: "Right! (Pepsi nods seriously.)\nThat is, indeed, *exactly* his happy noise. Mostly.",
      onWrong: ""
    }
  ],

  // -------- Tootsie: cheerful kindness ---------------------------
  'peep_Tootsie_friendly-cactus': [
    {
      isPreference: true,
      question: "Tootsie wants to hug someone! WHO?",
      options: [
        { text: "A friend"      },
        { text: "Your favourite teddy" },
        { text: "Yourself"      },
        { text: "Loosa"         }
      ],
      onCorrect: "EXCELLENT! That's a HUG well-CHOSEN!\nTootsie is *very* pleased. Her prickles have unfrozen.",
      onWrong: ""
    },
    {
      question: "What word means 'kind to others'?",
      options: [
        { text: "Friendly", isCorrect: true },
        { text: "Square",   isCorrect: false },
        { text: "Wet",      isCorrect: false }
      ],
      onCorrect: "FRIENDLY! YES! That's the WORD!\nSquare is a *shape*. Wet is *the third*.",
      onWrong:   "It's *friendly*! That's when you're warm to a friend.\nSquare's a *shape*. Wet is what *rain* will lend."
    }
  ]
};

/**
 * Pick a random unseen quiz for a character. Returns null if the
 * character has no pool, or a specific quiz object.
 *
 * `seenSet` tracks per-session "seen" so each is asked once before
 * any repeats.
 */
export function pickQuizFor(characterKey, seenSet) {
  const pool = quizzes[characterKey];
  if (!pool || pool.length === 0) return null;
  const unseen = pool.filter((_, i) => !seenSet.has(`${characterKey}:${i}`));
  const list = unseen.length > 0 ? unseen : pool;
  const idx = Math.floor(Math.random() * list.length);
  const quiz = list[idx];
  const realIdx = pool.indexOf(quiz);
  seenSet.add(`${characterKey}:${realIdx}`);
  return quiz;
}

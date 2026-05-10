/**
 * Inventory-aware character reactions.
 *
 * When Amelia walks up to a peep with a particular thing in her bag,
 * the peep may notice — and what they say is shaped by what they
 * see. This is where world coherence lives: mommy actually responds
 * to the cake, Cosenae actually wants the microscope, Tootsie
 * positively *erupts* at a banana.
 *
 * Each reaction is one or two lines, written to scan when read aloud.
 *
 * HotspotManager picks one of these (40% chance per click) when
 * Amelia carries something the speaker has lines about.
 */

export const inventoryReactions = {

  // -------- mommy --------
  'peep_mommy_F_30ish': {
    'thing_birthday-cake-with-one-candle': [
      "Oh -- a *cake*! With one candle, just so!\nI wonder whose day it is. Shall we go know?"
    ],
    'thing_books': [
      "A book in the bag is a kindness, really --\na small folded world that you carry, sincerely."
    ],
    'thing_teddybear': [
      "He doesn't say much, but he listens with care.\nGive him a squeeze. (He'll remember you there.)"
    ],
    'thing_flashlight': [
      "A torch! How clever. The mornings get blue --\nand a torch is for finding what *brunch* is for too."
    ]
  },

  // -------- daddy --------
  'peep_daddy_M_30ish': {
    'thing_birthday-cake-with-one-candle': [
      "Mm. Cake. With a candle. Whose day shall we sing?\n(I do hope it's mine. I love nearly *anything*.)"
    ],
    'thing_flashlight': [
      "A torch in the daytime is hope, if you ask.\nIt's *ready*. (And readiness counts as a task.)"
    ],
    'thing_banana': [
      "A banana's a snack of an *adventurer*.\nYou eat it midway, when you're feeling unsure."
    ],
    'thing_books': [
      "Bring it here, slowly. We'll read just a page.\nI'll do the voices. (You judge how I age.)"
    ]
  },

  // -------- Cosenae --------
  'peep_Cosenae_M_5': {
    'thing_microscope': [
      "OH! Did you bring my MICROSCOPE? Excellent news!\nI've a *pebble* with FACES, in close-up reviews."
    ],
    'thing_globe': [
      "The GLOBE! Spin it! Point! Where shall we *go*?\nIf it lands on the ocean, we'll need a small boat. (And a row.)"
    ],
    'thing_books': [
      "A book! Let me see -- I have *probably* read it.\n(I haven't. But I might. So let's just call it *credit*.)"
    ],
    'thing_hourglass': [
      "An *hourglass*! Marvellous! Time has a shape now!\nIt looks like a number eight, halfway, somehow."
    ]
  },

  // -------- Lulumi --------
  'peep_Lulumi_F_14': {
    'thing_books': [
      "A book in a bag is a *portable* thought --\nan unfolded world, of the sort I have caught."
    ],
    'thing_hourglass': [
      "Time in a glass is the calmest of clocks.\nI've added it, just now, to my list. (Sand and rocks.)"
    ],
    'thing_microscope': [
      "Hand me the lens? There's a moss on the wall.\nI'll add it to my list of *small things, after all*."
    ],
    'thing_flashlight': [
      "A torch is a fine thing to carry along --\nyou don't need to use it; just owning is strong."
    ]
  },

  // -------- Tootsie --------
  'peep_Tootsie_friendly-cactus': {
    'thing_birthday-cake-with-one-candle': [
      "A CAKE! WHOLE CAKE! With a CANDLE! TODAY!\nIt MUST be for *someone*! Let's all shout HOORAY!"
    ],
    'thing_banana': [
      "A SNACK! For a friend! Or for *me*! Or for *you*!\nFriends share their bananas. (That's just what they DO.)"
    ],
    'thing_teddybear': [
      "OH! A teddy! He's softer than ANY of mine!\n(I'm a cactus. I don't have a teddy. He's *thine*.)"
    ]
  },

  // -------- Conaloo --------
  'animal_Conaloo_bear-butterly': {
    'thing_teddybear': [
      "Mm. He looks a bit like me -- if you squint.\nHis wings are *imagined*. (Mine are real. -- Most days. Without stint.)"
    ],
    'thing_hourglass': [
      "I've decided that *time* is a friend of mine, slow.\nWe sit, and we don't speak. (And mostly, we know.)"
    ],
    'thing_birthday-cake-with-one-candle': [
      "A candle! A wish! And a someone-it's-for!\nThe sweetest of three things to bring through a door."
    ]
  },

  // -------- Pepsi --------
  'animal_Pepsi_dog-thing': {
    'thing_banana': [
      "Pepsi sniffs the banana. (snorf.) He's not sure.\n*Stick* is the food he prefers, to be pure."
    ],
    'thing_tyre': [
      "OH. A *tyre*. Pepsi's eyes go quite wide. (boof.)\nHe imagines it bouncing. He imagines a roof."
    ],
    'thing_teddybear': [
      "Pepsi nudges the teddy, gently, with nose.\nThe teddy says nothing. They are friends. (One supposes.)"
    ]
  },

  // -------- Konessa --------
  'peep_Konessa_has-flower': {
    'thing_books': [
      "A book? Oh -- read me a line. Just one will do.\nMy flower likes hearing things, even what's *new*."
    ],
    'thing_banana': [
      "My flower has *never* yet eaten one of those.\nI might offer her a *taste*. (She's lovely. She knows.)"
    ]
  },

  // -------- Loosa --------
  'peep_Loosa_cactus': {
    'thing_hourglass': [
      "-- I have something to tell you. -- I'll tell you it slow.\nThat hourglass and me? -- We're old friends. -- We know."
    ],
    'thing_flashlight': [
      "-- A torch. -- For the night. -- I do not need one.\nMy nights are the same as my days. (So they're none.)"
    ]
  }
};

/**
 * Pick a contextual line for the given character, given the player's
 * current inventory. Returns null if the character has no lines for
 * anything Amelia is carrying.
 */
export function pickInventoryReaction(characterKey, inventoryItems) {
  const reactions = inventoryReactions[characterKey];
  if (!reactions) return null;
  const matchingKeys = Object.keys(reactions).filter((k) =>
    inventoryItems.some((item) => item.key === k && item.count > 0)
  );
  if (matchingKeys.length === 0) return null;
  const key = matchingKeys[Math.floor(Math.random() * matchingKeys.length)];
  const lines = reactions[key];
  return lines[Math.floor(Math.random() * lines.length)];
}

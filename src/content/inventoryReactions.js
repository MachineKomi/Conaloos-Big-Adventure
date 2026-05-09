/**
 * Inventory-aware character reactions.
 *
 * When Amelia clicks on a character while carrying certain items, the
 * character may pick a *contextual* line referencing the item she has.
 * HotspotManager picks one of these (with ~40% chance per click when
 * applicable) instead of a normal line.
 *
 * Schema:
 *   characterKey -> {
 *     thingKey -> [response strings]
 *   }
 *
 * If the player has multiple matching items, one is picked at random.
 */

export const inventoryReactions = {
  'peep_mommy_F_30ish': {
    'thing_birthday-cake-with-one-candle': [
      "Oh! Is that a *cake*? Whose day is it, do you know?\nWe should sing them a song before the candle's dim glow."
    ],
    'thing_books': [
      "Bringing me a book? What a *fine* idea --\nLet's curl up by the window and read it, my dear."
    ],
    'thing_teddybear': [
      "He likes to be carried but doesn't say much --\nGive him a squeeze; he comforts the touch."
    ]
  },
  'peep_daddy_M_30ish': {
    'thing_birthday-cake-with-one-candle': [
      "A cake with one candle? That's *somebody's* one.\nLet's set out the napkins. The party's begun."
    ],
    'thing_flashlight': [
      "A torch, hm? Excellent. The mornings get dark --\nAnd a torch is for finding your slippers, *for a lark*."
    ],
    'thing_banana': [
      "A banana's the snack of an *adventurer*.\n(I'd say that out loud, but the kitchen would stir.)"
    ]
  },
  'peep_Cosenae_M_5': {
    'thing_microscope': [
      "OH! Did you bring my MICROSCOPE? I've been *looking*.\nA pebble I found has a face -- I'm not joking."
    ],
    'thing_globe': [
      "The globe! Spin it! Where shall we go today?\nIf you point at the ocean we'll need a *boat*, by the way."
    ],
    'thing_books': [
      "A book! Let me see --- I've maybe read it.\n(I haven't. But I might.) (I could pretend, said it.)"
    ]
  },
  'peep_Lulumi_F_14': {
    'thing_books': [
      "A book in a bag! That's a portable kind --\nA whole other world, *folded up* in your mind."
    ],
    'thing_hourglass': [
      "Time in a glass -- I find that quite calming.\nThe *now* turns to *was* with no need for alarming."
    ],
    'thing_microscope': [
      "Hand me the microscope -- there's a moss on the wall.\nI'll add it to my list of small things, after all."
    ]
  },
  'peep_Tootsie_friendly-cactus': {
    'thing_birthday-cake-with-one-candle': [
      "A CAKE? A WHOLE CAKE? With a CANDLE? *Today?*\nIt must be for someone. Let's all shout HOORAY."
    ],
    'thing_banana': [
      "A snack! For a friend! Or for me! Or for *you*!\nFriends share their bananas. (That's just what they do.)"
    ]
  },
  'animal_Conaloo_bear-butterly': {
    'thing_teddybear': [
      "Mm. He looks a bit like me, doesn't he?\nThough his wings are imagined. (Mine are real. Mostly.)"
    ],
    'thing_hourglass': [
      "I have decided about time. It's a friend.\nBut a slow one, who naps on the rug, and the bend."
    ]
  },
  'animal_Pepsi_dog-thing': {
    'thing_banana': [
      "Pepsi sniffs the banana. -- (snorf.) -- He's not sure.\n*Stick* is the food he prefers, to be pure."
    ],
    'thing_tyre': [
      "OH. A tyre. Pepsi's eyes go wide. (boof.)\nHe imagines it bouncing. He imagines a roof."
    ]
  }
};

/**
 * If the character has any reactions for items in inventory, return a
 * random one. Otherwise null.
 *
 * @param {string} characterKey
 * @param {Array<{key:string,count:number}>} inventoryItems
 * @returns {string|null}
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

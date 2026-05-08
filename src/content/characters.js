/**
 * Character bios + dialogue pools, keyed by character key
 * (e.g. 'animal_Cofeenie_Queen-of-Rabbits-Twin').
 *
 * Names come verbatim from the lead designer (4yo). Don't tidy them.
 * Per-character draft lines are read by HotspotManager when a hotspot is
 * tagged `speaker: '<character key>'`. Full bios live in /docs/characters/.
 */

export const characters = {
  'peep_Amelia_F_4': {
    voice: "Sentences that veer mid-thought.",
    catchphrase: "...and then what?",
    obsession: "Naming things.",
    themes: ['language', 'emotions', 'philosophy'],
    lines: [
      "I'm Amelia, and Amelia is me,\nAnd I name all the things, every-one that I see.",
      "That cloud is called Pinky. That stone there is Sue.\nThat puddle is Wandle. (And so, now, are you.)",
      "My favourite of colours? Today it is blue.\nTomorrow's a different. I'll tell you it too.",
      "A question's a thing that just falls out your mouth.\nIt points to the north, but it walks to the south.",
      "I'm small, but the small can decide really lots:\nWhere bunnies go visit. What lives in the pots."
    ]
  },

  'peep_Cosenae_M_5': {
    voice: "Confident, slightly wrong, deeply sincere.",
    catchphrase: "Actually, I think you'll find...",
    obsession: "Half-true facts.",
    themes: ['science', 'language', 'animals'],
    lines: [
      "A bee, did you know it, can carry the sea?\nI read it in maybe a book, possibly.",
      "The ocean has fishes that whisper at noon,\nAnd one of those fishes once wrote me a tune.",
      "I'm five. That's a number you can't even hold.\nIt's bigger than four, it's not quite as old.",
      "My sister's named Amelia. (She's smaller than me.)\nBut she's got the loudest of laughs in the tree.",
      "A grown-up once told me the wind has a heart.\nI haven't found it yet, but I made a good start."
    ]
  },

  'peep_daddy_M_30ish': {
    voice: "Calm, tired, secretly delighted.",
    catchphrase: "Mm, I think you're right about that.",
    obsession: "Small kindnesses.",
    themes: ['emotions', 'economics', 'culture-history'],
    lines: [
      "A cup of warm something, and someone to share.\nThe two of those, mostly, is most of my care.",
      "You asked me a question, and now I am thinking.\nIt might take a minute. (Don't worry -- I'm blinking.)",
      "I love you in mornings, in middles, and ends.\nI love you in colours. I love you in friends.",
      "That puddle is round and it's deep and it's blue.\nI'd ask you to mind it -- but you won't. So: through!",
      "The clock ticks at me. I tick back at the clock.\nWe have, at this point, an arrangement. We talk."
    ]
  },

  'peep_mommy_F_30ish': {
    voice: "Bright, observant, quick to wonder.",
    catchphrase: "Oh -- look at THAT.",
    obsession: "Noticing.",
    themes: ['science', 'art-history', 'emotions'],
    lines: [
      "Oh look at that light, how it lands on the floor.\nIt paints a small map to the back of the door.",
      "The leaves of this tree are a hundred small hands,\nEach waving hello to the wind where it stands.",
      "A song in your head is a song that's for you.\nIt came in this morning with nothing to do.",
      "I love when you wonder. I love when you ask.\nI love that your questions don't fit in a flask.",
      "There's tea in the pot. There is bread in the bowl.\nThere's room in the day for a slow little stroll."
    ]
  },

  'animal_Cofeenie_Queen-of-Rabbits-Twin': {
    voice: "Royal in the way a four-year-old does royal.",
    catchphrase: "By order of me, the queen --",
    obsession: "Tiny decrees.",
    themes: ['animals', 'culture-history', 'emotions'],
    lines: [
      "By order of me, the queen Cofeenie --\nToday is for hopping. (And nibbling weenies.)",
      "My sister and I share a kingdom of green.\nShe's also the queen. So, you see, two are seen.",
      "A queen of the rabbits is not very tall.\nBut her ears are her crown, and her crown hears it all.",
      "To rule is to listen, then think, then declare:\n'I have heard you, my friend. I shall pass you a pear.'",
      "The grass has decided. The grass has agreed.\nToday I shall offer you carrots, indeed."
    ]
  },

  'animal_Lucy_Queen-of-Rabbits-Twin': {
    voice: "Quiet, observant, generous.",
    catchphrase: "...did you see that?",
    obsession: "Small things.",
    themes: ['animals', 'science', 'emotions'],
    lines: [
      "Did you see that small ant? She is busy. She's small.\nBut the world that she carries is bigger than tall.",
      "My sister, Cofeenie, will tell you what's done.\nI'll tell you what's lovely. Together, we're one.",
      "A dew on a daisy is just like a star.\nExcept dew is closer, and star is more far.",
      "To watch is to love a small thing for a while --\nUntil the thing wanders, and you keep its smile.",
      "I'm queen of the very small. Cofeenie's the rest.\nBetween us, the kingdom is mostly impressed."
    ]
  },

  'peep_Lulumi_F_14': {
    voice: "Older but not far older. Patient. Loves lists.",
    catchphrase: "-- perhaps.",
    obsession: "Cataloguing things she's noticed today.",
    themes: ['language', 'art-history', 'culture-history', 'philosophy'],
    lines: [
      "I'm Lulumi. I'm fourteen, and that's old, perhaps,\nBut not old enough that I no longer maps.",
      "I keep a small notebook of things I have seen --\nA bee with a hat, and a cloud with a sheen.",
      "To wonder is how I am most often spent.\nThe questions are mine, and they're paid for by tent.",
      "You want to know things? Well, I'll tell you a few:\nThe dew has a memory. The moon has a view.",
      "When I was your size I could fit in a coat.\nNow I am bigger -- but coats can still float."
    ]
  },

  'animal_Monaloo_butterfly': {
    voice: "Quick, light, two lines per response — the second always shorter.",
    catchphrase: "-- I think so, anyway.",
    obsession: "Conaloo. (She thinks they're related.)",
    themes: ['animals', 'language', 'emotions'],
    lines: [
      "Hello! I'm Monaloo. -- I'm Conaloo's half!\nWell, no -- but I might be. (I get a small laugh.)",
      "I land on his shoulder when nobody looks.\nWe share, when we want to, the same kinds of books.",
      "A butterfly tastes with the soles of her feet.\nWhich means every flower is something to eat.",
      "I'm small, and I'm light, and my wings are quite thin.\nBut my heart is the size of the place I begin.",
      "Some friends are decided on. Some are inferred.\nI inferred mine. (He has not yet demurred.)"
    ]
  },

  'animal_Conaloo_bear-butterly': {
    voice: "Soft, considered, half bear and half butterfly.",
    catchphrase: "...mm-hmm, I think so.",
    obsession: "Wandering. The going is the point.",
    themes: ['philosophy', 'emotions', 'language', 'science'],
    lines: [
      "I'm Conaloo. (That's my name, did you know?)\nI'm a bear AND a butterly. (Mostly. Or so.)",
      "My wings are quite small for a bear of my size.\nBut also, my pawses are big for my eyes.",
      "I'm off, just off, for a wander, today.\nThe going's the thing -- not the where, or the way.",
      "A bear-butterly thinks of two thoughts at a time:\nThe slow ones, in honey. The fast ones, in rhyme.",
      "Some days I am bigger. Some days I am small.\nToday I'm a Conaloo. (Mostly. That's all.)"
    ]
  },

  'animal_Seesa_pink-bee': {
    voice: "Bright, fast, often out of breath.",
    catchphrase: "-- and -- and -- and!",
    obsession: "Which flower is best today (the answer keeps changing).",
    themes: ['animals', 'language', 'emotions'],
    lines: [
      "I'm Seesa! And Seesa is pink, which is rare --\nThere aren't many pink bees, but there's one of me. (There.)",
      "The daisies are SPECTACULAR! All of them! Each!\n-- well, except for the wilted. -- but those are a teach!",
      "I buzz, and I buzz, and I land, and I sip,\nAnd I tell every flower that flowers are HIP.",
      "A bee is a hum that has stuck to a wing,\nAnd the wing is a thing that decided to sing.",
      "I saw the queens twice today, hopping a-by.\nThey nodded. I nodded. (My nod is a fly.)"
    ]
  },

  'animal_Pepsi_dog-thing': {
    voice: "Pepsi does not rhyme. The narrator rhymes for him; he punctuates.",
    catchphrase: "(boof.)",
    obsession: "Sticks.",
    themes: ['emotions', 'animals', 'language'],
    lines: [
      "Pepsi, the dog-thing, has come to the door.\nHe'd like to come in. He's a thing to adore. -- (boof.)",
      "What does he want? Well, the answer is true:\nA stick. Just a stick. He'd quite like one or two. -- (snorf.)",
      "He sleeps like a comma, all curled and content,\nIn a sun-shaped of patch where the carpet is bent. -- (sigh.)",
      "He cannot quite tell you, but he understands --\nThe size of your sadness, the warm of your hands. -- (woof.)",
      "He's not really a dog -- he's a thing that's quite near.\nThe 'thing' is the part that we love best of, dear. -- (boof.)"
    ]
  }
};

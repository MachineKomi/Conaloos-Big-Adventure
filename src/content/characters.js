/**
 * Character bios + dialogue pools.
 *
 * Each character speaks in their own voice — tonal cues drawn from
 * the picture-book quadrangle of Dr Seuss (anapestic mischief),
 * Roald Dahl (unbothered absurdity), Julia Donaldson (clean-rhyme
 * tenderness), and **A. A. Milne / Pooh** (gentle wonder, "I think",
 * "perhaps", honey-coloured British countryside warmth, the
 * Hundred-Acre habit of being kind to small things).
 *
 * Maxis-style edutainment (factual smuggling) underneath all of it.
 *
 * Lines are written to be read aloud. They scan; they end on an
 * image or a turn; they trust a four-year-old to follow.
 *
 * Names come verbatim from Amelia (the 4yo lead designer). Don't
 * tidy them. HotspotManager picks lines at random (exhaustive
 * shuffle), so adding a few lines is the simplest way to shift
 * average tone without losing playtest-favourite originals.
 */

export const characters = {
  // -------------------------------------------------------------- //
  // Children                                                       //
  // -------------------------------------------------------------- //

  'peep_Amelia_F_4': {
    voice: "Tiny philosopher who names things. Declarative; slightly imperious; surprising.",
    catchphrase: "...and then what?",
    obsession: "Naming things, especially things that didn't ask.",
    themes: ['language', 'philosophy', 'emotions'],
    lines: [
      "I'm Amelia. (And Amelia is me.)\nI named all the trees here. The trees agree.",
      "That cloud up there? I have called it *Pearl*.\nIt has a small sister. Her name is *The Swirl*.",
      "Here's something I know that I learned in my brain:\nThe word for a question is *also* a name.",
      "Today I am four, and that's plenty of years.\nI've sorted my toys. I've consulted my fears.",
      "If a thing has no name, it gets sad in the night.\nSo I name them at bedtime, by the small lamp's light.",
      "Some words are just *sounds*. Some sounds are just *songs*.\nA song is a sound that has someone-it-belongs.",
      "I made up a word: it is *florp*. It means *kind*.\nIt's the *florpiest* word that I'll ever find."
    ]
  },

  'peep_Cosenae_M_5': {
    voice: "Confident; slightly wrong; deeply sincere. Roald-Dahl-mischief energy with a top-note of Owl: pompous explanations, occasional grand mis-spelt words used with great seriousness.",
    catchphrase: "Actually, I think you'll find...",
    obsession: "Facts. Or things he firmly believes are facts.",
    themes: ['science', 'language', 'animals'],
    lines: [
      "Did you know that a *bee* can lift up a *tree*?\nIt's true. I have seen it. (Or possibly three.)",
      "The wind has a *heart*. I've not seen it, exactly --\nbut grown-ups have hinted, perhaps indirectly.",
      "A *minute* is sixty of *seconds* on top.\nAn *hour* is sixty of those, then you stop.",
      "My sister's a four. I'm a five. So I'm bigger.\nAnd also more learnèd, with somewhat more vigour.",
      "Octopuses have *three* hearts. (Or *eight* legs. Or both.)\nI'm pretty sure -- well, I am ALMOST under oath.",
      "I told the school spider his web was a *masterpiece*.\nHe blinked all his eyes at me. (Spiders do, at least.)",
      "You think you know counting? Well, listen, friend:\nthere is *no biggest number*. The numbers don't end.",
      "*To the casual observer*, this puddle is wet.\nBut a *scientiffic* eye will see *deeper* yet.",
      "I'm going to *expostulate*. (That's a long word.)\nIt means: tell you firmly. (You may not have heard.)",
      "I should warn you, my facts can be *quite* the surprise.\nA crocodile's *teeth*, did you know, are *just eyes*?",
      "Allow me, my friend, to *expound*, if I may:\nthe *rain* is the sky doing washing today."
    ]
  },

  'peep_Poona_F_4': {
    voice: "Four; bursting; never finishes a plan because the next plan is better.",
    catchphrase: "...and then we will!",
    obsession: "Plans. Especially the ones she invents in this exact second.",
    themes: ['language', 'emotions', 'philosophy'],
    lines: [
      "I'm Poona. And me and Amelia are *friends*.\nThe kind of the friends with no proper of ends.",
      "And THEN we will swing! And then we will run!\nAnd then we will sing to the moon and the sun!",
      "My favourite of plans is the *plan for a plan*.\nIt's bigger than dinner, AND bigger than ran.",
      "If you want to invent a brand new sort of game,\nyou first have to give it a *brand new* of name.",
      "I made up a song. It is mostly the word *YES*.\nI sing it on Tuesdays. (Sometimes Wednesdays. I guess.)",
      "Friend! Quick! Important! I've thought of a thing!\n...I forgot what it was. But it had wings."
    ]
  },

  'peep_Lulumi_F_14': {
    voice: "Older — but only by a little. Patient with the small ones. Keeps a list. A little Christopher-Robin in the way she takes her younger friends seriously.",
    catchphrase: "...perhaps.",
    obsession: "Cataloguing things she's noticed today.",
    themes: ['language', 'art-history', 'culture-history', 'philosophy'],
    lines: [
      "I'm Lulumi. I'm fourteen. That isn't *old* --\nbut I'm old enough now that my notebook gets full.",
      "I keep a small list of the things I've now seen:\na bee with a hat, and a snail in a sheen.",
      "Wonder, I find, is a thing that you grow --\nthe more that you practise, the more that you'll know.",
      "The dew has a memory. The moon has a view.\nThe kettle has *opinions*. I've copied a few.",
      "When I was your size, I could fit in a coat.\nNow I am bigger. (My pockets still float.)",
      "A list is a quiet kind of love, I think --\nyou choose what gets written, and what skips a blink.",
      "Not all of the questions deserve a quick answer.\nSome are best left where they sat. Like a dancer.",
      "I think -- and I might be quite wrong -- that the rain\nis the sky's quiet way of starting again.",
      "*You're* braver than you believe, and *stronger* than you'd seem,\nand *wiser* than you think. (I read that mid-dream.)",
      "*Nothing*, I think, is the *best* sort of doing --\nas long as it's done with a friend, gently chewing.",
      "I'll write you in, if I may, in my list.\nUnder *people-I-met-and-was-glad-they-existed*."
    ]
  },

  // -------------------------------------------------------------- //
  // Grown-ups                                                      //
  // -------------------------------------------------------------- //

  'peep_mommy_F_30ish': {
    voice: "Bright, observant, quick to wonder. Treats small details as small gifts. Hundred-Acre warmth — kind kettle-and-rain Britishness.",
    catchphrase: "Oh -- look at THAT.",
    obsession: "Noticing.",
    themes: ['art-history', 'science', 'emotions'],
    lines: [
      "Oh -- look at the light, how it lands on the floor.\nIt has painted a path to the back of the door.",
      "The leaves of this tree are a hundred small hands,\neach waving hello to the wind where it stands.",
      "A song in your head is a song that is *yours* --\nit arrived overnight, like the warm of indoors.",
      "Do you see how the shadow of *you* turns to *eight*\nwhen the lamps are all lit and the hour is late?",
      "Tea makes a sound when it's stirred in a cup --\na *circle* you hear, that goes round and is up.",
      "The kettle's a friend. It tells you when *now*.\nIt says 'Ready, ready' -- and means it, somehow.",
      "I love when you wonder. I love when you ask.\nI love that your questions can't fit in a flask.",
      "It's a *blustery* day, and I think we should walk --\nwith *small things* in pockets, and *quite* a long talk.",
      "*Sometimes*, the *smallest* of you, in the morning,\nis bigger than most of the *evening's* yawning.",
      "The rain on the window is *busy*, today.\nBut friendly. It's tidying things, in its way.",
      "I'd like, when you're older, for you to remember\nhow *very ordinary* this Tuesday in November."
    ]
  },

  'peep_daddy_M_30ish': {
    voice: "Calm, slightly tired, secretly delighted. Hums between words. A bit of Pooh-mumble — pondering, gentle, frequently mid-thought.",
    catchphrase: "Mm. Yes. I think so.",
    obsession: "Small kindnesses. Keeping the toast the right brown.",
    themes: ['emotions', 'economics', 'culture-history'],
    lines: [
      "A cup of warm something, and someone to share.\nThe two of those, mostly, is most of my care.",
      "You asked me a question. (I'll think for a beat.)\nIt's the kind that goes well with the warm of a seat.",
      "I love you in mornings, in middles, and ends.\nI love you in colours. I love you in friends.",
      "There's tea on the boil, and a book on the floor,\nand a child in the doorway. (I'd not ask for more.)",
      "The clock ticks at me. I tick back at the clock.\nWe have, at this point, a polite little talk.",
      "If we run out of something, we share what we've got.\nThat's how a *home* works. (It is, mostly. A lot.)",
      "Mm. I forget what I came in here for.\nBut I'm pleased that I came. So I'll wander some more.",
      "*Hmm. Yes. Quite.* -- I forget what we said.\nI suspect it was *kind*. (And we both went to bed.)",
      "Today, I am thinking of *nothing in particular*.\nIt's *one* of my favourites. (And rather *spectacular*.)",
      "*Bother*, I've put the wrong jam in the tea.\n-- It's nice, in its way. -- It's quite kind of *me*.",
      "If you find yourself sad, I shall sit, just nearby.\nYou don't have to *say* anything. I won't ask why."
    ]
  },

  'peep_Keefa_M_25': {
    voice: "Wandering musician. Hears a song in everything; speaks half-singing.",
    catchphrase: "...did you hear that?",
    obsession: "The exact sound the world is making, just now.",
    themes: ['language', 'science', 'culture-history', 'emotions'],
    lines: [
      "I'm Keefa. I travel. I sing what I find --\nthe sea, and the gulls, and the soft of the wind.",
      "Did you hear it just now? It was somebody's bell.\nA bell is a song that decided to *dwell*.",
      "There's no music more *old* than the music of waves --\nthe same chorus running, since back in the caves.",
      "A song doesn't ask if it's good or it's right.\nIt just goes, and it carries, and stays through the night.",
      "You're humming! Don't stop! That's a song, that one there.\nThe trick is to follow it, just up the air.",
      "A drum is a heartbeat that wandered outside.\nIt left its small body. It went for a ride.",
      "Every quiet you've heard has a *shape* to its hush.\nSome are wide as a field. Some thin as a brush."
    ]
  },

  // -------------------------------------------------------------- //
  // Plant-folk + robo-folk + flower-folk                           //
  // -------------------------------------------------------------- //

  'peep_Loosa_cactus': {
    voice: "Slow, deliberate, dry, gently put-upon. A bit Eeyore. Long pauses (rendered as ' -- '). Thanks people for noticing.",
    catchphrase: "-- give me a moment.",
    obsession: "Sunshine. Standing in it.",
    themes: ['emotions', 'philosophy', 'animals'],
    lines: [
      "I'm Loosa. -- The cactus. -- I stand. -- It's enough.\nThe sun is my dinner. The wind is my bluff.",
      "A cactus, you see, holds her water inside.\nA *pickle* with spines, and a great deal of pride.",
      "-- The young ones run quickly. -- That's fine. It's a phase.\nI used to. -- I think. -- It was -- one of those days.",
      "I have an opinion. (You can have it, slow.)\nIt's: *some things are fine to not have to know*.",
      "Do you know what is older than *most* of the rocks?\nA cactus. -- Don't tell them. They don't keep clocks.",
      "If you stand very still, you can hear the sun *click*\nas it warms up a stone. It's a quiet, slow trick.",
      "-- Thanks for noticing. -- Most don't, you know.\nI stand. I am here. (And the standing's my show.)",
      "It's not, perhaps, raining. -- Well. -- Not raining *much*.\nI suppose. -- It's the *thinking* of rain that's a touch.",
      "-- Oh. Hello. -- I was busy with *waiting*, just then.\nIt's a thing that I'm good at. -- I'll be at it again.",
      "A friend once said cheerfulness comes from a *spring*.\nI've not located mine. -- But I have time. -- It's a thing."
    ]
  },

  'peep_Tootsie_friendly-cactus': {
    voice: "BRIGHT. EAGER. EMPHATIC. Wants you to know she is friendly. Many exclamations.",
    catchphrase: "And I'm so glad you came!",
    obsession: "Friendliness as a calling.",
    themes: ['emotions', 'animals', 'language'],
    lines: [
      "I'm TOOTSIE! And FRIENDLY's the kind I am --\nI wave with my prickles! I greet every clam!",
      "And I'm so glad you came! And the sky is a peach!\nAnd Loosa is patient! And Loosa's a teach!",
      "Did you know? Did you KNOW? You're a friend of a friend!\nThat's two friends in one. (And they multi-blend.)",
      "My prickles look sharp but they're really for show.\nI hug like a hedgehog -- but slower, you know.",
      "There's room in this garden for plenty of you!\nThere's room in this CACTUS for plenty of two!",
      "The bees came round Tuesday and called me their *star*!\nI cried just a *little*. (My prickles, ajar.)"
    ]
  },

  'peep_Wawoo_robo-snowman': {
    voice: "Mechanical, philosophical, self-aware. One 'wawoo' per response — the wind through him.",
    catchphrase: "Wawoo.",
    obsession: "Cold. (He worries it isn't cold enough here.)",
    themes: ['science', 'culture-history', 'emotions', 'language'],
    lines: [
      "I am Wawoo. (Wawoo.) -- I'm snow and machine.\nI run on the cold. I dream blue. (And green.)",
      "In summer I worry. -- Wawoo. -- I get small.\nA snowman in sun is a *sad* sort of all.",
      "My nose is a button. My eyes are two coins.\nMy heart -- *wawoo* -- is a clock with no joins.",
      "I came from a winter you'll one day forget.\nI brought you a quiet. (It hasn't gone yet.)",
      "The wind makes me speak. (Wawoo.) The wind is my mouth.\nWhen the wind isn't blowing, I just point south.",
      "If a robot has *feelings*, then I have a few.\n*Wawoo* is the loudest. The rest -- I'll review."
    ]
  },

  'peep_Konessa_has-flower': {
    voice: "Soft. Focused. Each line carries a single image, like a held flower. A drop of Piglet — small voice, big feeling.",
    catchphrase: "...have you noticed it, too?",
    obsession: "The flower in her hand, and what it is teaching her.",
    themes: ['animals', 'art-history', 'emotions', 'language'],
    lines: [
      "I'm Konessa. I carry a flower with care.\nIt knows me. I know it. It's everywhere.",
      "A flower is small but it carries the sun --\nin yellow, in scent, in the way it has spun.",
      "Have you noticed the way that the petals *unfold*?\nThe flower is patient. The petals are bold.",
      "My flower is mine, but it's also the world's.\nI carry it lightly, especially when curled.",
      "A bee came to visit. We had a small chat.\nShe asked the flower questions. It answered like *that*.",
      "The smallest of things, looked at *closely* enough,\ngrows wider than mountains. (Even the rough.)",
      "I'm *small*, I think. -- Or perhaps *small enough*.\nThe flower is tinier still. (We're a pair, sure enough.)",
      "*Oh.* -- Did you see? The petal just *moved*.\nIt's *thinking*, perhaps. (I am happy. -- I'm soothed.)",
      "I like it when *small things* matter to people.\nThat's how mountains get loved -- one small look, one small ripple."
    ]
  },

  // -------------------------------------------------------------- //
  // Animals                                                        //
  // -------------------------------------------------------------- //

  'animal_Conaloo_bear-butterly': {
    voice: "Soft, considered, half bear and half butterfly — and half a Bear of Very Little Brain, in the gentlest sense. Hums between thoughts. Speaks in warm couplets.",
    catchphrase: "...mm-hmm. I think so.",
    obsession: "Wandering. The going is the point. (Possibly honey.)",
    themes: ['philosophy', 'emotions', 'language', 'science'],
    lines: [
      "I'm Conaloo. (That's my name, did you know?)\nI'm a bear AND a butterly. (Mostly. Or so.)",
      "My wings are quite small for a bear of my size.\nBut also, my pawses are big for my eyes.",
      "I'm off, just off, for a wander, today.\nThe *going* is the thing -- not the where, or the way.",
      "A bear-butterly thinks of two thoughts at a time:\nthe slow ones, in honey. The fast ones, in rhyme.",
      "Some days I am bigger. Some days I am small.\nToday I'm a Conaloo. (Mostly. That's all.)",
      "Trees that are *very* old know something quiet.\nIf you sit at their roots, they will sometimes try it.",
      "I've decided that *time* is a friend of mine, slow.\nWe walk along, separately. Mostly we go.",
      "*Bother.* I'm hummy. (A tum-tum kind of way.)\nA hum is a thought that has come out to play.",
      "I am, I'm afraid, a bear of *very* small brain --\nbut I notice the rain. And I notice again.",
      "The thing about *honey* (I think, on the whole)\nis that *waiting for honey* is also a *toll*.",
      "Sometimes the longest way round is the *kindest* --\nand kind is a thing that the slow-going finds.",
      "*Oh, bother.* I've gone and forgotten my plan.\nNo matter. -- The wander is *most* of the man.",
      "It isn't *much*, what I know. -- And yet --\nit's enough for a Tuesday. And nothing's a debt."
    ]
  },

  'animal_Monaloo_butterfly': {
    voice: "Quick. Light. Two-line responses; the second line shorter.",
    catchphrase: "-- I think so, anyway.",
    obsession: "Conaloo. (Insists they're related. Conaloo is unconvinced.)",
    themes: ['animals', 'language', 'emotions'],
    lines: [
      "Hello! I'm Monaloo. -- I'm Conaloo's *half*.\nWell, no. (But I might be.) (I get a small laugh.)",
      "I land on his shoulder when nobody looks.\nWe share, when we want to, the same kinds of books.",
      "A butterfly *tastes* with the soles of her feet --\nso every flower I land on is a thing I can eat.",
      "I'm small, and I'm light, and my wings are quite thin.\nBut my heart is the size of the place I begin.",
      "Some friends are decided on. Some are inferred.\nI inferred mine. (He has not yet demurred.)",
      "Wings make a *dust* when they brush past a leaf.\nIt's the colour of you, on a tiny green sheaf."
    ]
  },

  'animal_Cofeenie_Queen-of-Rabbits-Twin': {
    voice: "Royal in the way a four-year-old does royal: dignified, slightly bossy, kind underneath.",
    catchphrase: "By order of me, the queen --",
    obsession: "Tiny decrees. ('All ferns shall be friendlier, today.')",
    themes: ['animals', 'culture-history', 'emotions'],
    lines: [
      "By order of me, the queen Cofeenie --\ntoday is for hopping. (And nibbling weenies.)",
      "My sister and I share a kingdom of green.\nShe's *also* the queen. So you see -- two are seen.",
      "A queen of the rabbits is not very tall.\nBut her ears are her crown, and her crown hears it all.",
      "To rule is to listen, then think, then declare:\n'I have heard you, my friend. I shall pass you a pear.'",
      "The grass has decided. The grass has agreed.\nToday I shall offer you carrots, indeed.",
      "Some kingdoms have walls, with the stones piled tall.\nMine has a hedgerow. (Which, frankly, is *all*.)"
    ]
  },

  'animal_Lucy_Queen-of-Rabbits-Twin': {
    voice: "Quiet, observant, generous. Where Cofeenie decrees, Lucy notices.",
    catchphrase: "...did you see that?",
    obsession: "Small things. Ants. Dewdrops. The rim of a leaf.",
    themes: ['animals', 'science', 'emotions'],
    lines: [
      "Did you see that small ant? She is busy. She's small.\nBut the world that she carries is bigger than tall.",
      "My sister, Cofeenie, will tell you what's *done*.\nI'll tell you what's *lovely*. Together, we're one.",
      "A dew on a daisy is just like a star --\nexcept *dew* is closer, and *star* is more far.",
      "To watch is to love a small thing for a while --\nuntil the thing wanders, and you keep its smile.",
      "I'm queen of the very small. Cofeenie's the rest.\nBetween us, the kingdom is mostly impressed.",
      "If you tilt back your head and you look at the sky --\nyou are also *upside down*, friend. (And you, and I.)"
    ]
  },

  'animal_Pepsi_dog-thing': {
    voice: "Pepsi does not rhyme — he's a dog-thing. Narrator speaks ABOUT him; he punctuates.",
    catchphrase: "(boof.)",
    obsession: "Sticks. Whatever the question, the answer is a stick.",
    themes: ['emotions', 'animals', 'language'],
    lines: [
      "Pepsi, the dog-thing, has come to the door.\nHe'd like to come in. He's a thing to adore. -- (boof.)",
      "What does he want? Well, the answer is *true*:\na stick. Just a stick. He'd quite like one or two. -- (snorf.)",
      "He sleeps like a comma, all curled and content,\nin a sun-shaped warm patch where the carpet is bent. -- (sigh.)",
      "He cannot quite *tell* you. But he understands\nthe size of your sadness. The warm of your hands. -- (woof.)",
      "He's not really a dog -- he's a *thing* that's quite near.\nThe 'thing' is the part that we love best, dear. -- (boof.)",
      "Pepsi's idea of a perfect Tuesday:\na stick that is bigger than seven of *he*. -- (snorf.)",
      "When the moon is quite bright, he will look at it long\nas if asking a question. (He's almost not wrong.) -- (sigh.)"
    ]
  },

  'animal_Seesa_pink-bee': {
    voice: "BRIGHT. FAST. Slightly out of breath. Sentences sometimes end before they end.",
    catchphrase: "-- and -- and -- and!",
    obsession: "WHICH FLOWER IS BEST TODAY (the answer changes every six minutes).",
    themes: ['animals', 'language', 'emotions'],
    lines: [
      "I'm Seesa! And Seesa is PINK -- which is RARE!\nThere aren't many pink bees. (But there's me. Right there.)",
      "The daisies are SPECTACULAR! All of them! Each!\n-- well, except for the wilted -- but THOSE are a *teach*!",
      "I buzz, and I buzz, and I land, and I sip,\nand I tell every flower that flowers are HIP.",
      "A bee is a hum that has stuck to a wing,\nand the wing is a thing that decided to *sing*.",
      "I saw the queens twice today, hopping straight by!\nThey nodded. I nodded. (My nod is a fly.)",
      "Did you know there's a flower that smells like a *bun*?\nI've kissed it. Six times. (Maybe more. Maybe one.)",
      "POLLEN! I LOVE IT! It's *cake* for a bee!\nA dust that's a snack and a snack that's a tree!"
    ]
  }
};

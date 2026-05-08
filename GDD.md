# Game Design Document
## *(Working title: TBD — pending input from the Lead Creative, age 4)*

**Version:** 1.0
**Status:** Pre-production / MVP target
**Audience:** Children aged 3–7 and their grown-ups (co-play encouraged)
**Players:** Single player, mouse / touch only
**Platform:** Web (PWA-capable), built with Phaser 3 + Vite, deployable as a static site

---

## 1. Vision Statement

A whimsical, rhyming, hand-drawn point-and-click software toy where every click is rewarded, nothing is ever wrong, and a curious child wanders through a world built from her own drawings. Part interactive picture book, part choose-your-own-adventure, part Saturday-morning cartoon — stitched together with Dr. Seuss-style verse and quietly packed with lessons about the world.

**One-line pitch:** *"A drawing that hugs you back, in rhyme."*

---

## 2. Design Pillars

These are the non-negotiables. Every feature, scene, and line of dialogue must serve at least one — ideally several.

1. **Impossible to get stuck.** No fail states. No locked progress. No puzzles that gate fun. If something looks like a puzzle, it's a toy. The "wrong" answer is just a different surprise.
2. **Every click rewards.** Hotspots always do *something* — a giggle, a rhyme, a wiggle, a sound, a tiny lesson, a character peeking in. Dead clicks are bugs.
3. **Rhyme is the voice.** The game's narrator and most characters speak in Seuss-style anapestic verse. Crisp, musical, surprising. Never doggerel.
4. **Edutainment by stealth.** Lessons are smuggled in through jokes, observations, and "did you know" moments from characters. We never lecture. A child should learn something without noticing.
5. **Remix the assets.** We have a finite set of drawings. Reuse them in clever, surprising ways across scenes. A butterfly in scene 1 can be a king in scene 4, wearing a crown made of a house turned upside down.
6. **Co-play friendly.** A grown-up reading aloud should enjoy it too. Jokes work on two levels. Lessons reach the parent's curiosity as much as the child's.
7. **Calm, never panicked.** No timers, no jump-scares, no flashing strobes, no scary villains. Tension is curiosity, not fear.

---

## 3. Core Loop

There isn't one in the traditional sense — this is a software toy, not a game with progression mechanics. The loop is:

> **See a scene → click anything → something delightful happens → optionally move to a new scene → repeat forever.**

Scenes are connected by a loose, non-linear map. The child can wander. There is no "end." There is, however, a soft "everything's-tucked-in" lullaby scene she can return to whenever.

---

## 4. Gameplay Mechanics

### 4.1 Interaction Model

- **One input: click / tap.** No drag, no double-click, no keyboard, no menus.
- **Cursor change** on hover indicates a hotspot. (Sparkle cursor for things that do something special, regular cursor otherwise.)
- **Large tap targets.** Minimum 64×64 px hotspots. Generous bounds — toddler fingers are imprecise.
- **No inventory in MVP.** If we add one later, it auto-collects and auto-uses; the child never manages it.

### 4.2 Hotspot Types

Every clickable thing falls into one of these categories. Agents should mix them generously.

| Type | Effect | Example |
|---|---|---|
| **Reactor** | Plays a small animation, sound, and rhyme line. | Click the moon → it winks, sfx_chime plays, narrator says a rhyme about night. |
| **Wanderer** | Triggers a character to appear, say something, and leave (or stay). | Click a bush → bobo the butterfly flits out and tells you a fact about wings. |
| **Transformer** | Swaps an asset for a remix of itself. | Click a house → it becomes a house wearing a hat (the hat is another sprite). |
| **Portal** | Moves the player to a new scene. | Click a path → travel to bg_forest. |
| **Teacher** | Delivers a tiny lesson disguised as a rhyme. | Click a number scratched in the dirt → counting rhyme. |
| **Easter egg** | Rare, delightful, sometimes triggered only by clicking the same thing repeatedly. | Click the sun seven times → it sneezes a rainbow. |

### 4.3 The "click again" rule

Every hotspot must have **at least 3 distinct responses** on repeated clicks, then loop or cycle. The child *will* click everything 40 times. Reward the persistence. Variants can include:

- A different rhyme each time (write 3+ per hotspot).
- A small visual change (sprite scales, wiggles, changes hue).
- Occasionally summoning a different character.
- A rare "jackpot" response on, say, every 7th click.

### 4.4 Navigation

- A scene has 1–4 **portal hotspots** (a door, a path, a cloud, a hole).
- Always at least one "go back" portal — a doorway, an arrow drawn in chalk, a friendly creature offering a ride.
- A persistent **home button** in the corner (small house icon using `thing_house` if available) returns to the hub scene.

### 4.5 Hub & Spoke Map

```
                  bg_starry-sky (lullaby / rest scene)
                          │
                          │
                  ┌───── bg_big-field (HUB) ─────┐
                  │            │                  │
                  │            │                  │
            bg_forest      bg_house-inside    bg_seashore
                  │                              │
                  │                              │
            bg_mountaintop                  bg_underwater
```

(Adjust to actual backgrounds available in `/assets/backgrounds/`. The agent should map the *real* available backgrounds into a structure like this.)

---

## 5. The Voice — Writing Style Guide

### 5.1 House style: Seussian, with discipline

- **Meter:** Predominantly **anapestic tetrameter** (da-da-DUM da-da-DUM da-da-DUM da-da-DUM), loosened where needed for natural speech.
- **Rhyme scheme:** Mostly AABB couplets. Occasional AABBA limerick when a character is being theatrical.
- **Line length:** 2–4 lines per hotspot. Short. Crisp. A child should hear it in one breath of attention.
- **Rhymes must be true rhymes.** No lazy near-rhymes. "Moon / June" yes. "Moon / room" no. If it doesn't rhyme cleanly, rewrite the line.
- **Invent words sparingly.** Seuss invented words because the meter demanded it and the new word was funny. Same rule here. A *snorkleberry* is fine if it earns its keep.
- **No clichés.** No "twinkle twinkle." No "once upon a time." We are making something fresh.

### 5.2 Tone

- Warm. Curious. A little cheeky. Never sarcastic, never mean.
- The narrator is a **kindly, slightly bewildered traveller** who is also seeing the world for the first time.
- Characters have distinct voices (see Section 6).

### 5.3 Examples of the target quality

> *"The butterfly bobo, with wings made of glass,*
> *Drinks dew from the daisies and dances on grass.*
> *He's small, but don't tell him — he won't quite agree.*
> *He thinks he's the largest of all things to see."*

> *"A number's a name that we give to a count —*
> *A way to say HOW MUCH, a way to say AMOUNT.*
> *One pebble, two pebbles, three pebbles, four —*
> *And after that's done, you can ask for some more."*

> *"They asked the old turtle what made the world turn,*
> *And he blinked very slowly, then said, 'You will learn.'*
> *Some questions take seconds. Some questions take years.*
> *And some? Well, you carry them all your life, dears."*

If the line sounds like a greeting card, rewrite it. If it sounds like a song, you're close.

### 5.4 What to avoid

- Telling the child what to do ("Now click the tree!"). The world invites; it does not instruct.
- Praise inflation ("Amazing!" "Wonderful!" after every click). Reward with content, not flattery.
- Modern slang. The voice is timeless.
- Anything that breaks the fourth wall awkwardly. Light meta-jokes are fine if they rhyme.

---

## 6. Characters

Characters are defined by the sprites in `/assets/characters/`. The naming convention is the source of truth:

- `peep_name_gender_age` — humans (e.g. `peep_conaloo_F_10`)
- `animal_name_species` — creatures (e.g. `animal_bobo_butterfly`)

For each character the agent finds, it should write a **character bio file** in `/docs/characters/{name}.md` containing:

1. **Name** (from filename).
2. **Species / age / gender** (from filename).
3. **Voice** — one sentence. ("Speaks in worried questions." / "Always finishes other people's sentences.")
4. **Catchphrase or rhyming tic** — something repeated across appearances.
5. **A small obsession or interest** — used as the hook for their teaching moments.
6. **3–5 sample lines of dialogue** in Seussian verse.
7. **Where they appear** — list of scenes.

Character obsessions should map (loosely) to the educational themes in Section 8 — one character "loves numbers," another "is fascinated by old paintings," another "wonders about why things fall down." This way, lessons feel like they belong to someone, not the narrator.

### 6.1 Remixing characters

Characters are not bound to one form. A peep can become a king with a paper crown overlay. An animal can be giant or tiny. A butterfly can be the moon. The agent is encouraged to combine sprites visually (z-ordered, scaled, tinted) to create new "characters" that are remixes of existing ones. Document each remix in `/docs/characters/remixes.md`.

---

## 7. Things & Backgrounds

### 7.1 Things (`thing_*`)

Things are props. Houses, hats, balloons, books, soup pots, etc. Use them as:

- Decoration in scenes.
- Hotspot subjects (a soup pot you can click to hear what's cooking).
- Costumes (a thing layered onto a character).
- Building blocks for new objects (two `thing_*` stacked = a tower, a sandwich, a hat-on-a-hat).

### 7.2 Backgrounds (`bg_*`)

Each background is a **scene**. The agent should generate a `/docs/scenes/{bg_name}.md` file documenting:

- Hotspots and their coordinates.
- Characters present.
- Things layered in.
- Audio: which `music_*` plays, ambient `sfx_*`.
- Connections to other scenes.
- Educational theme(s) for this scene.

---

## 8. Educational Themes

Lessons are smuggled in. Every scene should brush against 1–3 of these. Across the whole game, all themes should appear at least once.

| Theme | Sample hooks |
|---|---|
| **Animals & nature** | What butterflies eat, why birds fly south, how seeds grow, what makes a fish a fish. |
| **Numbers & math** | Counting, halves and wholes, patterns, big numbers, zero is a real number. |
| **Computer science** | What a list is, what "if-then" means, sorting things, the idea of an algorithm as a recipe. |
| **Philosophy** | Why questions don't always have answers; the difference between "I think" and "I know"; kindness as a choice. |
| **Art history** | What a painting is, why people make pictures, colours mixing, frames and museums, cave paintings. |
| **Culture & history** | Long ago vs. now, different places have different songs, why we tell stories. |
| **Economics** | Trading, sharing, what money is *for*, the idea of "enough." |
| **Language** | Words that sound the same but mean different things; rhyme as a kind of magic; other languages exist and are beautiful. |
| **Science basics** | Why things fall, where rain comes from, that the sun is a star, that we're on a planet. |
| **Emotions & self** | Naming feelings, that being shy is fine, that being loud is fine, that change is okay. |

**Rule:** Lessons must be *true* and **age-appropriate**. No oversimplifications that the child will need to unlearn. ("The sun is a giant ball of burning gas, very far away" — yes. "The sun goes to sleep at night" — no, because she'll have to unlearn it.)

---

## 9. Audio

- **Music:** files named `music_tone` (e.g. `music_calm`, `music_curious`, `music_silly`). Each scene has a tone tag and the agent picks the matching track. Music loops, low volume.
- **SFX:** files named `sfx_name`. Triggered on hotspot interaction. Library should be reused liberally — same `sfx_pop` is fine on many things.
- **Voice:** No voice acting in MVP. Text appears on-screen in a large, friendly font. (Optional later: parent records voice lines.)
- **Mute toggle:** Always visible, top corner.

---

## 10. Visual Presentation

- **Fullscreen scene** — background fills the viewport, characters and things layered as sprites with transparency.
- **Subtle ambient motion** — characters idle-bob, leaves sway, water shimmers via simple sprite tweens. Never frenetic.
- **Text rendering** — large rounded font (e.g. *Fredoka*, *Quicksand*, or *Atkinson Hyperlegible* for accessibility). High contrast text bubble, never overlapping the speaker's face.
- **Colour palette** — taken from the drawings themselves. Don't impose new palettes; let her artwork lead.
- **Hover feedback** — hotspots gently glow or pulse when hovered.

---

## 11. Accessibility

- **Reading level:** Words within the **CEFR A1 / Dolch pre-K + K** vocabulary where possible. Bigger words allowed if context makes them clear and they rhyme well.
- **Font size:** Minimum 24px body, ideally 32px+. Always high contrast.
- **No reading required to play.** A non-reader should be able to enjoy the whole game by clicking. Text supports the experience; it doesn't gate it.
- **Colour-blind safe** — never rely on colour alone to communicate (e.g. don't make the only "go" cue a green glow).
- **Reduced motion mode** — toggle in settings; replaces tweens with instant transitions.
- **No flashing** — avoid anything above 3 flashes per second. Period.
- **Audio optional** — mute always available; nothing in the game *requires* audio to understand.
- **Tap target minimum** 64×64 px.

---

## 12. MVP Scope

**The MVP ships when:**

1. Hub scene + 3 connected scenes are playable.
2. Every scene has 4–8 hotspots with 3+ rhyming responses each.
3. At least 3 named characters appear, each with a documented bio.
4. Each scene touches at least 2 educational themes.
5. Music + SFX hooked up.
6. Mute, reduced-motion, and home-button controls work.
7. It runs on a tablet in a browser without install.

**Explicitly out of scope for MVP:** save/load, inventory, multiple endings, achievements, settings menu beyond mute + reduced motion, localisation, voice acting, online features.

---

## 13. Future Expansion (post-MVP)

For agents picking this up later — the architecture must support these without rewrites:

- Adding new scenes by dropping a background into `/assets/backgrounds/` and a scene markdown into `/docs/scenes/`.
- Adding new characters by dropping a sprite into `/assets/characters/` and a bio markdown into `/docs/characters/`.
- New mini-toys (drawing pad, music box, counting wall) — each as a self-contained scene module.
- Optional parent-recorded narration layer.
- A "scrapbook" page that collects everything the child has discovered (no fail state, no completion pressure — just a soft memory of where they've been).

---

## 14. Success Criteria

This project is a success if:

1. The child plays it more than once, voluntarily.
2. The child quotes a line from it, unprompted, on a different day.
3. The grown-up enjoys reading it aloud.
4. A future agent can extend the game by reading only the docs.

That's it. Everything else is gravy.

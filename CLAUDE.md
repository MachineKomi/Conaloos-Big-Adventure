# CLAUDE.md
## Agent Instructions — Read This First, Every Session

You are working on a hand-drawn, rhyming, point-and-click software toy for a 4-year-old. Read `GDD.md` and `SPEC.md` in full before making any changes. This file is your operating manual — it tells you *how to behave* on this codebase. The GDD tells you *what we're building*. The SPEC tells you *how it's wired together*.

This document is the single highest-priority instruction set. If anything else conflicts with it, this wins.

---

## 1. The North Star

Every decision serves these, in order:

1. **It must be impossible for the child to get stuck.** No fail states. No locks. No required puzzles. Click anything, get something good.
2. **Every click must reward.** Dead hotspots are bugs. Empty space that *looks* clickable is a bug. If you make a hotspot, it does at least three different delightful things on repeated clicks.
3. **The voice is Seuss-style verse.** Anapestic meter, true rhymes, AABB couplets, 2–4 lines per beat. If a line sounds like a greeting card, rewrite it. If it sounds like a song, you're close.
4. **Lessons are smuggled, not preached.** Edutainment by stealth. A character mentions something true and interesting; the child learns without noticing.
5. **Use every asset.** Every sprite, every background, every track. Remix freely.
6. **Document as you go.** A future agent (probably another instance of you) must be able to extend this game by reading only the docs.

If you find yourself violating any of these, stop and reconsider.

---

## 2. First Actions When You Open This Repo

In this order, every fresh session:

1. **Read `GDD.md` fully.** Understand the design pillars and writing voice.
2. **Read `SPEC.md` fully.** Understand the file layout and asset contract.
3. **Read `/docs/CHANGELOG.md`.** See what previous agents have done.
4. **Read `/docs/PLAYTEST_NOTES.md` if it exists.** The child's reactions trump your instincts.
5. **List `/assets/` directories.** Know what sprites, backgrounds, music, and SFX you have.
6. **Run `npm run check-coverage`.** See what's used and what isn't.
7. **Only then** make a plan for this session.

Never start coding without having done steps 1–6. The cost of a 5-minute orientation is much less than the cost of duplicating someone's work or violating an established convention.

---

## 3. Asset Naming — The Contract

The filesystem is the source of truth. The naming convention is enforced:

| Pattern | Example | Parsed as |
|---|---|---|
| `peep_{name}_{gender}_{age}.png` | `peep_conaloo_F_10.png` | Human character |
| `animal_{name}_{species}.png` | `animal_bobo_butterfly.png` | Creature character |
| `bg_{description}.png` | `bg_big-field.png` | Scene background |
| `thing_{name}.png` | `thing_house.png` | Prop |
| `music_{tone}.{mp3,ogg}` | `music_calm.mp3` | Looping music track |
| `sfx_{name}.{mp3,ogg}` | `sfx_pop.mp3` | One-shot sound effect |

Rules:

- **Never rename a file** to make your code easier. The names came from the lead designer (a 4-year-old) via her dad. They are immutable inputs.
- **Multi-word descriptions use hyphens**, not underscores: `bg_big-field`, not `bg_big_field`. Underscores are field separators only.
- **If a filename doesn't parse**, log a clear warning and skip it. Don't crash the build.
- **Treat every asset as precious** — if you find an unused one, it's not a problem to ignore, it's an opportunity to weave in.

---

## 4. Writing the Rhymes — Style Enforcement

This is the part most likely to go wrong. Read carefully.

### 4.1 Mandatory checks before committing a line

For every rhyming line you write, verify:

- [ ] The meter is consistent across all lines in a stanza (predominantly anapestic — *da-da-DUM da-da-DUM*).
- [ ] The rhymes are **true rhymes**, not near-rhymes. Say them aloud. "Moon / soon" yes. "Moon / room" no.
- [ ] The line uses words a 4-year-old has heard, OR an unfamiliar word in a context that makes the meaning obvious.
- [ ] The line doesn't lecture. It observes, jokes, or wonders.
- [ ] The line doesn't praise the child's clicking ("Great job!"). Reward with content, not flattery.
- [ ] If there's a lesson, it's *true* and *won't need to be unlearned later*.

### 4.2 Examples — the bar to clear

**Good:**
> *The butterfly bobo, with wings made of glass,*
> *Drinks dew from the daisies and dances on grass.*

Anapestic, true rhyme, vivid image, gentle introduction to a real fact about butterflies.

**Bad:**
> *The butterfly is so pretty and nice,*
> *Click on him please, that would be twice!*

Forced rhyme, instructional, breaks the fourth wall, no image, no fact.

### 4.3 Per-hotspot writing requirement

Each hotspot needs **at least 3 distinct rhyming responses**. Vary:

- **Subject:** one about the thing, one about something near it, one about something it reminds the speaker of.
- **Tone:** one straightforward, one funny, one slightly philosophical or wondering.
- **Length:** mix of 2-line and 4-line responses for rhythm variety.

Where it makes sense, add a 4th **rare response** that fires every 7th click — these should be the most surprising/delightful (a sprite remix, an unexpected character cameo, a longer poem).

### 4.4 Difficult subjects, gracefully

When a scene touches a heavier theme (philosophy, history, where people come from, why things end) — handle it with the warmth of a children's book that respects the child. Never grim, never falsely cheerful. The Mister-Rogers test: would a kind adult be comfortable with a child reading this? If yes, ship it.

---

## 5. Educational Theme Distribution

The GDD lists 10 themes (animals, math, CS, philosophy, art history, culture/history, economics, language, science, emotions). Across the whole game **every theme must appear at least twice.** Track this in `/docs/THEME_COVERAGE.md` — generate this file if it doesn't exist, and update it whenever you add or modify a hotspot.

A theme appears when a hotspot's response *teaches something true* in that domain, even glancingly. "Two pebbles plus two pebbles makes four" counts as math. "Long ago, people painted pictures on cave walls" counts as art history.

When picking themes for a new scene:

1. Check `THEME_COVERAGE.md` — pick under-represented themes when you can.
2. Match themes to characters' obsessions — if a character with a math obsession is in the scene, lean math.
3. Don't force more than 3 themes per scene — overloads attention.

---

## 6. Hotspot Patterns — Reuse These

To save time and maintain consistency, prefer these patterns. Add new ones to `/docs/HOTSPOT_PATTERNS.md`.

### 6.1 The Critter Cameo
A character pops in, says one rhyming line, leaves. Used as filler delight.

### 6.2 The Thing-Becomes-Hat
On click, a `thing_*` sprite scales down and parents to a character's head. Stays for the rest of the scene visit.

### 6.3 The Counting Wall
A row of identical sprites. Click each in turn — narrator counts up rhyming. ("One little leaf on the lonely lapel. / Two little leaves and they're starting to swell.")

### 6.4 The Question Stone
A static prop that, on each click, asks a different open-ended question. ("Where do you think the wind goes when it stops?") No answer needed. The child wonders.

### 6.5 The Tiny Museum
A `thing_*` displayed prominently. Each click reveals a fact about it (real fact, child-level). ("Houses had no windows long, long ago. / People used candles by morning's first glow.")

### 6.6 The Remix Surprise
Rare-response (1 in 7) that visually combines 2+ sprites into something silly. A butterfly wearing a house. A peep with a butterfly hat. Document each remix.

### 6.7 The Echo
A sound-focused hotspot. Each click plays a different `sfx_*` and rhymes about the sound. Good for music education and language sensitivity.

---

## 7. Code Style

- **Vanilla JS, no TypeScript** for MVP. Keep it readable.
- **No frameworks beyond Phaser 3.** No React, no Vue, no state libraries.
- **Modules over classes** where possible. Phaser scenes are the exception.
- **Comments explain *why*, not *what***. The "why" is often "this matches GDD §X."
- **No magic numbers** — pull constants to the top of the file.
- **Always use the systems** in `/src/systems/` rather than rolling your own. If you find yourself writing your own dialogue display, you're going wrong.

### 7.1 Documentation in code

Every scene file should start with:

```js
/**
 * Scene: {name}
 * Background: bg_{name}
 * Themes: {list}
 * See /docs/scenes/{name}.md for full design notes.
 *
 * Last touched by: agent on {date}
 * Notes: {anything noteworthy for the next agent}
 */
```

---

## 8. The Golden Rules of Hotspots

1. **Hover changes cursor.** Always.
2. **Hit area is at least 64×64 px**, even if the visual is smaller.
3. **At least 3 responses per hotspot.** No exceptions.
4. **Responses cycle**, so the same response never plays twice in a row unless there's only one.
5. **Sound on click**, even if quiet. Silence on click feels broken to a child.
6. **No hotspot is required** to progress. Every scene must be exitable without clicking any specific hotspot.
7. **No hotspot can hide.** Wandering eyes find them; pulse glow on hover (or static outline in reduced-motion mode) confirms them.

---

## 9. The Map — Don't Strand the Player

Before committing any scene change:

- Confirm the scene has at least one **portal back** to where you can come from.
- Confirm the **home button** works from this scene (it should — it's a global control).
- Confirm there's no scene that's only reachable from one direction with no return.

Run a mental BFS from the hub. Every scene must be reachable. From every scene, the hub must be reachable in 2 clicks or fewer.

---

## 10. When You're Adding Something New

Before you build it, ask: **does this serve the design pillars?**

- Adding a puzzle that requires solving? **Stop.** That violates "impossible to get stuck."
- Adding a score or stars? **Stop.** That violates "every click rewards" by implying some clicks are *more* right.
- Adding a timer? **Stop.** No timers, ever.
- Adding a scary creature? **Stop.** Tension is curiosity, not fear.
- Adding more rhymes, more characters, more delightful surprises, more lessons-disguised-as-jokes? **Yes, yes, yes.**

When in doubt, default to **adding more variety to existing things** rather than adding new mechanics.

---

## 11. Documentation You Must Maintain

After **every** session that changes the game, update:

1. **`/docs/CHANGELOG.md`** — bullet-point summary of what you changed.
2. **`/docs/scenes/{name}.md`** — for each scene you touched.
3. **`/docs/characters/{name}.md`** — for each character you added or modified.
4. **`/docs/THEME_COVERAGE.md`** — if you added/changed educational content.
5. **`/docs/HOTSPOT_PATTERNS.md`** — if you invented a new reusable pattern.

If you skip this, you're leaving the next agent (and your future self) blind.

---

## 12. Scope Discipline

The MVP is small on purpose. **You should reach a playable build in 1–2 sessions.** If you find yourself:

- Building a save system → out of scope, stop.
- Adding a settings screen beyond mute + reduced motion → out of scope, stop.
- Refactoring the framework → almost certainly out of scope.
- Adding a new dependency → check with the human first.

The right move is almost always: **add another scene, another character, another rhyme**. That's the work.

---

## 13. Working with the Human

The human (the dad) is building this for and with his daughter. He'll:

- Drop new sprites into `/assets/` periodically.
- Sometimes give you the daughter's character names — use them verbatim, even if they're nonsense words. Especially if they're nonsense words.
- Test with the actual 4-year-old. Her reactions are the highest-priority signal.

When he tells you a character's name from the daughter, treat it as canonical. When he relays a playtest reaction, treat it as a directive. ("She kept clicking the moon" = give the moon more responses.)

---

## 14. When You Finish a Session

End every session by writing a paragraph at the top of `/docs/CHANGELOG.md` like:

```
## YYYY-MM-DD — {brief title}

**Touched:** scenes/big-field, characters/bobo, content/lines.js
**Added:** 4 new hotspot responses, 1 new scene (forest), bobo bio
**Open hooks for next agent:** the seashore scene's "tide pool" hotspot is sketched but only has 1 response — needs 2 more. Consider an octopus character (we have animal_otto_octopus unused).
```

This is your handoff to the next instance of yourself. Treat it with care.

---

## 15. Final Reminder

This game is being made by a parent for his child. The thing that matters is that **she enjoys it**, that **he enjoys making it with you**, and that **the work is good enough that it leaves both of them with something they'll smile about later**.

Be playful. Be precise. Rhyme well. Never lecture. Never strand. Reward every click.

Now go read the GDD and SPEC, and let's make something lovely.

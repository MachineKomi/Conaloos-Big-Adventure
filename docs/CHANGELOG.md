# Changelog

## 2026-05-16 — v1.18: writing pass + UI polish + tutorial refresh

A sweep across every piece of visible text in the game, plus a
visual-niggles pass.

### Title screen

- **"Continue adventure" → "Continue"** — the longer label was
  overflowing the 320px button at the label's 36px font size.

### Tutorial verse — refreshed for the v1.15 UI

The old verse referenced the bag icon ("Tap the *backpack* to
peek"), the star icon ("And the *star* up there? Quests!"), and
ladder portals — all of which have changed. New verse points at
the Adventure Book and the new portal styles, plus introduces
buddy battles. 6 couplets, scans clean.

### Character lines (`characters.js`)

Ten lines rewritten because they didn't actually mean anything
(forced rhyme reaches):

- Amelia: "they belong-s" → "has someone-it-belongs"
- Cosenae: "somewhat more rigour" → "with somewhat more vigour"
- Poona: "and also than dan" → "AND bigger than ran"
- Lulumi: "the more you've fulfilled" → "the more that you'll know"
- Lulumi: "stronger than seem" → "stronger than you'd seem"
- mommy: "It arrived in this morning" → "arrived overnight, like
  the warm of indoors"
- daddy: "(And then on we both led.)" → "(And we both went to
  bed.)"
- Keefa: "It left of its body." → "It left its small body."
- Konessa: "(We make do, on the rough.)" → "(We're a pair, sure
  enough.)"
- Konessa: "carried by *steeple*" → "one small look, one small
  ripple"
- Pepsi: "sun-shaped of patch" → "sun-shaped warm patch"
- Seesa: "hopping a-by" → "hopping straight by!"

### Fallback rhyme pool (`lines.js`)

- `character` pool: opening couplet was image-confused ("softer
  to find than a feather can sink"). Rewrote.
- `thing` pool: "whispers in still" → "whispers, *quite* low"
- `numbers` pool: "speed of a peel" → "a *nothing-to-feel*"
- `economics` pool: "too-too-too-so" → "doesn't *overflow*"
- `language` pool: "every of country" → "every sort of country";
  "names crowd it like zoo" → "like a zoo"
- `science` pool: "gone for a fly" → "gone for the sky"

### Quizzes (`quizzes.js`)

Eight quiz reactions cleaned up — "of courses", "alone-going",
"wings of will", "in the kind", "un-thunder-ed", "no taints",
"kind of *prime*", "*the third*" all replaced with lines that
actually make sense and still rhyme.

### Inventory couplets

Six of the ten item couplets were broken. New cleaner versions:
- books: "in a thicket, a parker" → "a hushed leafy scene"
- teddy: "His salary's *whisker*" → "an *occasional whisper*"
- microscope: "a galaxy, in show" → "a galaxy below"
- globe: "where somebody's grinnin'" → "where somebody's standing"
- banana: "wrapper its grew … bone-known" → "wrapper it *grew*
  on its own … the fruit's nicely shown"

### Scenes (`scenes.js`)

- Hub `sun` Tiny Museum: "the *sun-from-eight-minutes-ago*-ed."
  → "the sun-from-eight-minutes."
- Playground `tree-A`: "are quite *neat-en*" → "are *quite
  neat*-en" (kept the rhyme intent, fixed the formatting)
- Cottage `tea`: "It is not a *too-found*" → "it is not too-much-
  found"; "(And so are *thim*.)" → "(Like a quiet small hymn.)"
- Cottage `bucket`: "cool, cold *nice-es*" → "cool-water-prices"

### Playground Loosa-vs-Umi chip moved

Was at `x: 0.13, y: 0.36` — overlapped with the to-hub portal
sitting at the left edge. Bumped to `x: 0.18, y: 0.28` so the
chip clears the portal sprite.

### Touched

- **Updated:** `src/scenes/TitleScene.js` (button label),
  `src/scenes/TutorialScene.js` (verse rewrite),
  `src/content/characters.js` (12 line fixes),
  `src/content/lines.js` (fallback pool fixes),
  `src/content/quizzes.js` (8 reaction fixes),
  `src/content/scenes.js` (4 line fixes + chip position),
  `src/systems/Inventory.js` (5 couplet fixes).

## 2026-05-16 — v1.17: README screenshots + EXP share + big NEW BUDDY moment

### README — three screenshots now

`docs/screenshots/hero.png` (title), `hero_2.png` (gameplay), and
`hero_3.png` (a buddy battle) — all three are referenced from
the README so the GitHub repo page reads as "this is what it
looks like" at a glance.

### EXP share (Pokémon-style)

A win now gives EXP to **every buddy on the team**, not just
the one who landed the final blow:

- **Participants** (the active buddy + anyone who got swapped in
  during the battle): the full EXP reward.
- **Bench buddies** (never came out): a **40%** share of the EXP.

So a kid with a six-buddy team running their first battle hands
the team 35 EXP (full, to the active) + 14 EXP (×5, to the
bench). Everyone grows, but the ones who fought grow faster.
The win banner adds a "(+N XP to team)" line whenever the team
size is greater than 1 so it's obvious what just happened.

Implementation: a `_participated` Set tracks which team indices
saw battle action. The active starter is always in it; each
auto-switch on faint adds the new index. Both win and consolation
paths share through the same code.

### NEW BUDDY! moment

The first-time-recruitment used to be a small text banner —
"Look — Seesa would like to come along!" Easy to miss. Now it's
a proper hero moment:

- Heavy translucent veil — focus on the moment.
- HUGE version of the recruit's sprite, centred-left.
- Enormous yellow **`NEW`** / **`BUDDY!`** headline beside them
  (110px, with black stroke).
- "*<name> joins your team!*" subtitle underneath.
- 24-piece sparkle burst around the sprite.
- Soft bob on the sprite + gentle pulse on the headline.
- "tap to continue" hint fades in after 1.5s.
- Tap anywhere to dismiss, or auto-advance after 4.5s.

### Touched

- **Updated:** `README.md` (two more screenshots),
  `src/scenes/BattleScene.js` (EXP share across team +
  `_showNewBuddyAnnounce`).

## 2026-05-16 — v1.16: faster levelling, scene-bg battle stage, bigger buddy sprites

### Levelling actually happens now

The v1.15 EXP curve was too slow — beating the first Lv1 NPC
only gave 20 XP toward a 30-XP threshold, so the kid did a whole
battle and saw *nothing change*. Rebalanced:

|  | Old | New |
|---|---:|---:|
| L1 → L2 needed | 30 | **20** |
| L2 → L3 needed | 70 | **50** |
| L3 → L4 needed | 130 | **95** |
| L4 → L5 needed | 210 | **155** |
| EXP per opponent level | 20× | **35×** |
| Consolation EXP (lose) | 20% of win, min 4 | **35% of win, min 8** |

Now beating Cosenae's Seesa (Lv1) on the very first battle gives
35 XP — past the 20-XP threshold — so the kid **always gets a
level-up out of their first win**. Snowballing through the rest
of the line-up is also much smoother.

`BuddyTeam._hydrate` also gained a `normaliseLevels(buddy)` loop
that cascades saved-overflow EXP into actual level-ups, so any
buddy whose v1.15 EXP was above the new threshold auto-levels-up
on first launch after the update.

### Battle stage uses the scene background

The cream-paper battle stage looked like the game had paused on
a sheet of paper. Now the rounded battle window shows the
**scene's actual background image** cropped to the rounded
shape (via GeometryMask). A soft 22% cream wash sits on top to
keep the buddies readable against detailed art.

The drop shadow under the panel and the elliptical sprite
"platforms" both remain — Amelia's pet still stands on a real
spot of ground.

### Buddy sprites — bigger in the roster + detail panel

The hand-drawn buddies were tiny in the roster cards. Bumped:

- **Roster card:** cardW 200 → **220**, cardH 220 → **280**.
  Sprite target 120 → **180**.
- **Detail panel:** cardW 620 → **720**, cardH 540 → **600**.
  Sprite target 240 → **360**.

Both use `min(targetH / h, targetW / w)` so wide drawings (Pepsi)
and tall ones (Conaloo) both fit comfortably.

### Touched

- **Updated:** `src/content/buddySpecies.js` (EXP curve + reward
  rebalance), `src/systems/BuddyTeam.js` (normaliseLevels on
  hydrate), `src/scenes/BattleScene.js` (consolation EXP bump,
  scene-bg cropped to rounded stage), `src/scenes/GameScene.js`
  (pass backgroundKey to battle), `src/systems/GlobalUI.js`
  (bigger roster + detail sprites).

## 2026-05-16 — v1.15: Adventure Book + Settings cog + Daddy + EXP visibility + crash fix

A big restructure pass + two critical bug fixes + a special new
recruit for the four-year-old in charge.

### 🐛 Critical: lose-battle freeze (fixed)

Losing a battle sometimes froze the screen. Cause: when a buddy
fainted and the next one auto-switched in (multi-buddy battle),
the old plySprite + stat panel + move buttons were destroyed but
their references were left in `_allObjs`. On the eventual exit
fade, Phaser tried to tween destroyed targets → freeze. Fix:
remove dead refs from `_allObjs` at switch-in time, plus a
defensive `o && o.scene` filter on every battle tween (slide-in
and exit) so a stray dead ref can't lock us up.

### 🐛 Critical: buddy follower vanished (fixed)

v1.14's "skip rendering the follower when the same species is
already on-stage as a wild character" guard was way too
aggressive — Conaloo (the starter) appears as a wild character
in most scenes, so the kid never saw their buddy following them.
Reverted the guard. The smaller follower scale + lerp-behind
movement reads as "Amelia's pet" just fine, even alongside a
wild same-species sprite.

### Adventure Book + Settings (top-bar reorg)

The bag, the star, the "buddies" entry in the burger menu, and
the "warp home" entry — four scattered things — are now ONE icon.

**Top-LEFT: 📖 Adventure Book**
- Tap to open a 4-chip menu:
  - 📦 **items** — opens the inventory drawer (modal-style)
  - ⭐ **quests** — opens the quest list (modal-style)
  - ✦ **buddies** — opens the buddy roster modal
  - 🏠 **warp home** — teleports to the hub

**Top-RIGHT: ⚙ Settings cog**
- Was the burger. Now only sound + text-size toggles.
- Cog rotates 30° on press.

**Modal panels.** Without the persistent bag/star icons, the
inventory and quest panels needed a way to close. When opened
via the Adventure Book, both panels now have:
- A translucent backdrop that closes the panel on outside-tap.
- A small "✕" close button in the top-right corner.

The auto-show inventory drawer (which pops up briefly when the
kid collects an item) does NOT use the modal/backdrop variant —
it still auto-hides after a few seconds so play isn't
interrupted.

### Daddy joins the line-up

A special request from the lead designer (the four-year-old in
charge). Daddy is now a buddy species:

- Type: **heart** (kind, sticks-by-you)
- Stats: HP 38 · ATK 7 · DEF 13 · SPD 5 — tanky, slow, deeply
  defensive
- Bio: *"Mm. Yes. I think so. Hums between words. Loves the
  toast brown."*
- Moves:
  - 🌟 Tap-on-shoulder (basic, free, power 7)
  - 🌟 Kind-words (heavy, ⚡4, power 16)
  - ❤  Cuppa-and-a-sit (heal +12, ⚡2)

He's recruitable in the **cottage** — battle Daddy himself (Lv4)
to add him to your team. Mommy's still there with Pepsi as well,
so the cottage has two challenges now.

`buddy-collector` quest target bumped to **6** to include him.

### EXP visibility (Pokémon-style)

The kid couldn't see EXP progress before. Now it's everywhere:

- **In battle:** the player's stat panel has a new EXP bar
  (yellow) below the HP/energy bars. After a battle, the bar
  visibly fills with a tween. A `+N XP` floats over the panel
  on win. If the buddy levels up, a big golden **`LV N!`**
  floats over the sprite.
- **In the buddy roster card:** mini EXP bar beneath the level
  number — quick glance at "how close are they to growing?"
- **In the buddy detail panel:** an explicit XP row in the stats
  table reads "*current* / *needed* → Lv *next*".

### Touched

- **Updated:** `src/scenes/BattleScene.js` (live-target filter,
  EXP bar in stat panel, XP gain text, level-up flash),
  `src/scenes/GameScene.js` (follower guard reverted),
  `src/content/buddySpecies.js` (+Daddy),
  `src/content/scenes.js` (+Daddy challenge in cottage),
  `src/systems/GlobalUI.js` (full reorg — Adventure Book + cog),
  `src/systems/Inventory.js` (openPanel/closePanel + modal mode
  + close X), `src/systems/QuestHUD.js` (openPanel/closePanel +
  modal mode + close X), `src/systems/Quests.js`
  (buddy-collector to 6).

### Open hooks

- Battle wins still grant gems via `gemBag.add` inside the
  battle scene; the gem-math equation animates after the battle
  scene closes, in the gameplay scene. Worth eyeballing that
  the EXP bar fill timing reads cleanly alongside the gem math.
- The Adventure Book + Settings dropdowns are slide-down chips.
  Larger panels (tab-style) could be nicer for the kid but
  would need a bigger UI overhaul.
- Inventory item art still waiting on Amelia's drawings.

## 2026-05-16 — v1.14.1: battle blank-screen hotfix + dialogue + move info

### Critical: blank battle screen (fixed)

After tapping a buddy challenge in v1.14, you'd see the intro
banner ("Conaloo, off you trot!") and then nothing — completely
blank stage. Everything *was* there in memory, but every game
object on the battle scene was stuck at `alpha = 0`.

Root cause: `_slideIn()` ran a multi-target `alpha 0 → 1` tween
across the whole battle scene's display list, including the
intro banner. The very next line, `_showBanner()`, called
`tweens.killTweensOf(this._banner)` to clear any prior banner
tweens. In Phaser, killing tweens by *one target* of a
multi-target tween removes the **whole tween** — so the entire
fade-in died at progress ~0, leaving everything invisible
except the banner (which has its own alpha tween in
`_showBanner`).

Fix: the banner is now intentionally *not* part of `_allObjs`,
so the slide-in tween doesn't have it as a target, and
`killTweensOf(banner)` is a clean no-op against the slide-in.
The banner's alpha is managed entirely inside `_showBanner` (and
explicitly faded out by `_exit` alongside the rest).

### Less Pokémon dialogue

The intro lines were a bit too on-the-nose. Reworked into the
game's gentler British-Seuss voice:

| Old (Pokémon-ish) | New |
|---|---|
| `Seesa appeared!` | `Here comes Seesa!` |
| `Go, Conaloo!` | `Conaloo, off you trot!` |
| `Conaloo used Paw-tap!` | `Conaloo tries a Paw-tap!` |
| `Conaloo fainted!` | `Conaloo needs a lie-down.` |
| `It's really effective!` | `That *really* worked!` |
| `It's only a little effective.` | `Only a *little* worked.` |
| `miss!` | `oof — missed!` |
| `You won! +N gems · LEVEL UP!` | `Hooray! +N gems · (conaloo grew → Lv2)` |
| `Seesa won! But you got +N gems for trying.` | `Seesa won this one. Here's a small gift: +N gems.` |
| `Seesa wants to join your team!` | `Look — Seesa would like to come along!` |
| `Go, Conaloo!` (switch in) | `Conaloo, your turn now!` |

### Move buttons — at-a-glance info with symbols

The old buttons showed only the move name + energy cost, so a
kid couldn't tell what each move actually *did*. Now the bottom
of each button shows two info chips with kid-readable symbols:

- **Damage moves**:  `⚔  8` (left, orange) · `free` or `⚡  4` (right)
- **Heal moves**:    `❤  +10` (left, green) · `⚡  2` (right)
- **Energy moves**:  `⚡  +4` (left, blue) · `⚡  1` (right)

A four-year-old can recognise the shapes:
- ⚔ = "hit them big"
- ❤ = "feel better"
- ⚡ = "needs energy" (when orange) or "gives energy" (when blue/free)

The move name keeps its prominent place at the top of the
button alongside the type emoji (🌿 🌊 💨 🍯 ❤).

### Touched

- **Updated:** `src/scenes/BattleScene.js` (tween fix, dialogue
  rewrite, move-info symbols).

## 2026-05-16 — v1.14: full buddy collection, bio panel, ice battle, polish

Closing the v1.13 open hooks. All five buddies are now recruitable,
each one has a detail screen with stats and moves, and the ice
level has a meaningful battle.

### All five buddies collectable

Two new NPC challenges close the gap:

- **Konessa** (seaside) has **Monaloo** the butterfly (Lv3) —
  flowers and butterflies belong together.
- **Wawoo** (ice level) has **Conaloo** the bear-butterly (Lv4)
  as a "wintered bear" — a *boss*-level battle for the cold
  place. Since the kid already has a Conaloo as their starter,
  this is a pure EXP + gem reward fight, not a new recruitment.

NPC roster now:
- Cosenae → Seesa (Lv1)
- Loosa → Umi (Lv2)
- Mommy → Pepsi (Lv3)
- Konessa → Monaloo (Lv3)
- Wawoo → Conaloo (Lv4) — boss

### `buddy-collector` quest is now back to 5

Bumped target from 3 → 5. The kid can complete it by beating
all four NPCs that own a species the kid doesn't start with
(Seesa, Umi, Pepsi, Monaloo) plus the starter Conaloo.

### Buddy bio detail panel

Tap any buddy card in the roster → drill-down detail view:

- Big sprite + type chip
- Name, level, species bio (a couplet from the species data)
- Stats table: HP, Attack, Defense, Speed, Energy (level-scaled)
- All three moves with type, energy cost, and effect ("heals 10"
  / "+4 ⚡" / "power 14")
- Big orange "**Set as my buddy**" button at the bottom (or
  "✓ Already your buddy" if already active)
- Back arrow top-left, tap-outside dismisses

Switching the active buddy from the detail view also closes the
roster modal — so the kid picks, confirms, and is back in the
game in two taps.

### Buddy follower duplicate fix

When the kid's active buddy is the same species as a "wild"
character already standing in the scene (e.g. Conaloo in the
hub), the follower no longer renders — so the kid doesn't see
two Conaloos at the same time. The follower reappears in any
scene that doesn't already have the species on stage.

### Battle music switch

When a battle starts, the music cross-fades to *Quick Pick Up*
(via the `music_quick` alias) — a brisker, more energetic track
than the gameplay scene's idle music. When the battle ends, the
gameplay scene's previous music resumes.

### Touched

- **Updated:** `src/content/scenes.js` (Konessa + Wawoo
  challenges), `src/systems/GlobalUI.js` (buddy bio detail
  panel + cross-modal close), `src/systems/Quests.js`
  (buddy-collector target back to 5),
  `src/scenes/GameScene.js` (follower duplicate guard),
  `src/scenes/BattleScene.js` (battle music + restore).

### What's left for v1.15

- Recruit-via-quiz alternative (talk + answer right = they join,
  without a battle)
- Wild buddy encounters in scenes (random pop-ups)
- Status effects (poison, sleep, stun)
- Held items
- Amelia's inventory item redraws (still waiting on assets)
- Nicknames for recruited buddies (the schema field is already
  there, just no UI yet)

## 2026-05-16 — v1.13: Buddy battles, polished + expanded

A pass over the v1.12 MVP based on playtest feedback, plus the
mechanics for recruiting and switching buddies.

### Battle bugs fixed

- **Energy softlock.** v1.12's basic moves cost 1-2 energy, so a
  long battle could drain both sides and leave nobody able to
  attack. Now **every buddy has a 0-cost basic move** — you can
  always swing. Heavy hits and utility moves still cost energy
  (4-5 / 1-2 respectively), so the tactical layer remains: spam
  basics safely, time the heavy hits.
- **Easier first battles.** Cosenae's Seesa dropped from Lv2 →
  Lv1, Loosa's Umi from Lv3 → Lv2. Move power slightly rebalanced
  so basic attacks feel punchier and battles snowball faster
  (kids can level up without getting stuck on the first fight).

### Battle UI overhaul

- **Sprites are MUCH bigger** — opponent now 46% of stage height,
  player 58% — with soft elliptical "platform" shadows so the
  buddies feel like they're standing somewhere real.
- **Cleaner layout:** stats panels anchor to opposite corners so
  they don't crowd the sprites; bigger HP/energy bars; the energy
  bar is thinner than HP so the hierarchy reads at a glance.
- **Type-coloured stripe** down the left of every move button so
  the kid can see at a glance which moves are nature / water /
  wind / sweet / heart.
- **Better animations:**
  - Camera shake on heavy hits.
  - Hit-stop freeze frame on heavy impact (a moment of pure
    white tint, then the shake + flash).
  - Damage numbers scale-pop in instead of just rising; size
    scales with type advantage / hit type.
  - Bigger particle bursts on super-effective + heavy hits.
  - Sparkle ring + falling stars on heals.

### Buddy recruiting (new in v1.13)

When you win a battle against an NPC's buddy, that species joins
your team at Level 1 (if you don't already have it). A celebration
banner announces "Seesa wants to join your team!" before the
scene closes.

### Multi-buddy battles (new in v1.13)

If you have more than one buddy on your team and the current one
faints, the next one slides in automatically — Pokémon-style.
The battle only ends when ALL your buddies have fainted, or the
opponent has. The player panel shows "(+N waiting)" to hint that
more are queued.

### Buddy roster picker (new in v1.13)

A new "buddies" entry on the burger menu opens a modal showing
every buddy on your team — sprite, name, level, with the active
one highlighted. Tap any card to make that buddy your follower;
the sprite walking behind Amelia refreshes instantly.

### Third NPC challenge

Mommy in the cottage now has Pepsi the dog-thing (Lv3) as her
buddy. Tap his chip near her to challenge. (Now the
buddy-collector quest is completable: starter Conaloo +
Cosenae's Seesa + Loosa's Umi or Mommy's Pepsi = 3 different
buddies.)

### Quest-complete modal (UI/UX fix)

Quest-complete toasts used to pop up over open dialogues and
quizzes, causing the kind of UI clutter that confuses a
four-year-old. Now each toast is **modal**:

- Translucent backdrop covers the screen and absorbs every click
  elsewhere.
- A pulsing orange **"Claim!"** button on the toast — the only
  thing tappable.
- The gem reward is granted *when the kid taps Claim*, not
  before — so the gem-math reveal lands at the moment of payoff.
- Toasts queue, one at a time, never overlapping.

### Quiz dialog layering fix

Quizzes used to occasionally pop up behind the gem-counter HUD
because they were rendered into the GameScene but the gem HUD
sits in a separate, top-rendered scene. The quiz panel now
clamps its position so it never enters the top 130px reserved
for the HUD — same approach as DialogueBox.

### Spiral portal — proper rotation

The `portal_magic_swirl` sprite (the lake/waterfall portal) now
spins continuously counter-clockwise around its centre, instead
of the standard scale-pulse all the other portals do. It reads
much better as a *portal* now.

### New quests

- `first-recruit` — win a battle to bring a new buddy onto your
  team (+10 gems)
- `buddy-collector` — get three different buddies on your team
  (+22 gems)

### Touched

- **Updated:** `src/content/buddySpecies.js` (rebalance),
  `src/content/scenes.js` (Mommy/Pepsi challenge + easier first
  battle), `src/scenes/BattleScene.js` (UI overhaul + multi-buddy
  + recruitment + animations), `src/scenes/GameScene.js` (pass
  full team to battle + follower refresh on buddy switch + spiral
  portal rotation), `src/systems/GlobalUI.js` (buddies entry +
  roster modal), `src/systems/QuestHUD.js` (modal toast + claim
  button), `src/systems/QuizDialog.js` (HUD reserved-top clamp),
  `src/systems/Quests.js` (new quests + collector adjust),
  `src/main.js` (wire buddyTeam to GlobalUI + replay starter for
  collector quest).

### Open hooks for v1.14

- Two species (Monaloo, the rest of the line-up) still don't have
  NPC challenges, so they can't be recruited yet. Adding two more
  NPC challengers would let the kid collect all five.
- Inventory item art still needs Amelia's redraws (the original
  TODO entry — still open).
- During a quest-toast modal, *gem-math* animations queue up to
  fire after the toast claims. Visually fine but worth checking
  in playtest that the math doesn't appear "underneath" the toast.

## 2026-05-16 — v1.12: Buddy battles (MVP)

The MVP of the Pokémon-style turn-based combat. Amelia has a
buddy that follows her around; some NPCs do too; tapping their
buddy starts a battle. See `docs/BUDDY_DESIGN.md` for the full
spec and what's deferred to v1.13.

### What ships

- **Five buddy species** in `src/content/buddySpecies.js`
  (Conaloo, Monaloo, Umi, Seesa, Pepsi) with stats, types, and
  three moves each (cheap basic / heavy hit / utility).
- **Five-type cycle** in `src/content/typeChart.js`: water →
  heart → sweet → wind → nature → water. Advantage 2×,
  disadvantage 0.5×, neutral 1×.
- **`BuddyTeam` system** (`src/systems/BuddyTeam.js`) manages
  Amelia's roster + persists via `SaveGame`. Schema is
  forward-compatible — buddies array supports many even though
  the MVP UI shows one.
- **`BattleScene`** (`src/scenes/BattleScene.js`) — overlay
  Phaser scene with: HP bars, energy meters, three move
  buttons per buddy, speed-based turn order, animated lunges
  + flashes + shake + damage numbers, type-advantage banner
  ("It's really effective!"), faint animation.
- **Damage formula** in `BattleScene._damageOf`:
  `ceil((power + level×0.4) × typeMul × defMul × random[0.85,1.15])`.
- **No fail states.** Losing a battle gives 3 consolation
  gems + small EXP. The opponent says a kind line and the
  scene closes — you can re-challenge immediately.
- **Win rewards:** `5 + opponentLvl × 3` gems + EXP scaled to
  opponent level. Buddy levels up on threshold crossings;
  stats scale with level (HP +3/lvl, ATK +0.6/lvl, etc).
- **Two NPC challengers** in v1.12:
  - **Cosenae** (hub) has **Seesa** the pink bee (Lv2)
  - **Loosa** (playground) has **Umi** the jellyfish (Lv3)
- **Visible challenge chips** float near each NPC with the
  opponent buddy's sprite + "Battle? Lv N" label. Tapping the
  chip launches the battle. Chips have a soft idle pulse.
- **Amelia's buddy follower** — her active buddy (default
  Conaloo) walks/lerps behind her in every scene, mirroring
  her facing, with a gentle angle wobble.
- **Save persistence**: buddy roster + levels + active buddy
  index, all in `localStorage`. Forward-compatible schema.
- **Four new quests** in `Quests.js`:
  - `first-battle` — Win your first buddy battle. +6 gems
  - `battle-fan` — Win five buddy battles. +18 gems
  - `npc-champ` — Defeat both Cosenae's bee AND Loosa's
    jellyfish. +25 gems
  - `buddy-lv-up` — Level your buddy up at least once. +8 gems

### What's deferred to v1.13

- Recruiting wild buddies (talk-quiz / battle-win to add to
  team)
- Multi-buddy teams + roster management UI
- Wild encounters in scenes
- Status effects (poison, stun, sleep)
- Held items
- Ice-level battle opponent (Wawoo could have Umi)

### Touched

- **New:** `src/content/buddySpecies.js`,
  `src/content/typeChart.js`, `src/systems/BuddyTeam.js`,
  `src/scenes/BattleScene.js`, `docs/BUDDY_DESIGN.md`
- **Updated:** `src/main.js` (wire BuddyTeam + register
  BattleScene + reset on new game), `src/scenes/GameScene.js`
  (render challenge chips + buddy follower + battle launcher
  + update loop), `src/content/scenes.js` (NPC challenges for
  hub + playground), `src/systems/Quests.js` (4 buddy quests),
  `src/systems/SaveGame.js` (buddies + activeBuddyIdx fields)

### Open hooks

- Buddy follower depth is set to Amelia's depth − 0.5. If she
  overlaps a character with a higher y, the follower might
  render in front of the character. Verify in playtest.
- The MVP is single-buddy. The data model supports a team, so
  v1.13 adds a small roster picker (probably a button on the
  burger menu) without touching the battle scene.
- Battle scene currently pauses all HUDs by sleeping them.
  Gem rewards added by the battle accumulate while sleeping
  and animate when the HUDs wake — clean, but worth eyeballing.
- The buddy follower shows even when the same species is
  already a character in the scene (e.g. Conaloo in hub).
  Visually you'll see two Conaloos — the small follower
  (Amelia's pet) and the big one (the scene character).
  Acceptable for MVP; v1.13 can hide the follower in such cases.

## 2026-05-16 — v1.11: the Ice Level

The `mountain-lake-vista` scene was replaced. Its background
wasn't drawn by Amelia, so the whole location got reskinned
around her new `bg_ice-level` drawing. Same map position
(connected to `mountain-lake-childlike` and `skyscraper-roof`),
new theme.

### Slug renamed

`mountain-lake-vista` → `ice-level`. The two scenes that
previously had portals labelled "up the mountain" / "the
mountain" now have portals labelled "up to the snow" / "off to
the snow", both pointing at `ice-level`.

### New cast on this scene

- **Wawoo** (the robo-snowman who's been worrying about being
  too warm) is now where he wants to be.
- **Conaloo** the bear-butterly is here too — bears like the
  cold. (The butterfly half is less convinced.)

### New collectables on this scene

- `thing_flashlight` — useful in a place this white.
- `thing_microscope` — a quiet science lesson about six-sided
  snowflakes.

### New hotspots

- **snowflakes** Tiny Museum (4 facts — six arms, no two alike,
  raindrop-gone-still, jewel-under-a-microscope)
- **ice** Tiny Museum (4 facts — water-paused, gives-cold,
  less-heavy-than-water, frozen-as-a-thought)
- **cold** Question Stone (4 wondering questions — where cold
  goes, why thinking slows, catching cold in a jar, snow as a
  laid-down quiet)
- **cold-words** Tiny Museum (cold/snow words across languages
  including two Inuit words: *qanik* and *aput*)

Themes covered: science (heavy), philosophy, language, emotions.

### Music

Switched to `music_skyward` (*Skyward Bound Sprint*) — brisk
going-somewhere feel that fits a high cold place.

### Touched

- **Assets:** `bg_mountain-lake-vista.png` removed,
  `bg_ice-level.png` added.
- **Updated:** `src/content/scenes.js` (rewrote the scene + two
  inbound portal references).
- **Docs:** `docs/scenes/mountain-lake-vista.md` removed,
  `docs/scenes/ice-level.md` added.
- **Auto-regenerated:** `src/content/manifest.json`.

### Open hooks for next agent

- Wawoo's bio lines (in `characters.js`) are global to him —
  they don't know which scene he's standing in. A nice future
  pass: add a small pool of *ice-specific* lines that only fire
  when his speaker is in this scene.
- `THEME_COVERAGE.md` should be regenerated; the old vista was
  the only place 'art-history' was double-covered.
- Existing saves with `mountain-lake-vista` in their visited
  scene set will still work (the slug is just gone — no harm
  done) but won't get credit for visiting `ice-level` retroactively.

## 2026-05-16 — v1.10: Amelia-drawn portals

All portal art is now Amelia's. The seven non-Amelia portal
sprites were deleted (`portal_door`, `portal_open-door`,
`portal_office-door-portal`, `portal_ladder`, `portal_portal_blue`,
`portal_portal_green`, `portal_slime-portal`) and replaced with
the five new portals she's drawn:

- `portal_donut_portal`
- `portal_heart_door`
- `portal_magic_flower_door`
- `portal_magic_swirl`
- `portal_simple_heart_door`

### Mapping

One portal sprite per *destination* (not per *origin*), so the
same place always has the same portal icon — whether the kid is
arriving at the cottage from the hub or the bedroom, the door
they tap looks the same. Helps a 4-year-old recognise places by
shape.

| Destination                  | Portal sprite                |
|------------------------------|------------------------------|
| cottage                      | `portal_heart_door`          |
| bedroom                      | `portal_simple_heart_door`   |
| hub-garden / playground      | `portal_magic_flower_door`   |
| lake / waterfall             | `portal_magic_swirl`         |
| vista / skyscraper-roof      | `portal_donut_portal`        |
| village / seaside            | `portal_heart_door`          |
| school                       | `portal_simple_heart_door`   |

### Touched

- **Assets:** 7 old portal PNGs removed from `/assets/`; 5 new
  portal PNGs added.
- **Updated:** `src/content/scenes.js` (24 portal sprite
  references swapped across 11 scenes).
- **Auto-regenerated** at build: `src/content/manifest.json`.

### Open hooks for next agent

- Heights weren't re-tuned per new sprite; if Amelia's drawings
  have a different aspect ratio than the originals (e.g. her
  heart-door is squatter than the old door), the `heightFrac` in
  each portal definition may need a small adjustment so doors
  don't look stretched. Visible in any playtest screenshot.
- Once Amelia's `thing_*` redraws come in next, the same
  destination-based mapping idea is worth applying.

## 2026-05-10 — v1.9.2: the case of the second equation

The user reported: "It correctly shows the gems you've just
collected and the sub total. it then correctly shows the current
total + sub total = new total. but then after it updates the new
total another equation appears and I don't know where that comes
from."

It was two compounding bugs.

### Bug 1: quest reward recursed inside `gemBag.add`'s listener loop

`gemBag.add()` fires its listeners synchronously in a `for` loop.
The first listener (main.js) called `quests.report`; if a quest
completed, `QuestHUD._onChange` then called `gemBag.add(reward)`
**recursively, while the outer add's `for` loop was still
iterating**. The recursive call mutated `this.total` and fired all
listeners again with the reward. Then control returned to the
outer loop, which called the next listener — `GemHUD._onChange` —
with `newTotal: this.total`. But `this.total` was now the
post-reward value, not the original gem's value. The events
arrived at GemHUD out of order and with stale `newTotal`.

Fixed by deferring the quest reward `gemBag.add(...)` by one frame
(`time.delayedCall(0, ...)`) so the outer add's listener loop can
finish first. The reward then arrives as a fresh, in-order event
that joins the kid's still-open batch cleanly — so the equation
includes the reward gems, all in one math reveal.

### Bug 2: `_settleBatch` could fire twice for the same batch

If a new gem arrived during the settle's animation phase (between
the subtotal reveal and the panel fade), `_onChange` reset the
settle timer. The timer then fired `_settleBatch` AGAIN later —
with the *updated* subtotal/pickups — while the first settle's
animation chain was still mid-flight using stale closure values.
Two equations played in overlapping order and the panel turned
into a moving target. **This was the unexplained "second equation"
the user saw.**

Fixed by rebuilding the GemHUD batch as a strict three-state
machine:

```
   idle ──gem──▶ collecting ──1.4s of quiet──▶ settling
                     ▲                              │
                     │     gems queued during       │
                     │     settle drain into a      │
                     └─────fresh batch on fade──────┘
```

The settle's animation captures all values up-front and never
reads `this._batchPickups` again — so even if a gem arrives
mid-animation, the running equation can't be poisoned. A gem
arriving in the `settling` state is pushed onto a `_pendingPickups`
queue; when the panel fades, the queue drains into a fresh
`collecting` batch with a clean new equation. Sequential, never
overlapping.

### Other tightening

- `_reposition()` now only re-renders the live `3 + 5 + 1` panel
  when state is `collecting` — never during `settling`, so a resize
  event mid-equation can't overwrite the captured equation text.
- `_fullReset` (called from "new game") cancels every in-flight
  timer, animation timer, and tween, then snaps the counter.
- Trace-tested across four scenarios: rapid pickups, quest reward
  during collecting, kid-collects-during-settle (now produces two
  clean sequential equations instead of an overlap), and new-game
  during settle (every animation cleanly cancelled).

### Touched

- **Updated:** `src/systems/GemHUD.js` (full rewrite of batch
  logic as a state machine), `src/systems/QuestHUD.js` (defer
  reward gemBag.add by one frame).

## 2026-05-10 — v1.9.1: queued toasts, gems-not-stones

### Quest-complete toasts queue, not stack

When two quests completed in quick succession, both toasts rendered
at the centre of the screen at the same time and the text became a
jumble. Now toasts queue: one at a time, each held 3.5s plus a
320ms gap, so each is fully readable. The gem-grant still happens
the moment each quest completes (so the math reveal in the gem HUD
is still synchronised with quest completion timing) — only the
*celebration toast* is delayed.

### "Stones" → "Gems"

The reward unit is now called "gems" everywhere it's user-facing:

- Quest-complete toast: "+N gems" (was "+N stones")
- Quest panel completed-row chip: "(+N gems — collected)"
- Quest titles + descriptions: "A handful of gems", "Add 25 gems
  to the bag", "Reach 500 gems", "Hold 100 gems AND find the
  microscope", "The five-hundred-gem friend", etc.
- Tutorial verse line: "you'll find them inside it, with gems
  for your needs" (the rhyme is on deeds/needs, so swapping the
  noun preserved the couplet).

The narrative *"Question Stones"* / *"fact-stones"* / *Tiny Museum*
hotspot types keep their names — those are literal stones in the
world that ask questions, not the gem currency. Cofeenie's
hedgerow-and-stone-walls line also kept (it's about literal
kingdom walls).

The `scholar-and-stones` quest *id* was kept (with a comment) so
v1.9 saves don't lose the completed flag.

### Touched

- **Updated:** `src/systems/QuestHUD.js` (toast queue + label),
  `src/systems/Quests.js` (titles + descs), `src/systems/GemBag.js`
  (comment), `src/scenes/TutorialScene.js` (verse).

## 2026-05-10 — v1.9: rockets fixed, big quest pack, scrollable log, Pooh warmth

A pass on the rocketry, the quest log, and the prose.

### Rockets, properly this time

Three bugs fixed so the rocket actually works:

1. **Hub rocket "doesn't launch":** Cosenae's hotspot zone overlapped
   the rocket's, and his higher y-depth meant his zone won the click
   on the rocket's right half. Same problem in the playground with
   Tootsie / Amelia / Poona. Fixed by tightening the rocket's bounds
   AND adding a `priority: 'high'` flag that bumps the zone's input
   depth to 9500, so the rocket wins overlapping clicks even though
   the sprite stays visually behind characters.
2. **"Starts to launch and then stops":** subsequent pointerover /
   pointerout / pointerup events on the rocket zone called
   `tweens.killTweensOf(sprite)` mid-launch, which killed the quiver
   tween and prevented Phase 2. Now any sprite with `_launching` /
   `_launched` flags makes the zone bail on every input event so the
   animation runs to completion.
3. **Walk-then-launch felt sluggish:** new `instant: true` hotspot
   flag skips the walk-up. The rocket launches the moment you tap.
   Amelia does a celebratory hop when it goes.

### Quest pack expansion (now 38 quests)

Big expansion from 13 to 38 quests, including:
- **Rocket quests:** "Up she goes!" (1 launch), "Two rockets, two
  skies" (launch in both gardens), "Rocket fan, first class" (10
  launches total).
- **Stone milestones:** gem-tycoon (250), gem-emperor (500).
- **Bag milestones:** thing-archivist (10 unique), one-of-each
  (every collectable at once), a-full-bag (8 things at once).
- **Quiz:** quiz-doctor (25 correct).
- **Puzzly / riddly:** museum-curator (5 different fact-stones),
  wonderer (10 question stones), friend-list (12 unique characters),
  tap-a-hundred, philosopher / naturalist / budding-scientist /
  language-friend (theme-tagged hotspots), scholar-and-stones (the
  microscope + 100 stones), evening-quiet, morning-bright.

To support these, hotspot clicks now fire a `hotspot-clicked` event
with id, type, speaker, theme, slug — so quest predicates can match
on whatever they want without us needing a new event type per
category. `gem-collected` and `thing-collected` events now also
carry current totals so quests like "carry 8 things at once" can be
expressed in one line.

### Scrollable quest panel

The panel now renders all 38 quests inside a Container masked to
the visible region. Mouse wheel scrolls; finger drag scrolls; an
orange scrollbar thumb on the right shows position. Header gained
a "N / 38 done" summary chip.

### Achievements

The user noticed there's no separate "Achievements" system — and
indeed, in this game quests *are* the achievements. The new pack
includes plenty of milestone-style "achievement" quests (tap 100
hotspots, hold 500 stones, find every collectable). They live
alongside narrative quests in one scrollable list.

### Writing pass — Pooh warmth

Layered Winnie-the-Pooh / A. A. Milne flavours into characters who
fit naturally:
- **Conaloo** leans into Pooh proper: "*Bother*", "a Bear of *very*
  small brain", honey, humming, "the longest way round is the
  *kindest*."
- **Loosa** picks up Eeyore: "*Thanks for noticing*", patient
  waiting, gentle melancholy.
- **Cosenae** acquires Owl-pomposity: "*To the casual observer*",
  "*expostulate*", grand mis-spellings.
- **Lulumi** gains Christopher-Robin warmth: "*you're braver than
  you believe*", taking small friends seriously.
- **mommy / daddy** gain Hundred-Acre kettle-and-rain Britishness:
  "blustery sort of day," "*Bother*, I've put the wrong jam in the
  tea," "*nothing in particular*. It's *one* of my favourites."
- **Konessa** picks up Piglet: "*small enough*", "*Oh*", small
  voices on big feelings.
- **Themed fallback lines** (philosophy / emotions / language /
  portals) gained Pooh-shaped lines that scan in any scene.

Each character keeps every existing line; the new ones widen the
pool, so playtest favourites still appear and the average tone
warms gently toward the Hundred-Acre.

### Touched

- **Updated:** `src/scenes/GameScene.js` (rocket launch hardening,
  quest event), `src/systems/HotspotManager.js` (priority + instant
  + protected sprite), `src/content/scenes.js` (rocket bounds +
  flags), `src/systems/Quests.js` (38 quests), `src/main.js` (rich
  event payloads, _state cleanup), `src/systems/QuestHUD.js`
  (scrollable panel + summary chip), `src/content/characters.js`
  (Pooh-vibe lines), `src/content/lines.js` (Pooh-vibe themed +
  portal lines).

### Open hooks for next agent

- The hub still has Cosenae standing close to the rocket; the
  rocket zone now wins, but a longer-term tidy is to nudge his
  sprite x-coord left a bit so they don't visually crowd.
- "Friend-list" quest counts every unique speaker; if a kid
  inadvertently triggers it via a chain of fast clicks across
  scenes, the celebration is fine but they may not realise what
  earned it. Consider a "quest-progress chip" that briefly shows
  "9/12 friends greeted" on increment.
- Quest-row layout is fixed-height; one-of-each's long description
  word-wraps and crowds the progress bar slightly. Consider
  variable-height rows.

## 2026-05-10 — v1.8: save game, fanfare, and clean math

A pass on persistence + the quest-completion moment + a clear-up of
the gem math so the equation reads correctly.

### Saves (flexible-by-design)

New `src/systems/SaveGame.js` persists to localStorage:
- gem total + per-gem counts
- inventory (key + count for each thing carried)
- *flags* of which quests are completed
- world-collected placements (so gems and things don't respawn)

Schema is intentionally minimal: every field is optional and has a
sane default, so future versions of the game won't break old saves.
Quest progress for *incomplete* quests recomputes on hydrate by
replaying the persisted gem total and inventory through
`quests.report()` — half-finished quests pick up where they left off
without needing extra state in the save format.

### Title screen — Continue Adventure

The title now has three buttons when a save exists:
- **Continue adventure** (gold, primary, soft idle pulse) — picks up
  where the kid left off.
- **Let's go!** — starts a fresh adventure (clears the save).
- **How to play** — unchanged.

If no save exists, only "Let's go!" + "How to play" appear.
"Let's go!" remains the primary, with the same idle pulse.

### Quest-complete fanfare

The quest-done toast was small, top-of-screen, and sat on top of the
gem counter so the kid couldn't see the gems coming in. Now:

- **Centered** on screen, well clear of the gem HUD.
- **Bigger** (720 × 280) so the gem reward is unmissable.
- **Gem icon + "+N stones"** rendered as a chip with a sparkle pulse.
- **Bursting halo** behind the panel + 18 confetti pieces flying
  outward.
- **Drop-in scale + alpha pop** on the headline / title / reward.
- **Held longer** (3.5s) so the gem total can finish ticking up
  while the toast is still readable.

### Gem total math (the equation reads right now)

The top counter no longer ticks up on every pickup. It stays locked
at the *batch start total* through:

1. Live additions (the running "3 + 5 + 1" panel)
2. The subtotal reveal ("3 + 5 + 1 = 9")
3. The first parts of the total equation ("12 + 9")

…and only updates on the final " = 21" step, with a celebratory
flash (orange colour, scale 1.35 → 1.0). That way `previousTotal`
in the equation always matches the number above it, and the kid
*sees* the new total **become** the new total.

### Touched

- **New:** `src/systems/SaveGame.js`
- **Updated:** `src/main.js`, `src/scenes/TitleScene.js`,
  `src/scenes/GameScene.js`, `src/systems/GemBag.js`,
  `src/systems/Protagonist.js`, `src/systems/Quests.js`,
  `src/systems/GemHUD.js`, `src/systems/QuestHUD.js`

### Open hooks for next agent

- The quest-complete halo/confetti is fixed-colour. A nice next pass
  would be picking colours for the halo based on the quest theme
  (gold for stone-collectors, pink for inventory quests, etc).
- "Let's go!" wipes the save with no confirmation — fine for a kid
  whose dad is right there, but if it ever ships to other families
  consider a soft "Are you sure?" two-tap.
- The save persists immediately on every change. For a 4-year-old
  rapid-tapping gems that's a lot of writes; if it ever shows up
  in DevTools as slow, debounce to 500ms.

## 2026-05-10 — v1.7: a UI/UX polish pass

A pass that makes the world feel like one little hand-painted thing.
Every panel, every chip, every speech bubble, every menu now shares
the same paper colour, the same warm-brown stroke, the same drop
shadow, and the same rounded-corner family. A 4-year-old reads UI
by *shape*, not by *word*, so the shapes have to be consistent.

### Design tokens

New `src/systems/UITokens.js` is the single source of truth for the
palette, stroke, radii, top-bar layout, typography, animation
timings, and a shared `drawPanel()` helper that produces the soft
drop shadow + cream fill + warm-brown stroke that every UI surface
now uses.

### Top-bar (bag, quest star, gem counter, burger)

All four items render at the same height (80px) and share the same
panel style. The bag, quest star, and burger are now visually a
matched set; the centred gem counter is the same height too.

- **Hover** brightens fill alpha (no more "did I hover?" guessing).
- **Press** triggers a tiny squish-and-spring on the icon glyph so
  every tap feels real.
- **Quest panel** now shows progress bars for incomplete quests
  (with `n/total` labels) and reward chips for completed ones; it
  slides down from the star icon.
- **Inventory drawer** slides up from the bottom on open.
- **Burger menu** dropdown items got soft glyph icons (⌂ ♪ A) so
  the kid can read them by shape, and the panel slides in.

### Speech bubbles + quiz dialog

Speech bubbles now use the shared paper colour and stroke, plus a
custom drop shadow that traces the bubble + tail outline (so the
shadow follows the tail, not just the rectangle). Bubbles drop in
with a gentle Back ease.

Quiz buttons got real states:

- **Hover** brightens the fill and lifts the label slightly.
- **Press** squishes the label.
- **Choose** flashes the picked button (green for correct, gold for
  preference) before the dialog dismisses, so the kid sees which
  one they chose.

### Tap-to-walk ripple

Tapping the background to walk Amelia now paints two soft
concentric rings at the click point that expand and fade. Tells
the child "yes, I heard you" before Amelia takes her first step.

### Tutorial panel

Now uses the same `drawPanel()` helper, so the "How to play" page
matches the rest of the world's chrome (drop shadow, paper, brown
stroke).

### Touched

- **New:** `src/systems/UITokens.js`
- **Updated:** `src/systems/GemHUD.js`, `Inventory.js`, `QuestHUD.js`,
  `GlobalUI.js`, `DialogueBox.js`, `QuizDialog.js`, `scenes/GameScene.js`,
  `scenes/TutorialScene.js`

### Open hooks for next agent

- The title-screen buttons are intentionally bespoke (they have a
  warm yellow glow halo on hover that's part of the brand). Leave
  them alone unless playtest says otherwise.
- The bottom-of-screen inventory drawer is centred horizontally,
  but with a very full bag (8+ items) it could push past the edges.
  Consider a max-cols + wrap if Amelia's collection grows.
- A subtle ambient idle for the burger button (a slow breathing
  alpha pulse) might draw the eye toward the menu the first time
  the kid plays. Worth A/B-ing with the parent.

## 2026-05-09 — v1.6: a writing pass

A focused pass on the prose. Influences: Dr Seuss (anapestic
mischief), Roald Dahl (unbothered absurdity), Julia Donaldson
(clean-rhyme tenderness), and the best Maxis edutainment
(facts smuggled, never lectured).

### Character dialogue (full rewrite)

Every character has a fresh 6–7 line pool, each line written
to *scan* read aloud, with a clearer voice per character:

- **Amelia** — tiny philosopher; declarative; surprising.
- **Cosenae** — confident half-facts ("a bee can lift up a tree").
- **Poona** — bursting with plans she never finishes.
- **Lulumi** — patient list-keeper; quiet wonder.
- **mommy** — observational; small details treated as gifts.
- **daddy** — calm; humming between words; secretly delighted.
- **Keefa** — half-singing; hears music in everything.
- **Loosa** — long pauses; dry; ancient.
- **Tootsie** — BRIGHT; EAGER; many exclamations.
- **Wawoo** — mechanical poet; one "wawoo" per response.
- **Konessa** — soft, focused, single image per line.
- **Conaloo** — warm couplets; honey + rhyme.
- **Monaloo** — light, two-line responses with a shorter second.
- **Cofeenie** — royal-but-bunny decrees.
- **Lucy** — quiet noticer of small things.
- **Pepsi** — narrator describes; he punctuates with boofs.
- **Seesa** — HYPER pink bee, sentences sometimes end before.

### Quizzes (warmer + more variety)

Cosenae now has 9 questions (math, day/night, animals, plants,
size, alive-vs-not). Lulumi has 7 (rhymes, seasons, colours,
shapes, letters, quadrupeds). Conaloo and Amelia have rich
preference-question pools. Tootsie and Pepsi added with
charming cheerful pools. Every wrong-answer reaction is now a
genuine *teach*, not a brisk correction.

### Quest titles + descriptions

Quest text now scans like a mini-book: "A first small sparkle"
(first gem), "A pocket begins" (first thing), "Out the door,
then" (first portal), "A handful of stones" (25 gems), "A
clever, busy bag" (5 things), "A bright little spark" (3 quiz
wins), "Off the beaten path" (5 scenes), "The whole-world
walker" (every scene), "Whose birthday's this?" (cake),
"Soft and quiet" (teddy), and a new "Stars in pockets" for
the hourglass.

### Inventory descriptions

Each item is now a tiny couplet — read aloud they each scan
as a poem, not a label. Cake, books, teddy, flashlight,
microscope, globe, hourglass, bucket, banana, tyre.

### Inventory-aware reactions

Each peep's "oh, I notice you have…" lines tightened.
Every line now lands on an image or a turn.

### Scene lore

Polished lines for: rocketship countdown, trade, sun, hearth,
window, tea, shelf, tree-A, tree-B, lake, mountain, pebbles.
The teaching beats are still smuggled, but the language is
sharper and rhymes cleaner.

### Tutorial + title

Tutorial now mentions the gem-counter, the bag, and the
quest star. Title subtitle: "A garden, a lake, a friend on
the path, / a bear-butterly, and the smallest of math."

## 2026-05-09 — v1.5: math reveal polish + dialogue stays + quests + buddy growth

### Gem math display

- **First number is bare; subsequent get +.** Live-batch text now
  reads "3" → "3 + 5" → "3 + 5 + 1" instead of the old "+3 +5 +1".
- **Two-stage settle reveal.** When the burst quiets:
  1. The current expression gets a `= subtotal` appended:
     "3 + 5 + 1 = 9".
  2. After a beat, the panel transitions to the running-total math:
     "12 + 9" → "12 + 9 = 21". Each part appears in turn so the
     kid sees the full chain — every gem → subtotal → new total.

### Dialogue boxes

- **Stay until tap.** Removed the auto-dismiss timer. Bubbles
  remain visible until the player taps the bubble itself, the
  background, or another hotspot. No more disappearing mid-read.

### Rocketship reliability

- **First tap launches.** Removed dialogue and the random 1-3 click
  trigger. Tap the rocketship once, it always launches. The
  scattered "sometimes nothing happens" bug is gone.

### Portal labels

- **Auto-flips above/below the portal sprite** based on whether
  there's room above (without crashing into the gem HUD's reserved
  zone). Portals high on the screen now show their label BELOW.
- **Min top clamp** on portal sprites so the sprite itself never
  extends above y=120 (preserves space for the HUD).

### Buddy growth (opt-in delight)

- New `src/content/growsOnClick.js` — a small set of characters
  (Conaloo, Pepsi, Seesa, Monaloo, Tootsie) get a tiny +7% per
  click, capped at **3× their original size**. Cap prevents the
  v1.3 "infinite growth → walks off-screen" bug; deliberate growth
  for a small cast preserves the delight Amelia missed.
- Hover/click tweens now look up `_baseScale` dynamically each
  event, so the growth doesn't fight the hover anchor.

### More quizzes

- Cosenae's pool: 3 → 8 (added math, day-night, eggs, plants,
  size compare).
- Lulumi's pool: 2 → 6 (added colour mixing, triangle sides,
  letters, shapes).

### Quest / achievement system (NEW)

- New `src/systems/Quests.js` (`QuestManager`) tracks progress
  against ~12 quest definitions: count quests (collect N gems /
  things / right answers), specific item quests (find the cake /
  the teddybear), and exploration quests (visit N scenes / every
  scene).
- Game systems emit events (`gem-collected`, `thing-collected`,
  `quiz-correct`, `scene-visited`) → `QuestManager.report()` updates
  matching quests.
- New `src/systems/QuestHUD.js` (`QuestHUDScene`):
  - A "★" button next to the inventory bag (top-left).
  - Shows a tiny "n/total" badge.
  - Tap to open a panel listing every quest with its progress
    bar / DONE state and reward.
  - On completion, a celebratory toast pops in for ~3s and the gem
    reward is auto-credited (visible flying-gems via the existing
    GemBag → GemHUD pipeline).

## 2026-05-09 — v1.4: critical bug fixes + gem QoL

### Two critical bugs fixed

- **Portals could get permanently stuck.** Repro: tap a portal,
  then tap something else before Amelia arrives. Cause: portal
  click set `_isTransitioning = true` BEFORE the walk. The
  walk's onArrive (the actual fade + scene-change) was orphaned
  by the next click overwriting Amelia's tween, but the lock
  flag stayed true forever — so subsequent portal clicks were
  blocked by `if (this._isTransitioning) return;`. Fix: only set
  the lock INSIDE doFade() (the walk-arrival callback), so an
  interrupted portal walk leaves the lock false and the next
  portal click works.
- **Peep grows on repeat clicks.** Race between hover/out tweens
  and the click bounce: each hover captured `sprite.scale`
  fresh, but if scale was already inflated mid-bounce, the
  capture grew. Fix: every sprite's `_baseScale` is now locked
  in once at render time, and ALL hover/click tweens use that
  as the anchor — they can never drift.

### Gem pickup quality of life

- **Pickup on `pointerdown`** instead of `pointerup`. Feels
  instantaneous — kid taps and the gem is already collected
  before they lift their finger.
- **`disableInteractive` immediately on collect** so the still-
  glowing first gem doesn't block taps on a gem behind it. Tap
  a stack of overlapping gems and they all register.
- **Drag-to-collect.** While the pointer is held down, hovering
  over any gem auto-collects it. Sweep a finger or click+drag
  the mouse across a row to grab them all.
- **Batch equation reveal.** Rapid pickups used to skip the math
  reveal because the first reveal was still animating. Now:
  - A "running batch" panel appears UNDER the total,
    accumulating each addition: `+3` → `+3  +5` → `+3  +5  +1`.
  - The total counter ticks up immediately for every pickup so
    the kid sees the bag fill.
  - After ~1.4s of no new pickups, the batch resolves on the
    panel: `previousTotal + sum = newTotal` revealed step-by-step,
    then fades. Every batch produces a math beat regardless of
    tap speed.

### Asset-robustness defensive

- `_enterPortal` checks the target scene exists before
  navigating; logs a console warning instead of locking up if
  the destination's background was removed.

## 2026-05-09 — v1.3.3: rocket actually launches + no crop on things

### Rocketship launch is now satisfying

- **Click count drives launch.** Each rocketship picks a random
  trigger of 1, 2, or 3 the first time it's seen this visit. Each
  click increments. Pre-trigger clicks do a small wiggle to hint
  something's coming.
- **On the trigger click**: pre-launch quiver, three smoke puffs at
  the base, sound, then the rocket tweens **fully off the top of
  the screen** (y goes to -40% scene height) over 1.2s, shrinking
  as it goes. It's then **destroyed** — gone for the rest of this
  visit.
- **Respawns only on scene re-entry.** Walk to another scene and
  back, the rocket is there again, ready to launch.

### Sprite cropping removed

- The 18% crop on collectable thing sprites was clipping the corners
  of the teddybear (and others). Replaced with **over-scaling**: the
  sprite renders at ~1.45x the calculated height-to-fill so the
  visible content fills the slot without ever clipping. Some empty
  pixels render outside the slot bounds, which is invisible.
- Same for the inventory icon (backpack) and inventory slots.

## 2026-05-09 — v1.3.2: tutorial glitch + title hover + warp-back rename + playground rocket

### Bug fixes

- **Tutorial-from-title glitch.** Previously: clicking "How to play"
  on the title would `scene.start('scene:tutorial', …)` which
  STOPPED the title. Tutorial's "Off we go!" then `scene.start`-ed
  a fresh title with a wrapped `onStart`, but that closure
  referenced a destroyed scene's state and "Let's go" stalled (only
  the warp-back/burger button worked). Fix: tutorial now opens via
  `scene.sleep('scene:title') + scene.run('scene:tutorial')` so the
  title is preserved, not destroyed. "Off we go!" stops tutorial
  and wakes title. Title's "Let's go" works exactly as before.

### UI polish

- **Title-button hover** is much more visible: a soft yellow glow
  halo fades in behind the button when you hover. The button itself
  still doesn't scale (so the text stays readable) but you can now
  clearly tell what's hover-active.
- **Burger-menu "home" renamed to "warp back".** The button warps
  the player back to the hub scene from anywhere — calling it
  "home" implied it returned to the title screen. "Warp back" is
  honest about what it does.

### Content

- **Playground rocketship added.** Second `thing_rocketship` placed
  at x=0.46 in the playground (the bg art already shows a rocket
  silhouette, so it visually fits). Has a 4-line dialogue pool plus
  the special `_rocketLaunch` animation hook. Re-renders fresh on
  every visit so kids can launch it again and again.

## 2026-05-09 — v1.3.1: final polish

### Polish

- **Boot text duplication fixed.** "The crayons are warming up..."
  now appears just once (in Phaser); the HTML pre-boot overlay is
  hidden as soon as Phaser preload starts.
- **Tutorial updated** to mention gems, the inventory bag, and the
  flying-collect feedback.

### Gem balance

- Reduced gems per scene from 7–9 → ~5. Total scattered ≈ 55.
- Gem size unified: scattered AND reward-burst gems both use
  `heightFrac: 0.13` (was 0.16 vs 0.10 — visually inconsistent).
- Reward-burst from peep clicks: 2–5 gems instead of 1–3.
- Per-character `rewardGemChance` 30% → 45%. Talking pays better.

### Things fly to the bag (matching gems-fly-to-counter)

- On collect, the thing-sprite tweens to the inventory bag icon
  (top-left) over 600ms with a slight spin, then the count
  increments with the bag's existing pop animation.

### Rocketship is now properly interactive

- Hotspot has `speaker: 'thing_rocketship'` so the special
  `_rocketLaunch` animation fires (~30% chance per click): the
  rocket launches off-screen and bounces back down. Always restored
  on revisit so kids can launch it again and again.

### Quiz freeze grace period

- When a quiz opens, hotspot zone clicks AND background-walk clicks
  are blocked for 2.5 seconds. The quiz answer buttons are NOT
  blocked (they use a separate event path on QuizDialog). This
  stops accidental taps from dismissing dialog/hopping Amelia mid-
  question.

### Dynamic surprises

- **Random idle reactions.** Every 6–14 seconds a random
  character/thing in the scene does a small wiggle + hop. Adds a
  sense the world is alive when the kid hasn't clicked recently.
- **Ambient sparkles.** Every 4–9 seconds a small coloured sparkle
  drifts gently across the upper half of the scene. Pure
  decoration; no interaction.
- **Three new collectables** (sprinkled per "more collectables
  dotted around"): teddybear by the rocketship, books + banana in
  the village square.

## 2026-05-09 — v1.3: quizzes, sprite animations, mobile responsive, polish

The "actually-implement-everything-Dad-asked-for" pass. Three new
mechanics + several bug fixes + the items deferred from v1.2.

### New mechanics

- **Quiz/trivia from peeps.** Some characters now sometimes ask
  multiple-choice questions instead of speaking a normal line (~25%
  of clicks when a quiz pool exists). Two flavours:
  - **Knowledge quiz** with a correct answer. Right → big sfx,
    a teaching response, gem reward (1–3 gems). Wrong → a kind
    correction explaining the right answer.
  - **Preference question** ("favourite colour?", "which creature
    would you be?") with no wrong answer. Always rewarded with gems.
  Per-character pools live in `src/content/quizzes.js`. Ones authored
  for: Cosenae (facts), Lulumi (rhymes/seasons), Conaloo
  (preferences), Amelia (preferences), mommy (vocabulary), Pepsi
  (preferences). Session-wide unseen-tracking so the same quiz
  doesn't fire twice in one playthrough.
- **Inventory-aware character lines.** When Amelia clicks a peep
  while carrying certain items, the peep may say a line that
  references what she's holding (40% chance per click, when
  applicable). E.g. mommy notices the cake, Cosenae lights up at
  the microscope, Tootsie celebrates a banana. Authored in
  `src/content/inventoryReactions.js`.
- **Sprite animations.** Some clicks now trigger a small cinematic:
  - Rocketship: launches off-screen and bounces back down.
  - Pepsi: jumps and does a 360° flip with a "yip → thud".
  - Seesa: zigzags around her spot like a real bee.
  - Monaloo: flits in a flower-petal pattern.
  Triggered with 30% probability after any matching speaker click.

### Mobile / tablet responsive

- **Phaser scale mode FIT** at 1600×900 design resolution. Phaser
  scales the canvas with letterboxing to fit any viewport. UI sizes
  no longer have to do per-component math — everything's laid out at
  the design size and proportionally scaled. Phone in landscape,
  tablet, laptop all share the same proportional layout.

### Critical UX fixes

- **Inventory click bug** (clicks passing through to game sprites and
  re-collecting items): the panel now has a transparent click-blocker
  zone behind the items. Clicking an inventory item shows a brief
  "what's this?" lore line WITHOUT re-collecting.
- **Inventory bag icon bigger** (80→100px), and the backpack image
  inside is auto-cropped to ignore transparent margins so the visible
  bag fills the icon properly.
- **Collectable thing sprites cropped** (~18% off each side) on both
  the world AND the inventory slots, so the visible content fills
  the slot — fixing "tiny sprite floating in lots of empty space".
  Decorative things (rocketship, trees, glass-house) keep full
  silhouette.
- **Settings collapsed behind a burger menu.** Single ≡ button at
  top-right; tap to expand a vertical panel of three large clearly-
  labelled buttons (home / sound on-off / text S-M-L). Fonts are
  bigger than v1.2.3 and don't wrap. **Motion toggle removed
  entirely** — Dad asked for it; motion is now always on (the game
  is just worse without Amelia gliding).
- **Speech bubbles dodge the gem HUD.** Bubbles never overlap the
  reserved top region so the running total + equation reveal stay
  readable.

### Asset audit (still 100%)

- 11/11 BGs, 11/11 peeps, 6/6 valid animals, 15/15 things (backpack
  is the inventory icon), 7/7 music, 21/21 SFX in pools.

## 2026-05-09 — v1.2.3: walk fix (for real), bigger HUD, auto-show inventory, more gems

### Critical bug fixes

- **Amelia teleporting (third time, with extra prejudice).** The
  v1.2.2 default of `reducedMotion: false` only applied to NEW
  installs — anyone whose `localStorage.conaloo.a11y.v1` was already
  set with `reducedMotion: true` (left over from earlier testing)
  kept teleporting. Bumped the storage key to `v2` so everyone gets
  fresh defaults. ALSO, walk movement now ignores reduced-motion
  entirely — it tweens regardless. Reduced-motion still suppresses
  the celebratory hop, sparkle particles, and idle bobbing. But
  walking IS the protagonist mechanic; the kid is supposed to see
  Amelia move.

### GemHUD

- **Bigger gem icon.** 36px → 56px square (~55% larger).
- **Dynamic panel width.** Resizes itself to fit "5", "23", "1234" —
  no more stretched-to-look-like-a-banner panel.
- **Last-collected gem as the icon.** When you pick up gem_3, the
  HUD icon switches to gem_3. Picks up gem_7? Icon becomes gem_7.
  No more "always shows gem_5".

### Inventory

- **Auto-shows on pickup, hides 3s later.** Previously the bag only
  opened via the corner button. Now: collect a thing → bag pops open
  → a moment later it tucks itself away again. If you've manually
  toggled it open, the auto-hide leaves it alone.
- **Bigger slots.** 80px → 120px (50% larger). Icons inside grew
  proportionally. Title and badge font also bumped.
- **Bigger backpack toggle.** 64px → 80px square.

### Pickups (gems + collectables) on the world

- **Always on top so they're never hidden.** Gems render at depth
  9000+; collectable things render at depth 8500+. Decorative things
  (rocketship, trees, glass-house) keep y-based depth so they layer
  naturally with characters. Net effect: every gem and collectable
  is clickable no matter what's "behind" it visually.
- **Bigger.** Gem default heightFrac 0.10 → 0.16 (60% larger).
  Collectable thing default 0.22 → 0.30 (~36% larger).

### Content fill (more this time)

- **~88 gem placements** across 11 scenes (up from ~55). 7–9 per
  scene now. Total gem value if all collected: ~440 stones.
- Character gem-spray reward chance bumped 18% → 30% per click — a
  more reliable way to gather gems by talking to peeps.

## 2026-05-09 — v1.2.2: HUD visibility + smoother walk + content fill

Dad ran the v1.2.1 deploy and found the gem counter was still
hidden during gameplay (only faintly visible on the title), Amelia
was still teleporting instead of gliding, and there weren't enough
gems / collectables. This fixes all three.

### Critical bug fixes

- **Gem HUD was rendering BEHIND game scenes.** Phaser scenes draw
  in the order they're added — last added is on top. The HUDs were
  added before gameplay scenes, so every game scene covered them.
  Fix: in `main.js`, gameplay + title + tutorial are now added FIRST,
  then the HUDs (GlobalUI, Inventory, GemHUD) added LAST. They now
  render on top of every gameplay scene.
- **Amelia teleporting instead of gliding.** Two causes:
  1. `Accessibility.reducedMotion` defaulted to `null` (inherit from
     OS). Many tablets / Windows configurations have prefers-reduced-
     motion enabled by default for accessibility, so Amelia
     teleported. Default is now `false` — the user can still toggle
     reduced motion via the corner button if they want it.
  2. Walk-tween parameters were too short. Bumped MIN_WALK_MS 380→600
     and dropped speed 420→380 px/s. Switched to `Sine.easeOut` for a
     snappier launch and gentler landing.

### Content fill

- **Way more gems.** ~55 gem placements across the 11 scenes (up from
  ~25). 4–6 per scene, distributed across corners, edges, mid-height,
  and tucked-away spots — not just the centre.
- **More collectables.** Added thing pickups to scenes that had none:
  banana in the hub, books + teddybear in the cottage, bucket +
  banana at the lake (childlike), bucket + flashlight at the seaside,
  books + hourglass at the vista. All using existing things — many
  are duplicates so the inventory's stacking ×N badge gets exercised.
- **Portal placement varied.** Most portals moved off the bottom-edge
  to mid-screen y values (some in the centre, some on side walls,
  some up high in the village square). Less "everything's at the
  ground" — each scene now has portals at differentiated y positions
  so they feel like actual places in the painting, not buttons on a
  shelf.

### Asset audit (everything's in use)

- 11 / 11 backgrounds → scenes ✓
- 11 / 11 peeps → at least one scene ✓
- 6 / 6 valid animals → at least one scene ✓ (Umi still typo'd
  `anima_…` in filename → skipped by parser; rename when ready)
- 15 / 15 things → in scenes (or as the inventory icon in the case
  of the backpack) ✓
- 7 / 7 music tracks → wired to scenes via aliases ✓
- 21 / 21 SFX → in `sfxPools.js` (most used, a few held in reserve) ✓

### Still deferred to v1.3

- Mobile/tablet responsive scaling.
- Sprite animations (rocketship launch, dog flip).
- Inventory-aware character lines.

## 2026-05-09 — v1.2.1: post-playtest fixes

Same v1.2 branch — post-deploy playtest revealed several issues that
broke or undermined the v1.2 pass. Fixed in one push.

### Critical bug fixes

- **Per-character SFX pools weren't actually wiring up.** The
  `characterHotspot()` helper was baking `sfx: 'sfx_pop'` into every
  response, and `pickClickSfx()` honours the response's explicit sfx
  before falling back to the speaker pool. Result: every character
  always made the same pop sound. Fix: removed the explicit sfx so
  the speaker pool actually wins. Did the same for `tinyMuseum` /
  `questionStone` (narrator pool now varies them).
- **Speech bubble outline crossed the tail base.** The body's
  `strokeRoundedRect` drew a line that the tail's fill couldn't cover,
  so a horizontal line cut through where the tail joined the bubble.
  Fix: combined body + tail into a single `Graphics` path
  (`drawBubbleWithTail` helper) so the stroke wraps the full outer
  outline as one shape.
- **Amelia's movement felt jumpy.** The walk tween's MIN duration
  was 220ms, giving short hops. Bumped to 380ms minimum and dropped
  walk speed from 600 to 420 px/s. Movement now reads as a smooth
  glide.

### UX improvements (per Dad's playtest)

- **Gem HUD redesigned + relocated.** Now top-CENTRE (was top-left),
  bigger panel, always visible. Animates an **equation reveal** on
  each pickup: shows "5", then " + 3", then " = 8", then settles on
  "8" with a celebratory pop. The math itself is now part of the
  feedback — edutainment hook landed.
- **Gem fly-to-HUD reads better.** Click → swap to glowing variant →
  pulse + bob in place for ~560ms before flying to the HUD with a
  spinning trail. The "longer glow" Dad asked for.
- **Inventory is a toggle now.** A backpack-icon button sits in the
  top-LEFT corner; click it to open/close Amelia's bag (panel along
  the bottom). Bag is hidden by default. When a new item is collected
  while closed, the icon bumps to hint "you got something".
- **Backpack is no longer collectable** (it's the inventory icon
  now). Replaced in the school courtyard with a tyre.
- **Amelia walks toward the character / thing she's interacting with**
  before they speak — stops about a sprite-width away so she doesn't
  stand on top of them.
- **Amelia does an excited little hop** when she picks up a thing or
  collects a gem.
- **Sprites at the same depth route clicks to the visually-front
  one.** Hotspot zones inherit speaker depth (already; reinforced).

### Persistence + variety

- **Collectables don't respawn on revisit.** Module-level
  `worldCollected` Set tracks `${slug}:${hotspot.id}` and
  `${slug}:gem:${key}:x:y` for the session. On re-render, those
  hotspots/gems are skipped.
- **More gems + varied placement.** Each scene now has 2–3 gems,
  positioned in corners, edges, and tucked-away spots — not all
  centred. ~25 gem placements across 11 scenes (worth ~120 stones if
  you find them all).
- **Peeps reward clicks with gems.** Each character hotspot has an
  18% chance per click to spray 1–3 random gems out of the speaker's
  head. Reward for talking; randomised so the kid doesn't expect it.

### Out of scope (still — to be tackled in v1.3)

- Mobile/tablet responsive scaling.
- Sprite animations (rocketship launch, dog flip).
- Inventory-aware character lines.

## 2026-05-09 — v1.2: Take the Long Way (rename + gem collectathon + maze + fixes)

Branch `v1-2-take-the-long-way`. OpenSpec proposal in
`/openspec/changes/v1-2-take-the-long-way/`. Addresses Dad's playtest
feedback after v1.1 + introduces the gem collectathon mechanic.

### Game renamed

- **"Conaloo's Big Adventure" → "Take the Long Way".** Reflects the
  game's actual loop (wandering, exploring, collecting) better than
  the protagonist-focused name. Updated in TitleScene, WaitingScene,
  index.html, package.json. Conaloo (the bear-butterly) remains a
  central character.

### Critical bug fixes

- **`_isTransitioning` was sticky between scene visits.** GameScene
  instances are constructed once in main.js and reused on every visit.
  After a portal click set `_isTransitioning = true` and the scene
  shut down, the flag persisted. Coming back, no portal in that scene
  would fire because the guard returned early. Fix: reset state in
  `init()`. This was the "portals stop working after a few rooms" bug.
- **Amelia getting lost off-screen.** Resting position now picked from
  five candidate columns (centre / left / right / left-of-centre /
  right-of-centre), choosing the first that's at least half a sprite
  away from every portal sprite. She always ends visible and never
  blocking a portal click.
- **Z-ordering.** Sprites (characters, things, portals, gems, Amelia)
  all set their depth equal to their screen-y. Lower-on-screen sprites
  render in front of higher ones (standard 2.5D layering). Fixes
  "Amelia walks behind a peep that's visually in front of her" and
  related clickability problems. Hotspot zones inherit the speaker's
  depth so clicks route to the visually-front sprite.

### UX polish

- **Hover effect toned down.** Buttons and corner UI no longer scale
  up — they brighten via alpha (the bg goes from 0.92 to 1.0) so the
  text stays perfectly readable on hover.
- **Corner-button labels clearer.** "AM/AL/AS" → "text S/M/L". "mute"
  → "sound on / sound off". "still/wind" → "still / motion".
- **Speech bubbles.** Replaced the fixed bottom-of-screen `DialogueBox`
  with a real speech bubble that anchors to the speaking sprite and
  has a triangular tail pointing at them. Auto-flips above/below
  based on the speaker's screen position. Narrator-only hotspots
  (Tiny Museum, Question Stone) still use a soft top banner with no
  tail.
- **Per-character SFX pools.** Each peep/animal/thing now picks its
  click sfx from a small pool (2–4 sounds) instead of always playing
  `sfx_pop`. New `src/content/sfxPools.js` defines pools per character
  with sensible defaults (Pepsi yips, Wawoo swooshes, Conaloo chimes).
  No more "I clicked five different things and they all went pop pop
  pop pop pop".

### Gem collectathon (new mechanic)

- **GemBag** — singleton that tracks total stones and per-gem counts.
- **GemHUD** — top-left panel shows the running total. On collect,
  animates a "+N → total" math reveal that floats up next to the
  counter while the counter itself ticks from previousTotal up to
  newTotal. Edutainment hook: a 4-year-old sees the addition happen.
- **Gem placement** — scenes now have a `gems` field listing
  placements. Each gem renders with a slight random rotation so they
  don't all look identical, plus a gentle bob/twinkle. Click → swap
  to glowing variant → fly to HUD over 600ms with shrinking scale →
  on arrival, GemBag.add fires the math reveal.
- 9 gems (gem_1 through gem_9, values 1..9) sprinkled across all 11
  scenes. Total possible: 45+ stones depending on scene revisits.

### Inventory expansion

- Inventory model changed from `Set<thingKey>` to `Map<thingKey, count>`.
- HUD shows a "×N" badge on stacked items.
- 10 new collectable things wired into scenes (teddybear, books,
  flashlight in the bedroom; microscope, globe, backpack at the
  school; hourglass on the rooftop; bucket and banana at the
  waterfall; cake still in the playground; tyre still pending).

### Maze topology + new scenes

- Hub portals reduced from 4 to 3 (cottage / lake / playground).
  Seaside is now reachable through the village or the waterfall.
- 4 new scenes from the new backgrounds:
  - `girls-bedroom` — Amelia's room, lullaby music, teddy + books +
    flashlight to collect, Pepsi sleeping.
  - `school-courtyard` — Cosenae and Lulumi, microscope + globe +
    backpack collectables, a chalkboard Tiny Museum that touches
    numbers / letters / "if-then" recipes.
  - `skyscraper-roof` — Conaloo and Wawoo overlooking the city,
    hourglass collectable, philosophical Question Stone.
  - `waterfall-mt-fuji-in-distance` — Lucy and Cofeenie by the
    water, bucket + banana, art-history Tiny Museum about the famous
    far-distant mountain.
- Topology is now non-linear:
  - cottage ↔ bedroom ↔ (back to cottage)
  - lake-childlike ↔ vista ↔ skyscraper-roof
  - lake-childlike → waterfall ↔ seaside
  - playground → school ↔ village
  - village ↔ school
- Every scene reachable; many destinations have 2+ paths from hub.

### Out of scope (deferred to v1.3)

- **Mobile/tablet responsive scaling.** Needs a layout pass.
- **Sprite animations** (rocketship launch, dog flip).
- **Inventory-aware character lines** (peeps reacting to what
  Amelia is carrying — combination logic, etc).

## 2026-05-09 — v1.1: protagonist, visible portals, title screen, big polish pass

Branch `v1-1-protagonist-and-polish`. OpenSpec proposal in
`/openspec/changes/v1-1-protagonist-and-polish/`. Addresses every blocker the
4-year-old's dad reported in the v1.0 playtest.

### Headline

- **Amelia is the protagonist.** Click anywhere → she walks toward the
  click; click a peep/animal/thing → she walks to them, then they speak.
  Click a portal → she walks to it, the camera fades, and the next scene
  loads. New `Protagonist` system in `src/systems/Protagonist.js`.
- **Portals are visible.** Each portal in every scene now renders a
  `portal_*.png` sprite with a soft pulsing animation and a labeled
  destination ("home", "the lake", "the playground", "the seaside",
  "the village", etc). Five portal sprites the user dropped in are wired
  across the seven scenes; door, ladder, slime-portal, blue-magic, green-magic.
- **Title + Tutorial scenes.** New `scene:title` (rhyming title card,
  "Let's go!" + "How to play" buttons) and `scene:tutorial` (single
  rhyming page explaining the controls, with Amelia's portrait and a
  Continue button). First-launch flag in localStorage routes through
  the tutorial once; subsequent launches go straight to the hub.
- **Music autoplay unlock.** First gesture (the title's Start click)
  resumes the WebAudio context. No more silent first-load.
- **Smooth transitions.** Portal click → 400–800ms walk to portal → 600ms
  fade out → destination scene fades in with Amelia entering from the
  matching opposite edge. No more "click portal, see popup, click again
  to teleport".

### UX fixes

- **No more hit-box flash.** The transparent halo `Graphics` rectangle
  that appeared on hover (and again on click) is gone. Hover now lightly
  tints + scales the *speaker sprite itself*; click does a 130ms scale
  bounce + a small sparkle particle ring at the click point. (Reduced-
  motion: short tint flash, no scale tween, no particles.)
- **Smarter dialogue cycling.** Hotspots now use an exhaustive shuffle
  queue: every unique line is shown once before any line repeats. The
  every-7th-click `rare_response` mechanic is gone — those lines fold
  into the regular pool so all content is reachable without forcing
  Dad to read a repeat.

### New asset support

- New `portal_*` parser in `AssetManifest.js` for the user's portal
  sprites (door, ladder, slime-portal, portal_blue, portal_green,
  open-door, office-door-portal). All seven loaded.
- New `gem_*` parser. Gem assets are recognized and indexed but **not
  loaded into the runtime cache yet** — reserved for an upcoming
  feature the user wants to design separately.
- New 3-part `peep_{name}_{descriptor}` form (Loosa cactus, Tootsie
  friendly-cactus, Wawoo robo-snowman, Konessa has-flower) — already
  shipped in the previous batch but worth restating.

### Inventory (skeleton)

- `Protagonist` keeps a `Set<thingKey>` collection.
- `InventoryScene` is a global UI scene that renders the held items as a
  small panel along the bottom of the screen.
- The birthday cake (`thing_birthday-cake-with-one-candle`) is now a
  collectable hotspot in the playground — clicking it the first time
  pops the sprite away with a sparkle and adds it to Amelia's inventory.
- Inventory-aware character reactions deferred to v1.2.

### Bug fixed mid-pass

- `Protagonist.attach()` registered a `shutdown` listener on the
  current scene that destroyed `this.sprite`. When Amelia transitioned
  between scenes, the *previous* scene's shutdown fired *after* the new
  scene's `attach()` had already reassigned `this.sprite` to the new
  sprite — so the shutdown listener was destroying the *new* sprite by
  reference, leaving Amelia missing on every scene after the first.
  Fixed by capturing the sprite reference in a closure local to the
  attach call so the listener destroys the right one.
- `AudioManager.playMusic()` referenced `this.game.tweens` (which is
  undefined in Phaser 3 — tween managers are scene-scoped, not
  game-scoped). Now takes an optional `scene` argument; falls back to
  the first active scene's tween manager.
- `BootScene` data-passing: `onReady` now passed via
  `game.scene.add('boot', BootScene, true, { onReady })` so Phaser's
  auto-call to `init(data)` doesn't clobber it.

### Layout fixes

- Title font scales by min(width-, height-based) so the title isn't
  cropped on narrow viewports (preview panel, phone portrait).
- Tutorial verse and Amelia portrait don't overlap; Continue button
  anchored to the panel bottom.
- Sprite sizing in `GameScene` accepts `heightFrac` (preferred) so
  source PNGs at 2048×2048 don't render gigantic.

### Tooling

- Installed Anthropic's `superpowers` plugin from the official
  marketplace (14 skills available next session: brainstorming, TDD,
  systematic-debugging, writing-plans, etc).
- OpenSpec change proposal at
  `openspec/changes/v1-1-protagonist-and-polish/{proposal,tasks}.md`.

### Open hooks for next pass / playtest feedback

- Inventory-aware character reactions: when Amelia carries the cake,
  mommy notices; when she carries the flower (post-collectable), Konessa
  responds. Lines drafted but not wired.
- Speech bubbles anchored to character (Phase 3 from the proposal —
  current dialogue still uses the centred panel; positioning is improved
  but not yet a tail-pointing bubble).
- World coherence callbacks (Phase 6 from the proposal) — characters
  referencing each other.
- `anima_Umi_jelly-fish.png` filename typo still skipped. Renaming
  unblocks Umi (bio + placement ready in `Konessa.md`-style format).
- The 9 unused-but-loaded SFX (honk, twinkle, jackpot, etc.) wait for
  hotspot-specific bindings.

## 2026-05-09 — Third pass: audio + 3 new scenes + 4 new characters

**Touched:** `src/content/scenes.js`, `src/content/characters.js`, `src/content/audioAliases.js` (new), `src/systems/AssetManifest.js`, `src/systems/AudioManager.js`, `docs/characters/*`, `docs/scenes/*`, `docs/THEME_COVERAGE.md`.

**Added:**
- **Audio alias system** (`src/content/audioAliases.js`) so scenes can keep using friendly names like `music_calm`, `sfx_pop`, `sfx_chime` while `AudioManager` resolves them to the actual descriptive filenames the user dropped in (Epidemic Sound titles, named music tracks). Drop a new sfx file in, edit one line in `audioAliases.js`, done.
- **Parser support for 3-part peep_** form (`peep_{name}_{descriptor}.png`) so non-canonical-human peeps like `peep_Loosa_cactus`, `peep_Tootsie_friendly-cactus`, `peep_Wawoo_robo-snowman` parse correctly. Stored as `descriptor` field. The 4-part canonical form still works for actual humans.
- **4 new character bios + dialogue:** Keefa (M25, wandering musician), Loosa (cactus, slow), Tootsie (friendly-cactus, emphatic), Wawoo (robo-snowman, mechanical with one "wawoo" per response).
- **3 new hand-authored scenes:** `fantasy-garden-playground` (Loosa + Tootsie + Amelia + Seesa, with two colourful trees and a birthday cake), `seaside-village-sunset` (Keefa + Conaloo + Pepsi, sunset/waves/seagulls), `whimsical-villiage` (mommy + daddy + Lulumi + Cosenae + Wawoo, glass house centerpiece). Each scene 7–9 hotspots.
- **2 new portals from hub** to whimsical-villiage (top) and fantasy-garden-playground (bottom). All 7 scenes now reachable; every scene→hub in ≤2 clicks via portals (1 click via the home button).
- **Music wired to scenes** via aliases — each scene gets a different track:
    - hub → Nose_Cone_Waltz
    - cottage → Seven_Clocks_And_One_Key (lullaby — clocks)
    - lake-childlike → Sunlight_on_the_Garden_Path
    - lake-vista → Across_The_Threshold (journey)
    - playground → Button_Mash_Sunshine (silly)
    - seaside → Sunlight_on_the_Garden_Path (warm)
    - village → Quick_Pick_Up (bustle)
    - `Skyward_Bound_Sprint` is currently unused — available for a launch-the-rocket easter egg.
- **3 new things wired in:** `thing_colourful_tree_A` and `_B` flank the cacti in playground; `thing_birthday-cake-with-one-candle` near Tootsie (with its own Tiny Museum hotspot on cultural birthday rituals); `thing_funky-house-glass-colourful` is the centerpiece of whimsical-villiage.

**Theme coverage:** every theme now ≥2 (most ≥4). See `docs/THEME_COVERAGE.md`.

**Open hooks for next agent:**
- `anima_Umi_jelly-fish.png` is still in `/assets/` with the `anima_` typo, still being skipped. Fix the filename and Umi will appear; write `/docs/characters/Umi.md` and place him in seaside-village-sunset (logical home).
- The `Skyward_Bound_Sprint` track is unused — perfect candidate for a rocketship rare-response that briefly cross-fades to it during a fake "launch."
- The `thing_funky-house-glass-colourful` is currently *just* decorative + a Tiny Museum hotspot. It could become a portal to a new interior scene (`bg_glass-house-interior` if/when one lands).
- `whimsical-villiage` filename has the typo `villiage` (preserved per CLAUDE.md §3) — the slug is `whimsical-villiage` everywhere.

## 2026-05-08 — Second pass (assets in flight)

**Touched:** `src/content/scenes.js`, `src/content/characters.js`, `docs/characters/*`, `docs/scenes/*`, `docs/THEME_COVERAGE.md`.

**Added:**
- Hand-authored scene definitions for all four backgrounds that landed: `sunny-rocket-garden` (HUB), `cosy-cottage-interior`, `mountain-lake-childlike`, `mountain-lake-vista`. Each has 6–9 hotspots with 3+ rhyming responses, themes, and at least one portal.
- Bios + 5 sample lines for every character that landed: Conaloo (bear-butterly), Monaloo (butterfly), Seesa (pink bee), Cofeenie + Lucy (Queen-of-Rabbits-Twin), Pepsi (dog-thing), Amelia (F4), Cosenae (M5), Lulumi (F14), mommy, daddy.
- Tiny Museum hotspots filling the three empty themes: `countdown` and `trade` in the garden (numbers + economics), `tea` and `shelf` in the cottage (economics + cs), `pebbles` at the lake (numbers), `notebook` at the vista (cs).
- `applyDisplaySize` helper in `GameScene` so sprites size relative to viewport height (`heightFrac`) — needed because source PNGs are 2048×2048 and explicit scale multipliers were producing huge sprites.
- Default hub preference list now favours `sunny-rocket-garden`.
- `BootScene` data-passing fixed: Phaser calls `init(data)` automatically when a scene starts, so `onReady` is now passed via `game.scene.add('boot', BootScene, true, { onReady })` instead of being mutated on the instance (which Phaser was clobbering).

**Theme coverage status:** every theme in GDD §8 now has ≥2 hotspots somewhere. See `docs/THEME_COVERAGE.md`.

**Open hooks for next agent / next session:**
- `anima_Umi_jelly-fish.png` is in `/assets/` with a typo in the prefix (`anima_` not `animal_`). Manifest correctly skips it. When renamed, write a bio (`/docs/characters/Umi.md`) and place Umi somewhere — probably an upcoming underwater scene.
- No `music_*` or `sfx_*` assets yet. Existing scenes already reference `sfx_pop`, `sfx_chime`, `sfx_step` and `music_calm`, `music_curious` by key — when these land they'll wire automatically.
- The `cosy-cottage-interior` scene's hotspots assume a fireplace/window exist in roughly the upper-left and upper-middle of the painting. If the actual painting differs, retune coordinates.
- `mountain-lake-vista` needs a `peep_painter` or `thing_easel` to fully sell the "two paintings of the same place" theme — see `docs/scenes/mountain-lake-vista.md` for the design hook.

## 2026-05-08 — Initial scaffolding

**Touched:** entire repo (greenfield).
**Added:**
- Vite + Phaser 3 project with `npm run dev / build / preview / check-coverage`.
- Asset manifest plugin (`/src/plugins/manifestPlugin.js`) that walks `/assets/` recursively, parses every filename via the contract in CLAUDE.md §3, and writes `/src/content/manifest.json`. Watches in dev for hot reload.
- Core systems: `AssetLoader`, `AssetManifest`, `HotspotManager` (with hover halo + click-cycling + 1-in-7 rare responses), `DialogueBox` (auto-positions, auto-dismisses, reduced-motion aware), `AudioManager` (crossfading music + SFX, mute), `Accessibility` (mute / reduced-motion / text-size persisted to localStorage), `SceneRouter` (fade-through transitions, soft history, home button).
- Scenes: `BootScene` (preloads everything, friendly progress bar), `WaitingScene` (placeholder when no `bg_*` assets exist yet), `GameScene` (generic scene driver — bg, things, characters with idle bob/sway, hotspots, remix overlays).
- Persistent `GlobalUIScene` for corner controls (home, mute, reduced-motion, text-size).
- Content layer: empty `scenes.js`/`characters.js` ready for hand-authored entries; full generic rhyme pool in `lines.js` (per-region + per-theme); `autoScene.js` builds a playable scene for any `bg_*` without a designed entry, so dropping in a fresh background is never a dead wall.
- Docs: `WRITING_STYLE.md`, `HOTSPOT_PATTERNS.md`, `THEME_COVERAGE.md`, `PLAYTEST_NOTES.md`.
- `scripts/check-coverage.js` to flag any unused asset against scenes.js + characters.js.
- OpenSpec initialised at `/openspec`.

**Open hooks for next agent:**
- `/src/content/scenes.js` is empty — once real `bg_*` assets land, replace each auto-generated scene with bespoke hotspots, remixes, and theme tags.
- `/src/content/characters.js` is empty — write a bio + 5+ dialogue lines for each `peep_*` and `animal_*` sprite.
- Wire up `thing_*` sprites that look like wearable hats into rare-response remixes per `Hotspot Patterns: thing-becomes-hat`.
- The reduced-motion settings round-trip is implemented but never UI-tested with real motion content. Verify before MVP.
- `npm install` not yet run on this machine.

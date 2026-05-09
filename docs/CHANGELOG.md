# Changelog

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

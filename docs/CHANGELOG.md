# Changelog

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

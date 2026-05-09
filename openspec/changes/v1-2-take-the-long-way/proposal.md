# v1.2 — Take the Long Way

## Why

After v1.1 fixed hit detection on the menus, Dad got into the game on
Vercel and surfaced a fresh batch of issues. Some are regressions
(portals stop being clickable after a few transitions; Amelia
occasionally ends a transition off-screen), some are clear v1.0/v1.1
shortcomings he can now actually feel (hover effect too aggressive;
character SFX repetitive; dialogue still in a fixed panel; AM/AL/AS
toggle is opaque), and the rest are next-step features (gem
collectathon, inventory stacking, more scenes, game rename).

This change addresses the regressions + the most-requested features.
Mobile scaling and per-sprite animation polish are deferred to v1.3.

## What Changes

### Bug fixes (regressions / blockers)

- **`_isTransitioning` was sticky across scene visits.** GameScene
  instances are constructed once in `main.js` and reused — when Phaser
  re-runs a scene the instance state persists. So setting
  `_isTransitioning = true` on the first portal click meant subsequent
  visits to that same scene had a permanently-blocked transition flag.
  Fix: reset `_isTransitioning = false` in `init()`.
- **Amelia gets lost off-screen.** When the user clicks a portal mid-
  way through her entry walk, the old tween is replaced and the new
  one runs from her current (possibly off-screen) position. Fix: clamp
  her resting position to the visible scene; ensure entry walk always
  ends at a visible "rest point" (left third, middle third, or right
  third) chosen to avoid covering a portal sprite.
- **Z-ordering swallows clickability.** Sprites at the same depth can
  cover each other (Amelia walks in front of a peep at the wrong y).
  Fix: assign depth based on the sprite's screen-y so sprites lower on
  the screen render in front of sprites higher up — standard fake-2.5D.
  Portals get a fixed depth above background but below characters.

### Polish (UX clarity)

- **Hover effect is too loud.** Currently the bg + label scale up 4%,
  which makes buttons jump and obscures text on hover. Replace with a
  subtle glow (slight tint + alpha lift) — no scale change. Keep the
  small click bounce.
- **AM / AL / AS toggle is opaque.** Rename to a self-evident "Aa"
  icon plus an "S" / "M" / "L" badge, OR a plain text "size: M". Pick
  the option that's clearest at a glance.

### Game identity

- **Rename the game.** "Conaloo's Big Adventure" → **"Take the Long
  Way"** in the title scene, the page `<title>`, the README, the
  package.json name, the docs. The directory + repo name stay
  ConaloosBigAdventure (Conaloo is still the bear-butterly).

### New mechanics

- **Speech bubbles.** Replace the fixed-position `DialogueBox` with
  `SpeechBubble`: rounded panel + small triangular tail pointing at
  the speaker sprite. Auto-position above (or below if speaker is in
  the upper half of the screen). Narrator-only hotspots (Tiny Museum,
  Question Stone) get a soft top-of-screen banner with no tail.
- **Per-character SFX pools.** Each character has 2–4 SFX it picks
  from on click, weighted toward the character's voice (e.g. Pepsi
  picks `sfx_voice_yip` and `sfx_pop`; Wawoo picks `sfx_swoosh` and
  `sfx_descend`; Conaloo picks `sfx_chime` and `sfx_twinkle`). Other
  hotspot types randomize from a small relevant pool.
- **Gem collectathon.** Scatter `gem_*` sprites across scenes. Click
  one → it briefly glows (swap to `gem_{n}_glowing` variant) → tweens
  toward a HUD counter in the top-left, leaving a sparkle trail →
  the counter shows `+N → totalAfter` momentarily. The total is
  Amelia's "stones" (we use a non-money word). Some peep responses
  reward 1–3 random gems sprayed from the speaker.
- **Inventory stacks + reactions.** Inventory entries become
  `{ key, count }` instead of a flat `Set`. Multiple of the same item
  show a small badge with the count. Some peep responses reference
  what Amelia is carrying ("Three bananas? Cosenae says that's enough
  to invent a song.").
- **Maze-ish topology + new scenes.** Hub goes from 4 portals to 3.
  Add 4 new scenes from the new backgrounds:
  - `bg_girls-bedroom.png` → Amelia's bedroom (lullaby vibe).
  - `bg_school-courtyard.png` → schoolyard (where Cosenae would be in
    his element).
  - `bg_skyscraper-roof.png` → high vista (philosophy / city + sky).
  - `bg_waterfall-mt-fuji-in-distance.png` → far-away water scene.
  Each gets a portal in/out forming a non-linear graph; the home
  button always returns to hub but in-scene portals make some
  destinations reachable via different paths (so revisiting a scene
  may have different gem placements).

### Asset usage cleanup

- Wire 10 new `thing_*` files dropped in this batch (backpack, banana,
  books, bucket, flashlight, globe, hourglass, microscope, teddybear,
  tyre) as collectables placed across scenes per the maze.
- All 11 backgrounds now have hand-authored scenes.
- Continue to leave `gem_` files reserved-but-not-yet-runtime-loaded
  until *this* change wires them in.

## Out of scope (deferred to v1.3)

- **Mobile/tablet responsive scaling.** Will need a layout pass:
  font-size clamps, button-size clamps, scene-bounds-aware rest points.
  Big enough work to deserve its own pass after gem mechanics are
  proven.
- **Sprite animations.** Rocketship launch animation, dog flip, etc.
  Per-sprite cinematic moments — fun but deep work and not on the
  critical path for the next playtest.
- **Inventory-aware character lines** beyond the simple "you have N
  of X" reaction (no combination logic yet).

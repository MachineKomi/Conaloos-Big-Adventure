# v1-1-protagonist-and-polish — Tasks

Each phase is committable on its own. Verify before moving to the next.

## Phase 1 — Visual fixes & autoplay (smallest, highest visibility)

- [ ] **Remove hit-box halo flash.** Delete the hover-halo `Graphics` rectangles in `HotspotManager._create`. Hover effect for sprite hotspots becomes a soft `setTint` + slight `setScale(1.04)` on the sprite itself.
- [ ] **Bounce on click.** Click triggers a 120ms scale tween (1 → 1.12 → 1) on the sprite. Reduced-motion: skip the tween, just briefly setTint.
- [ ] **Sparkle particles on click.** A small ring of sparkle particles emit from click position (use Phaser's particle emitter, or simple pooled `Image` tweens). Reduced-motion: skip particles.
- [ ] **Portal markers.** Replace invisible portal zones with visible markers: a small arrow sprite + label text ("to the cottage", "to the lake"). Pulse gently. Position at the scene edge that the portal lives on. Add to `GameScene._renderPortalMarkers`.
- [ ] **Music autoplay unlock.** Defer first `playMusic` call until after a user gesture in the title scene. The audio context resume happens on the Start button click.
- [ ] Verify in preview: no visible rectangles ever drawn over bg, sprites bounce on click, portal markers visible, music plays on first scene after Start click.

## Phase 2 — Title screen & tutorial flow

- [ ] **TitleScene** with rhyming title card, Start button, How-to-Play button, Settings (mute / motion / text-size). Renders over a randomly-picked background.
- [ ] **TutorialScene** with Amelia sprite, a background, one short rhyming explanation, single Continue button.
- [ ] **First-launch flag** in localStorage: shown once, then subsequent launches skip to hub.
- [ ] Wire Start → TutorialScene (first launch only) → hub. Wire How-to-Play → TutorialScene from anywhere → back to title.
- [ ] Verify in preview: fresh localStorage shows title → tutorial → hub. Reload skips to title → hub. Music plays after Start.

## Phase 3 — Speech bubbles

- [ ] **SpeechBubble** component (`src/systems/SpeechBubble.js`): rounded panel with a small triangular tail pointing at the speaker. Auto-positions above the speaker, flips to below if speaker is in the upper half.
- [ ] **DialogueBox replacement.** GameScene + HotspotManager use SpeechBubble for any hotspot that has a `speaker` (the character key). For narrator-only hotspots (Tiny Museum, Question Stone), use a softer top-of-screen banner (no tail).
- [ ] Tap-anywhere-empty dismisses the bubble (existing behaviour).
- [ ] Verify in preview: clicking a character renders a speech bubble pointing at them; clicking the rocketship/sun renders a top banner.

## Phase 4 — Smarter dialogue cycling

- [ ] **Exhaustive cycle.** HotspotManager tracks an `unseen` queue per hotspot. Each click pops one. When empty, refill from the response list (re-shuffled). Drop `clickCount % responses.length` cycling.
- [ ] **Remove rare_response field** from schema; merge any existing rare lines into the regular `responses` array. Sweep `src/content/scenes.js` and `characterHotspot()` helper.
- [ ] Persist the queue per-hotspot for the duration of the scene visit; reset when the scene unloads.
- [ ] Verify: clicking the same character three times yields three different lines; eventually loops in shuffled order.

## Phase 5 — Protagonist (Amelia)

- [ ] **Protagonist system** (`src/systems/Protagonist.js`): owns Amelia's sprite, position, and tween-to-click logic.
- [ ] On scene enter: spawn Amelia at the entry point from the portal she came through. Default: bottom-center.
- [ ] On any click: Amelia tweens toward (clickX, sceneFloor) over ~400ms. Hotspot/portal fires when she arrives. Clicks during a walk queue or override.
- [ ] Click on Amelia herself: she says one of her own lines.
- [ ] Add Amelia placeholder character entries to scenes that don't have her (cottage, lake-childlike, lake-vista, seaside, village). Hide if Protagonist is rendering Amelia.
- [ ] Reduced-motion: instant teleport instead of tween.
- [ ] Verify: Amelia visible in every scene; clicks move her; portals only fire after she arrives at the marker; reduced-motion skips the walk.

## Phase 6 — World coherence pass

- [ ] **Callbacks library** (`src/content/callbacks.js`): collection of cross-character references — lines a character says about another character, or a recurring motif (the star, "...and then what?", "mm-hmm").
- [ ] Mix 1–2 callbacks into each character's response pool. They should feel like they belong, not like easter eggs.
- [ ] **Through-lines:** a small handful of motifs that recur across the world — at minimum: (a) Conaloo's quiet "mm-hmm" appearing in others' lines, (b) Amelia naming a thing in one scene that another character mentions in another, (c) Lulumi's notebook listing things from other scenes.
- [ ] Update WRITING_STYLE.md with a new "Coherence" section.

## Phase 7 — Asset usage cleanup

- [ ] Rename `assets/anima_Umi_jelly-fish.png` → `assets/animal_Umi_jelly-fish.png` (typo in code prefix). Write Umi bio. Place Umi in `seaside-village-sunset` as a Wanderer cameo.
- [ ] Wire underused SFX into specific hotspot types: `sfx_jackpot` on portal arrival, `sfx_coin` on a counting hotspot's last response, `sfx_powerup` on the rocketship's last response, etc.
- [ ] Run `npm run check-coverage`: pass.

## Phase 8 — Verification & ship

- [ ] Manual smoke test from a fresh localStorage: Title → How to Play → back → Start → Tutorial → Hub → walk Amelia → click cottage portal → cottage → home button → hub.
- [ ] Production build (`npm run build`) succeeds, total dist under 80 MB.
- [ ] Update `CHANGELOG.md`, `THEME_COVERAGE.md`, `HOTSPOT_PATTERNS.md` (new patterns introduced — speech bubbles, portal markers).
- [ ] Commit and push. Tag the commit `v1.1.0`.
- [ ] Verify the Vercel deploy preview against the same checklist.

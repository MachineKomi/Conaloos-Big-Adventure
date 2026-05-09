# v1.1 — Protagonist & Polish

## Why

The 4-year-old playtested v1.0 (in browser, on tablet, in the Claude desktop window) and the dad relayed several show-stoppers and quality-of-life issues. The biggest are:

1. **Portals are invisible.** A player can complete the entire game thinking it's one screen with seven characters that say things. The seven backgrounds and the connections between them are not discoverable. **This is the single most important issue** — without a fix, the asset pack might as well be one scene.

2. **No music in the playtest** despite the audio system being wired. Almost certainly a browser autoplay-policy issue (sound only allowed after first user gesture).

3. **Hit-box flash.** Clicking a hotspot flashes an ugly transparent rectangle (the hover halo I added is showing on click too). Looks broken.

4. **Dialogue is a fixed pop-up at top/bottom**, not a speech bubble anchored to the speaker. Less expressive, slightly disorienting.

5. **Sprites don't react to being clicked.** Click feedback is only the dialogue text. A 4-year-old expects motion: the thing she clicked should *do* something visibly, even briefly.

6. **No start menu / tutorial.** A child opening the game for the first time has no setup, no greeting, no idea how to play.

7. **Rare-response (every 7th click).** Returning to the same dialogue after a few clicks is bad for a child who can't read — Dad has to read aloud, and the repetition tells him she's exhausted the content even though there's more behind the scenes. Better behaviour: serve every unique line first, *then* allow cycling.

8. **No through-line / coherence between characters.** The world feels like a cast of strangers each delivering a monologue. Children love callbacks, inside jokes, characters talking about each other.

9. **Amelia is one of the cast, not the protagonist.** She's the daughter the game is being made for. She should be present in every scene and be the one moving through the world.

10. **Underused assets.** 18/21 SFX are loaded but never triggered. Skyward_Bound_Sprint music is unused. One file (`anima_Umi_jelly-fish.png`) is skipped due to a typo in the filename prefix.

The solution is a v1.1 release that makes the game *legibly* a game: a thing with a beginning (start menu), a guide (tutorial), a player-character (Amelia), reactive feedback (sprite glow + bounce on click, speech bubbles), discoverable navigation (visible portal markers), and a coherent world (cross-character references and through-lines).

## What Changes

### Adding new capability

**Start screen + tutorial flow**
- `TitleScene` — title card, Start, How to Play. Rhyming.
- `TutorialScene` — Amelia + a background, one rhyming explanation of the game, single button to continue. Rhyming.
- These run before the hub on first launch; subsequent launches go straight to the hub (a tiny localStorage flag).

**Protagonist system**
- Amelia is rendered in every scene at the entry point that matches the portal she came through (left portal → enters from left, etc.). On the first scene (hub from title), she enters from the bottom.
- Click anywhere → Amelia tweens toward the click point (cap at scene Y so she stays grounded), then the hotspot/portal fires.
- She remains clickable; clicking on Amelia gives her own line.
- Brief idle bob unless reduced-motion is on.

**Discoverable portals**
- Replace invisible portal hotspots with visible **portal markers**: a soft glowing arrow + small label showing where it goes. Pulse gently. Reduced-motion: static glow.
- Place markers at the canonical edges (left/right/top/bottom) so the navigation grammar is consistent across scenes.

**Speech bubbles**
- Replace fixed `DialogueBox` with a `SpeechBubble` that anchors above (or below if the speaker is in the upper half) the speaking character. Tail points to the speaker.
- For narrator-only hotspots (Tiny Museum, Question Stone) where there's no speaker, use a softer book-style banner at top.

**Click feedback**
- On click of any sprite hotspot, sprite quickly bounces (~120ms scale-up-and-back) and emits a small sparkle particle ring.
- Hover state stays subtle (no rectangle flash). Use a soft drop-shadow / outline on the sprite when hovered, not a halo behind it.

**Smarter dialogue cycling**
- Hotspots track *unseen* responses. The next click serves an unseen one. When all are seen, the cycle starts over (in different order so even the second-pass feels fresh).
- Drop the every-7th-rare-response trigger entirely. Rare responses, when present, become *part of the unseen pool*, just placed at the back of the queue.

**Music autoplay unlock**
- The first user gesture (the Start button on the title screen) unlocks the audio context, then music for the first scene fades in. No silent first-load.

**Cross-character coherence**
- Add a small library of **callback lines**: lines a character says ABOUT another character ("...Lulumi keeps a list. I'm on it. I checked." said by Amelia). Threaded through the existing dialogue pools.
- Add a few recurring motifs: a mention of a star, a recurring "and then what?", Conaloo's quiet "...mm-hmm" appearing in other characters' lines as a referenced echo.

### Removing capability

- Remove the unused `1-in-7 rare_response` field on hotspots. Existing rare responses fold into `responses[]`.
- Remove the `halo` rectangle behind hover hotspots.
- Remove the fixed-position `DialogueBox` (replaced by `SpeechBubble`).

### Bug fixes

- Browser autoplay: defer first `playMusic` call until after the title-screen Start click.
- The `anima_Umi_jelly-fish.png` filename typo: rename to `animal_Umi_jelly-fish.png` (the typo is in the *code prefix*, not in any name the daughter chose) and write Umi's bio + place him in seaside-village-sunset.
- Hit-box flash: rewrite hover/click visuals so no rectangle is ever drawn over the bg.

## Impact

**Affected specs:** none yet (we don't have authored specs in `openspec/specs/` yet — first time using OpenSpec). Adding `gameplay` spec capturing player-character behaviour as part of this change.

**Affected code:**
- `src/scenes/` — new TitleScene, TutorialScene; existing GameScene gains protagonist hook + portal-marker rendering.
- `src/systems/` — new `Protagonist.js`, new `SpeechBubble.js`, modified `HotspotManager.js` (bounce + sparkle, exhaustive cycle), modified `AudioManager.js` (autoplay unlock).
- `src/content/scenes.js` — replace portal hotspot definitions with declarative `exits: { left: '...', right: '...' }` so the engine can render markers consistently.
- `src/content/characters.js` — add `callbacks` field to characters; sprinkle through dialogue.
- `assets/anima_Umi_jelly-fish.png` → `assets/animal_Umi_jelly-fish.png` (rename).

**Compatibility:** breaks the v1.0 hotspot schema (`rare_response` removed, portals migrated to `exits`). The migration is mechanical and we'll do it in this change.

**Risk:** moderate. Several systems change at once. Mitigated by:
- Making the change in a `v1-1` git branch (not master).
- Writing each phase with verification before moving on.
- Keeping the existing structure where possible — this is *additive* for most things (protagonist, speech bubbles, click feedback) and only schema-changing for portals + rare_response.

## Late additions (Dad's follow-up feedback)

- **Portal sprites.** User dropped `portal_*` files into `/assets/` (door, ladder, slime-portal, portal_blue, portal_green). Add a new `portal` asset type to the parser. Render visible portal sprites at each scene's exit points instead of just glow markers.
- **Smooth scene transitions.** The biggest playtest pain point: clicking a portal currently fires a *dialogue* about the portal, then transitions on dismiss. The dialogue feels like a wall; the kid doesn't realise it's a transition. Replace with: Amelia walks to the portal sprite → 600ms cross-fade → next scene loads with Amelia entering from the matching opposite edge.
- **Inventory.** Amelia collects `thing_*` items by walking up to them and clicking. Inventory shown as a small sprite row at the bottom of the screen. Some character hotspots react to Amelia's inventory contents (e.g. mommy notices the cake; Tootsie reacts when Amelia carries the flower).

## Out of Scope

- A full save system (still no persistence beyond accessibility settings + the title-shown flag).
- Inventory.
- Pathfinding for Amelia (her walk is a straight tween; no obstacle avoidance).
- Multiple endings, achievements, score.
- Multi-touch / gestures.

These remain explicitly out of scope per GDD §12, MVP boundaries.

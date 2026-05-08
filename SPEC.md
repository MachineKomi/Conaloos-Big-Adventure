# Technical Specification
## Point-and-Click Software Toy — MVP

**Companion to:** `GDD.md`
**Stack:** Phaser 3 + Vite + vanilla JS (no TypeScript for MVP — keep it light)
**Target:** Static web build, deployable to Netlify / Vercel / GitHub Pages
**Browser support:** Modern evergreen browsers (Chrome, Safari, Firefox, Edge — last 2 versions)
**Devices:** Desktop, tablet, phone (landscape orientation preferred on phones)

---

## 1. Project Structure

```
/
├── index.html
├── vite.config.js
├── package.json
├── README.md
├── CLAUDE.md                  ← Agent instructions (read first)
├── GDD.md                     ← Game design document
├── SPEC.md                    ← This file
│
├── /assets
│   ├── /characters            ← peep_*, animal_* sprites (PNG, transparent)
│   ├── /backgrounds           ← bg_* images
│   ├── /things                ← thing_* sprites
│   ├── /music                 ← music_*.mp3 / .ogg
│   └── /sfx                   ← sfx_*.mp3 / .ogg
│
├── /src
│   ├── main.js                ← Phaser game bootstrap
│   ├── /scenes
│   │   ├── BootScene.js       ← preload manifest
│   │   ├── HubScene.js        ← main scene class, all bg_* scenes extend or instance this
│   │   └── {bg_name}.js       ← per-scene config (one per background)
│   ├── /systems
│   │   ├── AssetLoader.js     ← discovers /assets/* and registers them
│   │   ├── HotspotManager.js  ← click zones, hover effects, response cycling
│   │   ├── DialogueBox.js     ← text rendering with rhyme support
│   │   ├── AudioManager.js    ← music + sfx with mute
│   │   ├── Accessibility.js   ← reduced motion, contrast, scaling
│   │   └── SceneRouter.js     ← portals, hub button
│   └── /content
│       ├── scenes.js          ← scene definitions (hotspots, characters, audio)
│       ├── characters.js      ← character bios + dialogue pools
│       └── lines.js           ← shared rhyme pool by theme
│
└── /docs
    ├── /scenes                ← one .md per scene, mirrors /src/content/scenes
    ├── /characters            ← one .md per character bio
    ├── HOTSPOT_PATTERNS.md    ← reusable hotspot recipes
    ├── WRITING_STYLE.md       ← extracted writing rules from GDD §5
    └── CHANGELOG.md           ← agent-maintained log of additions
```

---

## 2. Asset Discovery & Naming Contract

The game **discovers assets dynamically** based on filename convention. The agent must:

1. Read `/assets/characters/`, `/assets/backgrounds/`, `/assets/things/`, `/assets/music/`, `/assets/sfx/` at build time.
2. Generate a manifest (`/src/content/manifest.json`) parsed from filenames.
3. Use the parsed metadata to drive scene composition.

### 2.1 Filename parsers

```js
// peep_conaloo_F_10.png → { type:'peep', name:'conaloo', gender:'F', age:10 }
function parsePeep(filename) {
  const [_, name, gender, age] = filename.replace(/\.[^.]+$/, '').split('_');
  return { type: 'peep', name, gender, age: parseInt(age, 10) };
}

// animal_bobo_butterfly.png → { type:'animal', name:'bobo', species:'butterfly' }
function parseAnimal(filename) {
  const [_, name, species] = filename.replace(/\.[^.]+$/, '').split('_');
  return { type: 'animal', name, species };
}

// bg_big-field.png → { type:'bg', description:'big-field' }
function parseBg(filename) {
  const description = filename.replace(/^bg_/, '').replace(/\.[^.]+$/, '');
  return { type: 'bg', description };
}

// thing_house.png → { type:'thing', name:'house' }
function parseThing(filename) {
  const name = filename.replace(/^thing_/, '').replace(/\.[^.]+$/, '');
  return { type: 'thing', name };
}

// music_calm.mp3 → { type:'music', tone:'calm' }
// sfx_pop.mp3 → { type:'sfx', name:'pop' }
```

**Rule:** if a file's name doesn't match a parser, log a warning and skip it. Never crash on unexpected files.

### 2.2 Asset usage rule

The agent must attempt to **use every asset at least once** across the game. After scaffolding, run a script (`/scripts/check-coverage.js`) that lists any unused assets. CI-style: fail if coverage < 100%.

---

## 3. Scene Definition Schema

Each scene is a JS object in `/src/content/scenes.js`. The structure:

```js
export const scenes = {
  'big-field': {
    background: 'bg_big-field',
    music: 'music_curious',
    ambient_sfx: ['sfx_breeze', 'sfx_birds'],
    themes: ['animals', 'numbers'],
    characters: [
      { sprite: 'animal_bobo_butterfly', x: 0.3, y: 0.4, scale: 0.5, idle: 'bob' },
      { sprite: 'peep_conaloo_F_10', x: 0.6, y: 0.7, scale: 1.0, idle: 'sway' }
    ],
    things: [
      { sprite: 'thing_house', x: 0.85, y: 0.5, scale: 0.6 }
    ],
    hotspots: [
      {
        id: 'butterfly',
        bounds: { x: 0.25, y: 0.35, w: 0.15, h: 0.15 }, // normalized 0-1
        cursor: 'sparkle',
        type: 'wanderer',
        responses: [
          { text: "Bobo the butterfly bobs in the breeze,\nWith wings like the windows of fluttery trees.", sfx: 'sfx_chime' },
          { text: "He drinks from the daisies, he naps on the noon,\nAnd dreams about dancing all night with the moon.", sfx: 'sfx_chime' },
          { text: "His wings beat so quickly you'd think they were still —\nA hundred small flaps every moment, until...\nHe rests on a petal, and softly says HI.\nA butterfly's heart is the size of a sigh.", sfx: 'sfx_chime', theme: 'animals' }
        ],
        rare_response: { // 1 in 7 chance, or every 7th click
          text: "Today bobo's wearing a hat made of cloud!\nIt fits him just right, and he's terribly proud.",
          remix: { add_sprite: 'thing_house', as: 'hat', scale: 0.2, on_top_of: 'animal_bobo_butterfly' },
          sfx: 'sfx_jackpot'
        }
      },
      {
        id: 'go-to-forest',
        bounds: { x: 0.0, y: 0.5, w: 0.15, h: 0.5 },
        cursor: 'walk',
        type: 'portal',
        target: 'forest',
        responses: [
          { text: "A path through the trees? Well now, why not?\nLet's tiptoe down softly and see what we've got." }
        ]
      }
    ],
    portals: ['forest', 'house-inside', 'seashore'] // also derivable from hotspots
  },
  // ...more scenes
};
```

### 3.1 Hotspot response cycling

`HotspotManager` tracks click count per hotspot per scene-visit. On each click:

1. If `clickCount % 7 === 0` and `rare_response` exists → play rare.
2. Otherwise → play `responses[clickCount % responses.length]`.
3. Reset count when scene unloads (or persist across visits — designer choice; default reset).

### 3.2 Hotspot bounds

All bounds are **normalized (0–1)** relative to the background. This makes resizing for different screen sizes trivial. The renderer multiplies by current scene dimensions.

---

## 4. Core Systems

### 4.1 `AssetLoader.js`

- Reads manifest at boot.
- Loads everything via Phaser's loader.
- Emits `assets-ready` event when complete.
- Shows a friendly loading screen ("The crayons are warming up...").

### 4.2 `HotspotManager.js`

- Creates an invisible interactive zone per hotspot.
- On hover: applies pulse/glow shader OR (if reduced motion) a static outline.
- On click: increments counter, picks response, calls `DialogueBox.show()`, plays sfx, applies any `remix` sprite changes.
- All hotspots get a minimum 64×64 px hit area regardless of `bounds`. Pad smaller bounds.

### 4.3 `DialogueBox.js`

- Renders text in a translucent rounded panel at the bottom of the screen (or top if speaker is bottom-half).
- Auto-positions to **never overlap the speaking character**.
- Supports multi-line, animates in (fade + slight rise), auto-dismisses after a duration based on word count (~250ms per word + 1500ms buffer), or on next click.
- Uses `Atkinson Hyperlegible` (loaded as web font); fallback `system-ui`.
- Min font size: 28px on desktop, 32px on tablet/phone.
- Honours reduced-motion: instant in/out instead of fades.

### 4.4 `AudioManager.js`

- One looping music channel, one polyphonic sfx channel.
- Crossfade music between scenes (1.5s).
- Global mute persists in `localStorage`.
- Honours OS-level prefers-reduced-motion (also lowers music volume by 50%).

### 4.5 `Accessibility.js`

- Reads `prefers-reduced-motion`, `prefers-contrast` on init.
- Exposes settings UI: mute toggle, reduced-motion toggle, text-size cycler (S/M/L).
- Settings persist in `localStorage`.

### 4.6 `SceneRouter.js`

- Manages scene transitions (fade-through-white, 600ms; instant if reduced motion).
- Maintains scene stack so "back" portals work even from deeply nested scenes.
- Handles the home button (returns to hub scene; preserves nothing — fresh state).

---

## 5. Content Authoring Flow

When the agent adds a new scene:

1. Drop background `bg_{name}.png` into `/assets/backgrounds/`.
2. Add scene definition to `/src/content/scenes.js`.
3. Write `/docs/scenes/{name}.md` (template below).
4. Add at least one portal *to* this scene from an existing scene.
5. Run `npm run check-coverage` to confirm no asset is orphaned.
6. Append entry to `/docs/CHANGELOG.md`.

When the agent adds a new character:

1. Drop sprite into `/assets/characters/` (correct naming).
2. Write `/docs/characters/{name}.md` using the character bio template.
3. Place the character in at least one scene.
4. Add 5+ rhyming dialogue lines to `/src/content/characters.js`.
5. Append entry to `/docs/CHANGELOG.md`.

---

## 6. Templates

### 6.1 Scene doc template (`/docs/scenes/{name}.md`)

```markdown
# Scene: {bg_name}

**Background:** `bg_{name}.png`
**Music:** `music_{tone}`
**Ambient SFX:** `sfx_*`, `sfx_*`
**Themes:** {2-3 from GDD §8}
**Connects to:** {list of scene names}

## Mood
One paragraph. What does this place feel like? What is the child meant to feel here?

## Characters present
- `peep_*` — what they're doing here
- `animal_*` — what they're doing here

## Things in scene
- `thing_*` — placement and purpose

## Hotspots
| ID | Type | Bounds (x,y,w,h) | Theme | Responses |
|----|------|------------------|-------|-----------|
| ... | reactor | 0.3, 0.4, 0.1, 0.1 | animals | 3 lines, see scenes.js |

## Educational notes
What can the child learn here? Be specific. ("The idea that butterflies taste with their feet" is better than "facts about insects.")

## Open hooks for future agents
What could be added later? Loose ends a future scene could pick up?
```

### 6.2 Character bio template (`/docs/characters/{name}.md`)

```markdown
# {Name} the {Species/Description}

**Sprite:** `peep_{name}_{G}_{age}.png` or `animal_{name}_{species}.png`
**Voice:** One sentence describing how they speak.
**Catchphrase:** A signature rhyming line they often repeat.
**Obsession:** The single topic they cannot stop talking about (drives their teaching role).

## Backstory (light, 2-3 sentences)
Just enough to give them a flavour. Not a novel.

## Sample dialogue
1. "..."
2. "..."
3. "..."
4. "..."
5. "..."

## Where they appear
- `bg_*` — what they're doing there

## Lessons they tend to drop
List the educational themes (from GDD §8) this character naturally teaches.

## Possible remixes
Sprite combinations or scene variants where this character appears differently.
```

---

## 7. Build & Run

```bash
npm install
npm run dev      # local dev server with hot reload
npm run build    # production static build to /dist
npm run preview  # preview production build
npm run check-coverage  # verify all assets are used
```

`vite.config.js` should include:

- Base path configurable via env (for GH Pages deploys).
- Asset inlining threshold low — keep PNGs as files.
- A small Vite plugin that auto-generates `manifest.json` from `/assets/` at build time.

---

## 8. Performance Budget

- Initial load: under 8 seconds on a mid-range tablet on home wifi.
- Scene transition: under 1 second.
- No single sprite over 1MB. Backgrounds may be larger but should be optimised (target 500KB-1.5MB each).
- Audio: music tracks under 2MB; SFX under 100KB each.
- Total game: aim for under 50MB for MVP.

If we exceed budget, the agent should add a build-time image optimization step (e.g. `vite-plugin-imagemin`) before adding more content.

---

## 9. Testing Strategy

This is a throwaway toy, so **no formal test suite**. Instead:

1. **Smoke test on each commit:** game boots, hub scene loads, can navigate to and from each scene without console errors.
2. **Manual playtest with the actual 4-year-old.** Notes go into `/docs/PLAYTEST_NOTES.md`. The agent should read these and iterate.
3. **Asset coverage check** must pass before any "MVP done" claim.
4. **Reduced-motion mode** must be manually verified once before MVP.

---

## 10. Deployment

- Build output goes to `/dist/`.
- Deploy to any static host. Recommended: Netlify drag-and-drop or Vercel CLI.
- Single-page app — no routing config needed.
- Add a `manifest.webmanifest` and a service worker stub so it can be "Add to Home Screen"-ed on a tablet (PWA-ready, not full PWA in MVP).

---

## 11. Out of Scope (for MVP — be strict)

- TypeScript
- React / any UI framework
- State management library
- Save / load
- Multiple users / profiles
- Analytics
- Localisation framework
- Online features
- Real-money anything
- Account system

Adding any of these requires updating this spec first.

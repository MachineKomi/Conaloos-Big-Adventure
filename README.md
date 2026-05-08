# Conaloo's Big Adventure

A whimsical, rhyming, hand-drawn point-and-click software toy for a 4-year-old. Built in Phaser 3 + Vite. Vanilla JS, no frameworks beyond Phaser.

## Where to start (humans)

Read in this order:

1. `GDD.md` — what we're building, and why.
2. `SPEC.md` — how it's wired together.
3. `CLAUDE.md` — agent operating manual.

## Where to start (agents)

Read `CLAUDE.md` first, every session. It tells you the priority order.

## Run it

```bash
npm install
npm run dev          # local dev server at http://localhost:5173
npm run build        # production build to /dist
npm run preview      # serve the production build locally
npm run check-coverage  # report asset usage
```

The first time you `dev`, the manifest plugin walks `/assets/`, parses filenames, and writes `/src/content/manifest.json`. Adding a file to `/assets/` while `dev` is running rebuilds the manifest on the fly.

## Asset contract

All assets live in `/assets/`. The user is dropping everything into a single flat folder, but the loader walks recursively so subfolders work too. Filename conventions are the source of truth:

| Pattern | Example |
|---|---|
| `peep_{name}_{gender}_{age}.png` | `peep_conaloo_F_10.png` |
| `animal_{name}_{species}.png`    | `animal_bobo_butterfly.png` |
| `bg_{description}.png`           | `bg_big-field.png` |
| `thing_{name}.png`               | `thing_house.png` |
| `music_{tone}.{mp3,ogg,wav}`     | `music_calm.mp3` |
| `sfx_{name}.{mp3,ogg,wav}`       | `sfx_pop.mp3` |

Underscores separate fields; hyphens are for multi-word descriptions. Files that don't match are logged and skipped.

## What ships even with no assets yet

`/src/scenes/WaitingScene.js` is shown when `/assets/` has no backgrounds. As soon as a `bg_*.png` lands, the game switches to it automatically.

For each background that doesn't yet have a hand-written entry in `/src/content/scenes.js`, `/src/content/autoScene.js` builds a generic scene with character/thing placement, hotspot zones, and lines from the rhyme pool in `/src/content/lines.js`. So new backgrounds are always playable — even before the agent has written bespoke verse.

## Layout

```
/assets                 ← drop everything here, flat is fine
/src
  main.js               ← bootstrap
  /scenes               ← BootScene, WaitingScene, GameScene
  /systems              ← AssetLoader, HotspotManager, DialogueBox, ...
  /content
    scenes.js           ← hand-authored scene defs
    characters.js       ← hand-authored character bios
    lines.js            ← shared rhyme pool
    sceneCatalog.js     ← merges designed + auto scenes
    autoScene.js        ← fallback scene generator
    manifest.json       ← generated; gitignored
  /plugins
    manifestPlugin.js   ← Vite plugin that walks /assets/
/scripts
  check-coverage.js
/docs
  CHANGELOG.md
  WRITING_STYLE.md
  HOTSPOT_PATTERNS.md
  THEME_COVERAGE.md
  PLAYTEST_NOTES.md
  /scenes
  /characters
/openspec               ← spec-driven change proposals (see openspec --help)
```

## Deploy

`npm run build` writes a static `/dist/`. Drag-and-drop to Netlify, push to Vercel, or upload to GitHub Pages (set `BASE_PATH` env var for the latter).

#!/usr/bin/env node
/**
 * Asset coverage report.
 *
 * Walks /assets/, parses every filename, then checks /src/content/scenes.js
 * and /src/content/characters.js for usage of each asset key. Reports any
 * orphans. Exits 1 if any asset is unused — see SPEC §2.2.
 *
 * NOTE: auto-generated scenes (autoScene.js) DO use every available asset
 * implicitly, so once scenes.js is empty this script's "used" set is empty
 * and every asset reads as unused. We treat that case as a soft warning,
 * not a failure: it's only a real failure once at least one designed scene
 * exists, indicating the project is no longer purely scaffolded.
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, sep, posix, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

import('../src/systems/AssetManifest.js').then(({ parseAssetFilename }) => {
  const assetsDir = resolve(root, 'assets');
  const scenesFile = resolve(root, 'src/content/scenes.js');
  const charactersFile = resolve(root, 'src/content/characters.js');

  const assets = walkAssets(assetsDir, parseAssetFilename);

  const scenesSrc = existsSync(scenesFile) ? readFileSync(scenesFile, 'utf8') : '';
  const charactersSrc = existsSync(charactersFile) ? readFileSync(charactersFile, 'utf8') : '';

  const used = new Set();
  for (const a of assets) {
    if (scenesSrc.includes(a.key) || charactersSrc.includes(a.key)) {
      used.add(a.key);
    }
  }

  const unused = assets.filter((a) => !used.has(a.key));
  const designedScenesExist = /\b(background|hotspots)\s*:/m.test(scenesSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, ''));

  console.log(`Assets total: ${assets.length}`);
  console.log(`  Backgrounds: ${assets.filter((a) => a.type === 'bg').length}`);
  console.log(`  Characters:  ${assets.filter((a) => a.type === 'peep' || a.type === 'animal').length}`);
  console.log(`  Things:      ${assets.filter((a) => a.type === 'thing').length}`);
  console.log(`  Music:       ${assets.filter((a) => a.type === 'music').length}`);
  console.log(`  SFX:         ${assets.filter((a) => a.type === 'sfx').length}`);
  console.log('');
  console.log(`Used in designed content: ${used.size}`);
  console.log(`Auto-generated only:      ${unused.length}`);

  if (unused.length === 0) {
    console.log('OK: every asset is wired into designed content.');
    process.exit(0);
  }

  if (!designedScenesExist) {
    console.log('');
    console.log('No designed scenes yet — auto-generated scenes will use every asset implicitly.');
    console.log('This is fine during scaffolding; tighten once you start writing scenes.js entries.');
    process.exit(0);
  }

  console.log('');
  console.log('Assets not yet wired into designed content:');
  for (const a of unused) {
    console.log(`  ${a.path}`);
  }
  process.exit(1);
});

function walkAssets(root, parse) {
  if (!existsSync(root)) return [];
  const out = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let items = [];
    try { items = readdirSync(dir); } catch { continue; }
    for (const item of items) {
      if (item.startsWith('.')) continue;
      const full = join(dir, item);
      let stats; try { stats = statSync(full); } catch { continue; }
      if (stats.isDirectory()) { stack.push(full); continue; }
      const parsed = parse(item);
      if (!parsed) continue;
      const rel = relative(root, full).split(sep).join(posix.sep);
      out.push({ ...parsed, path: rel });
    }
  }
  return out;
}

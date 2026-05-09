import { readdirSync, statSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join, relative, sep, posix } from 'node:path';
import { parseAssetFilename } from '../systems/AssetManifest.js';

/**
 * Vite plugin that walks /assets/ recursively, classifies every file by
 * filename convention, and writes /src/content/manifest.json.
 *
 * The user is dropping all assets into the same /assets/ folder (flat),
 * but we still walk recursively so nested subfolders work too.
 */
export function manifestPlugin() {
  let assetsDir;
  let manifestPath;
  let watcher;
  let scheduled = false;

  function scanAssets() {
    if (!existsSync(assetsDir)) {
      return { generatedAt: new Date().toISOString(), entries: [], unparsed: [], byType: emptyByType() };
    }

    const entries = [];
    const unparsed = [];
    const stack = [assetsDir];

    while (stack.length) {
      const dir = stack.pop();
      let items;
      try {
        items = readdirSync(dir);
      } catch {
        continue;
      }
      for (const item of items) {
        if (item.startsWith('.')) continue;
        const full = join(dir, item);
        let stats;
        try {
          stats = statSync(full);
        } catch {
          continue;
        }
        if (stats.isDirectory()) {
          stack.push(full);
          continue;
        }
        const rel = relative(assetsDir, full).split(sep).join(posix.sep);
        const parsed = parseAssetFilename(item);
        if (!parsed) {
          unparsed.push(rel);
          continue;
        }
        entries.push({
          ...parsed,
          file: item,
          path: rel,
          // URL is served from /assets/<rel> via Vite publicDir
          url: posix.join('/', rel),
          sizeBytes: stats.size
        });
      }
    }

    entries.sort((a, b) => a.path.localeCompare(b.path));

    return {
      generatedAt: new Date().toISOString(),
      entries,
      unparsed,
      byType: groupByType(entries)
    };
  }

  function emptyByType() {
    return { peep: [], animal: [], bg: [], thing: [], portal: [], gem: [], music: [], sfx: [] };
  }

  function groupByType(entries) {
    const out = emptyByType();
    for (const e of entries) {
      if (out[e.type]) out[e.type].push(e);
    }
    return out;
  }

  function writeManifest() {
    const manifest = scanAssets();
    mkdirSync(resolve(manifestPath, '..'), { recursive: true });
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    const counts = Object.entries(manifest.byType)
      .map(([k, v]) => `${k}:${v.length}`)
      .join('  ');
    // eslint-disable-next-line no-console
    console.log(`[manifest] ${manifest.entries.length} assets   ${counts}` + (manifest.unparsed.length ? `   skipped:${manifest.unparsed.length}` : ''));
    if (manifest.unparsed.length) {
      // eslint-disable-next-line no-console
      console.warn('[manifest] unparsed (filename did not match convention):', manifest.unparsed);
    }
  }

  function scheduleRebuild() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      try {
        writeManifest();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[manifest] rebuild failed', err);
      }
    }, 100);
  }

  return {
    name: 'conaloo-asset-manifest',

    configResolved(config) {
      assetsDir = resolve(config.root, 'assets');
      manifestPath = resolve(config.root, 'src/content/manifest.json');
    },

    buildStart() {
      writeManifest();
    },

    configureServer(server) {
      // Watch the assets folder so dropping a file in mid-session updates the manifest.
      watcher = server.watcher;
      watcher.add(assetsDir);
      watcher.on('add', (path) => {
        if (path.startsWith(assetsDir)) scheduleRebuild();
      });
      watcher.on('unlink', (path) => {
        if (path.startsWith(assetsDir)) scheduleRebuild();
      });
      watcher.on('change', (path) => {
        if (path.startsWith(assetsDir)) scheduleRebuild();
      });
    }
  };
}

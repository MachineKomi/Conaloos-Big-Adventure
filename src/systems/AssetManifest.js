/**
 * Filename parsing — the contract from CLAUDE.md §3 / SPEC §2.1.
 *
 * Patterns:
 *   peep_{name}_{gender}_{age}.png        → human character
 *   animal_{name}_{species}.png           → creature character
 *   bg_{description}.png                  → background scene
 *   thing_{name}.png                      → prop / object
 *   music_{tone}.{mp3|ogg|wav}            → looping music
 *   sfx_{name}.{mp3|ogg|wav}              → one-shot sound
 *
 * Multi-word descriptions use hyphens. Underscores are field separators only.
 * If a filename does not match a parser, we return null — the caller logs and skips.
 */

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg']);
const AUDIO_EXTS = new Set(['mp3', 'ogg', 'wav', 'm4a']);

function splitName(filename) {
  const dot = filename.lastIndexOf('.');
  const stem = dot === -1 ? filename : filename.slice(0, dot);
  const ext = dot === -1 ? '' : filename.slice(dot + 1).toLowerCase();
  return { stem, ext };
}

export function parseAssetFilename(filename) {
  if (!filename || typeof filename !== 'string') return null;
  const { stem, ext } = splitName(filename);
  if (!stem) return null;

  if (stem.startsWith('peep_')) {
    if (!IMAGE_EXTS.has(ext)) return null;
    const parts = stem.split('_');
    if (parts.length === 4) {
      // Canonical: peep_{name}_{gender}_{age}
      const [, name, gender, ageRaw] = parts;
      const age = Number.parseInt(ageRaw, 10);
      if (!name || !gender) return null;
      return {
        type: 'peep',
        key: stem,
        name,
        gender: gender.toUpperCase(),
        age: Number.isFinite(age) ? age : null,
        descriptor: null,
        ext
      };
    }
    if (parts.length === 3) {
      // Permitted variant: peep_{name}_{descriptor}, e.g. peep_Loosa_cactus.
      // Treat as a "person-shaped" character whose age/gender don't apply.
      const [, name, descriptor] = parts;
      if (!name || !descriptor) return null;
      return {
        type: 'peep',
        key: stem,
        name,
        gender: null,
        age: null,
        descriptor,
        ext
      };
    }
    return null;
  }

  if (stem.startsWith('animal_')) {
    if (!IMAGE_EXTS.has(ext)) return null;
    const parts = stem.split('_');
    // animal_{name}_{species}  →  3 parts
    if (parts.length < 3) return null;
    const [, name, ...rest] = parts;
    const species = rest.join('_');
    if (!name || !species) return null;
    return { type: 'animal', key: stem, name, species, ext };
  }

  if (stem.startsWith('bg_')) {
    if (!IMAGE_EXTS.has(ext)) return null;
    const description = stem.slice(3);
    if (!description) return null;
    return { type: 'bg', key: stem, description, slug: description, ext };
  }

  if (stem.startsWith('thing_')) {
    if (!IMAGE_EXTS.has(ext)) return null;
    const name = stem.slice(6);
    if (!name) return null;
    return { type: 'thing', key: stem, name, ext };
  }

  if (stem.startsWith('music_')) {
    if (!AUDIO_EXTS.has(ext)) return null;
    const tone = stem.slice(6);
    if (!tone) return null;
    return { type: 'music', key: stem, tone, ext };
  }

  if (stem.startsWith('sfx_')) {
    if (!AUDIO_EXTS.has(ext)) return null;
    const name = stem.slice(4);
    if (!name) return null;
    return { type: 'sfx', key: stem, name, ext };
  }

  return null;
}

/**
 * Convenience accessors used by runtime code.
 */
export function indexManifest(manifest) {
  const byKey = new Map();
  for (const e of manifest.entries) byKey.set(e.key, e);
  return byKey;
}

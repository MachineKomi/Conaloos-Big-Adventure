/**
 * Scene catalog builder.
 *
 * Merges hand-authored scene definitions in /src/content/scenes.js with
 * auto-generated fallback definitions for every background asset that
 * doesn't yet have a designed scene. This way the moment a `bg_*.png`
 * is dropped into /assets/, the child can click around it — even before
 * an agent has authored bespoke rhymes.
 *
 * Designer-authored scenes always win over auto-generated ones.
 */

import { scenes as designed } from './scenes.js';
import { autoGenerateScene } from './autoScene.js';

const HUB_PREFERENCE = [
  'sunny-rocket-garden',
  'big-field',
  'meadow',
  'garden',
  'house-inside',
  'home',
  'hub'
];

export function buildSceneCatalog(loader) {
  const allBgs = loader.backgrounds; // array of { type:'bg', slug, key, ... }
  const slugs = allBgs.map((b) => b.slug);

  // Prefer hand-authored slugs that also have a matching background asset.
  const merged = {};
  for (const slug of slugs) {
    if (designed[slug]) {
      merged[slug] = designed[slug];
    } else {
      merged[slug] = autoGenerateScene(slug, loader, slugs);
    }
  }
  // Allow designer to define scenes for backgrounds not yet present (silent skip).
  for (const slug of Object.keys(designed)) {
    if (!merged[slug]) continue;
  }

  const hubSlug = pickHub(slugs);

  return { scenes: merged, hubSlug };
}

function pickHub(slugs) {
  for (const pref of HUB_PREFERENCE) {
    if (slugs.includes(pref)) return pref;
  }
  return slugs[0];
}

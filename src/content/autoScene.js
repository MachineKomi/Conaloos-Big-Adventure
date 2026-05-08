/**
 * Auto-scene generator.
 *
 * Given a slug + the asset loader, builds a playable-but-generic scene def
 * for any background. Used when no designer-authored entry exists in scenes.js.
 *
 * Goals:
 *   - The child can click and ALWAYS get a rhyming response.
 *   - At least one portal back to another scene (so they can never be stranded).
 *   - Pulls characters and things present in the manifest into the scene at
 *     pleasing positions.
 *   - Picks music whose tone vaguely matches the slug ("forest" → calm/curious,
 *     "starry-sky" → calm, "underwater" → curious).
 *
 * The auto-scene never invents content beyond what's in /src/content/lines.js.
 */

import { genericLines, portalLines } from './lines.js';

const TONE_BY_KEYWORD = [
  [/star|night|sky|moon|sleep|lull/, 'calm'],
  [/sea|ocean|water|under/, 'curious'],
  [/forest|tree|wood/, 'calm'],
  [/field|meadow|garden|hub/, 'curious'],
  [/silly|funny|circus|carnival/, 'silly'],
  [/mountain|cave|stone/, 'curious'],
  [/house|home|kitchen|inside/, 'calm']
];

export function autoGenerateScene(slug, loader, allSlugs) {
  const bg = loader.get(`bg_${slug}`);
  const characters = pickCharacters(loader);
  const things = pickThings(loader);

  return {
    background: `bg_${slug}`,
    music: pickMusic(slug, loader),
    ambient_sfx: [],
    themes: ['language', 'emotions'],
    characters,
    things,
    hotspots: buildHotspots(slug, characters, things, allSlugs)
  };
}

function pickCharacters(loader) {
  const chars = [...(loader.manifest.byType.peep || []), ...(loader.manifest.byType.animal || [])];
  // Place up to 3 characters across the lower half of the scene.
  const slots = [
    { x: 0.22, y: 0.92, heightFrac: 0.55, idle: 'sway' },
    { x: 0.78, y: 0.92, heightFrac: 0.55, idle: 'bob' },
    { x: 0.5,  y: 0.95, heightFrac: 0.6,  idle: 'sway' }
  ];
  const out = [];
  for (let i = 0; i < Math.min(chars.length, slots.length); i++) {
    out.push({ sprite: chars[i].key, ...slots[i] });
  }
  return out;
}

function pickThings(loader) {
  const things = loader.manifest.byType.thing || [];
  const slots = [
    { x: 0.12, y: 0.85, heightFrac: 0.28 },
    { x: 0.88, y: 0.85, heightFrac: 0.28 }
  ];
  const out = [];
  for (let i = 0; i < Math.min(things.length, slots.length); i++) {
    out.push({ sprite: things[i].key, ...slots[i] });
  }
  return out;
}

function pickMusic(slug, loader) {
  const tracks = loader.manifest.byType.music || [];
  if (tracks.length === 0) return null;

  for (const [pattern, tone] of TONE_BY_KEYWORD) {
    if (pattern.test(slug)) {
      const match = tracks.find((m) => m.tone === tone);
      if (match) return match.key;
    }
  }
  return tracks[0].key;
}

function buildHotspots(slug, characters, things, allSlugs) {
  const hotspots = [];

  // Character hotspots — three rotating reactor hotspots over each placed char.
  characters.forEach((c, i) => {
    hotspots.push({
      id: `char-${i}`,
      bounds: { x: c.x - 0.08, y: c.y - 0.18, w: 0.16, h: 0.22 },
      cursor: 'sparkle',
      type: 'reactor',
      responses: genericLines.character.map((text) => ({ text, sfx: 'sfx_pop' }))
    });
  });

  // Thing hotspots.
  things.forEach((t, i) => {
    hotspots.push({
      id: `thing-${i}`,
      bounds: { x: t.x - 0.08, y: t.y - 0.12, w: 0.16, h: 0.18 },
      cursor: 'sparkle',
      type: 'reactor',
      responses: genericLines.thing.map((text) => ({ text, sfx: 'sfx_pop' }))
    });
  });

  // Wonder hotspots scattered in the upper half (sky / canopy / horizon).
  const upper = [
    { id: 'sky-left',   x: 0.10, y: 0.10, w: 0.22, h: 0.20 },
    { id: 'sky-mid',    x: 0.42, y: 0.05, w: 0.22, h: 0.22 },
    { id: 'sky-right',  x: 0.72, y: 0.10, w: 0.22, h: 0.20 }
  ];
  upper.forEach((u, i) => {
    hotspots.push({
      id: u.id,
      bounds: { x: u.x, y: u.y, w: u.w, h: u.h },
      cursor: 'sparkle',
      type: 'reactor',
      responses: genericLines.sky.map((text) => ({ text, sfx: 'sfx_chime' }))
    });
  });

  // Portals: link to up to three other scenes along the edges.
  const others = allSlugs.filter((s) => s !== slug);
  const portalSlots = [
    { id: 'portal-left',  bounds: { x: 0.0, y: 0.45, w: 0.10, h: 0.40 } },
    { id: 'portal-right', bounds: { x: 0.90, y: 0.45, w: 0.10, h: 0.40 } },
    { id: 'portal-down',  bounds: { x: 0.40, y: 0.92, w: 0.20, h: 0.08 } }
  ];
  others.slice(0, portalSlots.length).forEach((target, i) => {
    const slot = portalSlots[i];
    hotspots.push({
      id: slot.id,
      bounds: slot.bounds,
      cursor: 'walk',
      type: 'portal',
      target,
      responses: portalLines.map((text) => ({ text, sfx: 'sfx_step' }))
    });
  });

  return hotspots;
}

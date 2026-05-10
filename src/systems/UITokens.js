/**
 * Design tokens — the single source of truth for the game's UI look.
 *
 * Anywhere a panel, button, or chip is drawn, pull from here. Keeping
 * these numbers in one file is what makes the world feel coherent: the
 * gem counter, the inventory drawer, the quest panel, and the speech
 * bubble share the same paper colour, the same warm-brown stroke,
 * the same corner radii, the same depth feel.
 *
 * Numbers were tuned in the v1.7 polish pass; a 4-year-old should
 * feel that everything belongs to one little hand-painted world.
 */

/** ---------------- Palette ---------------- */
export const COL = {
  // Paper / panel background — warm cream.
  paper:     0xfff8e7,
  paperHex:  '#fff8e7',
  // Slightly darker paper for hover/secondary surfaces.
  paperWarm: 0xfff2a8,
  // Ink — used for text + strokes.
  ink:       0x4a3a1f,
  inkHex:    '#4a3a1f',
  inkSoft:   '#5a4a2a',
  // Accents.
  gold:      0xfff2a8,
  orange:    0xc98c2e,
  orangeHex: '#a45e08',
  pink:      0xffd1d1,
  green:     0xc8e7c8,
  // Translucent shadow black.
  shadow:    0x4a3a1f
};

/** ---------------- Stroke + radius ---------------- */
export const STROKE = {
  panel:  4,    // big floating panels (HUD, inventory drawer, quest panel)
  small:  3,    // chips, slots, badges
  tiny:   2     // micro pills
};

export const RADIUS = {
  panel: 22,    // big rounded panels
  card:  18,    // medium chips, top-bar buttons
  chip:  14,    // slot frames
  pill:  10     // small badges
};

/** ---------------- Top-bar layout ---------------- */
export const TOPBAR = {
  paddingTop: 12,
  paddingX:   16,
  // All top-bar items render at the same height so they line up
  // visually. Width varies by content; height is fixed.
  itemH:      80,
  // Square buttons (bag, quest, burger) use this width.
  squareW:    80,
  // Gap between adjacent top-bar items.
  gap:        12
};

/** ---------------- Typography ---------------- */
export const TYPE = {
  family:    '"Fredoka", "Atkinson Hyperlegible", system-ui, sans-serif',
  bodyFamily:'"Atkinson Hyperlegible", "Fredoka", system-ui, sans-serif',
  // Sizes (in pixels) at the design resolution (1600x900).
  display:   54,    // title screen
  hero:      36,    // gem counter total, quiz total
  heading:   26,    // panel titles ("Amelia's bag")
  body:      22,    // panel body text
  caption:   16,    // small labels
  badge:     14     // count chips
};

/** ---------------- Animation timings ---------------- */
export const ANIM = {
  hover:        120,
  press:        180,
  panelOpen:    280,
  panelClose:   220,
  toast:        320,
  bounce:       260
};

/** ---------------- Drop shadow ---------------- */
/**
 * Draw a subtle drop shadow under a rounded rect. Call BEFORE the
 * panel itself so the shadow sits underneath.
 *
 *   drawDropShadow(g, x, y, w, h, radius)
 */
export function drawDropShadow(g, x, y, w, h, radius) {
  // 3 soft layers, each progressively wider + lighter.
  const layers = [
    { o: 4, alpha: 0.08 },
    { o: 8, alpha: 0.06 },
    { o: 12, alpha: 0.04 }
  ];
  for (const l of layers) {
    g.fillStyle(COL.shadow, l.alpha);
    g.fillRoundedRect(x - l.o + 2, y + l.o, w + l.o * 2 - 4, h + l.o, radius + l.o);
  }
}

/**
 * Draw the standard panel: subtle drop shadow + cream fill + warm
 * brown stroke. Use this everywhere a panel is needed.
 *
 *   drawPanel(g, x, y, w, h, { radius, stroke, fillAlpha })
 *
 * `g` should be a fresh Graphics or one you've cleared.
 */
export function drawPanel(g, x, y, w, h, opts = {}) {
  const radius = opts.radius ?? RADIUS.panel;
  const stroke = opts.stroke ?? STROKE.panel;
  const fillAlpha = opts.fillAlpha ?? 0.96;
  const fillColor = opts.fill ?? COL.paper;
  if (opts.shadow !== false) drawDropShadow(g, x, y, w, h, radius);
  g.fillStyle(fillColor, fillAlpha);
  g.lineStyle(stroke, COL.ink, 1);
  g.fillRoundedRect(x, y, w, h, radius);
  g.strokeRoundedRect(x, y, w, h, radius);
}

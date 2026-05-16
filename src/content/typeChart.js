/**
 * Buddy type advantage chart (5-type cycle).
 *
 *   water  ──▶  heart   (water wears down)
 *    ▲           │
 *    │           ▼
 *  nature      sweet     (heart > sugar)
 *    ▲           │
 *    │           ▼
 *   wind  ──▶  nature   (wind shakes the leaves)
 *
 * Rules each type beats / loses to:
 *   water   → beats heart, loses to nature
 *   nature  → beats water, loses to wind
 *   wind    → beats nature, loses to sweet
 *   sweet   → beats wind, loses to heart
 *   heart   → beats sweet, loses to water
 *
 * Advantage: 2.0×. Disadvantage: 0.5×. Neutral: 1.0×.
 */

export const TYPES = ['water', 'nature', 'wind', 'sweet', 'heart'];

const BEATS = {
  water:  'heart',
  nature: 'water',
  wind:   'nature',
  sweet:  'wind',
  heart:  'sweet'
};

/** Damage multiplier when an attack of `attackerType` hits a
 *  buddy of `defenderType`. */
export function typeMultiplier(attackerType, defenderType) {
  if (BEATS[attackerType] === defenderType) return 2.0;
  if (BEATS[defenderType] === attackerType) return 0.5;
  return 1.0;
}

/** Friendly label for the type — used in the battle UI. */
export function typeEmoji(type) {
  return ({
    water:  '🌊',
    nature: '🌿',
    wind:   '💨',
    sweet:  '🍯',
    heart:  '❤'
  })[type] || '✦';
}

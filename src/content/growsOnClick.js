/**
 * Characters that grow a little bit each time they're clicked, capped
 * at 3× their original size. A small delight: tap the same buddy a
 * bunch and they puff up like a balloon, until they hit the cap.
 *
 * Grow factor per click is small (1.06–1.10) so reaching the 3× cap
 * still takes 15+ clicks. The size resets every time you re-enter
 * the scene (sprites are re-rendered fresh).
 */

export const growsOnClick = new Set([
  'animal_Conaloo_bear-butterly',
  'animal_Pepsi_dog-thing',
  'animal_Seesa_pink-bee',
  'animal_Monaloo_butterfly',
  'peep_Tootsie_friendly-cactus'
]);

/** Multiplier applied per click. */
export const GROW_FACTOR = 1.07;

/** Hard cap relative to the sprite's original size. */
export const GROW_CAP = 3.0;

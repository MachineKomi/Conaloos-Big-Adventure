# Hotspot Patterns

Reusable recipes for hotspot construction. Add new patterns here as you invent them. CLAUDE.md §6 lists the originals; this file is the living index.

Every pattern must obey the Golden Rules in CLAUDE.md §8:
- Hover changes cursor.
- Hit area ≥ 64×64 px.
- ≥ 3 responses per hotspot, cycling.
- Sound on every click.
- No hotspot is required to progress.
- No hotspot can hide.

---

## 1. Critter Cameo

A character pops in from off-screen, says one rhyming line, leaves. Pure delight, low stakes.

```js
{
  id: 'rabbit-cameo',
  type: 'wanderer',
  bounds: { x: 0.5, y: 0.5, w: 0.1, h: 0.1 },
  responses: [
    { text: "A rabbit pops up from a hole in the ground...", sfx: 'sfx_pop' },
    /* 2 more variants */
  ]
}
```

## 2. Thing-Becomes-Hat

On click, a `thing_*` sprite scales down and parents to a character's head. Stays for the rest of the scene visit. Implement via the `remix` field on a rare response.

```js
rare_response: {
  text: "Today bobo's wearing a hat made of cloud!\nIt fits him just right, and he's terribly proud.",
  remix: { add_sprite: 'thing_hat', on_top_of: 'animal_bobo_butterfly', scale: 0.25 },
  sfx: 'sfx_jackpot'
}
```

## 3. Counting Wall

A row of identical sprites (or implied positions). Click each — narrator counts up rhyming. Uses sequential rather than cyclic responses so the counting feels real.

```
"One little leaf on the lonely lapel."
"Two little leaves and they're starting to swell."
"Three little leaves and they shimmer and tell..."
"Four little leaves and the whole tree is well."
```

Use `responses` for the first N, then loop back. Add a rare response on the 7th click (a leaf flies away, voice says: *"And one little leaf has decided to roam, / It's off down the wind to find somewhere to home."*).

## 4. Question Stone

A static prop that asks a different open-ended question on each click. No answer needed. The child wonders.

```
"Where do you think the wind goes when it stops?"
"What do beetles dream of? Is it grass? Is it hops?"
"If trees could speak slowly, what would they say?"
```

Mark these with `theme: 'philosophy'` on each response so theme coverage tracks.

## 5. Tiny Museum

A `thing_*` displayed prominently. Each click reveals a fact about it (real, child-level). Ideal for `theme: 'culture-history'` or `theme: 'art-history'`.

```
"Houses had no windows long, long ago."
"People used candles by morning's first glow."
"And before that they sat by the fire's red show."
```

## 6. Remix Surprise

Rare response (every 7th click) that visually combines 2+ sprites into a silly composite. Document the remix in `/docs/characters/remixes.md` after using it.

Examples:
- A butterfly wearing a house.
- A peep with a butterfly on her hat.
- The moon turning into a face that winks.

## 7. The Echo

A sound-focused hotspot. Each click plays a different `sfx_*` and the rhyme is *about* the sound. Good for music education and rhythm.

```
{ sfx: 'sfx_chime', text: "A chime is a coin that the wind drops on glass..." }
{ sfx: 'sfx_drum',  text: "A drum is a heart that has lost its disguise..." }
{ sfx: 'sfx_bell',  text: "A bell is the shape of a question on tone..." }
```

## 8. The Slow Reveal *(new — invented in scaffolding pass)*

Hotspot whose first response sounds simple, but each subsequent response opens up a deeper layer. The child cycles through and finds richer language each time. Pairs well with character-led teaching.

```
"A star is a light in the dark of the night."
"A star is a fire that is terribly far."
"A star is a sun that is shining alone --
 So every star somewhere has people of own."
```

Theme: science, philosophy, or both.

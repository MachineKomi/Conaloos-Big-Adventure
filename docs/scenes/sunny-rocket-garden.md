# Scene: sunny-rocket-garden

**Background:** `bg_sunny-rocket-garden.png`
**Music:** `music_curious` (when available — currently no music in manifest)
**Ambient SFX:** none yet
**Themes:** science, philosophy, language, animals
**Connects to:** cosy-cottage-interior, mountain-lake-childlike, mountain-lake-vista

This is the **hub** — the first place you land, and the place a home button returns you to.

## Mood

Sunlit and slightly absurd. A garden with a rocketship in it, parked like a hose. Warm light, big colour, a sense of *we could go anywhere from here, but also it's nice right here*. The child should feel that this is home, and that home is enough.

## Characters present

- **Conaloo** (`animal_Conaloo_bear-butterly`) — central, near the rocketship. The whole game is named after him; he is the still point.
- **Amelia** (`peep_Amelia_F_4`) — to one side of Conaloo, offering a name for something.
- **Cosenae** (`peep_Cosenae_M_5`) — opposite side, with a confident half-fact at the ready.
- **Seesa** (`animal_Seesa_pink-bee`) — buzzing in the upper-right area, near a flower if visible.
- **Pepsi** (`animal_Pepsi_dog-thing`) — curled in the lower-left, mostly asleep.

## Things in scene

- `thing_rocketship` — placed mid-right, scaled to about a third of the garden's height. Hotspot subject for the Tiny Museum pattern.

## Hotspots

| ID | Type | Theme | Pattern | Speaker |
|---|---|---|---|---|
| `conaloo` | reactor | philosophy | character | Conaloo |
| `rocketship` | reactor | science | Tiny Museum | narrator |
| `amelia` | reactor | language | character | Amelia |
| `cosenae` | reactor | science | character | Cosenae |
| `seesa` | reactor | animals | character | Seesa |
| `pepsi` | reactor | emotions | character | Pepsi (narrator-led) |
| `sun` | reactor | philosophy | Question Stone | narrator |
| `to-cottage` | portal | — | — | (narrator on transition) |
| `to-lake` | portal | — | — | (narrator on transition) |

The rocketship has a rare-response that adds Seesa as a passenger ("I'm an astronaut bee!").

## Educational notes

- **Science:** rocketships are ships of metal that *push* against the air to get higher. The sun is a star.
- **Philosophy:** "the going's the thing, not the where" — a Conaloo line that gently deconstructs goal-directed thinking. The child internalises the value of process over outcome.
- **Language:** Amelia names things, including the player. Naming as a kind of magic.
- **Animals:** Seesa explains, fast, that bees can be other colours.

## Open hooks for future agents

- When music lands, prefer `music_curious` here.
- When `bg_starry-sky` or `bg_lullaby` lands, add a portal at the upper edge ("Look up — the sky tonight is...").
- The rocketship could become an actual scene transition once we have a `bg_above-clouds` or similar.

# Scene: ice-level

**Background:** `bg_ice-level` (Amelia's drawing — added v1.11)

**History:** replaced the `mountain-lake-vista` scene in v1.11.
That scene's background wasn't drawn by Amelia, so the whole
location got reskinned as an ice / snow scene. Same map position
(connected to `mountain-lake-childlike` and `skyscraper-roof`),
new theme.

## Cast

- **Wawoo** (`peep_Wawoo_robo-snowman`) — finally in his element.
  He's the robo-snowman who worries it isn't cold enough back in
  the garden. Up here, he's happy.
- **Conaloo** (`animal_Conaloo_bear-butterly`) — bears like the
  cold (mostly). The butterfly half is less convinced.

## Things to find

- `thing_flashlight` — a small sun in a hand. Useful in a place
  this white.
- `thing_microscope` — for looking at snowflakes. Ice crystals
  are six-sided every time; the microscope IS the lesson.

## Themes

- science (snowflakes, ice physics, freezing, floating)
- philosophy (where cold goes when it isn't here)
- language (cold-words across languages, Inuit words for snow)
- emotions (Wawoo is, for once, content)

## Hotspots (high level)

- Wawoo + Conaloo character hotspots (pull from their bio pools)
- `flashlight` + `microscope` collectables (one-off rhymes on
  pickup)
- `snowflakes` tiny museum — 4 facts about snowflakes
- `ice` tiny museum — 4 facts about ice as frozen water
- `cold` question stone — 4 wondering questions about cold
- `cold-words` tiny museum — words for cold across languages,
  plus a couple of Inuit words for snow

## Portals

- `to-childlike` → `mountain-lake-childlike` (back down to the
  lake; portal_magic_swirl)
- `to-roof` → `skyscraper-roof` (over to the rooftop;
  portal_donut_portal)

Two scenes have portals leading IN here:
- `mountain-lake-childlike` (`to-ice`, label "up to the snow")
- `skyscraper-roof` (`to-ice`, label "off to the snow")

## Gems

5 gems scattered. Standard distribution.

## Music

`music_skyward` (Skyward Bound Sprint) — brisk, going-somewhere
feel that fits a high cold place.

## Open hooks for next agent

- Wawoo's `_seen` lines pool stays the same as everywhere else
  in the game (HotspotManager shuffles his whole bio pool); a
  future pass could add ice-specific lines to his bio that only
  fire when speaker is in this scene.
- If the playtest shows the kid wants to *stay* in this scene
  (cold places fascinate small humans), consider adding one more
  character — `peep_Konessa_has-flower` would be a sweet
  juxtaposition (a flower in the snow).

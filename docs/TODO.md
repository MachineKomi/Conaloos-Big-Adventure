# TODO — Take the Long Way

A running list of features and changes Amelia and dad want to make.
Tick items off as they ship. Add new ideas at the bottom. Anything
that lands in the game gets a write-up in `CHANGELOG.md` as well.

---

## Up next (in rough priority order)

### 1. Swap portal art for Amelia's drawings ✅

Some of the current portal assets weren't drawn by Amelia, so they
sat slightly outside the game's hand-drawn style. She drew
replacements; the old non-Amelia portals are gone and every scene
uses one of her five new portal drawings.

- [x] Receive Amelia's portal drawings, drop into `/assets/`
- [x] Confirm filenames follow the `portal_{name}.png` convention
- [x] Update scene definitions in `src/content/scenes.js` to point
      at the new portal assets where needed
- [x] Delete or archive the old non-Amelia portal assets
- [ ] Playtest in Vercel deploy build — confirm every portal
      renders at a sensible size (heightFrac may want tweaking
      per new piece if any look off)

Mapping used (one sprite per destination — so the same place
always has the same portal icon anywhere in the world):

| Destination                  | Portal sprite                |
|------------------------------|------------------------------|
| cottage                      | `portal_heart_door`          |
| bedroom                      | `portal_simple_heart_door`   |
| hub-garden / playground      | `portal_magic_flower_door`   |
| lake / waterfall             | `portal_magic_swirl`         |
| vista / skyscraper-roof      | `portal_donut_portal`        |
| village / seaside            | `portal_heart_door`          |
| school                       | `portal_simple_heart_door`   |

### 2. Swap inventory item art for Amelia's drawings

Same idea, for the `thing_*` assets that get picked up and live in
Amelia's bag. The bag should feel like *her* bag — every item drawn
by her.

- [ ] Make a list of which `thing_*` assets need replacing (vs
      already-Amelia ones — check `/assets/things/`)
- [ ] Receive Amelia's replacement drawings
- [ ] Confirm filenames follow `thing_{name}.png` convention
- [ ] Drop into `/assets/`; the manifest plugin picks them up
      automatically
- [ ] Update the inventory `inventoryDescription()` couplets in
      `src/systems/Inventory.js` if any new items get unique names
- [ ] Update the corresponding quests in `src/systems/Quests.js`
      ("find the X") if the item key changes

---

## Bigger features (next sprints)

### 3. The Ice Level

A new scene set somewhere icy / wintry. Needs:

- [ ] Background art (`bg_ice-{something}.png`) — Amelia to draw
- [ ] At least one new character who lives there (could reuse
      `peep_Wawoo_robo-snowman` since he already worries it isn't
      cold enough — perfect for an ice level)
- [ ] 2–3 new `thing_*` items to find (icicle? snowball? mitten?)
- [ ] A portal IN from somewhere on the world map (maybe the lake
      or the rocket garden has a new door)
- [ ] A portal OUT back to a familiar scene
- [ ] Scene definition in `src/content/scenes.js`
- [ ] Hotspot lines for the new character(s) with at least 2 of
      the 10 educational themes covered
- [ ] Add the new slug to `src/content/sceneCatalog.js`
- [ ] Maybe a quest tied to the ice level ("Where the cold
      comes from")

### 4. The Buddy System

Pokemon-style: you have a buddy who walks with you. You can recruit
new buddies and battle other characters' buddies in turn-based
combat. **Big feature** — break into smaller chunks before starting:

- [ ] Brainstorm: who can be a buddy? (Probably the smaller
      `animal_*` sprites — Monaloo, Seesa, Pepsi, Bobo, etc.)
- [ ] Decide: does Amelia have ONE buddy at a time, or a small
      team like Pokemon (max 3 / max 6)?
- [ ] Decide: how do you *recruit* a new buddy? (Talk to them N
      times? Give them an inventory item? Win a battle?)
- [ ] Decide: what's a "battle" for a 4-year-old? (Definitely no
      losing screens — every battle ends in a happy way. Maybe
      it's a "show your buddy off" minigame where both buddies
      do tricks and the kid picks which trick is funniest?)
- [ ] Buddy sprite walks behind Amelia in gameplay scenes
- [ ] Buddy switch / picker UI (maybe a pawprint button on the
      top bar?)
- [ ] Persistence: which buddies are recruited goes in `SaveGame`
- [ ] Quests for buddy progression ("recruited your first buddy",
      "recruited 3 different kinds", etc.)

This one needs its own design session before code starts —
probably worth doing the brainstorming skill / OpenSpec proposal
when we get to it.

---

## Smaller polish ideas (parked)

- The hub has Cosenae standing very close to the rocket; the rocket
  zone wins clicks now, but a nicer fix is to nudge his sprite
  position so the rocket has more breathing room.
- The inventory drawer is centred; with a *very* full bag it could
  push past the screen edges. Consider a max-cols-then-wrap layout
  if Amelia's collection grows.
- A subtle ambient pulse on the burger menu the first time a kid
  opens the game, to draw the eye there.
- "Friend-list" quest counts unique speakers; if a kid earns it
  via rapid chained clicks, they may not realise what triggered
  it. A small "progress chip" that flashes "9/12 friends greeted"
  on increment would help.

---

## Ideas to remember (not committed to)

- Day / night cycle? Time-of-day changes scene tints?
- A scrapbook page that shows every line Amelia's ever read in the
  game, so the parent can show her later
- A "secret hum" that plays only when she's stood still for 30s in
  a scene (a calm reward for noticing)

---

*Last touched: agent + dad + Amelia, 2026-05-16*

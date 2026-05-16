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

### 4. The Buddy System — MVP shipped in v1.12 ✅, more to do

Pokemon-style turn-based combat with buddies that follow Amelia.
Full design spec in `docs/BUDDY_DESIGN.md`.

**MVP shipped (v1.12):**
- [x] 5 buddy species (Conaloo, Monaloo, Umi, Seesa, Pepsi)
      with stats, types, moves
- [x] Type chart (5-type cycle)
- [x] BattleScene with HP bars, energy meters, animations
- [x] No-fail-state losing flow (consolation gems)
- [x] Buddy walks behind Amelia
- [x] 2 NPC opponents (Cosenae's Seesa, Loosa's Umi)
- [x] Save persistence (roster, levels)
- [x] EXP + level-up
- [x] 4 buddy battle quests

**Deferred to next iteration:**
- [ ] **Recruitment** — find buddies in the wild + recruit via
      quiz answer or battle win
- [ ] **Multi-buddy team** — roster up to 3/6, team management
      UI (probably a button on the burger menu)
- [ ] **Switch buddy** mid-battle (Pokémon-style)
- [ ] **Wild encounters** — random spawns in scenes (especially
      good fit for ice-level — wild Umis drifting around)
- [ ] **Wawoo's buddy** in the ice level (he'd suit a water type)
- [ ] **Status effects** (poison, stun, sleep)
- [ ] **Held items** (maybe inventory items can hold-equip)
- [ ] **Buddy bio screen** — tap a buddy in your roster to read
      their bio + stats + moves
- [ ] Visual: hide Amelia's buddy follower when the same species
      is already a "wild" character in the scene

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

# Buddy System — Design Doc

The MVP of the Pokémon-style turn-based combat feature.

## Pillar reminder (from CLAUDE.md)

- **No fail states.** Losing a battle gives a small consolation
  reward and you can try again — never a dead end.
- **Every click rewards.** Every tap of a move button gives
  visible feedback (animation + damage number) regardless of
  outcome.
- **No timers, no scores that imply "right" clicks.** Battles
  are turn-based; the kid can take as long as she wants to read.

## In scope for v1.12 (MVP)

✅ Five buddy species (Conaloo, Monaloo, Umi, Seesa, Pepsi)
   with stats, types, moves
✅ Type advantage chart (5 types in a cycle)
✅ Turn-based 1v1 battles in a dedicated overlay scene
✅ HP bar + energy meter per buddy
✅ Damage formula with type multipliers + a small randomness roll
✅ Simple per-move animations (shake / flash / colour tint / projectile)
✅ Amelia starts with Conaloo as her buddy (visible follower)
✅ Two NPCs in the world have a visible buddy: tapping the
   buddy sprite triggers a battle
✅ Win → +N gems (scaled to opponent level) + EXP
✅ Lose → small consolation gems, no dead-end
✅ Buddy EXP + level up; stats scale with level
✅ HP/energy reset after battle (per user spec)
✅ Save game: persists Amelia's buddy roster + levels
✅ Quest hooks: first buddy battle, win N battles, defeat all
   NPC buddies

## Out of scope for v1.12 (next iterations)

❌ Recruiting wild buddies (quiz / battle-win to add to team)
❌ Multi-buddy teams + roster UI (sticking to single-buddy MVP
   to keep the battle UI legible for a 4-year-old)
❌ Wild encounters (random pop-ups in scenes)
❌ Status effects (poison, sleep, stunned)
❌ Held items
❌ Online / shared rosters

These are deliberately deferred; the data model (Section 4)
leaves clean hooks for each.

## 1. Species

Each species lives in `src/content/buddySpecies.js`:

| ID | Sprite | Type | HP | ATK | DEF | SPD | Lore |
|---|---|---|---|---|---|---|---|
| `conaloo` | bear-butterly | nature | 32 | 8 | 9 | 7 | warm, wandering, half-honey |
| `monaloo` | butterfly | wind | 22 | 7 | 5 | 14 | quick, light, two-line thoughts |
| `umi` | jelly-fish | water | 28 | 7 | 11 | 8 | drifty, soft, gives the cold |
| `seesa` | pink-bee | sweet | 24 | 10 | 5 | 13 | BRIGHT pollen-collector |
| `pepsi` | dog-thing | heart | 30 | 9 | 10 | 8 | loyal, sticks always |

## 2. Type chart (5-cycle)

A small cycle so it's learnable:

```
   water  ──▶  heart   (water wears down)
    ▲           │
    │           ▼
  nature      sweet     (heart > sugar)
    ▲           │
    │           ▼
   wind  ──▶  nature   (wind shakes the leaves)
```

Same five types, simplified rules:
- **water** > heart, < nature
- **nature** > water, < wind
- **wind** > nature, < sweet
- **sweet** > wind, < heart
- **heart** > sweet, < water

Advantage: 2.0×, disadvantage: 0.5×, neutral: 1.0×.

## 3. Moves (per species, 3 moves each)

Move shape: `{ id, name, power, energyCost, type, accuracy, effect?, fx }`

Each buddy gets:
- a **cheap basic** (1-2 energy, ~5 power, ~95% accuracy)
- a **heavy hit** (4-5 energy, ~14 power, ~80% accuracy)
- a **utility** (heal self / restore energy / mild buff)

Example — Conaloo:
- `paw-tap` — type:nature, power:6, energy:1, acc:0.95
- `honey-hug` — type:nature, power:14, energy:5, acc:0.80
- `hum-a-bit` — utility: heal 8 HP, energy:2, acc:1.0

(Full move list lives in `buddySpecies.js`.)

## 4. Data model

### Species (immutable, lives in `buddySpecies.js`)

```js
{ id, sprite, displayName, type, base: {hp, atk, def, spd},
  moves: [...], bio: '...' }
```

### Instance (mutable, lives in SaveGame)

```js
{ speciesId, level, exp, nickname? }
```

### Battle participant (transient, only during a battle)

Derived from species + level:
```js
{ species, level, hp, maxHP, energy, maxEnergy, atk, def, spd }
```

### Level scaling

- maxHP = base.hp + level × 3
- atk = base.atk + level × 0.6
- def = base.def + level × 0.4
- spd = base.spd + level × 0.3
- maxEnergy = 8 + floor(level / 2)

### EXP curve (gentle)

- L1→L2 at 30 EXP
- L2→L3 at 70
- L3→L4 at 130
- L4→L5 at 210
- (quadratic-ish: 30 + 40(level-1) + 10(level-1)²)

Each defeated opponent: +20 EXP × opponent.level.

## 5. Damage formula

```
hit?  = random() < move.accuracy
if !hit:  show "Missed!" — 0 damage
base    = move.power + attacker.level × 0.4
typeMul = typeChart[move.type][defender.type]   // 0.5, 1.0, or 2.0
defMul  = max(0.4, 1 - defender.def × 0.04)
roll    = random in [0.85, 1.15]
damage  = ceil(base × typeMul × defMul × roll)
```

So the floor is "always at least 1 damage" and bigger gaps come
from type advantages, not from level grinding. Level still
matters but doesn't dominate (so a level 1 with a type advantage
can still threaten a level 4 — keeps it interesting).

## 6. Battle flow

1. **Intro** — both buddies slide in from opposite sides;
   names + level shown.
2. **Player turn** — three move buttons (one per move). Energy
   cost shown on each. Disabled if not enough energy.
3. **Resolve** — speed determines order. Each move:
   - attacker pays energy
   - attack animation plays (shake / flash / projectile)
   - damage number floats up over defender
   - defender's HP bar tweens down
4. **Faint check** — if HP ≤ 0, defender plays a "knocked out"
   animation (alpha fade + drop down).
5. **End** — winner gets EXP + gems; both buddies' HP & energy
   reset. Toast appears; battle scene closes.

### Lose state

If Amelia's buddy faints, the opponent says a kind line ("That
was a good one!") and you get **3 consolation gems** + a small
amount of EXP. No "Game Over". You can immediately challenge
the same NPC again.

## 7. NPC buddies (initial wave)

- **Cosenae** (hub, `peep_Cosenae_M_5`) — buddy: **Seesa** (lvl 2)
- **Loosa** (playground, `peep_Loosa_cactus`) — buddy: **Umi** (lvl 3)

These are the two NPC battles available in v1.12. Each NPC has
their buddy rendered as a smaller sprite floating near them in
the scene. Tapping the *buddy* (not the NPC) starts a battle.
Tapping the NPC still gives their normal dialogue.

Player starts with **Conaloo** as their buddy (level 1).

Pepsi + Monaloo are in the data and walking around the world,
but they're not battle opponents yet — they'll become wild
encounters in v1.13.

## 8. UI / scene

`src/scenes/BattleScene.js` — Phaser scene launched as an
overlay on top of the current `scene:*`. Layout:

```
┌──────────────────────────────────────────────┐
│                                              │
│   [opp name lvl 3]    [HP ████░░] [E ▼▼░]    │
│                                              │
│                    🌊 (opp buddy sprite)      │
│                                              │
│   (your buddy sprite) 🐻                     │
│                                              │
│   [your name lvl 1]    [HP ████░] [E ▼▼▼]    │
│                                              │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│   │ paw-tap │  │ honey-  │  │ hum-a-  │     │
│   │ ⚡1      │  │  hug ⚡5│  │  bit ⚡2│     │
│   └─────────┘  └─────────┘  └─────────┘     │
│                                              │
└──────────────────────────────────────────────┘
```

All HUD scenes (gem counter, bag, burger, quest panel) are
hidden during battle to keep focus.

## 9. Save game additions

```js
{
  ...,
  buddies: [{ speciesId: 'conaloo', level: 1, exp: 0 }, ...],
  activeBuddyIdx: 0
}
```

Backwards-compatible: old saves without these fields just get a
fresh starter `Conaloo` on load (see `BuddyTeam.hydrate()`).

## 10. Quests added

- `first-battle` — "Tap a buddy, tap a battle." +6 gems
- `battle-fan` — "Win 5 buddy battles." +18 gems
- `npc-champ` — "Defeat both NPC buddies (Cosenae's Seesa AND
   Loosa's Umi)." +25 gems
- `buddy-lv-up` — "Level up your buddy." +8 gems

## 11. Animations (simple, MVP-grade)

- **basic attack**: attacker slides forward 40px and back; on
  hit, defender flashes red (tint) + shakes ±6px for 200ms;
  damage number floats up from defender with fade.
- **heavy attack**: same as basic + a small particle burst from
  the defender, slightly bigger camera shake.
- **utility (heal)**: small sparkle ring around self + green
  number floats up; no defender effect.
- **miss**: attacker slides forward & back, defender unchanged;
  "miss!" floats up over defender.

Use existing `UITokens.js` palette so the battle scene matches
the rest of the world's chrome.

## 12. Open hooks (intentional)

- `buddyInstance.nickname` field present but unused — for the
  future recruit-and-name flow.
- `BuddyTeam` supports an array of buddies but UI only shows
  one — multi-buddy team management lands later.
- `battle.outcome` event fires both "won" and "fainted" so
  recruitment-on-defeat (catching) can hook in later.

## 13. Files added / touched

- **New:** `src/content/buddySpecies.js`,
  `src/content/typeChart.js`, `src/systems/BuddyTeam.js`,
  `src/scenes/BattleScene.js`
- **Updated:** `src/systems/SaveGame.js` (buddy fields),
  `src/main.js` (wire BuddyTeam), `src/content/scenes.js` (NPC
  buddy assignments), `src/scenes/GameScene.js` (render NPC
  buddy sprites + tap-to-battle + Amelia's follower),
  `src/systems/Quests.js` (4 new quests)

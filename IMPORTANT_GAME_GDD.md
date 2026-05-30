# Brainrot Idle Clicker — Core Game Design Document

## 1. High-Level Vision

**Brainrot Idle Clicker** is a mobile-first idle clicker inspired by the satisfying progression loop of *Clicker Heroes*, rebuilt around collectible Brainrots, Lucky Blocks, packs, cards, and background collection systems.

The player repeatedly breaks chests, earns gold, upgrades their power, discovers loot, finds Lucky Blocks, collects Brainrots, opens packs, and uses Brainrot Cards to make their collection stronger.

The game should feel:

* Fast, juicy, and easy to understand.
* Highly collectible.
* Progression-heavy without being complicated.
* Rewarding both actively and passively.
* Full of small discoveries, unlocks, and “one more chest” moments.

The core fantasy is:

> “I break chests, find weird Brainrots, collect cards for them, and build an increasingly powerful idle machine.”

---

## 2. Core Player Journey

### Early Game

The player starts in World 1 (**Castaway Cove**, a nautical/pirate beach theme) with basic tap damage and a simple chest.

They tap the chest until it breaks. The chest opens and reveals 1-2 items, such as an **Old Boot** or a **Seashell**, which pop out on screen and are immediately auto-sold: each item bursts into gold coins that fly up to the gold counter and accumulate.

The player uses gold to buy simple upgrades:

* More tap damage.
* More passive damage.
* More gold earned.
* Packs.

After several chests, a Lucky Block appears. It has more health than a normal chest, but feels exciting because it can reward a Brainrot.

The player breaks the Lucky Block, sees a reward reveal animation, and receives their first Brainrot.

### Mid Game

The player now has Brainrots generating passive benefits. They continue breaking chests, earning gold, unlocking more stages, and occasionally finding Lucky Blocks.

They open packs and collect Brainrot Cards. When they collect a card for a Brainrot they own, that Brainrot becomes stronger.

The player starts caring about:

* Which Brainrots they own.
* Which Brainrots are levelled.
* Which cards they have collected.
* Which item discoveries they have completed.
* Which world or zone is best to farm.

### Long-Term Game

The player unlocks new worlds by reaching stage milestones. Each world has unique chests, loot items, Lucky Blocks, Brainrots, card themes, and modifier chances.

Example:

* World 1: Starter Brainrots.
* World 2: Grasslands Brainrots.
* World 3: Frozen Brainrots.

Players can continue pushing endlessly in earlier worlds, but newer worlds scale harder and offer better or different rewards.

The long-term goal is to build a powerful collection of Brainrots, cards, discovered items, modifiers, and upgrades that all stack into a satisfying idle progression engine.

---

## 3. Primary Core Loop

1. Player taps chest.
2. Chest takes damage.
3. Chest breaks.
4. Chest reveals 1-2 items that pop out on screen.
5. Items burst into gold coins that fly to the counter and auto-sell for gold.
6. Gold is spent on upgrades and packs.
7. Player progresses through stages.
8. Lucky Blocks occasionally spawn instead of chests.
9. Lucky Blocks reward Brainrots.
10. Brainrots improve passive damage, gold, or other stats.
11. Packs reward Brainrot Cards.
12. Cards improve Brainrots.
13. Stronger player breaks harder chests faster.
14. Repeat.

### Simple Loop Example

* Break chest.
* Find **Common Old Boot** (and sometimes a second item).
* Items pop out and burst into coins that fly to the gold counter.
* Auto-sell for **5 Gold**.
* Buy +1 Tap Damage.
* Break more chests.
* Lucky Block appears.
* Break Lucky Block.
* Receive **Common Brainrot: Goblin Guy**.
* Goblin Guy gives **+2 Passive DPS**.
* Open pack.
* Receive **Goblin Guy Card**.
* Goblin Guy now gives **+3 Passive DPS**.

---

## 4. Stage Progression

Stages represent forward progression within a world.

Each stage increases:

* Chest health.
* Item sell value.
* Gold rewards.
* Lucky Block reward potential.
* Chance of stronger loot tables.

The player should always feel like they are pushing slightly further than before.

### Stage Rules

* Each world has its own stage track.
* Players can continue progressing a world indefinitely.
* New worlds unlock at key stage milestones.
* Higher stages increase difficulty and reward quality.

### Example Unlocks

| Requirement                | Unlock                                   |
| -------------------------- | ---------------------------------------- |
| Reach Stage 10 in World 1  | First Pack unlocked                      |
| Reach Stage 20 in World 1  | Collection Book bonus unlocked           |
| Reach Stage 50 in World 1  | World 2 unlocked                         |
| Reach Stage 100 in World 1 | Higher Lucky Block tier chance increased |

---

## 5. Chest System

Chests are the main enemy/object the player attacks.

They function as the basic source of gold and item discovery.

### Chest Behaviour

* A chest spawns in the center of the screen.
* Player taps to damage it.
* Passive damage from Brainrots also damages it over time.
* When health reaches 0, the chest opens.
* It reveals 1-2 loot items that pop out on screen.
* Each item is automatically sold: it bursts into gold coins that fly to the gold counter and accumulate.
* A new chest or Lucky Block spawns.

### Chest Rewards

Chests should always drop items, not raw gold directly.

This gives the player stronger reward feedback:

> “I found a weird item, and it sold for gold.”

Instead of:

> “I got 5 gold.”

### Example Chest Loot (World 1 - Castaway Cove)

| Item         |    Rarity | Stage-1 Value | Collection Status |
| ------------ | --------: | ------------: | ----------------- |
| Old Boot     |    Common |        5 Gold | Discovered        |
| Seashell     |    Common |       10 Gold | Discovered        |
| Fishing Rod  |      Rare |       55 Gold | New Discovery     |
| Pirate Hat   |      Epic |      360 Gold | New Discovery     |
| Cutlass      | Legendary |     1300 Gold | New Discovery     |
| Treasure Map |    Mythic |     9000 Gold | New Discovery     |

Sell value shown is the stage-1 base; the final price scales with the current stage and the player's gold multiplier.

---

## 6. Item Collection Book

Items from chests are auto-sold but also tracked in a background collection book.

This adds long-term discovery progression without forcing players to manage another inventory.

### Design Goals

* Reward exploration and stage pushing.
* Give value to seeing new chest items.
* Add a passive completion layer.
* Avoid extra complexity.

### Rules

* Every unique item discovered is added to the Item Collection Book.
* Duplicate items are simply auto-sold.
* Collection milestones give permanent account bonuses.
* Players do not need to equip or manage items.

### Example Bonuses

| Unique Items Discovered | Bonus                                |
| ----------------------: | ------------------------------------ |
|                10 Items | +10% Gold Earned                     |
|                20 Items | +20% Gold Earned Total               |
|                50 Items | +50% Gold Earned + Small Pack Reward |
|               100 Items | +100% Gold Earned + Rare Pack Reward |

The collection book should feel like a satisfying checklist that grows in the background.

---

## 7. Lucky Block System

Lucky Blocks are special spawns that replace normal chests occasionally.

They are one of the most important excitement beats in the game because they reward Brainrots.

### Spawn Rules

Lucky Blocks can appear through:

* Random chance after a chest breaks.
* Guaranteed pity counter after X chests.
* Special stage milestones.
* Event boosts.
* World-specific modifiers.

### Example Spawn Logic

* Base chance: 5% after each chest.
* Guaranteed Lucky Block after 25 chests without one.
* Higher stage ranges may increase Lucky Block tier.

### Lucky Block Health

Lucky Blocks should have more health than normal chests, but not so much that they feel like a wall.

Recommended starting point:

> Lucky Block Health = Current Chest Health × 2

This makes them feel meaningful while keeping the pace smooth.

### Lucky Block Rewards

Lucky Blocks primarily reward Brainrots.

Possible rewards:

* New Brainrot.
* Duplicate Brainrot.
* Modified Brainrot.
* Bonus gold.
* Pack ticket.
* Rare currency, if added later.

### Reveal Animation

After breaking a Lucky Block, the game should show a reveal animation that cycles between possible rewards before landing on the final result.

This should create anticipation.

Example flow:

1. Lucky Block breaks.
2. Reward carousel spins through Brainrots.
3. Rarity color flashes.
4. Final Brainrot is revealed.
5. Player sees whether it is new, duplicate, modified, or upgraded.

---

## 8. Brainrot System

Brainrots are the main collectible progression objects.

They are earned primarily from Lucky Blocks and provide passive benefits.

### Brainrot Design Goals

* Give the player exciting collectible rewards.
* Provide long-term progression outside of gold upgrades.
* Create attachment to specific characters.
* Support card-based enhancement.
* Encourage farming different worlds.

### Brainrot Stats

Brainrots can provide effects such as:

* Passive damage per second.
* Gold multiplier.
* Tap damage multiplier.
* Lucky Block chance bonus.
* Pack discount.
* Card drop bonus.
* World-specific bonuses.

### Example Brainrots

| Brainrot            | Rarity | Base Effect                                          | Duplicate Scaling            |
| ------------------- | -----: | ---------------------------------------------------- | ---------------------------- |
| Goblin Guy          | Common | +2 Passive DPS                                       | +1 DPS per level             |
| Toilet King         |   Rare | +10% Gold                                            | +2% Gold per level           |
| Radioactive Gremlin |   Epic | +25 Passive DPS, +5% Lucky Block Chance in Wasteland | +8 DPS, +1% chance per level |
| Mythic Sigma Beast  | Mythic | +100 Passive DPS, +50% Gold                          | +25 DPS, +10% Gold per level |

---

## 9. Brainrot Duplicates & Leveling

Collecting duplicate Brainrots levels them up.

Scaling should be mostly linear, with higher-rarity Brainrots having stronger base stats and stronger per-level gains.

### Rules

* First copy unlocks the Brainrot.
* Duplicate copies add progress toward the next level.
* Higher levels may require more duplicates.
* Level increases improve the Brainrot’s base effect.

### Example Duplicate Requirements

| Brainrot Level | Copies Needed |
| -------------: | ------------: |
|        Level 1 |    First copy |
|        Level 2 |   1 duplicate |
|        Level 3 |  2 duplicates |
|        Level 4 |  3 duplicates |
|        Level 5 |  5 duplicates |

### Example Level Scaling

Common Brainrot:

* Level 1: +2 DPS
* Level 2: +3 DPS
* Level 3: +4 DPS
* Level 4: +5 DPS

Rare Brainrot:

* Level 1: +10% Gold
* Level 2: +12% Gold
* Level 3: +14% Gold
* Level 4: +16% Gold

This keeps progression understandable while allowing rarity to matter.

---

## 10. Brainrot Cards

Brainrot Cards are collectible cards earned from packs.

Cards enhance the Brainrots the player owns.

### Card Design Goals

* Add a second collectible layer.
* Make packs exciting.
* Give players a reason to care about specific Brainrots.
* Create collection goals and duplicate progression.
* Strengthen the fantasy of building a powered-up Brainrot roster.

### Card Rules

* Packs contain 3 cards.
* Cards are tied to specific Brainrots or categories.
* Owning a card improves the matching Brainrot.
* Duplicate cards contribute to starring up that card.
* Higher card stars slightly improve the effect.

### Example Pack Result

A basic pack gives:

1. Common Goblin Guy Card.
2. Common Fishing Brainrot Card.
3. Rare Toilet King Card.

If the player owns Toilet King, the Toilet King Card immediately strengthens it.

If the player does not own Toilet King yet, the card is still collected and will apply later once Toilet King is unlocked.

---

## 11. Card Star-Up System

Duplicate cards are used to increase a card’s star level.

This should provide small but satisfying linear improvements.

### Rules

* First copy unlocks the card.
* Duplicate copies add star progress.
* Star levels improve the card’s bonus.
* Card scaling should be smaller than Brainrot leveling, because cards are an enhancement layer, not the main Brainrot level.

### Example Card Scaling

Goblin Guy Card:

| Star Level | Effect                    |
| ---------: | ------------------------- |
|     1 Star | Goblin Guy gains +10% DPS |
|     2 Star | Goblin Guy gains +15% DPS |
|     3 Star | Goblin Guy gains +20% DPS |
|     4 Star | Goblin Guy gains +25% DPS |
|     5 Star | Goblin Guy gains +30% DPS |

Toilet King Card:

| Star Level | Effect                                  |
| ---------: | --------------------------------------- |
|     1 Star | Toilet King gold bonus increased by +5% |
|     2 Star | +7%                                     |
|     3 Star | +9%                                     |
|     4 Star | +11%                                    |
|     5 Star | +13%                                    |

---

## 12. Packs

Packs are purchased with gold or earned from milestones.

Opening packs gives the player Brainrot Cards.

### Pack Design Goals

* Provide a satisfying gacha-style reward moment.
* Support collection progression.
* Give gold another strong sink.
* Connect directly to Brainrot power.

### Pack Rules

* Each pack contains 3 cards.
* Cards reveal one at a time.
* The rarest card should be revealed last.
* Higher-tier packs become available later.
* Pack odds can improve by world, stage, or pack type.

### Example Pack Types

| Pack           | Unlock          | Contents                            |
| -------------- | --------------- | ----------------------------------- |
| Starter Pack   | Stage 10        | 3 basic cards, mostly Common        |
| World 1 Pack   | World 1 Shop    | Cards for World 1 Brainrots         |
| Grasslands Pack | World 2        | Higher chance for Grasslands cards  |
| Epic Pack      | Milestone/Event | Guaranteed Rare+ card               |

---

## 13. Card Collection Book / Codex

Cards should be tracked in a collection book or codex.

This gives players a clear long-term completion goal.

### Card Codex Tracks

* Cards owned.
* Missing cards.
* Star level per card.
* Which Brainrot the card affects.
* World/set source.
* Completion rewards.

### Example Completion Rewards

| Completion Goal                      | Reward                                     |
| ------------------------------------ | ------------------------------------------ |
| Collect 10 Cards                     | +5% Passive DPS                            |
| Complete all Common Cards in World 1 | +10% Gold in World 1                       |
| Get 10 Cards to 3 Stars              | +5% Pack Luck                              |
| Complete World 1 Card Set            | Exclusive Brainrot skin or permanent bonus |

---

## 14. Rarity System

Rarity should apply to Brainrots, cards, chest items, and Lucky Blocks.

### Suggested Rarities

| Rarity    | Purpose                             |
| --------- | ----------------------------------- |
| Common    | Frequent, basic progression         |
| Rare      | Noticeably better, still attainable |
| Epic      | Exciting mid-tier chase             |
| Legendary | Strong, rare, memorable             |
| Mythic    | Very rare, major progression spike  |

### Rarity Design Principles

* Higher rarity = higher base stats.
* Higher rarity = stronger duplicate scaling.
* Higher rarity = more exciting visual effects.
* Higher rarity should not be required too early.
* Common rewards should still matter due to duplicates, collection, and star-ups.

---

## 15. World & Zone System

Worlds are themed progression areas with unique loot, Brainrots, and modifiers.

### Design Goals

* Give the player new goals.
* Refresh visuals and rewards.
* Support targeted farming.
* Create reasons to revisit older worlds.

### World Rules

* Worlds unlock through stage milestones.
* Each world has its own chest visuals, item pool, Lucky Block style, Brainrot pool, and modifier chances.
* New worlds scale harder.
* Players can return to earlier worlds at any time.
* Older worlds remain useful for completing collections and farming specific Brainrots/cards.

### Example Worlds

| World   |            Unlock | Theme                 | Special Reward Angle                    |
| ------- | ----------------: | --------------------- | --------------------------------------- |
| World 1 |             Start | Castaway Cove         | Starter Brainrots and nautical loot     |
| World 2 |  Stage 50 World 1 | Grasslands            | Verdant meadows & woods; nature loot    |
| World 3 | Stage 100 World 2 | Frozen Brainrot Zone  | Frozen modifiers and ice-themed cards   |

> **Note:** Grasslands is World 2 (it replaces the previously planned
> "Radioactive Wasteland" world). "Radioactive" is retained as a roaming
> Brainrot **modifier** (see §16), not a dedicated world. Each world keeps its
> own independent stage track.

---

## 16. Modified Brainrots

Modified Brainrots are special variants of existing Brainrots.

They create collection depth and world-specific farming goals.

### Example Modifiers

| Modifier    | Theme               | Effect Example                               |
| ----------- | ------------------- | -------------------------------------------- |
| Radioactive | Hazard zones        | Multiplied passive damage                    |
| Frozen      | Ice World           | Slows chest decay timer or boosts idle gains |
| Golden      | Rare Global Variant | Increased gold multiplier                    |
| Glitched    | Late Game           | Bonus pack luck or duplicate value           |

### Modifier Rules

* Modifiers are usually tied to specific worlds.
* Modified Brainrots count as special collection entries.
* Modified versions may have enhanced stats.
* Some worlds increase the chance of certain modifiers.

### Example

In a Radioactive-modifier zone:

* Goblin Guy can drop normally.
* Goblin Guy has a higher chance to appear as **Radioactive Goblin Guy**.
* Radioactive Goblin Guy has stronger stats and fills a separate codex entry.

---

## 17. Gold & Upgrade Economy

Gold is the main currency.

It is earned from auto-selling chest items and spent on upgrades and packs.

### Gold Sources

* Chest item auto-sell.
* Bonus rewards from Lucky Blocks.
* Milestone rewards.
* Collection bonuses.
* Brainrot effects.

### Gold Sinks

* Tap damage upgrades.
* Passive damage upgrades.
* Gold multiplier upgrades.
* Pack purchases.
* World unlock costs, if needed later.
* Special shop offers.

### Upgrade Examples

| Upgrade           | Effect                                |
| ----------------- | ------------------------------------- |
| Stronger Taps     | Increases tap damage                  |
| Better Loot Sales | Increases item sell value             |
| Brainrot Training | Increases all Brainrot passive DPS    |
| Lucky Charm       | Slightly increases Lucky Block chance |
| Pack Discount     | Reduces pack cost slightly            |

Gold upgrades should provide immediate short-term power, while Brainrots/cards provide deeper long-term power.

---

## 18. Damage System

Damage comes from two main sources:

1. Active tap damage.
2. Passive Brainrot damage.

### Tap Damage

Tap damage is controlled by player input and gold upgrades.

It should feel useful, especially early game.

### Passive Damage

Passive damage comes mainly from Brainrots and related upgrades.

It allows the game to become increasingly idle over time.

### Design Goal

Early game should feel active.

Mid and late game should increasingly reward collection and idle power.

---

## 19. Ideal Player Flow

### Session Start

* Player opens game.
* Sees current chest/stage/world.
* Claims idle progress, if implemented.
* Starts tapping or watching Brainrots deal passive damage.

### During Play

* Chests break quickly enough to maintain rhythm.
* Items appear and auto-sell.
* Gold total increases.
* Player buys upgrades.
* Lucky Block appears as a surprise moment.
* Brainrot reveal creates excitement.
* Pack opening creates another reward moment.

### Session End

* Player feels stronger than when they started.
* They may have discovered new items, unlocked cards, levelled Brainrots, or pushed stages.
* They have clear next goals:

  * Reach next stage milestone.
  * Unlock next world.
  * Find a missing Brainrot.
  * Complete a card set.
  * Star up a key card.

---

## 20. UI Structure

The current visual reference supports a simple mobile-first layout.

### Main Screen

Should show:

* Current gold.
* Premium currency, if used.
* Pack/card count or tickets.
* Current stage.
* Current target name and rarity.
* Chest or Lucky Block object.
* Health bar.
* Bottom navigation.

### Bottom Navigation

| Tab   | Purpose                                                 |
| ----- | ------------------------------------------------------- |
| Bag   | Brainrot inventory and owned items/cards summary        |
| Map   | Worlds, stages, zone selection                          |
| Shop  | Gold upgrades, packs, offers                            |
| Loot  | Recent drops, pack opening, Lucky Block rewards         |
| Codex | Collection books for items, Brainrots, cards, modifiers |

---

## 21. Reward Feedback Priorities

The game should communicate rewards clearly and frequently.

### Chest Reward Feedback

* Chest breaks.
* 1-2 items pop out on screen with a rarity-coloured glow and their sell value.
* Each item bursts into gold coins that arc up to the gold counter.
* The gold counter pulses and visibly counts up as the coins land (accumulation feel).
* If new, show “New Discovery!”

### Lucky Block Feedback

* Lucky Block feels special visually.
* Breaking it triggers reveal animation.
* Reward cycles through possible Brainrots.
* Final Brainrot reveal includes rarity, new/duplicate status, and effect.

### Pack Feedback

* Pack opens with a satisfying rip/tear animation.
* Cards reveal one at a time.
* Rarest card appears last.
* Duplicate cards show star progress.
* Matching Brainrot power increase is shown clearly.

---

## 22. System Interaction Summary

### How Everything Connects

| System          | Feeds Into                                           |
| --------------- | ---------------------------------------------------- |
| Chests          | Gold, item collection, stage progress                |
| Gold            | Upgrades, packs                                      |
| Upgrades        | Faster chest breaking, better gold income            |
| Lucky Blocks    | Brainrots, duplicates, modifiers                     |
| Brainrots       | Passive damage, gold multipliers, special bonuses    |
| Packs           | Brainrot Cards                                       |
| Cards           | Brainrot enhancement, codex completion               |
| Item Collection | Permanent gold bonuses                               |
| Worlds          | New loot pools, Brainrots, modifiers, harder scaling |
| Stages          | Unlocks, difficulty, reward quality                  |

The ideal design is that every reward either gives immediate value, long-term value, or collection progress.

---

## 23. Key Design Pillars

### 1. Simple Input, Deep Progression

The player mostly taps and navigates menus, but the progression systems give long-term depth.

### 2. Every Chest Matters

Even basic chests contribute gold and item collection progress.

### 3. Lucky Blocks Are Excitement Spikes

Lucky Blocks should feel like rare, valuable moments that break up the normal chest rhythm.

### 4. Brainrots Are the Main Collection Fantasy

Brainrots are the characters players care about, level, modify, and build around.

### 5. Cards Make Brainrots More Personal

Cards are not separate from Brainrots; they empower them and make pack opening relevant.

### 6. Worlds Create Farming Choices

Players should care where they play because worlds affect rewards, modifiers, and collection goals.

---

## 24. Example Full Flow

1. Player is on Stage 12 in World 1.
2. They break a Common Chest.
3. It drops a **Seashell** (and sometimes a second item).
4. The items pop out and burst into coins that fly to the gold counter, auto-selling for gold.
5. Each new item is added to the Item Collection Book.
6. Player buys **+1 Tap Damage**.
7. After a few more chests, a Lucky Block appears.
8. Lucky Block has 2× normal chest health.
9. Player breaks it.
10. Reveal animation cycles through several Brainrots.
11. Player receives **Toilet King**, a Rare Brainrot.
12. Toilet King gives **+10% Gold Earned**.
13. Player buys a Starter Pack.
14. Pack reveals 3 cards:

    * Goblin Guy Card.
    * Goblin Guy Card duplicate.
    * Toilet King Card.
15. Toilet King Card boosts Toilet King’s gold effect.
16. Player now earns more gold from every chest.
17. Player pushes toward Stage 50 to unlock World 2.

---

## 25. Current Open Balancing Questions

These do not block the core design, but should be decided during balancing:

* Exact chest health scaling formula.
* Exact gold reward scaling formula.
* Lucky Block base spawn chance.
* Guaranteed Lucky Block pity count.
* Pack pricing curve.
* Brainrot duplicate requirements per rarity.
* Card star-up duplicate requirements.
* World unlock stage thresholds.
* Number of Brainrots/cards/items per world.

---

## 26. Final Core Loop Statement

The game is built around this loop:

> Break chests to discover items and earn gold. Spend gold on upgrades and packs. Lucky Blocks occasionally appear and reward Brainrots. Brainrots generate passive power and gold bonuses. Packs give cards that enhance Brainrots. Collections and duplicates create long-term progression. Stages and worlds increase difficulty, improve rewards, and unlock new Brainrots, cards, modifiers, and loot pools.

This is the foundation for the game’s core design.

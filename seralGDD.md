# Seral — Game Design Document
*Compiled from design session. Use as implementation reference for Claude Code.*

---

## 1. Concept Overview

**Seral** is a mobile-first roguelike card game about ecological succession. The player manages a planet-level campaign map, launching individual runs into specific regions with the goal of advancing those regions through ecological succession stages — from bare rock to climax ecosystems. The core gameplay loop is a spatial card-placement puzzle: deploy species and abiotic modifier cards onto a hex grid, building synergistic ecosystems under resource constraints.

**Platform:** Mobile (portrait/vertical). Prepare it as a react app for testing and development, prepare for eventual deployment to android. 
**Session length:** A single run takes 10–20 minutes. Map size and climate zone difficulty affect length.  
**Tone:** Scientifically grounded ecological simulation with roguelike progression feel.

---

## 2. Planet Meta Map

### 2.1 Structure & Topology

The planet (**named by the player and serves as a profile/save file**) is represented as a hex grid of approximately 40 regions, displayed as a flattened cylindrical projection. Regions are grouped into five horizontal **climate bands**:

| Band | Row position | Baseline character |
|---|---|---|
| polar | Top | Cold, low moisture, short growing season |
| temperate | Upper mid | Moderate, variable |
| Equatorial | Center | Warm, high moisture, |

Climate bands define the **baseline abiotic conditions** (moisture, light, nutrient availability) that constrain which succession pathways are viable within a region. However, **local climates exist** — global climate stats heavily influence but do not completely dictate per-region options. A region can have a sheltered valley with anomalously high moisture even in a dry band.

### 2.2 Region States

Each region progresses through succession stages across multiple runs:

```
locked → barren → pioneer → grassland → woodland → climax
                                                 ↕ (disturbance events)
                                              disturbed
```

- **Locked:** No path established. Cannot be run. Unlocked when an adjacent region reaches at least pioneer state.
- **Barren:** First foothold possible. Species-poor, harsh starting conditions.
- **Pioneer:** Basic life established (crust lichen, spore moss, etc.).
- **Grassland:** Early vascular plants, small fauna niches.
- **Woodland:** Mid-succession, canopy forming.
- **Climax:** Stable, complex biome. Region is "complete." Can export species to adjacent zones, denoted with modifiers on those runs.
- **Disturbed:** A completed or in-progress region hit by a disturbance event. Regressed some amount of stages. Recovery runs available, often with unique substrate bonuses.

**Completing a run** in a region advances it to a new stage depending on it meeting certain thresholds. Barren is always available after one attempt. To reach grassland, a moderate amount of flora diversity and populatin size has to be established. to reach climax, a certain number of flora and fauna species with large populations much be reached. not every run will result in advancing to a further level, succession levels can be skipped with good runs. early game runs won't be able to reach the higher succession levels because the player has not unlocked sufficient cards or synergies.

### 2.3 Climate System (Global Variables)

Three persistent planetary stats tracked across all runs:

| Stat | Driven by | Effect when high |
|---|---|---|
| O₂ density | Photosynthetic climax zones | Unlocks aerobic animal niches in cards |
| Hydrological activity | Coastal/wetland region completions | Enables moisture-dependent succession paths |
| Thermal balance | Forest cover vs. bare rock ratio | Stabilizes; low = hostile conditions across equatorial band |

These are displayed as levels 1-5 on the world map. They set the baseline that is modified by local environments, but are not an objective in and of itself. They gate card availability and modify starting conditions for future runs — but local climate heterogeneity means a run is never completely blocked by global stats alone. can be modified by geoengineering.

### 2.4 Seed Bank & Zone Persistence

When a run concludes in any region:

- The player is presented with a **curated selection of species cards** from that run to "establish." The selection is weighted by performance metrics (turns active, population size, synergy chains triggered, ).
- The player picks **one card** to establish permanently in that region.
- Established species appear as **free starting cards** on future runs in that same zone (already on the hex map, no cost to play).
- **Abiotic modifications** made during a run (drainage redirects, mineral amendments) that may or may not persist as modified hex starting conditions in future runs, depending on the card.
- **Adjacent zone bleed:** Established species in neighboring completed regions occasionally appear as free, already placed elements on teh map representing natural migration. 

### 2.5 Disturbance Events

Disturbance events hit the map periodically and change the strategic situation:

- **Volcanic eruption:** Resets a region to barren. Adds nutrient-rich but toxic substrate — recovery run has unique chemotrophic pioneer cards available.
- **Glaciation front:** An entire polar band resets. Unlocks ice-specialist species. Creates urgent recovery chain.
- **Invasive species spread:** Radiates from one region. Converts adjacent completed zones to "disturbed" unless a recovery run is completed first. Pre-populates the map with many instances of that species.
- **Drought event:** Shuts off water-dependent succession paths in a band temporarily.

Disturbances should feel like high-stakes **opportunities**, not pure punishment. Recovery runs offer unique cards and substrate bonuses unavailable in normal succession runs.

### 2.6 Map Regeneration & Quest System

After each completed run, the planet map **regenerates the local "quest" for every zone**:
- Local goals may change (e.g., "introduce a pollinator" → "establish a predator guild") Local goals just give a boost to score.
- Map size for that zone may shift slightly (simulates passage of time and landscape change)
- Zone modifiers may change (new disturbance, migration event from neighboring zone, changed starting conditions)

This simulates the passage of ecological time and ensures no two visits to the same zone feel identical.

### 2.7 Meta Progression Unlocks

Completing global campaign objectives (getting specific zones to specific biomes, completing biome chains, stabilizing climate stats) unlocks persistent upgrades:

- **New species families:** Adds new cards to the global draw pool. Later in the game, unlock the ability to genetically engineer species to tweak their requirements.
- **Geoengineering abilities:** Active one-time tools that shift planetary climate stats directly or hex traits. 
- **Run power-ups:** One-time-use items deployable at the start of a specific run
- **Starting resource bonuses:** More biomass/nutrients/water at run start
- **New starting scenarios:** Post-volcanic, post-glacial, asteroid impact site, etc.
- **Set-aside tray** *(specific unlock)*: Allows player to hold 1–2 cards across turns without discarding (see §5.4)

**Research Points** are the meta-currency. Earned from every run based on scoring metrics, regardless of whether objectives are met. All runs contribute progress.

---

## 3. Run Gameplay

### 3.1 Structure Overview

Each run is a self-contained 10–20 minute session within a single region. It consists of:

1. **Deck assembly phase** (before entering the map)
2. **Play phase** (card placement on hex grid, turn by turn)
3. **End condition trigger** (player skips a turn without playing)
4. **Scoring screen**
5. **Establish selection** (pick one species to persist)

### 3.2 Local Map

Each run's local environment is a **procedurally generated hex grid**. 
- Size is regenerated each time a zone's quest resets

The map has **terrain heterogeneity** established at generation:
- Low-elevation depression with water (frozen or liquid depending on climate)
- Igneous rock outcrops with elevated mineral/nutrient values
- Pre-existing flora or fauna in zones that have had previous runs (established species from prior runs appear here)
- Starting hex conditions modified by global climate stats, zone climate band, and prior run abiotic modifications

### 3.3 Turn Structure

**Each turn = one year.**

1. Player draws **5 cards** from their deck.
2. Player plays as many cards as they are able to afford (resource costs) onto valid hex positions.
3. Cards may be played in any order. Meeting requirements on some cards trigger chain draws when played (see §5.2).
4. Player presses the **End Turn button** to advance a year. This button always displays its current biomass cost (see §3.4).
5. Income from all cards in play is collected. Hex conditions may shift slightly from card effects.
6. Repeat.

**Reshuffling the hand:** There is no hand re-draw in standard play. The player must increment the turn or play another card that shuffles/draws more.

### 3.4 End Condition

The run ends when the player **skips a turn without playing any cards at all.**

**End Turn button behavior:**
- Always displays its current biomass cost.
- The cost **increases each time it is pressed** — creating pressure to build a productive ecosystem rather than pass repeatedly.
- If the player has not yet played a card this turn, the button text shoudl read **"End run"** and requires a **confirmation press** before terminating the run. After a card has been played, the text changes to "End Turn". 
- Each time the end turn button is pressed, the biomass cost of pressing it increases by 1.

*Design note: there is no turn limit. The run runs as long as the player can keep playing cards.*

### 3.5 Scoring

Scoring triggers immediately after the run ends. All runs score and contribute spores to meta-progression, even if global or local objectives are not met.

Scoring dimensions:
- **Resources net:** Total biomass/nutrients/water gained vs. spent
- **Income level:** Peak and sustained per-turn income rates
- **Diversity:** Number of distinct species card types in play at end
- **Population:** Total cards on the hex grid at end
- **Turns:** More turns equals higher score.
- **Global objective:** Large bonus if zone reached its target succession stage
- **Local quest:** Medium bonus if run-specific goal was met (e.g., "introduce a pollinator")
- **Synergy chains:** Bonus for notable chain sequences during play

Score converts to research points.

---

## 4. Resource System

Three **player-level** resource pools. These are global to the run, not per-hex.

| Resource | Icon | Description |
|---|---|---|
| **Biomass** | Leaf | Primary currency. Generated by living cards in play. Spent to introduce new organisms and to end turn. |
| **Nutrients** | Amber cluster | Soil fertility pool. Accumulates via decomposer and N-fixer cards. Depleted by high-productivity species. |
| **Water** | Droplet | Moisture budget. Generated by spring/snowmelt hexes and some cards. Spent by moisture-hungry species. |

**Light** is NOT a player resource. It is a per-hex condition only (see §6).

Resources are displayed permanently in the top bar of the run UI. There are no per-hex biomass values — biomass is a player resource only.

---

## 5. Card System

### 5.1 Card Types

**Species cards** (the majority of the deck)  
Represent organisms at specific trophic levels and succession stages. Deployed to a hex. Most have a one-time biomass cost and possibly nutrient cost and provide ongoing income or passive effects. Examples:
- *Crust lichen* — pioneer, producer, low cost, establishes basic moisture retention
- *N-fixing shrub* — pioneer/grassland transition, adds nutrients/turn, enables grassland succession in adjacent hexes
- *Pioneer fern* — pioneer, draws soil crust event card when played, biomass income

**Abiotic modifier cards**  
Reshape hex conditions permanently. Expensive one-time plays. No ongoing cost. Do not represent organisms — represent physical interventions:
- *Drainage redirect* — target hex moisture +2, adjacent hexes +1, permanent
- *Mineral amendment* — target hex nutrients +3, one-time
- *Slope grading* — removes terrain penalty from a hex, enables previously unplayable hexes

**Event cards**  
Stochastic conditions that enter the hand occasionally from the deck. Must be played this turn or discarded. Free to play but highly situational:
- *Good rain year* — all hexes +1 moisture this turn, draw 1 card
- *Mast seed event* — one species card in hand plays free this turn
- *Warm winter* — cold-intolerant species cards cost −1 biomass this turn


### 5.2 Spatial Synergies & Card Chaining

**Spatial synergies** are adjacency effects described directly in card text. Cards are tagged, and synergy effects trigger based on neighboring hex content. Examples:

- *Arbuscular mycorrhizal fungi:* "Any plant card played adjacent to this hex gains +1 biomass/turn."
- *Pollinator:* "When played adjacent to an angiosperm, draw a free copy of that angiosperm card."
- *Decomposer guild:* "Adjacent species cards generate +1 nutrients/turn."
- *Predator:* "Adjacent prey-tagged cards generate +2 biomass/turn (trophic cascade bonus)."

Synergies are visible in card descriptions. No separate relationship card type exists.

**Card chaining:** Many cards draw one or more additional cards from the deck when played. This creates satisfying cascade turns and reflects real ecological facilitation sequences:

- Nitrogen-fixing pioneer → draws a soil enrichment event card
- Canopy-forming tree → draws a shade-tolerant understory card
- Keystone predator → draws a prey population dynamics card
- Pioneer fern → draws soil crust event card

Chains are specified in card text. They are the primary mechanism driving the "playing feels like watching an ecosystem wake up" sensation.

**Card overlaying nad over-time effects** Some cards must be played on top of other cards for valid placement. Many cards propagate themselves to eligble hexes when the turn increments, simulating spread. 

- algae cards will propagate to adjacent hexes with maximum water levels. herbivorous fish have to be placed onto (or sometimes adjacent for other predatory-prey relationships). 
- they may be limited in their propagation quantity per turn (grazer animals will only reproduce to one adjacent hex whereas plants may propagate radially to as many as are eligible
- when a card is overlaid, it replaces the previous card rather than maintaining both. )
- this introduces dynamic predator-prey relationships and a sense of a growing/changing ecosystem over time that the player intervenes and guides for maximum points. 

### 5.3 Resource Costs

Most cards have a **one-time play cost** paid in biomass, nutrients, and/or water. Some also have a **per-turn maintenance cost** paid each year. Some generate income (per-turn resource gain).

Card cost display on card face:
- Cost badges: `4B` (4 biomass), `2N` (2 nutrients), `1W` (1 water) — shown as small colored pills
- Income indicated in effect text: `+2 biomass/turn`, `+1 nutrients/turn`
- Free event cards show `free` badge

### 5.4 Set-Aside Tray

A **meta-progression unlock** (not available at game start). Once unlocked, the player has a tray of 1–2 slots to hold cards across turns without discarding. Cards parked in the tray do not count toward hand size but occupy "intention" space — they are visible reminders of a planned play. Max 2 cards in tray at once.

---

## 6. Hex Grid & Micro-climate Conditions

The local map is displayed as a hex grid. Each hex has its own micro-climate, distinct from player resources.

### 6.1 Hex Conditions (three values, always visible)

| Condition | Display method | Levels |
|---|---|---|
| **Moisture** | Tile fill color | 1 (sandy tan) → 2 (dry grass) → 3 (moderate green) → 4 (moist blue-green) → 5 (waterlogged deep blue). Water body = distinct blue. Rock outcrop = dark gray. |
| **Light** | Icon in top-right corner of hex | 3 = full sun (circle + rays), 2 = partial (semi-circle), 1 = shade (crescent) |
| **Nutrients** | Amber chevrons (›) at hex bottom | 1 chevron (low) → 2 → 3 → 4 → 5 (mineral-rich, e.g., from igneous outcrops) |

These three values must be **immediately readable at a glance** without interaction. No numbers displayed on hexes in normal state.

### 6.2 Special Hex Types

- **Water body:** Blue fill, wave icon. Can host aquatic/wetland species. Generates water income passively.
- **Rock outcrop:** Dark gray fill, diamond icon. High nutrient potential from mineral weathering. Requires abiotic modifier card before most species can be placed.
- come up with more 

### 6.3 Card Placement UX

When a card is selected from hand:
- All **valid hex placements** are highlighted with a teal border.
- Invalid hexes (wrong moisture, wrong light, occupied, etc.) show no highlight.
- **On hover (desktop) or tap (mobile):** A placement preview popup appears over the target hex showing:
  - Card name
  - Resource cost (what will be deducted now)
  - Per-turn income change (`+2 biomass/turn`)
  - Effects on neighboring tiles (`adj. moisture +1`, `adj. gets "pioneer" tag`)
  - Chain effects (`chains: draw soil crust event card`)
- Placement is confirmed on second tap or dedicated confirm button.

**Card sprites:** Each species card has a simple visual sprite displayed in the center of its hex when played. Sprites must be recognizable at hex scale (~40px diameter). Use silhouette-style simple SVG shapes rather than detailed art.

### 6.4 Condition Modification

Hex conditions change during a run through:
- Abiotic modifier cards (direct, permanent)
- Adjacency effects from neighboring species cards
- Event cards (temporary, this turn only)


Conditions are re-evaluated each turn and displayed in the updated state.

---

## 7. Deck Assembly Screen

Shown before every run. Player assembles their deck before seeing the map (though run modifiers and zone info are visible).

### 7.1 Left/Top Panel: Run Information

Always visible during deck assembly:

- **Zone name** and current succession stage
- **Target stage** for this run (the global objective)
- **Local run quest** (specific secondary goal, e.g., "introduce a pollinator," "establish a predator guild")
- **Map size** (small / medium / large)
- **Zone modifiers** — displayed as modifier tags, can be positive or negative:
  - *Migration from adjacent zone:* "Pioneer fern (from Equatorial Forest) — mandatory add to deck"
  - *Environmental disturbance:* "Drought in progress — water-dependent cards cost +1W"
  - *Favorable condition:* "Mineral upwelling — abiotic modifier cards cost −1B"
  - Some modifiers mandate specific cards be added to the deck automatically
- **Starting climate conditions:** Summary of the map's starting moisture/light/nutrient ranges

### 7.2 Card Browser Panel

Scrollable, paginated list of all unlocked cards. Filter controls:

- **Succession stage:** pioneer / grassland / woodland / climax / any
- **Resource cost:** max biomass, max nutrients, max water
- **Trophic level:** producer / consumer / decomposer / abiotic
- **Card type:** species / abiotic modifier / event
- **Tag:** N-fixer / pollinator / predator / pioneer / aquatic / etc.

Each card shows: name, cost badges, effect summary, tags.

### 7.3 Suggested Starting Deck

The game **pre-fills a suggested deck** before the player begins browsing. Suggestion algorithm:

- Prioritizes cards **immediately playable in the starting climate conditions** (at least 3 hexes in the starting map should be valid placements for any suggested card)
- Weights toward the target succession stage for this run
- Respects mandatory cards from zone modifiers
- Player can accept as-is, tweak, or rebuild entirely

Deck size limit: define during implementation (suggest 20 cards as starting range for testing).

---

## 8. Run Complete Screen

Triggered after the player confirms "End run".

### 8.1 Scoring Display

Show each scoring dimension clearly with its point contribution:

- Resources net (biomass/nutrients/water surplus)
- Income level (peak per-turn rate)
- Diversity (distinct species types)
- Population (total cards on field)
- Turn efficiency
- Global objective bonus (if achieved)
- Local quest bonus (if achieved)
- Synergy chain bonus
- **Total spores earned**

### 8.2 Establish Selection

After scoring, player is shown a curated selection of **3 species cards** from that run to establish permanently in the zone. Selection is weighted by:

- How many turns the species was active on the field
- Biomass generated by that species (directly and via synergies it enabled)
- Whether it was part of notable chain sequences

Player picks **exactly one.** This card becomes a free starting card on future runs in this zone IF THERE IS A HEX WITH APPROPRIATE CONDITIONS (appears pre-placed on the map).

*Note: Event cards and abiotic modifier cards are not eligible for establishment. Species cards only.*

### 8.3 Zone State Update

After the establish selection:

- Zone succession stage advances (if objective met)
- If the succession level is at least barren, adjacent zones unlock
- Planet map global climate stats update based on run outcomes
- Zone quest regenerates for the next visit (new local goal, potentially new map size and modifiers)

---

## 9. Planet Map UI

### 9.1 Layout

- Planet name and run/completion stats (runs completed, regions at climax out of total)
- **research points currency** display (top right)
- **Three climate gauges** (horizontal progress bars, 0–100%):
  - O₂ density (green)
  - Hydrological activity (blue)
  - Thermal balance (red)
- **Hex map** (main body) — regions colored by succession state
- **Region detail panel** (slides in on region tap)

### 9.2 Region Color by State

| State | Fill color (approx.) | Notes |
|---|---|---|
| Locked | Very dark gray | Clearly inaccessible |
| Barren | Sandy gray | No life, harsh |
| Pioneer | Light amber | First organisms |
| Grassland | Light green | |
| Woodland | Mid green | |
| Climax | Teal/rich green | Small white dot marker |
| Disturbed | Coral/orange-red | `!` marker on hex |

### 9.3 Region Detail Panel

On tapping an unlocked region:

- Region name
- Climate band
- Current succession state (pill badge)
- Target stage for current quest
- Disturbance warning if applicable (type, recovery bonus available)
- **Seed bank** — species established in this zone (importable as starting cards for adjacent runs)
- Adjacency bonuses (species bleeding in from neighboring completed zones)
- **"Begin run" button** — disabled if locked

---

## 10. Key Design Principles

These should guide all implementation decisions:

1. **The inventory is a system, not an arsenal.** Cards have relationships to each other and to their environment, not just additive stats.

2. **Ecology teaches itself.** Players learn real succession dynamics (facilitation, trophic structure, nutrient cycling) through the game's mechanics, not through text explanations.

3. **Every run contributes.** Failed runs still earn spores and potentially establish a species. Players are never punished for attempting a difficult zone.

4. **Endings feel deliberate.** The End Turn → End Run confirmation flow ensures players always understand why the run is concluding.

5. **Local heterogeneity matters.** The procedurally generated map should always present meaningful spatial decisions — not just "place this card anywhere." The various abiotic features and pre-existing cards should create genuine puzzle variety. Some local maps should feature entirely or almost entirely aquatic zones. Others should represent transitional environments between biomes, etc.

6. **Global climate is influence, not mandate.** A high-O₂ planet makes aerobic animals more available and powerful, but players can still attempt pioneer runs in low-O₂ conditions. Local sheltered microclimates can partially offset global conditions.

7. **Disturbances are opportunities.** Recovery runs offer unique species and substrate bonuses. Disturbed zones should feel exciting to encounter, not frustrating.

---

## 11. Open Questions (for future design sessions)

- Exact deck size limits
- Number of mandatory vs. optional cards in starting deck suggestion
- Precise research point → unlock cost table
- Biome chain system on global hex map (specific biome adjacency requirements for unlocking rare biome types — mangroves require tropical forest + coastal, boreal requires tundra adjacency, etc.)
- Pioneer → grassland card catalogue (species selection for that specific transition)
- Full disturbance event frequency and trigger rules


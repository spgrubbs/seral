// ============================================================
// Seral — Core Game Types
// ============================================================

// --- Hex Grid ---

export interface HexCoord {
  q: number;
  r: number;
}

export function hexKey(c: HexCoord): string {
  return `${c.q},${c.r}`;
}

export interface HexTile {
  coord: HexCoord;
  moisture: number;   // 1-5
  light: number;      // 1-3
  nutrients: number;  // 1-5
  type: 'normal' | 'water' | 'rock' | 'frozen';
  placedCard: PlacedCard | null;
}

export interface PlacedCard {
  card: Card;
  turnsActive: number;
  biomassGenerated: number;
}

// --- Resources ---

export interface Resources {
  biomass: number;
  nutrients: number;
  water: number;
}

// --- Cards ---

export type CardType = 'species' | 'abiotic' | 'event';
export type TrophicLevel = 'producer' | 'consumer' | 'decomposer';
export type SuccessionStage = 'pioneer' | 'grassland' | 'woodland' | 'climax';
export type CardTag = 'n-fixer' | 'pollinator' | 'predator' | 'pioneer' | 'aquatic' | 'fungal' | 'canopy' | 'shade-tolerant' | 'angiosperm' | 'decomposer' | 'prey' | 'herbivore';

export interface PlacementRequirement {
  minMoisture?: number;
  maxMoisture?: number;
  minLight?: number;
  maxLight?: number;
  minNutrients?: number;
  maxNutrients?: number;
  hexType?: HexTile['type'][];
  adjacentTag?: CardTag;
  requiresOverlay?: CardTag; // must be placed on a hex with this tag
}

export interface AdjacencyEffect {
  moisture?: number;
  light?: number;
  nutrients?: number;
  biomassPerTurn?: number;
  nutrientsPerTurn?: number;
}

export interface Card {
  id: string;
  name: string;
  type: CardType;
  description: string;
  cost: Resources;
  incomePerTurn: Resources;
  maintenanceCost?: Resources;
  trophicLevel?: TrophicLevel;
  successionStage?: SuccessionStage;
  tags: CardTag[];
  placement: PlacementRequirement;
  adjacencyEffect?: AdjacencyEffect;
  chainDraw?: string; // id of card to draw when played
  propagates?: boolean; // spreads to adjacent hexes on turn end
  maxPropagation?: number; // max hexes to spread per turn
  sprite: string; // SVG path/shape identifier
  flavorText?: string;
  consumable?: boolean; // abiotic/one-shot cards are consumed on use
  rpCost?: number; // research point cost for unlocking abiotic cards
  locked?: boolean; // not available at game start
}

// --- Region / Planet Map ---

export type RegionState = 'locked' | 'barren' | 'pioneer' | 'grassland' | 'woodland' | 'climax' | 'disturbed';
export type ClimateBand = 'polar' | 'temperate' | 'equatorial';

/**
 * LocalCondition — the defining environmental character of a region.
 *
 * normal          — no special modifier
 * monsoon         — +1 water income per turn
 * drought         — all hexes start with -1 moisture
 * volcanic-soil   — all hexes start with +2 nutrients
 * mineral-upwelling — rock hexes have nutrients 4-5; more rock hexes spawn
 * windswept       — light is always 3 but moisture -1 on all hexes
 * geothermal      — frozen hexes become normal; +1 biomass income on border hexes
 */
export type LocalCondition =
  | 'normal'
  | 'monsoon'
  | 'drought'
  | 'volcanic-soil'
  | 'mineral-upwelling'
  | 'windswept'
  | 'geothermal';

export interface Quest {
  description: string;
  targetType: 'population' | 'diversity' | 'biomass_income' | 'nutrient_income' | 'place_producers' | 'place_consumers';
  targetValue: number;
}

export interface Region {
  id: string;
  name: string;
  coord: HexCoord;
  state: RegionState;
  climateBand: ClimateBand;
  baseMoisture: number;
  baseLight: number;
  baseNutrients: number;
  seedBank: Card[];
  quest: Quest;
  localCondition: LocalCondition;
  mapSize: 'small' | 'medium' | 'large';
}

export interface PlanetStats {
  o2Density: number;       // 1-5
  hydrologicalActivity: number; // 1-5
  thermalBalance: number;  // 1-5
}

// --- Planet Upgrades & Achievements ---

export interface PlanetUpgrades {
  freeTurnEnds: number;        // 0-3: first N turn-ends cost no biomass
  startingBiomassBonus: number; // 0-3: bonus biomass at run start
  ecologicalDrift: number;     // 0-2: seed bank species appear N+1 hexes away from center
  unlockedAbioticIds: string[]; // abiotic card ids purchased with RP
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  reward: number;   // research points awarded
  completed: boolean;
  check: string;    // serializable check type, e.g. 'regions_pioneer_5' or 'diversity_10'
}

export interface Planet {
  name: string;
  regions: Region[];
  stats: PlanetStats;
  researchPoints: number;
  runsCompleted: number;
  unlockedCardIds: string[];
  upgrades: PlanetUpgrades;
  achievements: Achievement[];
}

// --- Run State ---

export interface RunState {
  regionId: string;
  hexGrid: Map<string, HexTile>;
  deck: Card[];
  hand: Card[];
  discard: Card[];
  resources: Resources;
  turn: number;
  endTurnCost: number;
  cardsPlayedThisTurn: number;
  totalActions: number;
  score: RunScore;
  phase: 'playing' | 'ended';
  selectedCardIndex: number | null;
  setAsideTray: Card[];
}

export interface RunScore {
  resourcesNet: number;
  peakIncome: number;
  diversity: number;
  population: number;
  actions: number;
  turns: number;
  objectiveBonus: number;
  questBonus: number;
  synergyBonus: number;
  total: number;
}

// --- Game State (top-level) ---

export type Screen = 'title' | 'planet-map' | 'deck-assembly' | 'run' | 'run-complete';

export interface GameState {
  screen: Screen;
  planet: Planet | null;
  currentRun: RunState | null;
  selectedRegionId: string | null;
  assembledDeck: Card[];
}

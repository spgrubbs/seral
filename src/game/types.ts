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
}

// --- Region / Planet Map ---

export type RegionState = 'locked' | 'barren' | 'pioneer' | 'grassland' | 'woodland' | 'climax' | 'disturbed';
export type ClimateBand = 'polar' | 'temperate' | 'equatorial';

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
  questDescription: string;
  targetStage: RegionState;
  mapSize: 'small' | 'medium' | 'large';
}

export interface PlanetStats {
  o2Density: number;       // 1-5
  hydrologicalActivity: number; // 1-5
  thermalBalance: number;  // 1-5
}

export interface Planet {
  name: string;
  regions: Region[];
  stats: PlanetStats;
  researchPoints: number;
  runsCompleted: number;
  unlockedCardIds: string[];
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

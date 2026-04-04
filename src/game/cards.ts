import { Card } from './types';

// ============================================================
// Card Catalogue — Pioneer through Climax species
// Moisture scale: 0=bone dry, 1=arid, 2=dry, 3=moderate, 4=moist, 5=submerged
// Light scale: 1=shade, 2=partial, 3=full sun
// Nutrients scale: 1=poor, 2=low, 3=moderate, 4=rich, 5=mineral-rich
//
// Rock hexes have LOW nutrients (1-2) by default.
// Volcanic/mineral-upwelling conditions can override to 4-5.
//
// Trophic cost scaling:
//   Pioneer  — 1-2 biomass
//   Grassland — 3-5 biomass
//   Woodland  — 6-8 biomass
//   Climax    — 8-12 biomass
//
// Unlocked at game start: crust-lichen, spore-moss, pioneer-fern,
//   blue-green-algae, mycorrhizal-fungi, soil-bacteria
// Everything else is locked: locked: true
// ============================================================

// ---- SPECIES CARDS ----

export const ALL_CARDS: Card[] = [

  // ===== PIONEER PRODUCERS =====

  {
    id: 'soil-bacteria',
    name: 'Soil Bacteria',
    type: 'species',
    description: 'The invisible foundation beneath every living thing.',
    cost: { biomass: 1, nutrients: 0, water: 0 },
    incomePerTurn: { biomass: 0, nutrients: 1, water: 0 },
    trophicLevel: 'producer',
    successionStage: 'pioneer',
    tags: ['pioneer', 'decomposer'],
    placement: { minMoisture: 0, maxMoisture: 3, minLight: 1, maxLight: 3 },
    sprite: 'bacteria',
    flavorText: 'Life at its most elemental.',
    locked: false,
  },

  {
    id: 'crust-lichen',
    name: 'Crust Lichen',
    type: 'species',
    description: 'The first foothold of life on bare stone.',
    cost: { biomass: 1, nutrients: 0, water: 0 },
    incomePerTurn: { biomass: 1, nutrients: 0, water: 0 },
    trophicLevel: 'producer',
    successionStage: 'pioneer',
    tags: ['pioneer'],
    placement: { minMoisture: 0, maxMoisture: 3, minLight: 2, maxLight: 3 },
    adjacencyEffect: { moisture: 1 },
    propagates: true,
    maxPropagation: 1,
    sprite: 'lichen',
    flavorText: 'The first foothold of life on bare stone.',
    locked: false,
  },

  {
    id: 'spore-moss',
    name: 'Spore Moss',
    type: 'species',
    description: 'Tiny spores colonize every damp crevice.',
    cost: { biomass: 1, nutrients: 0, water: 1 },
    incomePerTurn: { biomass: 1, nutrients: 0, water: 0 },
    trophicLevel: 'producer',
    successionStage: 'pioneer',
    tags: ['pioneer'],
    placement: { minMoisture: 2, maxMoisture: 4, minLight: 1, maxLight: 3 },
    adjacencyEffect: { nutrients: 1 },
    propagates: true,
    maxPropagation: 2,
    sprite: 'moss',
    flavorText: 'Tiny spores colonize every damp crevice.',
    locked: false,
  },

  {
    id: 'pioneer-fern',
    name: 'Pioneer Fern',
    type: 'species',
    description: 'Unfurling fronds reach for the light.',
    cost: { biomass: 2, nutrients: 1, water: 1 },
    incomePerTurn: { biomass: 2, nutrients: 0, water: 0 },
    trophicLevel: 'producer',
    successionStage: 'pioneer',
    tags: ['pioneer'],
    placement: { minMoisture: 2, maxMoisture: 4, minLight: 2, maxLight: 3, minNutrients: 1 },
    chainDraw: 'soil-crust-event',
    sprite: 'fern',
    flavorText: 'Unfurling fronds reach for the light.',
    locked: false,
  },

  {
    id: 'blue-green-algae',
    name: 'Blue-Green Algae',
    type: 'species',
    description: 'Ancient photosynthesizers painting the water green.',
    cost: { biomass: 1, nutrients: 0, water: 0 },
    incomePerTurn: { biomass: 1, nutrients: 1, water: 0 },
    trophicLevel: 'producer',
    successionStage: 'pioneer',
    tags: ['pioneer', 'aquatic', 'n-fixer'],
    placement: { hexType: ['water'], minMoisture: 5, maxMoisture: 5 },
    propagates: true,
    maxPropagation: 3,
    sprite: 'algae',
    flavorText: 'Ancient photosynthesizers painting the water green.',
    locked: false,
  },

  {
    id: 'radiotroph',
    name: 'Radiotroph',
    type: 'species',
    description: 'Thriving where others see only harsh light.',
    cost: { biomass: 1, nutrients: 0, water: 0 },
    incomePerTurn: { biomass: 0, nutrients: 0, water: 1 },
    trophicLevel: 'producer',
    successionStage: 'pioneer',
    tags: ['pioneer'],
    placement: { minMoisture: 0, maxMoisture: 2, minLight: 3, maxLight: 3 },
    sprite: 'radiotroph',
    flavorText: 'Thriving where others see only harsh light.',
    locked: true,
  },

  {
    id: 'mineral-crust',
    name: 'Mineral Crust',
    type: 'species',
    description: 'Patient chemistry, turning rock into earth.',
    cost: { biomass: 1, nutrients: 0, water: 0 },
    incomePerTurn: { biomass: 0, nutrients: 1, water: 0 },
    trophicLevel: 'producer',
    successionStage: 'pioneer',
    tags: ['pioneer'],
    // rock hexes have low nutrients (1-2) by default
    placement: { hexType: ['rock'] },
    sprite: 'mineral-crust',
    flavorText: 'Patient chemistry, turning rock into earth.',
    locked: true,
  },

  // ===== PIONEER DECOMPOSERS =====

  {
    id: 'mycorrhizal-fungi',
    name: 'Arbuscular Mycorrhizae',
    type: 'species',
    description: 'The wood-wide web connects all.',
    cost: { biomass: 2, nutrients: 1, water: 0 },
    incomePerTurn: { biomass: 0, nutrients: 1, water: 0 },
    trophicLevel: 'decomposer',
    successionStage: 'pioneer',
    tags: ['fungal', 'decomposer'],
    placement: { minMoisture: 1, maxMoisture: 4, minNutrients: 1, maxNutrients: 5, minLight: 1, maxLight: 3 },
    adjacencyEffect: { biomassPerTurn: 1 },
    sprite: 'fungi',
    flavorText: 'The wood-wide web connects all.',
    locked: false,
  },

  // ===== PIONEER — N-FIXER =====

  {
    id: 'n-fixing-shrub',
    name: 'N-Fixing Shrub',
    type: 'species',
    description: 'Bacterial partners enrich the soil.',
    cost: { biomass: 2, nutrients: 0, water: 1 },
    incomePerTurn: { biomass: 1, nutrients: 2, water: 0 },
    trophicLevel: 'producer',
    successionStage: 'pioneer',
    tags: ['n-fixer', 'pioneer'],
    placement: { minMoisture: 2, maxMoisture: 4, minLight: 2, maxLight: 3, minNutrients: 1 },
    adjacencyEffect: { nutrients: 1 },
    sprite: 'shrub',
    flavorText: 'Bacterial partners enrich the soil.',
    locked: true,
  },

  // ===== GRASSLAND PRODUCERS =====

  {
    id: 'tussock-grass',
    name: 'Tussock Grass',
    type: 'species',
    description: 'Dense tussocks carpet the plains.',
    cost: { biomass: 3, nutrients: 2, water: 1 },
    incomePerTurn: { biomass: 2, nutrients: 0, water: 0 },
    trophicLevel: 'producer',
    successionStage: 'grassland',
    tags: ['pioneer'],
    placement: { minMoisture: 2, maxMoisture: 4, minLight: 2, maxLight: 3, minNutrients: 2 },
    adjacencyEffect: { moisture: 1 },
    propagates: true,
    maxPropagation: 2,
    sprite: 'grass',
    flavorText: 'Dense tussocks carpet the plains.',
    locked: true,
  },

  {
    id: 'wildflower-meadow',
    name: 'Wildflower Meadow',
    type: 'species',
    description: 'A riot of color attracts pollinators from afar.',
    cost: { biomass: 4, nutrients: 2, water: 2 },
    incomePerTurn: { biomass: 3, nutrients: 0, water: 0 },
    trophicLevel: 'producer',
    successionStage: 'grassland',
    tags: ['angiosperm'],
    placement: { minMoisture: 3, maxMoisture: 4, minLight: 2, maxLight: 3, minNutrients: 2 },
    sprite: 'flower',
    flavorText: 'A riot of color attracts pollinators from afar.',
    locked: true,
  },

  // ===== GRASSLAND CONSUMERS =====

  {
    id: 'pollinator-bee',
    name: 'Pollinator Bee',
    type: 'species',
    description: 'Essential connectors of the flowering world.',
    cost: { biomass: 3, nutrients: 0, water: 1 },
    incomePerTurn: { biomass: 1, nutrients: 0, water: 0 },
    trophicLevel: 'consumer',
    successionStage: 'grassland',
    tags: ['pollinator'],
    placement: { minMoisture: 1, maxMoisture: 4, minLight: 2, maxLight: 3, adjacentTag: 'angiosperm' },
    adjacencyEffect: { biomassPerTurn: 1 },
    sprite: 'bee',
    flavorText: 'Essential connectors of the flowering world.',
    locked: true,
  },

  {
    id: 'grazer',
    name: 'Prairie Grazer',
    type: 'species',
    description: 'Great herds shape the landscape.',
    cost: { biomass: 5, nutrients: 1, water: 2 },
    incomePerTurn: { biomass: 2, nutrients: 0, water: 0 },
    trophicLevel: 'consumer',
    successionStage: 'grassland',
    tags: ['herbivore', 'prey'],
    placement: { minMoisture: 2, maxMoisture: 4, minLight: 2, maxLight: 3, minNutrients: 2 },
    propagates: true,
    maxPropagation: 1,
    sprite: 'grazer',
    flavorText: 'Great herds shape the landscape.',
    locked: true,
  },

  {
    id: 'decomposer-guild',
    name: 'Decomposer Guild',
    type: 'species',
    description: 'Recycling nutrients back into the web of life.',
    cost: { biomass: 3, nutrients: 0, water: 1 },
    incomePerTurn: { biomass: 0, nutrients: 2, water: 0 },
    trophicLevel: 'decomposer',
    successionStage: 'grassland',
    tags: ['decomposer', 'fungal'],
    placement: { minMoisture: 2, maxMoisture: 4, minNutrients: 1, minLight: 1, maxLight: 3 },
    adjacencyEffect: { nutrientsPerTurn: 1 },
    sprite: 'decomposer',
    flavorText: 'Recycling nutrients back into the web of life.',
    locked: true,
  },

  // ===== WOODLAND =====

  {
    id: 'canopy-oak',
    name: 'Canopy Oak',
    type: 'species',
    description: 'A cathedral of branches shelters the understory.',
    cost: { biomass: 6, nutrients: 3, water: 3 },
    incomePerTurn: { biomass: 4, nutrients: 0, water: 1 },
    trophicLevel: 'producer',
    successionStage: 'woodland',
    tags: ['canopy'],
    placement: { minMoisture: 3, maxMoisture: 4, minLight: 3, maxLight: 3, minNutrients: 3 },
    adjacencyEffect: { light: -1 },
    chainDraw: 'shade-fern',
    sprite: 'oak',
    flavorText: 'A cathedral of branches shelters the understory.',
    locked: true,
  },

  {
    id: 'shade-fern',
    name: 'Shade Fern',
    type: 'species',
    description: 'Delicate fronds unfurl in dappled light.',
    cost: { biomass: 6, nutrients: 1, water: 1 },
    incomePerTurn: { biomass: 2, nutrients: 0, water: 0 },
    trophicLevel: 'producer',
    successionStage: 'woodland',
    tags: ['shade-tolerant'],
    placement: { minMoisture: 2, maxMoisture: 4, maxLight: 2, minLight: 1, minNutrients: 2 },
    sprite: 'shade-fern',
    flavorText: 'Delicate fronds unfurl in dappled light.',
    locked: true,
  },

  {
    id: 'woodland-predator',
    name: 'Forest Predator',
    type: 'species',
    description: 'The forest holds its breath.',
    cost: { biomass: 7, nutrients: 2, water: 2 },
    incomePerTurn: { biomass: 3, nutrients: 0, water: 0 },
    trophicLevel: 'consumer',
    successionStage: 'woodland',
    tags: ['predator'],
    placement: { minMoisture: 1, maxMoisture: 4, minLight: 1, maxLight: 3, adjacentTag: 'prey' },
    adjacencyEffect: { biomassPerTurn: 2 },
    sprite: 'predator',
    flavorText: 'The forest holds its breath.',
    locked: true,
  },

  // ===== CLIMAX =====

  {
    id: 'old-growth-tree',
    name: 'Old-Growth Giant',
    type: 'species',
    description: 'Centuries of growth in a single trunk.',
    cost: { biomass: 10, nutrients: 4, water: 4 },
    incomePerTurn: { biomass: 6, nutrients: 1, water: 1 },
    trophicLevel: 'producer',
    successionStage: 'climax',
    tags: ['canopy'],
    placement: { minMoisture: 3, maxMoisture: 4, minLight: 3, maxLight: 3, minNutrients: 4 },
    adjacencyEffect: { light: -1, moisture: 1 },
    sprite: 'giant-tree',
    flavorText: 'Centuries of growth in a single trunk.',
    locked: true,
  },

  {
    id: 'apex-raptor',
    name: 'Apex Raptor',
    type: 'species',
    description: 'Soaring above the canopy, master of all it surveys.',
    cost: { biomass: 9, nutrients: 2, water: 2 },
    incomePerTurn: { biomass: 4, nutrients: 0, water: 0 },
    trophicLevel: 'consumer',
    successionStage: 'climax',
    tags: ['predator'],
    placement: { minMoisture: 1, maxMoisture: 4, minLight: 2, maxLight: 3, adjacentTag: 'prey' },
    adjacencyEffect: { biomassPerTurn: 3 },
    sprite: 'raptor',
    flavorText: 'Soaring above the canopy, master of all it surveys.',
    locked: true,
  },

];

// ---- ABIOTIC CARDS ----
// Not in ALL_CARDS. Purchased with research points and played from a
// separate tray. consumable: true — used once and discarded.

export const ABIOTIC_CARDS: Card[] = [
  {
    id: 'drainage-redirect',
    name: 'Drainage Redirect',
    type: 'abiotic',
    description: 'Redirecting the flow of water across the landscape.',
    cost: { biomass: 0, nutrients: 0, water: 0 },
    incomePerTurn: { biomass: 0, nutrients: 0, water: 0 },
    tags: [],
    placement: { hexType: ['normal'] },
    sprite: 'water-channel',
    flavorText: 'Redirecting the flow of water across the landscape.',
    consumable: true,
    rpCost: 300,
    locked: true,
  },

  {
    id: 'mineral-amendment',
    name: 'Mineral Amendment',
    type: 'abiotic',
    description: 'Enriching the soil with essential minerals.',
    cost: { biomass: 0, nutrients: 0, water: 0 },
    incomePerTurn: { biomass: 0, nutrients: 0, water: 0 },
    tags: [],
    placement: { hexType: ['normal'] },
    sprite: 'minerals',
    flavorText: 'Enriching the soil with essential minerals.',
    consumable: true,
    rpCost: 200,
    locked: true,
  },

  {
    id: 'slope-grading',
    name: 'Slope Grading',
    type: 'abiotic',
    description: 'Reshaping the terrain by hand.',
    cost: { biomass: 0, nutrients: 0, water: 0 },
    incomePerTurn: { biomass: 0, nutrients: 0, water: 0 },
    tags: [],
    placement: { hexType: ['rock'] },
    sprite: 'pickaxe',
    flavorText: 'Reshaping the terrain by hand.',
    consumable: true,
    rpCost: 400,
    locked: true,
  },
];

// ---- EVENT CARDS ----
// Not in ALL_CARDS. Auto-added to hand by local conditions and chain-draw
// effects. Players do not draft these.

export const EVENT_CARDS: Card[] = [
  {
    id: 'good-rain-year',
    name: 'Good Rain Year',
    type: 'event',
    description: '+1 moisture to all hexes. Draw 1 extra card.',
    cost: { biomass: 0, nutrients: 0, water: 0 },
    incomePerTurn: { biomass: 0, nutrients: 0, water: 0 },
    tags: [],
    placement: {},
    sprite: 'rain',
    flavorText: 'The skies open generously.',
  },

  {
    id: 'mast-seed-event',
    name: 'Mast Seed Event',
    type: 'event',
    description: 'Draw 2 extra cards this turn.',
    cost: { biomass: 0, nutrients: 0, water: 0 },
    incomePerTurn: { biomass: 0, nutrients: 0, water: 0 },
    tags: [],
    placement: {},
    sprite: 'seed',
    flavorText: 'An extraordinary year of seed production.',
  },

  {
    id: 'warm-winter',
    name: 'Warm Winter',
    type: 'event',
    description: 'All species cost 1 less biomass this turn.',
    cost: { biomass: 0, nutrients: 0, water: 0 },
    incomePerTurn: { biomass: 0, nutrients: 0, water: 0 },
    tags: [],
    placement: {},
    sprite: 'sun',
    flavorText: 'A mild winter lets life flourish.',
  },

  {
    id: 'soil-crust-event',
    name: 'Soil Crust Formation',
    type: 'event',
    description: '+1 nutrients to all hexes.',
    cost: { biomass: 0, nutrients: 0, water: 0 },
    incomePerTurn: { biomass: 0, nutrients: 0, water: 0 },
    tags: [],
    placement: {},
    sprite: 'soil',
    flavorText: 'Biological soil crusts stabilize the ground.',
  },
];

// ---- Lookup helpers ----

/** Search species cards only (ALL_CARDS). */
export function getCardById(id: string): Card | undefined {
  return ALL_CARDS.find(c => c.id === id);
}

/** Search all card pools. */
export function getAnyCardById(id: string): Card | undefined {
  return (
    ALL_CARDS.find(c => c.id === id) ??
    ABIOTIC_CARDS.find(c => c.id === id) ??
    EVENT_CARDS.find(c => c.id === id)
  );
}

/**
 * Returns the 12-card starter deck.
 * Only the 6 unlocked pioneer cards are used; each appears twice.
 * Unlocked pioneers: soil-bacteria, crust-lichen, spore-moss,
 *   pioneer-fern, blue-green-algae, mycorrhizal-fungi.
 */
export function getStarterDeck(): Card[] {
  const starterIds = [
    'soil-bacteria',       'soil-bacteria',
    'crust-lichen',        'crust-lichen',
    'spore-moss',          'spore-moss',
    'pioneer-fern',        'pioneer-fern',
    'blue-green-algae',    'blue-green-algae',
    'mycorrhizal-fungi',   'mycorrhizal-fungi',
  ];
  return starterIds.map(id => {
    const card = getAnyCardById(id);
    if (!card) throw new Error(`Starter card not found: ${id}`);
    return { ...card };
  });
}

import { Planet, Region, HexCoord, ClimateBand, RegionState } from './types';

// ============================================================
// Planet Map Generation
// ============================================================

const REGION_NAMES: string[] = [
  'Frostpeak Tundra', 'Glacial Basin', 'Polar Shelf', 'Icebound Plateau', 'Frozen Expanse',
  'Northern Steppe', 'Windswept Moor', 'Silver Lake Basin', 'Misty Highlands', 'Amber Prairie',
  'Temperate Valley', 'Rolling Hills', 'Verdant Lowlands', 'Coastal Bluffs', 'Autumn Ridge',
  'Emerald Canopy', 'River Delta', 'Thermal Springs', 'Equatorial Basin', 'Monsoon Coast',
  'Volcanic Rim', 'Coral Atoll', 'Jungle Plateau', 'Sunlit Savanna', 'Deep Jungle',
  'Southern Grasslands', 'Storm Coast', 'Kelp Forest Bay', 'Dune Sea', 'Oasis Valley',
  'Crystal Caverns', 'Obsidian Peaks', 'Mangrove Delta', 'Cloud Forest', 'Basalt Flats',
  'Sulfur Springs', 'Ancient Caldera', 'Tideland Marsh', 'Sandstone Arch', 'Geothermal Rift',
];

const QUEST_DESCRIPTIONS: string[] = [
  'Introduce a pollinator species',
  'Establish a predator guild',
  'Build a nitrogen-fixing network',
  'Create a canopy cover',
  'Establish aquatic life',
  'Build a decomposer chain',
  'Achieve high species diversity',
  'Maximize biomass production',
  'Create a full food web',
  'Establish mycorrhizal networks',
];

function getBandForRow(row: number, totalRows: number): ClimateBand {
  const third = totalRows / 3;
  if (row < third) return 'polar';
  if (row < third * 2) return 'temperate';
  return 'equatorial';
}

export function generatePlanet(name: string): Planet {
  const regions: Region[] = [];
  const cols = 8;
  const rows = 5;

  for (let r = 0; r < rows; r++) {
    for (let q = 0; q < cols; q++) {
      const idx = r * cols + q;
      if (idx >= 40) break;

      const band = getBandForRow(r, rows);
      const isStart = (r === 2 && q === 3); // center region starts unlocked

      const baseMoisture = band === 'equatorial' ? 3 : band === 'temperate' ? 2 : 1;
      const baseLight = band === 'polar' ? 1 : band === 'temperate' ? 2 : 3;
      const baseNutrients = 1 + Math.floor(Math.random() * 2);

      const targetStages: RegionState[] = ['barren', 'pioneer', 'grassland'];
      const mapSizes: Region['mapSize'][] = ['small', 'medium', 'large'];

      regions.push({
        id: `region-${idx}`,
        name: REGION_NAMES[idx] || `Region ${idx}`,
        coord: { q, r },
        state: isStart ? 'barren' : 'locked',
        climateBand: band,
        baseMoisture,
        baseLight,
        baseNutrients,
        seedBank: [],
        questDescription: QUEST_DESCRIPTIONS[idx % QUEST_DESCRIPTIONS.length],
        targetStage: targetStages[Math.floor(Math.random() * targetStages.length)],
        mapSize: mapSizes[Math.floor(Math.random() * mapSizes.length)],
      });
    }
  }

  // Unlock neighbors of the starting region
  const startRegion = regions.find(r => r.state === 'barren');
  if (startRegion) {
    const neighbors = getPlanetNeighbors(startRegion.coord, regions);
    neighbors.forEach(n => {
      if (n.state === 'locked') n.state = 'barren';
    });
  }

  return {
    name,
    regions,
    stats: { o2Density: 1, hydrologicalActivity: 1, thermalBalance: 1 },
    researchPoints: 0,
    runsCompleted: 0,
    unlockedCardIds: [
      'crust-lichen', 'spore-moss', 'pioneer-fern', 'blue-green-algae',
      'mycorrhizal-fungi', 'n-fixing-shrub', 'tussock-grass', 'wildflower-meadow',
      'pollinator-bee', 'grazer', 'decomposer-guild',
      'canopy-oak', 'shade-fern', 'woodland-predator',
      'old-growth-tree', 'apex-raptor',
      'drainage-redirect', 'mineral-amendment', 'slope-grading',
      'good-rain-year', 'mast-seed-event', 'warm-winter', 'soil-crust-event',
    ],
  };
}

export function getPlanetNeighbors(coord: HexCoord, regions: Region[]): Region[] {
  const { q, r } = coord;
  const neighborCoords: HexCoord[] = [
    { q: q - 1, r }, { q: q + 1, r },
    { q, r: r - 1 }, { q, r: r + 1 },
    { q: q - 1, r: r - 1 }, { q: q + 1, r: r + 1 },
  ];
  return regions.filter(reg =>
    neighborCoords.some(nc => nc.q === reg.coord.q && nc.r === reg.coord.r)
  );
}

export function advanceRegion(region: Region, score: number): void {
  const progression: RegionState[] = ['locked', 'barren', 'pioneer', 'grassland', 'woodland', 'climax'];
  const currentIdx = progression.indexOf(region.state);
  if (currentIdx < 0 || region.state === 'climax') return;

  // Higher scores advance further
  let advance = 1;
  if (score > 200) advance = 2;
  if (score > 400) advance = 3;

  const newIdx = Math.min(currentIdx + advance, progression.length - 1);
  region.state = progression[newIdx];
}

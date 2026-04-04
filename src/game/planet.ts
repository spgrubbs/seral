import { Planet, Region, HexCoord, ClimateBand, RegionState, LocalCondition, Quest, Achievement } from './types';

// ============================================================
// Planet Map Generation
// ============================================================

const REGION_NAMES: string[] = [
  // Row 0 — Polar (north)
  'Frostpeak Tundra', 'Glacial Basin', 'Polar Shelf', 'Icebound Plateau', 'Frozen Expanse', 'Crystal Waste', 'Aurora Flats', 'Permafrost Ridge',
  // Row 1 — Temperate (north)
  'Northern Steppe', 'Windswept Moor', 'Silver Lake Basin', 'Misty Highlands', 'Amber Prairie', 'Temperate Valley', 'Rolling Hills', 'Coastal Bluffs',
  // Row 2 — Equatorial (upper)
  'Emerald Canopy', 'River Delta', 'Thermal Springs', 'Equatorial Basin', 'Monsoon Coast', 'Volcanic Rim', 'Coral Atoll', 'Jungle Plateau',
  // Row 3 — Equatorial (lower)
  'Sunlit Savanna', 'Deep Jungle', 'Mangrove Delta', 'Cloud Forest', 'Geothermal Rift', 'Lava Flats', 'Oasis Valley', 'Storm Coast',
  // Row 4 — Temperate (south)
  'Southern Grasslands', 'Kelp Forest Bay', 'Dune Sea', 'Basalt Flats', 'Sulfur Springs', 'Ancient Caldera', 'Tideland Marsh', 'Sandstone Arch',
  // Row 5 — Polar (south)
  'Antarctic Shelf', 'Frozen Crater', 'Ice Canyon', 'Obsidian Peaks', 'South Waste', 'Glacial Rift', 'Polar Abyss', 'Snowfield Basin',
];

const BAND_LAYOUT: ClimateBand[] = ['polar', 'temperate', 'equatorial', 'equatorial', 'temperate', 'polar'];

const QUESTS: Quest[] = [
  { description: 'Place at least 8 organisms', targetType: 'population', targetValue: 8 },
  { description: 'Have 5+ distinct species on the field', targetType: 'diversity', targetValue: 5 },
  { description: 'Reach +6 biomass income per turn', targetType: 'biomass_income', targetValue: 6 },
  { description: 'Reach +4 nutrient income per turn', targetType: 'nutrient_income', targetValue: 4 },
  { description: 'Place 6 producer species', targetType: 'place_producers', targetValue: 6 },
  { description: 'Place 3 consumer or decomposer species', targetType: 'place_consumers', targetValue: 3 },
  { description: 'Place at least 12 organisms', targetType: 'population', targetValue: 12 },
  { description: 'Have 7+ distinct species on the field', targetType: 'diversity', targetValue: 7 },
  { description: 'Reach +10 biomass income per turn', targetType: 'biomass_income', targetValue: 10 },
  { description: 'Place 10 producer species', targetType: 'place_producers', targetValue: 10 },
];

const LOCAL_CONDITIONS: LocalCondition[] = [
  'normal', 'normal', 'normal', 'monsoon', 'drought',
  'volcanic-soil', 'mineral-upwelling', 'windswept', 'geothermal',
];

export const LOCAL_CONDITION_DESCRIPTIONS: Record<LocalCondition, string> = {
  normal: 'Standard conditions.',
  monsoon: 'Heavy rains. +1 water income per turn.',
  drought: 'Parched land. All hexes start with -1 moisture.',
  'volcanic-soil': 'Rich volcanic deposits. All hexes start with +2 nutrients.',
  'mineral-upwelling': 'Mineral-rich geology. More rock hexes with high nutrients.',
  windswept: 'Exposed terrain. Full sun everywhere but -1 moisture.',
  geothermal: 'Geothermal vents. Frozen hexes become normal. Border hexes +1 biomass.',
};

function makeDefaultAchievements(): Achievement[] {
  return [
    { id: 'first_run', name: 'First Steps', description: 'Complete your first run.', reward: 100, completed: false, check: 'runs_1' },
    { id: 'pioneer_3', name: 'Seeding Life', description: 'Advance 3 regions to Pioneer.', reward: 200, completed: false, check: 'regions_pioneer_3' },
    { id: 'pioneer_8', name: 'Spreading Green', description: 'Advance 8 regions to Pioneer.', reward: 400, completed: false, check: 'regions_pioneer_8' },
    { id: 'grassland_3', name: 'Grassland Frontier', description: 'Advance 3 regions to Grassland.', reward: 500, completed: false, check: 'regions_grassland_3' },
    { id: 'grassland_8', name: 'Prairie Dominion', description: 'Advance 8 regions to Grassland.', reward: 800, completed: false, check: 'regions_grassland_8' },
    { id: 'woodland_3', name: 'Forest Dawn', description: 'Advance 3 regions to Woodland.', reward: 1000, completed: false, check: 'regions_woodland_3' },
    { id: 'climax_1', name: 'Climax Community', description: 'Advance 1 region to Climax.', reward: 1500, completed: false, check: 'regions_climax_1' },
    { id: 'climax_5', name: 'Flourishing World', description: 'Advance 5 regions to Climax.', reward: 3000, completed: false, check: 'regions_climax_5' },
    { id: 'diversity_10', name: 'Biodiversity', description: 'Have 10+ species in a single run.', reward: 600, completed: false, check: 'diversity_10' },
    { id: 'score_200', name: 'Productive Ecosystem', description: 'Score 200+ in a single run.', reward: 300, completed: false, check: 'score_200' },
    { id: 'score_500', name: 'Thriving Planet', description: 'Score 500+ in a single run.', reward: 800, completed: false, check: 'score_500' },
    { id: 'runs_10', name: 'Persistent Ecologist', description: 'Complete 10 runs.', reward: 400, completed: false, check: 'runs_10' },
  ];
}

export function checkAchievements(planet: Planet, lastRunScore?: number, lastRunDiversity?: number): Achievement[] {
  const newlyCompleted: Achievement[] = [];
  for (const ach of planet.achievements) {
    if (ach.completed) continue;
    const [type, valueStr] = ach.check.split('_').length === 2
      ? [ach.check.split('_')[0], ach.check.split('_')[1]]
      : [ach.check.split('_').slice(0, -1).join('_'), ach.check.split('_').slice(-1)[0]];
    const value = parseInt(valueStr);

    let met = false;
    if (type === 'runs') met = planet.runsCompleted >= value;
    else if (type === 'regions_pioneer') met = planet.regions.filter(r => ['pioneer', 'grassland', 'woodland', 'climax'].includes(r.state)).length >= value;
    else if (type === 'regions_grassland') met = planet.regions.filter(r => ['grassland', 'woodland', 'climax'].includes(r.state)).length >= value;
    else if (type === 'regions_woodland') met = planet.regions.filter(r => ['woodland', 'climax'].includes(r.state)).length >= value;
    else if (type === 'regions_climax') met = planet.regions.filter(r => r.state === 'climax').length >= value;
    else if (type === 'score' && lastRunScore !== undefined) met = lastRunScore >= value;
    else if (type === 'diversity' && lastRunDiversity !== undefined) met = lastRunDiversity >= value;

    if (met) {
      ach.completed = true;
      planet.researchPoints += ach.reward;
      newlyCompleted.push(ach);
    }
  }
  return newlyCompleted;
}

export function generatePlanet(name: string): Planet {
  const regions: Region[] = [];
  const cols = 7;
  const rows = 6; // P / T / E / E / T / P

  for (let r = 0; r < rows; r++) {
    for (let q = 0; q < cols; q++) {
      const idx = r * cols + q;
      const band = BAND_LAYOUT[r];
      const isStart = (r === 2 && q === 3); // equatorial center

      const baseMoisture = band === 'equatorial' ? 3 : band === 'temperate' ? 2 : 1;
      const baseLight = band === 'polar' ? 1 : band === 'temperate' ? 2 : 3;
      const baseNutrients = 1 + Math.floor(Math.random() * 2);

      const localCondition = LOCAL_CONDITIONS[Math.floor(Math.random() * LOCAL_CONDITIONS.length)];
      const quest = QUESTS[Math.floor(Math.random() * QUESTS.length)];
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
        quest: { ...quest },
        localCondition,
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
      'mycorrhizal-fungi', 'soil-bacteria',
    ],
    upgrades: {
      freeTurnEnds: 0,
      startingBiomassBonus: 0,
      ecologicalDrift: 0,
      unlockedAbioticIds: [],
    },
    achievements: makeDefaultAchievements(),
  };
}

export function getPlanetNeighbors(coord: HexCoord, regions: Region[]): Region[] {
  const { q, r } = coord;
  // Flat-top offset (odd-row) neighbors
  const isOddRow = r % 2 !== 0;
  const neighborCoords: HexCoord[] = isOddRow
    ? [
        { q: q, r: r - 1 }, { q: q + 1, r: r - 1 },
        { q: q - 1, r }, { q: q + 1, r },
        { q: q, r: r + 1 }, { q: q + 1, r: r + 1 },
      ]
    : [
        { q: q - 1, r: r - 1 }, { q: q, r: r - 1 },
        { q: q - 1, r }, { q: q + 1, r },
        { q: q - 1, r: r + 1 }, { q: q, r: r + 1 },
      ];
  return regions.filter(reg =>
    neighborCoords.some(nc => nc.q === reg.coord.q && nc.r === reg.coord.r)
  );
}

export function advanceRegion(region: Region, score: number): void {
  const progression: RegionState[] = ['locked', 'barren', 'pioneer', 'grassland', 'woodland', 'climax'];
  const currentIdx = progression.indexOf(region.state);
  if (currentIdx < 0 || region.state === 'climax') return;

  let advance = 1;
  if (score > 200) advance = 2;
  if (score > 400) advance = 3;

  const newIdx = Math.min(currentIdx + advance, progression.length - 1);
  region.state = progression[newIdx];
}

/** Get the event cards appropriate for a region's local condition */
export function getEventCardsForCondition(condition: LocalCondition): string[] {
  switch (condition) {
    case 'monsoon': return ['good-rain-year', 'good-rain-year'];
    case 'drought': return ['warm-winter'];
    case 'volcanic-soil': return ['soil-crust-event', 'soil-crust-event'];
    case 'windswept': return ['warm-winter'];
    case 'geothermal': return ['warm-winter', 'soil-crust-event'];
    case 'mineral-upwelling': return ['soil-crust-event'];
    default: return ['good-rain-year'];
  }
}

export const CLIMATE_STAT_DESCRIPTIONS: Record<string, Record<number, string>> = {
  o2Density: {
    1: 'Trace atmosphere',
    2: 'Thin oxygen layer',
    3: 'Breathable air forming',
    4: 'Rich oxygen envelope',
    5: 'Dense, vibrant atmosphere',
  },
  hydrologicalActivity: {
    1: 'Frozen/dry surface',
    2: 'Sparse moisture pockets',
    3: 'Active water cycle',
    4: 'Abundant rain systems',
    5: 'Planet-wide water networks',
  },
  thermalBalance: {
    1: 'Extreme temperature swings',
    2: 'Harsh thermal variance',
    3: 'Stabilizing climate',
    4: 'Mild, regulated climate',
    5: 'Perfect thermal equilibrium',
  },
};

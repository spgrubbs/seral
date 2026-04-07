import { HexCoord, HexTile, hexKey, Card, PlacedCard, CardTag, LocalCondition, SerializedHexTile } from './types';

// ============================================================
// Hex Grid Generation & Utilities
// ============================================================

/** Get the 6 neighbors of a hex in offset coordinates (odd-q) */
export function hexNeighbors(coord: HexCoord): HexCoord[] {
  const { q, r } = coord;
  const isOdd = q % 2 !== 0;
  if (isOdd) {
    return [
      { q: q + 1, r: r },
      { q: q + 1, r: r + 1 },
      { q: q, r: r + 1 },
      { q: q - 1, r: r + 1 },
      { q: q - 1, r: r },
      { q: q, r: r - 1 },
    ];
  }
  return [
    { q: q + 1, r: r - 1 },
    { q: q + 1, r: r },
    { q: q, r: r + 1 },
    { q: q - 1, r: r },
    { q: q - 1, r: r - 1 },
    { q: q, r: r - 1 },
  ];
}

/** Convert hex coord to pixel position for rendering (pointy-top via offset) */
export function hexToPixel(coord: HexCoord, size: number): { x: number; y: number } {
  const w = size * 2;
  const h = Math.sqrt(3) * size;
  const x = coord.q * (w * 0.75);
  const y = coord.r * h + (coord.q % 2 !== 0 ? h / 2 : 0);
  return { x, y };
}

/** Generate a hex grid of given radius (creates a hexagon-shaped map).
 *  Terrain is generated using moisture blobs for splotchy, naturalistic landscapes.
 *  Base nutrient levels are 0-2 (modified by organisms/events later). */
export function generateHexGrid(
  radius: number,
  baseMoisture: number,
  baseLight: number,
  _baseNutrients: number,
  seed: number = Date.now(),
  localCondition: LocalCondition = 'normal',
): Map<string, HexTile> {
  const grid = new Map<string, HexTile>();
  const rng = seededRandom(seed);

  // Local condition modifiers
  const moistureMod = localCondition === 'drought' ? -1 : localCondition === 'windswept' ? -1 : 0;
  const nutrientMod = localCondition === 'volcanic-soil' ? 2 : 0;
  const forcedLight = localCondition === 'windswept' ? 3 : null;
  const moreRocks = localCondition === 'mineral-upwelling';

  // 1. Collect all valid hex coordinates (hexagonal shape)
  const allCoords: HexCoord[] = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      if (hexDistance({ q, r }, { q: 0, r: 0 }) <= radius) {
        allCoords.push({ q, r });
      }
    }
  }

  // 2. Generate moisture blobs for splotchy terrain
  const numWetBlobs = 2 + Math.floor(rng() * 2); // 2-3 wet zones
  const wetBlobs: { center: HexCoord; strength: number; reach: number }[] = [];
  for (let i = 0; i < numWetBlobs; i++) {
    const center = allCoords[Math.floor(rng() * allCoords.length)];
    wetBlobs.push({
      center,
      strength: 3 + Math.floor(rng() * 3), // moisture 3-5
      reach: Math.max(1, Math.floor(rng() * radius)),
    });
  }

  // Optional dry zone(s)
  const numDryBlobs = Math.floor(rng() * 2); // 0-1
  const dryBlobs: { center: HexCoord; reach: number }[] = [];
  for (let i = 0; i < numDryBlobs; i++) {
    const center = allCoords[Math.floor(rng() * allCoords.length)];
    dryBlobs.push({ center, reach: Math.max(1, Math.floor(rng() * radius)) });
  }

  // 3. Compute moisture for each tile using blob influence
  const moistureMap = new Map<string, number>();
  for (const coord of allCoords) {
    let moisture = Math.max(0, baseMoisture - 1 + moistureMod); // start low

    // Wet blob influence — higher moisture near centers
    for (const blob of wetBlobs) {
      const dist = hexDistance(coord, blob.center);
      if (dist <= blob.reach) {
        const factor = 1 - dist / (blob.reach + 1);
        const contribution = Math.round(blob.strength * factor);
        moisture = Math.max(moisture, contribution);
      }
    }

    // Dry blob influence — reduce moisture
    for (const blob of dryBlobs) {
      const dist = hexDistance(coord, blob.center);
      if (dist <= blob.reach) {
        const factor = 1 - dist / (blob.reach + 1);
        moisture -= Math.round(2 * factor);
      }
    }

    // Small random perturbation (±1)
    moisture += rng() > 0.65 ? 1 : rng() > 0.5 ? -1 : 0;
    moisture = clamp(moisture, 0, 5);
    moistureMap.set(hexKey(coord), moisture);
  }

  // 4. Place rock clusters (connected patches, not random singles)
  const rockTiles = new Set<string>();
  const numRockSeeds = moreRocks ? 2 + Math.floor(rng() * 2) : Math.floor(rng() * 2);
  for (let i = 0; i < numRockSeeds; i++) {
    const seedCoord = allCoords[Math.floor(rng() * allCoords.length)];
    rockTiles.add(hexKey(seedCoord));
    // Spread to 1-3 adjacent tiles for a cluster
    const spreadCount = 1 + Math.floor(rng() * 3);
    const neighbors = hexNeighbors(seedCoord).filter(n =>
      allCoords.some(c => c.q === n.q && c.r === n.r)
    );
    for (let j = 0; j < Math.min(spreadCount, neighbors.length); j++) {
      const pick = Math.floor(rng() * neighbors.length);
      rockTiles.add(hexKey(neighbors[pick]));
    }
  }

  // 5. Determine water tiles (only in high-moisture areas, tend to cluster)
  const waterTiles = new Set<string>();
  for (const coord of allCoords) {
    const key = hexKey(coord);
    if (rockTiles.has(key)) continue;
    const moisture = moistureMap.get(key) || 0;
    if (moisture >= 4 && rng() < 0.3) {
      waterTiles.add(key);
    }
  }

  // 6. Build the grid tiles
  for (const coord of allCoords) {
    const key = hexKey(coord);
    const blobMoisture = moistureMap.get(key) || 0;
    const light = forcedLight ?? clamp(baseLight + (rng() > 0.7 ? -1 : 0), 1, 3);
    let nutrients = clamp(Math.floor(rng() * 3) + nutrientMod, 0, 2); // base 0-2

    let type: HexTile['type'] = 'normal';
    let tileMoisture = blobMoisture;

    if (waterTiles.has(key)) {
      type = 'water';
      tileMoisture = 5;
    } else if (rockTiles.has(key)) {
      type = 'rock';
      nutrients = moreRocks ? clamp(4 + Math.floor(rng() * 2), 4, 5) : clamp(Math.floor(rng() * 2), 0, 1);
      tileMoisture = 0;
    }

    // Geothermal: frozen hexes become normal
    if (localCondition === 'geothermal' && (type as string) === 'frozen') {
      type = 'normal';
    }

    grid.set(key, {
      coord,
      moisture: tileMoisture,
      light,
      nutrients,
      type,
      placedCard: null,
    });
  }

  return grid;
}

/** Hex distance using offset coordinates */
export function hexDistance(a: HexCoord, b: HexCoord): number {
  // Convert offset to cube
  const ac = offsetToCube(a);
  const bc = offsetToCube(b);
  return Math.max(Math.abs(ac.x - bc.x), Math.abs(ac.y - bc.y), Math.abs(ac.z - bc.z));
}

function offsetToCube(h: HexCoord): { x: number; y: number; z: number } {
  const x = h.q;
  const z = h.r - (h.q - (h.q & 1)) / 2;
  const y = -x - z;
  return { x, y, z };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Check if a card can be placed on a hex tile */
export function canPlaceCard(card: Card, tile: HexTile, grid: Map<string, HexTile>): boolean {
  if (card.type === 'event') return true; // events don't need hex placement

  // Can't place on occupied hex unless overlay is allowed
  if (tile.placedCard && !card.placement.requiresOverlay) return false;

  const req = card.placement;

  // Special hex types: water and rock require explicit hexType permission
  if (tile.type === 'water' && (!req.hexType || !req.hexType.includes('water'))) return false;
  if (tile.type === 'rock') {
    // Only abiotic cards targeting rock, or species explicitly allowing rock
    if (card.type === 'abiotic') {
      if (req.hexType && !req.hexType.includes('rock')) return false;
    } else {
      if (!req.hexType?.includes('rock')) return false;
    }
  }

  // If card requires specific hex types, check them
  if (req.hexType && req.hexType.length > 0 && !req.hexType.includes(tile.type)) return false;

  // Condition range checks (use !== undefined so 0 values are valid)
  if (req.minMoisture !== undefined && tile.moisture < req.minMoisture) return false;
  if (req.maxMoisture !== undefined && tile.moisture > req.maxMoisture) return false;
  if (req.minLight !== undefined && tile.light < req.minLight) return false;
  if (req.maxLight !== undefined && tile.light > req.maxLight) return false;
  if (req.minNutrients !== undefined && tile.nutrients < req.minNutrients) return false;
  if (req.maxNutrients !== undefined && tile.nutrients > req.maxNutrients) return false;

  if (req.adjacentTag) {
    const neighbors = hexNeighbors(tile.coord);
    const hasTag = neighbors.some(n => {
      const neighbor = grid.get(hexKey(n));
      return neighbor?.placedCard?.card.tags.includes(req.adjacentTag as CardTag);
    });
    if (!hasTag) return false;
  }

  return true;
}

/** Get valid placement hexes for a card */
export function getValidPlacements(card: Card, grid: Map<string, HexTile>): HexCoord[] {
  if (card.type === 'event') return [];
  const valid: HexCoord[] = [];
  grid.forEach((tile) => {
    if (canPlaceCard(card, tile, grid)) {
      valid.push(tile.coord);
    }
  });
  return valid;
}

/** Apply abiotic card effects to the grid */
export function applyAbioticEffect(card: Card, targetCoord: HexCoord, grid: Map<string, HexTile>): void {
  const tile = grid.get(hexKey(targetCoord));
  if (!tile) return;

  if (card.id === 'drainage-redirect') {
    tile.moisture = clamp(tile.moisture + 2, 0, 5);
    hexNeighbors(targetCoord).forEach(n => {
      const neighbor = grid.get(hexKey(n));
      if (neighbor) neighbor.moisture = clamp(neighbor.moisture + 1, 0, 5);
    });
  } else if (card.id === 'mineral-amendment') {
    tile.nutrients = clamp(tile.nutrients + 3, 1, 5);
  } else if (card.id === 'slope-grading') {
    tile.type = 'normal';
    tile.moisture = 2;
  }
}

/** Apply event card effects */
export function applyEventEffect(card: Card, grid: Map<string, HexTile>): void {
  if (card.id === 'good-rain-year') {
    grid.forEach(tile => {
      tile.moisture = clamp(tile.moisture + 1, 0, 5);
    });
  } else if (card.id === 'soil-crust-event') {
    grid.forEach(tile => {
      tile.nutrients = clamp(tile.nutrients + 1, 1, 5);
    });
  }
}

/** Process propagation for all placed cards */
export function processPropagation(grid: Map<string, HexTile>): PlacedCard[] {
  const newPlacements: { coord: HexCoord; card: PlacedCard }[] = [];

  grid.forEach((tile) => {
    if (!tile.placedCard) return;
    const pc = tile.placedCard;
    if (!pc.card.propagates || !pc.card.maxPropagation) return;

    const neighbors = hexNeighbors(tile.coord);
    let propagated = 0;
    for (const n of neighbors) {
      if (propagated >= (pc.card.maxPropagation || 0)) break;
      const neighbor = grid.get(hexKey(n));
      if (!neighbor || neighbor.placedCard) continue;
      if (canPlaceCard(pc.card, neighbor, grid)) {
        newPlacements.push({
          coord: n,
          card: { card: { ...pc.card }, turnsActive: 0, biomassGenerated: 0 },
        });
        propagated++;
      }
    }
  });

  // Apply propagation
  for (const { coord, card } of newPlacements) {
    const tile = grid.get(hexKey(coord));
    if (tile && !tile.placedCard) {
      tile.placedCard = card;
    }
  }

  return newPlacements.map(p => p.card);
}

/** Serialize a hex grid for persistent storage (strips placed cards) */
export function serializeGrid(grid: Map<string, HexTile>): SerializedHexTile[] {
  const tiles: SerializedHexTile[] = [];
  grid.forEach(tile => {
    tiles.push({
      q: tile.coord.q,
      r: tile.coord.r,
      moisture: tile.moisture,
      light: tile.light,
      nutrients: tile.nutrients,
      type: tile.type,
    });
  });
  return tiles;
}

/** Reconstruct a hex grid from serialized data */
export function deserializeGrid(data: SerializedHexTile[]): Map<string, HexTile> {
  const grid = new Map<string, HexTile>();
  for (const t of data) {
    const tile: HexTile = {
      coord: { q: t.q, r: t.r },
      moisture: t.moisture,
      light: t.light,
      nutrients: t.nutrients,
      type: t.type,
      placedCard: null,
    };
    grid.set(hexKey(tile.coord), tile);
  }
  return grid;
}

/** Calculate adjacency income bonuses for all cards */
export function calculateAdjacencyBonuses(grid: Map<string, HexTile>): { biomass: number; nutrients: number } {
  let bonusBiomass = 0;
  let bonusNutrients = 0;

  grid.forEach((tile) => {
    if (!tile.placedCard) return;
    const neighbors = hexNeighbors(tile.coord);
    for (const n of neighbors) {
      const neighbor = grid.get(hexKey(n));
      if (!neighbor?.placedCard) continue;
      const adj = neighbor.placedCard.card.adjacencyEffect;
      if (adj) {
        if (adj.biomassPerTurn) bonusBiomass += adj.biomassPerTurn;
        if (adj.nutrientsPerTurn) bonusNutrients += adj.nutrientsPerTurn;
      }
    }
  });

  return { biomass: bonusBiomass, nutrients: bonusNutrients };
}

import { HexCoord, HexTile, hexKey, Card, PlacedCard, CardTag } from './types';

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

/** Generate a hex grid of given radius (creates a roughly circular map) */
export function generateHexGrid(
  radius: number,
  baseMoisture: number,
  baseLight: number,
  baseNutrients: number,
  seed: number = Date.now(),
): Map<string, HexTile> {
  const grid = new Map<string, HexTile>();
  const rng = seededRandom(seed);

  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      // Skip hexes too far from center to make roughly circular shape
      const dist = hexDistance({ q, r }, { q: 0, r: 0 });
      if (dist > radius) continue;

      const moisture = clamp(baseMoisture + Math.floor(rng() * 3) - 1, 0, 5);
      const light = clamp(baseLight + (rng() > 0.7 ? -1 : 0), 1, 3);
      const nutrients = clamp(baseNutrients + Math.floor(rng() * 3) - 1, 1, 5);

      // Determine special hex types
      let type: HexTile['type'] = 'normal';
      if (rng() < 0.1) type = 'water';
      else if (rng() < 0.12) type = 'rock';

      const tile: HexTile = {
        coord: { q, r },
        moisture: type === 'water' ? 5 : moisture,
        light: type === 'rock' ? 3 : light,
        nutrients: type === 'rock' ? 4 : nutrients,
        type,
        placedCard: null,
      };

      grid.set(hexKey({ q, r }), tile);
    }
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

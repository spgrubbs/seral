import {
  GameState, RunState, RunScore, Resources, Card, HexTile,
  hexKey, Region, PlanetUpgrades, PlanetStats, Quest,
} from './types';
import { generateHexGrid, applyAbioticEffect, applyEventEffect, processPropagation, calculateAdjacencyBonuses, getValidPlacements, canPlaceCard, hexDistance, serializeGrid, deserializeGrid } from './hex';
import { getStarterDeck, getAnyCardById, EVENT_CARDS } from './cards';
import { getEventCardsForCondition } from './planet';

// ============================================================
// Game State Logic
// ============================================================

export function createInitialGameState(): GameState {
  return {
    screen: 'title',
    planet: null,
    currentRun: null,
    selectedRegionId: null,
    assembledDeck: [],
  };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function startRun(region: Region, deck: Card[], upgrades?: PlanetUpgrades, planetStats?: PlanetStats): RunState {
  const sizeMap: Record<string, number> = { small: 2, medium: 3, large: 4 };
  const radius = sizeMap[region.mapSize] || 3;

  // Use persistent grid if available, otherwise generate new
  let grid: Map<string, HexTile>;
  if (region.savedGrid && region.savedGrid.length > 0) {
    grid = deserializeGrid(region.savedGrid);
  } else {
    const moistureBonus = planetStats ? Math.max(0, planetStats.hydrologicalActivity - 1) : 0;
    grid = generateHexGrid(
      radius,
      region.baseMoisture + moistureBonus,
      region.baseLight,
      region.baseNutrients,
      Date.now(),
      region.localCondition,
    );
  }

  // Place established species: 3 copies of each, starting with early-successional
  const successionOrder: string[] = ['pioneer', 'early-seral', 'mid-seral', 'climax'];
  const sortedSeedBank = [...region.seedBank].sort((a, b) => {
    const ai = successionOrder.indexOf(a.successionStage || 'pioneer');
    const bi = successionOrder.indexOf(b.successionStage || 'pioneer');
    return ai - bi;
  });
  // Deduplicate — place each unique species up to 3 times
  const seenSpecies = new Set<string>();
  for (const card of sortedSeedBank) {
    if (seenSpecies.has(card.id)) continue;
    seenSpecies.add(card.id);
    for (let i = 0; i < 3; i++) {
      const valid = getValidPlacements(card, grid);
      if (valid.length === 0) break;
      const coord = valid[Math.floor(Math.random() * valid.length)];
      const tile = grid.get(hexKey(coord));
      if (tile && !tile.placedCard) {
        tile.placedCard = { card: { ...card }, turnsActive: 0, biomassGenerated: 0 };
      }
    }
  }

  // Build the full deck including auto-added event cards
  const eventCardIds = getEventCardsForCondition(region.localCondition);
  const eventCards: Card[] = eventCardIds
    .map(id => EVENT_CARDS.find(c => c.id === id))
    .filter((c): c is Card => !!c)
    .map(c => ({ ...c }));
  const fullDeck = [...deck, ...eventCards];

  const shuffled = shuffle(fullDeck);
  const hand = shuffled.slice(0, 5);
  const remaining = shuffled.slice(5);

  const thermalBonus = planetStats ? Math.floor((planetStats.thermalBalance - 1) / 2) : 0;
  const startingBiomass = 5 + (upgrades?.startingBiomassBonus || 0) + thermalBonus;

  return {
    regionId: region.id,
    hexGrid: grid,
    deck: remaining,
    hand,
    discard: [],
    resources: { biomass: startingBiomass, nutrients: 2, water: 2 },
    turn: 1,
    endTurnCost: 1,
    cardsPlayedThisTurn: 0,
    totalActions: 0,
    score: emptyScore(),
    phase: 'playing',
    selectedCardIndex: null,
    setAsideTray: [],
  };
}

function emptyScore(): RunScore {
  return {
    resourcesNet: 0, peakIncome: 0, diversity: 0, population: 0,
    actions: 0, turns: 0, objectiveBonus: 0, questBonus: 0, synergyBonus: 0, total: 0,
  };
}

export function drawCards(run: RunState, count: number): void {
  for (let i = 0; i < count; i++) {
    if (run.deck.length === 0) {
      run.deck = shuffle(run.discard);
      run.discard = [];
    }
    if (run.deck.length > 0) {
      run.hand.push(run.deck.pop()!);
    }
  }
}

export function playCard(
  run: RunState,
  handIndex: number,
  targetHexKey: string | null,
): { success: boolean; message?: string; cardName?: string } {
  const card = run.hand[handIndex];
  if (!card) return { success: false, message: 'No card at that index' };

  // Check cost
  if (run.resources.biomass < card.cost.biomass ||
      run.resources.nutrients < card.cost.nutrients ||
      run.resources.water < card.cost.water) {
    return { success: false, message: 'Not enough resources' };
  }

  // Handle event cards
  if (card.type === 'event') {
    run.resources.biomass -= card.cost.biomass;
    run.resources.nutrients -= card.cost.nutrients;
    run.resources.water -= card.cost.water;
    applyEventEffect(card, run.hexGrid);
    run.hand.splice(handIndex, 1);
    run.discard.push(card);
    run.cardsPlayedThisTurn++;
    run.totalActions++;

    if (card.chainDraw) {
      const chainCard = getAnyCardById(card.chainDraw);
      if (chainCard) run.hand.push({ ...chainCard });
    }
    if (card.id === 'good-rain-year') {
      drawCards(run, 1);
    }
    return { success: true, cardName: card.name };
  }

  // Need a target hex for species/abiotic
  if (!targetHexKey) return { success: false, message: 'Select a hex to place this card' };

  const tile = run.hexGrid.get(targetHexKey);
  if (!tile) return { success: false, message: 'Invalid hex' };

  // Validate placement
  if (!canPlaceCard(card, tile, run.hexGrid)) {
    return { success: false, message: 'Cannot place here — conditions not met' };
  }

  const cardName = card.name;

  // Pay cost
  run.resources.biomass -= card.cost.biomass;
  run.resources.nutrients -= card.cost.nutrients;
  run.resources.water -= card.cost.water;

  if (card.type === 'abiotic') {
    applyAbioticEffect(card, tile.coord, run.hexGrid);
  } else {
    tile.placedCard = { card: { ...card }, turnsActive: 0, biomassGenerated: 0 };
  }

  run.hand.splice(handIndex, 1);
  run.discard.push(card);
  run.cardsPlayedThisTurn++;
  run.totalActions++;

  if (card.chainDraw) {
    const chainCard = getAnyCardById(card.chainDraw);
    if (chainCard) run.hand.push({ ...chainCard });
  }

  return { success: true, cardName };
}

export function endTurn(run: RunState, freeTurnEnds: number = 0, o2BonusBiomass: number = 0): void {
  // Pay end turn cost (free if within freeTurnEnds)
  const actualCost = run.turn <= freeTurnEnds ? 0 : run.endTurnCost;
  run.resources.biomass -= actualCost;
  run.endTurnCost += 1;
  run.turn++;
  run.cardsPlayedThisTurn = 0;

  // Collect income
  let turnIncome = { biomass: 0, nutrients: 0, water: 0 };
  run.hexGrid.forEach((tile) => {
    if (!tile.placedCard) return;
    const pc = tile.placedCard;
    pc.turnsActive++;
    turnIncome.biomass += pc.card.incomePerTurn.biomass;
    turnIncome.nutrients += pc.card.incomePerTurn.nutrients;
    turnIncome.water += pc.card.incomePerTurn.water;
    pc.biomassGenerated += pc.card.incomePerTurn.biomass;

    if (pc.card.maintenanceCost) {
      turnIncome.biomass -= pc.card.maintenanceCost.biomass;
      turnIncome.nutrients -= pc.card.maintenanceCost.nutrients;
      turnIncome.water -= pc.card.maintenanceCost.water;
    }
  });

  const adj = calculateAdjacencyBonuses(run.hexGrid);
  turnIncome.biomass += adj.biomass;
  turnIncome.nutrients += adj.nutrients;

  run.hexGrid.forEach((tile) => {
    if (tile.type === 'water' && !tile.placedCard) turnIncome.water += 1;
  });

  // Apply O₂ density bonus to biomass income
  turnIncome.biomass += o2BonusBiomass;

  run.resources.biomass += turnIncome.biomass;
  run.resources.nutrients += turnIncome.nutrients;
  run.resources.water += turnIncome.water;

  processPropagation(run.hexGrid);

  run.hand = [];
  drawCards(run, 5);
  run.selectedCardIndex = null;
}

/** Calculate live score (call during play) */
export function calculateScore(run: RunState, quest?: Quest): RunScore {
  let population = 0;
  let totalBiomassGenerated = 0;
  let producerCount = 0;
  let consumerDecomposerCount = 0;
  const speciesTypes = new Set<string>();

  let turnBiomassIncome = 0;
  let turnNutrientIncome = 0;

  run.hexGrid.forEach((tile) => {
    if (tile.placedCard) {
      population++;
      speciesTypes.add(tile.placedCard.card.id);
      totalBiomassGenerated += tile.placedCard.biomassGenerated;
      turnBiomassIncome += tile.placedCard.card.incomePerTurn.biomass;
      turnNutrientIncome += tile.placedCard.card.incomePerTurn.nutrients;
      if (tile.placedCard.card.trophicLevel === 'producer') producerCount++;
      if (tile.placedCard.card.trophicLevel === 'consumer' || tile.placedCard.card.trophicLevel === 'decomposer') consumerDecomposerCount++;
    }
  });
  const diversity = speciesTypes.size;
  const resourcesNet = run.resources.biomass + run.resources.nutrients + run.resources.water;

  // Quest bonus (quantitative)
  let questBonus = 0;
  if (quest) {
    let met = false;
    switch (quest.targetType) {
      case 'population': met = population >= quest.targetValue; break;
      case 'diversity': met = diversity >= quest.targetValue; break;
      case 'biomass_income': met = turnBiomassIncome >= quest.targetValue; break;
      case 'nutrient_income': met = turnNutrientIncome >= quest.targetValue; break;
      case 'place_producers': met = producerCount >= quest.targetValue; break;
      case 'place_consumers': met = consumerDecomposerCount >= quest.targetValue; break;
    }
    if (met) questBonus = 30;
  }

  // No points for quitting on turn 1 without playing
  if (run.turn <= 1 && run.totalActions === 0) {
    return emptyScore();
  }

  const objectiveBonus = population >= 10 ? 50 : 0;

  const score: RunScore = {
    resourcesNet: Math.max(0, resourcesNet),
    peakIncome: totalBiomassGenerated,
    diversity: diversity * 10,
    population: population * 5,
    actions: run.totalActions * 3,
    turns: (run.turn - 1) * 5,
    objectiveBonus,
    questBonus,
    synergyBonus: Math.floor(totalBiomassGenerated * 0.2),
    total: 0,
  };

  score.total = score.resourcesNet + score.peakIncome + score.diversity +
    score.population + score.actions + score.turns + score.objectiveBonus +
    score.questBonus + score.synergyBonus;

  return score;
}

export function calculateProjectedIncome(run: RunState, freeTurnEnds: number = 0): {
  total: { biomass: number; nutrients: number; water: number };
  cardIncome: { biomass: number; nutrients: number; water: number };
  adjacency: { biomass: number; nutrients: number };
  waterHexes: number;
  endTurnCost: number;
} {
  const cardIncome = { biomass: 0, nutrients: 0, water: 0 };
  run.hexGrid.forEach((tile) => {
    if (!tile.placedCard) return;
    const pc = tile.placedCard;
    cardIncome.biomass += pc.card.incomePerTurn.biomass;
    cardIncome.nutrients += pc.card.incomePerTurn.nutrients;
    cardIncome.water += pc.card.incomePerTurn.water;
    if (pc.card.maintenanceCost) {
      cardIncome.biomass -= pc.card.maintenanceCost.biomass;
      cardIncome.nutrients -= pc.card.maintenanceCost.nutrients;
      cardIncome.water -= pc.card.maintenanceCost.water;
    }
  });

  const adjacency = calculateAdjacencyBonuses(run.hexGrid);
  let waterHexes = 0;
  run.hexGrid.forEach((tile) => {
    if (tile.type === 'water' && !tile.placedCard) waterHexes++;
  });

  const actualEndCost = run.turn <= freeTurnEnds ? 0 : run.endTurnCost;

  return {
    total: {
      biomass: cardIncome.biomass + adjacency.biomass - actualEndCost,
      nutrients: cardIncome.nutrients + adjacency.nutrients,
      water: cardIncome.water + waterHexes,
    },
    cardIncome, adjacency, waterHexes, endTurnCost: actualEndCost,
  };
}

export function getEstablishCandidates(run: RunState): Card[] {
  // Count population per species
  const popCounts = new Map<string, number>();
  const bestCard = new Map<string, { card: Card; score: number }>();
  run.hexGrid.forEach((tile) => {
    if (!tile.placedCard || tile.placedCard.card.type !== 'species') return;
    const pc = tile.placedCard;
    popCounts.set(pc.card.id, (popCounts.get(pc.card.id) || 0) + 1);
    const score = pc.turnsActive * 2 + pc.biomassGenerated;
    const existing = bestCard.get(pc.card.id);
    if (!existing || score > existing.score) {
      bestCard.set(pc.card.id, { card: pc.card, score });
    }
  });

  // Only offer species with population >= 6
  const eligible = Array.from(bestCard.values())
    .filter(c => (popCounts.get(c.card.id) || 0) >= 6)
    .sort((a, b) => b.score - a.score);

  return eligible.slice(0, 3).map(c => c.card);
}

/** Serialize the current hex grid terrain for persistent storage */
export function getGridForSaving(run: RunState): import('./types').SerializedHexTile[] {
  return serializeGrid(run.hexGrid);
}

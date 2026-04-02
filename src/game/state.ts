import {
  GameState, RunState, RunScore, Resources, Card, HexTile,
  hexKey, Region,
} from './types';
import { generateHexGrid, applyAbioticEffect, applyEventEffect, processPropagation, calculateAdjacencyBonuses, getValidPlacements } from './hex';
import { getStarterDeck, getCardById } from './cards';

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

export function startRun(region: Region, deck: Card[]): RunState {
  const sizeMap = { small: 3, medium: 4, large: 5 };
  const radius = sizeMap[region.mapSize];
  const grid = generateHexGrid(
    radius,
    region.baseMoisture,
    region.baseLight,
    region.baseNutrients,
    Date.now(),
  );

  // Place seed bank cards on valid hexes
  for (const card of region.seedBank) {
    const valid = getValidPlacements(card, grid);
    if (valid.length > 0) {
      const coord = valid[Math.floor(Math.random() * valid.length)];
      const tile = grid.get(hexKey(coord));
      if (tile && !tile.placedCard) {
        tile.placedCard = { card: { ...card }, turnsActive: 0, biomassGenerated: 0 };
      }
    }
  }

  const shuffled = shuffle(deck);
  const hand = shuffled.slice(0, 5);
  const remaining = shuffled.slice(5);

  return {
    regionId: region.id,
    hexGrid: grid,
    deck: remaining,
    hand,
    discard: [],
    resources: { biomass: 8, nutrients: 4, water: 4 },
    turn: 1,
    endTurnCost: 1,
    cardsPlayedThisTurn: 0,
    score: emptyScore(),
    phase: 'playing',
    selectedCardIndex: null,
    setAsideTray: [],
  };
}

function emptyScore(): RunScore {
  return {
    resourcesNet: 0, peakIncome: 0, diversity: 0, population: 0,
    turns: 0, objectiveBonus: 0, questBonus: 0, synergyBonus: 0, total: 0,
  };
}

export function drawCards(run: RunState, count: number): void {
  for (let i = 0; i < count; i++) {
    if (run.deck.length === 0) {
      // Reshuffle discard into deck
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
): { success: boolean; message?: string } {
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

    // Chain draw
    if (card.chainDraw) {
      const chainCard = getCardById(card.chainDraw);
      if (chainCard) run.hand.push({ ...chainCard });
    }
    // Good rain year draws 1
    if (card.id === 'good-rain-year') {
      drawCards(run, 1);
    }
    return { success: true };
  }

  // Need a target hex for species/abiotic
  if (!targetHexKey) return { success: false, message: 'Select a hex to place this card' };

  const tile = run.hexGrid.get(targetHexKey);
  if (!tile) return { success: false, message: 'Invalid hex' };

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

  // Chain draw
  if (card.chainDraw) {
    const chainCard = getCardById(card.chainDraw);
    if (chainCard) run.hand.push({ ...chainCard });
  }

  return { success: true };
}

export function endTurn(run: RunState): void {
  // Pay end turn cost
  run.resources.biomass -= run.endTurnCost;
  run.endTurnCost += 1;
  run.turn++;
  run.cardsPlayedThisTurn = 0;

  // Collect income from all placed cards
  let turnIncome = { biomass: 0, nutrients: 0, water: 0 };
  run.hexGrid.forEach((tile) => {
    if (!tile.placedCard) return;
    const pc = tile.placedCard;
    pc.turnsActive++;
    turnIncome.biomass += pc.card.incomePerTurn.biomass;
    turnIncome.nutrients += pc.card.incomePerTurn.nutrients;
    turnIncome.water += pc.card.incomePerTurn.water;
    pc.biomassGenerated += pc.card.incomePerTurn.biomass;

    // Maintenance costs
    if (pc.card.maintenanceCost) {
      turnIncome.biomass -= pc.card.maintenanceCost.biomass;
      turnIncome.nutrients -= pc.card.maintenanceCost.nutrients;
      turnIncome.water -= pc.card.maintenanceCost.water;
    }
  });

  // Adjacency bonuses
  const adj = calculateAdjacencyBonuses(run.hexGrid);
  turnIncome.biomass += adj.biomass;
  turnIncome.nutrients += adj.nutrients;

  // Water from water hexes
  run.hexGrid.forEach((tile) => {
    if (tile.type === 'water' && !tile.placedCard) {
      turnIncome.water += 1;
    }
  });

  run.resources.biomass += turnIncome.biomass;
  run.resources.nutrients += turnIncome.nutrients;
  run.resources.water += turnIncome.water;

  // Propagation
  processPropagation(run.hexGrid);

  // Draw new hand
  run.hand = [];
  drawCards(run, 5);

  run.selectedCardIndex = null;
}

export function calculateScore(run: RunState, region: Region): RunScore {
  let diversity = 0;
  let population = 0;
  let totalBiomassGenerated = 0;
  const speciesTypes = new Set<string>();

  run.hexGrid.forEach((tile) => {
    if (tile.placedCard) {
      population++;
      speciesTypes.add(tile.placedCard.card.id);
      totalBiomassGenerated += tile.placedCard.biomassGenerated;
    }
  });
  diversity = speciesTypes.size;

  const resourcesNet = run.resources.biomass + run.resources.nutrients + run.resources.water;
  const objectiveBonus = population >= 10 ? 50 : 0; // simplified
  const questBonus = diversity >= 5 ? 30 : 0; // simplified

  const score: RunScore = {
    resourcesNet: Math.max(0, resourcesNet),
    peakIncome: totalBiomassGenerated,
    diversity: diversity * 10,
    population: population * 5,
    turns: run.turn * 3,
    objectiveBonus,
    questBonus,
    synergyBonus: Math.floor(totalBiomassGenerated * 0.2),
    total: 0,
  };

  score.total = score.resourcesNet + score.peakIncome + score.diversity +
    score.population + score.turns + score.objectiveBonus +
    score.questBonus + score.synergyBonus;

  return score;
}

export function getEstablishCandidates(run: RunState): Card[] {
  const candidates: { card: Card; score: number }[] = [];
  run.hexGrid.forEach((tile) => {
    if (!tile.placedCard || tile.placedCard.card.type !== 'species') return;
    const pc = tile.placedCard;
    const score = pc.turnsActive * 2 + pc.biomassGenerated;
    candidates.push({ card: pc.card, score });
  });

  candidates.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const unique: Card[] = [];
  for (const c of candidates) {
    if (!seen.has(c.card.id) && unique.length < 3) {
      seen.add(c.card.id);
      unique.push(c.card);
    }
  }
  return unique;
}

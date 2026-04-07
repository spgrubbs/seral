'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { GameState, Card, Planet, RunState, Region } from '@/game/types';
import { createInitialGameState, startRun, calculateScore, getEstablishCandidates, getGridForSaving } from '@/game/state';
import { generatePlanet, advanceRegion, getPlanetNeighbors, checkAchievements } from '@/game/planet';
import { getStarterDeck, ABIOTIC_CARDS, ALL_CARDS } from '@/game/cards';
import { generateHexGrid, serializeGrid } from '@/game/hex';

import TitleScreen from './screens/TitleScreen';
import PlanetMap from './screens/PlanetMap';
import DeckAssembly from './screens/DeckAssembly';
import RunScreen from './screens/RunScreen';
import RunCompleteScreen from './screens/RunCompleteScreen';

const SAVE_KEY = 'seral-save';

function savePlanet(planet: Planet) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(planet));
  } catch {}
}

function loadPlanet(): Planet | null {
  try {
    const data = localStorage.getItem(SAVE_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return null;
}

// Upgrade costs: each level costs more (10x scale)
const UPGRADE_COSTS: Record<string, number[]> = {
  freeTurnEnds: [300, 600, 1000],          // levels 0→1, 1→2, 2→3
  startingBiomassBonus: [200, 400, 800],
  ecologicalDrift: [500, 1000],            // max 2 levels
};

// Card unlock costs
const CARD_UNLOCK_COST = 400;

export default function Game() {
  const [gameState, setGameState] = useState<GameState>(() => {
    return createInitialGameState();
  });

  const [savedPlanet, setSavedPlanet] = useState<Planet | null>(null);

  // Load saved planet on mount
  useEffect(() => {
    const saved = loadPlanet();
    if (saved) {
      // Migrate old saves that don't have upgrades/achievements
      if (!saved.upgrades) {
        saved.upgrades = {
          freeTurnEnds: 0,
          startingBiomassBonus: 0,
          ecologicalDrift: 0,
          unlockedAbioticIds: [],
        };
      }
      if (!saved.achievements) {
        // import would be circular, just set empty and let planet.ts handle
        saved.achievements = [];
      }
      setSavedPlanet(saved);
    }
  }, []);

  // --- Title Screen ---
  const handleNewPlanet = useCallback((name: string) => {
    const planet = generatePlanet(name);
    savePlanet(planet);
    setSavedPlanet(planet);
    setGameState(prev => ({ ...prev, screen: 'planet-map', planet }));
  }, []);

  const handleContinue = useCallback(() => {
    if (savedPlanet) {
      setGameState(prev => ({ ...prev, screen: 'planet-map', planet: savedPlanet }));
    }
  }, [savedPlanet]);

  // --- Planet Map ---
  const handleSelectRegion = useCallback((regionId: string) => {
    setGameState(prev => ({ ...prev, selectedRegionId: regionId }));
  }, []);

  const handleStartRunFromMap = useCallback((regionId: string) => {
    setGameState(prev => {
      if (!prev.planet) return prev;

      const region = prev.planet.regions.find(r => r.id === regionId);
      if (!region) return prev;

      // If no saved grid, generate and save one now so DeckAssembly preview matches the run
      let newPlanet = prev.planet;
      if (!region.savedGrid || region.savedGrid.length === 0) {
        newPlanet = { ...prev.planet, regions: prev.planet.regions.map(r => ({ ...r })) };
        const targetRegion = newPlanet.regions.find(r => r.id === regionId)!;
        const sizeMap: Record<string, number> = { small: 2, medium: 3, large: 4 };
        const radius = sizeMap[targetRegion.mapSize] || 3;
        const moistureBonus = Math.max(0, newPlanet.stats.hydrologicalActivity - 1);
        const grid = generateHexGrid(
          radius,
          targetRegion.baseMoisture + moistureBonus,
          targetRegion.baseLight,
          targetRegion.baseNutrients,
          Date.now(),
          targetRegion.localCondition,
        );
        targetRegion.savedGrid = serializeGrid(grid);
        savePlanet(newPlanet);
      }

      return {
        ...prev,
        screen: 'deck-assembly' as const,
        selectedRegionId: regionId,
        assembledDeck: getStarterDeck(),
        planet: newPlanet,
      };
    });
  }, []);

  const handleBackToTitle = useCallback(() => {
    setGameState(prev => ({ ...prev, screen: 'title' }));
  }, []);

  // --- Purchase Handlers ---
  const handlePurchaseUpgrade = useCallback((upgradeType: string) => {
    setGameState(prev => {
      if (!prev.planet) return prev;
      const planet = { ...prev.planet, upgrades: { ...prev.planet.upgrades } };
      const costs = UPGRADE_COSTS[upgradeType];
      if (!costs) return prev;

      type NumericUpgrade = 'freeTurnEnds' | 'startingBiomassBonus' | 'ecologicalDrift';
      const key = upgradeType as NumericUpgrade;
      const currentLevel = planet.upgrades[key];
      if (typeof currentLevel !== 'number' || currentLevel >= costs.length) return prev;
      const cost = costs[currentLevel];
      if (planet.researchPoints < cost) return prev;

      planet.researchPoints -= cost;
      planet.upgrades[key] = currentLevel + 1;

      savePlanet(planet);
      setSavedPlanet(planet);
      return { ...prev, planet };
    });
  }, []);

  const handlePurchaseAbiotic = useCallback((cardId: string) => {
    setGameState(prev => {
      if (!prev.planet) return prev;
      const planet = { ...prev.planet, upgrades: { ...prev.planet.upgrades, unlockedAbioticIds: [...prev.planet.upgrades.unlockedAbioticIds] } };
      if (planet.upgrades.unlockedAbioticIds.includes(cardId)) return prev; // already bought

      const abioticCard = ABIOTIC_CARDS.find(c => c.id === cardId);
      if (!abioticCard || !abioticCard.rpCost) return prev;
      if (planet.researchPoints < abioticCard.rpCost) return prev;

      planet.researchPoints -= abioticCard.rpCost;
      planet.upgrades.unlockedAbioticIds.push(cardId);

      savePlanet(planet);
      setSavedPlanet(planet);
      return { ...prev, planet };
    });
  }, []);

  const handleUnlockCard = useCallback((cardId: string) => {
    setGameState(prev => {
      if (!prev.planet) return prev;
      const planet = { ...prev.planet, unlockedCardIds: [...prev.planet.unlockedCardIds] };
      if (planet.unlockedCardIds.includes(cardId)) return prev;

      const card = ALL_CARDS.find(c => c.id === cardId);
      if (!card) return prev;
      if (planet.researchPoints < CARD_UNLOCK_COST) return prev;

      planet.researchPoints -= CARD_UNLOCK_COST;
      planet.unlockedCardIds.push(cardId);

      savePlanet(planet);
      setSavedPlanet(planet);
      return { ...prev, planet };
    });
  }, []);

  // --- Deck Assembly ---
  const handleStartRunWithDeck = useCallback((deck: Card[]) => {
    if (!gameState.planet || !gameState.selectedRegionId) return;
    const region = gameState.planet.regions.find(r => r.id === gameState.selectedRegionId);
    if (!region) return;

    const run = startRun(region, deck, gameState.planet.upgrades, gameState.planet.stats);
    setGameState(prev => ({ ...prev, screen: 'run', currentRun: run }));
  }, [gameState.planet, gameState.selectedRegionId]);

  const handleBackToMap = useCallback(() => {
    setGameState(prev => ({ ...prev, screen: 'planet-map' }));
  }, []);

  // --- Run ---
  const handleRunUpdate = useCallback((run: RunState) => {
    setGameState(prev => ({ ...prev, currentRun: run }));
  }, []);

  const handleEndRun = useCallback(() => {
    if (!gameState.currentRun || !gameState.planet || !gameState.selectedRegionId) return;
    const region = gameState.planet.regions.find(r => r.id === gameState.selectedRegionId);
    if (!region) return;

    const score = calculateScore(gameState.currentRun, region.quest);
    const newRun = { ...gameState.currentRun, score, phase: 'ended' as const };
    setGameState(prev => ({ ...prev, screen: 'run-complete', currentRun: newRun }));
  }, [gameState.currentRun, gameState.planet, gameState.selectedRegionId]);

  // --- Run Complete ---
  const handleEstablish = useCallback((card: Card | null) => {
    if (!gameState.planet || !gameState.currentRun || !gameState.selectedRegionId) return;

    const newPlanet = { ...gameState.planet, regions: gameState.planet.regions.map(r => ({ ...r })), upgrades: { ...gameState.planet.upgrades, unlockedAbioticIds: [...gameState.planet.upgrades.unlockedAbioticIds] }, achievements: gameState.planet.achievements.map(a => ({ ...a })) };
    const region = newPlanet.regions.find(r => r.id === gameState.selectedRegionId);
    if (!region) return;

    // Establish species
    if (card) {
      region.seedBank = [...region.seedBank, card];
    }

    // Advance region based on score
    advanceRegion(region, gameState.currentRun.score.total);

    // Unlock adjacent regions
    if (region.state !== 'locked') {
      const neighbors = getPlanetNeighbors(region.coord, newPlanet.regions);
      neighbors.forEach(n => {
        if (n.state === 'locked') n.state = 'barren';
      });
    }

    // Save the hex grid terrain to the region for persistence
    if (gameState.currentRun) {
      region.savedGrid = getGridForSaving(gameState.currentRun);
    }

    // Update planet stats
    const climaxCount = newPlanet.regions.filter(r => r.state === 'climax').length;
    const midSeralPlus = newPlanet.regions.filter(r => r.state === 'mid-seral' || r.state === 'climax').length;
    newPlanet.stats.o2Density = Math.min(5, 1 + Math.floor(climaxCount / 2));
    newPlanet.stats.hydrologicalActivity = Math.min(5, 1 + Math.floor(midSeralPlus / 3));
    newPlanet.stats.thermalBalance = Math.min(5, 1 + Math.floor(midSeralPlus / 2));

    // Add research points from score
    newPlanet.researchPoints += gameState.currentRun.score.total;
    newPlanet.runsCompleted++;

    // Check achievements
    const diversity = new Set<string>();
    gameState.currentRun.hexGrid.forEach(tile => {
      if (tile.placedCard) diversity.add(tile.placedCard.card.id);
    });
    checkAchievements(newPlanet, gameState.currentRun.score.total, diversity.size);

    // Regenerate quest (pick a new random quest)
    const QUESTS = [
      { description: 'Place at least 8 organisms', targetType: 'population' as const, targetValue: 8 },
      { description: 'Have 5+ distinct species on the field', targetType: 'diversity' as const, targetValue: 5 },
      { description: 'Reach +6 biomass income per turn', targetType: 'biomass_income' as const, targetValue: 6 },
      { description: 'Reach +4 nutrient income per turn', targetType: 'nutrient_income' as const, targetValue: 4 },
      { description: 'Place 6 producer species', targetType: 'place_producers' as const, targetValue: 6 },
      { description: 'Place 3 consumer or decomposer species', targetType: 'place_consumers' as const, targetValue: 3 },
    ];
    region.quest = QUESTS[Math.floor(Math.random() * QUESTS.length)];

    savePlanet(newPlanet);
    setSavedPlanet(newPlanet);
    setGameState(prev => ({
      ...prev,
      screen: 'planet-map',
      planet: newPlanet,
      currentRun: null,
    }));
  }, [gameState.planet, gameState.currentRun, gameState.selectedRegionId]);

  // --- Render ---
  const { screen, planet, currentRun, selectedRegionId } = gameState;

  if (screen === 'title') {
    return (
      <TitleScreen
        onNewPlanet={handleNewPlanet}
        hasSave={!!savedPlanet}
        onContinue={handleContinue}
      />
    );
  }

  if (screen === 'planet-map' && planet) {
    return (
      <PlanetMap
        planet={planet}
        onSelectRegion={handleSelectRegion}
        onStartRun={handleStartRunFromMap}
        onBack={handleBackToTitle}
        onPurchaseUpgrade={handlePurchaseUpgrade}
        onPurchaseAbiotic={handlePurchaseAbiotic}
        onUnlockCard={handleUnlockCard}
        cardUnlockCost={CARD_UNLOCK_COST}
      />
    );
  }

  if (screen === 'deck-assembly' && planet && selectedRegionId) {
    const region = planet.regions.find(r => r.id === selectedRegionId)!;
    return (
      <DeckAssembly
        region={region}
        unlockedCardIds={planet.unlockedCardIds}
        unlockedAbioticIds={planet.upgrades.unlockedAbioticIds}
        suggestedDeck={gameState.assembledDeck}
        onStartRun={handleStartRunWithDeck}
        onBack={handleBackToMap}
      />
    );
  }

  if (screen === 'run' && currentRun && planet && selectedRegionId) {
    const region = planet.regions.find(r => r.id === selectedRegionId)!;
    return (
      <RunScreen
        run={currentRun}
        regionName={region.name}
        quest={region.quest}
        freeTurnEnds={planet.upgrades.freeTurnEnds}
        o2BonusBiomass={Math.max(0, planet.stats.o2Density - 1)}
        onUpdate={handleRunUpdate}
        onEndRun={handleEndRun}
      />
    );
  }

  if (screen === 'run-complete' && currentRun && planet && selectedRegionId) {
    const region = planet.regions.find(r => r.id === selectedRegionId)!;
    const candidates = getEstablishCandidates(currentRun);
    return (
      <RunCompleteScreen
        score={currentRun.score}
        regionName={region.name}
        establishCandidates={candidates}
        onEstablish={handleEstablish}
      />
    );
  }

  // Fallback
  return (
    <TitleScreen
      onNewPlanet={handleNewPlanet}
      hasSave={!!savedPlanet}
      onContinue={handleContinue}
    />
  );
}

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { GameState, Card, Planet, RunState, Region } from '@/game/types';
import { createInitialGameState, startRun, calculateScore, getEstablishCandidates } from '@/game/state';
import { generatePlanet, advanceRegion, getPlanetNeighbors } from '@/game/planet';
import { getStarterDeck } from '@/game/cards';

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

export default function Game() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const state = createInitialGameState();
    return state;
  });

  const [savedPlanet, setSavedPlanet] = useState<Planet | null>(null);

  // Load saved planet on mount
  useEffect(() => {
    const saved = loadPlanet();
    if (saved) setSavedPlanet(saved);
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
    setGameState(prev => ({
      ...prev,
      screen: 'deck-assembly',
      selectedRegionId: regionId,
      assembledDeck: getStarterDeck(),
    }));
  }, []);

  const handleBackToTitle = useCallback(() => {
    setGameState(prev => ({ ...prev, screen: 'title' }));
  }, []);

  // --- Deck Assembly ---
  const handleStartRunWithDeck = useCallback((deck: Card[]) => {
    if (!gameState.planet || !gameState.selectedRegionId) return;
    const region = gameState.planet.regions.find(r => r.id === gameState.selectedRegionId);
    if (!region) return;

    const run = startRun(region, deck);
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

    const score = calculateScore(gameState.currentRun, region);
    const newRun = { ...gameState.currentRun, score, phase: 'ended' as const };
    setGameState(prev => ({ ...prev, screen: 'run-complete', currentRun: newRun }));
  }, [gameState.currentRun, gameState.planet, gameState.selectedRegionId]);

  // --- Run Complete ---
  const handleEstablish = useCallback((card: Card | null) => {
    if (!gameState.planet || !gameState.currentRun || !gameState.selectedRegionId) return;

    const newPlanet = { ...gameState.planet };
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

    // Update planet stats
    const climaxCount = newPlanet.regions.filter(r => r.state === 'climax').length;
    const woodlandCount = newPlanet.regions.filter(r => r.state === 'woodland' || r.state === 'climax').length;
    newPlanet.stats.o2Density = Math.min(5, 1 + Math.floor(climaxCount / 2));
    newPlanet.stats.hydrologicalActivity = Math.min(5, 1 + Math.floor(woodlandCount / 3));
    newPlanet.stats.thermalBalance = Math.min(5, 1 + Math.floor(woodlandCount / 2));

    // Add research points
    newPlanet.researchPoints += gameState.currentRun.score.total;
    newPlanet.runsCompleted++;

    // Regenerate quest
    const quests = [
      'Introduce a pollinator species', 'Establish a predator guild',
      'Build a nitrogen-fixing network', 'Create a canopy cover',
      'Establish aquatic life', 'Build a decomposer chain',
      'Achieve high species diversity', 'Maximize biomass production',
    ];
    region.questDescription = quests[Math.floor(Math.random() * quests.length)];

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
      />
    );
  }

  if (screen === 'deck-assembly' && planet && selectedRegionId) {
    const region = planet.regions.find(r => r.id === selectedRegionId)!;
    return (
      <DeckAssembly
        region={region}
        unlockedCardIds={planet.unlockedCardIds}
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
        questDescription={region.questDescription}
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

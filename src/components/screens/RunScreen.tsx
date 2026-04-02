'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { RunState, HexCoord, hexKey, Card } from '@/game/types';
import { getValidPlacements } from '@/game/hex';
import { playCard, endTurn, drawCards } from '@/game/state';
import HexGrid from '@/components/hex/HexGrid';
import CardHand from '@/components/cards/CardHand';

interface RunScreenProps {
  run: RunState;
  regionName: string;
  questDescription: string;
  onUpdate: (run: RunState) => void;
  onEndRun: () => void;
}

function ResourceBar({ resources, turn, endTurnCost }: {
  resources: { biomass: number; nutrients: number; water: number };
  turn: number;
  endTurnCost: number;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 text-xs">
      <div className="flex gap-3">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-green-400 font-bold">{resources.biomass}</span>
          <span className="text-slate-500">B</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-amber-400 font-bold">{resources.nutrients}</span>
          <span className="text-slate-500">N</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-blue-400 font-bold">{resources.water}</span>
          <span className="text-slate-500">W</span>
        </span>
      </div>
      <div className="text-slate-400">
        Year <span className="text-white font-bold">{turn}</span>
      </div>
    </div>
  );
}

export default function RunScreen({ run, regionName, questDescription, onUpdate, onEndRun }: RunScreenProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const selectedCard = run.selectedCardIndex !== null ? run.hand[run.selectedCardIndex] : null;

  const validPlacements = useMemo(() => {
    if (!selectedCard || selectedCard.type === 'event') return new Set<string>();
    const valid = getValidPlacements(selectedCard, run.hexGrid);
    return new Set(valid.map(c => hexKey(c)));
  }, [selectedCard, run.hexGrid]);

  const handleSelectCard = useCallback((idx: number) => {
    const newRun = { ...run };
    if (newRun.selectedCardIndex === idx) {
      // Deselect or play event
      const card = newRun.hand[idx];
      if (card.type === 'event') {
        const result = playCard(newRun, idx, null);
        if (result.success) {
          setMessage(`Played ${card.name}!`);
          setTimeout(() => setMessage(null), 1500);
        } else {
          setMessage(result.message || 'Cannot play');
          setTimeout(() => setMessage(null), 1500);
        }
      } else {
        newRun.selectedCardIndex = null;
      }
    } else {
      newRun.selectedCardIndex = idx;
    }
    onUpdate(newRun);
  }, [run, onUpdate]);

  const handleHexClick = useCallback((coord: HexCoord) => {
    if (run.selectedCardIndex === null) return;

    const newRun = { ...run };
    const key = hexKey(coord);
    const result = playCard(newRun, run.selectedCardIndex, key);

    if (result.success) {
      const cardName = run.hand[run.selectedCardIndex].name;
      newRun.selectedCardIndex = null;
      setMessage(`Placed ${cardName}!`);
      setTimeout(() => setMessage(null), 1500);
    } else {
      setMessage(result.message || 'Cannot place here');
      setTimeout(() => setMessage(null), 1500);
    }

    onUpdate(newRun);
  }, [run, onUpdate]);

  const handleEndTurn = useCallback(() => {
    if (run.cardsPlayedThisTurn === 0) {
      setShowEndConfirm(true);
      return;
    }

    if (run.resources.biomass < run.endTurnCost) {
      setMessage('Not enough biomass to end turn!');
      setTimeout(() => setMessage(null), 1500);
      return;
    }

    const newRun = { ...run };
    endTurn(newRun);
    onUpdate(newRun);
    setMessage(`Year ${newRun.turn} begins`);
    setTimeout(() => setMessage(null), 1500);
  }, [run, onUpdate]);

  const handleConfirmEndRun = useCallback(() => {
    setShowEndConfirm(false);
    onEndRun();
  }, [onEndRun]);

  // Count placed cards
  let population = 0;
  let diversity = new Set<string>();
  run.hexGrid.forEach(tile => {
    if (tile.placedCard) {
      population++;
      diversity.add(tile.placedCard.card.id);
    }
  });

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="text-xs">
          <span className="font-bold text-emerald-400">{regionName}</span>
        </div>
        <div className="text-[10px] text-slate-500 flex gap-3">
          <span>{population} placed</span>
          <span>{diversity.size} species</span>
        </div>
      </div>

      {/* Resource Bar */}
      <ResourceBar resources={run.resources} turn={run.turn} endTurnCost={run.endTurnCost} />

      {/* Quest banner */}
      <div className="px-3 py-1 bg-amber-900/20 text-amber-300 text-[10px] text-center">
        {questDescription}
      </div>

      {/* Hex Grid */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-2 min-h-0">
        <HexGrid
          grid={run.hexGrid}
          selectedCard={selectedCard}
          validPlacements={validPlacements}
          onHexClick={handleHexClick}
          hexSize={30}
        />
      </div>

      {/* Message toast */}
      {message && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 border border-slate-600 px-4 py-2 rounded-lg text-sm font-semibold shadow-xl z-50 animate-fade-in">
          {message}
        </div>
      )}

      {/* End Turn / End Run confirmation */}
      {showEndConfirm && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mx-4 max-w-sm">
            <h3 className="text-lg font-bold mb-2">End Run?</h3>
            <p className="text-slate-400 text-sm mb-4">
              You haven&apos;t played any cards this turn. Ending the turn without playing will end the run.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEndRun}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold"
              >
                End Run
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Hand */}
      <div className="border-t border-slate-800 bg-slate-900 px-2 pt-2 pb-1">
        <CardHand
          hand={run.hand}
          selectedIndex={run.selectedCardIndex}
          onSelectCard={handleSelectCard}
          resources={run.resources}
        />
      </div>

      {/* End Turn Button */}
      <div className="px-3 pb-3 pt-1 bg-slate-900">
        <button
          onClick={handleEndTurn}
          className={`w-full py-2.5 rounded-lg font-bold text-sm transition-colors ${
            run.cardsPlayedThisTurn === 0
              ? 'bg-red-700 hover:bg-red-600 text-white'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {run.cardsPlayedThisTurn === 0
            ? 'End Run'
            : `End Turn (${run.endTurnCost}B)`
          }
        </button>
      </div>
    </div>
  );
}

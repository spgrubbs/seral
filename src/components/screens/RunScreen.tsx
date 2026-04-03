'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { RunState, HexCoord, hexKey, Card, Quest } from '@/game/types';
import { getValidPlacements } from '@/game/hex';
import { playCard, endTurn, calculateProjectedIncome, calculateScore } from '@/game/state';
import HexGrid from '@/components/hex/HexGrid';
import CardHand from '@/components/cards/CardHand';

interface RunScreenProps {
  run: RunState;
  regionName: string;
  quest: Quest;
  freeTurnEnds: number;
  onUpdate: (run: RunState) => void;
  onEndRun: () => void;
}

function ResourceBar({ resources, turn, endTurnCost, run, freeTurnEnds, liveScore }: {
  resources: { biomass: number; nutrients: number; water: number };
  turn: number;
  endTurnCost: number;
  run: RunState;
  freeTurnEnds: number;
  liveScore: number;
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const projected = calculateProjectedIncome(run, freeTurnEnds);

  function formatNet(val: number): string {
    if (val > 0) return `+${val}`;
    if (val < 0) return `${val}`;
    return '0';
  }

  function netColor(val: number): string {
    if (val > 0) return 'text-emerald-400';
    if (val < 0) return 'text-red-400';
    return 'text-slate-500';
  }

  return (
    <div
      className="relative px-3 py-2 bg-slate-900 border-b border-slate-800 text-xs cursor-pointer"
      onClick={() => setShowBreakdown(!showBreakdown)}
      onMouseEnter={() => setShowBreakdown(true)}
      onMouseLeave={() => setShowBreakdown(false)}
    >
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-green-400 font-bold">{resources.biomass}</span>
            <span className={`${netColor(projected.total.biomass)} text-[10px]`}>
              ({formatNet(projected.total.biomass)})
            </span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-amber-400 font-bold">{resources.nutrients}</span>
            <span className={`${netColor(projected.total.nutrients)} text-[10px]`}>
              ({formatNet(projected.total.nutrients)})
            </span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-blue-400 font-bold">{resources.water}</span>
            <span className={`${netColor(projected.total.water)} text-[10px]`}>
              ({formatNet(projected.total.water)})
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-amber-300 font-semibold">{liveScore} pts</span>
          <span className="text-slate-400">
            Year <span className="text-white font-bold">{turn}</span>
          </span>
        </div>
      </div>

      {/* Breakdown tooltip */}
      {showBreakdown && (
        <div className="absolute top-full left-0 right-0 z-50 bg-slate-900 border border-slate-700 rounded-b-lg p-3 text-[10px] shadow-xl animate-fade-in">
          <div className="font-semibold text-slate-300 mb-1.5">Next Turn Income Breakdown</div>
          <div className="grid grid-cols-4 gap-x-3 gap-y-1">
            <div className="text-slate-500">Source</div>
            <div className="text-green-400">Biomass</div>
            <div className="text-amber-400">Nutrients</div>
            <div className="text-blue-400">Water</div>

            <div className="text-slate-400">Card income</div>
            <div className="text-green-300">+{projected.cardIncome.biomass}</div>
            <div className="text-amber-300">+{projected.cardIncome.nutrients}</div>
            <div className="text-blue-300">+{projected.cardIncome.water}</div>

            <div className="text-slate-400">Adjacency</div>
            <div className="text-green-300">+{projected.adjacency.biomass}</div>
            <div className="text-amber-300">+{projected.adjacency.nutrients}</div>
            <div className="text-slate-600">-</div>

            <div className="text-slate-400">Water hexes</div>
            <div className="text-slate-600">-</div>
            <div className="text-slate-600">-</div>
            <div className="text-blue-300">+{projected.waterHexes}</div>

            <div className="text-slate-400">End turn cost</div>
            <div className="text-red-400">-{projected.endTurnCost}</div>
            <div className="text-slate-600">-</div>
            <div className="text-slate-600">-</div>

            <div className="text-white font-bold border-t border-slate-700 pt-1">Net</div>
            <div className={`font-bold border-t border-slate-700 pt-1 ${netColor(projected.total.biomass)}`}>{formatNet(projected.total.biomass)}</div>
            <div className={`font-bold border-t border-slate-700 pt-1 ${netColor(projected.total.nutrients)}`}>{formatNet(projected.total.nutrients)}</div>
            <div className={`font-bold border-t border-slate-700 pt-1 ${netColor(projected.total.water)}`}>{formatNet(projected.total.water)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RunScreen({ run, regionName, quest, freeTurnEnds, onUpdate, onEndRun }: RunScreenProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const selectedCard = run.selectedCardIndex !== null ? run.hand[run.selectedCardIndex] : null;

  const validPlacements = useMemo(() => {
    if (!selectedCard || selectedCard.type === 'event') return new Set<string>();
    const valid = getValidPlacements(selectedCard, run.hexGrid);
    return new Set(valid.map(c => hexKey(c)));
  }, [selectedCard, run.hexGrid]);

  // Live score calculation
  const liveScore = useMemo(() => {
    return calculateScore(run, quest);
  }, [run, quest]);

  const canAffordEndTurn = run.resources.biomass >= run.endTurnCost;
  const shouldEndRun = run.cardsPlayedThisTurn === 0 || !canAffordEndTurn;

  const handleSelectCard = useCallback((idx: number) => {
    const newRun = { ...run };
    if (newRun.selectedCardIndex === idx) {
      const card = newRun.hand[idx];
      if (card.type === 'event') {
        const result = playCard(newRun, idx, null);
        if (result.success) {
          setMessage(`Played ${result.cardName}!`);
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
      newRun.selectedCardIndex = null;
      setMessage(`Placed ${result.cardName}!`);
      setTimeout(() => setMessage(null), 1500);
    } else {
      setMessage(result.message || 'Cannot place here');
      setTimeout(() => setMessage(null), 1500);
    }

    onUpdate(newRun);
  }, [run, onUpdate]);

  const handleEndTurn = useCallback(() => {
    if (shouldEndRun) {
      setShowEndConfirm(true);
      return;
    }

    const newRun = { ...run };
    endTurn(newRun, freeTurnEnds);
    onUpdate(newRun);
    setMessage(`Year ${newRun.turn} begins`);
    setTimeout(() => setMessage(null), 1500);
  }, [run, onUpdate, shouldEndRun, freeTurnEnds]);

  const handleConfirmEndRun = useCallback(() => {
    setShowEndConfirm(false);
    onEndRun();
  }, [onEndRun]);

  // Count placed cards
  let population = 0;
  const diversity = new Set<string>();
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
          <span>{run.totalActions} actions</span>
        </div>
      </div>

      {/* Resource Bar with live score */}
      <ResourceBar
        resources={run.resources}
        turn={run.turn}
        endTurnCost={run.endTurnCost}
        run={run}
        freeTurnEnds={freeTurnEnds}
        liveScore={liveScore.total}
      />

      {/* Quest banner */}
      <div className="px-3 py-1 bg-amber-900/20 text-amber-300 text-[10px] text-center">
        {quest.description}
        {liveScore.questBonus > 0 && <span className="ml-1 text-emerald-400">✓</span>}
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
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 border border-slate-600 px-4 py-2 rounded-lg text-sm font-semibold shadow-xl z-50 animate-fade-in">
          {message}
        </div>
      )}

      {/* End Run confirmation */}
      {showEndConfirm && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mx-4 max-w-sm">
            <h3 className="text-lg font-bold mb-2">End Run?</h3>
            <p className="text-slate-400 text-sm mb-4">
              {!canAffordEndTurn
                ? `You don't have enough biomass (${run.endTurnCost}B needed) to continue. The run will end.`
                : "You haven't played any cards this turn. Ending will conclude the run."
              }
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
          endTurnCost={run.endTurnCost}
        />
      </div>

      {/* End Turn Button */}
      <div className="px-3 pb-3 pt-1 bg-slate-900">
        <button
          onClick={handleEndTurn}
          className={`w-full py-2.5 rounded-lg font-bold text-sm transition-colors ${
            shouldEndRun
              ? 'bg-red-700 hover:bg-red-600 text-white'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {shouldEndRun
            ? 'End Run'
            : `End Turn (${run.endTurnCost}B)`
          }
        </button>
      </div>
    </div>
  );
}

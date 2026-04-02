'use client';

import React, { useState } from 'react';
import { RunScore, Card } from '@/game/types';

interface RunCompleteScreenProps {
  score: RunScore;
  regionName: string;
  establishCandidates: Card[];
  onEstablish: (card: Card | null) => void;
}

function ScoreLine({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1 ${highlight ? 'text-emerald-400' : 'text-slate-300'}`}>
      <span className="text-sm">{label}</span>
      <span className={`font-bold ${highlight ? 'text-lg' : 'text-sm'}`}>+{value}</span>
    </div>
  );
}

export default function RunCompleteScreen({ score, regionName, establishCandidates, onEstablish }: RunCompleteScreenProps) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [phase, setPhase] = useState<'score' | 'establish'>('score');

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-950 to-emerald-950 text-white">
      {/* Header */}
      <div className="text-center pt-8 pb-4 px-6">
        <h1 className="text-2xl font-bold text-emerald-400 mb-1">Run Complete</h1>
        <p className="text-slate-400 text-sm">{regionName}</p>
      </div>

      {phase === 'score' ? (
        <div className="flex-1 px-6">
          {/* Score breakdown */}
          <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 mb-4">
            <ScoreLine label="Resources Net" value={score.resourcesNet} />
            <ScoreLine label="Peak Income" value={score.peakIncome} />
            <ScoreLine label="Species Diversity" value={score.diversity} />
            <ScoreLine label="Population" value={score.population} />
            <ScoreLine label="Actions Taken" value={score.actions} />
            <ScoreLine label="Years Survived" value={score.turns} />
            <ScoreLine label="Synergy Chains" value={score.synergyBonus} />
            {score.objectiveBonus > 0 && (
              <ScoreLine label="Objective Bonus" value={score.objectiveBonus} highlight />
            )}
            {score.questBonus > 0 && (
              <ScoreLine label="Quest Bonus" value={score.questBonus} highlight />
            )}
            <div className="border-t border-slate-700 mt-2 pt-2">
              <ScoreLine label="Total Research Points" value={score.total} highlight />
            </div>
          </div>

          <button
            onClick={() => setPhase('establish')}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-lg transition-colors"
          >
            Continue
          </button>
        </div>
      ) : (
        <div className="flex-1 px-6">
          {/* Establish selection */}
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold mb-1">Establish a Species</h2>
            <p className="text-slate-400 text-xs">Choose one species to permanently establish in this region. It will appear as a free starting card on future runs.</p>
          </div>

          {establishCandidates.length > 0 ? (
            <div className="flex flex-col gap-3 mb-6">
              {establishCandidates.map((card, idx) => (
                <button
                  key={`${card.id}-${idx}`}
                  onClick={() => setSelectedCard(card)}
                  className={`
                    p-3 rounded-lg border text-left transition-all
                    ${selectedCard?.id === card.id
                      ? 'border-cyan-400 bg-cyan-950 shadow-lg shadow-cyan-400/20'
                      : 'border-slate-700 bg-slate-900 hover:border-slate-500'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold">{card.name}</span>
                    <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.5 rounded capitalize">
                      {card.successionStage}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">{card.description}</p>
                  <div className="flex gap-1 mt-1">
                    {card.incomePerTurn.biomass > 0 && (
                      <span className="text-emerald-400 text-[10px]">+{card.incomePerTurn.biomass}B/turn</span>
                    )}
                    {card.incomePerTurn.nutrients > 0 && (
                      <span className="text-amber-400 text-[10px]">+{card.incomePerTurn.nutrients}N/turn</span>
                    )}
                    {card.incomePerTurn.water > 0 && (
                      <span className="text-blue-400 text-[10px]">+{card.incomePerTurn.water}W/turn</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-500 py-8">
              No species eligible for establishment.
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => onEstablish(null)}
              className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
            >
              Skip
            </button>
            <button
              onClick={() => onEstablish(selectedCard)}
              disabled={!selectedCard}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-bold transition-colors"
            >
              Establish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

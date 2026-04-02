'use client';

import React from 'react';
import { Card } from '@/game/types';

interface CardHandProps {
  hand: Card[];
  selectedIndex: number | null;
  onSelectCard: (index: number) => void;
  resources: { biomass: number; nutrients: number; water: number };
  mastSeedActive?: boolean;
  warmWinterActive?: boolean;
}

function CostBadge({ value, type }: { value: number; type: 'B' | 'N' | 'W' }) {
  if (value <= 0) return null;
  const colors = { B: 'bg-green-600', N: 'bg-amber-600', W: 'bg-blue-500' };
  return (
    <span className={`${colors[type]} text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold`}>
      {value}{type}
    </span>
  );
}

function CardTypeLabel({ type }: { type: Card['type'] }) {
  const colors = {
    species: 'bg-emerald-700',
    abiotic: 'bg-stone-600',
    event: 'bg-purple-600',
  };
  return (
    <span className={`${colors[type]} text-white text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold`}>
      {type}
    </span>
  );
}

export default function CardHand({
  hand,
  selectedIndex,
  onSelectCard,
  resources,
  mastSeedActive,
  warmWinterActive,
}: CardHandProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-1 snap-x snap-mandatory">
      {hand.map((card, idx) => {
        const isSelected = selectedIndex === idx;
        let effectiveCost = { ...card.cost };
        if (card.type === 'event') {
          effectiveCost = { biomass: 0, nutrients: 0, water: 0 };
        }
        if (warmWinterActive && card.type === 'species') {
          effectiveCost.biomass = Math.max(0, effectiveCost.biomass - 1);
        }

        const canAfford =
          resources.biomass >= effectiveCost.biomass &&
          resources.nutrients >= effectiveCost.nutrients &&
          resources.water >= effectiveCost.water;

        return (
          <button
            key={`${card.id}-${idx}`}
            onClick={() => onSelectCard(idx)}
            className={`
              snap-center flex-shrink-0 w-[130px] rounded-lg border-2 p-2 text-left transition-all
              ${isSelected
                ? 'border-cyan-400 bg-cyan-950 shadow-lg shadow-cyan-400/20 -translate-y-2 scale-105'
                : canAfford
                  ? 'border-slate-600 bg-slate-800 hover:border-slate-400'
                  : 'border-red-900/50 bg-slate-900 opacity-60'
              }
            `}
          >
            <div className="flex items-center justify-between mb-1">
              <CardTypeLabel type={card.type} />
            </div>
            <div className="text-white text-xs font-semibold mb-1 leading-tight">{card.name}</div>
            <div className="flex gap-1 flex-wrap mb-1">
              <CostBadge value={effectiveCost.biomass} type="B" />
              <CostBadge value={effectiveCost.nutrients} type="N" />
              <CostBadge value={effectiveCost.water} type="W" />
              {card.type === 'event' && (
                <span className="bg-purple-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">free</span>
              )}
            </div>
            <div className="text-slate-400 text-[10px] leading-tight line-clamp-3">{card.description}</div>
            {(card.incomePerTurn.biomass > 0 || card.incomePerTurn.nutrients > 0 || card.incomePerTurn.water > 0) && (
              <div className="text-emerald-400 text-[10px] mt-1 font-medium">
                {card.incomePerTurn.biomass > 0 && `+${card.incomePerTurn.biomass}B `}
                {card.incomePerTurn.nutrients > 0 && `+${card.incomePerTurn.nutrients}N `}
                {card.incomePerTurn.water > 0 && `+${card.incomePerTurn.water}W `}
                /turn
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

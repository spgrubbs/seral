'use client';

import React, { useState } from 'react';
import { Card } from '@/game/types';

interface CardHandProps {
  hand: Card[];
  selectedIndex: number | null;
  onSelectCard: (index: number) => void;
  resources: { biomass: number; nutrients: number; water: number };
  endTurnCost: number;
}

function CostPill({ value, color }: { value: number; color: string }) {
  if (value <= 0) return null;
  return (
    <span className={`${color} text-white text-[10px] w-5 h-5 rounded-full font-bold inline-flex items-center justify-center`}>
      {value}
    </span>
  );
}

function RequirementTag({ label }: { label: string }) {
  return (
    <span className="bg-slate-700 text-slate-300 text-[9px] px-1 py-0.5 rounded">
      {label}
    </span>
  );
}

function CardModal({ card, onClose, resources, endTurnCost }: {
  card: Card;
  onClose: () => void;
  resources: { biomass: number; nutrients: number; water: number };
  endTurnCost: number;
}) {
  const afterBiomass = resources.biomass - card.cost.biomass;
  const dangerousPlay = card.type !== 'event' && afterBiomass < endTurnCost && afterBiomass >= 0;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-bold text-lg">{card.name}</h3>
          <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold ${
            card.type === 'species' ? 'bg-emerald-700 text-white' :
            card.type === 'abiotic' ? 'bg-stone-600 text-white' :
            'bg-purple-600 text-white'
          }`}>{card.type}</span>
        </div>

        {card.successionStage && (
          <div className="text-slate-500 text-xs mb-2 capitalize">{card.successionStage} · {card.trophicLevel}</div>
        )}

        {/* Description / flavor */}
        <p className="text-slate-300 text-sm mb-3">{card.description}</p>

        {/* Costs */}
        {card.type !== 'event' && (card.cost.biomass > 0 || card.cost.nutrients > 0 || card.cost.water > 0) && (
          <div className="mb-2">
            <div className="text-slate-500 text-[10px] uppercase font-semibold mb-1">Cost</div>
            <div className="flex gap-1.5">
              <CostPill value={card.cost.biomass} color="bg-green-600" />
              <CostPill value={card.cost.nutrients} color="bg-amber-600" />
              <CostPill value={card.cost.water} color="bg-blue-500" />
            </div>
          </div>
        )}

        {/* Income */}
        {(card.incomePerTurn.biomass > 0 || card.incomePerTurn.nutrients > 0 || card.incomePerTurn.water > 0) && (
          <div className="mb-2">
            <div className="text-slate-500 text-[10px] uppercase font-semibold mb-1">Income / Turn</div>
            <div className="text-emerald-400 text-sm">
              {card.incomePerTurn.biomass > 0 && <span className="mr-2">+{card.incomePerTurn.biomass} biomass</span>}
              {card.incomePerTurn.nutrients > 0 && <span className="mr-2">+{card.incomePerTurn.nutrients} nutrients</span>}
              {card.incomePerTurn.water > 0 && <span>+{card.incomePerTurn.water} water</span>}
            </div>
          </div>
        )}

        {/* Placement requirements */}
        {card.type === 'species' && (
          <div className="mb-2">
            <div className="text-slate-500 text-[10px] uppercase font-semibold mb-1">Placement</div>
            <div className="flex flex-wrap gap-1">
              {card.placement.minMoisture !== undefined && card.placement.maxMoisture !== undefined &&
                <RequirementTag label={`Moisture ${card.placement.minMoisture}-${card.placement.maxMoisture}`} />}
              {card.placement.minMoisture !== undefined && card.placement.maxMoisture === undefined &&
                <RequirementTag label={`Moisture ${card.placement.minMoisture}+`} />}
              {card.placement.minLight !== undefined && card.placement.maxLight !== undefined &&
                <RequirementTag label={`Light ${card.placement.minLight}-${card.placement.maxLight}`} />}
              {card.placement.minLight !== undefined && card.placement.maxLight === undefined &&
                <RequirementTag label={`Light ${card.placement.minLight}+`} />}
              {card.placement.minNutrients !== undefined &&
                <RequirementTag label={`Nutrients ${card.placement.minNutrients}+`} />}
              {card.placement.hexType &&
                <RequirementTag label={card.placement.hexType.join('/')} />}
              {card.placement.adjacentTag &&
                <RequirementTag label={`Adjacent: ${card.placement.adjacentTag}`} />}
            </div>
          </div>
        )}

        {/* Adjacency effects */}
        {card.adjacencyEffect && (
          <div className="mb-2">
            <div className="text-slate-500 text-[10px] uppercase font-semibold mb-1">Adjacency</div>
            <div className="text-cyan-400 text-xs">
              {card.adjacencyEffect.biomassPerTurn ? `+${card.adjacencyEffect.biomassPerTurn} biomass/turn ` : ''}
              {card.adjacencyEffect.nutrientsPerTurn ? `+${card.adjacencyEffect.nutrientsPerTurn} nutrients/turn ` : ''}
              {card.adjacencyEffect.moisture ? `moisture ${card.adjacencyEffect.moisture > 0 ? '+' : ''}${card.adjacencyEffect.moisture} ` : ''}
              {card.adjacencyEffect.light ? `light ${card.adjacencyEffect.light > 0 ? '+' : ''}${card.adjacencyEffect.light} ` : ''}
              to neighbors
            </div>
          </div>
        )}

        {/* Tags */}
        {card.tags.length > 0 && (
          <div className="mb-3">
            <div className="text-slate-500 text-[10px] uppercase font-semibold mb-1">Tags</div>
            <div className="flex gap-1 flex-wrap">
              {card.tags.map(tag => (
                <span key={tag} className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Biomass warning */}
        {dangerousPlay && (
          <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg px-3 py-2 mb-3">
            <span className="text-amber-400 text-xs font-semibold">Warning:</span>
            <span className="text-amber-300 text-xs ml-1">
              Playing this leaves you with {afterBiomass}B — below the {endTurnCost}B end-turn cost.
            </span>
          </div>
        )}

        <button onClick={onClose} className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-semibold text-white">
          Close
        </button>
      </div>
    </div>
  );
}

export default function CardHand({
  hand,
  selectedIndex,
  onSelectCard,
  resources,
  endTurnCost,
}: CardHandProps) {
  const [modalCard, setModalCard] = useState<Card | null>(null);

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-2 px-1 snap-x snap-mandatory">
        {hand.map((card, idx) => {
          const isSelected = selectedIndex === idx;
          let effectiveCost = { ...card.cost };
          if (card.type === 'event') {
            effectiveCost = { biomass: 0, nutrients: 0, water: 0 };
          }

          const canAfford =
            resources.biomass >= effectiveCost.biomass &&
            resources.nutrients >= effectiveCost.nutrients &&
            resources.water >= effectiveCost.water;

          const afterBiomass = resources.biomass - effectiveCost.biomass;
          const dangerousPlay = card.type !== 'event' && canAfford && afterBiomass < endTurnCost;

          return (
            <button
              key={`${card.id}-${idx}`}
              onClick={() => onSelectCard(idx)}
              onContextMenu={(e) => { e.preventDefault(); setModalCard(card); }}
              onDoubleClick={() => setModalCard(card)}
              className={`
                snap-center flex-shrink-0 w-[130px] rounded-lg border-2 p-2 text-left transition-all
                ${isSelected
                  ? 'border-cyan-400 bg-cyan-950 shadow-lg shadow-cyan-400/20 -translate-y-2 scale-105'
                  : canAfford
                    ? dangerousPlay
                      ? 'border-amber-600/50 bg-slate-800 hover:border-amber-500'
                      : 'border-slate-600 bg-slate-800 hover:border-slate-400'
                    : 'border-red-900/50 bg-slate-900 opacity-60'
                }
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                  card.type === 'species' ? 'bg-emerald-700 text-white' :
                  card.type === 'abiotic' ? 'bg-stone-600 text-white' :
                  'bg-purple-600 text-white'
                }`}>{card.type}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setModalCard(card); }}
                  className="text-slate-500 hover:text-slate-300 text-[10px] w-4 h-4 flex items-center justify-center"
                >
                  ?
                </button>
              </div>
              <div className="text-white text-xs font-semibold mb-1 leading-tight">{card.name}</div>

              {/* Costs — colored pills only, no letters */}
              <div className="flex gap-1 flex-wrap mb-1">
                <CostPill value={effectiveCost.biomass} color="bg-green-600" />
                <CostPill value={effectiveCost.nutrients} color="bg-amber-600" />
                <CostPill value={effectiveCost.water} color="bg-blue-500" />
                {card.type === 'event' && (
                  <span className="bg-purple-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">free</span>
                )}
              </div>

              {/* Placement requirements — separate from costs */}
              {card.type === 'species' && (
                <div className="flex gap-0.5 flex-wrap mb-1">
                  {card.placement.minMoisture !== undefined && card.placement.maxMoisture !== undefined &&
                    <RequirementTag label={`M:${card.placement.minMoisture}-${card.placement.maxMoisture}`} />}
                  {card.placement.minLight !== undefined && card.placement.maxLight !== undefined &&
                    <RequirementTag label={`L:${card.placement.minLight}-${card.placement.maxLight}`} />}
                  {card.placement.minNutrients !== undefined &&
                    <RequirementTag label={`N:${card.placement.minNutrients}+`} />}
                  {card.placement.hexType &&
                    <RequirementTag label={card.placement.hexType.join('/')} />}
                  {card.placement.adjacentTag &&
                    <RequirementTag label={`adj:${card.placement.adjacentTag}`} />}
                </div>
              )}

              {/* Income */}
              {(card.incomePerTurn.biomass > 0 || card.incomePerTurn.nutrients > 0 || card.incomePerTurn.water > 0) && (
                <div className="text-emerald-400 text-[10px] font-medium">
                  {card.incomePerTurn.biomass > 0 && `+${card.incomePerTurn.biomass}B `}
                  {card.incomePerTurn.nutrients > 0 && `+${card.incomePerTurn.nutrients}N `}
                  {card.incomePerTurn.water > 0 && `+${card.incomePerTurn.water}W `}
                  /turn
                </div>
              )}

              {/* Biomass warning indicator */}
              {dangerousPlay && (
                <div className="text-amber-400 text-[9px] mt-0.5 font-semibold">
                  ⚠ Low biomass after
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Card detail modal */}
      {modalCard && (
        <CardModal
          card={modalCard}
          onClose={() => setModalCard(null)}
          resources={resources}
          endTurnCost={endTurnCost}
        />
      )}
    </>
  );
}

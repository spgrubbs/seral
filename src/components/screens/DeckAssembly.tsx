'use client';

import React, { useState, useMemo } from 'react';
import { Card, Region } from '@/game/types';
import { ALL_CARDS, EVENT_CARDS, ABIOTIC_CARDS } from '@/game/cards';
import { getEventCardsForCondition, LOCAL_CONDITION_DESCRIPTIONS } from '@/game/planet';

interface DeckAssemblyProps {
  region: Region;
  unlockedCardIds: string[];
  unlockedAbioticIds: string[];
  suggestedDeck: Card[];
  onStartRun: (deck: Card[]) => void;
  onBack: () => void;
}

const MAX_DECK_SIZE = 15;

export default function DeckAssembly({ region, unlockedCardIds, unlockedAbioticIds, suggestedDeck, onStartRun, onBack }: DeckAssemblyProps) {
  const [deck, setDeck] = useState<Card[]>(suggestedDeck);
  const [filter, setFilter] = useState<string>('all');

  // Auto-added event cards for this region's condition
  const mandatoryEventIds = getEventCardsForCondition(region.localCondition);
  const mandatoryEvents = mandatoryEventIds
    .map(id => EVENT_CARDS.find(c => c.id === id))
    .filter((c): c is Card => !!c);

  // Available abiotic cards (purchased ones)
  const availableAbiotics = ABIOTIC_CARDS.filter(c => unlockedAbioticIds.includes(c.id));

  const availableCards = useMemo(() =>
    ALL_CARDS.filter(c => unlockedCardIds.includes(c.id)),
    [unlockedCardIds]
  );

  const filteredCards = useMemo(() => {
    let cards = availableCards;
    if (filter === 'species') cards = cards.filter(c => c.type === 'species');
    if (filter === 'pioneer') cards = cards.filter(c => c.successionStage === 'pioneer');
    if (filter === 'grassland') cards = cards.filter(c => c.successionStage === 'grassland');
    if (filter === 'woodland') cards = cards.filter(c => c.successionStage === 'woodland');
    if (filter === 'climax') cards = cards.filter(c => c.successionStage === 'climax');
    return cards;
  }, [availableCards, filter]);

  const addCard = (card: Card) => {
    if (deck.length >= MAX_DECK_SIZE) return;
    setDeck([...deck, { ...card }]);
  };

  const removeCard = (idx: number) => {
    setDeck(deck.filter((_, i) => i !== idx));
  };

  const deckCounts = useMemo(() => {
    const counts = new Map<string, number>();
    deck.forEach(c => counts.set(c.id, (counts.get(c.id) || 0) + 1));
    return counts;
  }, [deck]);

  const totalCards = deck.length + mandatoryEvents.length + availableAbiotics.length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center justify-between mb-1">
          <button onClick={onBack} className="text-slate-400 hover:text-white text-sm">&larr; Map</button>
          <span className="text-emerald-400 font-bold text-sm">{deck.length}/{MAX_DECK_SIZE} species</span>
        </div>
        <h2 className="text-base font-bold">{region.name}</h2>
        <div className="flex gap-2 text-[10px] text-slate-400 mt-1">
          <span>Size: <span className="text-white capitalize">{region.mapSize}</span></span>
          <span>|</span>
          <span>Condition: <span className="text-cyan-300 capitalize">{region.localCondition.replace('-', ' ')}</span></span>
        </div>
        <div className="text-[10px] text-amber-300 mt-1">{region.quest.description}</div>
      </div>

      {/* Deck visualization: top half */}
      <div className="px-4 py-3 bg-slate-900/50 border-b border-slate-800">
        {/* Card backs visualization */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex -space-x-2">
            {deck.slice(0, 12).map((_, i) => (
              <div key={i} className="w-5 h-7 rounded-sm bg-gradient-to-br from-emerald-700 to-emerald-900 border border-emerald-600/50" />
            ))}
            {deck.length > 12 && (
              <div className="w-5 h-7 rounded-sm bg-emerald-800 border border-emerald-600/50 flex items-center justify-center text-[7px] text-emerald-300">
                +{deck.length - 12}
              </div>
            )}
          </div>
          <span className="text-slate-500 text-[10px]">{totalCards} total in deck</span>
        </div>

        {/* Card name list */}
        <div className="flex flex-wrap gap-1">
          {Array.from(deckCounts.entries()).map(([cardId, count]) => {
            const card = deck.find(c => c.id === cardId)!;
            return (
              <button
                key={cardId}
                onClick={() => {
                  const idx = deck.findIndex(c => c.id === cardId);
                  if (idx >= 0) removeCard(idx);
                }}
                className="text-[10px] bg-slate-800 hover:bg-red-900/50 px-2 py-0.5 rounded border border-slate-700 transition-colors"
              >
                {card.name} {count > 1 && <span className="text-slate-500">x{count}</span>}
              </button>
            );
          })}
          {/* Mandatory events */}
          {mandatoryEvents.map((card, i) => (
            <span key={`evt-${i}`} className="text-[10px] bg-purple-900/30 px-2 py-0.5 rounded border border-purple-700/50 text-purple-300">
              {card.name} <span className="text-purple-500">(auto)</span>
            </span>
          ))}
          {/* Available abiotics */}
          {availableAbiotics.map(card => (
            <span key={card.id} className="text-[10px] bg-stone-800/50 px-2 py-0.5 rounded border border-stone-600/50 text-stone-300">
              {card.name} <span className="text-stone-500">(tool)</span>
            </span>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 px-4 py-2 overflow-x-auto text-[10px]">
        {['all', 'species', 'pioneer', 'grassland', 'woodland', 'climax'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2 py-1 rounded capitalize whitespace-nowrap ${
              filter === f ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Card Browser */}
      <div className="flex-1 overflow-auto px-4 pb-20">
        <div className="grid grid-cols-2 gap-2 mt-2">
          {filteredCards.map(card => {
            const inDeck = deckCounts.get(card.id) || 0;
            return (
              <button
                key={card.id}
                onClick={() => addCard(card)}
                disabled={deck.length >= MAX_DECK_SIZE}
                className={`
                  p-2 rounded-lg border text-left transition-all
                  ${inDeck > 0 ? 'border-emerald-600 bg-emerald-950/30' : 'border-slate-700 bg-slate-900'}
                  hover:border-slate-500 disabled:opacity-40
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase bg-emerald-700 text-white">
                    {card.successionStage || card.type}
                  </span>
                  {inDeck > 0 && <span className="text-[9px] text-emerald-400 font-bold">x{inDeck}</span>}
                </div>
                <div className="text-xs font-semibold mb-1">{card.name}</div>
                {/* Cost pills — no letters, colored only */}
                <div className="flex gap-1 flex-wrap mb-1">
                  {card.cost.biomass > 0 && <span className="bg-green-600 text-white text-[9px] w-5 h-4 flex items-center justify-center rounded-full font-bold">{card.cost.biomass}</span>}
                  {card.cost.nutrients > 0 && <span className="bg-amber-600 text-white text-[9px] w-5 h-4 flex items-center justify-center rounded-full font-bold">{card.cost.nutrients}</span>}
                  {card.cost.water > 0 && <span className="bg-blue-500 text-white text-[9px] w-5 h-4 flex items-center justify-center rounded-full font-bold">{card.cost.water}</span>}
                </div>
                {/* Requirements */}
                <div className="text-cyan-400/60 text-[8px] mb-0.5">
                  {card.placement.minMoisture !== undefined && `M:${card.placement.minMoisture}-${card.placement.maxMoisture ?? 5} `}
                  {card.placement.minLight !== undefined && `L:${card.placement.minLight}-${card.placement.maxLight ?? 3} `}
                  {card.placement.minNutrients !== undefined && `N:${card.placement.minNutrients}+ `}
                  {card.placement.hexType && card.placement.hexType.join('/')}
                </div>
                <div className="text-slate-500 text-[9px] leading-tight italic line-clamp-2">{card.flavorText || card.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Start Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent">
        <button
          onClick={() => onStartRun(deck)}
          disabled={deck.length < 5}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-bold text-lg transition-colors"
        >
          Start Run ({totalCards} cards)
        </button>
      </div>
    </div>
  );
}

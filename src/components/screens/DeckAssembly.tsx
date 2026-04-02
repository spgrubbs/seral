'use client';

import React, { useState, useMemo } from 'react';
import { Card, Region } from '@/game/types';
import { ALL_CARDS } from '@/game/cards';

interface DeckAssemblyProps {
  region: Region;
  unlockedCardIds: string[];
  suggestedDeck: Card[];
  onStartRun: (deck: Card[]) => void;
  onBack: () => void;
}

const MAX_DECK_SIZE = 20;

export default function DeckAssembly({ region, unlockedCardIds, suggestedDeck, onStartRun, onBack }: DeckAssemblyProps) {
  const [deck, setDeck] = useState<Card[]>(suggestedDeck);
  const [filter, setFilter] = useState<string>('all');

  const availableCards = useMemo(() =>
    ALL_CARDS.filter(c => unlockedCardIds.includes(c.id)),
    [unlockedCardIds]
  );

  const filteredCards = useMemo(() => {
    if (filter === 'all') return availableCards;
    if (filter === 'species') return availableCards.filter(c => c.type === 'species');
    if (filter === 'abiotic') return availableCards.filter(c => c.type === 'abiotic');
    if (filter === 'event') return availableCards.filter(c => c.type === 'event');
    if (filter === 'pioneer') return availableCards.filter(c => c.successionStage === 'pioneer');
    if (filter === 'grassland') return availableCards.filter(c => c.successionStage === 'grassland');
    if (filter === 'woodland') return availableCards.filter(c => c.successionStage === 'woodland');
    return availableCards;
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

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <button onClick={onBack} className="text-slate-400 hover:text-white text-sm">&larr; Map</button>
          <span className="text-emerald-400 font-bold">{deck.length}/{MAX_DECK_SIZE}</span>
        </div>
        <h2 className="text-base font-bold">{region.name} — Deck Assembly</h2>
        <div className="flex gap-2 text-[10px] text-slate-400 mt-1">
          <span>Target: <span className="text-emerald-400 capitalize">{region.targetStage}</span></span>
          <span>|</span>
          <span>Size: <span className="text-white capitalize">{region.mapSize}</span></span>
          <span>|</span>
          <span className="text-amber-300">{region.questDescription}</span>
        </div>
      </div>

      {/* Current Deck (collapsible) */}
      <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-800">
        <div className="text-xs text-slate-400 mb-1">Your Deck ({deck.length})</div>
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
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 px-4 py-2 overflow-x-auto text-[10px]">
        {['all', 'species', 'abiotic', 'event', 'pioneer', 'grassland', 'woodland'].map(f => (
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
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase
                    ${card.type === 'species' ? 'bg-emerald-700 text-white' :
                      card.type === 'abiotic' ? 'bg-stone-600 text-white' : 'bg-purple-600 text-white'}`
                  }>
                    {card.type}
                  </span>
                  {inDeck > 0 && (
                    <span className="text-[9px] text-emerald-400 font-bold">x{inDeck}</span>
                  )}
                </div>
                <div className="text-xs font-semibold mb-1">{card.name}</div>
                <div className="flex gap-1 flex-wrap mb-1">
                  {card.cost.biomass > 0 && (
                    <span className="bg-green-600 text-white text-[9px] px-1 py-0 rounded-full">{card.cost.biomass}B</span>
                  )}
                  {card.cost.nutrients > 0 && (
                    <span className="bg-amber-600 text-white text-[9px] px-1 py-0 rounded-full">{card.cost.nutrients}N</span>
                  )}
                  {card.cost.water > 0 && (
                    <span className="bg-blue-500 text-white text-[9px] px-1 py-0 rounded-full">{card.cost.water}W</span>
                  )}
                  {card.type === 'event' && (
                    <span className="bg-purple-500 text-white text-[9px] px-1 py-0 rounded-full">free</span>
                  )}
                </div>
                <div className="text-slate-500 text-[9px] leading-tight line-clamp-2">{card.description}</div>
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
          Start Run ({deck.length} cards)
        </button>
      </div>
    </div>
  );
}

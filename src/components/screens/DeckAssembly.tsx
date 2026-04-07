'use client';

import React, { useState, useMemo } from 'react';
import { Card, Region, HexTile, hexKey } from '@/game/types';
import { ALL_CARDS, EVENT_CARDS, ABIOTIC_CARDS } from '@/game/cards';
import { getEventCardsForCondition, LOCAL_CONDITION_DESCRIPTIONS } from '@/game/planet';
import { generateHexGrid, deserializeGrid } from '@/game/hex';

interface DeckAssemblyProps {
  region: Region;
  unlockedCardIds: string[];
  unlockedAbioticIds: string[];
  suggestedDeck: Card[];
  onStartRun: (deck: Card[]) => void;
  onBack: () => void;
}

const MAX_DECK_SIZE = 15;

// Simple flat-top hex points
function flatHexPoints(cx: number, cy: number, size: number): string {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    pts.push(`${cx + Math.cos(angle) * size},${cy + Math.sin(angle) * size}`);
  }
  return pts.join(' ');
}

function moistureColor(moisture: number, type: HexTile['type']): string {
  if (type === 'water') return '#1565C0';
  if (type === 'rock') return '#616161';
  const colors = ['#C4A882', '#D2B48C', '#C8B560', '#7CB342', '#4DB6AC', '#1E88E5'];
  return colors[Math.max(0, Math.min(5, moisture))];
}

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

  // Generate or load the map preview
  const previewGrid = useMemo(() => {
    if (region.savedGrid && region.savedGrid.length > 0) {
      return deserializeGrid(region.savedGrid);
    }
    // Generate a preview (won't be saved until run starts)
    const sizeMap: Record<string, number> = { small: 2, medium: 3, large: 4 };
    const radius = sizeMap[region.mapSize] || 3;
    return generateHexGrid(radius, region.baseMoisture, region.baseLight, region.baseNutrients, Date.now(), region.localCondition);
  }, [region]);

  const availableCards = useMemo(() =>
    ALL_CARDS.filter(c => unlockedCardIds.includes(c.id)),
    [unlockedCardIds]
  );

  const filteredCards = useMemo(() => {
    let cards = availableCards;
    if (filter === 'species') cards = cards.filter(c => c.type === 'species');
    if (filter === 'pioneer') cards = cards.filter(c => c.successionStage === 'pioneer');
    if (filter === 'early-seral') cards = cards.filter(c => c.successionStage === 'early-seral');
    if (filter === 'mid-seral') cards = cards.filter(c => c.successionStage === 'mid-seral');
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

  // Compute SVG for map preview
  const mapPreview = useMemo(() => {
    const hexSize = 10;
    const positions: { key: string; px: number; py: number; tile: HexTile }[] = [];
    previewGrid.forEach((tile, key) => {
      const h = hexSize * 2;
      const w = Math.sqrt(3) * hexSize;
      const px = tile.coord.q * (h * 3 / 4);
      const py = tile.coord.r * w + (tile.coord.q % 2 !== 0 ? w / 2 : 0);
      positions.push({ key, px, py, tile });
    });
    if (positions.length === 0) return null;
    const allX = positions.map(p => p.px);
    const allY = positions.map(p => p.py);
    const pad = hexSize * 1.5;
    const minX = Math.min(...allX) - pad;
    const maxX = Math.max(...allX) + pad;
    const minY = Math.min(...allY) - pad;
    const maxY = Math.max(...allY) + pad;
    return { positions, viewBox: `${minX} ${minY} ${maxX - minX} ${maxY - minY}`, hexSize };
  }, [previewGrid]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-slate-400 hover:text-white text-sm">&larr; Map</button>
          <span className="text-emerald-400 font-bold text-sm">{deck.length}/{MAX_DECK_SIZE} species</span>
        </div>
      </div>

      {/* Top Half: Map Preview + Region Info */}
      <div className="bg-slate-900/50 border-b border-slate-800 px-4 py-3" style={{ maxHeight: '42vh', overflow: 'hidden' }}>
        <div className="flex gap-3">
          {/* Map SVG */}
          <div className="flex-1 flex items-center justify-center">
            {mapPreview && (
              <svg viewBox={mapPreview.viewBox} className="w-full" style={{ maxHeight: '28vh' }}>
                {mapPreview.positions.map(({ key, px, py, tile }) => (
                  <polygon
                    key={key}
                    points={flatHexPoints(px, py, mapPreview.hexSize)}
                    fill={moistureColor(tile.moisture, tile.type)}
                    stroke="#37474F"
                    strokeWidth={0.5}
                  />
                ))}
              </svg>
            )}
          </div>

          {/* Region Info */}
          <div className="w-[140px] flex-shrink-0 text-[10px]">
            <h2 className="text-sm font-bold mb-1">{region.name}</h2>
            <div className="text-slate-400 mb-1">
              <span className="capitalize">{region.mapSize}</span> · <span className="capitalize">{region.climateBand}</span>
            </div>
            <div className="text-cyan-300 capitalize mb-1">{region.localCondition.replace('-', ' ')}</div>
            <div className="text-slate-500 text-[9px] italic mb-2">
              {LOCAL_CONDITION_DESCRIPTIONS[region.localCondition]}
            </div>

            {/* Established species */}
            {region.seedBank.length > 0 && (
              <div className="mb-2">
                <div className="text-slate-500 uppercase font-semibold text-[8px] mb-0.5">Established</div>
                {Array.from(new Set(region.seedBank.map(c => c.name))).map(name => (
                  <div key={name} className="text-emerald-400 text-[9px]">{name}</div>
                ))}
              </div>
            )}

            {/* Quest */}
            <div className="text-amber-300 text-[9px]">{region.quest.description}</div>

            {/* Terrain summary */}
            <div className="mt-1 text-slate-500 text-[9px]">
              {previewGrid.size} hexes · M:{region.baseMoisture} L:{region.baseLight} N:{region.baseNutrients}
            </div>
          </div>
        </div>

        {/* Deck chips */}
        <div className="flex flex-wrap gap-1 mt-2">
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
          {mandatoryEvents.map((card, i) => (
            <span key={`evt-${i}`} className="text-[10px] bg-purple-900/30 px-2 py-0.5 rounded border border-purple-700/50 text-purple-300">
              {card.name} <span className="text-purple-500">(auto)</span>
            </span>
          ))}
          {availableAbiotics.map(card => (
            <span key={card.id} className="text-[10px] bg-stone-800/50 px-2 py-0.5 rounded border border-stone-600/50 text-stone-300">
              {card.name} <span className="text-stone-500">(tool)</span>
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Half: Deck Building */}
      {/* Filters */}
      <div className="flex gap-1 px-4 py-2 overflow-x-auto text-[10px]">
        {['all', 'species', 'pioneer', 'early-seral', 'mid-seral', 'climax'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2 py-1 rounded capitalize whitespace-nowrap ${
              filter === f ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {f.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Card Browser */}
      <div className="flex-1 overflow-auto px-4 pb-20">
        <div className="grid grid-cols-2 gap-2 mt-1">
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
                <div className="flex gap-1 flex-wrap mb-1">
                  {card.cost.biomass > 0 && <span className="bg-green-600 text-white text-[9px] w-5 h-4 flex items-center justify-center rounded-full font-bold">{card.cost.biomass}</span>}
                  {card.cost.nutrients > 0 && <span className="bg-amber-600 text-white text-[9px] w-5 h-4 flex items-center justify-center rounded-full font-bold">{card.cost.nutrients}</span>}
                  {card.cost.water > 0 && <span className="bg-blue-500 text-white text-[9px] w-5 h-4 flex items-center justify-center rounded-full font-bold">{card.cost.water}</span>}
                </div>
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

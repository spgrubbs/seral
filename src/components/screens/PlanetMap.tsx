'use client';

import React, { useState } from 'react';
import { Planet, Region, RegionState, Achievement, PlanetStats } from '@/game/types';
import { LOCAL_CONDITION_DESCRIPTIONS, CLIMATE_STAT_DESCRIPTIONS } from '@/game/planet';
import { ABIOTIC_CARDS, ALL_CARDS } from '@/game/cards';

interface PlanetMapProps {
  planet: Planet;
  onSelectRegion: (regionId: string) => void;
  onStartRun: (regionId: string) => void;
  onBack: () => void;
  onPurchaseUpgrade: (upgradeType: string) => void;
  onPurchaseAbiotic: (cardId: string) => void;
  onUnlockCard: (cardId: string) => void;
  cardUnlockCost: number;
}

const STATE_COLORS: Record<RegionState, string> = {
  locked: '#1a1a2e',
  barren: '#8B8378',
  pioneer: '#C4A35A',
  'early-seral': '#7CB342',
  'mid-seral': '#388E3C',
  climax: '#00897B',
  disturbed: '#E57373',
};

const STATE_LABELS: Record<RegionState, string> = {
  locked: 'Locked', barren: 'Barren', pioneer: 'Pioneer',
  'early-seral': 'Early Seral', 'mid-seral': 'Mid Seral', climax: 'Climax', disturbed: 'Disturbed',
};

const BAND_LABELS = ['Polar', 'Temperate', 'Equatorial', 'Equatorial', 'Temperate', 'Polar'];

function ClimateStat({ label, stat, value }: { label: string; stat: string; value: number }) {
  const descriptions = CLIMATE_STAT_DESCRIPTIONS[stat] || {};
  const desc = descriptions[value] || '';
  const pips = [];
  for (let i = 1; i <= 5; i++) {
    const colors: Record<string, string> = {
      o2Density: i <= value ? '#4CAF50' : '#1a2e1a',
      hydrologicalActivity: i <= value ? '#2196F3' : '#1a1a2e',
      thermalBalance: i <= value ? '#f44336' : '#2e1a1a',
    };
    pips.push(
      <div key={i} className="w-4 h-4 rounded" style={{ backgroundColor: colors[stat] || '#333' }} />
    );
  }
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="text-slate-400 w-8 text-right font-semibold">{label}</span>
      <div className="flex gap-0.5">{pips}</div>
      <span className="text-slate-500 text-[10px] italic flex-1">{desc}</span>
    </div>
  );
}

// Flat-top hex SVG points for planet map
function flatHexPoints(cx: number, cy: number, size: number): string {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    pts.push(`${cx + Math.cos(angle) * size},${cy + Math.sin(angle) * size}`);
  }
  return pts.join(' ');
}

const UPGRADE_DEFS = [
  { type: 'freeTurnEnds', name: 'Efficient Metabolism', desc: 'First N turn-ends cost no biomass', maxLevel: 3, costs: [300, 600, 1000] },
  { type: 'startingBiomassBonus', name: 'Biomass Reserves', desc: 'Start runs with +N extra biomass', maxLevel: 3, costs: [200, 400, 800] },
  { type: 'ecologicalDrift', name: 'Ecological Drift', desc: 'Banked species appear +N hexes away', maxLevel: 2, costs: [500, 1000] },
];

/** Describe how planet stats affect local run conditions */
function planetStatEffects(stats: PlanetStats): string[] {
  const effects: string[] = [];
  if (stats.o2Density >= 2) effects.push(`O₂ Lv.${stats.o2Density}: +${stats.o2Density - 1} biomass income per turn`);
  if (stats.hydrologicalActivity >= 2) effects.push(`H₂O Lv.${stats.hydrologicalActivity}: +${stats.hydrologicalActivity - 1} base moisture`);
  if (stats.thermalBalance >= 2) effects.push(`Temp Lv.${stats.thermalBalance}: +${Math.floor((stats.thermalBalance - 1) / 2)} starting biomass`);
  return effects;
}

type MenuPanel = null | 'research' | 'cards' | 'achievements' | 'settings';

export default function PlanetMap({ planet, onSelectRegion, onStartRun, onBack, onPurchaseUpgrade, onPurchaseAbiotic, onUnlockCard, cardUnlockCost }: PlanetMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<MenuPanel>(null);
  const [deckFilter, setDeckFilter] = useState<string>('all');
  const selectedRegion = planet.regions.find(r => r.id === selectedId);

  const hexSize = 20;
  const cols = 7;

  const togglePanel = (panel: MenuPanel) => {
    setActivePanel(prev => prev === panel ? null : panel);
  };

  const globalEffects = planetStatEffects(planet.stats);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white">
      {/* Top Menu Bar */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="flex items-center justify-between px-3 py-1">
          <button onClick={onBack} className="text-slate-400 hover:text-white text-xs">&larr;</button>
          <h1 className="text-sm font-bold text-emerald-400">{planet.name}</h1>
          <span className="text-amber-400 text-xs font-bold">{planet.researchPoints} RP</span>
        </div>
        <div className="flex gap-1 px-2 pb-1.5">
          {([
            { key: 'research' as MenuPanel, label: 'Research', active: 'bg-amber-600', inactive: 'bg-slate-800' },
            { key: 'cards' as MenuPanel, label: 'Deck', active: 'bg-emerald-600', inactive: 'bg-slate-800' },
            { key: 'achievements' as MenuPanel, label: 'Achievements', active: 'bg-purple-600', inactive: 'bg-slate-800' },
            { key: 'settings' as MenuPanel, label: 'Settings', active: 'bg-slate-600', inactive: 'bg-slate-800' },
          ]).map(btn => (
            <button
              key={btn.key}
              onClick={() => togglePanel(btn.key)}
              className={`flex-1 text-[11px] py-1.5 rounded font-semibold ${activePanel === btn.key ? `${btn.active} text-white` : `${btn.inactive} text-slate-400 hover:text-white`}`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Panels */}
      {activePanel === 'research' && (
        <div className="bg-slate-900 border-b border-slate-700 px-4 py-3 max-h-[40vh] overflow-auto">
          <h3 className="text-xs font-bold text-amber-400 mb-2">Research Upgrades</h3>
          <div className="flex flex-col gap-2 mb-3">
            {UPGRADE_DEFS.map(upg => {
              const current = (planet.upgrades as unknown as Record<string, number>)[upg.type] || 0;
              const nextCost = current < upg.maxLevel ? upg.costs[current] : null;
              return (
                <div key={upg.type} className="flex items-center justify-between bg-slate-800 rounded px-3 py-2">
                  <div>
                    <div className="text-xs font-semibold">{upg.name} <span className="text-slate-500">Lv.{current}/{upg.maxLevel}</span></div>
                    <div className="text-[10px] text-slate-400">{upg.desc.replace('N', String(current + 1))}</div>
                  </div>
                  {nextCost ? (
                    <button
                      onClick={() => onPurchaseUpgrade(upg.type)}
                      disabled={planet.researchPoints < nextCost}
                      className="text-[10px] px-2 py-1 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded font-bold"
                    >
                      {nextCost} RP
                    </button>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-bold">MAX</span>
                  )}
                </div>
              );
            })}
          </div>
          <h3 className="text-xs font-bold text-amber-400 mb-2">Abiotic Tools <span className="text-slate-500 font-normal">(consumable)</span></h3>
          <div className="flex flex-col gap-1">
            {ABIOTIC_CARDS.map(card => {
              const owned = planet.upgrades.unlockedAbioticIds.includes(card.id);
              return (
                <div key={card.id} className="flex items-center justify-between bg-slate-800 rounded px-3 py-1.5">
                  <div>
                    <span className="text-xs font-semibold">{card.name}</span>
                    <span className="text-[10px] text-slate-400 ml-2">{card.description}</span>
                  </div>
                  {owned ? (
                    <span className="text-[10px] text-emerald-400 font-bold">Owned</span>
                  ) : (
                    <button
                      onClick={() => onPurchaseAbiotic(card.id)}
                      disabled={planet.researchPoints < (card.rpCost || 0)}
                      className="text-[10px] px-2 py-1 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded font-bold"
                    >
                      {card.rpCost} RP
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activePanel === 'cards' && (() => {
        const lockableCards = ALL_CARDS.filter(c => c.locked);
        const filtered = lockableCards.filter(card => {
          const unlocked = planet.unlockedCardIds.includes(card.id);
          if (deckFilter === 'owned' && !unlocked) return false;
          if (deckFilter === 'unowned' && unlocked) return false;
          if (deckFilter === 'pioneer' && card.successionStage !== 'pioneer') return false;
          if (deckFilter === 'early-seral' && card.successionStage !== 'early-seral') return false;
          if (deckFilter === 'mid-seral' && card.successionStage !== 'mid-seral') return false;
          if (deckFilter === 'climax' && card.successionStage !== 'climax') return false;
          return true;
        });
        return (
        <div className="bg-slate-900 border-b border-slate-700 px-4 py-3 max-h-[40vh] overflow-auto">
          <h3 className="text-xs font-bold text-emerald-400 mb-2">Species Cards <span className="text-slate-500 font-normal">({cardUnlockCost} RP to unlock)</span></h3>
          <div className="flex gap-1 mb-2 overflow-x-auto text-[9px]">
            {['all', 'owned', 'unowned', 'pioneer', 'early-seral', 'mid-seral', 'climax'].map(f => (
              <button
                key={f}
                onClick={() => setDeckFilter(f)}
                className={`px-2 py-1 rounded capitalize whitespace-nowrap ${
                  deckFilter === f ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {f.replace('-', ' ')}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {filtered.map(card => {
              const unlocked = planet.unlockedCardIds.includes(card.id);
              return (
                <div key={card.id} className={`rounded px-3 py-2 border ${unlocked ? 'bg-emerald-950/30 border-emerald-700/50' : 'bg-slate-800 border-slate-700'}`}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold">{card.name}</span>
                    <span className="text-[8px] uppercase bg-slate-700 text-slate-400 px-1 py-0.5 rounded">{card.successionStage}</span>
                  </div>
                  <div className="text-[9px] text-slate-500 mb-1 italic">{card.flavorText || card.description}</div>
                  <div className="flex gap-1 mb-1">
                    {card.cost.biomass > 0 && <span className="bg-green-600 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{card.cost.biomass}</span>}
                    {card.cost.nutrients > 0 && <span className="bg-amber-600 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{card.cost.nutrients}</span>}
                    {card.cost.water > 0 && <span className="bg-blue-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{card.cost.water}</span>}
                    {(card.incomePerTurn.biomass > 0 || card.incomePerTurn.nutrients > 0 || card.incomePerTurn.water > 0) && (
                      <span className="text-emerald-400 text-[8px] ml-1">
                        {card.incomePerTurn.biomass > 0 && `+${card.incomePerTurn.biomass}B `}
                        {card.incomePerTurn.nutrients > 0 && `+${card.incomePerTurn.nutrients}N `}
                        {card.incomePerTurn.water > 0 && `+${card.incomePerTurn.water}W `}
                        /turn
                      </span>
                    )}
                  </div>
                  {unlocked ? (
                    <span className="text-[10px] text-emerald-400 font-bold">Owned</span>
                  ) : (
                    <button
                      onClick={() => onUnlockCard(card.id)}
                      disabled={planet.researchPoints < cardUnlockCost}
                      className="text-[10px] px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded font-bold w-full"
                    >
                      Unlock ({cardUnlockCost} RP)
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="text-slate-500 text-xs text-center py-4 italic">No cards match this filter.</div>
          )}
        </div>
        );
      })()}

      {activePanel === 'achievements' && (
        <div className="bg-slate-900 border-b border-slate-700 px-4 py-3 max-h-[40vh] overflow-auto">
          <h3 className="text-xs font-bold text-purple-400 mb-2">Achievements</h3>
          <div className="flex flex-col gap-1.5">
            {planet.achievements.map(ach => (
              <div key={ach.id} className={`flex items-center justify-between px-3 py-1.5 rounded ${ach.completed ? 'bg-emerald-950/30 border border-emerald-700/30' : 'bg-slate-800 border border-slate-700/50'}`}>
                <div>
                  <div className="text-xs font-semibold">
                    {ach.completed && <span className="text-emerald-400 mr-1">✓</span>}
                    {ach.name}
                  </div>
                  <div className="text-[10px] text-slate-400">{ach.description}</div>
                </div>
                <span className={`text-[10px] font-bold ${ach.completed ? 'text-emerald-400' : 'text-amber-400'}`}>+{ach.reward} RP</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activePanel === 'settings' && (
        <div className="bg-slate-900 border-b border-slate-700 px-4 py-3 max-h-[40vh] overflow-auto">
          <h3 className="text-xs font-bold text-slate-300 mb-2">Planet Info</h3>
          <div className="text-[10px] text-slate-400 mb-2">
            {planet.runsCompleted} runs | {planet.regions.filter(r => r.state === 'climax').length}/{planet.regions.length} climax
          </div>
          <div className="flex flex-col gap-1 mb-3">
            <ClimateStat label="O₂" stat="o2Density" value={planet.stats.o2Density} />
            <ClimateStat label="H₂O" stat="hydrologicalActivity" value={planet.stats.hydrologicalActivity} />
            <ClimateStat label="Temp" stat="thermalBalance" value={planet.stats.thermalBalance} />
          </div>
          {globalEffects.length > 0 && (
            <div className="mb-2">
              <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Global Effects on Runs</div>
              {globalEffects.map((e, i) => (
                <div key={i} className="text-[10px] text-cyan-300 mb-0.5">{e}</div>
              ))}
            </div>
          )}
          {globalEffects.length === 0 && (
            <div className="text-[10px] text-slate-600 italic">Advance regions to improve global parameters.</div>
          )}
        </div>
      )}

      {/* Hex Map — single SVG with proper flat-top odd-q offset */}
      <div className="flex-1 overflow-auto relative flex items-center justify-center">
        {(() => {
          // Compute pixel positions for all regions using flat-top odd-q offset
          const h = hexSize * 2;
          const w = Math.sqrt(3) * hexSize;
          const positions = planet.regions.map(region => {
            const px = region.coord.q * (h * 3 / 4);
            const py = region.coord.r * w + (region.coord.q % 2 !== 0 ? w / 2 : 0);
            return { region, px, py };
          });
          const allX = positions.map(p => p.px);
          const allY = positions.map(p => p.py);
          const pad = hexSize * 1.5;
          const svgMinX = Math.min(...allX) - pad;
          const svgMaxX = Math.max(...allX) + pad;
          const svgMinY = Math.min(...allY) - pad;
          const svgMaxY = Math.max(...allY) + pad;
          const svgW = svgMaxX - svgMinX;
          const svgH = svgMaxY - svgMinY;

          return (
            <svg viewBox={`${svgMinX} ${svgMinY} ${svgW} ${svgH}`} className="w-full h-full" style={{ maxHeight: '55vh' }}>
              {/* Band labels */}
              {BAND_LABELS.map((label, rowIdx) => {
                if (rowIdx > 2) return null;
                const rowRegion = positions.find(p => p.region.coord.r === rowIdx && p.region.coord.q === 0);
                if (!rowRegion) return null;
                return (
                  <text key={`band-${rowIdx}`} x={rowRegion.px - hexSize * 2} y={rowRegion.py + 3} fontSize="6" fill="#475569" textAnchor="end">
                    {label}
                  </text>
                );
              })}
              {positions.map(({ region, px, py }) => {
                const isSelected = selectedId === region.id;
                return (
                  <g
                    key={region.id}
                    onClick={() => { setSelectedId(region.id); onSelectRegion(region.id); }}
                    className={`cursor-pointer ${region.state === 'locked' ? 'opacity-40' : ''}`}
                  >
                    <polygon
                      points={flatHexPoints(px, py, hexSize)}
                      fill={STATE_COLORS[region.state]}
                      stroke={isSelected ? '#00BCD4' : '#37474F'}
                      strokeWidth={isSelected ? 2 : 0.5}
                    />
                    {region.state === 'climax' && (
                      <circle cx={px} cy={py} r={3} fill="white" opacity="0.6" />
                    )}
                    {region.state === 'disturbed' && (
                      <text x={px} y={py + 4} textAnchor="middle" fontSize="12" fill="white" fontWeight="bold">!</text>
                    )}
                  </g>
                );
              })}
            </svg>
          );
        })()}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 justify-center py-1.5 text-[9px] bg-slate-950">
        {Object.entries(STATE_COLORS).map(([state, color]) => (
          <div key={state} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
            <span className="text-slate-500 capitalize">{state.replace('-', ' ')}</span>
          </div>
        ))}
      </div>

      {/* Region Detail Panel */}
      {selectedRegion && (
        <div className="bg-slate-900 border-t border-slate-700 p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold">{selectedRegion.name}</h2>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: STATE_COLORS[selectedRegion.state], color: 'white' }}
            >
              {STATE_LABELS[selectedRegion.state]}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400 mb-2">
            <div>Climate: <span className="text-white capitalize">{selectedRegion.climateBand}</span></div>
            <div>Map Size: <span className="text-white capitalize">{selectedRegion.mapSize}</span></div>
            <div>Seed Bank: <span className="text-white">{selectedRegion.seedBank.length} species</span></div>
            <div>Condition: <span className="text-cyan-300 capitalize">{selectedRegion.localCondition.replace('-', ' ')}</span></div>
          </div>
          <div className="text-[10px] text-slate-500 mb-1 italic">
            {LOCAL_CONDITION_DESCRIPTIONS[selectedRegion.localCondition]}
          </div>
          {/* Show global parameter effects on this region */}
          {globalEffects.length > 0 && (
            <div className="text-[10px] text-cyan-400/70 mb-1">
              Global: {globalEffects.join(' · ')}
            </div>
          )}
          <div className="text-xs text-amber-300 mb-3">
            Quest: {selectedRegion.quest.description}
          </div>
          {selectedRegion.state !== 'locked' ? (
            <button
              onClick={() => onStartRun(selectedRegion.id)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors"
            >
              Begin Run
            </button>
          ) : (
            <div className="text-center text-slate-600 text-sm py-2">Region is locked. Advance adjacent regions first.</div>
          )}
        </div>
      )}
    </div>
  );
}

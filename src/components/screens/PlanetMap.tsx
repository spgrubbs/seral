'use client';

import React, { useState } from 'react';
import { Planet, Region, RegionState, Achievement } from '@/game/types';
import { LOCAL_CONDITION_DESCRIPTIONS, CLIMATE_STAT_DESCRIPTIONS } from '@/game/planet';
import { ABIOTIC_CARDS } from '@/game/cards';

interface PlanetMapProps {
  planet: Planet;
  onSelectRegion: (regionId: string) => void;
  onStartRun: (regionId: string) => void;
  onBack: () => void;
  onPurchaseUpgrade: (upgradeType: string) => void;
  onPurchaseAbiotic: (cardId: string) => void;
}

const STATE_COLORS: Record<RegionState, string> = {
  locked: '#1a1a2e',
  barren: '#8B8378',
  pioneer: '#C4A35A',
  grassland: '#7CB342',
  woodland: '#388E3C',
  climax: '#00897B',
  disturbed: '#E57373',
};

const STATE_LABELS: Record<RegionState, string> = {
  locked: 'Locked', barren: 'Barren', pioneer: 'Pioneer',
  grassland: 'Grassland', woodland: 'Woodland', climax: 'Climax', disturbed: 'Disturbed',
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
  { type: 'freeTurnEnds', name: 'Efficient Metabolism', desc: 'First N turn-ends cost no biomass', maxLevel: 3, costs: [20, 50, 100] },
  { type: 'startingBiomassBonus', name: 'Biomass Reserves', desc: 'Start runs with +N extra biomass', maxLevel: 3, costs: [15, 40, 80] },
  { type: 'ecologicalDrift', name: 'Ecological Drift', desc: 'Banked species appear +N hexes away', maxLevel: 2, costs: [30, 70] },
];

export default function PlanetMap({ planet, onSelectRegion, onStartRun, onBack, onPurchaseUpgrade, onPurchaseAbiotic }: PlanetMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showShop, setShowShop] = useState(false);
  const selectedRegion = planet.regions.find(r => r.id === selectedId);

  const hexSize = 20;
  const cols = 7;

  // Next 3 incomplete achievements
  const nextAchievements = planet.achievements.filter(a => !a.completed).slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <button onClick={onBack} className="text-slate-400 hover:text-white text-sm">&larr; Menu</button>
        <div className="text-center">
          <h1 className="text-lg font-bold text-emerald-400">{planet.name}</h1>
          <p className="text-[10px] text-slate-500">
            {planet.runsCompleted} runs | {planet.regions.filter(r => r.state === 'climax').length}/{planet.regions.length} climax
          </p>
        </div>
        <button
          onClick={() => setShowShop(!showShop)}
          className="flex items-center gap-1"
        >
          <span className="text-amber-400 text-sm font-bold">{planet.researchPoints}</span>
          <span className="text-slate-500 text-[10px]">RP</span>
          <span className="text-slate-500 text-[10px]">{showShop ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* Research Shop (toggleable) */}
      {showShop && (
        <div className="bg-slate-900 border-b border-slate-700 px-4 py-3 animate-slide-up">
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
          <h3 className="text-xs font-bold text-amber-400 mb-2">Abiotic Tools <span className="text-slate-500 font-normal">(consumable, one-time use per run)</span></h3>
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

      {/* Climate Stats */}
      <div className="px-4 py-2 bg-slate-900/50 flex flex-col gap-1">
        <ClimateStat label="O₂" stat="o2Density" value={planet.stats.o2Density} />
        <ClimateStat label="H₂O" stat="hydrologicalActivity" value={planet.stats.hydrologicalActivity} />
        <ClimateStat label="Temp" stat="thermalBalance" value={planet.stats.thermalBalance} />
      </div>

      {/* Achievements */}
      {nextAchievements.length > 0 && (
        <div className="px-4 py-1.5 bg-slate-900/30 border-b border-slate-800 flex gap-2 overflow-x-auto">
          {nextAchievements.map(ach => (
            <div key={ach.id} className="flex-shrink-0 bg-slate-800/50 rounded px-2 py-1 border border-slate-700/50">
              <div className="text-[10px] text-amber-300 font-semibold">{ach.name}</div>
              <div className="text-[9px] text-slate-400">{ach.description} <span className="text-amber-400">+{ach.reward}RP</span></div>
            </div>
          ))}
        </div>
      )}

      {/* Hex Map with planet background */}
      <div className="flex-1 overflow-auto relative">
        {/* Planet background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <svg viewBox="0 0 200 200" width="300" height="300">
            <defs>
              <radialGradient id="planet-bg" cx="40%" cy="35%">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="40%" stopColor="#166534" />
                <stop offset="70%" stopColor="#064e3b" />
                <stop offset="100%" stopColor="#022c22" />
              </radialGradient>
              <radialGradient id="atmosphere" cx="50%" cy="50%">
                <stop offset="80%" stopColor="transparent" />
                <stop offset="95%" stopColor="#34d399" stopOpacity="0.2" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="90" fill="url(#planet-bg)" />
            <circle cx="100" cy="100" r="95" fill="url(#atmosphere)" />
            {/* Surface features */}
            <ellipse cx="70" cy="60" rx="25" ry="10" fill="#065f46" opacity="0.4" />
            <ellipse cx="120" cy="90" rx="30" ry="8" fill="#0d4a3b" opacity="0.3" />
            <ellipse cx="90" cy="130" rx="20" ry="12" fill="#1565C0" opacity="0.2" />
          </svg>
        </div>

        <div className="relative z-10 p-4 flex flex-col items-center gap-0">
          {BAND_LABELS.map((bandLabel, rowIdx) => {
            const rowRegions = planet.regions
              .filter(r => r.coord.r === rowIdx)
              .sort((a, b) => a.coord.q - b.coord.q);
            const isOddRow = rowIdx % 2 !== 0;

            return (
              <div key={rowIdx} className="flex items-center" style={{ marginTop: rowIdx === 0 ? 0 : -6 }}>
                {(rowIdx === 0 || rowIdx === 1 || rowIdx === 2) ? (
                  <span className="text-[8px] text-slate-600 w-14 text-right mr-1">{bandLabel}</span>
                ) : (
                  <span className="w-14 mr-1" />
                )}
                <svg
                  width={cols * hexSize * 1.55 + (isOddRow ? hexSize * 0.75 : 0) + hexSize}
                  height={hexSize * 1.8}
                  className="overflow-visible"
                >
                  {rowRegions.map(region => {
                    const cx = region.coord.q * hexSize * 1.55 + hexSize + (isOddRow ? hexSize * 0.75 : 0);
                    const cy = hexSize;
                    const isSelected = selectedId === region.id;
                    return (
                      <g
                        key={region.id}
                        onClick={() => { setSelectedId(region.id); onSelectRegion(region.id); }}
                        className={`cursor-pointer ${region.state === 'locked' ? 'opacity-40' : ''}`}
                      >
                        <polygon
                          points={flatHexPoints(cx, cy, hexSize)}
                          fill={STATE_COLORS[region.state]}
                          stroke={isSelected ? '#00BCD4' : '#37474F'}
                          strokeWidth={isSelected ? 2 : 0.5}
                        />
                        {region.state === 'climax' && (
                          <circle cx={cx} cy={cy} r={3} fill="white" opacity="0.6" />
                        )}
                        {region.state === 'disturbed' && (
                          <text x={cx} y={cy + 4} textAnchor="middle" fontSize="12" fill="white" fontWeight="bold">!</text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            );
          })}

          {/* Legend */}
          <div className="flex flex-wrap gap-2 justify-center mt-3 text-[9px]">
            {Object.entries(STATE_COLORS).map(([state, color]) => (
              <div key={state} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                <span className="text-slate-500 capitalize">{state}</span>
              </div>
            ))}
          </div>
        </div>
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
          <div className="text-[10px] text-slate-500 mb-2 italic">
            {LOCAL_CONDITION_DESCRIPTIONS[selectedRegion.localCondition]}
          </div>
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

'use client';

import React, { useState } from 'react';
import { Planet, Region, RegionState } from '@/game/types';

interface PlanetMapProps {
  planet: Planet;
  onSelectRegion: (regionId: string) => void;
  onStartRun: (regionId: string) => void;
  onBack: () => void;
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
  locked: 'Locked',
  barren: 'Barren',
  pioneer: 'Pioneer',
  grassland: 'Grassland',
  woodland: 'Woodland',
  climax: 'Climax',
  disturbed: 'Disturbed',
};

function ClimateGauge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-400 w-10 text-right">{label}</span>
      <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${(value / 5) * 100}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-slate-500 w-4">{value}</span>
    </div>
  );
}

export default function PlanetMap({ planet, onSelectRegion, onStartRun, onBack }: PlanetMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedRegion = planet.regions.find(r => r.id === selectedId);

  const cols = 8;
  const hexW = 42;
  const hexH = 36;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <button onClick={onBack} className="text-slate-400 hover:text-white text-sm">
          &larr; Menu
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold text-emerald-400">{planet.name}</h1>
          <p className="text-[10px] text-slate-500">
            {planet.runsCompleted} runs | {planet.regions.filter(r => r.state === 'climax').length}/{planet.regions.length} climax
          </p>
        </div>
        <div className="text-right">
          <span className="text-amber-400 text-sm font-bold">{planet.researchPoints}</span>
          <span className="text-slate-500 text-[10px] ml-1">RP</span>
        </div>
      </div>

      {/* Climate Gauges */}
      <div className="px-4 py-2 bg-slate-900/50 flex flex-col gap-1">
        <ClimateGauge label="O2" value={planet.stats.o2Density} color="#4CAF50" />
        <ClimateGauge label="H2O" value={planet.stats.hydrologicalActivity} color="#2196F3" />
        <ClimateGauge label="Temp" value={planet.stats.thermalBalance} color="#f44336" />
      </div>

      {/* Hex Map */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex flex-col items-center">
          {/* Climate band labels */}
          {['Polar', 'Temperate', 'Temperate', 'Equatorial', 'Equatorial'].map((band, rowIdx) => (
            <div key={rowIdx} className="flex items-center gap-1 mb-0.5">
              {rowIdx === 0 || rowIdx === 1 || rowIdx === 3 ? (
                <span className="text-[8px] text-slate-600 w-12 text-right mr-1">{band}</span>
              ) : (
                <span className="w-12 mr-1" />
              )}
              <div className="flex gap-1" style={{ marginLeft: rowIdx % 2 !== 0 ? hexW / 2 : 0 }}>
                {planet.regions
                  .filter(r => r.coord.r === rowIdx)
                  .sort((a, b) => a.coord.q - b.coord.q)
                  .map(region => (
                    <button
                      key={region.id}
                      onClick={() => {
                        setSelectedId(region.id);
                        onSelectRegion(region.id);
                      }}
                      className={`
                        relative transition-all
                        ${selectedId === region.id ? 'ring-2 ring-cyan-400 scale-110 z-10' : ''}
                        ${region.state === 'locked' ? 'opacity-40' : 'hover:scale-105'}
                      `}
                      style={{ width: hexW, height: hexH }}
                    >
                      <svg viewBox="0 0 42 36" width={hexW} height={hexH}>
                        <polygon
                          points="21,0 42,9 42,27 21,36 0,27 0,9"
                          fill={STATE_COLORS[region.state]}
                          stroke={selectedId === region.id ? '#00BCD4' : '#37474F'}
                          strokeWidth={selectedId === region.id ? 2 : 0.5}
                        />
                        {region.state === 'climax' && (
                          <circle cx="21" cy="18" r="3" fill="white" opacity="0.6" />
                        )}
                        {region.state === 'disturbed' && (
                          <text x="21" y="22" textAnchor="middle" fontSize="14" fill="white" fontWeight="bold">!</text>
                        )}
                      </svg>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 justify-center mt-4 text-[9px]">
          {Object.entries(STATE_COLORS).map(([state, color]) => (
            <div key={state} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
              <span className="text-slate-500 capitalize">{state}</span>
            </div>
          ))}
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
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400 mb-3">
            <div>Climate: <span className="text-white capitalize">{selectedRegion.climateBand}</span></div>
            <div>Target: <span className="text-emerald-400 capitalize">{selectedRegion.targetStage}</span></div>
            <div>Map Size: <span className="text-white capitalize">{selectedRegion.mapSize}</span></div>
            <div>Seed Bank: <span className="text-white">{selectedRegion.seedBank.length} species</span></div>
          </div>
          <div className="text-xs text-amber-300 mb-3 italic">Quest: {selectedRegion.questDescription}</div>
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

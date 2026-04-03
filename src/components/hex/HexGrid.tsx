'use client';

import React, { useMemo, useState } from 'react';
import { HexTile, HexCoord, hexKey, Card } from '@/game/types';
import { CardSprite } from './Sprites';

interface HexGridProps {
  grid: Map<string, HexTile>;
  selectedCard: Card | null;
  validPlacements: Set<string>;
  onHexClick: (coord: HexCoord) => void;
  hexSize: number;
}

function clampNum(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function moistureColor(moisture: number, type: HexTile['type']): string {
  if (type === 'water') return '#1565C0';
  if (type === 'rock') return '#616161';
  if (type === 'frozen') return '#B3E5FC';
  const colors = ['#C4A882', '#D2B48C', '#C8B560', '#7CB342', '#4DB6AC', '#1E88E5'];
  return colors[clampNum(moisture, 0, 5)];
}

function moistureLabel(m: number): string {
  const labels = ['Bone Dry', 'Arid', 'Dry', 'Moderate', 'Moist', 'Submerged'];
  return labels[clampNum(m, 0, 5)];
}

function lightLabel(l: number): string {
  if (l >= 3) return 'Full Sun';
  if (l === 2) return 'Partial';
  return 'Shade';
}

function lightIcon(light: number): React.ReactNode {
  if (light === 3) return <circle cx="0" cy="0" r="3" fill="#FFC107" />;
  if (light === 2) return <path d="M0,-3 A3,3 0 0,1 0,3 Z" fill="#FFD54F" />;
  return <path d="M1,-3 A3,3 0 0,1 1,3 A1.5,1.5 0 0,0 1,-3" fill="#FFF59D" />;
}

function nutrientChevrons(nutrients: number): React.ReactNode {
  const chevs = [];
  for (let i = 0; i < Math.min(nutrients, 5); i++) {
    chevs.push(
      <text
        key={i}
        x={-8 + i * 4}
        y={0}
        fontSize="7"
        fill="#FF8F00"
        fontWeight="bold"
      >
        ›
      </text>
    );
  }
  return <g>{chevs}</g>;
}

/** Flat-top hex pixel position for snug tiling with offset (odd-q) coords.
 *  Y-axis is inverted so that grid row 0 appears at the bottom. */
function flatHexToPixel(coord: HexCoord, size: number, maxR: number): { x: number; y: number } {
  const w = size * 2;
  const h = Math.sqrt(3) * size;
  const x = coord.q * (w * 3 / 4);
  // Invert r so that higher r values go UP visually
  const invertedR = maxR - coord.r;
  const y = invertedR * h + (coord.q % 2 !== 0 ? h / 2 : 0);
  return { x, y };
}

export default function HexGrid({ grid, selectedCard, validPlacements, onHexClick, hexSize }: HexGridProps) {
  const tiles = useMemo(() => Array.from(grid.values()), [grid]);
  const [hoveredHex, setHoveredHex] = useState<string | null>(null);

  // Find max r value for y-axis inversion
  const maxR = useMemo(() => Math.max(...tiles.map(t => t.coord.r)), [tiles]);

  // Calculate bounds for viewBox
  const positions = tiles.map(t => flatHexToPixel(t.coord, hexSize, maxR));
  const pad = hexSize * 1.5;
  const minX = Math.min(...positions.map(p => p.x)) - pad;
  const maxX = Math.max(...positions.map(p => p.x)) + pad;
  const minY = Math.min(...positions.map(p => p.y)) - pad;
  const maxY = Math.max(...positions.map(p => p.y)) + pad;
  const width = maxX - minX;
  const height = maxY - minY;

  // Flat-top hex path
  const hexPath = useMemo(() => {
    const s = hexSize;
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i);
      points.push(`${Math.cos(angle) * s},${Math.sin(angle) * s}`);
    }
    return `M${points.join('L')}Z`;
  }, [hexSize]);

  const hoveredTile = hoveredHex ? grid.get(hoveredHex) : null;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        viewBox={`${minX} ${minY} ${width} ${height}`}
        className="w-full h-full touch-manipulation"
        style={{ maxHeight: '55vh' }}
      >
        {tiles.map(tile => {
          const pos = flatHexToPixel(tile.coord, hexSize, maxR);
          const key = hexKey(tile.coord);
          const isValid = validPlacements.has(key);
          const isHovered = hoveredHex === key;
          const fillColor = moistureColor(tile.moisture, tile.type);

          return (
            <g
              key={key}
              transform={`translate(${pos.x}, ${pos.y})`}
              onClick={() => onHexClick(tile.coord)}
              onMouseEnter={() => setHoveredHex(key)}
              onMouseLeave={() => setHoveredHex(null)}
              onTouchStart={() => setHoveredHex(key)}
              className="cursor-pointer"
            >
              {/* Hex background */}
              <path
                d={hexPath}
                fill={fillColor}
                stroke={isValid ? '#00BCD4' : isHovered ? '#90CAF9' : '#37474F'}
                strokeWidth={isValid ? 2.5 : isHovered ? 2 : 1}
                opacity={isValid ? 1 : 0.85}
              />

              {/* Light icon (top-right) */}
              <g transform={`translate(${hexSize * 0.45}, ${-hexSize * 0.35})`}>
                {lightIcon(tile.light)}
              </g>

              {/* Nutrient chevrons (bottom) */}
              <g transform={`translate(0, ${hexSize * 0.45})`}>
                {nutrientChevrons(tile.nutrients)}
              </g>

              {/* Placed card sprite */}
              {tile.placedCard && (
                <CardSprite sprite={tile.placedCard.card.sprite} size={hexSize / 30} />
              )}

              {/* Water/rock icon */}
              {tile.type === 'water' && !tile.placedCard && (
                <text x="0" y="2" textAnchor="middle" fontSize="12" fill="white" opacity="0.5">~</text>
              )}
              {tile.type === 'rock' && !tile.placedCard && (
                <text x="0" y="2" textAnchor="middle" fontSize="10" fill="white" opacity="0.5">◆</text>
              )}

              {/* Valid placement highlight */}
              {isValid && (
                <path
                  d={hexPath}
                  fill="rgba(0, 188, 212, 0.15)"
                  stroke="none"
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Hex tooltip — no coordinates shown */}
      {hoveredTile && (
        <div className="absolute bottom-2 left-2 right-2 bg-slate-900/95 border border-slate-700 rounded-lg p-2.5 text-xs z-40 pointer-events-none animate-fade-in">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 capitalize text-slate-300">
              {hoveredTile.type}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-1.5">
            <div>
              <span className="text-blue-400">Moisture:</span>{' '}
              <span className="text-white font-bold">{hoveredTile.moisture}</span>
              <span className="text-slate-500 text-[10px] ml-0.5">({moistureLabel(hoveredTile.moisture)})</span>
            </div>
            <div>
              <span className="text-yellow-400">Light:</span>{' '}
              <span className="text-white font-bold">{hoveredTile.light}</span>
              <span className="text-slate-500 text-[10px] ml-0.5">({lightLabel(hoveredTile.light)})</span>
            </div>
            <div>
              <span className="text-amber-400">Nutrients:</span>{' '}
              <span className="text-white font-bold">{hoveredTile.nutrients}</span>
            </div>
          </div>
          {hoveredTile.placedCard && (
            <div className="border-t border-slate-700 pt-1.5 mt-1">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-semibold">{hoveredTile.placedCard.card.name}</span>
                <span className="text-slate-500 text-[10px]">
                  {hoveredTile.placedCard.turnsActive} turns active
                </span>
              </div>
              <div className="text-slate-400 text-[10px] mt-0.5">{hoveredTile.placedCard.card.description}</div>
              {(hoveredTile.placedCard.card.incomePerTurn.biomass > 0 ||
                hoveredTile.placedCard.card.incomePerTurn.nutrients > 0 ||
                hoveredTile.placedCard.card.incomePerTurn.water > 0) && (
                <div className="text-emerald-400 text-[10px] mt-0.5">
                  Income:{' '}
                  {hoveredTile.placedCard.card.incomePerTurn.biomass > 0 && `+${hoveredTile.placedCard.card.incomePerTurn.biomass}B `}
                  {hoveredTile.placedCard.card.incomePerTurn.nutrients > 0 && `+${hoveredTile.placedCard.card.incomePerTurn.nutrients}N `}
                  {hoveredTile.placedCard.card.incomePerTurn.water > 0 && `+${hoveredTile.placedCard.card.incomePerTurn.water}W`}
                  /turn
                </div>
              )}
              {hoveredTile.placedCard.card.adjacencyEffect && (
                <div className="text-cyan-400 text-[10px] mt-0.5">
                  Adj. effect:{' '}
                  {hoveredTile.placedCard.card.adjacencyEffect.biomassPerTurn ? `+${hoveredTile.placedCard.card.adjacencyEffect.biomassPerTurn}B/turn ` : ''}
                  {hoveredTile.placedCard.card.adjacencyEffect.nutrientsPerTurn ? `+${hoveredTile.placedCard.card.adjacencyEffect.nutrientsPerTurn}N/turn ` : ''}
                  {hoveredTile.placedCard.card.adjacencyEffect.moisture ? `moisture ${hoveredTile.placedCard.card.adjacencyEffect.moisture > 0 ? '+' : ''}${hoveredTile.placedCard.card.adjacencyEffect.moisture} ` : ''}
                  {hoveredTile.placedCard.card.adjacencyEffect.light ? `light ${hoveredTile.placedCard.card.adjacencyEffect.light > 0 ? '+' : ''}${hoveredTile.placedCard.card.adjacencyEffect.light} ` : ''}
                  to neighbors
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

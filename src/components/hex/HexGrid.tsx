'use client';

import React, { useMemo } from 'react';
import { HexTile, HexCoord, hexKey, Card } from '@/game/types';
import { hexToPixel, getValidPlacements } from '@/game/hex';
import { CardSprite } from './Sprites';

interface HexGridProps {
  grid: Map<string, HexTile>;
  selectedCard: Card | null;
  validPlacements: Set<string>;
  onHexClick: (coord: HexCoord) => void;
  hexSize: number;
}

function moistureColor(moisture: number, type: HexTile['type']): string {
  if (type === 'water') return '#1565C0';
  if (type === 'rock') return '#616161';
  if (type === 'frozen') return '#B3E5FC';
  const colors = ['#D2B48C', '#C8B560', '#7CB342', '#4DB6AC', '#1E88E5'];
  return colors[Math.min(moisture - 1, 4)];
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

export default function HexGrid({ grid, selectedCard, validPlacements, onHexClick, hexSize }: HexGridProps) {
  const tiles = useMemo(() => Array.from(grid.values()), [grid]);

  // Calculate bounds for viewBox
  const positions = tiles.map(t => hexToPixel(t.coord, hexSize));
  const minX = Math.min(...positions.map(p => p.x)) - hexSize * 1.5;
  const maxX = Math.max(...positions.map(p => p.x)) + hexSize * 1.5;
  const minY = Math.min(...positions.map(p => p.y)) - hexSize * 1.5;
  const maxY = Math.max(...positions.map(p => p.y)) + hexSize * 1.5;
  const width = maxX - minX;
  const height = maxY - minY;

  // Pointy-top hex path
  const hexPath = useMemo(() => {
    const s = hexSize;
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      points.push(`${Math.cos(angle) * s},${Math.sin(angle) * s}`);
    }
    return `M${points.join('L')}Z`;
  }, [hexSize]);

  return (
    <svg
      viewBox={`${minX} ${minY} ${width} ${height}`}
      className="w-full h-full touch-manipulation"
      style={{ maxHeight: '60vh' }}
    >
      {tiles.map(tile => {
        const pos = hexToPixel(tile.coord, hexSize);
        const key = hexKey(tile.coord);
        const isValid = validPlacements.has(key);
        const fillColor = moistureColor(tile.moisture, tile.type);

        return (
          <g
            key={key}
            transform={`translate(${pos.x}, ${pos.y})`}
            onClick={() => onHexClick(tile.coord)}
            className="cursor-pointer"
          >
            {/* Hex background */}
            <path
              d={hexPath}
              fill={fillColor}
              stroke={isValid ? '#00BCD4' : '#37474F'}
              strokeWidth={isValid ? 2.5 : 1}
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
  );
}

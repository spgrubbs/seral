'use client';

import React from 'react';

const sprites: Record<string, React.ReactNode> = {
  lichen: (
    <g>
      <circle cx="0" cy="0" r="6" fill="#8B9A46" opacity="0.8" />
      <circle cx="-3" cy="-2" r="3" fill="#A8B85C" />
      <circle cx="3" cy="2" r="4" fill="#7A8B3C" />
    </g>
  ),
  moss: (
    <g>
      <ellipse cx="0" cy="2" rx="8" ry="4" fill="#4A7A3A" opacity="0.8" />
      <ellipse cx="-2" cy="0" rx="5" ry="3" fill="#5C8C4C" />
      <circle cx="3" cy="-1" r="2" fill="#6B9B5B" />
    </g>
  ),
  fern: (
    <g>
      <path d="M0,8 Q-4,-2 -8,-8" stroke="#3B7A2E" strokeWidth="1.5" fill="none" />
      <path d="M0,8 Q4,-2 8,-8" stroke="#3B7A2E" strokeWidth="1.5" fill="none" />
      <path d="M0,8 Q0,-2 0,-10" stroke="#2E6B22" strokeWidth="2" fill="none" />
      <path d="M-2,-4 L-6,-6" stroke="#4A8A3E" strokeWidth="1" fill="none" />
      <path d="M2,-4 L6,-6" stroke="#4A8A3E" strokeWidth="1" fill="none" />
    </g>
  ),
  algae: (
    <g>
      <circle cx="0" cy="0" r="5" fill="#2E8B57" opacity="0.6" />
      <circle cx="-3" cy="-3" r="3" fill="#3CB371" opacity="0.5" />
      <circle cx="4" cy="2" r="3" fill="#2E8B57" opacity="0.5" />
    </g>
  ),
  fungi: (
    <g>
      <ellipse cx="0" cy="3" rx="6" ry="3" fill="#8B6914" opacity="0.7" />
      <path d="M-2,-6 Q0,-10 2,-6" fill="#A0522D" />
      <line x1="0" y1="3" x2="0" y2="-6" stroke="#8B6914" strokeWidth="1.5" />
      <circle cx="-4" cy="0" r="2" fill="#D2691E" />
      <circle cx="4" cy="1" r="1.5" fill="#CD853F" />
    </g>
  ),
  shrub: (
    <g>
      <ellipse cx="0" cy="-2" rx="8" ry="6" fill="#5B8A3C" />
      <rect x="-1" y="2" width="2" height="5" fill="#6B4226" />
      <circle cx="-3" cy="-4" r="2" fill="#7AA84C" />
      <circle cx="3" cy="-3" r="2.5" fill="#6B9A3C" />
    </g>
  ),
  grass: (
    <g>
      <path d="M-4,6 L-3,-4" stroke="#6B9A3C" strokeWidth="1.5" />
      <path d="M-1,6 L0,-6" stroke="#5B8A2C" strokeWidth="1.5" />
      <path d="M2,6 L3,-5" stroke="#7BAA4C" strokeWidth="1.5" />
      <path d="M5,6 L4,-3" stroke="#6B9A3C" strokeWidth="1.5" />
      <path d="M-6,6 L-5,-2" stroke="#5B8A2C" strokeWidth="1" />
    </g>
  ),
  flower: (
    <g>
      <path d="M0,6 L0,-2" stroke="#2E7D32" strokeWidth="1.5" />
      <circle cx="0" cy="-4" r="3" fill="#E91E63" />
      <circle cx="0" cy="-4" r="1.5" fill="#FFC107" />
      <circle cx="-4" cy="-1" r="2" fill="#9C27B0" />
      <circle cx="4" cy="-1" r="2" fill="#E91E63" />
    </g>
  ),
  bee: (
    <g>
      <ellipse cx="0" cy="0" rx="5" ry="3.5" fill="#FFC107" />
      <rect x="-3" y="-3.5" width="2" height="7" fill="#333" rx="0.5" />
      <rect x="1" y="-3.5" width="2" height="7" fill="#333" rx="0.5" />
      <path d="M-3,-3 Q-6,-8 0,-6 Q6,-8 3,-3" fill="#AAD4FF" opacity="0.6" />
    </g>
  ),
  grazer: (
    <g>
      <ellipse cx="0" cy="0" rx="7" ry="4" fill="#8D6E63" />
      <circle cx="-5" cy="-3" r="3" fill="#795548" />
      <rect x="-3" y="3" width="1.5" height="4" fill="#5D4037" />
      <rect x="2" y="3" width="1.5" height="4" fill="#5D4037" />
    </g>
  ),
  decomposer: (
    <g>
      <circle cx="0" cy="0" r="4" fill="#795548" />
      <circle cx="-3" cy="-3" r="2" fill="#8D6E63" />
      <circle cx="3" cy="-2" r="2.5" fill="#6D4C41" />
      <circle cx="0" cy="4" r="2" fill="#8D6E63" />
    </g>
  ),
  oak: (
    <g>
      <rect x="-2" y="2" width="4" height="8" fill="#5D4037" />
      <circle cx="0" cy="-3" r="8" fill="#2E7D32" />
      <circle cx="-4" cy="-5" r="4" fill="#388E3C" />
      <circle cx="4" cy="-4" r="4" fill="#1B5E20" />
    </g>
  ),
  'shade-fern': (
    <g>
      <path d="M0,5 Q-3,-1 -7,-5" stroke="#2E7D32" strokeWidth="1" fill="none" />
      <path d="M0,5 Q3,-1 7,-5" stroke="#2E7D32" strokeWidth="1" fill="none" />
      <path d="M0,5 L0,-7" stroke="#1B5E20" strokeWidth="1.5" fill="none" />
    </g>
  ),
  predator: (
    <g>
      <ellipse cx="0" cy="0" rx="6" ry="4" fill="#4E342E" />
      <polygon points="-7,-2 -9,-5 -6,-3" fill="#4E342E" />
      <circle cx="5" cy="-1" r="1" fill="#FFD54F" />
      <path d="M7,-2 L9,-4" stroke="#4E342E" strokeWidth="1.5" />
      <path d="M7,0 L9,2" stroke="#4E342E" strokeWidth="1.5" />
    </g>
  ),
  'giant-tree': (
    <g>
      <rect x="-3" y="0" width="6" height="10" fill="#4E342E" />
      <circle cx="0" cy="-5" r="10" fill="#1B5E20" />
      <circle cx="-5" cy="-8" r="5" fill="#2E7D32" />
      <circle cx="5" cy="-7" r="5" fill="#1B5E20" />
    </g>
  ),
  raptor: (
    <g>
      <path d="M0,-2 L8,3 L6,0 L10,1 L0,-8 L-10,1 L-6,0 L-8,3 Z" fill="#5D4037" />
      <circle cx="0" cy="-5" r="2" fill="#6D4C41" />
      <circle cx="-1" cy="-5" r="0.5" fill="#FFD54F" />
      <circle cx="1" cy="-5" r="0.5" fill="#FFD54F" />
    </g>
  ),
  'water-channel': (
    <g>
      <path d="M-8,0 Q-4,-4 0,0 Q4,4 8,0" stroke="#1E88E5" strokeWidth="2" fill="none" />
      <path d="M-8,4 Q-4,0 0,4 Q4,8 8,4" stroke="#42A5F5" strokeWidth="1.5" fill="none" />
    </g>
  ),
  minerals: (
    <g>
      <polygon points="0,-6 4,0 0,2 -4,0" fill="#FFB300" />
      <polygon points="2,-2 6,2 2,4 -1,2" fill="#FFA000" />
      <polygon points="-3,0 -1,4 -5,5 -6,2" fill="#FF8F00" />
    </g>
  ),
  pickaxe: (
    <g>
      <line x1="-5" y1="5" x2="5" y2="-5" stroke="#795548" strokeWidth="2" />
      <path d="M3,-7 L7,-3 L5,-1 L1,-5 Z" fill="#90A4AE" />
    </g>
  ),
  rain: (
    <g>
      <ellipse cx="0" cy="-3" rx="8" ry="4" fill="#90A4AE" />
      <line x1="-4" y1="2" x2="-5" y2="6" stroke="#42A5F5" strokeWidth="1" />
      <line x1="0" y1="3" x2="-1" y2="7" stroke="#42A5F5" strokeWidth="1" />
      <line x1="4" y1="2" x2="3" y2="6" stroke="#42A5F5" strokeWidth="1" />
    </g>
  ),
  seed: (
    <g>
      <ellipse cx="0" cy="0" rx="4" ry="6" fill="#8D6E63" />
      <path d="M0,-6 Q2,-9 0,-10" stroke="#4CAF50" strokeWidth="1" fill="none" />
    </g>
  ),
  sun: (
    <g>
      <circle cx="0" cy="0" r="5" fill="#FFC107" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
        <line
          key={angle}
          x1={Math.cos(angle * Math.PI / 180) * 6}
          y1={Math.sin(angle * Math.PI / 180) * 6}
          x2={Math.cos(angle * Math.PI / 180) * 9}
          y2={Math.sin(angle * Math.PI / 180) * 9}
          stroke="#FFB300" strokeWidth="1.5"
        />
      ))}
    </g>
  ),
  soil: (
    <g>
      <rect x="-7" y="-2" width="14" height="6" fill="#795548" rx="2" />
      <circle cx="-3" cy="0" r="1.5" fill="#8D6E63" />
      <circle cx="3" cy="1" r="1" fill="#6D4C41" />
    </g>
  ),
  bacteria: (
    <g>
      <circle cx="-3" cy="-2" r="2" fill="#A1887F" />
      <circle cx="2" cy="1" r="2.5" fill="#8D6E63" />
      <circle cx="-1" cy="3" r="1.5" fill="#BCAAA4" />
      <circle cx="4" cy="-3" r="1.5" fill="#A1887F" />
      <ellipse cx="0" cy="0" rx="1" ry="3" fill="#D7CCC8" opacity="0.4" />
    </g>
  ),
  radiotroph: (
    <g>
      <circle cx="0" cy="0" r="5" fill="#7E57C2" opacity="0.7" />
      <circle cx="0" cy="0" r="3" fill="#9575CD" />
      <circle cx="-2" cy="-2" r="1.5" fill="#B39DDB" />
      <circle cx="2" cy="1" r="1" fill="#EDE7F6" />
    </g>
  ),
  'mineral-crust': (
    <g>
      <rect x="-6" y="-1" width="12" height="4" fill="#78909C" rx="1" />
      <polygon points="-4,-3 -2,0 -6,0" fill="#90A4AE" />
      <polygon points="3,-4 5,-1 1,-1" fill="#B0BEC5" />
      <circle cx="0" cy="0" r="1.5" fill="#CFD8DC" />
    </g>
  ),
};

export function CardSprite({ sprite, size = 1 }: { sprite: string; size?: number }) {
  return (
    <g transform={`scale(${size})`}>
      {sprites[sprite] || <circle r="5" fill="#999" />}
    </g>
  );
}

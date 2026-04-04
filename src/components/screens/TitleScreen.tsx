'use client';

import React, { useState } from 'react';

interface TitleScreenProps {
  onNewPlanet: (name: string) => void;
  hasSave: boolean;
  onContinue: () => void;
}

export default function TitleScreen({ onNewPlanet, hasSave, onContinue }: TitleScreenProps) {
  const [name, setName] = useState('');
  const [showInput, setShowInput] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-950 px-6">
      {/* Title */}
      <div className="mb-6 text-center">
        <h1 className="text-6xl font-bold text-emerald-400 tracking-wider mb-2"
          style={{ fontFamily: 'Georgia, serif', textShadow: '0 0 40px rgba(52, 211, 153, 0.3)' }}>
          SERAL
        </h1>
        <p className="text-slate-400 text-sm tracking-widest uppercase">Ecological Succession</p>
      </div>

      {/* Dictionary definition — stylized inline text */}
      <div className="mb-8 max-w-xs text-center px-4">
        <div className="flex items-baseline gap-2 justify-center mb-1">
          <span className="text-emerald-400/60 font-semibold italic text-sm" style={{ fontFamily: 'Georgia, serif' }}>ser·al</span>
          <span className="text-slate-600 text-[10px]">/ˈsɪərəl/</span>
          <span className="text-slate-700 text-[10px] italic">adj.</span>
        </div>
        <p className="text-slate-500 text-xs leading-relaxed italic" style={{ fontFamily: 'Georgia, serif' }}>
          Of or relating to a <span className="text-slate-400">sere</span> — a sequence of ecological communities
          successively occupying an area from the initial barren stage to the stable climax community.
        </p>
      </div>

      {/* Decorative hex pattern */}
      <svg width="120" height="80" viewBox="-60 -40 120 80" className="mb-8 opacity-30">
        {[{ q: 0, r: 0 }, { q: -1, r: 0 }, { q: 1, r: 0 }, { q: 0, r: -1 }, { q: 0, r: 1 }].map(
          (h, i) => {
            const x = h.q * 30;
            const y = h.r * 26 + (h.q % 2 !== 0 ? 13 : 0);
            return (
              <polygon
                key={i}
                points="15,0 7.5,13 -7.5,13 -15,0 -7.5,-13 7.5,-13"
                transform={`translate(${x}, ${y})`}
                fill="none"
                stroke="#4ade80"
                strokeWidth="1"
              />
            );
          }
        )}
      </svg>

      {/* Buttons */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        {hasSave && (
          <button
            onClick={onContinue}
            className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-lg transition-colors"
          >
            Continue Planet
          </button>
        )}

        {showInput ? (
          <div className="flex flex-col gap-2">
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Name your planet..."
              className="w-full py-3 px-4 bg-slate-800 border border-slate-600 text-white rounded-lg text-center text-lg placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              onKeyDown={e => {
                if (e.key === 'Enter' && name.trim()) onNewPlanet(name.trim());
              }}
            />
            <button
              onClick={() => name.trim() && onNewPlanet(name.trim())}
              disabled={!name.trim()}
              className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-semibold transition-colors"
            >
              Create Planet
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="w-full py-3 px-6 border-2 border-emerald-600 hover:bg-emerald-600/20 text-emerald-400 rounded-lg font-semibold text-lg transition-colors"
          >
            New Planet
          </button>
        )}
      </div>
    </div>
  );
}

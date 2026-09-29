'use client';

import React from 'react';
import { StudioState, BgMode } from '@/lib/constants';
import { Download, Sparkles, RotateCcw, Video, Copy, Check } from 'lucide-react';

interface HeaderProps {
  state: StudioState;
  onChangeState: (updater: (prev: StudioState) => StudioState) => void;
  onExportPNG: () => void;
  onExportGIF: () => void;
  onExportWebM: () => void;
  onCopyClipboard: () => void;
  onRandomize: () => void;
  onReset: () => void;
  isExporting: boolean;
  copied: boolean;
}

export function Header({
  state,
  onChangeState,
  onExportPNG,
  onExportGIF,
  onExportWebM,
  onCopyClipboard,
  onRandomize,
  onReset,
  isExporting,
  copied,
}: HeaderProps) {
  const setBgMode = (mode: BgMode) => {
    onChangeState(prev => ({
      ...prev,
      s: { ...prev.s, bgMode: mode },
    }));
  };

  return (
    <header className="h-16 flex-none bg-gradient-to-b from-[#111827] to-[#0a0f1d] border-b border-slate-800/80 px-4 flex items-center justify-between z-30 relative shadow-xl">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-200 via-amber-500 to-yellow-700 flex items-center justify-center font-['Anton'] text-stone-950 text-base font-bold shadow-[0_0_20px_rgba(245,158,11,0.4)] border border-amber-200/60 rotate-[-3deg]">
          HOK
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-['Anton'] text-lg tracking-wider uppercase text-white leading-none">
              FINALS <span className="text-amber-400">FORGE</span>
            </h1>
            <span className="text-[10px] uppercase font-['Chakra_Petch'] font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              Green Screen Studio
            </span>
          </div>
          <p className="text-[10.5px] font-['Chakra_Petch'] text-slate-400 tracking-wider uppercase mt-0.5">
            Honor of Kings Esports Highlights & Lower Thirds Generator
          </p>
        </div>
      </div>

      {/* Quick Background Bar - Green Screen is prominent */}
      <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-lg p-1">
        <span className="text-[11px] font-bold font-['Chakra_Petch'] text-slate-400 uppercase px-2">
          Key Mode:
        </span>
        <button
          onClick={() => setBgMode('greenscreen')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold font-['Chakra_Petch'] transition-all ${
            state.s.bgMode === 'greenscreen'
              ? 'bg-emerald-500 text-stone-950 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Broadcast Green Screen #00FF00"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#00FF00] border border-black/40"></span>
          Green Screen
        </button>
        <button
          onClick={() => setBgMode('bluescreen')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold font-['Chakra_Petch'] transition-all ${
            state.s.bgMode === 'bluescreen'
              ? 'bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Chroma Blue Screen #0000FF"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#0000FF] border border-white/40"></span>
          Blue
        </button>
        <button
          onClick={() => setBgMode('transparent')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold font-['Chakra_Petch'] transition-all ${
            state.s.bgMode === 'transparent'
              ? 'bg-slate-200 text-slate-900 shadow-sm'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Transparent Alpha (PNG & Alpha WebM)"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500 border border-white/40"></span>
          Alpha
        </button>
        <button
          onClick={() => setBgMode('gameplay')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold font-['Chakra_Petch'] transition-all ${
            state.s.bgMode === 'gameplay'
              ? 'bg-cyan-500 text-stone-950 font-bold'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Test key cleanliness over simulated gameplay"
        >
          🎮 Key Test
        </button>
        <button
          onClick={() => setBgMode('stage')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold font-['Chakra_Petch'] transition-all ${
            state.s.bgMode === 'stage'
              ? 'bg-amber-400 text-stone-950'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Esports Grand Finals Cyber Stage"
        >
          🏟️ Stage
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRandomize}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-750 text-slate-200 text-xs font-bold font-['Chakra_Petch'] transition-colors"
          title="Randomize player lineup & stats"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Shuffle</span>
        </button>

        <button
          onClick={onReset}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold font-['Chakra_Petch'] transition-colors"
          title="Reset to default settings"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onCopyClipboard}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-['Chakra_Petch'] transition-all"
          title="Copy current frame image directly to clipboard"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>

        <button
          onClick={onExportPNG}
          disabled={isExporting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold font-['Chakra_Petch'] transition-all disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>PNG</span>
        </button>

        <button
          onClick={onExportWebM}
          disabled={isExporting}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-amber-500/70 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-stone-950 font-bold font-['Chakra_Petch'] text-xs shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50"
          title="Export high quality WebM video overlay for Premiere Pro / CapCut"
        >
          <Video className="w-3.5 h-3.5" />
          <span>Export Video (WebM)</span>
        </button>
      </div>
    </header>
  );
}

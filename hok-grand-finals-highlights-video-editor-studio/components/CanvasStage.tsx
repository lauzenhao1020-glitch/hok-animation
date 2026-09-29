'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { StudioState, TEMPLATES } from '@/lib/constants';
import { renderCanvas } from '@/lib/canvas-renderer';
import { ShieldAlert, Maximize2 } from 'lucide-react';

interface CanvasStageProps {
  state: StudioState;
  onChangeState: (updater: (prev: StudioState) => StudioState) => void;
  time: number;
  fps: number;
  onDropImage: (file: File, target: 'player' | 'teamA' | 'teamB') => void;
}

export function CanvasStage({
  state,
  onChangeState,
  time,
  fps,
  onDropImage,
}: CanvasStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState<'fit' | '25' | '50' | '100'>('fit');
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<'player' | 'teamA' | 'teamB'>('player');
  const [canvasStyle, setCanvasStyle] = useState<{ width: number; height: number }>({ width: 960, height: 540 });

  const tpl = TEMPLATES[state.tpl];
  const dur = state.anim.dur || 3;
  const progress = Math.min(1, Math.max(0, time / dur));

  // Compute scale and draw on canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use preview resolution scale to keep 60fps smooth
    const pvq = state.anim.pvq || 0.75;
    const cw = Math.max(100, Math.round(tpl.w * pvq));
    const ch = Math.max(50, Math.round(tpl.h * pvq));

    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }

    renderCanvas(ctx, cw, ch, state, progress);
  }, [state, progress, tpl]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Adjust display CSS size according to zoom mode & container
  const updateLayout = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const availableW = Math.max(200, container.clientWidth - 48);
    const availableH = Math.max(150, container.clientHeight - 48);
    const aspect = tpl.w / tpl.h;

    let w = availableW;
    if (zoom === 'fit') {
      w = Math.min(availableW, availableH * aspect);
    } else {
      const pct = parseInt(zoom, 10) / 100;
      w = tpl.w * pct;
    }

    const h = w / aspect;
    setCanvasStyle({ width: Math.round(w), height: Math.round(h) });
  }, [zoom, tpl]);

  useEffect(() => {
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [updateLayout]);

  // Drag and drop handler
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only turn off if leaving container entirely
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith('image/')) {
      onDropImage(files[0], dragTarget);
    }
  };

  const toggleSafeArea = () => {
    onChangeState(prev => ({
      ...prev,
      s: { ...prev.s, safeArea: !prev.s.safeArea },
    }));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#04060c] relative overflow-hidden select-none">
      {/* Top stage info bar */}
      <div className="h-11 flex-none bg-[#080d19]/90 backdrop-blur border-b border-slate-800/80 px-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {/* Resolution Badge */}
          <span className="px-2.5 py-0.5 rounded text-[11px] font-['Chakra_Petch'] font-bold uppercase tracking-wider bg-slate-900 border border-slate-700/80 text-slate-300">
            <b className="text-amber-400">{tpl.w}</b> × <b className="text-amber-400">{tpl.h}</b>
          </span>

          {/* Template Badge */}
          <span className="px-2.5 py-0.5 rounded text-[11px] font-['Chakra_Petch'] font-bold uppercase tracking-wider bg-slate-900 border border-slate-700/80 text-slate-300">
            {tpl.name}
          </span>

          {/* Green Screen Badge */}
          {state.s.bgMode === 'greenscreen' && (
            <span className="px-2.5 py-0.5 rounded text-[11px] font-['Chakra_Petch'] font-bold uppercase tracking-wider bg-emerald-950/80 border border-emerald-500/60 text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00FF00] shadow-[0_0_8px_#00FF00]"></span>
              Chroma Key Green Active
            </span>
          )}

          {/* Right Corner Player Photo Badge */}
          {state.tpl === 'lower' && state.s.showRightPlayerPhoto !== false && (
            <span className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-['Chakra_Petch'] font-bold uppercase tracking-wider bg-amber-950/60 border border-amber-500/50 text-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Right Corner Player Pic
            </span>
          )}

          {/* Live FPS */}
          <span className="hidden sm:inline px-2 py-0.5 rounded text-[11px] font-['Oxanium'] font-bold text-slate-400 bg-slate-900 border border-slate-800">
            {fps} FPS
          </span>
        </div>

        {/* Zoom & Safe Guide toggles */}
        <div className="flex items-center gap-2">
          {/* Safe Area Toggle */}
          <button
            onClick={toggleSafeArea}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-['Chakra_Petch'] font-bold uppercase border transition-all ${
              state.s.safeArea
                ? 'border-amber-400 bg-amber-400/10 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Toggle Action & Title Safe broadcast guide overlays"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Safe Guides</span>
          </button>

          {/* Zoom Buttons */}
          <div className="flex items-center border border-slate-800 rounded-lg overflow-hidden bg-slate-900">
            {(['fit', '25', '50', '100'] as const).map(z => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={`px-2.5 py-1 text-[11px] font-['Chakra_Petch'] font-bold transition-colors ${
                  zoom === z
                    ? 'bg-amber-400 text-stone-950 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {z === 'fit' ? 'FIT' : `${z}%`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Canvas Viewport Area */}
      <div
        ref={containerRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="flex-1 flex items-center justify-center p-6 overflow-auto relative"
      >
        <div
          className={`relative transition-shadow duration-200 ${
            state.s.bgMode === 'transparent'
              ? 'bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] bg-slate-950/60'
              : ''
          } rounded-sm shadow-[0_25px_80px_rgba(0,0,0,0.85)] border border-slate-700/40`}
          style={{ width: canvasStyle.width, height: canvasStyle.height }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block rounded-sm pointer-events-none"
          />

          {/* Drag & drop overlay hint with 3 interactive drop zones */}
          {isDragging && (
            <div className="absolute inset-0 bg-slate-950/90 border-2 border-dashed border-amber-400 rounded-sm grid grid-cols-3 gap-2 p-3 z-30 backdrop-blur-sm animate-in fade-in duration-150">
              {/* Zone 1: Team A Logo */}
              <div
                onDragOver={e => {
                  e.preventDefault();
                  setDragTarget('teamA');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded border text-center transition-all ${
                  dragTarget === 'teamA'
                    ? 'border-cyan-400 bg-cyan-950/60 shadow-[0_0_20px_rgba(6,182,212,0.3)] scale-[1.02]'
                    : 'border-slate-800 bg-slate-900/50'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-2 font-['Oxanium'] font-bold text-sm"
                  style={{ backgroundColor: state.a.color, color: '#FFFFFF' }}
                >
                  {state.a.tag || 'A'}
                </div>
                <span className="font-['Chakra_Petch'] font-bold text-xs uppercase text-cyan-300">
                  Drop Team A Logo
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  {state.a.name || 'Team A'}
                </span>
              </div>

              {/* Zone 2: Player Picture */}
              <div
                onDragOver={e => {
                  e.preventDefault();
                  setDragTarget('player');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded border text-center transition-all ${
                  dragTarget === 'player'
                    ? 'border-amber-400 bg-amber-950/60 shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-[1.02]'
                    : 'border-slate-800 bg-slate-900/50'
                }`}
              >
                <Maximize2 className="w-8 h-8 mb-2 text-amber-400 animate-bounce" />
                <span className="font-['Chakra_Petch'] font-bold text-xs uppercase text-amber-300">
                  Drop Player Photo
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  {state.p.name || 'Pro Athlete'} ({state.p.hero})
                </span>
              </div>

              {/* Zone 3: Team B Logo */}
              <div
                onDragOver={e => {
                  e.preventDefault();
                  setDragTarget('teamB');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded border text-center transition-all ${
                  dragTarget === 'teamB'
                    ? 'border-rose-400 bg-rose-950/60 shadow-[0_0_20px_rgba(244,63,94,0.3)] scale-[1.02]'
                    : 'border-slate-800 bg-slate-900/50'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-2 font-['Oxanium'] font-bold text-sm"
                  style={{ backgroundColor: state.b.color, color: '#FFFFFF' }}
                >
                  {state.b.tag || 'B'}
                </div>
                <span className="font-['Chakra_Petch'] font-bold text-xs uppercase text-rose-300">
                  Drop Team B Logo
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  {state.b.name || 'Team B'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

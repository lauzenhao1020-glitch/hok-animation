'use client';

import React from 'react';
import { Play, Pause, RotateCcw, Repeat } from 'lucide-react';
import { StudioState } from '@/lib/constants';

interface TimelineTransportProps {
  state: StudioState;
  onChangeState: (updater: (prev: StudioState) => StudioState) => void;
  time: number;
  onSeek: (time: number) => void;
  playing: boolean;
  onTogglePlay: () => void;
  onRestart: () => void;
}

export function TimelineTransport({
  state,
  onChangeState,
  time,
  onSeek,
  playing,
  onTogglePlay,
  onRestart,
}: TimelineTransportProps) {
  const dur = state.anim.dur || 3;
  const progress = Math.min(1, Math.max(0, time / dur));

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onSeek((val / 1000) * dur);
  };

  const setSpeed = (spd: number) => {
    onChangeState(prev => ({
      ...prev,
      anim: { ...prev.anim, speed: spd },
    }));
  };

  const setDur = (d: number) => {
    onChangeState(prev => ({
      ...prev,
      anim: { ...prev.anim, dur: d },
    }));
  };

  const setFps = (f: number) => {
    onChangeState(prev => ({
      ...prev,
      anim: { ...prev.anim, fps: f },
    }));
  };

  const toggleLoop = () => {
    onChangeState(prev => ({
      ...prev,
      anim: { ...prev.anim, loop: !prev.anim.loop },
    }));
  };

  return (
    <div className="h-14 flex-none border-t border-slate-800 bg-gradient-to-b from-[#0b0f1c] to-[#070a13] px-4 flex items-center gap-3 z-20">
      {/* Restart */}
      <button
        onClick={onRestart}
        className="w-9 h-9 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
        title="Restart playback (R)"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      {/* Play / Pause */}
      <button
        onClick={onTogglePlay}
        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold transition-all shadow-md ${
          playing
            ? 'bg-amber-400 hover:bg-amber-300 text-stone-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
            : 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
        }`}
        title="Play / Pause (Space)"
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      {/* Quick Keyframe Jumps */}
      <div className="hidden sm:flex items-center gap-1">
        <button
          onClick={() => onSeek(0)}
          className="px-2 py-1 rounded text-[10px] font-bold font-['Chakra_Petch'] uppercase border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
          title="Jump to intro (0.0s)"
        >
          Intro
        </button>
        <button
          onClick={() => onSeek(dur * 0.5)}
          className="px-2 py-1 rounded text-[10px] font-bold font-['Chakra_Petch'] uppercase border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
          title="Jump to mid reveal"
        >
          Mid
        </button>
        <button
          onClick={() => onSeek(dur)}
          className="px-2 py-1 rounded text-[10px] font-bold font-['Chakra_Petch'] uppercase border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
          title="Jump to full poster reveal"
        >
          Final
        </button>
      </div>

      {/* Scrub Bar */}
      <div className="flex-1 relative flex items-center min-w-[120px]">
        <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 relative overflow-hidden pointer-events-none">
          <div
            className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 shadow-[0_0_10px_rgba(245,158,11,0.6)] transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <input
          type="range"
          min="0"
          max="1000"
          value={Math.round(progress * 1000)}
          onChange={handleScrub}
          className="absolute inset-0 w-full opacity-0 cursor-ew-resize h-full"
        />
      </div>

      {/* Timecode */}
      <div className="font-['Oxanium'] font-bold text-xs text-amber-400 bg-slate-900/90 border border-slate-800 rounded px-2.5 py-1 min-w-[85px] text-center tracking-wider">
        {time.toFixed(2)} / {dur.toFixed(2)}s
      </div>

      {/* Speed Selector */}
      <div className="hidden md:flex items-center gap-1 border border-slate-800 rounded-lg p-0.5 bg-slate-900">
        {[0.5, 1, 1.5, 2].map(spd => (
          <button
            key={spd}
            onClick={() => setSpeed(spd)}
            className={`px-1.5 py-0.5 rounded text-[10.5px] font-['Chakra_Petch'] font-bold ${
              state.anim.speed === spd
                ? 'bg-amber-400 text-stone-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {spd}x
          </button>
        ))}
      </div>

      {/* Duration */}
      <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 font-['Chakra_Petch']">
        <span className="font-bold text-[10.5px] uppercase">Dur:</span>
        <select
          value={dur}
          onChange={e => setDur(parseFloat(e.target.value))}
          className="bg-slate-900 border border-slate-800 text-slate-200 rounded px-1.5 py-1 text-xs font-bold outline-none cursor-pointer"
        >
          <option value="2">2.0s</option>
          <option value="2.5">2.5s</option>
          <option value="3">3.0s</option>
          <option value="4">4.0s</option>
          <option value="5">5.0s</option>
          <option value="6">6.0s</option>
        </select>
      </div>

      {/* FPS */}
      <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-400 font-['Chakra_Petch']">
        <span className="font-bold text-[10.5px] uppercase">FPS:</span>
        <select
          value={state.anim.fps}
          onChange={e => setFps(parseInt(e.target.value, 10))}
          className="bg-slate-900 border border-slate-800 text-slate-200 rounded px-1.5 py-1 text-xs font-bold outline-none cursor-pointer"
        >
          <option value="20">20 fps</option>
          <option value="24">24 fps</option>
          <option value="30">30 fps</option>
          <option value="60">60 fps</option>
        </select>
      </div>

      {/* Loop button */}
      <button
        onClick={toggleLoop}
        className={`w-8 h-8 rounded border transition-colors flex items-center justify-center ${
          state.anim.loop
            ? 'border-amber-400 text-amber-400 bg-amber-400/10'
            : 'border-slate-800 text-slate-500 hover:text-slate-300'
        }`}
        title="Toggle Loop"
      >
        <Repeat className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

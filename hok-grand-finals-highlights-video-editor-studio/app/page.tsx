'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StudioState, DEFAULT_STATE, TEAM_PRESETS, HOK_HEROES, COUNTRIES } from '@/lib/constants';
import { loadTeamLogoImage } from '@/lib/team-logos';
import { Header } from '@/components/Header';
import { CanvasStage } from '@/components/CanvasStage';
import { TimelineTransport } from '@/components/TimelineTransport';
import { SidebarControls } from '@/components/SidebarControls';
import { exportPNG, exportGIF, exportWebM, copyFrameToClipboard } from '@/lib/export-engine';

export default function Home() {
  const [state, setState] = useState<StudioState>(DEFAULT_STATE);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [fps, setFps] = useState(60);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ pct: number; msg: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Time & Animation Loop
  const lastTsRef = useRef<number>(0);
  const fpsAccRef = useRef<number>(0);
  const fpsCntRef = useRef<number>(0);
  const fpsLastTsRef = useRef<number>(0);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Preload authentic default HOK team logos on mount
  useEffect(() => {
    let active = true;
    Promise.all([
      loadTeamLogoImage('TS', '#00A3E0', 'Team Secret'),
      loadTeamLogoImage('LGD', '#E4002B', 'LGD Gaming MY')
    ]).then(([logoA, logoB]) => {
      if (active) {
        setState(prev => ({
          ...prev,
          a: { ...prev.a, logo: prev.a.logo || logoA },
          b: { ...prev.b, logo: prev.b.logo || logoB },
        }));
      }
    });
    return () => { active = false; };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(prev => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  const handleExportPNG = useCallback(async (is4K = false) => {
    setIsExporting(true);
    try {
      const p = Math.min(1, Math.max(0, time / state.anim.dur));
      const fn = await exportPNG(state, p, is4K);
      showToast(`Saved ${fn}`);
    } catch (err: any) {
      showToast('PNG export failed: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  }, [state, time, showToast]);

  // Main RAF tick
  useEffect(() => {
    let animId: number;

    const tick = (ts: number) => {
      animId = requestAnimationFrame(tick);
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = Math.min(0.1, (ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;

      // Track FPS
      fpsAccRef.current += dt;
      fpsCntRef.current++;
      if (ts - fpsLastTsRef.current > 500) {
        setFps(Math.round(fpsCntRef.current / Math.max(0.001, fpsAccRef.current)));
        fpsAccRef.current = 0;
        fpsCntRef.current = 0;
        fpsLastTsRef.current = ts;
      }

      if (playing) {
        const currentDur = stateRef.current.anim.dur || 3;
        const spd = stateRef.current.anim.speed || 1;
        setTime(prev => {
          const next = prev + dt * spd;
          if (next >= currentDur) {
            if (stateRef.current.anim.loop) {
              return next % currentDur;
            } else {
              setPlaying(false);
              return currentDur;
            }
          }
          return next;
        });
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [playing]);

  // Keyboard Shortcuts (Space, R, Ctrl+S, Ctrl+P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setPlaying(p => !p);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setTime(0);
        setPlaying(true);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        handleExportPNG();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleExportPNG]);

  // Handlers
  const handleTogglePlay = () => {
    setPlaying(p => {
      const willPlay = !p;
      if (willPlay && time >= state.anim.dur) {
        setTime(0);
      }
      return willPlay;
    });
  };

  const handleRestart = () => {
    setTime(0);
    setPlaying(true);
  };

  const handleSeek = (newTime: number) => {
    setPlaying(false);
    setTime(newTime);
  };

  const handleDropImage = (file: File, target: 'player' | 'teamA' | 'teamB' = 'player') => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        setState(prev => {
          if (target === 'teamA') {
            showToast(`${prev.a.name || 'Team A'} logo updated`);
            return { ...prev, a: { ...prev.a, logo: img } };
          } else if (target === 'teamB') {
            showToast(`${prev.b.name || 'Team B'} logo updated`);
            return { ...prev, b: { ...prev.b, logo: img } };
          } else {
            showToast('Player photo updated');
            return { ...prev, p: { ...prev.p, photo: img } };
          }
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRandomize = async () => {
    const pA = TEAM_PRESETS[Math.floor(Math.random() * TEAM_PRESETS.length)];
    let pB = TEAM_PRESETS[Math.floor(Math.random() * TEAM_PRESETS.length)];
    let guard = 0;
    while (pB.t === pA.t && guard++ < 30) {
      pB = TEAM_PRESETS[Math.floor(Math.random() * TEAM_PRESETS.length)];
    }

    const [logoA, logoB] = await Promise.all([
      loadTeamLogoImage(pA.t, pA.c, pA.n),
      loadTeamLogoImage(pB.t, pB.c, pB.n),
    ]);

    const IGNS = ['FEILONG', 'SHADOWK', 'LUNARIS', 'VYPER', 'KAZE', 'NOCTIS', 'ZENITH', 'RAIJIN', 'ORACLE', 'BLAZE', 'TITAN'];
    const REAL = ['Zhao Tianyu', 'Lim Wei Shen', 'Park Ji-hoon', 'Rafael Costa', 'Nguyen Minh', 'Lucas Silva', 'Kim Do-hyun'];
    const hero = HOK_HEROES[Math.floor(Math.random() * HOK_HEROES.length)];

    const k = Math.floor(4 + Math.random() * 14);
    const d = Math.floor(1 + Math.random() * 4);
    const a = Math.floor(3 + Math.random() * 16);
    const kda = ((k + a) / Math.max(1, d)).toFixed(1);

    setState(prev => ({
      ...prev,
      a: { ...prev.a, name: pA.n, tag: pA.t, color: pA.c, score: String(Math.floor(Math.random() * 4)), logo: logoA },
      b: { ...prev.b, name: pB.n, tag: pB.t, color: pB.c, score: String(Math.floor(Math.random() * 4)), logo: logoB },
      p: {
        ...prev.p,
        name: IGNS[Math.floor(Math.random() * IGNS.length)],
        real: REAL[Math.floor(Math.random() * REAL.length)],
        hero: hero.name,
        heroTitle: hero.title,
        role: hero.role,
        country: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
        num: String(1 + Math.floor(Math.random() * 25)).padStart(2, '0'),
        k: String(k),
        d: String(d),
        a: String(a),
        kda,
        dmg: `${(35 + Math.random() * 85).toFixed(1)}K`,
        gpm: String(620 + Math.floor(Math.random() * 320)),
        rating: (7.2 + Math.random() * 2.7).toFixed(1),
        mvp: Math.random() > 0.35,
      },
      s: {
        ...prev.s,
        seed: Math.floor(Math.random() * 99999),
      },
    }));

    showToast('Randomized esports lineup & stats');
  };

  const handleReset = () => {
    setState(DEFAULT_STATE());
    setTime(0);
    setPlaying(true);
    showToast('Reset to defaults');
  };

  const handleCopyClipboard = async () => {
    try {
      const p = Math.min(1, Math.max(0, time / state.anim.dur));
      await copyFrameToClipboard(state, p);
      setCopied(true);
      showToast('Frame copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err: any) {
      showToast('Failed to copy: ' + err.message);
    }
  };

  const handleExportGIF = async () => {
    setIsExporting(true);
    setExportProgress({ pct: 0, msg: 'Initializing GIF encoder...' });
    try {
      const fn = await exportGIF(state, (pct, msg) => {
        setExportProgress({ pct, msg });
      });
      showToast(`GIF generated: ${fn}`);
    } catch (err: any) {
      showToast('GIF export failed: ' + err.message);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const handleExportWebM = async () => {
    setIsExporting(true);
    setExportProgress({ pct: 0, msg: 'Starting WebM recording...' });
    try {
      const fn = await exportWebM(state, (pct, msg) => {
        setExportProgress({ pct, msg });
      });
      showToast(`Video ready: ${fn}`);
    } catch (err: any) {
      showToast('WebM export failed: ' + err.message);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const handleExportBatch = async () => {
    setIsExporting(true);
    const origTpl = state.tpl;
    const tpls: Array<StudioState['tpl']> = ['lower', 'banner', 'mvp', 'card', 'score', 'faceoff'];

    try {
      for (let i = 0; i < tpls.length; i++) {
        const currentTpl = tpls[i];
        setExportProgress({
          pct: (i + 1) / tpls.length,
          msg: `Exporting ${currentTpl}...`,
        });
        const tempState = { ...state, tpl: currentTpl };
        await exportPNG(tempState, 1, false);
        await new Promise(r => setTimeout(r, 200));
      }
      showToast('Exported all 6 graphics as PNG pack!');
    } catch (err: any) {
      showToast('Batch export failed: ' + err.message);
    } finally {
      setState(prev => ({ ...prev, tpl: origTpl }));
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#04060c] text-slate-100 font-sans">
      {/* Top Header */}
      <Header
        state={state}
        onChangeState={setState}
        onExportPNG={() => handleExportPNG(false)}
        onExportGIF={handleExportGIF}
        onExportWebM={handleExportWebM}
        onCopyClipboard={handleCopyClipboard}
        onRandomize={handleRandomize}
        onReset={handleReset}
        isExporting={isExporting}
        copied={copied}
      />

      {/* Main Studio Work Area */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 min-w-0 overflow-hidden relative">
        {/* Left Sidebar Controls */}
        <SidebarControls
          state={state}
          onChangeState={setState}
          onExportPNG={handleExportPNG}
          onExportGIF={handleExportGIF}
          onExportWebM={handleExportWebM}
          onCopyClipboard={handleCopyClipboard}
          onExportBatch={handleExportBatch}
          isExporting={isExporting}
          exportProgress={exportProgress}
        />

        {/* Center/Right Canvas Stage + Timeline */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden bg-[#020409]">
          <CanvasStage
            state={state}
            onChangeState={setState}
            time={time}
            fps={fps}
            onDropImage={handleDropImage}
          />

          <TimelineTransport
            state={state}
            onChangeState={setState}
            time={time}
            onSeek={handleSeek}
            playing={playing}
            onTogglePlay={handleTogglePlay}
            onRestart={handleRestart}
          />
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-[#121a2d] border border-amber-400/80 text-amber-300 text-xs font-bold font-['Chakra_Petch'] px-4 py-2 rounded-lg shadow-2xl tracking-wide flex items-center gap-2">
            <span>⚡</span>
            <span>{toastMsg}</span>
          </div>
        </div>
      )}
    </div>
  );
}

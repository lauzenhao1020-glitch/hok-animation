'use client';

import React, { useState } from 'react';
import {
  StudioState,
  TEMPLATES,
  TEAM_PRESETS,
  HOK_HEROES,
  HIGHLIGHT_CALLOUTS,
  ROLES,
  COUNTRIES,
  ACCENTS,
  FONTMAP,
  BgMode,
} from '@/lib/constants';
import { loadTeamLogoImage } from '@/lib/team-logos';
import {
  Layers,
  User,
  Swords,
  Trophy,
  Sliders,
  Palette,
  Download,
  Image as ImageIcon,
  Check,
  ChevronDown,
  Sparkles,
  ArrowLeftRight,
} from 'lucide-react';

interface SidebarControlsProps {
  state: StudioState;
  onChangeState: (updater: (prev: StudioState) => StudioState) => void;
  onExportPNG: (is4K?: boolean) => void;
  onExportGIF: () => void;
  onExportWebM: () => void;
  onCopyClipboard: () => void;
  onExportBatch: () => void;
  isExporting: boolean;
  exportProgress?: { pct: number; msg: string } | null;
}

export function SidebarControls({
  state,
  onChangeState,
  onExportPNG,
  onExportGIF,
  onExportWebM,
  onCopyClipboard,
  onExportBatch,
  isExporting,
  exportProgress,
}: SidebarControlsProps) {
  const [activeTab, setActiveTab] = useState<'tpl' | 'lower' | 'green' | 'teams' | 'player' | 'event' | 'style' | 'export'>('lower');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    quick: true,
    details: true,
    stats: true,
  });

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const setTpl = (tplId: StudioState['tpl']) => {
    onChangeState(prev => ({ ...prev, tpl: tplId }));
    if (tplId === 'lower') {
      setActiveTab('lower');
    }
  };

  const setBgMode = (mode: BgMode) => {
    onChangeState(prev => ({
      ...prev,
      s: { ...prev.s, bgMode: mode },
    }));
  };

  const applyTeamPreset = async (side: 'a' | 'b', presetIdx: number) => {
    const p = TEAM_PRESETS[presetIdx];
    if (!p) return;
    const logoImg = await loadTeamLogoImage(p.t, p.c, p.n);
    onChangeState(prev => ({
      ...prev,
      [side]: {
        ...prev[side],
        name: p.n,
        tag: p.t,
        color: p.c,
        logo: logoImg,
      },
    }));
  };

  const handleSwapTeams = () => {
    onChangeState(prev => ({
      ...prev,
      a: { ...prev.b },
      b: { ...prev.a },
    }));
  };

  const setTeamLogoPreset = async (side: 'a' | 'b', tag: string, color: string, name: string) => {
    const logoImg = await loadTeamLogoImage(tag, color, name);
    onChangeState(prev => ({
      ...prev,
      [side]: {
        ...prev[side],
        logo: logoImg,
      },
    }));
  };

  const handleHeroSelect = (heroName: string) => {
    const heroInfo = HOK_HEROES.find(h => h.name.toLowerCase() === heroName.toLowerCase());
    onChangeState(prev => ({
      ...prev,
      p: {
        ...prev.p,
        hero: heroName,
        heroTitle: heroInfo?.title || prev.p.heroTitle,
        role: heroInfo?.role || prev.p.role,
      },
    }));
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'playerPhoto' | 'teamALogo' | 'teamBLogo'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        onChangeState(prev => {
          if (type === 'playerPhoto') {
            return { ...prev, p: { ...prev.p, photo: img } };
          } else if (type === 'teamALogo') {
            return { ...prev, a: { ...prev.a, logo: img } };
          } else {
            return { ...prev, b: { ...prev.b, logo: img } };
          }
        });
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <aside className="w-full md:w-[420px] flex-none bg-[#0a0e1a] border-r border-slate-800/80 flex flex-col min-h-0 z-20 overflow-hidden">
      {/* Templates Selector Carousel */}
      <div className="p-3 border-b border-slate-800 bg-[#080c16]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-['Chakra_Petch'] font-bold text-slate-400 tracking-widest uppercase">
            Graphic Template
          </span>
          <span className="text-[10px] text-amber-400 font-bold font-['Chakra_Petch'] uppercase">
            {TEMPLATES[state.tpl].short}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {Object.values(TEMPLATES).map(tpl => {
            const isAct = state.tpl === tpl.id;
            return (
              <button
                key={tpl.id}
                onClick={() => setTpl(tpl.id as any)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${
                  isAct
                    ? 'border-amber-400 bg-gradient-to-b from-amber-400/20 to-amber-500/5 text-white shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : 'border-slate-800/90 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-6 h-3 rounded-xs mb-1.5 border transition-all ${
                    isAct ? 'bg-amber-400 border-amber-300' : 'bg-slate-700 border-slate-600'
                  }`}
                  style={{
                    aspectRatio: `${tpl.w}/${tpl.h}`,
                    height: tpl.h > tpl.w ? '18px' : '10px',
                    width: tpl.h > tpl.w ? '10px' : '22px',
                  }}
                />
                <span className="text-[11px] font-bold font-['Chakra_Petch'] leading-tight">
                  {tpl.short}
                </span>
                <span className="text-[9px] text-slate-500 font-['Oxanium']">
                  {tpl.w}×{tpl.h}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex border-b border-slate-800/80 bg-[#070b14] overflow-x-auto no-scrollbar px-1">
        {[
          { id: 'lower', label: 'Lower Third', icon: Sliders, badge: state.tpl === 'lower' },
          { id: 'green', label: 'Green Screen', icon: Palette, badge: true },
          { id: 'player', label: 'Player & Hero', icon: User },
          { id: 'teams', label: 'Teams', icon: Swords },
          { id: 'event', label: 'Match Event', icon: Trophy },
          { id: 'style', label: 'Theme & Font', icon: Layers },
          { id: 'export', label: 'Export', icon: Download },
        ].map(tab => {
          const isAct = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 text-xs font-bold font-['Chakra_Petch'] whitespace-nowrap transition-colors ${
                isAct
                  ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-['Chakra_Petch']">
        {/* =========================================================
            TAB 1: LOWER THIRD CONFIGURATION (HIGH PRIORITY)
            ========================================================= */}
        {activeTab === 'lower' && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40">
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1 text-[12px]">
                <Sparkles className="w-4 h-4" />
                <span>Video Editor Pro Lower Third</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Positioned in the lower quadrant of the 1080p frame. Ready to key over gameplay footage using Premiere Pro Ultra Key or CapCut Chroma Key!
              </p>
            </div>

            {/* Lower Third Subtype */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Lower Third Style Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'player', label: 'Player Spotlight', desc: 'Hero avatar, IGN, KDA, Damage %, GPM' },
                  { id: 'score', label: 'Match Status / Gold Lead', desc: 'Series scores, BO7 win dots, gold diff' },
                  { id: 'highlight', label: 'Epic Play / Penta Kill', desc: 'Fiery highlight stinger & replay bug' },
                  { id: 'caster', label: 'Caster & Talent', desc: 'Desk talent names & official social tag' },
                ].map(opt => {
                  const isAct = state.s.lowerThirdType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() =>
                        onChangeState(prev => ({
                          ...prev,
                          s: { ...prev.s, lowerThirdType: opt.id as any },
                        }))
                      }
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        isAct
                          ? 'border-amber-400 bg-amber-400/10 text-white shadow-sm'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-bold text-[11.5px] text-amber-300">{opt.label}</div>
                      <div className="text-[10px] text-slate-400 leading-snug mt-0.5">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Placement */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Screen Placement
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'bottom-left', label: 'Bottom Left' },
                  { id: 'bottom-center', label: 'Centered' },
                  { id: 'full-width', label: 'Full Ribbon' },
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() =>
                      onChangeState(prev => ({
                        ...prev,
                        s: { ...prev.s, lowerThirdPos: p.id as any },
                      }))
                    }
                    className={`py-1.5 px-2 rounded-lg border text-center font-bold text-[11px] ${
                      state.s.lowerThirdPos === p.id
                        ? 'border-amber-400 bg-amber-400 text-stone-950 font-bold'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* DEDICATED RIGHT-CORNER PLAYER PICTURE SECTION */}
            <div className="p-3.5 rounded-lg bg-slate-900/90 border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#F59E0B]"></span>
                  <span className="font-bold text-amber-300 text-xs uppercase tracking-wider">
                    Player Picture (Right Corner)
                  </span>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300">
                  <input
                    type="checkbox"
                    checked={state.s.showRightPlayerPhoto !== false}
                    onChange={e =>
                      onChangeState(prev => ({
                        ...prev,
                        s: { ...prev.s, showRightPlayerPhoto: e.target.checked },
                      }))
                    }
                    className="w-3.5 h-3.5 accent-amber-400 cursor-pointer"
                  />
                  <span>Show on Corner</span>
                </label>
              </div>

              <p className="text-[10.5px] text-slate-400 leading-normal">
                Dedicated esports portrait space on the right edge of the lower third. Breakout bust stands tall above the bar.
              </p>

              {/* Photo Upload & Preview */}
              <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-lg p-2.5">
                <div className="w-14 h-14 rounded-lg bg-slate-850 border border-slate-700 overflow-hidden flex items-center justify-center flex-none relative">
                  {state.p.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={state.p.photo.src} alt="Player" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-1">
                      <ImageIcon className="w-4 h-4 text-amber-400 mx-auto mb-0.5" />
                      <span className="text-[8.5px] text-slate-400 uppercase font-bold">Pro Cam</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded text-xs cursor-pointer shadow-sm transition-colors">
                    <span>{state.p.photo ? 'Replace Picture' : 'Upload Player Picture'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileUpload(e, 'playerPhoto')}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-slate-400 block">
                    {state.p.photo ? 'Custom picture loaded' : 'Defaulting to stylized HOK pro athlete bust'}
                  </span>
                </div>

                {state.p.photo && (
                  <button
                    onClick={() =>
                      onChangeState(prev => ({
                        ...prev,
                        p: { ...prev.p, photo: null },
                      }))
                    }
                    className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Picture Framing Controls (Scale & Pan) */}
              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Picture Zoom / Scale</span>
                  <span className="font-['Oxanium'] font-bold text-amber-400">
                    {(state.p.photoZoom || 1.0).toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.2"
                  step="0.05"
                  value={state.p.photoZoom || 1.0}
                  onChange={e =>
                    onChangeState(prev => ({
                      ...prev,
                      p: { ...prev.p, photoZoom: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                />

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Offset X</span>
                      <span className="font-['Oxanium']">{state.p.photoX || 0}px</span>
                    </div>
                    <input
                      type="range"
                      min="-70"
                      max="70"
                      step="1"
                      value={state.p.photoX || 0}
                      onChange={e =>
                        onChangeState(prev => ({
                          ...prev,
                          p: { ...prev.p, photoX: parseInt(e.target.value, 10) },
                        }))
                      }
                      className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Offset Y</span>
                      <span className="font-['Oxanium']">{state.p.photoY || 0}px</span>
                    </div>
                    <input
                      type="range"
                      min="-70"
                      max="70"
                      step="1"
                      value={state.p.photoY || 0}
                      onChange={e =>
                        onChangeState(prev => ({
                          ...prev,
                          p: { ...prev.p, photoY: parseInt(e.target.value, 10) },
                        }))
                      }
                      className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() =>
                      onChangeState(prev => ({
                        ...prev,
                        p: { ...prev.p, photoZoom: 1.0, photoX: 0, photoY: 0 },
                      }))
                    }
                    className="text-[10px] text-slate-400 hover:text-amber-300 font-bold uppercase"
                  >
                    ↺ Reset Picture Position
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Callout Presets (if Highlight mode) */}
            {state.s.lowerThirdType === 'highlight' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Highlight Callout Presets
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {HIGHLIGHT_CALLOUTS.map((call, idx) => (
                    <button
                      key={idx}
                      onClick={() =>
                        onChangeState(prev => ({
                          ...prev,
                          event: {
                            ...prev.event,
                            highlightText: call.text,
                            highlightSub: call.sub,
                          },
                        }))
                      }
                      className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 hover:border-amber-400 text-slate-200 hover:text-amber-300 text-[11px] font-bold transition-colors"
                    >
                      {call.text}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 2: GREEN SCREEN & CHROMA KEY SETTINGS
            ========================================================= */}
        {activeTab === 'green' && (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Chroma Key Background
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: 'greenscreen',
                    label: '🟩 Green Screen (#00FF00)',
                    desc: 'Pure broadcast chroma key green for CapCut & Premiere Ultra Key.',
                    color: '#00FF00',
                  },
                  {
                    id: 'bluescreen',
                    label: '🟦 Blue Screen (#0000FF)',
                    desc: 'Use when teams or heroes have green costumes/skins.',
                    color: '#0000FF',
                  },
                  {
                    id: 'magenta',
                    label: '🟪 Magenta Screen (#FF00FF)',
                    desc: 'Alternative high-contrast chroma key.',
                    color: '#FF00FF',
                  },
                  {
                    id: 'transparent',
                    label: '🏁 Transparent Alpha',
                    desc: 'Export with transparent background for direct PNG / WebM.',
                    color: 'transparent',
                  },
                  {
                    id: 'gameplay',
                    label: '🎮 Gameplay Key Test',
                    desc: 'Live simulated HOK fight to test readability and key edges.',
                    color: '#101726',
                  },
                  {
                    id: 'stage',
                    label: '🏟️ Grand Finals Stage',
                    desc: 'Cyber arena with stadium beams and particle vortex.',
                    color: '#060912',
                  },
                ].map(bg => {
                  const isAct = state.s.bgMode === bg.id;
                  return (
                    <button
                      key={bg.id}
                      onClick={() => setBgMode(bg.id as any)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        isAct
                          ? 'border-emerald-400 bg-emerald-950/40 text-white shadow-sm ring-1 ring-emerald-400'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-bold text-[11.5px] text-white flex items-center justify-between">
                        <span>{bg.label}</span>
                        {isAct && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-snug mt-1">{bg.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Edge & Contrast Protection */}
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-3">
              <span className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Chroma Key Edge Protection
              </span>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-bold text-slate-200 text-xs block">Anti-Fringe Dark Border</span>
                  <span className="text-[10.5px] text-slate-400 block">
                    Adds crisp dark outline under graphics so green keying leaves razor-sharp text
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={state.s.contrastBorder}
                  onChange={e =>
                    onChangeState(prev => ({
                      ...prev,
                      s: { ...prev.s, contrastBorder: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-800">
                <div>
                  <span className="font-bold text-slate-200 text-xs block">Broadcast Safe Guides</span>
                  <span className="text-[10.5px] text-slate-400 block">
                    Display Action Safe (93%) and Title Safe (90%) broadcast overlays
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={state.s.safeArea}
                  onChange={e =>
                    onChangeState(prev => ({
                      ...prev,
                      s: { ...prev.s, safeArea: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: PLAYER & HERO CONFIGURATION
            ========================================================= */}
        {activeTab === 'player' && (
          <div className="space-y-4">
            {/* Player Identity */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Player Details
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">In-Game Name (IGN)</span>
                  <input
                    type="text"
                    value={state.p.name}
                    onChange={e =>
                      onChangeState(prev => ({
                        ...prev,
                        p: { ...prev.p, name: e.target.value.toUpperCase() },
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded px-2.5 py-1.5 font-bold font-['Chakra_Petch']"
                    placeholder="FEILONG"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Real Name</span>
                  <input
                    type="text"
                    value={state.p.real}
                    onChange={e =>
                      onChangeState(prev => ({
                        ...prev,
                        p: { ...prev.p, real: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded px-2.5 py-1.5"
                    placeholder="Zhao Tianyu"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Role</span>
                  <select
                    value={state.p.role}
                    onChange={e =>
                      onChangeState(prev => ({
                        ...prev,
                        p: { ...prev.p, role: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded px-2 py-1.5"
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Jersey #</span>
                  <input
                    type="text"
                    maxLength={3}
                    value={state.p.num}
                    onChange={e =>
                      onChangeState(prev => ({
                        ...prev,
                        p: { ...prev.p, num: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded px-2.5 py-1.5 font-bold"
                    placeholder="07"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Region</span>
                  <select
                    value={state.p.country}
                    onChange={e =>
                      onChangeState(prev => ({
                        ...prev,
                        p: { ...prev.p, country: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded px-2 py-1.5"
                  >
                    {COUNTRIES.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Signature Hero Selection */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Signature Hero
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <select
                    value={state.p.hero}
                    onChange={e => handleHeroSelect(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-amber-300 font-bold rounded px-2.5 py-2"
                  >
                    {HOK_HEROES.map(h => (
                      <option key={h.name} value={h.name}>
                        {h.name} ({h.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <input
                    type="text"
                    value={state.p.heroTitle || ''}
                    onChange={e =>
                      onChangeState(prev => ({
                        ...prev,
                        p: { ...prev.p, heroTitle: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded px-2.5 py-2"
                    placeholder="Hero Title / Epithet"
                  />
                </div>
              </div>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Player Portrait / Photo
              </label>
              <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
                <div className="w-12 h-12 rounded bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center flex-none">
                  {state.p.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={state.p.photo.src} alt="Player" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-slate-500" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="inline-block px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded text-xs font-bold cursor-pointer">
                    Upload Custom Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileUpload(e, 'playerPhoto')}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    PNG with transparent background works best
                  </span>
                </div>
                {state.p.photo && (
                  <button
                    onClick={() =>
                      onChangeState(prev => ({
                        ...prev,
                        p: { ...prev.p, photo: null },
                      }))
                    }
                    className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Photo framing controls */}
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-2 mt-2">
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="text-slate-400">Photo Scale: {(state.p.photoZoom || 1.0).toFixed(2)}x</span>
                  <button
                    onClick={() =>
                      onChangeState(prev => ({
                        ...prev,
                        p: { ...prev.p, photoZoom: 1.0, photoX: 0, photoY: 0 },
                      }))
                    }
                    className="text-[10px] text-amber-400 hover:underline"
                  >
                    Reset
                  </button>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.2"
                  step="0.05"
                  value={state.p.photoZoom || 1.0}
                  onChange={e =>
                    onChangeState(prev => ({
                      ...prev,
                      p: { ...prev.p, photoZoom: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                />
              </div>
            </div>

            {/* Match Stats */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Live Combat Stats
              </label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Kills</span>
                  <input
                    type="text"
                    value={state.p.k}
                    onChange={e =>
                      onChangeState(prev => ({
                        ...prev,
                        p: { ...prev.p, k: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded px-2 py-1 text-center font-bold font-['Oxanium']"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Deaths</span>
                  <input
                    type="text"
                    value={state.p.d}
                    onChange={e =>
                      onChangeState(prev => ({
                        ...prev,
                        p: { ...prev.p, d: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded px-2 py-1 text-center font-bold font-['Oxanium']"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Assists</span>
                  <input
                    type="text"
                    value={state.p.a}
                    onChange={e =>
                      onChangeState(prev => ({
                        ...prev,
                        p: { ...prev.p, a: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded px-2 py-1 text-center font-bold font-['Oxanium']"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">KDA</span>
                  <input
                    type="text"
                    value={state.p.kda}
                    onChange={e =>
                      onChangeState(prev => ({
                        ...prev,
                        p: { ...prev.p, kda: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 text-amber-400 rounded px-2 py-1 text-center font-bold font-['Oxanium']"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Damage</span>
                  <input
                    type="text"
                    value={state.p.dmg}
                    onChange={e =>
                      onChangeState(prev => ({
                        ...prev,
                        p: { ...prev.p, dmg: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded px-2 py-1 text-center font-bold font-['Oxanium']"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Gold/Min</span>
                  <input
                    type="text"
                    value={state.p.gpm}
                    onChange={e =>
                      onChangeState(prev => ({
                        ...prev,
                        p: { ...prev.p, gpm: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded px-2 py-1 text-center font-bold font-['Oxanium']"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 mt-3">
                <span className="font-bold text-slate-200">Show MVP Star Badge</span>
                <input
                  type="checkbox"
                  checked={state.p.mvp}
                  onChange={e =>
                    onChangeState(prev => ({
                      ...prev,
                      p: { ...prev.p, mvp: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 4: TEAMS & PRESETS (WITH DEDICATED TEAM LOGO CONTROLS)
            ========================================================= */}
        {activeTab === 'teams' && (
          <div className="space-y-4">
            {/* Quick Swap Teams Button */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-300 font-bold">Side Switch</span>
              <button
                onClick={handleSwapTeams}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-750 text-amber-400 border border-slate-700 font-bold text-xs transition-colors"
                title="Swap Team A and Team B names, tags, scores, colors and logos"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Swap Teams A ⇄ B</span>
              </button>
            </div>

            {/* Team A */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-400 uppercase text-[11px] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  Team A (Home / Blue Side)
                </span>
                <select
                  onChange={e => applyTeamPreset('a', parseInt(e.target.value, 10))}
                  className="bg-slate-800 text-slate-200 border border-slate-700 text-[10px] rounded px-1.5 py-0.5"
                >
                  <option value="">Load Preset...</option>
                  {TEAM_PRESETS.map((p, i) => (
                    <option key={i} value={i}>
                      {p.n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Name</span>
                  <input
                    type="text"
                    value={state.a.name}
                    onChange={e =>
                      onChangeState(prev => ({
                        ...prev,
                        a: { ...prev.a, name: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded px-2 py-1 font-bold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Tag (Max 6)</span>
                  <input
                    type="text"
                    maxLength={6}
                    value={state.a.tag}
                    onChange={e =>
                      onChangeState(prev => ({
                        ...prev,
                        a: { ...prev.a, tag: e.target.value.toUpperCase() },
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded px-2 py-1 font-bold font-['Oxanium']"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={state.a.color}
                      onChange={e =>
                        onChangeState(prev => ({
                          ...prev,
                          a: { ...prev.a, color: e.target.value },
                        }))
                      }
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <span className="text-[11px] font-['Oxanium'] text-slate-300 uppercase">
                      {state.a.color}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Score</span>
                  <input
                    type="text"
                    value={state.a.score}
                    onChange={e =>
                      onChangeState(prev => ({
                        ...prev,
                        a: { ...prev.a, score: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded px-2 py-1 text-center font-bold text-sm font-['Oxanium']"
                  />
                </div>
              </div>

              {/* DEDICATED TEAM A LOGO SECTION */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                  Team A Logo
                </span>
                <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-lg p-2.5">
                  <div className="w-12 h-12 rounded bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center flex-none">
                    {state.a.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={state.a.logo.src} alt="Team A Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="font-['Oxanium'] font-bold text-xs text-cyan-400">
                        {state.a.tag || 'TEAM'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-block px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded text-[11px] font-bold cursor-pointer">
                      Upload Logo (PNG/SVG)
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleFileUpload(e, 'teamALogo')}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[9.5px] text-slate-500 block mt-1">
                      Appears on Score Bug, Lower Third & Match Banners
                    </span>
                  </div>
                  {state.a.logo && (
                    <button
                      onClick={() =>
                        onChangeState(prev => ({
                          ...prev,
                          a: { ...prev.a, logo: null },
                        }))
                      }
                      className="text-xs text-rose-400 hover:text-rose-300 px-1.5 py-1"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Preset Logo Quick Select */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[9.5px] text-slate-500">Presets:</span>
                  {[
                    { tag: 'TS', name: 'Team Secret', color: '#00A3E0' },
                    { tag: 'WLG', name: 'Wolves Esports', color: '#F08A00' },
                    { tag: 'AG', name: 'AG Super Play', color: '#E4002B' },
                    { tag: 'LGD', name: 'LGD Gaming', color: '#E4002B' },
                    { tag: 'ES', name: 'eStar Pro', color: '#1A73E8' },
                  ].map(tm => (
                    <button
                      key={tm.tag}
                      onClick={() => setTeamLogoPreset('a', tm.tag, tm.color, tm.name)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-['Oxanium'] font-bold"
                    >
                      {tm.tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Team B */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-400 uppercase text-[11px] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  Team B (Away / Red Side)
                </span>
                <select
                  onChange={e => applyTeamPreset('b', parseInt(e.target.value, 10))}
                  className="bg-slate-800 text-slate-200 border border-slate-700 text-[10px] rounded px-1.5 py-0.5"
                >
                  <option value="">Load Preset...</option>
                  {TEAM_PRESETS.map((p, i) => (
                    <option key={i} value={i}>
                      {p.n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Name</span>
                  <input
                    type="text"
                    value={state.b.name}
                    onChange={e =>
                      onChangeState(prev => ({
                        ...prev,
                        b: { ...prev.b, name: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded px-2 py-1 font-bold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Tag (Max 6)</span>
                  <input
                    type="text"
                    maxLength={6}
                    value={state.b.tag}
                    onChange={e =>
                      onChangeState(prev => ({
                        ...prev,
                        b: { ...prev.b, tag: e.target.value.toUpperCase() },
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded px-2 py-1 font-bold font-['Oxanium']"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={state.b.color}
                      onChange={e =>
                        onChangeState(prev => ({
                          ...prev,
                          b: { ...prev.b, color: e.target.value },
                        }))
                      }
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <span className="text-[11px] font-['Oxanium'] text-slate-300 uppercase">
                      {state.b.color}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Score</span>
                  <input
                    type="text"
                    value={state.b.score}
                    onChange={e =>
                      onChangeState(prev => ({
                        ...prev,
                        b: { ...prev.b, score: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded px-2 py-1 text-center font-bold text-sm font-['Oxanium']"
                  />
                </div>
              </div>

              {/* DEDICATED TEAM B LOGO SECTION */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                  Team B Logo
                </span>
                <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-lg p-2.5">
                  <div className="w-12 h-12 rounded bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center flex-none">
                    {state.b.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={state.b.logo.src} alt="Team B Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="font-['Oxanium'] font-bold text-xs text-rose-400">
                        {state.b.tag || 'TEAM'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-block px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded text-[11px] font-bold cursor-pointer">
                      Upload Logo (PNG/SVG)
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleFileUpload(e, 'teamBLogo')}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[9.5px] text-slate-500 block mt-1">
                      Appears on Score Bug, Lower Third & Match Banners
                    </span>
                  </div>
                  {state.b.logo && (
                    <button
                      onClick={() =>
                        onChangeState(prev => ({
                          ...prev,
                          b: { ...prev.b, logo: null },
                        }))
                      }
                      className="text-xs text-rose-400 hover:text-rose-300 px-1.5 py-1"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Preset Logo Quick Select */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[9.5px] text-slate-500">Presets:</span>
                  {[
                    { tag: 'LGD', name: 'LGD Gaming', color: '#E4002B' },
                    { tag: 'AG', name: 'AG Super Play', color: '#E4002B' },
                    { tag: 'WLG', name: 'Wolves Esports', color: '#F08A00' },
                    { tag: 'GEN', name: 'Gen.G', color: '#C9A227' },
                    { tag: 'NOVA', name: 'NOVA Esports', color: '#00E0A4' },
                  ].map(tm => (
                    <button
                      key={tm.tag}
                      onClick={() => setTeamLogoPreset('b', tm.tag, tm.color, tm.name)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-['Oxanium'] font-bold"
                    >
                      {tm.tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 5: MATCH EVENT & DETAILS
            ========================================================= */}
        {activeTab === 'event' && (
          <div className="space-y-3">
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">Tournament Title</span>
              <input
                type="text"
                value={state.event.title}
                onChange={e =>
                  onChangeState(prev => ({
                    ...prev,
                    event: { ...prev.event, title: e.target.value },
                  }))
                }
                className="w-full bg-slate-900 border border-slate-800 text-white rounded px-2.5 py-1.5 font-bold"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">League Subtitle</span>
              <input
                type="text"
                value={state.event.sub}
                onChange={e =>
                  onChangeState(prev => ({
                    ...prev,
                    event: { ...prev.event, sub: e.target.value },
                  }))
                }
                className="w-full bg-slate-900 border border-slate-800 text-white rounded px-2.5 py-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Format</span>
                <input
                  type="text"
                  value={state.event.format}
                  onChange={e =>
                    onChangeState(prev => ({
                      ...prev,
                      event: { ...prev.event, format: e.target.value },
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded px-2.5 py-1.5"
                  placeholder="BO7"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Game Number</span>
                <input
                  type="text"
                  value={state.event.game}
                  onChange={e =>
                    onChangeState(prev => ({
                      ...prev,
                      event: { ...prev.event, game: e.target.value },
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded px-2.5 py-1.5"
                  placeholder="GAME 5"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Match Clock</span>
                <input
                  type="text"
                  value={state.event.clock}
                  onChange={e =>
                    onChangeState(prev => ({
                      ...prev,
                      event: { ...prev.event, clock: e.target.value },
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded px-2.5 py-1.5 font-['Oxanium'] font-bold"
                  placeholder="14:28"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Gold Lead Ribbon</span>
                <input
                  type="text"
                  value={state.event.goldLead || ''}
                  onChange={e =>
                    onChangeState(prev => ({
                      ...prev,
                      event: { ...prev.event, goldLead: e.target.value },
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-800 text-amber-300 rounded px-2.5 py-1.5"
                  placeholder="+3.8K GOLD LEAD"
                />
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">Venue & City</span>
              <input
                type="text"
                value={state.event.venue}
                onChange={e =>
                  onChangeState(prev => ({
                    ...prev,
                    event: { ...prev.event, venue: e.target.value },
                  }))
                }
                className="w-full bg-slate-900 border border-slate-800 text-white rounded px-2.5 py-1.5"
              />
            </div>

            {/* Towers & Objectives */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                Objectives & Towers
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Team A Towers</span>
                  <input
                    type="text"
                    value={state.event.towersA || '7'}
                    onChange={e =>
                      onChangeState(prev => ({
                        ...prev,
                        event: { ...prev.event, towersA: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 text-cyan-400 rounded px-2.5 py-1.5 font-bold font-['Oxanium']"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Team B Towers</span>
                  <input
                    type="text"
                    value={state.event.towersB || '3'}
                    onChange={e =>
                      onChangeState(prev => ({
                        ...prev,
                        event: { ...prev.event, towersB: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 text-rose-400 rounded px-2.5 py-1.5 font-bold font-['Oxanium']"
                  />
                </div>
              </div>
            </div>

            {/* Score Bug Screen Position */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                Score Bug Screen Placement
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'top', label: 'Top HUD (Esports Broadcast)' },
                  { id: 'bottom', label: 'Bottom HUD' },
                ].map(pos => (
                  <button
                    key={pos.id}
                    onClick={() =>
                      onChangeState(prev => ({
                        ...prev,
                        s: { ...prev.s, scoreBugPos: pos.id as any },
                      }))
                    }
                    className={`py-1.5 px-2 rounded-lg border text-center font-bold text-[11px] ${
                      state.s.scoreBugPos === pos.id
                        ? 'border-amber-400 bg-amber-400 text-stone-950 font-bold'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 6: THEME & FONT
            ========================================================= */}
        {activeTab === 'style' && (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Display Typography
              </label>
              <select
                value={state.s.font}
                onChange={e =>
                  onChangeState(prev => ({
                    ...prev,
                    s: { ...prev.s, font: e.target.value },
                  }))
                }
                className="w-full bg-slate-900 border border-slate-800 text-white rounded px-2.5 py-2 font-bold"
              >
                {Object.keys(FONTMAP).map(f => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Gold / Accent Color
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="color"
                  value={state.s.accent}
                  onChange={e =>
                    onChangeState(prev => ({
                      ...prev,
                      s: { ...prev.s, accent: e.target.value },
                    }))
                  }
                  className="w-9 h-9 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <span className="font-['Oxanium'] font-bold text-amber-400 uppercase text-xs">
                  {state.s.accent}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ACCENTS.map(col => (
                  <button
                    key={col}
                    onClick={() =>
                      onChangeState(prev => ({
                        ...prev,
                        s: { ...prev.s, accent: col },
                      }))
                    }
                    className="w-6 h-6 rounded-md border border-white/20 transition-transform hover:scale-110"
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>

            {/* Animation toggles */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                Motion Effects
              </span>
              {[
                { key: 'countUp', label: 'Count-Up Numbers' },
                { key: 'shine', label: 'Metallic Gold Shine Sweep' },
                { key: 'particles', label: 'Floating Gold Dust' },
                { key: 'camera', label: 'Cinematic Camera Push' },
              ].map(opt => (
                <label key={opt.key} className="flex items-center justify-between cursor-pointer py-1">
                  <span className="text-slate-300 text-xs">{opt.label}</span>
                  <input
                    type="checkbox"
                    checked={(state.anim as any)[opt.key]}
                    onChange={e =>
                      onChangeState(prev => ({
                        ...prev,
                        anim: { ...prev.anim, [opt.key]: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 accent-amber-400 cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 7: EXPORT STUDIO
            ========================================================= */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="block font-bold text-amber-400 text-xs mb-1">
                Video Editor Export Guide
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Choose <b>WebM Video</b> or <b>Animated GIF</b> with Green Screen background. In Premiere Pro, apply <i>Ultra Key</i> on the clip and select the green background color to key out seamlessly!
              </p>
            </div>

            {/* Export buttons */}
            <div className="space-y-2">
              <button
                onClick={onExportWebM}
                disabled={isExporting}
                className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 font-bold flex items-center justify-center gap-2 shadow-lg hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Download WebM Video (60/30 FPS)</span>
              </button>

              <button
                onClick={onExportGIF}
                disabled={isExporting}
                className="w-full py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-white font-bold border border-slate-700 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Download Looping Animated GIF</span>
              </button>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => onExportPNG(false)}
                  disabled={isExporting}
                  className="py-2 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <span>PNG (1080p)</span>
                </button>
                <button
                  onClick={() => onExportPNG(true)}
                  disabled={isExporting}
                  className="py-2 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <span>PNG (4K Ultra)</span>
                </button>
              </div>

              <button
                onClick={onCopyClipboard}
                className="w-full py-2 px-3 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold flex items-center justify-center gap-2 transition-all"
              >
                <span>Copy Current Frame to Clipboard</span>
              </button>

              <button
                onClick={onExportBatch}
                disabled={isExporting}
                className="w-full py-2 px-3 rounded-lg border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 text-center font-bold text-[11px] transition-all disabled:opacity-50 pt-3"
              >
                Export All 6 Templates as PNG Pack
              </button>
            </div>

            {/* Export progress */}
            {isExporting && exportProgress && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 mb-1">
                  <span>{exportProgress.msg}</span>
                  <span>{Math.round(exportProgress.pct * 100)}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-150"
                    style={{ width: `${exportProgress.pct * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

export interface TeamData {
  name: string;
  tag: string;
  color: string;
  score: string;
  logo: HTMLImageElement | null;
  logoUrl?: string;
}

export interface PlayerData {
  name: string;
  real: string;
  role: string;
  num: string;
  hero: string;
  heroTitle?: string;
  country: string;
  photo: HTMLImageElement | null;
  photoUrl?: string;
  photoZoom: number; // 0.5 to 2.5
  photoX: number; // offset -100 to 100
  photoY: number; // offset -100 to 100
  photoStyle: 'breakout' | 'cyber-frame' | 'hex-badge';
  k: string;
  d: string;
  a: string;
  kda: string;
  dmg: string;
  dmgPct?: string;
  gpm: string;
  kp?: string;
  rating: string;
  mvp: boolean;
}

export interface EventData {
  title: string;
  sub: string;
  date: string;
  venue: string;
  format: string;
  game: string;
  clock: string;
  prize: string;
  goldLead?: string;
  towersA?: string;
  towersB?: string;
  highlightText?: string;
  highlightSub?: string;
  casterName?: string;
  casterHandle?: string;
}

export type BgMode = 'greenscreen' | 'bluescreen' | 'magenta' | 'transparent' | 'gameplay' | 'stage';

export interface StyleSettings {
  font: string;
  bgMode: BgMode;
  accent: string;
  texture: string;
  glow: number;
  contrastBorder: boolean; // dark outline for sharp chroma keying without green fringe
  safeArea: boolean; // show broadcast action/title safe margins
  seed: number;
  lowerThirdType: 'player' | 'score' | 'highlight' | 'caster';
  lowerThirdPos: 'bottom-left' | 'bottom-center' | 'full-width';
  aspectRatio: '16:9' | '9:16' | '1:1' | 'banner';
  showRightPlayerPhoto: boolean; // Dedicated right-corner player picture
  rightPhotoBadge: 'jersey' | 'mvp' | 'role' | 'country';
  dragonCrests: boolean; // Authentic HOK dragon ornamentation
  scoreBugPos: 'top' | 'bottom';
  scoreBugStyle: 'esports-hud' | 'championship' | 'compact';
}

export interface AnimSettings {
  dur: number;
  fps: number;
  outW: number;
  pvq: number;
  loop: number | boolean;
  play: boolean;
  camera: boolean;
  shine: boolean;
  particles: boolean;
  countUp: boolean;
  speed: number;
}

export interface StudioState {
  tpl: 'lower' | 'banner' | 'mvp' | 'card' | 'score' | 'faceoff';
  event: EventData;
  a: TeamData;
  b: TeamData;
  p: PlayerData;
  s: StyleSettings;
  anim: AnimSettings;
}

export const TEMPLATES = {
  lower: {
    id: 'lower',
    name: 'Pro Lower Third',
    short: 'Lower Third',
    w: 1920,
    h: 1080, // Full 1080p frame with lower third in bottom area for video editing overlay!
    dw: 1920,
    desc: 'Player Spotlight, Scoreboard, or Penta Kill callout for video overlays',
  },
  banner: {
    id: 'banner',
    name: 'Grand Finals Clash Banner',
    short: 'Finals Clash',
    w: 1920,
    h: 1080,
    dw: 1920,
    desc: 'Full 16:9 championship matchup showcase with live scores & stadium lights',
  },
  mvp: {
    id: 'mvp',
    name: 'Match MVP Highlight',
    short: 'MVP Card',
    w: 1080,
    h: 1080,
    dw: 1080,
    desc: 'Square / Fullscreen crowning spotlight with rotating sunburst & stats',
  },
  card: {
    id: 'card',
    name: 'Player Showcase Card',
    short: 'Player Card',
    w: 1080,
    h: 1920, // 9:16 Vertical for TikTok / Shorts / Reels!
    dw: 1080,
    desc: '9:16 Vertical format optimized for TikTok, YouTube Shorts & Reels',
  },
  score: {
    id: 'score',
    name: 'Broadcast Score Bug',
    short: 'Score Bug',
    w: 1920,
    h: 300,
    dw: 1920,
    desc: 'Floating top/bottom HUD with series points, game clock & dragon counter',
  },
  faceoff: {
    id: 'faceoff',
    name: 'Lane Matchup Faceoff',
    short: 'Lane Faceoff',
    w: 1920,
    h: 640,
    dw: 1920,
    desc: 'Clash Lane / Jungle 1v1 duel matchup banner with split energy graphics',
  },
} as const;

export const TEAM_PRESETS = [
  { n: 'Wolves Esports', t: 'WLG', c: '#F08A00' },
  { n: 'AG Super Play', t: 'AG', c: '#E4002B' },
  { n: 'Team Secret', t: 'TS', c: '#00A3E0' },
  { n: 'LGD Gaming MY', t: 'LGD', c: '#E4002B' },
  { n: 'eStar Pro', t: 'ES', c: '#1A73E8' },
  { n: 'NOVA Esports', t: 'NOVA', c: '#00E0A4' },
  { n: 'Gen.G Esports', t: 'GEN', c: '#C9A227' },
  { n: 'Weibo Gaming', t: 'WBG', c: '#FF4500' },
  { n: 'Twisted Minds', t: 'TM', c: '#8B5CF6' },
  { n: 'Alpha7 Esports', t: 'A7', c: '#FF3B6B' },
  { n: 'Black Shrew Esports', t: 'BSE', c: '#8E9AAF' },
  { n: 'Team Vitality', t: 'VIT', c: '#FFD100' },
  { n: 'EDward Gaming M', t: 'EDG.M', c: '#2359D4' },
  { n: 'DRX Esports', t: 'DRX', c: '#5C93FF' },
  { n: 'TT Gaming', t: 'TT', c: '#9333EA' },
  { n: 'LOUD Gaming', t: 'LLL', c: '#10B981' },
];

export const HOK_HEROES = [
  { name: 'Mirror', title: 'Shadow Assassin', role: 'Jungler', avatarColor: '#8B5CF6' },
  { name: 'Luna', title: 'Moonlight Blade', role: 'Jungler', avatarColor: '#00A3E0' },
  { name: 'Florentino', title: 'The Gentle Blade', role: 'Clash Lane', avatarColor: '#E4002B' },
  { name: 'Lam', title: 'Abyssal Shark', role: 'Jungler', avatarColor: '#0EA5E9' },
  { name: 'Gongsun Li', title: 'Maple Umbrellist', role: 'Farm Lane', avatarColor: '#F59E0B' },
  { name: 'Lu Bu', title: 'Peerless Warlord', role: 'Clash Lane', avatarColor: '#EF4444' },
  { name: 'Angela', title: 'Chaos Sorceress', role: 'Mid Laner', avatarColor: '#EC4899' },
  { name: 'Arthur', title: 'Radiant Aegis', role: 'Clash Lane', avatarColor: '#FCD34D' },
  { name: 'Sun Shangxiang', title: 'Firecracker Rebel', role: 'Farm Lane', avatarColor: '#F97316' },
  { name: 'Diaochan', title: 'Lotus Dancer', role: 'Mid Laner', avatarColor: '#A855F7' },
  { name: 'Zhao Yun', title: 'Dragon General', role: 'Jungler', avatarColor: '#3B82F6' },
  { name: 'Mayene', title: 'Capoeira Prodigy', role: 'Clash Lane', avatarColor: '#F43F5E' },
  { name: 'Da Qiao', title: 'Oceanic Beacon', role: 'Roamer', avatarColor: '#06B6D4' },
  { name: 'Zhang Fei', title: 'Primal Behemoth', role: 'Roamer', avatarColor: '#84CC16' },
  { name: 'Hou Yi', title: 'Sun Piercer', role: 'Farm Lane', avatarColor: '#EAB308' },
  { name: 'Mai Shiranui', title: 'Alluring Flame', role: 'Mid Laner', avatarColor: '#DC2626' },
];

export const HIGHLIGHT_CALLOUTS = [
  { text: 'PENTA KILL!', sub: 'ACE! ENTIRE ENEMY TEAM WIPED OUT' },
  { text: 'QUADRA KILL!', sub: 'UNSTOPPABLE CLUTCH TEAMFIGHT' },
  { text: 'TEMPEST DRAGON STOLEN!', sub: 'SMITE CLUTCH TURNAROUND AT 20:00' },
  { text: 'HEROIC 1v3 DEFENSE!', sub: 'INHIBITOR SAVED UNDER HIGH GROUND' },
  { text: 'GODLIKE STREAK!', sub: '12 KILLS UNCHALLENGED DOMINATION' },
  { text: 'FIRST BLOOD!', sub: 'EARLY INVASION PUNISHED' },
  { text: 'SHUTDOWN!', sub: '1,000 GOLD BOUNTY SECURED' },
];

export const ROLES = ['Jungler', 'Clash Lane', 'Mid Laner', 'Farm Lane', 'Roamer', 'Support', 'Carry', 'Flex'];
export const COUNTRIES = ['CN', 'MY', 'ID', 'TH', 'VN', 'PH', 'KR', 'JP', 'BR', 'TR', 'SA', 'AE', 'SG', 'NA', 'EU'];
export const ACCENTS = ['#F2C75C', '#FFD84D', '#FF9A3D', '#FF3B6B', '#E4002B', '#8B5CF6', '#4FD1FF', '#00E0A4', '#FFFFFF'];

export const FONTMAP: Record<string, { fam: string; w: number }> = {
  'Anton': { fam: "'Anton', Impact, sans-serif", w: 400 },
  'Bebas Neue': { fam: "'Bebas Neue', Impact, sans-serif", w: 400 },
  'Chakra Petch': { fam: "'Chakra Petch', sans-serif", w: 700 },
  'Oxanium': { fam: "'Oxanium', sans-serif", w: 800 },
  'Rajdhani': { fam: "'Rajdhani', sans-serif", w: 700 },
  'Barlow Condensed': { fam: "'Barlow Condensed', sans-serif", w: 700 },
};

export const DEFAULT_STATE = (): StudioState => ({
  tpl: 'lower',
  event: {
    title: 'GRAND FINALS',
    sub: 'Honor of Kings Invitational · Season 2',
    date: 'SAT · DEC 14 · 19:00',
    venue: 'Axiata Arena · Kuala Lumpur',
    format: 'BO7',
    game: 'GAME 5',
    clock: '14:28',
    prize: '$1,000,000 PRIZE POOL',
    goldLead: '+3.8K GOLD LEAD',
    towersA: '7',
    towersB: '3',
    highlightText: 'PENTA KILL!',
    highlightSub: 'FEILONG CLUTCHES 1v4 TURNAROUND IN DRAGON PIT',
    casterName: 'WOLFSPEED & CYRA',
    casterHandle: '@HOK_Esports',
  },
  a: {
    name: 'Team Secret',
    tag: 'TS',
    color: '#00A3E0',
    score: '3',
    logo: null,
  },
  b: {
    name: 'LGD Gaming MY',
    tag: 'LGD',
    color: '#E4002B',
    score: '2',
    logo: null,
  },
  p: {
    name: 'FEILONG',
    real: 'Zhao Tianyu',
    role: 'Jungler',
    num: '07',
    hero: 'Mirror',
    heroTitle: 'Shadow Assassin',
    country: 'CN',
    photo: null,
    photoZoom: 1.0,
    photoX: 0,
    photoY: 0,
    photoStyle: 'breakout',
    k: '14',
    d: '2',
    a: '11',
    kda: '12.5',
    dmg: '96.4K',
    dmgPct: '38%',
    gpm: '842',
    kp: '74%',
    rating: '9.8',
    mvp: true,
  },
  s: {
    font: 'Anton',
    bgMode: 'greenscreen', // DEFAULT IS GREEN SCREEN as user requested!
    accent: '#F2C75C',
    texture: 'none',
    glow: 0.7,
    contrastBorder: true,
    safeArea: false,
    seed: 48291,
    lowerThirdType: 'player',
    lowerThirdPos: 'bottom-left',
    aspectRatio: '16:9',
    showRightPlayerPhoto: true,
    rightPhotoBadge: 'jersey',
    dragonCrests: true,
    scoreBugPos: 'top',
    scoreBugStyle: 'esports-hud',
  },
  anim: {
    dur: 3,
    fps: 30,
    outW: 1920,
    pvq: 0.75,
    loop: true,
    play: true,
    camera: true,
    shine: true,
    particles: true,
    countUp: true,
    speed: 1,
  },
});

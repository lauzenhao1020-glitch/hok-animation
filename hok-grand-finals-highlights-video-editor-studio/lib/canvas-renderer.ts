import {
  StudioState,
  PlayerData,
  TeamData,
  TEMPLATES,
  FONTMAP,
  HOK_HEROES,
} from './constants';

/* Helper Math & Color Functions */
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function hexToRgb(h: string) {
  h = (h || '#000').replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16) || 0;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgba(h: string, a: number) {
  const { r, g, b } = hexToRgb(h);
  return `rgba(${r},${g},${b},${a})`;
}

export function mix(a: string, b: string, t: number) {
  const x = hexToRgb(a), y = hexToRgb(b);
  const r = Math.round(x.r + (y.r - x.r) * t);
  const g = Math.round(x.g + (y.g - x.g) * t);
  const bl = Math.round(x.b + (y.b - x.b) * t);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
}

export function shade(h: string, t: number) {
  return t > 0 ? mix(h, '#ffffff', t) : mix(h, '#000000', -t);
}

export function lum(h: string) {
  const { r, g, b } = hexToRgb(h);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function mulberry32(a: number) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* Easing Functions */
export const eOC = (t: number) => 1 - Math.pow(1 - t, 3);
export const eOQ = (t: number) => 1 - Math.pow(1 - t, 5);
export const eOE = (t: number) => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
export const eIC = (t: number) => t * t * t;
export const eOB = (t: number) => {
  const c1 = 1.85, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/* Canvas Shape & Text Utilities */
export function poly(g: CanvasRenderingContext2D, pts: [number, number][]) {
  if (pts.length < 2) return;
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
}

export function hexPath(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, rot = 0) {
  g.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = rot + i * Math.PI / 3;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.closePath();
}

export function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  g.beginPath();
  g.moveTo(x + r, y);
  g.lineTo(x + w - r, y);
  g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r);
  g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(x + r, y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.lineTo(x, y + r);
  g.quadraticCurveTo(x, y, x + r, y);
  g.closePath();
}

export function clipDraw(g: CanvasRenderingContext2D, pathFn: () => void, fn: () => void) {
  g.save();
  pathFn();
  g.clip();
  fn();
  g.restore();
}

export function tWidth(g: CanvasRenderingContext2D, t: string | number, tr = 0): number {
  let w = 0;
  for (const c of String(t ?? '')) w += g.measureText(c).width + tr;
  return Math.max(0, w - tr);
}

export function tText(
  g: CanvasRenderingContext2D,
  t: string | number,
  x: number,
  y: number,
  o: {
    tr?: number;
    align?: 'left' | 'center' | 'right';
    stroke?: string | null;
    lw?: number;
  } = {}
) {
  const tr = o.tr || 0, align = o.align || 'left', stroke = o.stroke || null, lw = o.lw || 0;
  const str = String(t ?? '');
  if (!str) return 0;
  g.save();
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  const w = tWidth(g, str, tr);
  let cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  for (const c of str) {
    if (stroke && lw) {
      g.lineWidth = lw;
      g.strokeStyle = stroke;
      g.lineJoin = 'round';
      g.strokeText(c, cx, y);
    }
    g.fillText(c, cx, y);
    cx += g.measureText(c).width + tr;
  }
  g.restore();
  return w;
}

export function tTextAnim(
  g: CanvasRenderingContext2D,
  t: string | number,
  x: number,
  y: number,
  o: {
    tr?: number;
    align?: 'left' | 'center' | 'right';
    size?: number;
    p?: number;
    stagger?: number;
    rise?: number;
    stroke?: string | null;
    lw?: number;
    scaleIn?: number;
  } = {}
) {
  const tr = o.tr || 0, align = o.align || 'left', size = o.size || 40, p = o.p ?? 1;
  const stagger = o.stagger ?? 0.5, rise = o.rise ?? 0.42;
  const stroke = o.stroke || null, lw = o.lw || 0, scaleIn = o.scaleIn ?? 0.88;
  const ch = [...String(t ?? '')];
  if (!ch.length) return 0;
  const ws = ch.map(c => g.measureText(c).width);
  const total = ws.reduce((a, b) => a + b, 0) + tr * Math.max(0, ch.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const ga = g.globalAlpha;
  ch.forEach((c, i) => {
    const st = ch.length > 1 ? (i / (ch.length - 1)) * stagger : 0;
    const cp = clamp((p - st) / Math.max(0.0001, 1 - stagger), 0, 1);
    const w = ws[i];
    if (cp > 0) {
      const e = eOE(cp);
      g.save();
      g.globalAlpha = ga * Math.min(1, e * 1.5);
      g.translate(cx + w / 2, y + (1 - e) * rise * size);
      const sc = scaleIn + (1 - scaleIn) * e;
      g.scale(sc, sc);
      if (stroke && lw) {
        g.lineWidth = lw / sc;
        g.strokeStyle = stroke;
        g.lineJoin = 'round';
        g.strokeText(c, -w / 2, 0);
      }
      g.fillText(c, -w / 2, 0);
      g.restore();
    }
    cx += w + tr;
  });
  return total;
}

export function fitSize(
  g: CanvasRenderingContext2D,
  text: string,
  fontBuilder: (size: number) => string,
  maxW: number,
  start: number,
  min = 10,
  tr = 0
) {
  let s = start;
  while (s > min) {
    g.font = fontBuilder(s);
    if (tWidth(g, text, tr) <= maxW) break;
    s -= 1;
  }
  g.font = fontBuilder(s);
  return s;
}

export function countTo(str: string | number, p: number, countUp = true) {
  if (!countUp || p >= 1) return String(str);
  const s = String(str);
  const m = s.match(/^(-?[\d,]*\.?\d+)(.*)$/);
  if (!m) return s;
  const raw = m[1], neg = raw[0] === '-', clean = raw.replace(/,/g, '').replace('-', '');
  const num = parseFloat(clean) || 0, dec = (clean.split('.')[1] || '').length;
  const fixed = (num * eOC(p)).toFixed(dec);
  const out = m[1].indexOf(',') >= 0
    ? Number(fixed).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
    : fixed;
  return (neg ? '-' : '') + out + m[2];
}

/* Vector Icons */
export function iconKill(g: CanvasRenderingContext2D, x: number, y: number, s: number, col: string) {
  g.save();
  g.translate(x, y);
  g.rotate(-Math.PI / 4);
  g.fillStyle = col;
  poly(g, [[0, -s * 0.55], [s * 0.13, -s * 0.15], [s * 0.13, s * 0.28], [-s * 0.13, s * 0.28], [-s * 0.13, -s * 0.15]]);
  g.fill();
  g.fillRect(-s * 0.32, s * 0.28, s * 0.64, s * 0.11);
  g.fillRect(-s * 0.05, s * 0.39, s * 0.1, s * 0.24);
  g.beginPath();
  g.arc(0, s * 0.68, s * 0.09, 0, 7);
  g.fill();
  g.restore();
}

export function iconDeath(g: CanvasRenderingContext2D, x: number, y: number, s: number, col: string) {
  g.save();
  g.translate(x, y);
  g.fillStyle = col;
  g.beginPath();
  g.arc(0, -s * 0.1, s * 0.42, Math.PI, 0);
  g.lineTo(s * 0.42, s * 0.2);
  g.lineTo(-s * 0.42, s * 0.2);
  g.closePath();
  g.fill();
  g.fillRect(-s * 0.3, s * 0.22, s * 0.6, s * 0.22);
  g.fillStyle = '#0a0e18';
  g.beginPath();
  g.arc(-s * 0.17, -s * 0.08, s * 0.13, 0, 7);
  g.fill();
  g.beginPath();
  g.arc(s * 0.17, -s * 0.08, s * 0.13, 0, 7);
  g.fill();
  g.fillRect(-s * 0.03, s * 0.1, s * 0.06, s * 0.14);
  g.fillStyle = col;
  for (let i = -1; i <= 1; i++) g.fillRect(i * s * 0.16 - s * 0.03, s * 0.44, s * 0.06, s * 0.14);
  g.restore();
}

export function iconAssist(g: CanvasRenderingContext2D, x: number, y: number, s: number, col: string) {
  g.save();
  g.translate(x, y);
  g.strokeStyle = col;
  g.lineWidth = s * 0.14;
  g.lineCap = 'round';
  g.beginPath();
  g.arc(-s * 0.2, 0, s * 0.26, Math.PI * 0.6, Math.PI * 2.4);
  g.stroke();
  g.beginPath();
  g.arc(s * 0.2, 0, s * 0.26, Math.PI * 1.6, Math.PI * 3.4);
  g.stroke();
  g.restore();
}

export function iconBolt(g: CanvasRenderingContext2D, x: number, y: number, s: number, col: string) {
  g.save();
  g.translate(x, y);
  g.fillStyle = col;
  poly(g, [[s * 0.1, -s * 0.6], [-s * 0.32, s * 0.06], [-s * 0.04, s * 0.06], [-s * 0.14, s * 0.6], [s * 0.34, -s * 0.1], [s * 0.04, -s * 0.1]]);
  g.fill();
  g.restore();
}

export function iconCoin(g: CanvasRenderingContext2D, x: number, y: number, s: number, col: string) {
  g.save();
  g.translate(x, y);
  g.strokeStyle = col;
  g.lineWidth = s * 0.13;
  g.beginPath();
  g.arc(0, 0, s * 0.45, 0, 7);
  g.stroke();
  g.fillStyle = col;
  g.beginPath();
  g.arc(0, 0, s * 0.2, 0, 7);
  g.fill();
  g.restore();
}

export function iconStar(g: CanvasRenderingContext2D, x: number, y: number, s: number, col: string) {
  g.save();
  g.translate(x, y);
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? s * 0.22 : s * 0.52;
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  poly(g, pts);
  g.fillStyle = col;
  g.fill();
  g.restore();
}

export function iconFlame(g: CanvasRenderingContext2D, x: number, y: number, s: number, col: string) {
  g.save();
  g.translate(x, y);
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(0, -s * 0.55);
  g.quadraticCurveTo(s * 0.4, -s * 0.1, s * 0.4, s * 0.25);
  g.quadraticCurveTo(s * 0.35, s * 0.55, 0, s * 0.55);
  g.quadraticCurveTo(-s * 0.35, s * 0.55, -s * 0.4, s * 0.25);
  g.quadraticCurveTo(-s * 0.4, -s * 0.1, 0, -s * 0.55);
  g.closePath();
  g.fill();
  g.fillStyle = '#fffbe8';
  g.beginPath();
  g.arc(0, s * 0.25, s * 0.18, 0, 7);
  g.fill();
  g.restore();
}

/* Procedural Noise & Dust */
let PARTS: Array<{ x: number; y: number; s: number; v: number; ph: number; a: number; w: number }> = [];
let PSEED = -1;

export function dustField(g: CanvasRenderingContext2D, W: number, H: number, col: string, p: number, seed: number) {
  if (PSEED !== seed) {
    PARTS = [];
    const rnd = mulberry32((seed + 137) >>> 0);
    for (let i = 0; i < 80; i++) {
      PARTS.push({
        x: rnd(),
        y: rnd(),
        s: 0.8 + rnd() * 2.5,
        v: 0.08 + rnd() * 0.3,
        ph: rnd() * 6.28,
        a: 0.2 + rnd() * 0.6,
        w: rnd(),
      });
    }
    PSEED = seed;
  }
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (const part of PARTS) {
    const yy = ((part.y - p * part.v) % 1 + 1) % 1;
    const xx = (part.x + Math.sin(p * 9.42 + part.ph) * 0.015) * W;
    const ypos = yy * H;
    const tw = 0.5 + 0.5 * Math.sin(p * 18.8 + part.ph);
    g.globalAlpha = clamp(part.a * tw, 0, 1);
    g.fillStyle = part.w > 0.65 ? '#FFF8D6' : col;
    g.beginPath();
    g.arc(xx, ypos, Math.max(1, part.s * (W / 1800)), 0, 7);
    g.fill();
  }
  g.restore();
}

/* Gold Gradient helper */
export function goldGrad(g: CanvasRenderingContext2D, y: number, size: number, accent: string) {
  const gr = g.createLinearGradient(0, y - size * 0.95, 0, y + size * 0.15);
  gr.addColorStop(0, '#FFFFFF');
  gr.addColorStop(0.2, '#FFF9E8');
  gr.addColorStop(0.5, accent);
  gr.addColorStop(0.75, shade(accent, -0.2));
  gr.addColorStop(1, shade(accent, -0.6));
  return gr;
}

export function shimmerText(
  g: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  fontStr: string,
  o: { tr?: number; align?: 'left' | 'center' | 'right'; alpha?: number; p?: number } = {}
) {
  const tr = o.tr || 0, align = o.align || 'left', alpha = o.alpha ?? 0.6, p = o.p ?? 0.5;
  if (p <= 0 || p >= 1) return;
  const str = String(text ?? '');
  if (!str) return;
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.font = fontStr;
  const w = tWidth(g, str, tr), bw = Math.max(size * 0.8, 12);
  const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  const gx = x0 - bw * 2 + p * (w + bw * 4);
  const gr = g.createLinearGradient(gx - bw, 0, gx + bw, 0);
  gr.addColorStop(0, 'rgba(255,255,255,0)');
  gr.addColorStop(0.5, `rgba(255,255,255,${alpha})`);
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  tText(g, str, x, y, { tr, align });
  g.restore();
}

/* =========================================================================
   HONOR OF KINGS (王者荣耀) AUTHENTIC CHAMPIONSHIP THEME ENGINE
   ========================================================================= */

/** Interlocking Imperial Dragon Scale lattice pattern on dark obsidian metal */
export function drawHOKDragonScaleTexture(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  col: string,
  alpha = 0.07
) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();

  g.strokeStyle = col;
  g.lineWidth = 1;
  g.globalAlpha = alpha;

  const r = 18;
  const stepX = r * 1.6;
  const stepY = r * 0.9;
  const startX = x - r * 2;
  const startY = y - r * 2;
  const endX = x + w + r * 2;
  const endY = y + h + r * 2;

  let row = 0;
  for (let cy = startY; cy <= endY; cy += stepY) {
    const shift = (row % 2) * (stepX / 2);
    for (let cx = startX + shift; cx <= endX; cx += stepX) {
      g.beginPath();
      // Upward pointing dragon scale arc with sharp center crest
      g.arc(cx, cy, r, Math.PI * 0.15, Math.PI * 0.85);
      g.stroke();

      // Inner scale rib
      g.beginPath();
      g.moveTo(cx, cy + r * 0.4);
      g.lineTo(cx, cy + r * 0.85);
      g.stroke();
    }
    row++;
  }

  g.restore();
}

/** Golden Dragon Horn / Phoenix Winglet Corner Bracket */
export function drawHOKDragonHorn(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  angle: number,
  teamColor: string,
  accent: string
) {
  g.save();
  g.translate(x, y);
  g.rotate(angle);

  // Outer Dragon Blade
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(size * 1.2, -size * 0.22);
  g.lineTo(size * 0.75, size * 0.12);
  g.lineTo(size * 1.5, size * 0.35);
  g.lineTo(size * 0.5, size * 0.5);
  g.lineTo(size * 0.9, size * 0.85);
  g.lineTo(0, size * 0.35);
  g.closePath();

  const hornGrad = g.createLinearGradient(0, 0, size * 1.5, size * 0.85);
  hornGrad.addColorStop(0, '#FFFFFF');
  hornGrad.addColorStop(0.3, accent);
  hornGrad.addColorStop(0.7, teamColor);
  hornGrad.addColorStop(1, '#92400E');
  g.fillStyle = hornGrad;
  g.shadowColor = rgba(accent, 0.85);
  g.shadowBlur = size * 0.4;
  g.fill();

  // Golden Spine Line
  g.strokeStyle = '#FFFFFF';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(size * 1.35, size * 0.3);
  g.stroke();

  g.restore();
}

/** Authentic HOK Hero Class / Role Glyphs */
export function drawHOKRoleIcon(
  g: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  role: string,
  col: string,
  accent: string
) {
  g.save();
  g.translate(cx, cy);
  const rName = String(role || '').toLowerCase();

  // Dark backing plate
  g.beginPath();
  g.arc(0, 0, s * 0.65, 0, Math.PI * 2);
  g.fillStyle = '#060B18';
  g.fill();
  g.strokeStyle = accent;
  g.lineWidth = 1.5;
  g.stroke();

  g.fillStyle = col;
  g.strokeStyle = col;
  g.lineWidth = 2;
  g.lineCap = 'round';
  g.lineJoin = 'round';

  if (rName.includes('jung') || rName.includes('assassin')) {
    // Jungler: Dragon Claws & Smite Blades (惩击龙爪)
    poly(g, [[-s * 0.35, -s * 0.4], [-s * 0.2, s * 0.1], [-s * 0.3, s * 0.3], [-s * 0.45, s * 0.1]]);
    g.fill();
    poly(g, [[0, -s * 0.55], [s * 0.15, 0], [0, s * 0.4], [-s * 0.15, 0]]);
    g.fill();
    poly(g, [[s * 0.35, -s * 0.4], [s * 0.45, s * 0.1], [s * 0.3, s * 0.3], [s * 0.2, s * 0.1]]);
    g.fill();
  } else if (rName.includes('clash') || rName.includes('warrior') || rName.includes('tank')) {
    // Clash Lane: Warlord Halberd / Battleaxe (破军战刃)
    g.beginPath();
    g.moveTo(-s * 0.45, -s * 0.45);
    g.lineTo(s * 0.45, s * 0.45);
    g.moveTo(s * 0.45, -s * 0.45);
    g.lineTo(-s * 0.45, s * 0.45);
    g.stroke();
    poly(g, [[0, -s * 0.55], [s * 0.28, -s * 0.25], [-s * 0.28, -s * 0.25]]);
    g.fill();
  } else if (rName.includes('mid') || rName.includes('mage')) {
    // Mid Lane: Arcane Lotus & Eye of Wisdom (法印灵莲)
    g.beginPath();
    g.arc(0, 0, s * 0.22, 0, 7);
    g.fill();
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      g.save();
      g.rotate(a);
      g.beginPath();
      g.moveTo(0, -s * 0.52);
      g.quadraticCurveTo(s * 0.2, -s * 0.25, 0, -s * 0.15);
      g.quadraticCurveTo(-s * 0.2, -s * 0.25, 0, -s * 0.52);
      g.fill();
      g.restore();
    }
  } else if (rName.includes('farm') || rName.includes('archer') || rName.includes('carry')) {
    // Farm Lane: Sun-Piercing Bow & Arrow (后羿射日神弓)
    g.beginPath();
    g.arc(0, 0, s * 0.4, -Math.PI * 0.65, Math.PI * 0.65);
    g.stroke();
    g.beginPath();
    g.moveTo(-s * 0.3, 0);
    g.lineTo(s * 0.45, 0);
    g.moveTo(s * 0.25, -s * 0.18);
    g.lineTo(s * 0.45, 0);
    g.lineTo(s * 0.25, s * 0.18);
    g.stroke();
  } else {
    // Roamer / Support: Celestial Dragon Aegis (守护圣盾)
    poly(g, [[0, -s * 0.5], [s * 0.38, -s * 0.3], [s * 0.32, s * 0.2], [0, s * 0.52], [-s * 0.32, s * 0.2], [-s * 0.38, -s * 0.3]]);
    g.fill();
    g.fillStyle = '#060B18';
    g.beginPath();
    g.arc(0, 0, s * 0.18, 0, 7);
    g.fill();
  }

  g.restore();
}

/** Luminous Dragon Pearl (龙珠) Series Win Dot */
export function drawHOKDragonPearl(
  g: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  active: boolean,
  teamColor: string,
  accent: string,
  p: number
) {
  g.save();

  // Outer Dragon Claw Setting (Bezel)
  hexPath(g, cx, cy, r + 2.5, Math.PI / 6);
  g.fillStyle = '#040711';
  g.fill();
  g.lineWidth = 1.2;
  g.strokeStyle = active ? accent : 'rgba(255,255,255,0.2)';
  g.stroke();

  if (active) {
    // Luminous Dragon Fire Aura
    g.save();
    g.shadowColor = teamColor;
    g.shadowBlur = r * 1.8;
    g.beginPath();
    g.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
    const rad = g.createRadialGradient(cx - r * 0.25, cy - r * 0.25, 0, cx, cy, r);
    rad.addColorStop(0, '#FFFFFF');
    rad.addColorStop(0.3, '#FFF7D6');
    rad.addColorStop(0.7, teamColor);
    rad.addColorStop(1, shade(teamColor, -0.5));
    g.fillStyle = rad;
    g.fill();
    g.restore();

    // Inner White Star Specular
    g.fillStyle = '#FFFFFF';
    g.beginPath();
    g.arc(cx - r * 0.3, cy - r * 0.3, r * 0.25, 0, 7);
    g.fill();

    // Dragon Fire Ring
    g.strokeStyle = accent;
    g.lineWidth = 1;
    g.beginPath();
    g.arc(cx, cy, r * 0.95, 0, 7);
    g.stroke();
  } else {
    // Inactive dark obsidian pearl
    g.beginPath();
    g.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
    g.fillStyle = 'rgba(255,255,255,0.06)';
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.18)';
    g.lineWidth = 1;
    g.stroke();
  }

  g.restore();
}

/** Silver Dragon Cup (银龙杯) Championship Trophy Trophy Silhouette */
export function drawHOKSilverDragonCup(
  g: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  accent: string
) {
  g.save();
  g.translate(cx, cy);

  // Trophy Cup Body
  const trophyGrad = g.createLinearGradient(0, -s * 0.6, 0, s * 0.5);
  trophyGrad.addColorStop(0, '#FFFFFF');
  trophyGrad.addColorStop(0.4, accent);
  trophyGrad.addColorStop(0.7, '#E2E8F0');
  trophyGrad.addColorStop(1, '#64748B');
  g.fillStyle = trophyGrad;

  // Cup Bowl
  poly(g, [
    [-s * 0.36, -s * 0.55],
    [s * 0.36, -s * 0.55],
    [s * 0.28, 0],
    [s * 0.08, s * 0.25],
    [-s * 0.08, s * 0.25],
    [-s * 0.28, 0],
  ]);
  g.fill();

  // Dual Coiled Dragon Handles
  g.strokeStyle = accent;
  g.lineWidth = Math.max(1.5, s * 0.08);
  g.lineCap = 'round';
  // Left Dragon
  g.beginPath();
  g.moveTo(-s * 0.32, -s * 0.45);
  g.quadraticCurveTo(-s * 0.6, -s * 0.25, -s * 0.3, 0);
  g.stroke();
  // Right Dragon
  g.beginPath();
  g.moveTo(s * 0.32, -s * 0.45);
  g.quadraticCurveTo(s * 0.6, -s * 0.25, s * 0.3, 0);
  g.stroke();

  // Pedestal Base
  poly(g, [
    [-s * 0.12, s * 0.25],
    [s * 0.12, s * 0.25],
    [s * 0.24, s * 0.5],
    [-s * 0.24, s * 0.5],
  ]);
  g.fill();

  // Imperial Crown Crest on Top
  poly(g, [
    [-s * 0.25, -s * 0.55],
    [-s * 0.18, -s * 0.75],
    [0, -s * 0.62],
    [s * 0.18, -s * 0.75],
    [s * 0.25, -s * 0.55],
  ]);
  g.fill();

  g.restore();
}

/** Official HOK Octagonal Championship Seal (王者印信) */
export function drawHOKChampionshipSeal(
  g: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  accent: string
) {
  g.save();
  g.translate(cx, cy);

  // Octagonal Royal Seal Base
  const pts: [number, number][] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + Math.PI / 8;
    pts.push([Math.cos(a) * s, Math.sin(a) * s]);
  }
  poly(g, pts);
  g.fillStyle = '#8B0000'; // Imperial Lacquer Vermilion
  g.fill();
  g.lineWidth = 2;
  g.strokeStyle = accent;
  g.stroke();

  // Golden Inscribed Crown
  g.font = `900 ${Math.round(s * 0.7)}px 'Oxanium', sans-serif`;
  g.fillStyle = accent;
  tText(g, 'KPL', 0, s * 0.26, { align: 'center' });

  g.restore();
}

/* Hero Portrait / Avatar Renderer */
export function drawHeroAvatar(
  g: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  photo: HTMLImageElement | null,
  heroName: string,
  teamColor: string,
  accent: string,
  contrastBorder = true
) {
  g.save();
  // Underglow
  g.shadowColor = rgba(accent, 0.85);
  g.shadowBlur = r * 0.5;

  // Dark backing plate with contrast border
  if (contrastBorder) {
    hexPath(g, cx, cy, r + 6, Math.PI / 6);
    g.fillStyle = '#020308';
    g.fill();
    g.lineWidth = 4;
    g.strokeStyle = '#020308';
    g.stroke();
  }

  // Metallic frame
  const frameGrad = g.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  frameGrad.addColorStop(0, '#FFFFFF');
  frameGrad.addColorStop(0.3, accent);
  frameGrad.addColorStop(0.7, shade(teamColor, -0.3));
  frameGrad.addColorStop(1, shade(accent, -0.6));
  hexPath(g, cx, cy, r, Math.PI / 6);
  g.fillStyle = frameGrad;
  g.fill();
  g.shadowBlur = 0;

  // Inner portrait area
  const innerR = r * 0.88;
  clipDraw(
    g,
    () => hexPath(g, cx, cy, innerR, Math.PI / 6),
    () => {
      if (photo && photo.naturalWidth) {
        // Draw user uploaded image
        const imgRatio = photo.naturalWidth / photo.naturalHeight;
        const targetW = innerR * 2.2;
        const targetH = targetW / imgRatio;
        g.drawImage(photo, cx - targetW / 2, cy - targetH / 2, targetW, targetH);
      } else {
        // Procedural high-tier hero avatar placeholder
        const hName = String(heroName || 'Mirror').trim();
        const heroInfo = HOK_HEROES.find(h => h.name.toLowerCase() === hName.toLowerCase()) || HOK_HEROES[0];
        const hColor = heroInfo?.avatarColor || teamColor;

        const bg = g.createRadialGradient(cx, cy, 0, cx, cy, innerR);
        bg.addColorStop(0, shade(hColor, 0.2));
        bg.addColorStop(0.7, shade(hColor, -0.5));
        bg.addColorStop(1, '#05070f');
        g.fillStyle = bg;
        g.fillRect(cx - innerR, cy - innerR, innerR * 2, innerR * 2);

        // Stylized warrior crest / silhouette
        g.fillStyle = 'rgba(255,255,255,0.15)';
        g.beginPath();
        g.arc(cx, cy - innerR * 0.15, innerR * 0.42, 0, 7);
        g.fill();
        g.beginPath();
        g.moveTo(cx - innerR * 0.8, cy + innerR * 0.95);
        g.quadraticCurveTo(cx, cy + innerR * 0.15, cx + innerR * 0.8, cy + innerR * 0.95);
        g.closePath();
        g.fill();

        // Hero initial or monogram
        g.font = `800 ${innerR * 0.65}px 'Oxanium', sans-serif`;
        g.fillStyle = '#FFFFFF';
        g.shadowColor = 'rgba(0,0,0,0.8)';
        g.shadowBlur = 8;
        tText(g, (hName.slice(0, 2) || 'HK').toUpperCase(), cx, cy + innerR * 0.24, { align: 'center' });
        g.shadowBlur = 0;
      }

      // Bottom darkening gradient
      const botGrad = g.createLinearGradient(0, cy + innerR * 0.2, 0, cy + innerR);
      botGrad.addColorStop(0, 'rgba(0,0,0,0)');
      botGrad.addColorStop(1, 'rgba(0,0,0,0.75)');
      g.fillStyle = botGrad;
      g.fillRect(cx - innerR, cy, innerR * 2, innerR);
    }
  );

  // Inner cyber stroke
  hexPath(g, cx, cy, innerR, Math.PI / 6);
  g.lineWidth = 2;
  g.strokeStyle = rgba(accent, 0.8);
  g.stroke();

  g.restore();
}

/* Team Logo Badge Renderer */
export function drawTeamLogoBadge(
  g: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  team: TeamData,
  accent: string,
  contrastBorder = true
) {
  g.save();

  // Dark backing plate with contrast border for clean green screen keying
  if (contrastBorder) {
    hexPath(g, cx, cy, r + 5, Math.PI / 6);
    g.fillStyle = '#020308';
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = '#020308';
    g.stroke();
  }

  // Outer glowing ring
  g.save();
  g.shadowColor = rgba(team.color, 0.85);
  g.shadowBlur = r * 0.45;
  hexPath(g, cx, cy, r, Math.PI / 6);
  const borderGrad = g.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  borderGrad.addColorStop(0, '#FFFFFF');
  borderGrad.addColorStop(0.35, team.color);
  borderGrad.addColorStop(0.75, shade(team.color, -0.4));
  borderGrad.addColorStop(1, accent);
  g.fillStyle = borderGrad;
  g.fill();
  g.restore();

  // Inner logo plate
  const innerR = r * 0.86;
  clipDraw(
    g,
    () => hexPath(g, cx, cy, innerR, Math.PI / 6),
    () => {
      // Dark background
      const bg = g.createRadialGradient(cx, cy, 0, cx, cy, innerR);
      bg.addColorStop(0, '#0e172a');
      bg.addColorStop(0.7, '#070b15');
      bg.addColorStop(1, '#020408');
      g.fillStyle = bg;
      g.fillRect(cx - innerR, cy - innerR, innerR * 2, innerR * 2);

      if (team.logo && team.logo.naturalWidth > 0 && team.logo.naturalHeight > 0) {
        // Draw user uploaded image with proper fit
        const imgAspect = team.logo.naturalWidth / team.logo.naturalHeight;
        let tw = innerR * 1.68;
        let th = tw / imgAspect;
        if (th > innerR * 1.68) {
          th = innerR * 1.68;
          tw = th * imgAspect;
        }
        g.drawImage(team.logo, cx - tw / 2, cy - th / 2, tw, th);
      } else {
        // High-tier HOK team monogram / crest
        g.fillStyle = rgba(team.color, 0.22);
        g.beginPath();
        g.arc(cx, cy, innerR * 0.72, 0, 7);
        g.fill();

        g.font = `800 ${Math.round(innerR * 0.62)}px 'Oxanium', sans-serif`;
        g.fillStyle = '#FFFFFF';
        g.shadowColor = rgba(team.color, 0.9);
        g.shadowBlur = 8;
        tText(g, (team.tag || 'TEAM').slice(0, 3).toUpperCase(), cx, cy + innerR * 0.22, { align: 'center' });
        g.shadowBlur = 0;
      }
    }
  );

  // Inner border
  hexPath(g, cx, cy, innerR, Math.PI / 6);
  g.lineWidth = 1.5;
  g.strokeStyle = rgba(accent, 0.75);
  g.stroke();

  g.restore();
}

/* Background Painting */
export function paintBackground(
  g: CanvasRenderingContext2D,
  W: number,
  H: number,
  state: StudioState,
  p: number
) {
  const mode = state.s.bgMode;

  if (mode === 'transparent') {
    g.clearRect(0, 0, W, H);
    return;
  }

  if (mode === 'greenscreen') {
    // Pure broadcast chroma key green
    g.fillStyle = '#00FF00';
    g.fillRect(0, 0, W, H);
    return;
  }

  if (mode === 'bluescreen') {
    // Pure broadcast chroma key blue
    g.fillStyle = '#0000FF';
    g.fillRect(0, 0, W, H);
    return;
  }

  if (mode === 'magenta') {
    g.fillStyle = '#FF00FF';
    g.fillRect(0, 0, W, H);
    return;
  }

  if (mode === 'gameplay') {
    // Simulated HOK Gameplay frame to test chroma key cleanliness directly in preview
    const gr = g.createLinearGradient(0, 0, W, H);
    gr.addColorStop(0, '#101726');
    gr.addColorStop(0.5, '#182438');
    gr.addColorStop(1, '#0a101d');
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);

    // River water reflection and lane paths
    g.fillStyle = 'rgba(14, 165, 233, 0.12)';
    g.beginPath();
    g.ellipse(W * 0.5, H * 0.45, W * 0.45, H * 0.25, -0.2, 0, 7);
    g.fill();

    // Simulated turret & hero combat indicators
    const rnd = mulberry32(1234);
    for (let i = 0; i < 12; i++) {
      const hx = W * (0.15 + rnd() * 0.7);
      const hy = H * (0.2 + rnd() * 0.5);
      const isRed = i % 2 === 0;
      // HP bar
      g.fillStyle = 'rgba(0,0,0,0.8)';
      g.fillRect(hx - 24, hy - 40, 48, 6);
      g.fillStyle = isRed ? '#EF4444' : '#3B82F6';
      g.fillRect(hx - 22, hy - 38, 44 * (0.4 + rnd() * 0.6), 3);
      // Hero circle
      g.fillStyle = isRed ? 'rgba(239, 68, 68, 0.7)' : 'rgba(59, 130, 246, 0.7)';
      g.beginPath();
      g.arc(hx, hy - 16, 14, 0, 7);
      g.fill();
    }

    // Mini map outline in top right corner
    g.strokeStyle = 'rgba(255,255,255,0.2)';
    g.lineWidth = 2;
    g.strokeRect(W - 240, 20, 220, 160);
    g.fillStyle = 'rgba(0,0,0,0.6)';
    g.fillRect(W - 240, 20, 220, 160);
    g.font = "600 13px 'Chakra Petch', sans-serif";
    g.fillStyle = 'rgba(255,255,255,0.5)';
    tText(g, 'SIMULATED HOK GAMEPLAY · CHROMA TEST', 30, 40);
    return;
  }

  // 'stage': Grand Finals esports arena with procedural spotlights & beams
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#060912');
  gr.addColorStop(0.5, '#0b1020');
  gr.addColorStop(1, '#04060c');
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);

  // Stadium spotlight beams
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 8; i++) {
    const bx = W * (0.1 + i * 0.12);
    const ang = -0.3 + Math.sin(p * 4 + i) * 0.15;
    const beamLen = H * 1.3;
    g.save();
    g.translate(bx, 0);
    g.rotate(ang);
    const bgr = g.createLinearGradient(0, 0, 0, beamLen);
    const col = i % 2 === 0 ? state.s.accent : state.a.color;
    bgr.addColorStop(0, rgba(col, 0.35));
    bgr.addColorStop(0.6, rgba(col, 0.08));
    bgr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = bgr;
    poly(g, [[-10, 0], [10, 0], [80, beamLen], [-80, beamLen]]);
    g.fill();
    g.restore();
  }
  g.restore();

  dustField(g, W, H, state.s.accent, p, state.s.seed);
}

/* Action & Title Safe Margins Guide */
export function drawSafeGuides(g: CanvasRenderingContext2D, W: number, H: number) {
  g.save();
  // Action Safe 93%
  const asX = W * 0.035, asY = H * 0.035, asW = W * 0.93, asH = H * 0.93;
  g.strokeStyle = 'rgba(16, 185, 129, 0.7)';
  g.lineWidth = 1;
  g.setLineDash([8, 8]);
  g.strokeRect(asX, asY, asW, asH);

  // Title Safe 90%
  const tsX = W * 0.05, tsY = H * 0.05, tsW = W * 0.90, tsH = H * 0.90;
  g.strokeStyle = 'rgba(245, 158, 11, 0.8)';
  g.strokeRect(tsX, tsY, tsW, tsH);
  g.setLineDash([]);

  g.font = "600 11px 'Chakra Petch', sans-serif";
  g.fillStyle = 'rgba(16, 185, 129, 0.9)';
  tText(g, 'ACTION SAFE 93%', asX + 8, asY + 16);
  g.fillStyle = 'rgba(245, 158, 11, 0.9)';
  tText(g, 'TITLE SAFE 90%', tsX + 8, tsY + 16);
  g.restore();
}

/* =========================================================================
   RIGHT CORNER PLAYER PICTURE (FOR LOWER THIRDS & BROADCAST PLATES)
   ========================================================================= */
export function drawRightCornerPlayerPicture(
  g: CanvasRenderingContext2D,
  picX: number,
  boxY: number,
  picW: number,
  boxH: number,
  u: number,
  player: PlayerData,
  teamColor: string,
  accent: string,
  contrast: boolean,
  p: number
) {
  const breakoutH = 86 * u; // Stands tall above the lower third
  const topY = boxY - breakoutH;
  const totalH = boxH + breakoutH;
  const sk = 32 * u;

  g.save();

  // 1. Dark backing contour for 100% clean green-screen keying
  if (contrast) {
    poly(g, [
      [picX + sk - 4, topY - 4],
      [picX + picW + 4, topY - 4],
      [picX + picW + 4, topY + totalH + 4],
      [picX - 4, topY + totalH + 4],
    ]);
    g.fillStyle = '#020409';
    g.fill();
  }

  // 2. Main Picture Plate & Underglow
  g.save();
  g.shadowColor = rgba(accent, 0.85);
  g.shadowBlur = 24 * u;
  poly(g, [
    [picX + sk, topY],
    [picX + picW, topY],
    [picX + picW, topY + totalH],
    [picX, topY + totalH],
  ]);
  const bgGrad = g.createLinearGradient(picX, topY, picX + picW, topY + totalH);
  bgGrad.addColorStop(0, shade(teamColor, -0.4));
  bgGrad.addColorStop(0.35, '#0c1322');
  bgGrad.addColorStop(1, '#03050a');
  g.fillStyle = bgGrad;
  g.fill();

  // Authentic HOK Imperial Dragon Scale Texture overlay
  drawHOKDragonScaleTexture(g, picX, topY, picW, totalH, accent, 0.09);
  g.restore();

  // 3. Clip and draw Player Photo (or procedural pro player silhouette)
  clipDraw(
    g,
    () => {
      poly(g, [
        [picX + sk + 2 * u, topY + 2 * u],
        [picX + picW - 2 * u, topY + 2 * u],
        [picX + picW - 2 * u, topY + totalH - 2 * u],
        [picX + 2 * u, topY + totalH - 2 * u],
      ]);
    },
    () => {
      const zoom = player.photoZoom || 1.0;
      const ox = (player.photoX || 0) * u;
      const oy = (player.photoY || 0) * u;

      if (player.photo && player.photo.naturalWidth) {
        // User provided photo
        const aspect = player.photo.naturalWidth / player.photo.naturalHeight;
        const targetW = picW * 1.35 * zoom;
        const targetH = targetW / aspect;
        const imgX = picX + picW / 2 - targetW / 2 + ox;
        const imgY = topY + totalH * 0.44 - targetH / 2 + oy;

        g.drawImage(player.photo, imgX, imgY, targetW, targetH);
      } else {
        // High-tier HOK Pro Athlete Bust Silhouette with dragon armor collar
        const cx = picX + picW / 2 + ox;
        const cy = topY + totalH * 0.52 + oy;

        // Head
        g.fillStyle = '#CBD5E1';
        g.beginPath();
        g.arc(cx, cy - 48 * u, 34 * u * zoom, 0, 7);
        g.fill();

        // Esports Haircut / Visor
        g.fillStyle = '#0f172a';
        g.beginPath();
        g.arc(cx, cy - 54 * u, 35 * u * zoom, Math.PI * 0.8, Math.PI * 2.2);
        g.fill();

        // Pro gamer headphones with team color glowing rings
        g.fillStyle = teamColor;
        g.beginPath();
        g.arc(cx - 36 * u * zoom, cy - 48 * u, 10 * u * zoom, 0, 7);
        g.arc(cx + 36 * u * zoom, cy - 48 * u, 10 * u * zoom, 0, 7);
        g.fill();

        // Jersey Shoulders / Torso with HOK Dragon Pauldrons
        g.fillStyle = shade(teamColor, -0.2);
        g.beginPath();
        g.moveTo(cx - 82 * u * zoom, topY + totalH);
        g.quadraticCurveTo(cx - 70 * u * zoom, cy - 10 * u, cx, cy - 10 * u);
        g.quadraticCurveTo(cx + 70 * u * zoom, cy - 10 * u, cx + 82 * u * zoom, topY + totalH);
        g.closePath();
        g.fill();

        // Imperial Dragon Pauldron Trim
        g.strokeStyle = accent;
        g.lineWidth = 3 * u;
        g.beginPath();
        g.moveTo(cx - 28 * u * zoom, cy - 10 * u);
        g.lineTo(cx, cy + 14 * u);
        g.lineTo(cx + 28 * u * zoom, cy - 10 * u);
        g.stroke();

        // Team Monogram on chest
        g.font = `800 ${14 * u}px 'Oxanium', sans-serif`;
        g.fillStyle = '#FFFFFF';
        tText(g, 'KPL PRO', cx, cy + 32 * u, { align: 'center', tr: 2 * u });

        // Watermark helper
        g.font = `600 ${10.5 * u}px 'Chakra Petch', sans-serif`;
        g.fillStyle = 'rgba(255,255,255,0.6)';
        tText(g, 'HOK PLAYER CAM', cx, cy + 50 * u, { align: 'center', tr: 1 * u });
      }

      // Bottom darkening gradient so the bust merges smoothly into lower third
      const fadeGrad = g.createLinearGradient(0, topY + totalH - 60 * u, 0, topY + totalH);
      fadeGrad.addColorStop(0, 'rgba(4,6,12,0)');
      fadeGrad.addColorStop(1, 'rgba(4,6,12,0.92)');
      g.fillStyle = fadeGrad;
      g.fillRect(picX - 20, topY + totalH - 60 * u, picW + 40, 60 * u);
    }
  );

  // 4. Gold & Team Color Energy Bevel with Chamfered Dragon Spine
  poly(g, [
    [picX + sk, topY],
    [picX + picW, topY],
    [picX + picW, topY + totalH],
    [picX, topY + totalH],
  ]);
  const frameBorder = g.createLinearGradient(picX, topY, picX + picW, topY + totalH);
  frameBorder.addColorStop(0, '#FFFFFF');
  frameBorder.addColorStop(0.25, accent);
  frameBorder.addColorStop(0.7, teamColor);
  frameBorder.addColorStop(1, accent);
  g.lineWidth = 2.5 * u;
  g.strokeStyle = frameBorder;
  g.stroke();

  // Top Light Streak
  g.fillStyle = accent;
  g.fillRect(picX + sk, topY, picW - sk, 3.5 * u);

  // HOK Golden Dragon Horn Corner Bracket on Top-Right
  drawHOKDragonHorn(g, picX + picW - 4 * u, topY + 4 * u, 24 * u, -Math.PI * 0.15, teamColor, accent);

  // 5. Floating Badges on the Picture Frame
  // Jersey Number Badge (Top right)
  const numW = 46 * u, numH = 26 * u;
  const numX = picX + picW - numW - 14 * u;
  const numY = topY + 12 * u;
  poly(g, [
    [numX + 6 * u, numY],
    [numX + numW, numY],
    [numX + numW - 6 * u, numY + numH],
    [numX, numY + numH],
  ]);
  g.fillStyle = '#060913';
  g.fill();
  g.strokeStyle = accent;
  g.lineWidth = 1.5 * u;
  g.stroke();
  g.font = `800 ${15 * u}px 'Oxanium', sans-serif`;
  g.fillStyle = accent;
  tText(g, `#${player.num}`, numX + numW / 2, numY + numH / 2 + 5 * u, { align: 'center' });

  // Official HOK Hero Class Glyph Badge
  drawHOKRoleIcon(g, picX + sk + 24 * u, topY + 22 * u, 18 * u, player.role, teamColor, accent);

  // Player Cam / Role Label (Bottom right)
  g.font = `700 ${11.5 * u}px 'Barlow Condensed', sans-serif`;
  g.fillStyle = 'rgba(255,255,255,0.95)';
  tText(g, `${player.country} · ${player.role.toUpperCase()}`, picX + picW - 12 * u, topY + totalH - 10 * u, {
    align: 'right',
    tr: 1.5 * u,
  });

  // MVP Star / Flame if active
  if (player.mvp) {
    iconStar(g, picX + sk + 48 * u, topY + 20 * u, 14 * u, accent);
  }

  g.restore();
}

/* =========================================================================
   1. PRO LOWER THIRD RENDERER (ENHANCED WITH RIGHT-CORNER PLAYER PICTURE)
   ========================================================================= */
export function drawLowerThird(
  g: CanvasRenderingContext2D,
  W: number,
  H: number,
  state: StudioState,
  p: number
) {
  const { a, b, p: player, event: ev, s } = state;
  const u = W / 1920;
  const type = s.lowerThirdType || 'player';
  const pos = s.lowerThirdPos || 'bottom-left';
  const contrast = s.contrastBorder;
  const acc = s.accent;
  const hasRightPic = s.showRightPlayerPhoto !== false;

  // Intro animation: angled cyber slide with energy tracer
  const inP = eOB(clamp(p / 0.28, 0, 1));
  const outP = 1 - eIC(clamp((p - 0.88) / 0.12, 0, 1));
  const transP = inP * outP;
  if (transP <= 0.001) return;

  const fontFam = FONTMAP[s.font]?.fam || "'Anton', sans-serif";

  // Determine container bounds based on position & type
  // Expanded width to accommodate right-corner player picture
  let boxW = (hasRightPic ? 1280 : 1080) * u;
  const boxH = 154 * u;
  let boxX = 80 * u;
  const boxY = H - boxH - 70 * u;

  if (pos === 'bottom-center') {
    boxW = (hasRightPic ? 1400 : 1240) * u;
    boxX = (W - boxW) / 2;
  } else if (pos === 'full-width') {
    boxW = W - 160 * u;
    boxX = 80 * u;
  }

  // Right-corner player picture dimensions
  const picW = 230 * u;
  const picX = boxX + boxW - picW;
  const mainBarW = hasRightPic ? boxW - picW + 18 * u : boxW;

  // Horizontal slide translation
  const slideOff = (1 - transP) * -400 * u;

  g.save();
  g.translate(slideOff, 0);

  // -------------------------------------------------------------
  // SUB-MODE A: PLAYER SPOTLIGHT LOWER THIRD
  // -------------------------------------------------------------
  if (type === 'player') {
    const sk = 42 * u; // Angled esports chamfer

    // Outer dark stroke for chroma key protection
    if (contrast) {
      poly(g, [
        [boxX - 4, boxY - 4],
        [boxX + mainBarW + 4, boxY - 4],
        [boxX + mainBarW - sk + 4, boxY + boxH + 4],
        [boxX - 4, boxY + boxH + 4],
      ]);
      g.fillStyle = '#020409';
      g.fill();
    }

    // Main angled plate
    g.save();
    g.shadowColor = 'rgba(0,0,0,0.85)';
    g.shadowBlur = 24 * u;
    g.shadowOffsetY = 6 * u;
    poly(g, [
      [boxX, boxY],
      [boxX + mainBarW, boxY],
      [boxX + mainBarW - sk, boxY + boxH],
      [boxX, boxY + boxH],
    ]);
    const plateGrad = g.createLinearGradient(boxX, boxY, boxX + mainBarW, boxY + boxH);
    plateGrad.addColorStop(0, '#0c1322');
    plateGrad.addColorStop(0.55, '#070b14');
    plateGrad.addColorStop(1, '#05070e');
    g.fillStyle = plateGrad;
    g.fill();

    // Authentic HOK Imperial Dragon Scale Texture overlay
    drawHOKDragonScaleTexture(g, boxX, boxY, mainBarW, boxH, acc, 0.08);
    g.restore();

    // HOK Golden Dragon Horn on Top-Left Corner
    drawHOKDragonHorn(g, boxX + 6 * u, boxY + 4 * u, 26 * u, Math.PI * 0.9, a.color, acc);

    // Top gold & team accent border with neon tracer
    const topG = g.createLinearGradient(boxX, 0, boxX + mainBarW, 0);
    topG.addColorStop(0, acc);
    topG.addColorStop(0.35, a.color);
    topG.addColorStop(1, acc);
    g.fillStyle = topG;
    g.fillRect(boxX, boxY, mainBarW, 4 * u);

    // Dynamic light streak sweeping along the bar
    if (state.anim.shine) {
      const sw = 180 * u;
      const sx = boxX - sw + ((p * 2.2) % 1.5) * (mainBarW + sw * 2);
      g.save();
      poly(g, [
        [boxX, boxY],
        [boxX + mainBarW, boxY],
        [boxX + mainBarW - sk, boxY + boxH],
        [boxX, boxY + boxH],
      ]);
      g.clip();
      const shineGrad = g.createLinearGradient(sx, 0, sx + sw, 0);
      shineGrad.addColorStop(0, 'rgba(255,255,255,0)');
      shineGrad.addColorStop(0.5, 'rgba(255,255,255,0.18)');
      shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = shineGrad;
      g.fillRect(sx, boxY, sw, boxH);
      g.restore();
    }

    // Team Logo Crest on far left
    const logoR = 46 * u;
    const logoCX = boxX + 64 * u;
    const logoCY = boxY + boxH / 2;
    drawTeamLogoBadge(g, logoCX, logoCY, logoR, a, acc, contrast);

    // Hero Avatar beside Team Logo with HOK Golden Dragon Rim
    const avR = 44 * u;
    const avCX = boxX + 162 * u;
    const avCY = boxY + boxH / 2;
    drawHeroAvatar(g, avCX, avCY, avR, null, player.hero, a.color, acc, contrast);

    // Team Tag Badge
    const tagX = boxX + 224 * u;
    const tagY = boxY + 20 * u;
    const tagW = 72 * u, tagH = 30 * u;
    poly(g, [
      [tagX + 6 * u, tagY],
      [tagX + tagW, tagY],
      [tagX + tagW - 6 * u, tagY + tagH],
      [tagX, tagY + tagH],
    ]);
    const tagBg = g.createLinearGradient(tagX, tagY, tagX + tagW, tagY + tagH);
    tagBg.addColorStop(0, a.color);
    tagBg.addColorStop(1, shade(a.color, -0.4));
    g.fillStyle = tagBg;
    g.fill();
    g.lineWidth = 1.5 * u;
    g.strokeStyle = '#FFFFFF';
    g.stroke();

    g.font = "800 16px 'Oxanium', sans-serif";
    g.fillStyle = lum(a.color) > 0.6 ? '#0b101c' : '#FFFFFF';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(a.tag.toUpperCase(), tagX + tagW / 2, tagY + tagH / 2 + 1);

    // HOK Championship Octagonal Seal & Tournament Ribbon
    drawHOKChampionshipSeal(g, tagX + tagW + 18 * u, tagY + tagH / 2, 13 * u, acc);

    g.font = "700 13.5px 'Barlow Condensed', sans-serif";
    g.fillStyle = rgba(acc, 0.95);
    tText(g, `${ev.title.toUpperCase()} · ${ev.game.toUpperCase()}`, tagX + tagW + 36 * u, tagY + 20 * u, {
      align: 'left',
      tr: 2 * u,
    });

    // Player IGN (Bold athletic metallic display)
    const ignY = boxY + 86 * u;
    const ignStr = player.name.toUpperCase();
    const ignSize = fitSize(g, ignStr, s => `400 ${s}px ${fontFam}`, 320 * u, 52 * u, 24 * u, 2 * u);
    g.font = `400 ${ignSize}px ${fontFam}`;
    g.fillStyle = goldGrad(g, ignY, ignSize, acc);
    g.shadowColor = 'rgba(0,0,0,0.8)';
    g.shadowBlur = 10 * u;
    tText(g, ignStr, tagX, ignY, { tr: 2 * u });
    g.shadowBlur = 0;

    // Moving sheen across player IGN
    shimmerText(g, ignStr, tagX, ignY, ignSize, `400 ${ignSize}px ${fontFam}`, {
      tr: 2 * u,
      align: 'left',
      p: (p * 1.5) % 1,
    });

    // Role & Hero subtitle with Official HOK Role Crest
    drawHOKRoleIcon(g, tagX + 10 * u, boxY + 120 * u, 14 * u, player.role, a.color, acc);

    g.font = "600 14.5px 'Chakra Petch', sans-serif";
    g.fillStyle = '#CBD5E1';
    const subHero = `${player.real}  |  ${player.hero.toUpperCase()} · ${player.role.toUpperCase()}`;
    tText(g, subHero, tagX + 26 * u, boxY + 124 * u, { tr: 1.5 * u });

    // Live Stats Section in Center-Right (K/D/A, Damage %, GPM, KP%)
    const statStartX = boxX + 540 * u;
    const statEndArea = hasRightPic ? picX - 25 * u : boxX + mainBarW - sk - 20 * u;
    const statW = (statEndArea - statStartX) / 4;
    const statItems: Array<{ label: string; val: string | number; icon: any; col: string }> = [
      { label: 'K / D / A', val: `${countTo(player.k, p)}/${countTo(player.d, p)}/${countTo(player.a, p)}`, icon: iconKill, col: a.color },
      { label: 'KDA RATIO', val: countTo(player.kda, p), icon: iconBolt, col: acc },
      { label: 'DMG SHARE', val: player.dmgPct || '38%', icon: iconFlame, col: '#EF4444' },
      { label: 'GOLD / MIN', val: countTo(player.gpm, p), icon: iconCoin, col: '#F59E0B' },
    ];

    statItems.forEach((st, i) => {
      const sx = statStartX + statW * i;
      // Divider line
      if (i > 0) {
        g.strokeStyle = 'rgba(255,255,255,0.12)';
        g.lineWidth = 1 * u;
        g.beginPath();
        g.moveTo(sx, boxY + 30 * u);
        g.lineTo(sx - 10 * u, boxY + boxH - 24 * u);
        g.stroke();
      }

      // Icon & Label
      g.save();
      const lx = sx + 10 * u;
      st.icon(g, lx + 8 * u, boxY + 48 * u, 15 * u, st.col);
      g.font = "700 12.5px 'Barlow Condensed', sans-serif";
      g.fillStyle = 'rgba(255,255,255,0.7)';
      tText(g, st.label, lx + 22 * u, boxY + 52 * u, { tr: 1 * u });

      // Stat Value
      g.font = "800 23px 'Oxanium', sans-serif";
      g.fillStyle = '#FFFFFF';
      g.shadowColor = rgba(st.col, 0.6);
      g.shadowBlur = 8 * u;
      tText(g, String(st.val), lx + 8 * u, boxY + 92 * u);
      g.shadowBlur = 0;

      // Sub indicator
      if (i === 0) {
        g.font = "600 11.5px 'Chakra Petch', sans-serif";
        g.fillStyle = 'rgba(255,255,255,0.6)';
        tText(g, `KP ${player.kp || '74%'}`, lx + 8 * u, boxY + 120 * u);
      } else if (i === 2) {
        g.font = "600 11.5px 'Chakra Petch', sans-serif";
        g.fillStyle = rgba(st.col, 0.9);
        tText(g, `${countTo(player.dmg, p)} DMG`, lx + 8 * u, boxY + 120 * u);
      }
      g.restore();
    });

    // -------------------------------------------------------------
    // DEDICATED RIGHT-CORNER PLAYER PICTURE SPACE
    // -------------------------------------------------------------
    if (hasRightPic) {
      drawRightCornerPlayerPicture(
        g,
        picX,
        boxY,
        picW,
        boxH,
        u,
        player,
        a.color,
        acc,
        contrast,
        p
      );
    }
  }

  // -------------------------------------------------------------
  // SUB-MODE B: MATCH STATUS & GOLD LEAD LOWER THIRD
  // -------------------------------------------------------------
  else if (type === 'score') {
    const sk = 36 * u;

    // Dark outline for clean green screen keying
    if (contrast) {
      poly(g, [
        [boxX - 4, boxY - 4],
        [boxX + mainBarW + 4, boxY - 4],
        [boxX + mainBarW - sk + 4, boxY + boxH + 4],
        [boxX - 4, boxY + boxH + 4],
      ]);
      g.fillStyle = '#020409';
      g.fill();
    }

    // Base plate
    poly(g, [
      [boxX, boxY],
      [boxX + mainBarW, boxY],
      [boxX + mainBarW - sk, boxY + boxH],
      [boxX, boxY + boxH],
    ]);
    const scorePlateGrad = g.createLinearGradient(boxX, boxY, boxX + mainBarW, boxY + boxH);
    scorePlateGrad.addColorStop(0, '#0c1322');
    scorePlateGrad.addColorStop(0.5, '#070b15');
    scorePlateGrad.addColorStop(1, '#030509');
    g.fillStyle = scorePlateGrad;
    g.fill();

    // Authentic HOK Imperial Dragon Scale Texture overlay
    drawHOKDragonScaleTexture(g, boxX, boxY, mainBarW, boxH, acc, 0.08);

    // HOK Golden Dragon Horn on Top-Left Corner
    drawHOKDragonHorn(g, boxX + 6 * u, boxY + 4 * u, 24 * u, Math.PI * 0.9, a.color, acc);

    // Top gold & team accent bar with neon sheen
    const topBar = g.createLinearGradient(boxX, 0, boxX + mainBarW, 0);
    topBar.addColorStop(0, a.color);
    topBar.addColorStop(0.5, acc);
    topBar.addColorStop(1, b.color);
    g.fillStyle = topBar;
    g.fillRect(boxX, boxY, mainBarW, 4 * u);

    // Dynamic light streak
    if (state.anim.shine) {
      const sw = 160 * u;
      const sx = boxX - sw + ((p * 2.2) % 1.5) * (mainBarW + sw * 2);
      g.save();
      poly(g, [
        [boxX, boxY],
        [boxX + mainBarW, boxY],
        [boxX + mainBarW - sk, boxY + boxH],
        [boxX, boxY + boxH],
      ]);
      g.clip();
      const shineGrad = g.createLinearGradient(sx, 0, sx + sw, 0);
      shineGrad.addColorStop(0, 'rgba(255,255,255,0)');
      shineGrad.addColorStop(0.5, 'rgba(255,255,255,0.16)');
      shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = shineGrad;
      g.fillRect(sx, boxY, sw, boxH);
      g.restore();
    }

    // Layout geometry: 3 sections (Team A, Center Match Context, Team B)
    const midX = boxX + mainBarW * 0.5;
    const centerHalfW = 120 * u;
    const teamAW = midX - centerHalfW - boxX;
    const teamBX = midX + centerHalfW;
    const teamBW = boxX + mainBarW - sk - teamBX;

    // --- Team A Side (Left) ---
    // Background wash
    g.fillStyle = rgba(a.color, 0.12);
    g.fillRect(boxX, boxY + 4 * u, teamAW, boxH - 34 * u);

    // Team A Logo Badge
    const lr = 38 * u;
    const logoAX = boxX + 48 * u;
    const logoAY = boxY + (boxH - 30 * u) / 2;
    drawTeamLogoBadge(g, logoAX, logoAY, lr, a, acc, contrast);

    // Team A Tag
    g.font = `800 ${Math.round(26 * u)}px 'Oxanium', sans-serif`;
    g.fillStyle = a.color;
    tText(g, a.tag.toUpperCase(), boxX + 98 * u, boxY + 52 * u);

    // Team A BO7 Series Win Dots as Luminous Dragon Pearls
    const scoreAVal = parseInt(a.score, 10) || 0;
    for (let i = 0; i < 4; i++) {
      drawHOKDragonPearl(g, boxX + 104 * u + i * 18 * u, boxY + 76 * u, 6 * u, i < scoreAVal, a.color, acc, p);
    }

    // Team A Score (Large display)
    g.font = `400 ${Math.round(68 * u)}px ${fontFam}`;
    g.fillStyle = '#FFFFFF';
    g.shadowColor = rgba(a.color, 0.8);
    g.shadowBlur = 10 * u;
    tText(g, countTo(a.score, p), boxX + teamAW - 15 * u, boxY + 84 * u, { align: 'right' });
    g.shadowBlur = 0;

    // --- Center Context (Silver Dragon Cup & Clock & Gold Lead) ---
    // Angled dividers
    g.strokeStyle = 'rgba(255,255,255,0.18)';
    g.lineWidth = 1.5 * u;
    g.beginPath();
    g.moveTo(midX - centerHalfW, boxY + 16 * u);
    g.lineTo(midX - centerHalfW - 8 * u, boxY + boxH - 34 * u);
    g.moveTo(midX + centerHalfW, boxY + 16 * u);
    g.lineTo(midX + centerHalfW - 8 * u, boxY + boxH - 34 * u);
    g.stroke();

    // Silver Dragon Cup (银龙杯) Centerpiece
    drawHOKSilverDragonCup(g, midX, boxY + 22 * u, 18 * u, acc);

    // Format & Game pill (e.g. BO7 · GAME 5)
    g.font = `700 ${Math.round(12 * u)}px 'Barlow Condensed', sans-serif`;
    g.fillStyle = acc;
    tText(g, `${ev.format.toUpperCase()} · ${ev.game.toUpperCase()}`, midX, boxY + 44 * u, {
      align: 'center',
      tr: 2 * u,
    });

    // Match Clock (steady, no colon width jitter)
    g.font = `800 ${Math.round(36 * u)}px 'Oxanium', sans-serif`;
    g.fillStyle = '#FFFFFF';
    tText(g, ev.clock || '14:28', midX, boxY + 78 * u, { align: 'center' });

    // Gold Lead indicator
    g.font = `700 ${Math.round(13.5 * u)}px 'Oxanium', sans-serif`;
    g.fillStyle = '#F59E0B';
    tText(g, `👑 ${ev.goldLead || '+3.8K GOLD LEAD'}`, midX, boxY + 104 * u, { align: 'center' });

    // --- Team B Side (Right) ---
    // Background wash
    g.fillStyle = rgba(b.color, 0.12);
    g.fillRect(teamBX, boxY + 4 * u, teamBW, boxH - 34 * u);

    // Team B Score (Large display)
    g.font = `400 ${Math.round(68 * u)}px ${fontFam}`;
    g.fillStyle = '#FFFFFF';
    g.shadowColor = rgba(b.color, 0.8);
    g.shadowBlur = 10 * u;
    tText(g, countTo(b.score, p), teamBX + 15 * u, boxY + 84 * u, { align: 'left' });
    g.shadowBlur = 0;

    // Team B Tag
    g.font = `800 ${Math.round(26 * u)}px 'Oxanium', sans-serif`;
    g.fillStyle = b.color;
    tText(g, b.tag.toUpperCase(), teamBX + teamBW - 98 * u, boxY + 52 * u, { align: 'right' });

    // Team B BO7 Series Win Dots as Luminous Dragon Pearls
    const scoreBVal = parseInt(b.score, 10) || 0;
    for (let i = 0; i < 4; i++) {
      drawHOKDragonPearl(g, teamBX + teamBW - 104 * u - (3 - i) * 18 * u, boxY + 76 * u, 6 * u, i < scoreBVal, b.color, acc, p);
    }

    // Team B Logo Badge
    const logoBX = teamBX + teamBW - 48 * u;
    const logoBY = boxY + (boxH - 30 * u) / 2;
    drawTeamLogoBadge(g, logoBX, logoBY, lr, b, acc, contrast);

    // --- Bottom Objectives Ribbon ---
    const ribbonY = boxY + boxH - 32 * u;
    const ribbonH = 30 * u;
    poly(g, [
      [boxX + 12 * u, ribbonY],
      [boxX + mainBarW - sk * 0.7, ribbonY],
      [boxX + mainBarW - sk, ribbonY + ribbonH],
      [boxX, ribbonY + ribbonH],
    ]);
    g.fillStyle = '#050811';
    g.fill();
    g.lineWidth = 1 * u;
    g.strokeStyle = rgba(acc, 0.35);
    g.stroke();

    const objStr = `TOWERS: ${ev.towersA || '7'} - ${ev.towersB || '3'}   ◆   DARK TYRANT: 2 - 1   ◆   OVERLORD: 1 - 0`;
    g.font = `700 ${Math.round(12.5 * u)}px 'Chakra Petch', sans-serif`;
    g.fillStyle = '#CBD5E1';
    tText(g, objStr, midX, ribbonY + 20 * u, { align: 'center', tr: 2 * u });

    // Right Corner Player Picture
    if (hasRightPic) {
      drawRightCornerPlayerPicture(g, picX, boxY, picW, boxH, u, player, a.color, acc, contrast, p);
    }
  }

  // -------------------------------------------------------------
  // SUB-MODE C: HIGHLIGHT & EPIC PLAY CALLOUT LOWER THIRD
  // -------------------------------------------------------------
  else if (type === 'highlight') {
    const sk = 48 * u;

    // Dark outline
    if (contrast) {
      poly(g, [
        [boxX - 4, boxY - 4],
        [boxX + mainBarW + 4, boxY - 4],
        [boxX + mainBarW - sk + 4, boxY + boxH + 4],
        [boxX - 4, boxY + boxH + 4],
      ]);
      g.fillStyle = '#020409';
      g.fill();
    }

    // Fiery red/gold base plate
    poly(g, [
      [boxX, boxY],
      [boxX + mainBarW, boxY],
      [boxX + mainBarW - sk, boxY + boxH],
      [boxX, boxY + boxH],
    ]);
    const hpGrad = g.createLinearGradient(boxX, boxY, boxX + mainBarW, boxY + boxH);
    hpGrad.addColorStop(0, '#2b090e');
    hpGrad.addColorStop(0.5, '#120508');
    hpGrad.addColorStop(1, '#050204');
    g.fillStyle = hpGrad;
    g.fill();

    // Top fiery glow bar
    g.fillStyle = '#FF3B6B';
    g.fillRect(boxX, boxY, mainBarW, 5 * u);

    // Hero avatar on left
    const avR = 60 * u;
    drawHeroAvatar(g, boxX + 75 * u, boxY + boxH / 2, avR, null, player.hero, '#FF3B6B', acc, contrast);

    // Callout headline
    const calloutStr = (ev.highlightText || 'PENTA KILL!').toUpperCase();
    const maxCallW = hasRightPic ? mainBarW - 190 * u : mainBarW - 220 * u;
    g.font = `400 ${fitSize(g, calloutStr, s => `400 ${s}px ${fontFam}`, maxCallW, 64 * u, 28 * u, 3 * u)}px ${fontFam}`;
    const hg = g.createLinearGradient(0, boxY + 30 * u, 0, boxY + 95 * u);
    hg.addColorStop(0, '#FFFFFF');
    hg.addColorStop(0.4, '#FFE57F');
    hg.addColorStop(0.7, '#FF3B6B');
    hg.addColorStop(1, '#B91C1C');
    g.fillStyle = hg;
    g.shadowColor = 'rgba(255, 59, 107, 0.9)';
    g.shadowBlur = 24 * u;
    tText(g, calloutStr, boxX + 160 * u, boxY + 84 * u, { tr: 3 * u });
    g.shadowBlur = 0;

    // Subtitle context
    g.font = "700 16px 'Chakra Petch', sans-serif";
    g.fillStyle = '#FEE2E2';
    const subStr = (ev.highlightSub || `${player.name} (${player.hero}) WIPES OUT THE ENEMY TEAM`).toUpperCase();
    tText(g, subStr, boxX + 160 * u, boxY + 122 * u, { tr: 1.5 * u });

    // Right Corner Player Picture
    if (hasRightPic) {
      drawRightCornerPlayerPicture(g, picX, boxY, picW, boxH, u, player, '#FF3B6B', acc, contrast, p);
    }
  }

  // -------------------------------------------------------------
  // SUB-MODE D: CASTER / TALENT & REPLAY LOWER THIRD
  // -------------------------------------------------------------
  else if (type === 'caster') {
    const sk = 36 * u;
    if (contrast) {
      poly(g, [
        [boxX - 4, boxY - 4],
        [boxX + boxW + 4, boxY - 4],
        [boxX + boxW - sk + 4, boxY + boxH + 4],
        [boxX - 4, boxY + boxH + 4],
      ]);
      g.fillStyle = '#020409';
      g.fill();
    }

    poly(g, [
      [boxX, boxY],
      [boxX + boxW, boxY],
      [boxX + boxW - sk, boxY + boxH],
      [boxX, boxY + boxH],
    ]);
    g.fillStyle = '#090e1b';
    g.fill();

    g.fillStyle = acc;
    g.fillRect(boxX, boxY, boxW, 4 * u);

    // Caster Mic Icon & Name
    g.font = "700 16px 'Barlow Condensed', sans-serif";
    g.fillStyle = acc;
    tText(g, 'OFFICIAL BROADCAST TALENT', boxX + 40 * u, boxY + 36 * u, { tr: 3 * u });

    const cName = (ev.casterName || 'WOLFSPEED & CYRA').toUpperCase();
    g.font = `400 48px ${fontFam}`;
    g.fillStyle = '#FFFFFF';
    tText(g, cName, boxX + 40 * u, boxY + 88 * u, { tr: 2 * u });

    g.font = "600 16px 'Chakra Petch', sans-serif";
    g.fillStyle = 'rgba(255,255,255,0.7)';
    tText(g, `${ev.casterHandle || '@HOK_Esports'}  ·  PLAY-BY-PLAY & ANALYST DESK`, boxX + 40 * u, boxY + 124 * u);
  }

  g.restore();
}

/* =========================================================================
   2. GRAND FINALS CLASH BANNER (1920x1080)
   ========================================================================= */
export function drawFinalsBanner(
  g: CanvasRenderingContext2D,
  W: number,
  H: number,
  state: StudioState,
  p: number
) {
  const { a, b, event: ev, s } = state;
  const cx = W / 2;
  const u = W / 1920;
  const acc = s.accent;
  const fontFam = FONTMAP[s.font]?.fam || "'Anton', sans-serif";

  // Center diagonal energy seam
  const seam = 90 * u;
  const wp = eOQ(clamp(p / 0.35, 0, 1));

  // Team A & Team B split pedestals
  g.save();
  clipDraw(
    g,
    () => poly(g, [[-40, 0], [cx - seam, 0], [cx - seam * 1.4, H], [-40, H]]),
    () => {
      const gr = g.createLinearGradient(0, 0, cx, H);
      gr.addColorStop(0, rgba(a.color, 0.42 * wp));
      gr.addColorStop(1, rgba(a.color, 0.05));
      g.fillStyle = gr;
      g.fillRect(0, 0, cx + seam, H);
    }
  );

  clipDraw(
    g,
    () => poly(g, [[W + 40, 0], [cx + seam, 0], [cx - seam * 1.4, H], [W + 40, H]]),
    () => {
      const gr = g.createLinearGradient(W, 0, cx, H);
      gr.addColorStop(0, rgba(b.color, 0.42 * wp));
      gr.addColorStop(1, rgba(b.color, 0.05));
      g.fillStyle = gr;
      g.fillRect(cx - seam, 0, W - cx + seam, H);
    }
  );
  g.restore();

  // Animated laser seam
  g.save();
  g.strokeStyle = rgba(acc, 0.7);
  g.lineWidth = 3 * u;
  g.shadowColor = rgba(acc, 0.9);
  g.shadowBlur = 24 * u;
  g.beginPath();
  g.moveTo(cx - seam * 0.75, H * 0.1);
  g.lineTo(cx + seam * 0.75, H * 0.9);
  g.stroke();
  g.restore();

  // Tournament Subtitle
  const subP = eOE(clamp(p / 0.3, 0, 1));
  g.save();
  g.globalAlpha = subP;
  g.font = `700 ${26 * u}px 'Chakra Petch', sans-serif`;
  g.fillStyle = rgba(acc, 0.95);
  tText(g, ev.sub.toUpperCase(), cx, 128 * u, { tr: 10 * u, align: 'center' });
  g.restore();

  // Grand Finals Title
  const titleStr = ev.title.toUpperCase();
  const ts = fitSize(g, titleStr, s => `400 ${s}px ${fontFam}`, W * 0.76, 170 * u, 50 * u, 4 * u);
  const tp = eOE(clamp((p - 0.1) / 0.35, 0, 1));
  const tY = 130 * u + ts * 0.92;
  if (tp > 0) {
    g.save();
    g.globalAlpha = tp;
    g.font = `400 ${ts}px ${fontFam}`;
    g.shadowColor = '#000000';
    g.shadowBlur = 20 * u;
    g.fillStyle = goldGrad(g, tY, ts, acc);
    tText(g, titleStr, cx, tY, { tr: 4 * u, align: 'center' });
    g.shadowBlur = 0;
    shimmerText(g, titleStr, cx, tY, ts, `400 ${ts}px ${fontFam}`, {
      tr: 4 * u,
      align: 'center',
      p: (p * 1.6) % 1,
    });
    g.restore();
  }

  // Format & Prize ribbon
  const pillY = tY + 68 * u;
  const pillText = `${ev.format.toUpperCase()} · ${ev.prize.toUpperCase()}`;
  g.font = `700 ${22 * u}px 'Barlow Condensed', sans-serif`;
  const pw = tWidth(g, pillText, 4 * u) + 60 * u;
  poly(g, [
    [cx - pw / 2 + 10 * u, pillY],
    [cx + pw / 2, pillY],
    [cx + pw / 2 - 10 * u, pillY + 40 * u],
    [cx - pw / 2, pillY + 40 * u],
  ]);
  g.fillStyle = 'rgba(0,0,0,0.7)';
  g.fill();
  g.lineWidth = 1.5 * u;
  g.strokeStyle = acc;
  g.stroke();
  g.fillStyle = acc;
  tText(g, pillText, cx, pillY + 28 * u, { tr: 4 * u, align: 'center' });

  // Team pedestals and scores
  const rowY = H * 0.64;
  const drawTeamSide = (team: typeof a, side: 'L' | 'R') => {
    const isL = side === 'L';
    const logoX = isL ? 220 * u : W - 220 * u;
    const nameX = isL ? 370 * u : W - 370 * u;
    const scoreX = isL ? cx - 180 * u : cx + 180 * u;

    // Team Crest Hexagon
    const lr = 100 * u;
    hexPath(g, logoX, rowY, lr, Math.PI / 6);
    g.fillStyle = '#080d19';
    g.fill();
    g.lineWidth = 4 * u;
    g.strokeStyle = team.color;
    g.stroke();

    if (team.logo && team.logo.naturalWidth) {
      clipDraw(
        g,
        () => hexPath(g, logoX, rowY, lr * 0.85, Math.PI / 6),
        () => g.drawImage(team.logo!, logoX - lr * 0.85, rowY - lr * 0.85, lr * 1.7, lr * 1.7)
      );
    } else {
      g.font = `800 ${lr * 0.7}px 'Oxanium', sans-serif`;
      g.fillStyle = '#FFFFFF';
      tText(g, team.tag.toUpperCase(), logoX, rowY + lr * 0.25, { align: 'center' });
    }

    // Team Name
    const maxNW = 320 * u;
    const ns = fitSize(g, team.name.toUpperCase(), s => `400 ${s}px ${fontFam}`, maxNW, 62 * u, 24 * u, 1);
    g.font = `400 ${ns}px ${fontFam}`;
    g.fillStyle = '#FFFFFF';
    tText(g, team.name.toUpperCase(), nameX, rowY - 10 * u, { align: isL ? 'left' : 'right' });

    // Subtitle
    g.font = `700 ${22 * u}px 'Chakra Petch', sans-serif`;
    g.fillStyle = team.color;
    tText(g, `${team.tag.toUpperCase()} · ${isL ? 'BLUE SIDE' : 'RED SIDE'}`, nameX, rowY + 32 * u, {
      align: isL ? 'left' : 'right',
      tr: 3 * u,
    });

    // Score
    g.font = `400 ${180 * u}px ${fontFam}`;
    const scoreGrad = g.createLinearGradient(0, rowY - 80 * u, 0, rowY + 60 * u);
    scoreGrad.addColorStop(0, '#FFFFFF');
    scoreGrad.addColorStop(1, shade(team.color, 0.3));
    g.fillStyle = scoreGrad;
    g.shadowColor = rgba(team.color, 0.8);
    g.shadowBlur = 30 * u;
    tText(g, countTo(team.score, p), scoreX, rowY + 54 * u, { align: isL ? 'right' : 'left' });
    g.shadowBlur = 0;
  };

  drawTeamSide(a, 'L');
  drawTeamSide(b, 'R');

  // VS Crest in Center
  const vr = 80 * u;
  poly(g, [[cx, rowY - vr], [cx + vr, rowY], [cx, rowY + vr], [cx - vr, rowY]]);
  g.fillStyle = '#060913';
  g.fill();
  g.lineWidth = 3 * u;
  g.strokeStyle = acc;
  g.stroke();

  g.font = `400 ${52 * u}px ${fontFam}`;
  g.fillStyle = acc;
  tText(g, 'VS', cx, rowY + 18 * u, { align: 'center', tr: 2 * u });

  // Bottom Broadcast Bar
  const by = H - 120 * u;
  poly(g, [[0, by], [W, by], [W, H], [0, H]]);
  g.fillStyle = 'rgba(5, 8, 16, 0.88)';
  g.fill();
  g.fillStyle = acc;
  g.fillRect(0, by, W, 2 * u);

  const infoStr = `${ev.date.toUpperCase()}   ◆   ${ev.venue.toUpperCase()}   ◆   ${ev.format.toUpperCase()} · ${ev.game.toUpperCase()}`;
  g.font = `600 ${24 * u}px 'Chakra Petch', sans-serif`;
  g.fillStyle = '#CBD5E1';
  tText(g, infoStr, cx, H - 48 * u, { tr: 4 * u, align: 'center' });
}

/* =========================================================================
   3. MVP HIGHLIGHT CARD (1080x1080)
   ========================================================================= */
export function drawMVPCard(
  g: CanvasRenderingContext2D,
  W: number,
  H: number,
  state: StudioState,
  p: number
) {
  const { a, p: player, event: ev, s } = state;
  const cx = W / 2;
  const u = W / 1080;
  const acc = s.accent;
  const fontFam = FONTMAP[s.font]?.fam || "'Anton', sans-serif";

  // Rotating light rays
  g.save();
  g.translate(cx, H * 0.44);
  g.rotate(p * Math.PI * 0.5);
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 16; i++) {
    g.save();
    g.rotate((i * Math.PI * 2) / 16);
    const rayG = g.createLinearGradient(0, 0, W, 0);
    rayG.addColorStop(0, rgba(acc, 0.25));
    rayG.addColorStop(0.7, 'rgba(0,0,0,0)');
    g.fillStyle = rayG;
    poly(g, [[0, 0], [W, -W * 0.04], [W, W * 0.04]]);
    g.fill();
    g.restore();
  }
  g.restore();

  // Header Title
  g.font = `700 ${22 * u}px 'Barlow Condensed', sans-serif`;
  g.fillStyle = rgba(acc, 0.95);
  tText(g, ev.title.toUpperCase(), cx, 80 * u, { tr: 8 * u, align: 'center' });

  // Team Logo Crest (Top left corner)
  drawTeamLogoBadge(g, 90 * u, 90 * u, 36 * u, a, acc, true);

  // Silver Dragon Cup (Top right corner)
  drawHOKSilverDragonCup(g, W - 90 * u, 88 * u, 22 * u, acc);

  g.font = `400 ${105 * u}px ${fontFam}`;
  g.fillStyle = goldGrad(g, 175 * u, 105 * u, acc);
  g.shadowColor = '#000000';
  g.shadowBlur = 20 * u;
  tText(g, 'MATCH MVP', cx, 175 * u, { tr: 4 * u, align: 'center' });
  g.shadowBlur = 0;

  // Circular Hero Avatar in center
  const avR = 175 * u;
  const avCY = H * 0.45;
  drawHeroAvatar(g, cx, avCY, avR, player.photo, player.hero, a.color, acc, true);

  // MVP Crown / Star Crest above avatar
  iconStar(g, cx, avCY - avR - 16 * u, 36 * u, acc);

  // Player Name
  const ignY = avCY + avR + 90 * u;
  g.font = `400 ${100 * u}px ${fontFam}`;
  g.fillStyle = '#FFFFFF';
  tText(g, player.name.toUpperCase(), cx, ignY, { tr: 3 * u, align: 'center' });

  // Tag & Role Ribbon
  g.font = `700 ${24 * u}px 'Chakra Petch', sans-serif`;
  g.fillStyle = acc;
  tText(g, `${a.tag.toUpperCase()}  ·  ${player.role.toUpperCase()}  ·  ${player.hero.toUpperCase()}`, cx, ignY + 44 * u, {
    align: 'center',
    tr: 3 * u,
  });

  // Stats Bar (K/D/A, KDA, DMG, MVP Rating)
  const stY = H - 170 * u;
  const stW = (W - 140 * u) / 4;
  const stats = [
    { l: 'K / D / A', v: `${countTo(player.k, p)}/${countTo(player.d, p)}/${countTo(player.a, p)}` },
    { l: 'KDA RATIO', v: countTo(player.kda, p) },
    { l: 'DAMAGE', v: countTo(player.dmg, p) },
    { l: 'RATING', v: countTo(player.rating, p) },
  ];

  poly(g, [
    [60 * u, stY],
    [W - 60 * u, stY],
    [W - 80 * u, stY + 110 * u],
    [40 * u, stY + 110 * u],
  ]);
  g.fillStyle = 'rgba(7, 11, 22, 0.85)';
  g.fill();
  g.lineWidth = 2 * u;
  g.strokeStyle = rgba(acc, 0.4);
  g.stroke();

  // HOK Dragon Horns & Scale Texture on Stats Bar
  if (s.dragonCrests !== false) {
    drawHOKDragonHorn(g, 62 * u, stY + 2 * u, 22 * u, Math.PI * 0.9, a.color, acc);
    drawHOKDragonHorn(g, W - 62 * u, stY + 2 * u, 22 * u, -Math.PI * 0.1, a.color, acc);
    drawHOKDragonScaleTexture(g, 60 * u, stY, W - 120 * u, 110 * u, acc, 0.06);
  }

  stats.forEach((st, i) => {
    const sx = 70 * u + stW * i;
    g.font = `700 ${14 * u}px 'Barlow Condensed', sans-serif`;
    g.fillStyle = 'rgba(255,255,255,0.7)';
    tText(g, st.l, sx + stW / 2, stY + 36 * u, { align: 'center', tr: 2 * u });

    g.font = `800 ${36 * u}px 'Oxanium', sans-serif`;
    g.fillStyle = i === 3 ? acc : '#FFFFFF';
    tText(g, String(st.v), sx + stW / 2, stY + 84 * u, { align: 'center' });
  });
}

/* =========================================================================
   4. VERTICAL PLAYER CARD (1080x1920 9:16 FOR SHORTS / REELS / TIKTOK)
   ========================================================================= */
export function drawPlayerCard(
  g: CanvasRenderingContext2D,
  W: number,
  H: number,
  state: StudioState,
  p: number
) {
  const { a, p: player, event: ev, s } = state;
  const cx = W / 2;
  const u = W / 1080;
  const acc = s.accent;
  const fontFam = FONTMAP[s.font]?.fam || "'Anton', sans-serif";

  // Large Jersey Number in Background
  g.font = `400 ${750 * u}px ${fontFam}`;
  g.fillStyle = 'rgba(255,255,255,0.04)';
  tText(g, player.num, 60 * u, 800 * u);

  // Top Tournament Ribbon
  g.font = `700 ${24 * u}px 'Chakra Petch', sans-serif`;
  g.fillStyle = acc;
  tText(g, `${ev.title.toUpperCase()} · ${ev.sub.toUpperCase()}`, cx, 110 * u, { align: 'center', tr: 4 * u });

  // Team Logo Crest at top right
  drawTeamLogoBadge(g, W - 100 * u, 105 * u, 42 * u, a, acc, true);

  // Big Hero Portrait
  const avR = 300 * u;
  const avCY = 580 * u;
  drawHeroAvatar(g, cx, avCY, avR, player.photo, player.hero, a.color, acc, true);

  // Player Name
  const ignY = avCY + avR + 130 * u;
  g.font = `400 ${160 * u}px ${fontFam}`;
  g.fillStyle = goldGrad(g, ignY, 160 * u, acc);
  g.shadowColor = '#000000';
  g.shadowBlur = 24 * u;
  tText(g, player.name.toUpperCase(), cx, ignY, { tr: 3 * u, align: 'center' });
  g.shadowBlur = 0;

  // Real Name & Hero
  g.font = `700 ${32 * u}px 'Chakra Petch', sans-serif`;
  g.fillStyle = '#CBD5E1';
  tText(g, `${player.real.toUpperCase()}  ·  #${player.num}`, cx, ignY + 54 * u, { align: 'center', tr: 2 * u });

  // Signature Hero Badge with HOK Role Icon
  drawHOKRoleIcon(g, cx - 180 * u, ignY + 98 * u, 20 * u, player.role, a.color, acc);
  g.font = `700 ${28 * u}px 'Barlow Condensed', sans-serif`;
  g.fillStyle = acc;
  tText(g, `SIGNATURE HERO: ${player.hero.toUpperCase()} (${player.role.toUpperCase()})`, cx + 10 * u, ignY + 104 * u, {
    align: 'center',
    tr: 3 * u,
  });

  // Full Stat Grid Box
  const stY = ignY + 160 * u;
  const boxW = W - 140 * u;
  poly(g, [
    [70 * u, stY],
    [W - 70 * u, stY],
    [W - 100 * u, stY + 360 * u],
    [40 * u, stY + 360 * u],
  ]);
  g.fillStyle = 'rgba(8, 13, 24, 0.9)';
  g.fill();
  g.lineWidth = 2 * u;
  g.strokeStyle = acc;
  g.stroke();

  // HOK Dragon Horns & Scale Texture on Vertical Player Card
  if (s.dragonCrests !== false) {
    drawHOKDragonHorn(g, 72 * u, stY + 2 * u, 24 * u, Math.PI * 0.9, a.color, acc);
    drawHOKDragonHorn(g, W - 72 * u, stY + 2 * u, 24 * u, -Math.PI * 0.1, a.color, acc);
    drawHOKDragonScaleTexture(g, 70 * u, stY, boxW, 360 * u, acc, 0.05);
  }

  // Grid Stats
  const statGrid = [
    { l: 'KILLS', v: countTo(player.k, p) },
    { l: 'DEATHS', v: countTo(player.d, p) },
    { l: 'ASSISTS', v: countTo(player.a, p) },
    { l: 'KDA RATIO', v: countTo(player.kda, p) },
    { l: 'DAMAGE DEALT', v: countTo(player.dmg, p) },
    { l: 'GOLD / MIN', v: countTo(player.gpm, p) },
  ];

  const cols = 3;
  const cellW = boxW / cols;
  statGrid.forEach((st, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const x = 70 * u + c * cellW + cellW / 2;
    const y = stY + 60 * u + r * 150 * u;

    g.font = `700 ${20 * u}px 'Barlow Condensed', sans-serif`;
    g.fillStyle = 'rgba(255,255,255,0.7)';
    tText(g, st.l, x, y, { align: 'center', tr: 2 * u });

    g.font = `800 ${56 * u}px 'Oxanium', sans-serif`;
    g.fillStyle = i === 3 ? acc : '#FFFFFF';
    tText(g, String(st.v), x, y + 64 * u, { align: 'center' });
  });

  // Bottom Tournament Details
  g.font = `600 ${24 * u}px 'Chakra Petch', sans-serif`;
  g.fillStyle = '#94A3B8';
  tText(g, `${ev.date} · ${ev.venue}`, cx, H - 90 * u, { align: 'center', tr: 2 * u });
}

/* =========================================================================
   5. SCORE BUG (1920x300) · REDESIGNED BROADCAST HUD
   ========================================================================= */
export function drawScoreBug(
  g: CanvasRenderingContext2D,
  W: number,
  H: number,
  state: StudioState,
  p: number
) {
  const { a, b, event: ev, s } = state;
  const cx = W / 2;
  const u = W / 1920;
  const acc = s.accent;
  const contrast = s.contrastBorder;
  const fontFam = FONTMAP[s.font]?.fam || "'Anton', sans-serif";
  const isBottom = s.scoreBugPos === 'bottom';

  const bh = 114 * u;
  const sk = 32 * u;
  const boxW = 1200 * u;
  const tickerH = 32 * u;
  const totalBugH = bh + 4 * u + tickerH;

  // Perfect vertical placement: centered on 300px canvas, or positioned top/bottom on 1080p
  let top = 34 * u;
  if (H <= 400) {
    top = Math.max(16 * u, Math.round((H - totalBugH) / 2));
  } else if (isBottom) {
    top = H - totalBugH - 45 * u;
  }

  // Smooth entrance slide with ease-out-back (capped when in 300px canvas so it stays visible)
  const inP = eOB(clamp(p / 0.28, 0, 1));
  const maxSlide = H <= 400 ? 40 * u : 160 * u;
  const dropY = isBottom ? (1 - inP) * maxSlide : (1 - inP) * -maxSlide;

  g.save();
  g.translate(0, dropY);

  const x0 = cx - boxW / 2;
  const centerW = 340 * u;
  const sideW = (boxW - centerW) / 2; // 430 * u

  // 1. Dark backing contour for 100% clean green screen chroma keying
  if (contrast) {
    poly(g, [
      [x0 + sk - 4, top - 4],
      [x0 + boxW + 4, top - 4],
      [x0 + boxW - sk + 4, top + bh + 4],
      [x0 - 4, top + bh + 4],
    ]);
    g.fillStyle = '#020409';
    g.fill();
  }

  // 2. Main Plate with metallic shadow
  g.save();
  g.shadowColor = 'rgba(0,0,0,0.85)';
  g.shadowBlur = 24 * u;
  poly(g, [
    [x0 + sk, top],
    [x0 + boxW, top],
    [x0 + boxW - sk, top + bh],
    [x0, top + bh],
  ]);
  const bgPlate = g.createLinearGradient(0, top, 0, top + bh);
  bgPlate.addColorStop(0, '#0c1322');
  bgPlate.addColorStop(0.5, '#070b16');
  bgPlate.addColorStop(1, '#03050a');
  g.fillStyle = bgPlate;
  g.fill();

  // Authentic HOK Dragon Scale background texture
  if (s.dragonCrests !== false) {
    drawHOKDragonScaleTexture(g, x0, top, boxW, bh, acc, 0.08);
  }
  g.restore();

  // Top Accent Bar with neon team gradient
  const topAcc = g.createLinearGradient(x0, 0, x0 + boxW, 0);
  topAcc.addColorStop(0, a.color);
  topAcc.addColorStop(0.5, acc);
  topAcc.addColorStop(1, b.color);
  g.fillStyle = topAcc;
  poly(g, [
    [x0 + sk, top],
    [x0 + boxW, top],
    [x0 + boxW - 3 * u, top + 3.5 * u],
    [x0 + sk - 3 * u, top + 3.5 * u],
  ]);
  g.fill();

  // HOK Golden Dragon Horn Corner Brackets on Score Bug
  if (s.dragonCrests !== false) {
    drawHOKDragonHorn(g, x0 + sk + 2 * u, top + 2 * u, 20 * u, Math.PI * 0.9, a.color, acc);
    drawHOKDragonHorn(g, x0 + boxW - 2 * u, top + 2 * u, 20 * u, -Math.PI * 0.1, b.color, acc);
  }

  // Dynamic light sweep
  if (state.anim.shine) {
    const sw = 180 * u;
    const sx = x0 - sw + ((p * 2.2) % 1.5) * (boxW + sw * 2);
    g.save();
    poly(g, [
      [x0 + sk, top],
      [x0 + boxW, top],
      [x0 + boxW - sk, top + bh],
      [x0, top + bh],
    ]);
    g.clip();
    const shineGrad = g.createLinearGradient(sx, 0, sx + sw, 0);
    shineGrad.addColorStop(0, 'rgba(255,255,255,0)');
    shineGrad.addColorStop(0.5, 'rgba(255,255,255,0.18)');
    shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = shineGrad;
    g.fillRect(sx, top, sw, bh);
    g.restore();
  }

  // 3. Team A Side (Left: x0 to x0 + sideW)
  g.save();
  clipDraw(
    g,
    () => poly(g, [
      [x0 + sk, top],
      [x0 + sideW, top],
      [x0 + sideW - sk * 0.6, top + bh],
      [x0, top + bh],
    ]),
    () => {
      const aGrad = g.createLinearGradient(x0, top, x0 + sideW, top);
      aGrad.addColorStop(0, rgba(a.color, 0.42));
      aGrad.addColorStop(0.75, rgba(a.color, 0.1));
      aGrad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = aGrad;
      g.fillRect(x0, top, sideW, bh);
    }
  );
  g.restore();

  // Team A Badge (Aspect ratio preserved, glowing crest)
  const lr = 34 * u;
  const logoAX = x0 + 52 * u;
  const logoAY = top + bh / 2 - 2 * u;
  drawTeamLogoBadge(g, logoAX, logoAY, lr, a, acc, contrast);

  // Team A Tag
  g.font = `800 ${Math.round(28 * u)}px 'Oxanium', sans-serif`;
  g.fillStyle = a.color;
  tText(g, a.tag.toUpperCase(), x0 + 102 * u, top + 52 * u);

  // Team A BO7 Series Win Dots (Authentic HOK Luminous Dragon Pearls)
  const scoreAVal = parseInt(a.score, 10) || 0;
  for (let i = 0; i < 4; i++) {
    const pearlX = x0 + 104 * u + i * 18 * u;
    const pearlY = top + 78 * u;
    drawHOKDragonPearl(g, pearlX, pearlY, 6 * u, i < scoreAVal, a.color, acc, p);
  }

  // Team A Score (Facing center)
  g.font = `400 ${Math.round(76 * u)}px ${fontFam}`;
  g.fillStyle = '#FFFFFF';
  g.shadowColor = rgba(a.color, 0.85);
  g.shadowBlur = 12 * u;
  tText(g, countTo(a.score, p), x0 + sideW - 18 * u, top + 80 * u, { align: 'right' });
  g.shadowBlur = 0;

  // 4. Team B Side (Right: x0 + sideW + centerW to x0 + boxW)
  const bStartX = x0 + sideW + centerW;
  g.save();
  clipDraw(
    g,
    () => poly(g, [
      [bStartX, top],
      [x0 + boxW, top],
      [x0 + boxW - sk, top + bh],
      [bStartX - sk * 0.6, top + bh],
    ]),
    () => {
      const bGrad = g.createLinearGradient(x0 + boxW, top, bStartX, top);
      bGrad.addColorStop(0, rgba(b.color, 0.42));
      bGrad.addColorStop(0.75, rgba(b.color, 0.1));
      bGrad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = bGrad;
      g.fillRect(bStartX - sk, top, sideW + sk, bh);
    }
  );
  g.restore();

  // Team B Score (Facing center)
  g.font = `400 ${Math.round(76 * u)}px ${fontFam}`;
  g.fillStyle = '#FFFFFF';
  g.shadowColor = rgba(b.color, 0.85);
  g.shadowBlur = 12 * u;
  tText(g, countTo(b.score, p), bStartX + 18 * u, top + 80 * u, { align: 'left' });
  g.shadowBlur = 0;

  // Team B Tag
  g.font = `800 ${Math.round(28 * u)}px 'Oxanium', sans-serif`;
  g.fillStyle = b.color;
  tText(g, b.tag.toUpperCase(), x0 + boxW - 102 * u, top + 52 * u, { align: 'right' });

  // Team B BO7 Series Win Dots (Authentic HOK Luminous Dragon Pearls)
  const scoreBVal = parseInt(b.score, 10) || 0;
  for (let i = 0; i < 4; i++) {
    const pearlX = x0 + boxW - 104 * u - (3 - i) * 18 * u;
    const pearlY = top + 78 * u;
    drawHOKDragonPearl(g, pearlX, pearlY, 6 * u, i < scoreBVal, b.color, acc, p);
  }

  // Team B Badge (Aspect ratio preserved, glowing crest)
  const logoBX = x0 + boxW - 52 * u;
  const logoBY = top + bh / 2 - 2 * u;
  drawTeamLogoBadge(g, logoBX, logoBY, lr, b, acc, contrast);

  // 5. Center Section: Game Clock, Match Stage, Gold Lead
  const centerLeft = cx - centerW / 2;

  // Center Slanted Dividers
  g.strokeStyle = 'rgba(255,255,255,0.18)';
  g.lineWidth = 1.5 * u;
  g.beginPath();
  g.moveTo(centerLeft, top + 15 * u);
  g.lineTo(centerLeft - 8 * u, top + bh - 15 * u);
  g.moveTo(centerLeft + centerW, top + 15 * u);
  g.lineTo(centerLeft + centerW - 8 * u, top + bh - 15 * u);
  g.stroke();

  // Silver Dragon Cup (银龙杯) Centerpiece Emblem
  drawHOKSilverDragonCup(g, cx, top + 16 * u, 14 * u, acc);

  // Match Stage (e.g. BO7 · GAME 5)
  g.font = `700 ${Math.round(12 * u)}px 'Barlow Condensed', sans-serif`;
  g.fillStyle = acc;
  tText(g, `${ev.format.toUpperCase()} · ${ev.game.toUpperCase()}`, cx, top + 34 * u, {
    align: 'center',
    tr: 2.5 * u,
  });

  // Game Clock: Rock-solid string width without jitter or colon shifting!
  const rawClock = ev.clock || '14:28';
  g.font = `800 ${Math.round(42 * u)}px 'Oxanium', sans-serif`;
  g.fillStyle = '#FFFFFF';
  g.shadowColor = 'rgba(255,255,255,0.4)';
  g.shadowBlur = 8 * u;
  tText(g, rawClock, cx, top + 68 * u, { align: 'center' });
  g.shadowBlur = 0;

  // Gold Lead Ribbon
  g.font = `700 ${Math.round(13.5 * u)}px 'Oxanium', sans-serif`;
  g.fillStyle = '#F59E0B';
  tText(g, `👑 ${ev.goldLead || '+3.8K GOLD LEAD'}`, cx, top + 98 * u, { align: 'center', tr: 1 * u });

  // 6. Bottom Objectives Ticker (Towers & Dragons)
  const tickerTop = top + bh + 4 * u;
  const tickerW = 820 * u;
  const tickerX = cx - tickerW / 2;

  poly(g, [
    [tickerX + 16 * u, tickerTop],
    [tickerX + tickerW, tickerTop],
    [tickerX + tickerW - 16 * u, tickerTop + tickerH],
    [tickerX, tickerTop + tickerH],
  ]);
  g.fillStyle = '#060913';
  g.fill();
  g.strokeStyle = rgba(acc, 0.4);
  g.lineWidth = 1 * u;
  g.stroke();

  const objText = `TOWERS: ${ev.towersA || '7'} - ${ev.towersB || '3'}   ◆   DARK TYRANT: 2 - 1   ◆   OVERLORD: 1 - 0`;
  g.font = `700 ${Math.round(12.5 * u)}px 'Chakra Petch', sans-serif`;
  g.fillStyle = '#CBD5E1';
  tText(g, objText, cx, tickerTop + 21 * u, { align: 'center', tr: 2 * u });

  g.restore();
}

/* =========================================================================
   6. FACEOFF / LANE MATCHUP (1920x640)
   ========================================================================= */
export function drawFaceoff(
  g: CanvasRenderingContext2D,
  W: number,
  H: number,
  state: StudioState,
  p: number
) {
  const { a, b, p: player, event: ev, s } = state;
  const cx = W / 2;
  const u = W / 1920;
  const acc = s.accent;
  const fontFam = FONTMAP[s.font]?.fam || "'Anton', sans-serif";

  // Top Title Ribbon with HOK Championship Seal
  drawHOKChampionshipSeal(g, cx - 240 * u, 70 * u, 14 * u, acc);
  drawHOKChampionshipSeal(g, cx + 240 * u, 70 * u, 14 * u, acc);

  g.font = `700 ${Math.round(22 * u)}px 'Barlow Condensed', sans-serif`;
  g.fillStyle = acc;
  tText(g, `${ev.title.toUpperCase()} · ${player.role.toUpperCase()} 1V1 DUEL`, cx, 76 * u, {
    align: 'center',
    tr: 6 * u,
  });

  // Background Split Pedestals
  const seam = 60 * u;
  clipDraw(
    g,
    () => poly(g, [[0, 0], [cx - seam, 0], [cx - seam * 1.5, H], [0, H]]),
    () => {
      const aG = g.createLinearGradient(0, 0, cx, 0);
      aG.addColorStop(0, rgba(a.color, 0.28));
      aG.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = aG;
      g.fillRect(0, 0, cx, H);
      if (s.dragonCrests !== false) {
        drawHOKDragonScaleTexture(g, 0, 0, cx, H, acc, 0.05);
      }
    }
  );

  clipDraw(
    g,
    () => poly(g, [[cx + seam, 0], [W, 0], [W, H], [cx + seam * 0.5, H]]),
    () => {
      const bG = g.createLinearGradient(W, 0, cx, 0);
      bG.addColorStop(0, rgba(b.color, 0.28));
      bG.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = bG;
      g.fillRect(cx, 0, W - cx, H);
      if (s.dragonCrests !== false) {
        drawHOKDragonScaleTexture(g, cx, 0, W - cx, H, acc, 0.05);
      }
    }
  );

  // Dragon Horn brackets at the corners
  if (s.dragonCrests !== false) {
    drawHOKDragonHorn(g, 40 * u, 40 * u, 28 * u, Math.PI * 0.9, a.color, acc);
    drawHOKDragonHorn(g, W - 40 * u, 40 * u, 28 * u, -Math.PI * 0.1, b.color, acc);
  }

  // Team A Logo Badge & Tag
  const logoAX = 140 * u;
  const logoAY = 160 * u;
  drawTeamLogoBadge(g, logoAX, logoAY, 52 * u, a, acc, true);
  g.font = `800 ${28 * u}px 'Oxanium', sans-serif`;
  g.fillStyle = a.color;
  tText(g, a.name.toUpperCase(), logoAX + 72 * u, logoAY - 10 * u);
  g.font = `700 ${18 * u}px 'Barlow Condensed', sans-serif`;
  g.fillStyle = 'rgba(255,255,255,0.7)';
  tText(g, `BLUE SIDE · SCORE: ${a.score}`, logoAX + 72 * u, logoAY + 20 * u, { tr: 2 * u });

  // Team B Logo Badge & Tag
  const logoBX = W - 140 * u;
  const logoBY = 160 * u;
  drawTeamLogoBadge(g, logoBX, logoBY, 52 * u, b, acc, true);
  g.font = `800 ${28 * u}px 'Oxanium', sans-serif`;
  g.fillStyle = b.color;
  tText(g, b.name.toUpperCase(), logoBX - 72 * u, logoBY - 10 * u, { align: 'right' });
  g.font = `700 ${18 * u}px 'Barlow Condensed', sans-serif`;
  g.fillStyle = 'rgba(255,255,255,0.7)';
  tText(g, `RED SIDE · SCORE: ${b.score}`, logoBX - 72 * u, logoBY + 20 * u, { align: 'right', tr: 2 * u });

  // Hero Avatars
  const avR = 140 * u;
  const avY = H * 0.55;
  drawHeroAvatar(g, cx - 380 * u, avY, avR, player.photo, player.hero, a.color, acc, true);
  drawHeroAvatar(g, cx + 380 * u, avY, avR, null, 'Luna', b.color, acc, true);

  // Centerpiece: Silver Dragon Cup and Glowing VS
  drawHOKSilverDragonCup(g, cx, avY - 70 * u, 28 * u, acc);
  g.font = `400 ${Math.round(110 * u)}px ${fontFam}`;
  g.fillStyle = goldGrad(g, avY + 45 * u, 110 * u, acc);
  g.shadowColor = rgba(acc, 0.8);
  g.shadowBlur = 24 * u;
  tText(g, 'VS', cx, avY + 45 * u, { align: 'center', tr: 4 * u });
  g.shadowBlur = 0;

  // Player Names & Hero Roles
  const nameY = avY + avR + 60 * u;
  g.font = `400 ${Math.round(62 * u)}px ${fontFam}`;
  g.fillStyle = '#FFFFFF';
  tText(g, player.name.toUpperCase(), cx - 380 * u, nameY, { align: 'center', tr: 2 * u });
  tText(g, 'RIVAL_IGN', cx + 380 * u, nameY, { align: 'center', tr: 2 * u });

  // Role Glyphs below names
  drawHOKRoleIcon(g, cx - 380 * u, nameY + 36 * u, 16 * u, player.role, a.color, acc);
  drawHOKRoleIcon(g, cx + 380 * u, nameY + 36 * u, 16 * u, player.role, b.color, acc);

  g.font = `700 ${18 * u}px 'Barlow Condensed', sans-serif`;
  g.fillStyle = acc;
  tText(g, `${player.hero.toUpperCase()} (${player.role.toUpperCase()})`, cx - 380 * u, nameY + 42 * u, { align: 'center', tr: 2 * u });
  tText(g, `LUNA (${player.role.toUpperCase()})`, cx + 380 * u, nameY + 42 * u, { align: 'center', tr: 2 * u });
}

/* =========================================================================
   MASTER RENDER FUNCTION
   ========================================================================= */
export function renderCanvas(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  state: StudioState,
  progress: number
) {
  const p = clamp(progress, 0, 1);
  ctx.save();
  ctx.clearRect(0, 0, W, H);

  // 1. Paint Background (Green Screen, Blue Screen, Transparent, Gameplay, or Stage)
  paintBackground(ctx, W, H, state, p);

  // 2. Camera Subtle Cinematic Push
  if (state.anim.camera && state.tpl !== 'lower') {
    const cam = 1 + 0.02 * eOC(p);
    ctx.translate(W / 2, H / 2);
    ctx.scale(cam, cam);
    ctx.translate(-W / 2, -H / 2);
  }

  // 3. Render Requested Template
  switch (state.tpl) {
    case 'lower':
      drawLowerThird(ctx, W, H, state, p);
      break;
    case 'banner':
      drawFinalsBanner(ctx, W, H, state, p);
      break;
    case 'mvp':
      drawMVPCard(ctx, W, H, state, p);
      break;
    case 'card':
      drawPlayerCard(ctx, W, H, state, p);
      break;
    case 'score':
      drawScoreBug(ctx, W, H, state, p);
      break;
    case 'faceoff':
      drawFaceoff(ctx, W, H, state, p);
      break;
  }

  // 4. Safe Area Guides (Action & Title Safe lines if enabled)
  if (state.s.safeArea) {
    drawSafeGuides(ctx, W, H);
  }

  ctx.restore();
}

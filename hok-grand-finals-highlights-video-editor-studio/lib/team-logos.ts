/**
 * Pre-bundled SVG logo data URIs for official HOK / KPL esports teams.
 * These ensure that every team preset immediately has a high-res, professional
 * esports emblem on the Score Bug, Lower Third, and Finals Banner.
 */

export function createTeamSvgLogo(tag: string, color: string, name: string): string {
  const cleanTag = tag.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'HOK';
  const c1 = color || '#00A3E0';
  const c2 = '#FFFFFF';
  
  // Custom stylized SVG crests based on tag
  let innerArt = '';
  
  if (cleanTag === 'TS') {
    // Team Secret Eye / Stealth Crest
    innerArt = `
      <polygon points="100,28 172,70 172,154 100,196 28,154 28,70" fill="none" stroke="${c1}" stroke-width="8"/>
      <path d="M50 112 C75 80, 125 80, 150 112 C125 144, 75 144, 50 112 Z" fill="none" stroke="${c2}" stroke-width="7"/>
      <circle cx="100" cy="112" r="18" fill="${c1}"/>
      <circle cx="100" cy="112" r="8" fill="#040711"/>
    `;
  } else if (cleanTag === 'WLG' || cleanTag === 'WOLVES') {
    // Wolves Predator Crest
    innerArt = `
      <polygon points="100,20 180,68 155,175 100,200 45,175 20,68" fill="none" stroke="${c1}" stroke-width="8"/>
      <polygon points="100,50 125,100 155,80 135,135 100,170 65,135 45,80 75,100" fill="${c1}"/>
      <polygon points="100,85 115,115 100,140 85,115" fill="#040711"/>
    `;
  } else if (cleanTag === 'AG') {
    // AG Super Play Star Shield
    innerArt = `
      <polygon points="100,22 178,55 178,135 100,195 22,135 22,55" fill="none" stroke="${c1}" stroke-width="8"/>
      <path d="M100,45 L114,88 L160,88 L123,115 L137,158 L100,131 L63,158 L77,115 L40,88 L86,88 Z" fill="${c1}"/>
      <text x="100" y="125" font-family="'Oxanium', sans-serif" font-weight="900" font-size="28" fill="#FFFFFF" text-anchor="middle">AG</text>
    `;
  } else if (cleanTag === 'LGD') {
    // LGD Gaming MY Dragon Shield
    innerArt = `
      <polygon points="100,22 178,55 178,140 100,198 22,140 22,55" fill="none" stroke="${c1}" stroke-width="8"/>
      <path d="M60 85 Q100 45 140 85 Q160 120 100 165 Q40 120 60 85 Z" fill="none" stroke="${c2}" stroke-width="6"/>
      <text x="100" y="122" font-family="'Oxanium', sans-serif" font-weight="900" font-size="34" fill="${c1}" text-anchor="middle">LGD</text>
    `;
  } else if (cleanTag === 'ES') {
    // eStar Pro Starburst
    innerArt = `
      <circle cx="100" cy="112" r="76" fill="none" stroke="${c1}" stroke-width="8"/>
      <polygon points="100,32 118,92 180,112 118,132 100,192 82,132 20,112 82,92" fill="${c1}"/>
      <circle cx="100" cy="112" r="24" fill="#040711"/>
      <text x="100" y="119" font-family="'Oxanium', sans-serif" font-weight="900" font-size="20" fill="#FFFFFF" text-anchor="middle">eS</text>
    `;
  } else if (cleanTag === 'NOVA') {
    // NOVA Supernova
    innerArt = `
      <polygon points="100,25 175,68 175,155 100,198 25,155 25,68" fill="none" stroke="${c1}" stroke-width="8"/>
      <circle cx="100" cy="112" r="45" fill="${c1}"/>
      <text x="100" y="120" font-family="'Oxanium', sans-serif" font-weight="900" font-size="24" fill="#040711" text-anchor="middle">NOVA</text>
    `;
  } else if (cleanTag === 'GEN') {
    // Gen.G Tiger Crest
    innerArt = `
      <polygon points="100,24 175,55 175,135 100,195 25,135 25,55" fill="none" stroke="${c1}" stroke-width="8"/>
      <path d="M55 75 L100 50 L145 75 L145 130 L100 165 L55 130 Z" fill="${c1}"/>
      <text x="100" y="122" font-family="'Oxanium', sans-serif" font-weight="900" font-size="30" fill="#040711" text-anchor="middle">GEN</text>
    `;
  } else {
    // Generic championship geometric badge
    innerArt = `
      <polygon points="100,24 176,68 176,156 100,200 24,156 24,68" fill="none" stroke="${c1}" stroke-width="8"/>
      <polygon points="100,44 156,76 156,148 100,180 44,148 44,76" fill="rgba(255,255,255,0.06)"/>
      <text x="100" y="124" font-family="'Oxanium', sans-serif" font-weight="900" font-size="${cleanTag.length > 3 ? 30 : 40}" fill="${c1}" text-anchor="middle" letter-spacing="1">${cleanTag}</text>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" width="200" height="220">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#040711" stop-opacity="0.95"/>
      </linearGradient>
    </defs>
    <rect width="200" height="220" rx="20" fill="url(#grad)" fill-opacity="0.4"/>
    ${innerArt}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function loadTeamLogoImage(tag: string, color: string, name: string): Promise<HTMLImageElement> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img);
    img.src = createTeamSvgLogo(tag, color, name);
  });
}

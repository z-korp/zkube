export const THEME_IDS = [
  "theme-1",
  "theme-2",
  "theme-3",
  "theme-4",
  "theme-5",
  "theme-6",
  "theme-7",
  "theme-8",
  "theme-9",
  "theme-10",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export type ThemeMode = "dark" | "light" | "system";

export type MusicContext = "main" | "level" | "boss";

export interface ThemeMeta {
  name: string;
  description: string;
}

export const THEME_META: Record<ThemeId, ThemeMeta> = {
  "theme-1": {
    name: "Polynesian",
    description:
      "Moonlit Polynesian coast in deep cobalt tones, silver surf, and quiet lunar haze with restrained tiki presence",
  },
  "theme-2": {
    name: "Ancient Egypt",
    description: "Golden pyramids at dusk with hieroglyph-covered obelisks and sun-drenched sandstone",
  },
  "theme-3": {
    name: "Norse",
    description: "Frost-covered viking realm with heavy rune stones, iron-clad shields, and aurora-lit skies",
  },
  "theme-4": {
    name: "Ancient Greece",
    description:
      "White marble temples overlooking the Aegean Sea with elegant Greek-key borders and clean architecture",
  },
  "theme-5": {
    name: "Feudal Japan",
    description: "Black lacquer dojo with red trim, brushstroke calligraphy, and cherry blossom petals",
  },
  "theme-6": {
    name: "Ancient China",
    description: "Imperial jade palace with dragon-scale overlays, golden calligraphy, and mystical mist",
  },
  "theme-7": {
    name: "Ancient Persia",
    description: "Regal Persian palace with blue geometric tile mosaics, golden relief carvings, and luminous symmetry",
  },
  "theme-8": {
    name: "Mayan",
    description: "Dense jungle temple ruins with carved stone, calendar glyphs, and moss-covered ancient masonry",
  },
  "theme-9": {
    name: "Pueblo",
    description: "Adobe desert settlement with turquoise inlays, geometric painted borders, and vast canyon skies",
  },
  "theme-10": {
    name: "Inca",
    description:
      "Mountainous stone citadel with interlocking polygonal masonry, sun-god gold highlights, and rope textile accents",
  },
};

export interface BlockColors {
  fill: string;
  glow: string;
  highlight: string;
}

export interface ThemeColors {
  background: string;
  backgroundGradientStart: string;
  backgroundGradientEnd: string;
  gridLines: string;
  gridLinesAlpha: number;
  gridBg: string;
  gridCellAlt: string;
  frameBorder: string;
  hudBar: string;
  hudBarBorder: string;
  actionBarBg: string;
  dangerZone: string;
  dangerZoneAlpha: number;
  accent: string;
  blocks: Record<1 | 2 | 3 | 4, BlockColors>;
  particles: {
    primary: string[];
    explosion: string[];
  };
}

function hex(n: number): string {
  return `#${n.toString(16).padStart(6, "0")}`;
}

function darken(hexColor: string, amount: number): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  return `#${Math.round(r * (1 - amount)).toString(16).padStart(2, "0")}${Math.round(g * (1 - amount)).toString(16).padStart(2, "0")}${Math.round(b * (1 - amount)).toString(16).padStart(2, "0")}`;
}

function lighten(hexColor: string, amount: number): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  return `#${Math.round(r + (255 - r) * amount).toString(16).padStart(2, "0")}${Math.round(g + (255 - g) * amount).toString(16).padStart(2, "0")}${Math.round(b + (255 - b) * amount).toString(16).padStart(2, "0")}`;
}

const POLYNESIAN_COLORS: ThemeColors = {
  background: "#041A44",
  backgroundGradientStart: lighten("#041A44", 0.06),
  backgroundGradientEnd: darken("#041A44", 0.12),
  gridLines: darken("#A9D8FF", 0.25),
  gridLinesAlpha: 0.3,
  gridBg: lighten("#041A44", 0.04),
  gridCellAlt: lighten("#041A44", 0.07),
  frameBorder: "#A9D8FF",
  hudBar: darken("#041A44", 0.2),
  hudBarBorder: darken("#A9D8FF", 0.35),
  actionBarBg: darken("#041A44", 0.2),
  dangerZone: "#ff4444",
  dangerZoneAlpha: 0.25,
  accent: "#A9D8FF",
  blocks: {
    1: { fill: "#7EC8E3", glow: darken("#7EC8E3", 0.18), highlight: lighten("#7EC8E3", 0.18) },
    2: { fill: "#2ECFB0", glow: darken("#2ECFB0", 0.18), highlight: lighten("#2ECFB0", 0.18) },
    3: { fill: "#1B3A6B", glow: darken("#1B3A6B", 0.18), highlight: lighten("#1B3A6B", 0.18) },
    4: { fill: "#B0BEC5", glow: darken("#B0BEC5", 0.18), highlight: lighten("#B0BEC5", 0.18) },
  },
  particles: {
    primary: ["#7EC8E3", "#2ECFB0", "#1B3A6B", "#B0BEC5", "#A9D8FF"],
    explosion: ["#ffffff", "#A9D8FF", "#7EC8E3", "#2ECFB0", "#1B3A6B"],
  },
};

const ANCIENT_EGYPT_COLORS: ThemeColors = {
  background: "#120C08",
  backgroundGradientStart: lighten("#120C08", 0.06),
  backgroundGradientEnd: darken("#120C08", 0.12),
  gridLines: darken("#D4AF37", 0.25),
  gridLinesAlpha: 0.3,
  gridBg: lighten("#120C08", 0.04),
  gridCellAlt: lighten("#120C08", 0.07),
  frameBorder: "#D4AF37",
  hudBar: darken("#120C08", 0.2),
  hudBarBorder: darken("#D4AF37", 0.35),
  actionBarBg: darken("#120C08", 0.2),
  dangerZone: "#ff4444",
  dangerZoneAlpha: 0.25,
  accent: "#D4AF37",
  blocks: {
    1: { fill: "#F0CF7A", glow: darken("#F0CF7A", 0.18), highlight: lighten("#F0CF7A", 0.18) },
    2: { fill: "#6A4A1F", glow: darken("#6A4A1F", 0.18), highlight: lighten("#6A4A1F", 0.18) },
    3: { fill: "#B8823A", glow: darken("#B8823A", 0.18), highlight: lighten("#B8823A", 0.18) },
    4: { fill: "#8A7B64", glow: darken("#8A7B64", 0.18), highlight: lighten("#8A7B64", 0.18) },
  },
  particles: {
    primary: ["#F0CF7A", "#6A4A1F", "#B8823A", "#8A7B64", "#D4AF37"],
    explosion: ["#ffffff", "#D4AF37", "#F0CF7A", "#6A4A1F", "#B8823A"],
  },
};

const NORSE_COLORS: ThemeColors = {
  background: "#0A1520",
  backgroundGradientStart: lighten("#0A1520", 0.06),
  backgroundGradientEnd: darken("#0A1520", 0.12),
  gridLines: darken("#7EB8DA", 0.25),
  gridLinesAlpha: 0.3,
  gridBg: lighten("#0A1520", 0.04),
  gridCellAlt: lighten("#0A1520", 0.07),
  frameBorder: "#7EB8DA",
  hudBar: darken("#0A1520", 0.2),
  hudBarBorder: darken("#7EB8DA", 0.35),
  actionBarBg: darken("#0A1520", 0.2),
  dangerZone: "#ff4444",
  dangerZoneAlpha: 0.25,
  accent: "#7EB8DA",
  blocks: {
    1: { fill: "#A9C4DF", glow: darken("#A9C4DF", 0.18), highlight: lighten("#A9C4DF", 0.18) },
    2: { fill: "#2F4760", glow: darken("#2F4760", 0.18), highlight: lighten("#2F4760", 0.18) },
    3: { fill: "#4C7FA3", glow: darken("#4C7FA3", 0.18), highlight: lighten("#4C7FA3", 0.18) },
    4: { fill: "#7B6FA3", glow: darken("#7B6FA3", 0.18), highlight: lighten("#7B6FA3", 0.18) },
  },
  particles: {
    primary: ["#A9C4DF", "#2F4760", "#4C7FA3", "#7B6FA3", "#7EB8DA"],
    explosion: ["#ffffff", "#7EB8DA", "#A9C4DF", "#2F4760", "#4C7FA3"],
  },
};

const ANCIENT_GREECE_COLORS: ThemeColors = {
  background: "#1A2030",
  backgroundGradientStart: lighten("#1A2030", 0.06),
  backgroundGradientEnd: darken("#1A2030", 0.12),
  gridLines: darken("#3B6FA0", 0.25),
  gridLinesAlpha: 0.3,
  gridBg: lighten("#1A2030", 0.04),
  gridCellAlt: lighten("#1A2030", 0.07),
  frameBorder: "#3B6FA0",
  hudBar: darken("#1A2030", 0.2),
  hudBarBorder: darken("#3B6FA0", 0.35),
  actionBarBg: darken("#1A2030", 0.2),
  dangerZone: "#ff4444",
  dangerZoneAlpha: 0.25,
  accent: "#3B6FA0",
  blocks: {
    1: { fill: "#BFD5E8", glow: darken("#BFD5E8", 0.18), highlight: lighten("#BFD5E8", 0.18) },
    2: { fill: "#1F3E63", glow: darken("#1F3E63", 0.18), highlight: lighten("#1F3E63", 0.18) },
    3: { fill: "#3E7FB3", glow: darken("#3E7FB3", 0.18), highlight: lighten("#3E7FB3", 0.18) },
    4: { fill: "#6B86B0", glow: darken("#6B86B0", 0.18), highlight: lighten("#6B86B0", 0.18) },
  },
  particles: {
    primary: ["#BFD5E8", "#1F3E63", "#3E7FB3", "#6B86B0", "#3B6FA0"],
    explosion: ["#ffffff", "#3B6FA0", "#BFD5E8", "#1F3E63", "#3E7FB3"],
  },
};

const FEUDAL_JAPAN_COLORS: ThemeColors = {
  background: "#0D0D12",
  backgroundGradientStart: lighten("#0D0D12", 0.06),
  backgroundGradientEnd: darken("#0D0D12", 0.12),
  gridLines: darken("#C41E3A", 0.25),
  gridLinesAlpha: 0.3,
  gridBg: lighten("#0D0D12", 0.04),
  gridCellAlt: lighten("#0D0D12", 0.07),
  frameBorder: "#C41E3A",
  hudBar: darken("#0D0D12", 0.2),
  hudBarBorder: darken("#C41E3A", 0.35),
  actionBarBg: darken("#0D0D12", 0.2),
  dangerZone: "#ff4444",
  dangerZoneAlpha: 0.25,
  accent: "#C41E3A",
  blocks: {
    1: { fill: "#E19AA3", glow: darken("#E19AA3", 0.18), highlight: lighten("#E19AA3", 0.18) },
    2: { fill: "#4B1821", glow: darken("#4B1821", 0.18), highlight: lighten("#4B1821", 0.18) },
    3: { fill: "#C45A3A", glow: darken("#C45A3A", 0.18), highlight: lighten("#C45A3A", 0.18) },
    4: { fill: "#7A3E7E", glow: darken("#7A3E7E", 0.18), highlight: lighten("#7A3E7E", 0.18) },
  },
  particles: {
    primary: ["#E19AA3", "#4B1821", "#C45A3A", "#7A3E7E", "#C41E3A"],
    explosion: ["#ffffff", "#C41E3A", "#E19AA3", "#4B1821", "#C45A3A"],
  },
};

const ANCIENT_CHINA_COLORS: ThemeColors = {
  background: "#0A1A0A",
  backgroundGradientStart: lighten("#0A1A0A", 0.06),
  backgroundGradientEnd: darken("#0A1A0A", 0.12),
  gridLines: darken("#50C878", 0.25),
  gridLinesAlpha: 0.3,
  gridBg: lighten("#0A1A0A", 0.04),
  gridCellAlt: lighten("#0A1A0A", 0.07),
  frameBorder: "#50C878",
  hudBar: darken("#0A1A0A", 0.2),
  hudBarBorder: darken("#50C878", 0.35),
  actionBarBg: darken("#0A1A0A", 0.2),
  dangerZone: "#ff4444",
  dangerZoneAlpha: 0.25,
  accent: "#50C878",
  blocks: {
    1: { fill: "#9CD8B6", glow: darken("#9CD8B6", 0.18), highlight: lighten("#9CD8B6", 0.18) },
    2: { fill: "#174A33", glow: darken("#174A33", 0.18), highlight: lighten("#174A33", 0.18) },
    3: { fill: "#7AA34A", glow: darken("#7AA34A", 0.18), highlight: lighten("#7AA34A", 0.18) },
    4: { fill: "#3F7F8C", glow: darken("#3F7F8C", 0.18), highlight: lighten("#3F7F8C", 0.18) },
  },
  particles: {
    primary: ["#9CD8B6", "#174A33", "#7AA34A", "#3F7F8C", "#50C878"],
    explosion: ["#ffffff", "#50C878", "#9CD8B6", "#174A33", "#7AA34A"],
  },
};

const ANCIENT_PERSIA_COLORS: ThemeColors = {
  background: "#0A0F2A",
  backgroundGradientStart: lighten("#0A0F2A", 0.06),
  backgroundGradientEnd: darken("#0A0F2A", 0.12),
  gridLines: darken("#1E90FF", 0.25),
  gridLinesAlpha: 0.3,
  gridBg: lighten("#0A0F2A", 0.04),
  gridCellAlt: lighten("#0A0F2A", 0.07),
  frameBorder: "#1E90FF",
  hudBar: darken("#0A0F2A", 0.2),
  hudBarBorder: darken("#1E90FF", 0.35),
  actionBarBg: darken("#0A0F2A", 0.2),
  dangerZone: "#ff4444",
  dangerZoneAlpha: 0.25,
  accent: "#1E90FF",
  blocks: {
    1: { fill: "#9EB7DF", glow: darken("#9EB7DF", 0.18), highlight: lighten("#9EB7DF", 0.18) },
    2: { fill: "#1A2E5A", glow: darken("#1A2E5A", 0.18), highlight: lighten("#1A2E5A", 0.18) },
    3: { fill: "#3C5FA8", glow: darken("#3C5FA8", 0.18), highlight: lighten("#3C5FA8", 0.18) },
    4: { fill: "#3F8AA2", glow: darken("#3F8AA2", 0.18), highlight: lighten("#3F8AA2", 0.18) },
  },
  particles: {
    primary: ["#9EB7DF", "#1A2E5A", "#3C5FA8", "#3F8AA2", "#1E90FF"],
    explosion: ["#ffffff", "#1E90FF", "#9EB7DF", "#1A2E5A", "#3C5FA8"],
  },
};

const MAYAN_COLORS: ThemeColors = {
  background: "#0A1A0A",
  backgroundGradientStart: lighten("#0A1A0A", 0.06),
  backgroundGradientEnd: darken("#0A1A0A", 0.12),
  gridLines: darken("#4CAF50", 0.25),
  gridLinesAlpha: 0.3,
  gridBg: lighten("#0A1A0A", 0.04),
  gridCellAlt: lighten("#0A1A0A", 0.07),
  frameBorder: "#4CAF50",
  hudBar: darken("#0A1A0A", 0.2),
  hudBarBorder: darken("#4CAF50", 0.35),
  actionBarBg: darken("#0A1A0A", 0.2),
  dangerZone: "#ff4444",
  dangerZoneAlpha: 0.25,
  accent: "#4CAF50",
  blocks: {
    1: { fill: "#A9BE72", glow: darken("#A9BE72", 0.18), highlight: lighten("#A9BE72", 0.18) },
    2: { fill: "#2E3B1A", glow: darken("#2E3B1A", 0.18), highlight: lighten("#2E3B1A", 0.18) },
    3: { fill: "#5E8A3B", glow: darken("#5E8A3B", 0.18), highlight: lighten("#5E8A3B", 0.18) },
    4: { fill: "#8A6A3B", glow: darken("#8A6A3B", 0.18), highlight: lighten("#8A6A3B", 0.18) },
  },
  particles: {
    primary: ["#A9BE72", "#2E3B1A", "#5E8A3B", "#8A6A3B", "#4CAF50"],
    explosion: ["#ffffff", "#4CAF50", "#A9BE72", "#2E3B1A", "#5E8A3B"],
  },
};

const PUEBLO_COLORS: ThemeColors = {
  background: "#2A1F14",
  backgroundGradientStart: lighten("#2A1F14", 0.06),
  backgroundGradientEnd: darken("#2A1F14", 0.12),
  gridLines: darken("#40C8B8", 0.25),
  gridLinesAlpha: 0.3,
  gridBg: lighten("#2A1F14", 0.04),
  gridCellAlt: lighten("#2A1F14", 0.07),
  frameBorder: "#40C8B8",
  hudBar: darken("#2A1F14", 0.2),
  hudBarBorder: darken("#40C8B8", 0.35),
  actionBarBg: darken("#2A1F14", 0.2),
  dangerZone: "#ff4444",
  dangerZoneAlpha: 0.25,
  accent: "#40C8B8",
  blocks: {
    1: { fill: "#E0A07A", glow: darken("#E0A07A", 0.18), highlight: lighten("#E0A07A", 0.18) },
    2: { fill: "#5C2E1D", glow: darken("#5C2E1D", 0.18), highlight: lighten("#5C2E1D", 0.18) },
    3: { fill: "#B85D3C", glow: darken("#B85D3C", 0.18), highlight: lighten("#B85D3C", 0.18) },
    4: { fill: "#4E8F9B", glow: darken("#4E8F9B", 0.18), highlight: lighten("#4E8F9B", 0.18) },
  },
  particles: {
    primary: ["#E0A07A", "#5C2E1D", "#B85D3C", "#4E8F9B", "#40C8B8"],
    explosion: ["#ffffff", "#40C8B8", "#E0A07A", "#5C2E1D", "#B85D3C"],
  },
};

const INCA_COLORS: ThemeColors = {
  background: "#1A1A2A",
  backgroundGradientStart: lighten("#1A1A2A", 0.06),
  backgroundGradientEnd: darken("#1A1A2A", 0.12),
  gridLines: darken("#D4AF37", 0.25),
  gridLinesAlpha: 0.3,
  gridBg: lighten("#1A1A2A", 0.04),
  gridCellAlt: lighten("#1A1A2A", 0.07),
  frameBorder: "#D4AF37",
  hudBar: darken("#1A1A2A", 0.2),
  hudBarBorder: darken("#D4AF37", 0.35),
  actionBarBg: darken("#1A1A2A", 0.2),
  dangerZone: "#ff4444",
  dangerZoneAlpha: 0.25,
  accent: "#D4AF37",
  blocks: {
    1: { fill: "#C7BCA9", glow: darken("#C7BCA9", 0.18), highlight: lighten("#C7BCA9", 0.18) },
    2: { fill: "#4B4438", glow: darken("#4B4438", 0.18), highlight: lighten("#4B4438", 0.18) },
    3: { fill: "#8C8670", glow: darken("#8C8670", 0.18), highlight: lighten("#8C8670", 0.18) },
    4: { fill: "#A08A4E", glow: darken("#A08A4E", 0.18), highlight: lighten("#A08A4E", 0.18) },
  },
  particles: {
    primary: ["#C7BCA9", "#4B4438", "#8C8670", "#A08A4E", "#D4AF37"],
    explosion: ["#ffffff", "#D4AF37", "#C7BCA9", "#4B4438", "#8C8670"],
  },
};

export const THEME_COLORS: Record<ThemeId, ThemeColors> = {
  "theme-1": POLYNESIAN_COLORS,
  "theme-2": ANCIENT_EGYPT_COLORS,
  "theme-3": NORSE_COLORS,
  "theme-4": ANCIENT_GREECE_COLORS,
  "theme-5": FEUDAL_JAPAN_COLORS,
  "theme-6": ANCIENT_CHINA_COLORS,
  "theme-7": ANCIENT_PERSIA_COLORS,
  "theme-8": MAYAN_COLORS,
  "theme-9": PUEBLO_COLORS,
  "theme-10": INCA_COLORS,
};

export function getThemeColors(themeId: ThemeId): ThemeColors {
  return THEME_COLORS[themeId] ?? POLYNESIAN_COLORS;
}

export function getBlockColors(themeId: ThemeId, blockWidth: 1 | 2 | 3 | 4): BlockColors {
  const colors = getThemeColors(themeId);
  return colors.blocks[blockWidth] ?? colors.blocks[1];
}

export const THEME_MUSIC: Record<ThemeId, Record<MusicContext, string>> = {
  "theme-1": {
    main: "/assets/theme-1/sounds/musics/main.mp3",
    level: "/assets/theme-1/sounds/musics/level.mp3",
    boss: "/assets/theme-1/sounds/musics/boss.mp3",
  },
  "theme-2": {
    main: "/assets/theme-2/sounds/musics/main.mp3",
    level: "/assets/theme-2/sounds/musics/level.mp3",
    boss: "/assets/theme-2/sounds/musics/boss.mp3",
  },
  "theme-3": {
    main: "/assets/theme-3/sounds/musics/main.mp3",
    level: "/assets/theme-3/sounds/musics/level.mp3",
    boss: "/assets/theme-3/sounds/musics/boss.mp3",
  },
  "theme-4": {
    main: "/assets/theme-4/sounds/musics/main.mp3",
    level: "/assets/theme-4/sounds/musics/level.mp3",
    boss: "/assets/theme-4/sounds/musics/boss.mp3",
  },
  "theme-5": {
    main: "/assets/theme-5/sounds/musics/main.mp3",
    level: "/assets/theme-5/sounds/musics/level.mp3",
    boss: "/assets/theme-5/sounds/musics/boss.mp3",
  },
  "theme-6": {
    main: "/assets/theme-6/sounds/musics/main.mp3",
    level: "/assets/theme-6/sounds/musics/level.mp3",
    boss: "/assets/theme-6/sounds/musics/boss.mp3",
  },
  "theme-7": {
    main: "/assets/theme-7/sounds/musics/main.mp3",
    level: "/assets/theme-7/sounds/musics/level.mp3",
    boss: "/assets/theme-7/sounds/musics/boss.mp3",
  },
  "theme-8": {
    main: "/assets/theme-8/sounds/musics/main.mp3",
    level: "/assets/theme-8/sounds/musics/level.mp3",
    boss: "/assets/theme-8/sounds/musics/boss.mp3",
  },
  "theme-9": {
    main: "/assets/theme-9/sounds/musics/main.mp3",
    level: "/assets/theme-9/sounds/musics/level.mp3",
    boss: "/assets/theme-9/sounds/musics/boss.mp3",
  },
  "theme-10": {
    main: "/assets/theme-10/sounds/musics/main.mp3",
    level: "/assets/theme-10/sounds/musics/level.mp3",
    boss: "/assets/theme-10/sounds/musics/boss.mp3",
  },
};

export const SFX_PATHS = {
  // Core gameplay
  move: "/assets/common/sounds/effects/move.mp3",
  swipe: "/assets/common/sounds/effects/swipe.mp3",
  break: "/assets/common/sounds/effects/break.mp3",
  explode: "/assets/common/sounds/effects/explode.mp3",
  new: "/assets/common/sounds/effects/new.mp3",
  // Game flow
  start: "/assets/common/sounds/effects/start.mp3",
  over: "/assets/common/sounds/effects/over.mp3",
  levelup: "/assets/common/sounds/effects/levelup.mp3",
  victory: "/assets/common/sounds/effects/victory.mp3",
  // Boss
  "boss-intro": "/assets/common/sounds/effects/boss-intro.mp3",
  "boss-defeat": "/assets/common/sounds/effects/boss-defeat.mp3",
  // UI interaction
  click: "/assets/common/sounds/effects/click.mp3",
  coin: "/assets/common/sounds/effects/coin.mp3",
  star: "/assets/common/sounds/effects/star.mp3",
  claim: "/assets/common/sounds/effects/claim.mp3",
  // Bonus & shop
  "bonus-activate": "/assets/common/sounds/effects/bonus-activate.mp3",
  "shop-purchase": "/assets/common/sounds/effects/shop-purchase.mp3",
  equip: "/assets/common/sounds/effects/equip.mp3",
  unequip: "/assets/common/sounds/effects/unequip.mp3",
  "constraint-complete": "/assets/common/sounds/effects/constraint-complete.mp3",
} as const;

export type SfxName = keyof typeof SFX_PATHS;

export function getThemeAssetPath(themeId: ThemeId, asset: string): string {
  return `/assets/${themeId}/${asset}`;
}

export function getCommonAssetPath(path: string): string {
  return `/assets/common/${path}`;
}

export function getThemeImages(themeId: ThemeId) {
  const base = `/assets/${themeId}`;

  return {
    block1: `${base}/block-1.png`,
    block2: `${base}/block-2.png`,
    block3: `${base}/block-3.png`,
    block4: `${base}/block-4.png`,
    loadingBg: `${base}/loading-bg.png`,
    logo: `${base}/logo.png`,
    background: `${base}/background.png`,
    gridBg: `${base}/grid-bg.png`,
    mapBg: `${base}/map-bg.png`,
    mapNodeLevel: `${base}/map-node-level.png`,
    mapNodeShop: `${base}/map-node-shop.png`,
    mapNodeBoss: `${base}/map-node-boss.png`,
    mapNodeCompleted: `${base}/map-node-completed.png`,
    themeIcon: `${base}/theme-icon.png`,
  };
}

const AUDIO_STORAGE_KEY = "zkube-audio-settings";
const THEME_STORAGE_KEY = "zkube-theme-template";

export interface AudioSettings {
  musicVolume: number;
  effectsVolume: number;
}

const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  musicVolume: 0.3,
  effectsVolume: 0.5,
};

export function loadAudioSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(AUDIO_STORAGE_KEY);
    if (!raw) return DEFAULT_AUDIO_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AudioSettings>;
    return {
      musicVolume: clamp(parsed.musicVolume ?? DEFAULT_AUDIO_SETTINGS.musicVolume, 0, 1),
      effectsVolume: clamp(parsed.effectsVolume ?? DEFAULT_AUDIO_SETTINGS.effectsVolume, 0, 1),
    };
  } catch {
    return DEFAULT_AUDIO_SETTINGS;
  }
}

export function saveAudioSettings(settings: AudioSettings): void {
  localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(settings));
}

export function loadThemeTemplate(): ThemeId {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && THEME_IDS.includes(stored as ThemeId)) {
      return stored as ThemeId;
    }
    return "theme-1";
  } catch {
    return "theme-1";
  }
}

export function saveThemeTemplate(themeId: ThemeId): void {
  localStorage.setItem(THEME_STORAGE_KEY, themeId);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function isValidThemeId(value: string): value is ThemeId {
  return THEME_IDS.includes(value as ThemeId);
}

export type MapPathStyle = "solid" | "dashed" | "dotted" | "double";

export interface MapPathTheme {
  clearedColor: string;
  activeColor: string;
  lockedColor: string;
  branchColor: string;
  pathStyle: MapPathStyle;
  lockedDash: string;
  branchDash: string;
  strokeWidth: number;
  lockedStrokeWidth: number;
}

const MAP_PATH_THEMES: Record<ThemeId, MapPathTheme> = {
  "theme-1": {
    clearedColor: "#A9D8FF",
    activeColor: "#2ECFB0",
    lockedColor: "#031233",
    branchColor: "rgba(169,216,255,0.24)",
    pathStyle: "solid",
    lockedDash: "6 5",
    branchDash: "3 5",
    strokeWidth: 2.5,
    lockedStrokeWidth: 1.8,
  },
  "theme-2": {
    clearedColor: "#D4AF37",
    activeColor: "#F0CF7A",
    lockedColor: "#1f120c",
    branchColor: "rgba(212,175,55,0.2)",
    pathStyle: "dashed",
    lockedDash: "8 4",
    branchDash: "4 6",
    strokeWidth: 2.8,
    lockedStrokeWidth: 1.6,
  },
  "theme-3": {
    clearedColor: "#7EB8DA",
    activeColor: "#7B6FA3",
    lockedColor: "#071019",
    branchColor: "rgba(126,184,218,0.2)",
    pathStyle: "solid",
    lockedDash: "2 4",
    branchDash: "2 5",
    strokeWidth: 2.2,
    lockedStrokeWidth: 1.4,
  },
  "theme-4": {
    clearedColor: "#BFD5E8",
    activeColor: "#3E7FB3",
    lockedColor: "#141a27",
    branchColor: "rgba(59,111,160,0.2)",
    pathStyle: "dotted",
    lockedDash: "6 4",
    branchDash: "3 4",
    strokeWidth: 2.5,
    lockedStrokeWidth: 1.6,
  },
  "theme-5": {
    clearedColor: "#C41E3A",
    activeColor: "#E19AA3",
    lockedColor: "#09090d",
    branchColor: "rgba(196,30,58,0.2)",
    pathStyle: "solid",
    lockedDash: "5 5",
    branchDash: "4 4",
    strokeWidth: 2.5,
    lockedStrokeWidth: 1.6,
  },
  "theme-6": {
    clearedColor: "#50C878",
    activeColor: "#9CD8B6",
    lockedColor: "#081408",
    branchColor: "rgba(80,200,120,0.22)",
    pathStyle: "solid",
    lockedDash: "7 5",
    branchDash: "4 5",
    strokeWidth: 3,
    lockedStrokeWidth: 1.8,
  },
  "theme-7": {
    clearedColor: "#1E90FF",
    activeColor: "#9EB7DF",
    lockedColor: "#070b1d",
    branchColor: "rgba(30,144,255,0.2)",
    pathStyle: "dashed",
    lockedDash: "3 4",
    branchDash: "2 4",
    strokeWidth: 2.2,
    lockedStrokeWidth: 1.4,
  },
  "theme-8": {
    clearedColor: "#4CAF50",
    activeColor: "#A9BE72",
    lockedColor: "#071407",
    branchColor: "rgba(76,175,80,0.2)",
    pathStyle: "solid",
    lockedDash: "5 4",
    branchDash: "3 5",
    strokeWidth: 2.8,
    lockedStrokeWidth: 1.6,
  },
  "theme-9": {
    clearedColor: "#40C8B8",
    activeColor: "#E0A07A",
    lockedColor: "#1f170f",
    branchColor: "rgba(64,200,184,0.2)",
    pathStyle: "dashed",
    lockedDash: "6 4",
    branchDash: "4 5",
    strokeWidth: 2.5,
    lockedStrokeWidth: 1.6,
  },
  "theme-10": {
    clearedColor: "#D4AF37",
    activeColor: "#C7BCA9",
    lockedColor: "#141421",
    branchColor: "rgba(212,175,55,0.2)",
    pathStyle: "solid",
    lockedDash: "7 4",
    branchDash: "4 4",
    strokeWidth: 2.8,
    lockedStrokeWidth: 1.8,
  },
};

export function getMapPathTheme(themeId: ThemeId): MapPathTheme {
  return MAP_PATH_THEMES[themeId] ?? MAP_PATH_THEMES["theme-1"];
}

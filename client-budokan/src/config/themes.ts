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

export type MusicContext = "main" | "level" | "boss" | "boss2";

export interface ThemeMeta {
  name: string;
  description: string;
}

export const THEME_META: Record<ThemeId, ThemeMeta> = {
  "theme-1": {
    name: "Tiki",
    description: "Tropical paradise with wooden frames and jungle vibes",
  },
  "theme-2": {
    name: "Cosmic",
    description: "Deep space with nebula gradients and star fields",
  },
  "theme-3": {
    name: "Easter Island",
    description: "Mysterious stone moai and volcanic island landscapes",
  },
  "theme-4": {
    name: "Maya",
    description: "Ancient Mesoamerican temples and jade jungle ruins",
  },
  "theme-5": {
    name: "Cyberpunk",
    description: "Neon lights on dark city grid with electric glow",
  },
  "theme-6": {
    name: "Medieval",
    description: "Stone castles, iron shields and torchlit halls",
  },
  "theme-7": {
    name: "Ancient Egypt",
    description: "Golden pyramids, hieroglyphs and desert sands",
  },
  "theme-8": {
    name: "Volcano",
    description: "Volcanic forge with molten rock and obsidian",
  },
  "theme-9": {
    name: "Tribal",
    description: "Earthy tribal patterns with bold organic shapes",
  },
  "theme-10": {
    name: "Arctic",
    description: "Frozen tundra with ice crystals and aurora borealis",
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

const TIKI_COLORS: ThemeColors = {
  background: hex(0x87ceeb),
  backgroundGradientStart: hex(0xb0e0e6),
  backgroundGradientEnd: hex(0xfff8dc),
  gridLines: hex(0x3e2723),
  gridLinesAlpha: 0.35,
  gridBg: hex(0x5d4037),
  gridCellAlt: hex(0x6d4c41),
  frameBorder: hex(0xb8860b),
  hudBar: hex(0x1a0e08),
  hudBarBorder: hex(0x5d4037),
  actionBarBg: hex(0x1a0e08),
  dangerZone: hex(0xff6b6b),
  dangerZoneAlpha: 0.2,
  accent: hex(0xff8c00),
  blocks: {
    1: { fill: hex(0x4ade80), glow: hex(0x22c55e), highlight: hex(0x86efac) },
    2: { fill: hex(0x4aa8de), glow: hex(0x3b82f6), highlight: hex(0x93c5fd) },
    3: { fill: hex(0x9f7aea), glow: hex(0x8b5cf6), highlight: hex(0xc4b5fd) },
    4: { fill: hex(0xfbbf24), glow: hex(0xf59e0b), highlight: hex(0xfde047) },
  },
  particles: {
    primary: [hex(0x4ade80), hex(0x4aa8de), hex(0x9f7aea), hex(0xfbbf24), hex(0xff6b6b)],
    explosion: [hex(0xffffff), hex(0xfbbf24), hex(0xff8c00), hex(0xff6b6b), hex(0x4ade80)],
  },
};

const COSMIC_COLORS: ThemeColors = {
  background: hex(0x0b0d21),
  backgroundGradientStart: hex(0x0b0d21),
  backgroundGradientEnd: hex(0x1a1040),
  gridLines: hex(0x4a3f8a),
  gridLinesAlpha: 0.3,
  gridBg: hex(0x12102a),
  gridCellAlt: hex(0x1a1535),
  frameBorder: hex(0x6c5ce7),
  hudBar: hex(0x0a0820),
  hudBarBorder: hex(0x3d3580),
  actionBarBg: hex(0x0a0820),
  dangerZone: hex(0xff4757),
  dangerZoneAlpha: 0.25,
  accent: hex(0xa29bfe),
  blocks: {
    1: { fill: hex(0x00d2d3), glow: hex(0x01a3a4), highlight: hex(0x48dbfb) },
    2: { fill: hex(0x6c5ce7), glow: hex(0x5541d7), highlight: hex(0xa29bfe) },
    3: { fill: hex(0xfd79a8), glow: hex(0xe84393), highlight: hex(0xfab1c8) },
    4: { fill: hex(0xfdcb6e), glow: hex(0xf9a825), highlight: hex(0xfdeb9c) },
  },
  particles: {
    primary: [hex(0x00d2d3), hex(0x6c5ce7), hex(0xfd79a8), hex(0xfdcb6e), hex(0xa29bfe)],
    explosion: [hex(0xffffff), hex(0xa29bfe), hex(0x6c5ce7), hex(0x48dbfb), hex(0xfdcb6e)],
  },
};

const EASTER_ISLAND_COLORS: ThemeColors = {
  background: hex(0x0a0a1a),
  backgroundGradientStart: hex(0x0a0a1a),
  backgroundGradientEnd: hex(0x15152d),
  gridLines: hex(0xff00ff),
  gridLinesAlpha: 0.2,
  gridBg: hex(0x0d0d22),
  gridCellAlt: hex(0x111130),
  frameBorder: hex(0xff00ff),
  hudBar: hex(0x08081a),
  hudBarBorder: hex(0xbf00ff),
  actionBarBg: hex(0x08081a),
  dangerZone: hex(0xff0055),
  dangerZoneAlpha: 0.3,
  accent: hex(0x00ffff),
  blocks: {
    1: { fill: hex(0x00ff88), glow: hex(0x00cc6a), highlight: hex(0x66ffbb) },
    2: { fill: hex(0x00ddff), glow: hex(0x00aacc), highlight: hex(0x66eeff) },
    3: { fill: hex(0xff00ff), glow: hex(0xcc00cc), highlight: hex(0xff66ff) },
    4: { fill: hex(0xffff00), glow: hex(0xcccc00), highlight: hex(0xffff66) },
  },
  particles: {
    primary: [hex(0x00ff88), hex(0x00ddff), hex(0xff00ff), hex(0xffff00), hex(0xff0055)],
    explosion: [hex(0xffffff), hex(0x00ffff), hex(0xff00ff), hex(0x00ff88), hex(0xffff00)],
  },
};

const MAYA_COLORS: ThemeColors = {
  background: hex(0x0a2540),
  backgroundGradientStart: hex(0x0a2540),
  backgroundGradientEnd: hex(0x053055),
  gridLines: hex(0x1a6e8e),
  gridLinesAlpha: 0.3,
  gridBg: hex(0x0c2d4a),
  gridCellAlt: hex(0x103555),
  frameBorder: hex(0x20b2aa),
  hudBar: hex(0x081e35),
  hudBarBorder: hex(0x1a6e8e),
  actionBarBg: hex(0x081e35),
  dangerZone: hex(0xff6b6b),
  dangerZoneAlpha: 0.2,
  accent: hex(0x00ced1),
  blocks: {
    1: { fill: hex(0x00e5a0), glow: hex(0x00b880), highlight: hex(0x66f2c8) },
    2: { fill: hex(0x00b4d8), glow: hex(0x0090ad), highlight: hex(0x66d4e8) },
    3: { fill: hex(0xff6f91), glow: hex(0xd94f70), highlight: hex(0xff9fb5) },
    4: { fill: hex(0xffc947), glow: hex(0xcca030), highlight: hex(0xffdb7a) },
  },
  particles: {
    primary: [hex(0x00e5a0), hex(0x00b4d8), hex(0xff6f91), hex(0xffc947), hex(0x20b2aa)],
    explosion: [hex(0xffffff), hex(0x00ced1), hex(0x00e5a0), hex(0xff6f91), hex(0xffc947)],
  },
};

const CYBERPUNK_COLORS: ThemeColors = {
  background: hex(0x1a3a1a),
  backgroundGradientStart: hex(0x1a3a1a),
  backgroundGradientEnd: hex(0x2d5a27),
  gridLines: hex(0x3d6b35),
  gridLinesAlpha: 0.35,
  gridBg: hex(0x1e3e1e),
  gridCellAlt: hex(0x254a24),
  frameBorder: hex(0x8b7355),
  hudBar: hex(0x142814),
  hudBarBorder: hex(0x3d6b35),
  actionBarBg: hex(0x142814),
  dangerZone: hex(0xff6b6b),
  dangerZoneAlpha: 0.2,
  accent: hex(0xdaa520),
  blocks: {
    1: { fill: hex(0x66bb6a), glow: hex(0x43a047), highlight: hex(0xa5d6a7) },
    2: { fill: hex(0x42a5f5), glow: hex(0x1e88e5), highlight: hex(0x90caf9) },
    3: { fill: hex(0xab47bc), glow: hex(0x8e24aa), highlight: hex(0xce93d8) },
    4: { fill: hex(0xffca28), glow: hex(0xffb300), highlight: hex(0xffe082) },
  },
  particles: {
    primary: [hex(0x66bb6a), hex(0x42a5f5), hex(0xab47bc), hex(0xffca28), hex(0xdaa520)],
    explosion: [hex(0xffffff), hex(0xdaa520), hex(0x66bb6a), hex(0xffca28), hex(0xab47bc)],
  },
};

const MEDIEVAL_COLORS: ThemeColors = {
  background: hex(0xc2956b),
  backgroundGradientStart: hex(0xe8c99b),
  backgroundGradientEnd: hex(0xc2956b),
  gridLines: hex(0x8b6914),
  gridLinesAlpha: 0.3,
  gridBg: hex(0x9e7e5a),
  gridCellAlt: hex(0xaa8a64),
  frameBorder: hex(0xcd853f),
  hudBar: hex(0x5c3d1e),
  hudBarBorder: hex(0x8b6914),
  actionBarBg: hex(0x5c3d1e),
  dangerZone: hex(0xff4444),
  dangerZoneAlpha: 0.25,
  accent: hex(0xe07b39),
  blocks: {
    1: { fill: hex(0xe07b39), glow: hex(0xc06020), highlight: hex(0xf0a060) },
    2: { fill: hex(0xd4463b), glow: hex(0xb03030), highlight: hex(0xe87070) },
    3: { fill: hex(0x3d9970), glow: hex(0x2d7d55), highlight: hex(0x70c0a0) },
    4: { fill: hex(0xe8c547), glow: hex(0xc0a030), highlight: hex(0xf0d870) },
  },
  particles: {
    primary: [hex(0xe07b39), hex(0xd4463b), hex(0x3d9970), hex(0xe8c547), hex(0xcd853f)],
    explosion: [hex(0xffffff), hex(0xe8c547), hex(0xe07b39), hex(0xd4463b), hex(0x3d9970)],
  },
};

const ANCIENT_EGYPT_COLORS: ThemeColors = {
  background: hex(0xd0e8f0),
  backgroundGradientStart: hex(0xe8f4f8),
  backgroundGradientEnd: hex(0xb0d0e0),
  gridLines: hex(0x6090a8),
  gridLinesAlpha: 0.3,
  gridBg: hex(0xa8c8d8),
  gridCellAlt: hex(0xb5d0de),
  frameBorder: hex(0x7eb8d0),
  hudBar: hex(0x3a6078),
  hudBarBorder: hex(0x6090a8),
  actionBarBg: hex(0x3a6078),
  dangerZone: hex(0xff5555),
  dangerZoneAlpha: 0.3,
  accent: hex(0x40e0d0),
  blocks: {
    1: { fill: hex(0x40e0d0), glow: hex(0x30b0a5), highlight: hex(0x80f0e0) },
    2: { fill: hex(0x5b9bd5), glow: hex(0x4080b8), highlight: hex(0x90c0e8) },
    3: { fill: hex(0xb070d0), glow: hex(0x9050b0), highlight: hex(0xd0a0e8) },
    4: { fill: hex(0xf0c060), glow: hex(0xd0a040), highlight: hex(0xf8d890) },
  },
  particles: {
    primary: [hex(0x40e0d0), hex(0x5b9bd5), hex(0xb070d0), hex(0xf0c060), hex(0xffffff)],
    explosion: [hex(0xffffff), hex(0x40e0d0), hex(0x5b9bd5), hex(0xe0f0ff), hex(0xb070d0)],
  },
};

const VOLCANO_COLORS: ThemeColors = {
  background: hex(0x1a0a0a),
  backgroundGradientStart: hex(0x1a0a0a),
  backgroundGradientEnd: hex(0x2d1010),
  gridLines: hex(0x8b2500),
  gridLinesAlpha: 0.35,
  gridBg: hex(0x1e0e0e),
  gridCellAlt: hex(0x251414),
  frameBorder: hex(0xff4500),
  hudBar: hex(0x140808),
  hudBarBorder: hex(0x8b2500),
  actionBarBg: hex(0x140808),
  dangerZone: hex(0xff0000),
  dangerZoneAlpha: 0.3,
  accent: hex(0xff6600),
  blocks: {
    1: { fill: hex(0xff6600), glow: hex(0xdd4400), highlight: hex(0xff9944) },
    2: { fill: hex(0xff2222), glow: hex(0xcc0000), highlight: hex(0xff6666) },
    3: { fill: hex(0xffaa00), glow: hex(0xdd8800), highlight: hex(0xffcc44) },
    4: { fill: hex(0xff4488), glow: hex(0xdd2266), highlight: hex(0xff77aa) },
  },
  particles: {
    primary: [hex(0xff6600), hex(0xff2222), hex(0xffaa00), hex(0xff4488), hex(0xff4500)],
    explosion: [hex(0xffffff), hex(0xff6600), hex(0xff2222), hex(0xffaa00), hex(0xffcc44)],
  },
};

const TRIBAL_COLORS: ThemeColors = {
  background: hex(0xfff0f5),
  backgroundGradientStart: hex(0xfff5fa),
  backgroundGradientEnd: hex(0xffe0eb),
  gridLines: hex(0xdda0c8),
  gridLinesAlpha: 0.3,
  gridBg: hex(0xf0d0e0),
  gridCellAlt: hex(0xf5d8e5),
  frameBorder: hex(0xe88ebf),
  hudBar: hex(0xc06090),
  hudBarBorder: hex(0xdda0c8),
  actionBarBg: hex(0xc06090),
  dangerZone: hex(0xff4466),
  dangerZoneAlpha: 0.25,
  accent: hex(0xff69b4),
  blocks: {
    1: { fill: hex(0x7dcea0), glow: hex(0x58b880), highlight: hex(0xa9e0c0) },
    2: { fill: hex(0x85c1e9), glow: hex(0x5da8d8), highlight: hex(0xadd8f0) },
    3: { fill: hex(0xd7bde2), glow: hex(0xbb8fce), highlight: hex(0xe8d5ee) },
    4: { fill: hex(0xf9e154), glow: hex(0xe0c830), highlight: hex(0xfbeb80) },
  },
  particles: {
    primary: [hex(0x7dcea0), hex(0x85c1e9), hex(0xd7bde2), hex(0xf9e154), hex(0xff69b4)],
    explosion: [hex(0xffffff), hex(0xff69b4), hex(0x7dcea0), hex(0x85c1e9), hex(0xf9e154)],
  },
};

const ARCTIC_COLORS: ThemeColors = {
  background: hex(0x2a1f14),
  backgroundGradientStart: hex(0x2a1f14),
  backgroundGradientEnd: hex(0x3d2d1c),
  gridLines: hex(0x8b6f47),
  gridLinesAlpha: 0.35,
  gridBg: hex(0x30241a),
  gridCellAlt: hex(0x382c20),
  frameBorder: hex(0xb8860b),
  hudBar: hex(0x1e1610),
  hudBarBorder: hex(0x8b6f47),
  actionBarBg: hex(0x1e1610),
  dangerZone: hex(0xff4444),
  dangerZoneAlpha: 0.25,
  accent: hex(0xd4a017),
  blocks: {
    1: { fill: hex(0xb87333), glow: hex(0x9a5b20), highlight: hex(0xd49560) },
    2: { fill: hex(0xc5a050), glow: hex(0xa08030), highlight: hex(0xddc070) },
    3: { fill: hex(0x6b8e23), glow: hex(0x557018), highlight: hex(0x90b040) },
    4: { fill: hex(0xcc5544), glow: hex(0xaa3333), highlight: hex(0xe08070) },
  },
  particles: {
    primary: [hex(0xb87333), hex(0xc5a050), hex(0x6b8e23), hex(0xcc5544), hex(0xd4a017)],
    explosion: [hex(0xffffff), hex(0xd4a017), hex(0xb87333), hex(0xc5a050), hex(0xcc5544)],
  },
};

export const THEME_COLORS: Record<ThemeId, ThemeColors> = {
  "theme-1": TIKI_COLORS,
  "theme-2": COSMIC_COLORS,
  "theme-3": EASTER_ISLAND_COLORS,
  "theme-4": MAYA_COLORS,
  "theme-5": CYBERPUNK_COLORS,
  "theme-6": MEDIEVAL_COLORS,
  "theme-7": ANCIENT_EGYPT_COLORS,
  "theme-8": VOLCANO_COLORS,
  "theme-9": TRIBAL_COLORS,
  "theme-10": ARCTIC_COLORS,
};

export function getThemeColors(themeId: ThemeId): ThemeColors {
  return THEME_COLORS[themeId] ?? TIKI_COLORS;
}

export function getBlockColors(themeId: ThemeId, blockWidth: 1 | 2 | 3 | 4): BlockColors {
  const colors = getThemeColors(themeId);
  return colors.blocks[blockWidth] ?? colors.blocks[1];
}

export const THEME_MUSIC: Record<ThemeId, Record<MusicContext, string>> = {
  "theme-1": {
    main: "/assets/theme-1/sounds/musics/main.mp3",
    level: "/assets/theme-1/sounds/musics/map.mp3",
    boss: "/assets/theme-1/sounds/musics/boss.mp3",
    boss2: "/assets/theme-1/sounds/musics/level.mp3",
  },
  "theme-2": {
    main: "/assets/theme-2/sounds/musics/main.mp3",
    level: "/assets/theme-2/sounds/musics/map.mp3",
    boss: "/assets/theme-2/sounds/musics/boss.mp3",
    boss2: "/assets/theme-2/sounds/musics/level.mp3",
  },
  "theme-3": {
    main: "/assets/theme-3/sounds/musics/main.mp3",
    level: "/assets/theme-3/sounds/musics/map.mp3",
    boss: "/assets/theme-3/sounds/musics/boss.mp3",
    boss2: "/assets/theme-3/sounds/musics/level.mp3",
  },
  "theme-4": {
    main: "/assets/theme-4/sounds/musics/main.mp3",
    level: "/assets/theme-4/sounds/musics/map.mp3",
    boss: "/assets/theme-4/sounds/musics/boss.mp3",
    boss2: "/assets/theme-4/sounds/musics/level.mp3",
  },
  "theme-5": {
    main: "/assets/theme-5/sounds/musics/main.mp3",
    level: "/assets/theme-5/sounds/musics/map.mp3",
    boss: "/assets/theme-5/sounds/musics/boss.mp3",
    boss2: "/assets/theme-5/sounds/musics/level.mp3",
  },
  "theme-6": {
    main: "/assets/theme-6/sounds/musics/main.mp3",
    level: "/assets/theme-6/sounds/musics/map.mp3",
    boss: "/assets/theme-6/sounds/musics/boss.mp3",
    boss2: "/assets/theme-6/sounds/musics/level.mp3",
  },
  "theme-7": {
    main: "/assets/theme-7/sounds/musics/main.mp3",
    level: "/assets/theme-7/sounds/musics/map.mp3",
    boss: "/assets/theme-7/sounds/musics/boss.mp3",
    boss2: "/assets/theme-7/sounds/musics/level.mp3",
  },
  "theme-8": {
    main: "/assets/theme-8/sounds/musics/main.mp3",
    level: "/assets/theme-8/sounds/musics/map.mp3",
    boss: "/assets/theme-8/sounds/musics/boss.mp3",
    boss2: "/assets/theme-8/sounds/musics/level.mp3",
  },
  "theme-9": {
    main: "/assets/theme-9/sounds/musics/main.mp3",
    level: "/assets/theme-9/sounds/musics/map.mp3",
    boss: "/assets/theme-9/sounds/musics/boss.mp3",
    boss2: "/assets/theme-9/sounds/musics/level.mp3",
  },
  "theme-10": {
    main: "/assets/theme-10/sounds/musics/main.mp3",
    level: "/assets/theme-10/sounds/musics/map.mp3",
    boss: "/assets/theme-10/sounds/musics/boss.mp3",
    boss2: "/assets/theme-10/sounds/musics/level.mp3",
  },
};

export const SFX_PATHS = {
  break: "/assets/common/sounds/effects/break.mp3",
  explode: "/assets/common/sounds/effects/explode.mp3",
  move: "/assets/common/sounds/effects/move.mp3",
  new: "/assets/common/sounds/effects/new.mp3",
  over: "/assets/common/sounds/effects/over.mp3",
  start: "/assets/common/sounds/effects/start.mp3",
  swipe: "/assets/common/sounds/effects/swipe.mp3",
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
    gridFrame: `${base}/grid-frame.png`,
    themeIcon: `${base}/theme-icon.png`,
    map: `${base}/map.png`,
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

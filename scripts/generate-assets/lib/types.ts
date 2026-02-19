export const PER_THEME_ASSETS = [
  "blocks",
  "background",
  "loading-bg",
  "logo",
  "grid",
  "theme-icon",
  "map",
] as const;

export const GLOBAL_ASSETS = ["buttons", "shared-icons", "catalog-icons", "bonus-icons", "ui-chrome", "panels", "particles"] as const;

export type Scope = "per-theme" | "global" | "all";
export type PerThemeAsset = (typeof PER_THEME_ASSETS)[number];
export type GlobalAsset = (typeof GLOBAL_ASSETS)[number];
export type AssetCategory = PerThemeAsset | GlobalAsset;

export type LimitRunner = <T>(fn: () => Promise<T>) => Promise<T>;
export type PLimitFactory = (concurrency: number) => LimitRunner;

export interface BlockDesign {
  material?: string;
}

export interface BlockData {
  material: string;
  centerpiece_type: string;
  centerpiece_description: string;
  centerpiece_expression: string;
  inspirations: [string, string];
  themeKeywords: [string, string, string];
  blocks: [BlockDesign, BlockDesign, BlockDesign, BlockDesign];
}

export interface ThemeDefinition {
  name: string;
  icon: string;
  description: string;
  mood: string;
  palette: {
    bg: string;
    accent: string;
    blocks: [string, string, string, string];
  };
  motifs: string;
  blockMotifs: string;
  blockDesigns?: [string, string, string, string];
  blockData: BlockData;
  scene: string;
  loadingScene: string;
  gridMaterial: string;
  music?: {
    menu: string;
    gameplay: string;
  };
}

export interface AssetJob {
  scope: "per-theme" | "global";
  category: AssetCategory;
  themeId?: string;
  filename: string;
  outputPath: string;
  prompt: string;
  width: number;
  height: number;
  refPaths?: string[];
  phase?: number;
  removeBg?: boolean;
}

export interface SfxJob {
  id: string;
  filename: string;
  outputPath: string;
  prompt: string;
  duration: number;
}

export interface CliOptions {
  theme?: string;
  scope: Scope;
  asset?: AssetCategory;
  dryRun: boolean;
  includeRefs: boolean;
}

export interface SfxCliOptions {
  only?: string[];
  dryRun: boolean;
}


export interface ButtonConfig {
  color: string;
  highlight: string;
  shadow: string;
  desc: string;
}

export interface FilenameDescription {
  filename: string;
  description: string;
}

export interface UiChromeConfig extends FilenameDescription {
  width: number;
  height: number;
}

export interface PanelConfig {
  filename: string;
  material: string;
  alpha: string;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface GlobalAssetsData {
  buttons: Record<string, ButtonConfig>;
  sharedIcons: FilenameDescription[];
  catalogIcons: FilenameDescription[];
  bonusIcons: FilenameDescription[];
  uiChrome: UiChromeConfig[];
  panels: PanelConfig[];
  particles: FilenameDescription[];
  targetDimensions: Record<string, Dimensions>;
}

export interface SfxDefinition {
  id: string;
  filename: string;
  duration: number;
  prompt: string;
}

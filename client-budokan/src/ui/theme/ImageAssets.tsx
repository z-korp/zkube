import { getCommonAssetPath, getThemeImages, type ThemeId } from "@/config/themes";

const ImageAssets = (theme: ThemeId) => {
  const themeImages = getThemeImages(theme);

  return {
    ...themeImages,
    combo: getCommonAssetPath("bonus/combo.png"),
    score: getCommonAssetPath("bonus/score.png"),
    harvest: getCommonAssetPath("bonus/harvest.png"),
    wave: getCommonAssetPath("bonus/wave.png"),
    tsunami: getCommonAssetPath("bonus/wave.png"), // Tsunami (renamed from Wave)
    supply: getCommonAssetPath("bonus/supply.png"),
    bridging: getCommonAssetPath("bonus/bridging.png"),
    constraintClearLines: getCommonAssetPath("constraints/constraint-clear-lines.png"),
    constraintBreakBlocks: getCommonAssetPath("constraints/constraint-break-blocks.png"),
    constraintCombo: getCommonAssetPath("constraints/constraint-combo.png"),
    constraintFill: getCommonAssetPath("constraints/constraint-fill.png"),
    constraintNoBonus: getCommonAssetPath("constraints/constraint-no-bonus.png"),
    constraintKeepGridBelow: getCommonAssetPath("constraints/constraint-keep-grid-below.png"),
    stone1: themeImages.block1,
    stone2: themeImages.block2,
    stone3: themeImages.block3,
    stone4: themeImages.block4,
    background: themeImages.background,
    loadingBackground: themeImages.loadingBg,
    logo: themeImages.logo,
    loader: "/assets/theme-1/loader.svg",
    imageBackground: themeImages.background,
    // Skill tree icons (base images, use getSkillTierIconPath for tier variants)
    skillCombo: getCommonAssetPath("skills/skill-combo.png"),
    skillScore: getCommonAssetPath("skills/skill-score.png"),
    skillHarvest: getCommonAssetPath("skills/skill-harvest.png"),
    skillWave: getCommonAssetPath("skills/skill-wave.png"),
    skillSupply: getCommonAssetPath("skills/skill-supply.png"),
    skillSurge: getCommonAssetPath("skills/skill-surge.png"),
    skillCatalyst: getCommonAssetPath("skills/skill-catalyst.png"),
    skillFortune: getCommonAssetPath("skills/skill-fortune.png"),
    skillMomentum: getCommonAssetPath("skills/skill-momentum.png"),
    skillExpansion: getCommonAssetPath("skills/skill-expansion.png"),
    skillAdrenaline: getCommonAssetPath("skills/skill-adrenaline.png"),
    skillTempo: getCommonAssetPath("skills/skill-tempo.png"),
    skillResilience: getCommonAssetPath("skills/skill-resilience.png"),
    skillFocus: getCommonAssetPath("skills/skill-focus.png"),
    skillLegacy: getCommonAssetPath("skills/skill-legacy.png"),
    // Archetype header icons
    archetypeTempo: getCommonAssetPath("archetypes/archetype-tempo.png"),
    archetypeScaling: getCommonAssetPath("archetypes/archetype-scaling.png"),
    archetypeEconomy: getCommonAssetPath("archetypes/archetype-economy.png"),
    archetypeControl: getCommonAssetPath("archetypes/archetype-control.png"),
    archetypeRisk: getCommonAssetPath("archetypes/archetype-risk.png"),
  };
};

export default ImageAssets;

/**
 * Get the asset path for a skill icon at a specific tier.
 * Example: getSkillTierIconPath("combo", 2) => "/assets/common/skills/skill-combo-t2.png"
 */
export function getSkillTierIconPath(skillName: string, tier: 1 | 2 | 3): string {
  return getCommonAssetPath(`skills/skill-${skillName.toLowerCase()}-t${tier}.png`);
}

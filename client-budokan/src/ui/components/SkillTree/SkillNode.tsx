import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import {
  SKILLS,
  ARCHETYPES,
  getSkillTier,
} from "@/dojo/game/types/skillData";
import { getSkillTierIconPath } from "@/ui/theme/ImageAssets";
import type { SkillTreeInfo } from "@/hooks/useSkillTree";

interface SkillNodeProps {
  skillId: number;
  treeInfo: SkillTreeInfo;
  isSelected: boolean;
  isBusy: boolean;
  /** Whether this is the first (bonus) skill in its archetype — always accessible */
  isRoot: boolean;
  onClick: (skillId: number) => void;
}

/** Radius / stroke for the SVG progress ring */
const RING_RADIUS = 34;
const RING_STROKE = 3.5;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const SkillNode: React.FC<SkillNodeProps> = ({
  skillId,
  treeInfo,
  isSelected,
  isBusy,
  isRoot,
  onClick,
}) => {
  const skill = SKILLS[skillId];
  if (!skill) return null;

  const archetype = ARCHETYPES[skill.archetype];
  const level = treeInfo.level;
  const tier = getSkillTier(level);
  const iconSrc = getSkillTierIconPath(skill.name, tier);

  const isLocked = level === 0 && !isRoot;
  const isMaxed = level >= 9;
  const progress = level / 9;

  // Tier-based visual styles
  const tierStyles = getTierStyles(tier, archetype.color, isLocked);

  return (
    <motion.button
      type="button"
      onClick={() => onClick(skillId)}
      whileHover={isBusy ? undefined : { scale: 1.08 }}
      whileTap={isBusy ? undefined : { scale: 0.95 }}
      className={`relative flex flex-col items-center gap-1.5 outline-none transition-all ${
        isLocked ? "opacity-40 grayscale" : "cursor-pointer"
      }`}
      aria-label={`${skill.name} - Level ${level}`}
    >
      {/* Node circle with SVG ring */}
      <div
        className="relative w-16 h-16 md:w-20 md:h-20"
        style={{
          filter: tierStyles.dropShadow,
        }}
      >
        {/* SVG progress ring */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 80 80"
        >
          {/* Background ring (track) */}
          <circle
            cx="40"
            cy="40"
            r={RING_RADIUS}
            fill="none"
            stroke={tierStyles.trackColor}
            strokeWidth={RING_STROKE}
          />
          {/* Progress arc */}
          {level > 0 && (
            <circle
              cx="40"
              cy="40"
              r={RING_RADIUS}
              fill="none"
              stroke={tierStyles.ringColor}
              strokeWidth={RING_STROKE + 0.5}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={
                RING_CIRCUMFERENCE - progress * RING_CIRCUMFERENCE
              }
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          )}
        </svg>

        {/* Icon circle background */}
        <div
          className={`absolute inset-[5px] md:inset-[6px] rounded-full overflow-hidden border-2 ${
            isSelected ? "border-white" : "border-slate-700/80"
          }`}
          style={{
            backgroundColor: isLocked ? "#1a1a2e" : "#0f172a",
            borderColor: isSelected ? "#ffffff" : tierStyles.borderColor,
          }}
        >
          <img
            src={iconSrc}
            alt={skill.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>

        {/* Busy spinner overlay */}
        {isBusy && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
            <Loader2 size={24} className="animate-spin text-white" />
          </div>
        )}

        {/* Level badge (bottom-right) */}
        <div
          className="absolute -bottom-0.5 -right-0.5 min-w-[28px] px-1 py-0.5 rounded-full text-[9px] font-bold text-center leading-none"
          style={{
            backgroundColor: isMaxed ? "#d4a017" : "#1e293b",
            color: isMaxed ? "#000" : tierStyles.ringColor,
            border: `1.5px solid ${isMaxed ? "#ffd700" : tierStyles.borderColor}`,
          }}
        >
          {isMaxed ? "MAX" : `${level}`}
        </div>

        {/* Branch indicator (top-right) */}
        {treeInfo.branchChosen && (
          <div
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-slate-900"
            style={{
              backgroundColor:
                treeInfo.branchId === 0 ? "#3b82f6" : "#f59e0b",
            }}
            title={
              treeInfo.branchId === 0
                ? `Branch A: ${skill.branchA}`
                : `Branch B: ${skill.branchB}`
            }
          />
        )}
      </div>

      {/* Skill name label */}
      <span
        className="text-[10px] md:text-xs font-semibold text-center leading-tight max-w-[80px] truncate"
        style={{ color: isLocked ? "#64748b" : tierStyles.textColor }}
      >
        {skill.name}
      </span>
    </motion.button>
  );
};

function getTierStyles(
  tier: 1 | 2 | 3,
  archetypeColor: string,
  isLocked: boolean,
) {
  if (isLocked) {
    return {
      ringColor: "#334155",
      trackColor: "#1e293b",
      borderColor: "#334155",
      textColor: "#64748b",
      dropShadow: "none",
    };
  }

  switch (tier) {
    case 1:
      return {
        ringColor: archetypeColor + "99", // 60% opacity
        trackColor: "#1e293b",
        borderColor: archetypeColor + "66",
        textColor: "#94a3b8",
        dropShadow: "none",
      };
    case 2:
      return {
        ringColor: archetypeColor,
        trackColor: archetypeColor + "33",
        borderColor: archetypeColor + "99",
        textColor: "#e2e8f0",
        dropShadow: `drop-shadow(0 0 6px ${archetypeColor}44)`,
      };
    case 3:
      return {
        ringColor: "#ffd700",
        trackColor: "#ffd70033",
        borderColor: "#ffd700cc",
        textColor: "#fef3c7",
        dropShadow: `drop-shadow(0 0 12px #ffd70066) drop-shadow(0 0 4px ${archetypeColor}44)`,
      };
  }
}

export default SkillNode;

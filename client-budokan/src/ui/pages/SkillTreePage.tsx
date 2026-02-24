import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import { Loader2 } from "lucide-react";
import { useNavigationStore } from "@/stores/navigationStore";
import { useCubeBalance } from "@/hooks/useCubeBalance";
import { useSkillTree } from "@/hooks/useSkillTree";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import {
  ARCHETYPES,
  ARCHETYPE_ORDER,
  getSkillTier,
  getSkillsByArchetype,
  type ArchetypeId,
  type SkillDefinition,
} from "@/dojo/game/types/skillData";
import { SKILL_TREE_COSTS } from "@/dojo/game/helpers/runDataPacking";
import { getCommonAssetPath } from "@/config/themes";
import { getSkillTierIconPath } from "@/ui/theme/ImageAssets";
import PageTopBar from "@/ui/navigation/PageTopBar";
import GameButton from "@/ui/components/shared/GameButton";

const SkillTreePage: React.FC = () => {
  const goBack = useNavigationStore((s) => s.goBack);
  const { cubeBalance } = useCubeBalance();
  const { skillTree } = useSkillTree();
  const { account } = useAccountCustom();
  const {
    setup: { systemCalls },
  } = useDojo();

  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedSkillId, setExpandedSkillId] = useState<number | null>(null);
  const [busySkillId, setBusySkillId] = useState<number | null>(null);
  const swiperRef = useRef<SwiperType | null>(null);

  const cubeBalanceNumber = Number(cubeBalance);

  const skills = skillTree?.skills ?? Array.from({ length: 15 }, () => ({
    level: 0,
    branchChosen: false,
    branchId: 0,
  }));

  const handleSkillClick = useCallback((skillId: number) => {
    setExpandedSkillId((prev) => (prev === skillId ? null : skillId));
  }, []);

  const handleSlideChange = useCallback((swiper: SwiperType) => {
    setActiveIndex(swiper.activeIndex);
    setExpandedSkillId(null);
  }, []);

  const handleArchetypePillClick = useCallback((idx: number) => {
    swiperRef.current?.slideTo(idx);
  }, []);

  const handleUpgrade = async (skillId: number) => {
    const treeInfo = skills[skillId - 1];
    if (!account || !treeInfo) return;
    const level = treeInfo.level;
    if (level >= 9) return;
    const cost = SKILL_TREE_COSTS[level];
    if (cubeBalanceNumber < cost) return;

    try {
      setBusySkillId(skillId);
      await systemCalls.upgradeSkill({ account, skill_id: skillId });
    } catch (error) {
      console.error("Failed to upgrade skill:", error);
    } finally {
      setBusySkillId(null);
    }
  };

  const handleChooseBranch = async (skillId: number, branchId: number) => {
    if (!account) return;
    try {
      setBusySkillId(skillId);
      await systemCalls.chooseBranch({ account, skill_id: skillId, branch_id: branchId });
    } catch (error) {
      console.error("Failed to choose branch:", error);
    } finally {
      setBusySkillId(null);
    }
  };

  const handleRespec = async (skillId: number) => {
    if (!account) return;
    try {
      setBusySkillId(skillId);
      await systemCalls.respecBranch({ account, skill_id: skillId });
    } catch (error) {
      console.error("Failed to respec branch:", error);
    } finally {
      setBusySkillId(null);
    }
  };

  return (
    <div className="h-screen-viewport flex flex-col text-white">
      <PageTopBar title="SKILL TREE" onBack={goBack} cubeBalance={cubeBalance} />

      {/* Archetype pills navigation */}
      <div className="flex items-center justify-center gap-1.5 px-3 py-2">
        {ARCHETYPE_ORDER.map((archId, idx) => {
          const arch = ARCHETYPES[archId];
          const isActive = idx === activeIndex;
          return (
            <button
              key={archId}
              type="button"
              onClick={() => handleArchetypePillClick(idx)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                isActive
                  ? "text-white scale-105"
                  : "text-slate-400 bg-slate-800/60 hover:bg-slate-700/60"
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: arch.color + "33",
                      color: arch.color,
                      border: `1px solid ${arch.color}66`,
                    }
                  : { border: "1px solid transparent" }
              }
            >
              {arch.name}
            </button>
          );
        })}
      </div>

      {/* Swiper carousel */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <Swiper
          slidesPerView={1}
          spaceBetween={0}
          onSwiper={(swiper) => { swiperRef.current = swiper; }}
          onSlideChange={handleSlideChange}
          className="flex-1 w-full"
        >
          {ARCHETYPE_ORDER.map((archetypeId) => (
            <SwiperSlide key={archetypeId}>
              <ArchetypeSlide
                archetypeId={archetypeId}
                skills={skills}
                expandedSkillId={expandedSkillId}
                busySkillId={busySkillId}
                cubeBalance={cubeBalanceNumber}
                onSkillClick={handleSkillClick}
                onUpgrade={handleUpgrade}
                onChooseBranch={handleChooseBranch}
                onRespec={handleRespec}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Back button */}
        <div className="px-4 pb-4 pt-2 max-w-[420px] mx-auto w-full">
          <GameButton label="BACK" variant="secondary" onClick={goBack} />
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Archetype Slide
// ---------------------------------------------------------------------------

interface ArchetypeSlideProps {
  archetypeId: ArchetypeId;
  skills: { level: number; branchChosen: boolean; branchId: number }[];
  expandedSkillId: number | null;
  busySkillId: number | null;
  cubeBalance: number;
  onSkillClick: (skillId: number) => void;
  onUpgrade: (skillId: number) => void;
  onChooseBranch: (skillId: number, branchId: number) => void;
  onRespec: (skillId: number) => void;
}

const ArchetypeSlide: React.FC<ArchetypeSlideProps> = ({
  archetypeId,
  skills,
  expandedSkillId,
  busySkillId,
  cubeBalance,
  onSkillClick,
  onUpgrade,
  onChooseBranch,
  onRespec,
}) => {
  const archetype = ARCHETYPES[archetypeId];
  const archetypeSkills = getSkillsByArchetype(archetypeId);
  const iconSrc = getCommonAssetPath(`archetypes/archetype-${archetypeId}.png`);

  return (
    <div className="h-full overflow-y-auto px-4 py-3 flex flex-col items-center">
      {/* Archetype header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex items-center gap-3 mb-5"
      >
        <div
          className="w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden border-2 flex-shrink-0"
          style={{ borderColor: archetype.color + "66" }}
        >
          <img
            src={iconSrc}
            alt={archetype.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
        <div>
          <h2
            className="font-['Fredericka_the_Great'] text-xl md:text-2xl leading-tight"
            style={{ color: archetype.color }}
          >
            {archetype.name}
          </h2>
          <p className="text-[11px] text-slate-400 leading-tight">
            {archetype.description}
          </p>
        </div>
      </motion.div>

      {/* 3 skill cards vertically */}
      <div className="w-full max-w-[380px] flex flex-col gap-3">
        {archetypeSkills.map((skill, idx) => {
          const treeInfo = skills[skill.id - 1] ?? {
            level: 0,
            branchChosen: false,
            branchId: 0,
          };
          const isExpanded = expandedSkillId === skill.id;
          const isBusy = busySkillId === skill.id;

          return (
            <motion.div
              key={skill.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.3, ease: "easeOut" }}
            >
              <SkillCard
                skill={skill}
                treeInfo={treeInfo}
                archetypeColor={archetype.color}
                isExpanded={isExpanded}
                isBusy={isBusy}
                isRoot={idx === 0}
                cubeBalance={cubeBalance}
                onClick={() => onSkillClick(skill.id)}
                onUpgrade={() => onUpgrade(skill.id)}
                onChooseBranch={(branchId) => onChooseBranch(skill.id, branchId)}
                onRespec={() => onRespec(skill.id)}
              />

              {/* Connecting line to next skill */}
              {idx < archetypeSkills.length - 1 && (
                <div className="flex justify-center py-1">
                  <div
                    className="w-[2px] h-4"
                    style={{
                      backgroundColor: archetype.color,
                      opacity: skills[archetypeSkills[idx + 1].id - 1]?.level > 0 ? 0.6 : 0.15,
                    }}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Skill Card — self-contained node with inline expand for branches & upgrade
// ---------------------------------------------------------------------------

interface SkillCardProps {
  skill: SkillDefinition;
  treeInfo: { level: number; branchChosen: boolean; branchId: number };
  archetypeColor: string;
  isExpanded: boolean;
  isBusy: boolean;
  isRoot: boolean;
  cubeBalance: number;
  onClick: () => void;
  onUpgrade: () => void;
  onChooseBranch: (branchId: number) => void;
  onRespec: () => void;
}

const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  treeInfo,
  archetypeColor,
  isExpanded,
  isBusy,
  isRoot,
  cubeBalance,
  onClick,
  onUpgrade,
  onChooseBranch,
  onRespec,
}) => {
  const level = treeInfo.level;
  const tier = getSkillTier(level);
  const isLocked = level === 0 && !isRoot;
  const isMaxed = level >= 9;
  const upgradeCost = isMaxed ? null : SKILL_TREE_COSTS[level];
  const canAfford = upgradeCost !== null && cubeBalance >= upgradeCost;
  const needsBranchChoice = level >= 5 && !treeInfo.branchChosen;
  const iconSrc = getSkillTierIconPath(skill.name, tier);
  const progress = level / 9;

  const tierStyles = getTierStyles(tier, archetypeColor, isLocked);

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isExpanded ? "bg-slate-900/95" : "bg-slate-900/60"
      } ${isLocked ? "opacity-45" : ""}`}
      style={{
        borderColor: isExpanded
          ? archetypeColor + "55"
          : isLocked
            ? "#1e293b"
            : archetypeColor + "22",
      }}
    >
      {/* Clickable header row */}
      <motion.button
        type="button"
        onClick={onClick}
        disabled={isLocked}
        whileTap={isLocked ? undefined : { scale: 0.98 }}
        className="w-full flex items-center gap-3 p-3 text-left outline-none"
      >
        {/* Skill icon with ring */}
        <div className="relative w-14 h-14 flex-shrink-0" style={{ filter: tierStyles.dropShadow }}>
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="25" fill="none" stroke={tierStyles.trackColor} strokeWidth="2.5" />
            {level > 0 && (
              <circle
                cx="28" cy="28" r="25" fill="none"
                stroke={tierStyles.ringColor}
                strokeWidth="3"
                strokeDasharray={2 * Math.PI * 25}
                strokeDashoffset={(2 * Math.PI * 25) - progress * (2 * Math.PI * 25)}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            )}
          </svg>
          <div
            className="absolute inset-[4px] rounded-full overflow-hidden border-[1.5px]"
            style={{
              backgroundColor: isLocked ? "#1a1a2e" : "#0f172a",
              borderColor: tierStyles.borderColor,
            }}
          >
            <img src={iconSrc} alt={skill.name} className="w-full h-full object-cover" draggable={false} />
          </div>
          {isBusy && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
              <Loader2 size={18} className="animate-spin text-white" />
            </div>
          )}
        </div>

        {/* Name + description + level */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="font-['Fredericka_the_Great'] text-base md:text-lg leading-tight"
              style={{ color: isLocked ? "#475569" : tierStyles.textColor }}
            >
              {skill.name}
            </span>
            <span className="text-[9px] uppercase tracking-wide text-slate-500 bg-slate-800/80 px-1 py-0.5 rounded">
              {skill.category === "bonus" ? "Active" : "World"}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-1">
            {skill.description}
          </p>
        </div>

        {/* Level badge + cost hint */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div
            className="rounded-md px-2 py-0.5 text-[11px] font-bold"
            style={{
              backgroundColor: isMaxed ? "#ffd70022" : tier === 2 ? archetypeColor + "22" : "#1e293b",
              color: isMaxed ? "#ffd700" : tier === 2 ? archetypeColor : isLocked ? "#475569" : "#94a3b8",
              border: `1px solid ${isMaxed ? "#ffd70044" : tier === 2 ? archetypeColor + "44" : "#334155"}`,
            }}
          >
            {isMaxed ? "MAX" : `${level}/9`}
          </div>
          {!isMaxed && !isLocked && upgradeCost !== null && (
            <span className={`text-[9px] font-medium ${canAfford ? "text-emerald-400/80" : "text-slate-500"}`}>
              {upgradeCost} 🧊
            </span>
          )}
        </div>
      </motion.button>

      {/* Expanded detail section */}
      <AnimatePresence>
        {isExpanded && !isLocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 flex flex-col gap-2">
              {/* Divider */}
              <div className="h-px w-full" style={{ backgroundColor: archetypeColor + "22" }} />

              {/* Branch info (when already chosen) */}
              {treeInfo.branchChosen && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: treeInfo.branchId === 0 ? "#3b82f6" : "#f59e0b" }}
                    />
                    <span className="text-[11px] text-slate-300">
                      {treeInfo.branchId === 0 ? "A" : "B"}:{" "}
                      <span className="text-white font-medium">
                        {treeInfo.branchId === 0 ? skill.branchA : skill.branchB}
                      </span>
                    </span>
                  </div>
                  <motion.button
                    type="button"
                    disabled={isBusy}
                    onClick={(e) => { e.stopPropagation(); onRespec(); }}
                    whileTap={isBusy ? undefined : { scale: 0.95 }}
                    className="text-[10px] text-purple-300/70 hover:text-purple-200 transition-colors disabled:opacity-50 px-2 py-0.5 rounded border border-purple-400/20"
                  >
                    Respec
                  </motion.button>
                </div>
              )}

              {/* Branch choice (level 5+ without branch) */}
              {needsBranchChoice && (
                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    type="button"
                    disabled={isBusy}
                    onClick={(e) => { e.stopPropagation(); onChooseBranch(0); }}
                    whileTap={isBusy ? undefined : { scale: 0.97 }}
                    className="rounded-lg border border-blue-400/30 bg-blue-900/20 px-2.5 py-2 text-[11px] font-semibold text-blue-100 transition hover:bg-blue-900/35 disabled:opacity-50"
                  >
                    <div className="text-[9px] text-blue-300/60 mb-0.5">Branch A</div>
                    {skill.branchA}
                  </motion.button>
                  <motion.button
                    type="button"
                    disabled={isBusy}
                    onClick={(e) => { e.stopPropagation(); onChooseBranch(1); }}
                    whileTap={isBusy ? undefined : { scale: 0.97 }}
                    className="rounded-lg border border-amber-400/30 bg-amber-900/20 px-2.5 py-2 text-[11px] font-semibold text-amber-100 transition hover:bg-amber-900/35 disabled:opacity-50"
                  >
                    <div className="text-[9px] text-amber-300/60 mb-0.5">Branch B</div>
                    {skill.branchB}
                  </motion.button>
                </div>
              )}

              {/* Branch preview (before level 5, just show what's coming) */}
              {!needsBranchChoice && !treeInfo.branchChosen && level < 5 && (
                <div className="flex items-center gap-2 text-[10px] text-slate-600">
                  <span>Branches at Lv.5:</span>
                  <span className="text-slate-400">{skill.branchA}</span>
                  <span className="text-slate-600">/</span>
                  <span className="text-slate-400">{skill.branchB}</span>
                </div>
              )}

              {/* Upgrade button */}
              <motion.button
                type="button"
                disabled={isBusy || isMaxed || !canAfford}
                onClick={(e) => { e.stopPropagation(); onUpgrade(); }}
                whileTap={isBusy || isMaxed || !canAfford ? undefined : { scale: 0.97 }}
                className={`w-full rounded-lg px-3 py-2.5 text-[12px] font-semibold transition flex items-center justify-center gap-2 ${
                  isMaxed
                    ? "border border-yellow-500/25 bg-yellow-900/15 text-yellow-300/70 cursor-default"
                    : canAfford
                      ? "border border-emerald-400/35 bg-emerald-900/20 text-emerald-100 hover:bg-emerald-900/35 active:bg-emerald-900/50"
                      : "border border-slate-600/30 bg-slate-800/30 text-slate-500 cursor-not-allowed"
                } disabled:opacity-50`}
              >
                {isBusy ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : isMaxed ? (
                  "✦ MAX LEVEL ✦"
                ) : (
                  <>
                    Upgrade to Lv. {level + 1}
                    <span className="inline-flex items-center gap-1 text-[11px] opacity-80">
                      — {upgradeCost} 🧊
                    </span>
                    {!canAfford && (
                      <span className="text-[9px] text-red-400/70 ml-0.5">
                        (need {(upgradeCost ?? 0) - cubeBalance} more)
                      </span>
                    )}
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tier styles helper
// ---------------------------------------------------------------------------

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
        ringColor: archetypeColor + "99",
        trackColor: "#1e293b",
        borderColor: archetypeColor + "55",
        textColor: "#cbd5e1",
        dropShadow: "none",
      };
    case 2:
      return {
        ringColor: archetypeColor,
        trackColor: archetypeColor + "33",
        borderColor: archetypeColor + "88",
        textColor: "#e2e8f0",
        dropShadow: `drop-shadow(0 0 6px ${archetypeColor}44)`,
      };
    case 3:
      return {
        ringColor: "#ffd700",
        trackColor: "#ffd70033",
        borderColor: "#ffd700cc",
        textColor: "#fef3c7",
        dropShadow: `drop-shadow(0 0 10px #ffd70055) drop-shadow(0 0 4px ${archetypeColor}44)`,
      };
  }
}

export default SkillTreePage;

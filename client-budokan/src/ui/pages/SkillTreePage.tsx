import { useState, useCallback, useRef } from "react";
import { motion } from "motion/react";
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
  const [busySkillId, setBusySkillId] = useState<number | null>(null);
  const swiperRef = useRef<SwiperType | null>(null);

  const cubeBalanceNumber = Number(cubeBalance);

  const skills = skillTree?.skills ?? Array.from({ length: 15 }, () => ({
    level: 0,
    branchChosen: false,
    branchId: 0,
  }));

  const handleSlideChange = useCallback((swiper: SwiperType) => {
    setActiveIndex(swiper.activeIndex);
  }, []);

  const handleArchetypePillClick = useCallback((idx: number) => {
    swiperRef.current?.slideTo(idx);
  }, []);

  const handleUpgrade = async (skillId: number) => {
    const treeInfo = skills[skillId - 1];
    if (!account || !treeInfo) return;
    if (treeInfo.level >= 9) return;
    // At level 4, must choose branch first (contract enforces this)
    if (treeInfo.level >= 4 && !treeInfo.branchChosen) return;
    const cost = SKILL_TREE_COSTS[treeInfo.level];
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

      {/* Archetype pills */}
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

      {/* Swiper */}
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
                busySkillId={busySkillId}
                cubeBalance={cubeBalanceNumber}
                onUpgrade={handleUpgrade}
                onChooseBranch={handleChooseBranch}
                onRespec={handleRespec}
              />
            </SwiperSlide>
          ))}
        </Swiper>

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
  busySkillId: number | null;
  cubeBalance: number;
  onUpgrade: (skillId: number) => void;
  onChooseBranch: (skillId: number, branchId: number) => void;
  onRespec: (skillId: number) => void;
}

const ArchetypeSlide: React.FC<ArchetypeSlideProps> = ({
  archetypeId,
  skills,
  busySkillId,
  cubeBalance,
  onUpgrade,
  onChooseBranch,
  onRespec,
}) => {
  const archetype = ARCHETYPES[archetypeId];
  const archetypeSkills = getSkillsByArchetype(archetypeId);
  const iconSrc = getCommonAssetPath(`archetypes/archetype-${archetypeId}.png`);

  return (
    <div className="h-full overflow-y-auto px-4 py-3">
      {/* Archetype header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex items-center gap-3 mb-4 max-w-[400px] mx-auto"
      >
        <div
          className="w-12 h-12 rounded-xl overflow-hidden border-2 flex-shrink-0"
          style={{ borderColor: archetype.color + "66" }}
        >
          <img src={iconSrc} alt={archetype.name} className="w-full h-full object-cover" draggable={false} />
        </div>
        <div>
          <h2
            className="font-['Fredericka_the_Great'] text-xl leading-tight"
            style={{ color: archetype.color }}
          >
            {archetype.name}
          </h2>
          <p className="text-[11px] text-slate-400">{archetype.description}</p>
        </div>
      </motion.div>

      {/* All 3 skills — always fully visible, no collapse, no lock */}
      <div className="flex flex-col gap-3 max-w-[400px] mx-auto">
        {archetypeSkills.map((skill, idx) => {
          const treeInfo = skills[skill.id - 1] ?? { level: 0, branchChosen: false, branchId: 0 };
          return (
            <motion.div
              key={skill.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.3, ease: "easeOut" }}
            >
              <SkillCard
                skill={skill}
                treeInfo={treeInfo}
                archetypeColor={archetype.color}
                isBusy={busySkillId === skill.id}
                cubeBalance={cubeBalance}
                onUpgrade={() => onUpgrade(skill.id)}
                onChooseBranch={(branchId) => onChooseBranch(skill.id, branchId)}
                onRespec={() => onRespec(skill.id)}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Skill Card — always fully visible with icon, level, branches, cost
// Each skill is independently upgradeable (no prerequisites between skills)
// ---------------------------------------------------------------------------

interface SkillCardProps {
  skill: SkillDefinition;
  treeInfo: { level: number; branchChosen: boolean; branchId: number };
  archetypeColor: string;
  isBusy: boolean;
  cubeBalance: number;
  onUpgrade: () => void;
  onChooseBranch: (branchId: number) => void;
  onRespec: () => void;
}

const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  treeInfo,
  archetypeColor,
  isBusy,
  cubeBalance,
  onUpgrade,
  onChooseBranch,
  onRespec,
}) => {
  const level = treeInfo.level;
  const tier = getSkillTier(level);
  const isMaxed = level >= 9;
  const upgradeCost = isMaxed ? null : SKILL_TREE_COSTS[level];
  const canAfford = upgradeCost !== null && cubeBalance >= upgradeCost;
  // Contract: at level 4 you must choose_branch (which also upgrades to 5).
  // upgrade_skill asserts branch_chosen if level >= 4.
  const atBranchPoint = level === 4 && !treeInfo.branchChosen;
  const canUpgrade = !isMaxed && !atBranchPoint && canAfford;
  const iconSrc = getSkillTierIconPath(skill.name, tier);
  const progress = level / 9;
  const tierStyles = getTierStyles(tier, archetypeColor);

  return (
    <div
      className="rounded-2xl border bg-slate-900/80 backdrop-blur-sm"
      style={{ borderColor: archetypeColor + "30" }}
    >
      {/* Header: icon + name + level */}
      <div className="flex items-center gap-3 p-3 pb-2">
        {/* Skill icon with progress ring */}
        <div className="relative w-14 h-14 flex-shrink-0" style={{ filter: tierStyles.dropShadow }}>
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="25" fill="none" stroke={tierStyles.trackColor} strokeWidth="2.5" />
            {level > 0 && (
              <circle
                cx="28" cy="28" r="25" fill="none"
                stroke={tierStyles.ringColor}
                strokeWidth="3"
                strokeDasharray={2 * Math.PI * 25}
                strokeDashoffset={(2 * Math.PI * 25) * (1 - progress)}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            )}
          </svg>
          <div
            className="absolute inset-[4px] rounded-full overflow-hidden border-[1.5px]"
            style={{ backgroundColor: "#0f172a", borderColor: tierStyles.borderColor }}
          >
            <img src={iconSrc} alt={skill.name} className="w-full h-full object-cover" draggable={false} />
          </div>
          {isBusy && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
              <Loader2 size={16} className="animate-spin text-white" />
            </div>
          )}
        </div>

        {/* Name + tag + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="font-['Fredericka_the_Great'] text-[15px] leading-tight"
              style={{ color: tierStyles.textColor }}
            >
              {skill.name}
            </span>
            <span className="text-[8px] uppercase tracking-wider text-slate-500 bg-slate-800/80 px-1 py-px rounded">
              {skill.category === "bonus" ? "Active" : "World"}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
            {skill.description}
          </p>
        </div>

        {/* Level badge */}
        <div className="flex-shrink-0">
          <div
            className="rounded-md px-2 py-0.5 text-[11px] font-bold text-center"
            style={{
              backgroundColor: isMaxed ? "#ffd70022" : tier >= 2 ? archetypeColor + "18" : "#1e293b",
              color: isMaxed ? "#ffd700" : tier >= 2 ? archetypeColor : "#94a3b8",
              border: `1px solid ${isMaxed ? "#ffd70044" : tier >= 2 ? archetypeColor + "33" : "#334155"}`,
            }}
          >
            {isMaxed ? "MAX" : `${level}/9`}
          </div>
        </div>
      </div>

      {/* Branch + upgrade section — always visible */}
      <div className="px-3 pb-2">
        <div className="h-px w-full mb-2" style={{ backgroundColor: archetypeColor + "15" }} />

        {/* Branch already chosen */}
        {treeInfo.branchChosen && (
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: treeInfo.branchId === 0 ? "#3b82f6" : "#f59e0b" }}
              />
              <span className="text-[11px] text-slate-300">
                Branch {treeInfo.branchId === 0 ? "A" : "B"}:{" "}
                <span className="text-white font-medium">
                  {treeInfo.branchId === 0 ? skill.branchA : skill.branchB}
                </span>
              </span>
            </div>
            <motion.button
              type="button"
              disabled={isBusy}
              onClick={onRespec}
              whileTap={isBusy ? undefined : { scale: 0.95 }}
              className="text-[9px] text-purple-300/60 hover:text-purple-200 transition-colors disabled:opacity-50 px-1.5 py-0.5 rounded border border-purple-400/15"
            >
              Respec
            </motion.button>
          </div>
        )}

        {/* At branch point (level 4): choose branch A or B */}
        {atBranchPoint && (
          <div className="mb-2">
            <p className="text-[9px] text-slate-500 mb-1.5">Choose a branch to continue:</p>
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                type="button"
                disabled={isBusy}
                onClick={() => onChooseBranch(0)}
                whileTap={isBusy ? undefined : { scale: 0.97 }}
                className="rounded-lg border border-blue-400/30 bg-blue-900/20 px-2 py-2 text-[11px] font-semibold text-blue-100 transition hover:bg-blue-900/35 disabled:opacity-50"
              >
                <div className="text-[8px] text-blue-300/50 mb-0.5">Branch A</div>
                {skill.branchA}
              </motion.button>
              <motion.button
                type="button"
                disabled={isBusy}
                onClick={() => onChooseBranch(1)}
                whileTap={isBusy ? undefined : { scale: 0.97 }}
                className="rounded-lg border border-amber-400/30 bg-amber-900/20 px-2 py-2 text-[11px] font-semibold text-amber-100 transition hover:bg-amber-900/35 disabled:opacity-50"
              >
                <div className="text-[8px] text-amber-300/50 mb-0.5">Branch B</div>
                {skill.branchB}
              </motion.button>
            </div>
          </div>
        )}

        {/* Before branch point: show upcoming branches */}
        {!atBranchPoint && !treeInfo.branchChosen && (
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1.5 flex-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
              <span className="text-[10px] text-slate-500">A: <span className="text-slate-400">{skill.branchA}</span></span>
            </div>
            <div className="flex items-center gap-1.5 flex-1">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40" />
              <span className="text-[10px] text-slate-500">B: <span className="text-slate-400">{skill.branchB}</span></span>
            </div>
            {level < 4 && (
              <span className="text-[8px] text-slate-600 flex-shrink-0">Lv.4</span>
            )}
          </div>
        )}

        {/* Upgrade button — always visible */}
        <motion.button
          type="button"
          disabled={isBusy || isMaxed || !canUpgrade}
          onClick={onUpgrade}
          whileTap={isBusy || isMaxed || !canUpgrade ? undefined : { scale: 0.97 }}
          className={`w-full rounded-lg px-3 py-2 text-[11px] font-semibold transition flex items-center justify-center gap-1.5 ${
            isMaxed
              ? "border border-yellow-500/20 bg-yellow-900/10 text-yellow-400/60 cursor-default"
              : atBranchPoint
                ? "border border-slate-600/20 bg-slate-800/20 text-slate-500 cursor-not-allowed"
                : canAfford
                  ? "border border-emerald-400/30 bg-emerald-900/15 text-emerald-200 hover:bg-emerald-900/30 active:bg-emerald-900/45"
                  : "border border-slate-600/20 bg-slate-800/20 text-slate-500 cursor-not-allowed"
          } disabled:opacity-50`}
        >
          {isBusy ? (
            <Loader2 size={12} className="animate-spin" />
          ) : isMaxed ? (
            "✦ MAX ✦"
          ) : atBranchPoint ? (
            "Choose branch to continue"
          ) : (
            <>
              <span>Upgrade to Lv.{level + 1}</span>
              <span className="opacity-70">— {upgradeCost} 🧊</span>
              {!canAfford && (
                <span className="text-[9px] text-red-400/60">(need {(upgradeCost ?? 0) - cubeBalance})</span>
              )}
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tier styles
// ---------------------------------------------------------------------------

function getTierStyles(tier: 1 | 2 | 3, archetypeColor: string) {
  switch (tier) {
    case 1:
      return {
        ringColor: archetypeColor + "88",
        trackColor: "#1e293b",
        borderColor: archetypeColor + "44",
        textColor: "#cbd5e1",
        dropShadow: "none",
      };
    case 2:
      return {
        ringColor: archetypeColor,
        trackColor: archetypeColor + "33",
        borderColor: archetypeColor + "77",
        textColor: "#e2e8f0",
        dropShadow: `drop-shadow(0 0 6px ${archetypeColor}44)`,
      };
    case 3:
      return {
        ringColor: "#ffd700",
        trackColor: "#ffd70033",
        borderColor: "#ffd700bb",
        textColor: "#fef3c7",
        dropShadow: `drop-shadow(0 0 10px #ffd70055) drop-shadow(0 0 4px ${archetypeColor}44)`,
      };
  }
}

export default SkillTreePage;

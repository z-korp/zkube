import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import { useNavigationStore } from "@/stores/navigationStore";
import { useCubeBalance } from "@/hooks/useCubeBalance";
import { useSkillTree } from "@/hooks/useSkillTree";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import {
  SKILLS,
  ARCHETYPES,
  ARCHETYPE_ORDER,
  getSkillTier,
  getSkillsByArchetype,
  type ArchetypeId,
} from "@/dojo/game/types/skillData";
import { SKILL_TREE_COSTS } from "@/dojo/game/helpers/runDataPacking";
import { getCommonAssetPath } from "@/config/themes";
import PageTopBar from "@/ui/navigation/PageTopBar";
import GameButton from "@/ui/components/shared/GameButton";
import SkillNode from "@/ui/components/SkillTree/SkillNode";
import { TooltipProvider } from "@/ui/elements/tooltip";

/** Gap between skill node centers for the connecting SVG lines */
const NODE_GAP = 88;

const SkillTreePage: React.FC = () => {
  const goBack = useNavigationStore((s) => s.goBack);
  const { cubeBalance } = useCubeBalance();
  const { skillTree } = useSkillTree();
  const { account } = useAccountCustom();
  const {
    setup: { systemCalls },
  } = useDojo();

  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedSkillId, setSelectedSkillId] = useState<number | null>(null);
  const [busySkillId, setBusySkillId] = useState<number | null>(null);
  const swiperRef = useRef<SwiperType | null>(null);

  const cubeBalanceNumber = Number(cubeBalance);

  const skills = skillTree?.skills ?? Array.from({ length: 15 }, () => ({
    level: 0,
    branchChosen: false,
    branchId: 0,
  }));

  const activeArchetypeId = ARCHETYPE_ORDER[activeIndex];
  const activeArchetype = ARCHETYPES[activeArchetypeId];

  const selectedSkill = selectedSkillId ? SKILLS[selectedSkillId] : null;
  const selectedTreeInfo = selectedSkillId
    ? skills[selectedSkillId - 1]
    : null;

  const handleSkillClick = useCallback((skillId: number) => {
    setSelectedSkillId((prev) => (prev === skillId ? null : skillId));
  }, []);

  const handleSlideChange = useCallback((swiper: SwiperType) => {
    setActiveIndex(swiper.activeIndex);
    setSelectedSkillId(null); // deselect when changing archetype
  }, []);

  const handleArchetypePillClick = useCallback((idx: number) => {
    swiperRef.current?.slideTo(idx);
  }, []);

  const handleUpgrade = async () => {
    if (!account || !selectedSkillId || !selectedTreeInfo) return;
    const level = selectedTreeInfo.level;
    if (level >= 9) return;
    const cost = SKILL_TREE_COSTS[level];
    if (cubeBalanceNumber < cost) return;

    try {
      setBusySkillId(selectedSkillId);
      await systemCalls.upgradeSkill({
        account,
        skill_id: selectedSkillId,
      });
    } catch (error) {
      console.error("Failed to upgrade skill:", error);
    } finally {
      setBusySkillId(null);
    }
  };

  const handleChooseBranch = async (branchId: number) => {
    if (!account || !selectedSkillId) return;
    try {
      setBusySkillId(selectedSkillId);
      await systemCalls.chooseBranch({
        account,
        skill_id: selectedSkillId,
        branch_id: branchId,
      });
    } catch (error) {
      console.error("Failed to choose branch:", error);
    } finally {
      setBusySkillId(null);
    }
  };

  const handleRespec = async () => {
    if (!account || !selectedSkillId) return;
    try {
      setBusySkillId(selectedSkillId);
      await systemCalls.respecBranch({
        account,
        skill_id: selectedSkillId,
      });
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

      {/* Swiper carousel — one archetype per slide */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <TooltipProvider delayDuration={300}>
          <Swiper
            slidesPerView={1}
            spaceBetween={0}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            onSlideChange={handleSlideChange}
            className="flex-1 w-full"
          >
            {ARCHETYPE_ORDER.map((archetypeId) => (
              <SwiperSlide key={archetypeId}>
                <ArchetypeSlide
                  archetypeId={archetypeId}
                  skills={skills}
                  selectedSkillId={selectedSkillId}
                  busySkillId={busySkillId}
                  onSkillClick={handleSkillClick}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </TooltipProvider>

        {/* Detail / action panel */}
        <AnimatePresence mode="wait">
          {selectedSkill && selectedTreeInfo && (
            <SkillDetailPanel
              skill={selectedSkill}
              treeInfo={selectedTreeInfo}
              cubeBalance={cubeBalanceNumber}
              isBusy={busySkillId === selectedSkillId}
              onUpgrade={handleUpgrade}
              onChooseBranch={handleChooseBranch}
              onRespec={handleRespec}
              onClose={() => setSelectedSkillId(null)}
            />
          )}
        </AnimatePresence>

        {/* Back button */}
        <div className="px-4 pb-4 pt-2 max-w-[420px] mx-auto w-full">
          <GameButton label="BACK" variant="secondary" onClick={goBack} />
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Archetype Slide — shows one archetype with its 3 skills
// ---------------------------------------------------------------------------

interface ArchetypeSlideProps {
  archetypeId: ArchetypeId;
  skills: { level: number; branchChosen: boolean; branchId: number }[];
  selectedSkillId: number | null;
  busySkillId: number | null;
  onSkillClick: (skillId: number) => void;
}

const ArchetypeSlide: React.FC<ArchetypeSlideProps> = ({
  archetypeId,
  skills,
  selectedSkillId,
  busySkillId,
  onSkillClick,
}) => {
  const archetype = ARCHETYPES[archetypeId];
  const archetypeSkills = getSkillsByArchetype(archetypeId);
  const iconSrc = getCommonAssetPath(`archetypes/archetype-${archetypeId}.png`);

  return (
    <div className="h-full overflow-y-auto px-4 py-4 flex flex-col items-center">
      {/* Archetype header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex flex-col items-center gap-2 mb-6"
      >
        <div
          className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2"
          style={{ borderColor: archetype.color + "66" }}
        >
          <img
            src={iconSrc}
            alt={archetype.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
        <h2
          className="font-['Fredericka_the_Great'] text-2xl md:text-3xl"
          style={{ color: archetype.color }}
        >
          {archetype.name}
        </h2>
        <p className="text-xs md:text-sm text-slate-400 text-center max-w-[280px]">
          {archetype.description}
        </p>
      </motion.div>

      {/* Skill nodes with connecting lines */}
      <div className="relative flex flex-col items-center">
        {archetypeSkills.map((skill, idx) => {
          const treeInfo = skills[skill.id - 1] ?? {
            level: 0,
            branchChosen: false,
            branchId: 0,
          };
          const nextSkill = archetypeSkills[idx + 1];
          const nextTreeInfo = nextSkill
            ? skills[nextSkill.id - 1] ?? {
                level: 0,
                branchChosen: false,
                branchId: 0,
              }
            : null;

          return (
            <motion.div
              key={skill.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: idx * 0.1,
                duration: 0.35,
                ease: "easeOut",
              }}
              className="relative flex flex-col items-center"
              style={{ marginTop: idx === 0 ? 0 : `${NODE_GAP - 70}px` }}
            >
              {/* SVG connection line to NEXT node */}
              {nextSkill && nextTreeInfo && (
                <svg
                  className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                  style={{
                    top: "64px",
                    width: "2px",
                    height: `${NODE_GAP - 30}px`,
                  }}
                  viewBox={`0 0 2 ${NODE_GAP - 30}`}
                  preserveAspectRatio="none"
                >
                  <line
                    x1="1"
                    y1="0"
                    x2="1"
                    y2={NODE_GAP - 30}
                    stroke={archetype.color}
                    strokeWidth="2"
                    strokeOpacity={nextTreeInfo.level > 0 ? 0.8 : 0.2}
                    strokeDasharray={
                      nextTreeInfo.level > 0 ? "none" : "4 4"
                    }
                  />
                </svg>
              )}

              <SkillNode
                skillId={skill.id}
                treeInfo={treeInfo}
                isSelected={selectedSkillId === skill.id}
                isBusy={busySkillId === skill.id}
                isRoot={idx === 0}
                onClick={onSkillClick}
              />

              {/* Skill description below each node */}
              <p className="mt-1 text-[10px] text-slate-500 text-center max-w-[160px] leading-tight">
                {skill.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Detail Panel (shown when a skill node is selected)
// ---------------------------------------------------------------------------

interface SkillDetailPanelProps {
  skill: (typeof SKILLS)[number];
  treeInfo: { level: number; branchChosen: boolean; branchId: number };
  cubeBalance: number;
  isBusy: boolean;
  onUpgrade: () => void;
  onChooseBranch: (branchId: number) => void;
  onRespec: () => void;
  onClose: () => void;
}

const SkillDetailPanel: React.FC<SkillDetailPanelProps> = ({
  skill,
  treeInfo,
  cubeBalance,
  isBusy,
  onUpgrade,
  onChooseBranch,
  onRespec,
  onClose,
}) => {
  const archetype = ARCHETYPES[skill.archetype];
  const level = treeInfo.level;
  const isMaxed = level >= 9;
  const upgradeCost = isMaxed ? null : SKILL_TREE_COSTS[level];
  const canAfford = upgradeCost !== null && cubeBalance >= upgradeCost;
  const needsBranchChoice = level >= 5 && !treeInfo.branchChosen;
  const tier = getSkillTier(level);

  return (
    <motion.div
      key={skill.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25 }}
      className="mx-4 mb-2 rounded-2xl border bg-slate-900/90 backdrop-blur-sm p-4 md:p-5 max-w-[600px] xl:mx-auto w-full xl:w-[600px]"
      style={{
        borderColor: archetype.color + "40",
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3
              className="font-['Fredericka_the_Great'] text-xl md:text-2xl"
              style={{ color: archetype.color }}
            >
              {skill.name}
            </h3>
            <span className="text-[10px] uppercase tracking-wide text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
              {skill.category === "bonus" ? "Bonus" : "World Event"}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-300">{skill.description}</p>
        </div>

        {/* Level & tier indicator */}
        <div className="flex flex-col items-end gap-1">
          <div
            className="rounded-lg px-2.5 py-1 text-sm font-bold"
            style={{
              backgroundColor:
                tier === 3
                  ? "#ffd70022"
                  : tier === 2
                    ? archetype.color + "22"
                    : "#1e293b",
              color:
                tier === 3
                  ? "#ffd700"
                  : tier === 2
                    ? archetype.color
                    : "#94a3b8",
              border: `1px solid ${
                tier === 3
                  ? "#ffd70044"
                  : tier === 2
                    ? archetype.color + "44"
                    : "#334155"
              }`,
            }}
          >
            Lv. {level}/9
          </div>
          <span className="text-[10px] text-slate-500">
            Tier {tier}
          </span>
        </div>
      </div>

      {/* Branch info */}
      {treeInfo.branchChosen && (
        <div className="mt-3 flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor:
                treeInfo.branchId === 0 ? "#3b82f6" : "#f59e0b",
            }}
          />
          <span className="text-xs text-slate-300">
            Branch {treeInfo.branchId === 0 ? "A" : "B"}:{" "}
            <span className="text-white font-medium">
              {treeInfo.branchId === 0 ? skill.branchA : skill.branchB}
            </span>
          </span>
        </div>
      )}

      {/* Branch choice (when at level 5+ without branch) */}
      {needsBranchChoice && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <motion.button
            type="button"
            disabled={isBusy}
            onClick={() => onChooseBranch(0)}
            whileHover={isBusy ? undefined : { scale: 1.02 }}
            whileTap={isBusy ? undefined : { scale: 0.98 }}
            className="rounded-xl border border-blue-400/40 bg-blue-900/25 px-3 py-2.5 text-sm font-semibold text-blue-100 transition hover:bg-blue-900/40 disabled:opacity-50"
          >
            <div className="text-[10px] text-blue-300/70 mb-0.5">
              Branch A
            </div>
            {skill.branchA}
          </motion.button>
          <motion.button
            type="button"
            disabled={isBusy}
            onClick={() => onChooseBranch(1)}
            whileHover={isBusy ? undefined : { scale: 1.02 }}
            whileTap={isBusy ? undefined : { scale: 0.98 }}
            className="rounded-xl border border-amber-400/40 bg-amber-900/25 px-3 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-900/40 disabled:opacity-50"
          >
            <div className="text-[10px] text-amber-300/70 mb-0.5">
              Branch B
            </div>
            {skill.branchB}
          </motion.button>
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-3 flex flex-col gap-2">
        {/* Upgrade button */}
        <motion.button
          type="button"
          disabled={isBusy || isMaxed || !canAfford}
          onClick={onUpgrade}
          whileHover={
            isBusy || isMaxed || !canAfford ? undefined : { scale: 1.01 }
          }
          whileTap={
            isBusy || isMaxed || !canAfford ? undefined : { scale: 0.98 }
          }
          className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition flex items-center justify-center gap-2 ${
            isMaxed
              ? "border border-yellow-500/30 bg-yellow-900/20 text-yellow-300/80 cursor-default"
              : canAfford
                ? "border border-emerald-400/40 bg-emerald-900/25 text-emerald-100 hover:bg-emerald-900/40"
                : "border border-slate-600/40 bg-slate-800/40 text-slate-400 cursor-not-allowed"
          } disabled:opacity-50`}
        >
          {isMaxed ? (
            "✦ MAX LEVEL ✦"
          ) : (
            <>
              Upgrade to Lv. {level + 1}
              <span className="inline-flex items-center gap-1 text-xs opacity-80">
                — {upgradeCost} 🧊
              </span>
              {!canAfford && (
                <span className="text-[10px] text-red-400/80 ml-1">
                  (need {(upgradeCost ?? 0) - cubeBalance} more)
                </span>
              )}
            </>
          )}
        </motion.button>

        {/* Respec button (only when branch is chosen) */}
        {treeInfo.branchChosen && (
          <motion.button
            type="button"
            disabled={isBusy}
            onClick={onRespec}
            whileHover={isBusy ? undefined : { scale: 1.01 }}
            whileTap={isBusy ? undefined : { scale: 0.98 }}
            className="w-full rounded-xl border border-purple-400/30 bg-purple-900/20 px-4 py-2 text-xs font-semibold text-purple-200 transition hover:bg-purple-900/30 disabled:opacity-50"
          >
            Respec Branch
          </motion.button>
        )}
      </div>

      {/* Close hint */}
      <button
        type="button"
        onClick={onClose}
        className="mt-2 w-full text-center text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
      >
        tap to dismiss
      </button>
    </motion.div>
  );
};

export default SkillTreePage;

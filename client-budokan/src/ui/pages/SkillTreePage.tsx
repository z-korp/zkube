import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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
} from "@/dojo/game/types/skillData";
import { SKILL_TREE_COSTS } from "@/dojo/game/helpers/runDataPacking";
import PageTopBar from "@/ui/navigation/PageTopBar";
import GameButton from "@/ui/components/shared/GameButton";
import ArchetypeColumn from "@/ui/components/SkillTree/ArchetypeColumn";
import { TooltipProvider } from "@/ui/elements/tooltip";

const SkillTreePage: React.FC = () => {
  const goBack = useNavigationStore((s) => s.goBack);
  const { cubeBalance } = useCubeBalance();
  const { skillTree } = useSkillTree();
  const { account } = useAccountCustom();
  const {
    setup: { systemCalls },
  } = useDojo();

  const [selectedSkillId, setSelectedSkillId] = useState<number | null>(null);
  const [busySkillId, setBusySkillId] = useState<number | null>(null);

  const cubeBalanceNumber = Number(cubeBalance);

  const skills = skillTree?.skills ?? Array.from({ length: 15 }, () => ({
    level: 0,
    branchChosen: false,
    branchId: 0,
  }));

  const selectedSkill = selectedSkillId ? SKILLS[selectedSkillId] : null;
  const selectedTreeInfo = selectedSkillId
    ? skills[selectedSkillId - 1]
    : null;

  const handleSkillClick = (skillId: number) => {
    setSelectedSkillId((prev) => (prev === skillId ? null : skillId));
  };

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

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
          {/* Skill tree columns */}
          <TooltipProvider delayDuration={300}>
            <div className="flex-1 overflow-x-auto px-2 py-4">
              <div className="flex gap-3 md:gap-5 xl:gap-8 justify-start xl:justify-center min-w-max px-4 md:px-6">
                {ARCHETYPE_ORDER.map((archetypeId, idx) => (
                  <ArchetypeColumn
                    key={archetypeId}
                    archetypeId={archetypeId}
                    skills={skills}
                    selectedSkillId={selectedSkillId}
                    busySkillId={busySkillId}
                    onSkillClick={handleSkillClick}
                    index={idx}
                  />
                ))}
              </div>
            </div>
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

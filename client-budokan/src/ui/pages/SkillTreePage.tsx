import { useState } from "react";
import { useNavigationStore } from "@/stores/navigationStore";
import { useCubeBalance } from "@/hooks/useCubeBalance";
import { useSkillTree } from "@/hooks/useSkillTree";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import {
  SKILLS,
  getBonusSkills,
  getWorldEventSkills,
} from "@/dojo/game/types/skillData";
import { SKILL_TREE_COSTS } from "@/dojo/game/helpers/runDataPacking";
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

  const [busySkillId, setBusySkillId] = useState<number | null>(null);

  const cubeBalanceNumber = Number(cubeBalance);

  const handleUpgrade = async (skillId: number) => {
    if (!account) return;
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
      await systemCalls.chooseBranch({
        account,
        skill_id: skillId,
        branch_id: branchId,
      });
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

  const renderSkillCard = (skillId: number) => {
    const skill = SKILLS[skillId];
    const treeInfo = skillTree?.skills[skillId - 1] ?? {
      level: 0,
      branchChosen: false,
      branchId: 0,
    };
    const level = treeInfo.level;
    const isMaxed = level >= 9;
    const upgradeCost = isMaxed ? null : SKILL_TREE_COSTS[level];
    const canAfford = upgradeCost !== null && cubeBalanceNumber >= upgradeCost;
    const needsBranchChoice = level >= 5 && !treeInfo.branchChosen;
    const isBusy = busySkillId === skillId;

    return (
      <article
        key={skillId}
        className="rounded-2xl border border-slate-600/80 bg-slate-900/80 p-4"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-['Fredericka_the_Great'] text-xl text-slate-100">
              {skill.name}
            </p>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              {skill.category === "bonus" ? "Bonus" : "World Event"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-200">
            Level {level}/9
          </div>
        </div>

        <p className="mt-2 text-sm text-slate-300">{skill.description}</p>

        {treeInfo.branchChosen && (
          <p className="mt-2 text-xs text-emerald-300">
            Branch: {treeInfo.branchId === 0 ? skill.branchA : skill.branchB}
          </p>
        )}

        {needsBranchChoice && (
          <div className="mt-3 grid grid-cols-1 gap-2">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => handleChooseBranch(skillId, 0)}
              className="rounded-lg border border-sky-400/50 bg-sky-900/30 px-3 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-900/50 disabled:opacity-50"
            >
              Choose Branch A: {skill.branchA}
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => handleChooseBranch(skillId, 1)}
              className="rounded-lg border border-amber-400/50 bg-amber-900/30 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-900/50 disabled:opacity-50"
            >
              Choose Branch B: {skill.branchB}
            </button>
          </div>
        )}

        {treeInfo.branchChosen && level >= 5 && (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => handleRespec(skillId)}
            className="mt-3 w-full rounded-lg border border-purple-400/50 bg-purple-900/30 px-3 py-2 text-sm font-semibold text-purple-100 transition hover:bg-purple-900/50 disabled:opacity-50"
          >
            Respec Branch
          </button>
        )}

        <button
          type="button"
          disabled={isBusy || isMaxed || !canAfford}
          onClick={() => handleUpgrade(skillId)}
          className="mt-3 w-full rounded-lg border border-emerald-400/50 bg-emerald-900/30 px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-900/50 disabled:opacity-50"
        >
          {isMaxed
            ? "Max Level"
            : `Upgrade (${upgradeCost} cubes)`}
        </button>
      </article>
    );
  };

  return (
    <div className="h-screen-viewport flex flex-col text-white">
      <PageTopBar title="SKILL TREE" onBack={goBack} cubeBalance={cubeBalance} />

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
        <div className="mx-auto max-w-[980px] space-y-4 pb-8">
          <section className="rounded-2xl border border-emerald-300/30 bg-slate-900/80 px-5 py-4">
            <h2 className="font-['Fredericka_the_Great'] text-2xl text-emerald-200">
              Build Your Tree
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Upgrade active bonus skills and world event skills. Branch choices
              unlock at level 5.
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-['Fredericka_the_Great'] text-2xl text-sky-200">
              Bonus Skills
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {getBonusSkills().map((skill) => renderSkillCard(skill.id))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 font-['Fredericka_the_Great'] text-2xl text-amber-200">
              World Event Skills
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {getWorldEventSkills().map((skill) => renderSkillCard(skill.id))}
            </div>
          </section>

          <div className="mx-auto max-w-[420px]">
            <GameButton label="BACK" variant="secondary" onClick={goBack} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillTreePage;

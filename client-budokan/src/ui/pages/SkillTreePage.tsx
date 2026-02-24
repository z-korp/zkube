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
  SKILLS,
  ARCHETYPES,
  ARCHETYPE_ORDER,
  getSkillTier,
  getSkillsByArchetype,
  type ArchetypeId,
} from "@/dojo/game/types/skillData";
import { SKILL_TREE_COSTS } from "@/dojo/game/helpers/runDataPacking";
import { getCommonAssetPath } from "@/config/themes";
import { getSkillTierIconPath } from "@/ui/theme/ImageAssets";
import PageTopBar from "@/ui/navigation/PageTopBar";
import GameButton from "@/ui/components/shared/GameButton";

/** Format cost for display */
function fmtCost(cost: number): string {
  if (cost >= 1000) return `${(cost / 1000).toFixed(cost % 1000 === 0 ? 0 : 1)}K`;
  return String(cost);
}

/** Node size in px */
const NODE = 42;
/** Gap between branch sub-columns */
const BRANCH_GAP = 6;

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

  const handlePillClick = useCallback((idx: number) => {
    swiperRef.current?.slideTo(idx);
  }, []);

  const handleUpgrade = useCallback(async (skillId: number) => {
    const info = skills[skillId - 1];
    if (!account || !info || info.level >= 9) return;
    if (info.level >= 4 && !info.branchChosen) return;
    const cost = SKILL_TREE_COSTS[info.level];
    if (cubeBalanceNumber < cost) return;
    try {
      setBusySkillId(skillId);
      await systemCalls.upgradeSkill({ account, skill_id: skillId });
    } catch (e) {
      console.error("upgrade_skill failed:", e);
    } finally {
      setBusySkillId(null);
    }
  }, [account, skills, cubeBalanceNumber, systemCalls]);

  const handleBranch = useCallback(async (skillId: number, branch: number) => {
    if (!account) return;
    try {
      setBusySkillId(skillId);
      await systemCalls.chooseBranch({ account, skill_id: skillId, branch_id: branch });
    } catch (e) {
      console.error("choose_branch failed:", e);
    } finally {
      setBusySkillId(null);
    }
  }, [account, systemCalls]);

  const handleRespec = useCallback(async (skillId: number) => {
    if (!account) return;
    try {
      setBusySkillId(skillId);
      await systemCalls.respecBranch({ account, skill_id: skillId });
    } catch (e) {
      console.error("respec_branch failed:", e);
    } finally {
      setBusySkillId(null);
    }
  }, [account, systemCalls]);

  return (
    <div className="h-screen-viewport flex flex-col text-white">
      <PageTopBar title="SKILL TREE" onBack={goBack} cubeBalance={cubeBalance} />

      {/* Archetype pills */}
      <div className="flex items-center justify-center gap-1.5 px-3 py-2">
        {ARCHETYPE_ORDER.map((id, idx) => {
          const a = ARCHETYPES[id];
          const active = idx === activeIndex;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handlePillClick(idx)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                active ? "text-white scale-105" : "text-slate-400 bg-slate-800/60 hover:bg-slate-700/60"
              }`}
              style={
                active
                  ? { backgroundColor: a.color + "33", color: a.color, border: `1px solid ${a.color}66` }
                  : { border: "1px solid transparent" }
              }
            >
              {a.name}
            </button>
          );
        })}
      </div>

      {/* Swiper */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <Swiper
          slidesPerView={1}
          spaceBetween={0}
          onSwiper={(s) => { swiperRef.current = s; }}
          onSlideChange={handleSlideChange}
          className="flex-1 w-full"
        >
          {ARCHETYPE_ORDER.map((archetypeId) => (
            <SwiperSlide key={archetypeId}>
              <TreeSlide
                archetypeId={archetypeId}
                skills={skills}
                busySkillId={busySkillId}
                cubeBalance={cubeBalanceNumber}
                onUpgrade={handleUpgrade}
                onBranch={handleBranch}
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
// Tree Slide — the full 3-column × 9-row grid
// ---------------------------------------------------------------------------

interface TreeSlideProps {
  archetypeId: ArchetypeId;
  skills: { level: number; branchChosen: boolean; branchId: number }[];
  busySkillId: number | null;
  cubeBalance: number;
  onUpgrade: (skillId: number) => void;
  onBranch: (skillId: number, branch: number) => void;
  onRespec: (skillId: number) => void;
}

const TreeSlide: React.FC<TreeSlideProps> = ({
  archetypeId,
  skills,
  busySkillId,
  cubeBalance,
  onUpgrade,
  onBranch,
  onRespec,
}) => {
  const archetype = ARCHETYPES[archetypeId];
  const archetypeSkills = getSkillsByArchetype(archetypeId);
  const iconSrc = getCommonAssetPath(`archetypes/archetype-${archetypeId}.png`);

  // 9 rows: rows 0-3 = core (single), rows 4-8 = branch (forked)
  // Row N represents upgrading from level N to level N+1
  const rows = Array.from({ length: 9 }, (_, i) => i);

  return (
    <div className="h-full overflow-y-auto px-2 py-3">
      {/* Archetype header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-center gap-2.5 mb-3 max-w-[400px] mx-auto px-2"
      >
        <div
          className="w-10 h-10 rounded-lg overflow-hidden border-2 flex-shrink-0"
          style={{ borderColor: archetype.color + "66" }}
        >
          <img src={iconSrc} alt={archetype.name} className="w-full h-full object-cover" draggable={false} />
        </div>
        <div>
          <h2 className="font-['Fredericka_the_Great'] text-lg leading-tight" style={{ color: archetype.color }}>
            {archetype.name}
          </h2>
          <p className="text-[10px] text-slate-400">{archetype.description}</p>
        </div>
      </motion.div>

      {/* Column headers: skill names */}
      <div className="grid grid-cols-3 gap-1 max-w-[400px] mx-auto mb-2 px-1">
        {archetypeSkills.map((skill) => (
          <div key={skill.id} className="text-center">
            <span className="text-[10px] font-semibold text-slate-300">{skill.name}</span>
            <span className="text-[8px] text-slate-600 ml-1">
              {skill.category === "bonus" ? "Active" : "World"}
            </span>
          </div>
        ))}
      </div>

      {/* The grid: 3 columns × 9 rows */}
      <div className="max-w-[400px] mx-auto">
        {rows.map((rowIdx) => {
          const isBranch = rowIdx >= 4;
          const cost = SKILL_TREE_COSTS[rowIdx];
          const targetLevel = rowIdx + 1; // upgrading TO this level

          return (
            <div key={rowIdx}>
              {/* The 3-column row */}
              <div className="grid grid-cols-3 gap-1 px-1">
                {archetypeSkills.map((skill) => {
                  const info = skills[skill.id - 1] ?? { level: 0, branchChosen: false, branchId: 0 };

                  if (!isBranch) {
                    // Core path: single node
                    return (
                      <CoreNode
                        key={skill.id}
                        skill={skill}
                        info={info}
                        targetLevel={targetLevel}
                        cost={cost}
                        color={archetype.color}
                        cubeBalance={cubeBalance}
                        isBusy={busySkillId === skill.id}
                        onUpgrade={() => onUpgrade(skill.id)}
                      />
                    );
                  }

                  // Branch path: two sub-nodes (A / B)
                  return (
                    <BranchRow
                      key={skill.id}
                      skill={skill}
                      info={info}
                      targetLevel={targetLevel}
                      rowIdx={rowIdx}
                      cost={cost}
                      color={archetype.color}
                      cubeBalance={cubeBalance}
                      isBusy={busySkillId === skill.id}
                      onUpgrade={() => onUpgrade(skill.id)}
                      onBranch={(b) => onBranch(skill.id, b)}
                      onRespec={() => onRespec(skill.id)}
                    />
                  );
                })}
              </div>

              {/* Connecting lines between rows */}
              {rowIdx < 8 && (
                <div className="grid grid-cols-3 gap-1 px-1">
                  {archetypeSkills.map((skill) => {
                    const info = skills[skill.id - 1] ?? { level: 0, branchChosen: false, branchId: 0 };
                    const nextIsBranch = rowIdx + 1 >= 4;
                    const lit = info.level > targetLevel;

                    if (!isBranch && !nextIsBranch) {
                      // Single → single
                      return (
                        <div key={skill.id} className="flex justify-center py-0.5">
                          <div className="w-[2px] h-3" style={{ backgroundColor: archetype.color, opacity: lit ? 0.6 : 0.12 }} />
                        </div>
                      );
                    }

                    if (!isBranch && nextIsBranch) {
                      // Single → fork (row 3 → row 4)
                      return (
                        <div key={skill.id} className="flex justify-center py-0.5">
                          <svg width={NODE * 2 + BRANCH_GAP} height="14" className="overflow-visible">
                            <line x1={(NODE * 2 + BRANCH_GAP) / 2} y1="0" x2={(NODE - BRANCH_GAP) / 2 + BRANCH_GAP / 2} y2="14"
                              stroke={archetype.color} strokeWidth="1.5" strokeOpacity={lit ? 0.5 : 0.12} />
                            <line x1={(NODE * 2 + BRANCH_GAP) / 2} y1="0" x2={NODE + BRANCH_GAP + (NODE - BRANCH_GAP) / 2 + BRANCH_GAP / 2} y2="14"
                              stroke={archetype.color} strokeWidth="1.5" strokeOpacity={lit ? 0.5 : 0.12} />
                          </svg>
                        </div>
                      );
                    }

                    // Branch → branch
                    const litA = info.branchChosen && info.branchId === 0 && info.level > targetLevel;
                    const litB = info.branchChosen && info.branchId === 1 && info.level > targetLevel;
                    return (
                      <div key={skill.id} className="flex justify-center py-0.5">
                        <div className="flex gap-[6px]" style={{ width: NODE * 2 + BRANCH_GAP }}>
                          <div className="flex-1 flex justify-center">
                            <div className="w-[2px] h-3" style={{ backgroundColor: archetype.color, opacity: litA ? 0.5 : 0.1 }} />
                          </div>
                          <div className="flex-1 flex justify-center">
                            <div className="w-[2px] h-3" style={{ backgroundColor: archetype.color, opacity: litB ? 0.5 : 0.1 }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Core Node — single node for levels 1-4
// ---------------------------------------------------------------------------

interface CoreNodeProps {
  skill: { id: number; name: string };
  info: { level: number; branchChosen: boolean; branchId: number };
  targetLevel: number;
  cost: number;
  color: string;
  cubeBalance: number;
  isBusy: boolean;
  onUpgrade: () => void;
}

const CoreNode: React.FC<CoreNodeProps> = ({ skill, info, targetLevel, cost, color, cubeBalance, isBusy, onUpgrade }) => {
  const unlocked = info.level >= targetLevel;
  const isNext = info.level === targetLevel - 1 && (targetLevel <= 4 || info.branchChosen);
  const canAfford = cubeBalance >= cost;
  const tier = getSkillTier(unlocked ? targetLevel : Math.max(0, targetLevel - 1));
  const iconSrc = getSkillTierIconPath(SKILLS[skill.id].name, tier);

  return (
    <div className="flex flex-col items-center">
      <TreeNode
        iconSrc={iconSrc}
        unlocked={unlocked}
        isNext={isNext}
        canAfford={canAfford}
        isBusy={isBusy}
        color={color}
        onClick={isNext && canAfford ? onUpgrade : undefined}
      />
      <span className={`text-[8px] mt-0.5 ${unlocked ? "text-slate-300" : isNext ? "text-slate-400" : "text-slate-600"}`}>
        {unlocked ? `Lv.${targetLevel}` : fmtCost(cost)}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Branch Row — two sub-nodes (A / B) for levels 5-9
// ---------------------------------------------------------------------------

interface BranchRowProps {
  skill: { id: number; name: string; branchA: string; branchB: string };
  info: { level: number; branchChosen: boolean; branchId: number };
  targetLevel: number;
  rowIdx: number;
  cost: number;
  color: string;
  cubeBalance: number;
  isBusy: boolean;
  onUpgrade: () => void;
  onBranch: (b: number) => void;
  onRespec: () => void;
}

const BranchRow: React.FC<BranchRowProps> = ({ skill, info, targetLevel, rowIdx, cost, color, cubeBalance, isBusy, onUpgrade, onBranch }) => {
  const canAfford = cubeBalance >= cost;
  const skillDef = SKILLS[skill.id];

  // At the fork point (row 4 = level 5), if branch not chosen yet, both are clickable choices
  const isForkRow = rowIdx === 4;
  const needsChoice = isForkRow && info.level === 4 && !info.branchChosen;

  const nodeA = (() => {
    if (needsChoice) {
      // Both branches available to choose
      return { unlocked: false, isNext: true, canAfford, disabled: false };
    }
    const chose = info.branchChosen;
    const isA = info.branchId === 0;
    const unlocked = chose && isA && info.level >= targetLevel;
    const isNext = chose && isA && info.level === targetLevel - 1;
    const wrongBranch = chose && !isA;
    return { unlocked, isNext: isNext && !wrongBranch, canAfford: canAfford && !wrongBranch, disabled: wrongBranch };
  })();

  const nodeB = (() => {
    if (needsChoice) {
      return { unlocked: false, isNext: true, canAfford, disabled: false };
    }
    const chose = info.branchChosen;
    const isB = info.branchId === 1;
    const unlocked = chose && isB && info.level >= targetLevel;
    const isNext = chose && isB && info.level === targetLevel - 1;
    const wrongBranch = chose && !isB;
    return { unlocked, isNext: isNext && !wrongBranch, canAfford: canAfford && !wrongBranch, disabled: wrongBranch };
  })();

  const tierA = getSkillTier(nodeA.unlocked ? targetLevel : Math.max(0, targetLevel - 1));
  const tierB = getSkillTier(nodeB.unlocked ? targetLevel : Math.max(0, targetLevel - 1));

  const handleClickA = () => {
    if (needsChoice && canAfford) onBranch(0);
    else if (nodeA.isNext && nodeA.canAfford) onUpgrade();
  };

  const handleClickB = () => {
    if (needsChoice && canAfford) onBranch(1);
    else if (nodeB.isNext && nodeB.canAfford) onUpgrade();
  };

  const costLabel = fmtCost(cost);

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-[6px]" style={{ width: NODE * 2 + BRANCH_GAP }}>
        {/* Branch A */}
        <div className="flex flex-col items-center flex-1">
          <TreeNode
            iconSrc={getSkillTierIconPath(skillDef.name, tierA)}
            unlocked={nodeA.unlocked}
            isNext={nodeA.isNext}
            canAfford={nodeA.canAfford}
            isBusy={isBusy}
            color={nodeA.disabled ? "#334155" : color}
            dimmed={nodeA.disabled}
            onClick={nodeA.isNext && nodeA.canAfford ? handleClickA : undefined}
            label={isForkRow ? "A" : undefined}
          />
        </div>
        {/* Branch B */}
        <div className="flex flex-col items-center flex-1">
          <TreeNode
            iconSrc={getSkillTierIconPath(skillDef.name, tierB)}
            unlocked={nodeB.unlocked}
            isNext={nodeB.isNext}
            canAfford={nodeB.canAfford}
            isBusy={isBusy}
            color={nodeB.disabled ? "#334155" : color}
            dimmed={nodeB.disabled}
            onClick={nodeB.isNext && nodeB.canAfford ? handleClickB : undefined}
            label={isForkRow ? "B" : undefined}
          />
        </div>
      </div>
      <span className={`text-[8px] mt-0.5 ${nodeA.unlocked || nodeB.unlocked ? "text-slate-300" : nodeA.isNext || nodeB.isNext ? "text-slate-400" : "text-slate-600"}`}>
        {nodeA.unlocked || nodeB.unlocked ? `Lv.${targetLevel}` : costLabel}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// TreeNode — the actual square icon node
// ---------------------------------------------------------------------------

interface TreeNodeProps {
  iconSrc: string;
  unlocked: boolean;
  isNext: boolean;
  canAfford: boolean;
  isBusy: boolean;
  color: string;
  dimmed?: boolean;
  onClick?: () => void;
  label?: string;
}

const TreeNode: React.FC<TreeNodeProps> = ({ iconSrc, unlocked, isNext, canAfford, isBusy, color, dimmed, onClick, label }) => {
  const clickable = isNext && canAfford && !isBusy && onClick;

  return (
    <motion.button
      type="button"
      disabled={!clickable}
      onClick={onClick}
      whileTap={clickable ? { scale: 0.9 } : undefined}
      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
        clickable ? "cursor-pointer" : "cursor-default"
      }`}
      style={{
        width: NODE,
        height: NODE,
        borderColor: unlocked
          ? color + "aa"
          : isNext
            ? color + "55"
            : dimmed
              ? "#1e293b"
              : "#1e293b44",
        boxShadow: unlocked
          ? `0 0 8px ${color}33`
          : isNext && canAfford
            ? `0 0 6px ${color}22`
            : "none",
        opacity: dimmed ? 0.25 : 1,
      }}
    >
      {/* Background */}
      <div className={`absolute inset-0 ${unlocked ? "bg-slate-800" : "bg-slate-900/90"}`} />

      {/* Icon */}
      <img
        src={iconSrc}
        alt=""
        className={`absolute inset-0 w-full h-full object-cover ${
          unlocked ? "" : isNext ? "opacity-60" : "opacity-25 grayscale"
        }`}
        draggable={false}
      />

      {/* Next-available pulse ring */}
      {isNext && canAfford && !isBusy && (
        <div
          className="absolute inset-0 rounded-lg animate-pulse"
          style={{ border: `1px solid ${color}44` }}
        />
      )}

      {/* Busy spinner */}
      {isBusy && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <Loader2 size={14} className="animate-spin text-white" />
        </div>
      )}

      {/* Branch label (A/B) at fork row */}
      {label && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[7px] font-bold text-center py-px text-slate-300">
          {label}
        </div>
      )}
    </motion.button>
  );
};

export default SkillTreePage;

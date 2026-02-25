import { useState, useCallback, useRef, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import { Loader2, Lock, ChevronLeft, ChevronRight } from "lucide-react";
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
  type SkillDefinition,
} from "@/dojo/game/types/skillData";
import { getSkillEffectDescription } from "@/dojo/game/types/skillEffects";
import { SKILL_TREE_COSTS } from "@/dojo/game/helpers/runDataPacking";
import { getCommonAssetPath } from "@/config/themes";
import { getSkillTierIconPath } from "@/ui/theme/ImageAssets";
import PageTopBar from "@/ui/navigation/PageTopBar";
import { Dialog, DialogContent, DialogTitle } from "@/ui/elements/dialog";

/* ------------------------------------------------------------------ */
/*  Layout constants (all values in %)                                 */
/* ------------------------------------------------------------------ */

function fmtCost(cost: number): string {
  if (cost >= 1000) return `${(cost / 1000).toFixed(cost % 1000 === 0 ? 0 : 1)}K`;
  return String(cost);
}

const COL_X = [17, 50, 83];
const BRANCH_OFF = 7;
const ROW_START = 5;
const ROW_GAP = 11.25;
const rowY = (row: number) => ROW_START + row * ROW_GAP;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SkillInfo {
  level: number;
  branchChosen: boolean;
  branchId: number;
}

interface TreeNodeData {
  key: string;
  xPct: number;
  yPct: number;
  isCore: boolean;
  iconSrc: string;
  skillId: number;
  targetLevel: number;
  unlocked: boolean;
  isNext: boolean;
  canAfford: boolean;
  dimmed: boolean;
  color: string;
  borderColor: string;
  nodeOpacity: number;
  iconOpacity: number;
  iconFilter: string;
  badgeLabel: string;
  badgeColor: string;
  action: "upgrade" | "branchA" | "branchB" | "none";
  branchSide: number;
}

interface LineData {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  opacity: number;
}

interface ModalState {
  skillId: number;
  targetLevel: number;
  action: "upgrade" | "branchA" | "branchB" | "none";
  branchSide: number;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

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
  const [modal, setModal] = useState<ModalState | null>(null);
  const swiperRef = useRef<SwiperType | null>(null);

  const cubeBalanceNumber = Number(cubeBalance);

  const skills: SkillInfo[] = skillTree?.skills ?? Array.from({ length: 15 }, () => ({
    level: 0,
    branchChosen: false,
    branchId: 0,
  }));

  const handleSlideChange = useCallback((swiper: SwiperType) => {
    setActiveIndex(swiper.activeIndex);
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
      setModal(null);
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
      setModal(null);
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
      setModal(null);
    }
  }, [account, systemCalls]);

  const handleNodeClick = useCallback((node: TreeNodeData) => {
    setModal({
      skillId: node.skillId,
      targetLevel: node.targetLevel,
      action: node.action,
      branchSide: node.branchSide,
    });
  }, []);

  return (
    <div className="h-screen-viewport flex flex-col text-white">
      <PageTopBar title="SKILL TREE" onBack={goBack} cubeBalance={cubeBalance} />

      <div className="flex-1 min-h-0 relative overflow-hidden bg-slate-900/95">
        <Swiper
          slidesPerView={1}
          spaceBetween={0}
          onSwiper={(s) => { swiperRef.current = s; }}
          onSlideChange={handleSlideChange}
          className="h-full w-full"
        >
          {ARCHETYPE_ORDER.map((archetypeId) => (
            <SwiperSlide key={archetypeId}>
              <TreeSlide
                archetypeId={archetypeId}
                skills={skills}
                busySkillId={busySkillId}
                cubeBalance={cubeBalanceNumber}
                onNodeClick={handleNodeClick}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        {activeIndex > 0 && (
          <button
            type="button"
            className="absolute left-1.5 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-black/50 p-1.5 text-white/70 transition-colors hover:bg-black/70 hover:text-white"
            onClick={() => swiperRef.current?.slidePrev()}
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {activeIndex < ARCHETYPE_ORDER.length - 1 && (
          <button
            type="button"
            className="absolute right-1.5 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-black/50 p-1.5 text-white/70 transition-colors hover:bg-black/70 hover:text-white"
            onClick={() => swiperRef.current?.slideNext()}
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {modal && (
        <SkillModal
          modal={modal}
          skills={skills}
          cubeBalance={cubeBalanceNumber}
          isBusy={busySkillId === modal.skillId}
          onUpgrade={handleUpgrade}
          onBranch={handleBranch}
          onRespec={handleRespec}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  TreeSlide                                                          */
/* ------------------------------------------------------------------ */

interface TreeSlideProps {
  archetypeId: ArchetypeId;
  skills: SkillInfo[];
  busySkillId: number | null;
  cubeBalance: number;
  onNodeClick: (node: TreeNodeData) => void;
}

const TreeSlide: React.FC<TreeSlideProps> = ({
  archetypeId,
  skills,
  busySkillId,
  cubeBalance,
  onNodeClick,
}) => {
  const archetype = ARCHETYPES[archetypeId];
  const archetypeSkills = getSkillsByArchetype(archetypeId);
  const iconSrc = getCommonAssetPath(`archetypes/archetype-${archetypeId}.png`);

  const treeData = useMemo(
    () => buildTreeData(archetypeSkills, skills, archetype.color, cubeBalance),
    [archetypeSkills, skills, archetype.color, cubeBalance],
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 bg-slate-900/95 flex flex-col overflow-hidden">
        {/* Archetype header */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-700/30 flex-shrink-0">
          <div
            className="w-10 h-10 rounded-lg overflow-hidden border-2 flex-shrink-0"
            style={{ borderColor: archetype.color + "66" }}
          >
            <img src={iconSrc} alt={archetype.name} className="w-full h-full object-cover" draggable={false} />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              className="font-['Fredericka_the_Great'] text-lg leading-tight"
              style={{ color: archetype.color }}
            >
              {archetype.name}
            </h2>
            <p className="text-xs text-slate-400 truncate">{archetype.description}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {ARCHETYPE_ORDER.map((id) => {
              const isActive = id === archetypeId;
              return (
                <div
                  key={id}
                  className={`w-2 h-2 rounded-full transition-all ${isActive ? "scale-125" : "opacity-40"}`}
                  style={{ backgroundColor: isActive ? archetype.color : "#94a3b8" }}
                />
              );
            })}
          </div>
        </div>

        {/* Skill name labels */}
        <div className="flex-shrink-0 flex items-end px-2 pt-1.5 pb-0.5">
          {archetypeSkills.map((skill) => (
            <div key={skill.id} className="flex-1 text-center min-w-0">
              <div
                className="font-bold text-slate-300 leading-tight truncate"
                style={{ fontSize: "clamp(10px, 1.5vw, 14px)" }}
              >
                {skill.name}
              </div>
              <div className="text-slate-500" style={{ fontSize: "clamp(8px, 1.2vw, 11px)" }}>
                {skill.category === "bonus" ? "Active" : "Passive"}
              </div>
            </div>
          ))}
        </div>

        {/* Tree area — pure CSS positioned nodes + div lines */}
        <div className="flex-1 min-h-0 relative">
          <style>{`
            @keyframes skill-pulse {
              0%, 100% { opacity: 0.3; }
              50% { opacity: 0.8; }
            }
            .skill-node-pulse { animation: skill-pulse 2s ease-in-out infinite; }
          `}</style>

          {/* Connection lines (behind nodes) */}
          {treeData.lines.map((line) => (
            <TreeLine key={line.key} line={line} />
          ))}

          {/* Nodes (on top of lines) */}
          {treeData.nodes.map((node) => (
            <TreeNode
              key={node.key}
              node={node}
              isBusy={busySkillId === node.skillId}
              onClick={onNodeClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Tree Node (pure HTML/CSS)                                          */
/* ------------------------------------------------------------------ */

interface TreeNodeProps {
  node: TreeNodeData;
  isBusy: boolean;
  onClick: (node: TreeNodeData) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, isBusy, onClick }) => {
  const nodeSize = node.isCore
    ? "clamp(30px, calc(2.2vw + 2.2vh + 4px), 54px)"
    : "clamp(24px, calc(1.8vw + 1.8vh + 4px), 46px)";
  const badgeSize = "clamp(13px, calc(0.8vw + 0.8vh + 2px), 22px)";
  const badgeFont = "clamp(6px, calc(0.4vw + 0.4vh + 1px), 11px)";
  const borderW = node.isCore ? 2 : 1.5;

  return (
    <div
      className="absolute z-10 group"
      style={{
        left: `${node.xPct}%`,
        top: `${node.yPct}%`,
        transform: "translate(-50%, -50%)",
        opacity: node.nodeOpacity,
      }}
      onClick={() => onClick(node)}
    >
      <div
        className="relative cursor-pointer transition-transform duration-150 group-hover:scale-110"
        style={{ width: nodeSize, height: nodeSize }}
      >
        {/* Unlocked glow ring */}
        {node.unlocked && (
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              inset: "-3px",
              border: `1px solid ${node.color}40`,
            }}
          />
        )}

        {/* Pulse ring for next affordable upgrade */}
        {node.isNext && node.canAfford && !isBusy && (
          <div
            className="absolute rounded-full pointer-events-none skill-node-pulse"
            style={{
              inset: "-5px",
              border: `1.5px solid ${node.color}`,
            }}
          />
        )}

        {/* Main circle */}
        <div
          className="w-full h-full rounded-full overflow-hidden"
          style={{
            borderWidth: `${borderW}px`,
            borderStyle: "solid",
            borderColor: node.borderColor,
            backgroundColor: node.unlocked ? "#1e293b" : "#0f172a",
          }}
        >
          <img
            src={node.iconSrc}
            alt=""
            className="w-full h-full object-cover"
            style={{
              opacity: node.iconOpacity,
              filter: node.iconFilter || undefined,
            }}
            draggable={false}
          />
        </div>

        {/* Badge */}
        <div
          className="absolute rounded-full flex items-center justify-center"
          style={{
            bottom: "-2px",
            right: "-2px",
            width: badgeSize,
            height: badgeSize,
            backgroundColor: "rgba(0,0,0,0.85)",
            border: `1px solid ${node.borderColor}`,
          }}
        >
          <span
            className="font-bold leading-none"
            style={{
              fontSize: badgeFont,
              color: node.badgeColor,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {node.badgeLabel}
          </span>
        </div>

        {/* Busy spinner */}
        {isBusy && (
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
            <Loader2 size={12} className="animate-spin text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Tree Line (pure CSS div)                                           */
/* ------------------------------------------------------------------ */

const TreeLine: React.FC<{ line: LineData }> = ({ line }) => {
  const isVertical = line.x1 === line.x2;

  if (isVertical) {
    const top = Math.min(line.y1, line.y2);
    const height = Math.abs(line.y2 - line.y1);
    return (
      <div
        className="absolute"
        style={{
          left: `${line.x1}%`,
          top: `${top}%`,
          width: "2px",
          height: `${height}%`,
          transform: "translateX(-50%)",
          backgroundColor: line.color,
          opacity: line.opacity,
        }}
      />
    );
  }

  // Horizontal
  const left = Math.min(line.x1, line.x2);
  const width = Math.abs(line.x2 - line.x1);
  return (
    <div
      className="absolute"
      style={{
        left: `${left}%`,
        top: `${line.y1}%`,
        width: `${width}%`,
        height: "2px",
        transform: "translateY(-50%)",
        backgroundColor: line.color,
        opacity: line.opacity,
      }}
    />
  );
};

/* ------------------------------------------------------------------ */
/*  Skill detail modal                                                 */
/* ------------------------------------------------------------------ */

interface SkillModalProps {
  modal: ModalState;
  skills: SkillInfo[];
  cubeBalance: number;
  isBusy: boolean;
  onUpgrade: (skillId: number) => void;
  onBranch: (skillId: number, branch: number) => void;
  onRespec: (skillId: number) => void;
  onClose: () => void;
}

const SkillModal: React.FC<SkillModalProps> = ({
  modal,
  skills,
  cubeBalance,
  isBusy,
  onUpgrade,
  onBranch,
  onRespec,
  onClose,
}) => {
  const { skillId, targetLevel, branchSide } = modal;
  const skill = SKILLS[skillId];
  const info = skills[skillId - 1] ?? { level: 0, branchChosen: false, branchId: 0 };
  const archetype = ARCHETYPES[skill.archetype];
  const color = archetype.color;

  const currentLevel = info.level;
  const isBranchRow = targetLevel >= 5;
  const isForkRow = targetLevel === 5;
  const needsChoice = isForkRow && currentLevel === 4 && !info.branchChosen;

  const branchForDesc =
    isBranchRow && info.branchChosen
      ? info.branchId + 1
      : isBranchRow && branchSide >= 0
        ? branchSide + 1
        : undefined;

  const currentEffect =
    currentLevel > 0
      ? getSkillEffectDescription(
          skillId,
          currentLevel,
          currentLevel >= 5 && info.branchChosen ? info.branchId + 1 : undefined,
        )
      : null;

  const thisEffect = getSkillEffectDescription(skillId, targetLevel, branchForDesc);

  const cost = SKILL_TREE_COSTS[targetLevel - 1];
  const isUnlocked = (() => {
    if (!isBranchRow) return currentLevel >= targetLevel;
    if (!info.branchChosen) return false;
    if (branchSide >= 0 && info.branchId !== branchSide) return false;
    return currentLevel >= targetLevel;
  })();

  const isNext = (() => {
    if (!isBranchRow) return currentLevel === targetLevel - 1;
    if (needsChoice) return true;
    if (!info.branchChosen) return false;
    if (branchSide >= 0 && info.branchId !== branchSide) return false;
    return currentLevel === targetLevel - 1;
  })();

  const canAfford = cubeBalance >= cost;
  const wrongBranch =
    isBranchRow && info.branchChosen && branchSide >= 0 && info.branchId !== branchSide;

  const futureLevels = useMemo(() => {
    const levels: { level: number; cost: number; effect: string; branchLabel?: string }[] = [];
    for (let lvl = targetLevel; lvl <= 9; lvl++) {
      const lvlCost = SKILL_TREE_COSTS[lvl - 1];
      if (lvl < 5) {
        levels.push({ level: lvl, cost: lvlCost, effect: getSkillEffectDescription(skillId, lvl) });
      } else {
        if (info.branchChosen) {
          levels.push({
            level: lvl,
            cost: lvlCost,
            effect: getSkillEffectDescription(skillId, lvl, info.branchId + 1),
            branchLabel: info.branchId === 0 ? skill.branchA : skill.branchB,
          });
        } else if (branchSide >= 0) {
          levels.push({
            level: lvl,
            cost: lvlCost,
            effect: getSkillEffectDescription(skillId, lvl, branchSide + 1),
            branchLabel: branchSide === 0 ? skill.branchA : skill.branchB,
          });
        } else {
          levels.push({
            level: lvl,
            cost: lvlCost,
            effect: getSkillEffectDescription(skillId, lvl, 1),
            branchLabel: `A: ${skill.branchA}`,
          });
          levels.push({
            level: lvl,
            cost: lvlCost,
            effect: getSkillEffectDescription(skillId, lvl, 2),
            branchLabel: `B: ${skill.branchB}`,
          });
        }
      }
    }
    return levels;
  }, [skillId, targetLevel, info, branchSide, skill]);

  const tier = getSkillTier(isUnlocked ? targetLevel : Math.max(0, targetLevel - 1));
  const iconSrc = getSkillTierIconPath(skill.name, tier);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] w-[92%] rounded-xl px-5 py-5 max-h-[85vh] overflow-hidden flex flex-col">
        <DialogTitle className="sr-only">{skill.name} Details</DialogTitle>

        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-xl overflow-hidden border-2 flex-shrink-0"
            style={{ borderColor: color + "88" }}
          >
            <img src={iconSrc} alt={skill.name} className="w-full h-full object-cover" draggable={false} />
          </div>
          <div className="min-w-0">
            <h3 className="font-['Fredericka_the_Great'] text-xl leading-tight" style={{ color }}>
              {skill.name}
            </h3>
            <p className="text-xs text-slate-400">{skill.description}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {archetype.name} • {skill.category === "bonus" ? "Active Bonus" : "Passive World"} • Level{" "}
              {currentLevel}/9
            </p>
          </div>
        </div>

        {/* Current level effect */}
        {currentEffect && (
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 mb-3">
            <div className="text-[10px] font-semibold text-slate-400 mb-0.5">CURRENT (Level {currentLevel})</div>
            <p className="text-xs text-emerald-300">{currentEffect}</p>
          </div>
        )}

        {/* This node's effect */}
        <div
          className="rounded-lg border px-3 py-2 mb-3"
          style={{
            borderColor: isUnlocked ? color + "44" : isNext ? color + "33" : "#334155",
            backgroundColor: isUnlocked ? color + "11" : isNext ? color + "08" : "rgba(15,23,42,0.5)",
          }}
        >
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-semibold" style={{ color }}>
              {isUnlocked ? `\u2713 LEVEL ${targetLevel}` : `LEVEL ${targetLevel}`}
              {isBranchRow && branchSide >= 0 && ` \u2014 ${branchSide === 0 ? skill.branchA : skill.branchB}`}
            </span>
            {!isUnlocked && <span className="text-[10px] text-slate-400">{fmtCost(cost)} CUBE</span>}
          </div>
          <p className={`text-xs ${isUnlocked ? "text-emerald-300" : "text-slate-200"}`}>{thisEffect}</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mb-3">
          {needsChoice ? (
            <>
              <button
                type="button"
                disabled={!canAfford || isBusy}
                onClick={() => onBranch(skillId, 0)}
                className="flex-1 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all disabled:opacity-40"
                style={{ backgroundColor: color + "22", color, border: `1px solid ${color}55` }}
              >
                {isBusy ? (
                  <Loader2 size={14} className="animate-spin mx-auto" />
                ) : (
                  <>
                    Choose {skill.branchA}
                    <span className="block text-[10px] opacity-60 mt-0.5">{fmtCost(cost)} CUBE</span>
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={!canAfford || isBusy}
                onClick={() => onBranch(skillId, 1)}
                className="flex-1 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all disabled:opacity-40"
                style={{ backgroundColor: color + "22", color, border: `1px solid ${color}55` }}
              >
                {isBusy ? (
                  <Loader2 size={14} className="animate-spin mx-auto" />
                ) : (
                  <>
                    Choose {skill.branchB}
                    <span className="block text-[10px] opacity-60 mt-0.5">{fmtCost(cost)} CUBE</span>
                  </>
                )}
              </button>
            </>
          ) : isNext && !wrongBranch ? (
            <button
              type="button"
              disabled={!canAfford || isBusy}
              onClick={() => onUpgrade(skillId)}
              className="flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all disabled:opacity-40"
              style={{
                backgroundColor: canAfford ? color + "22" : "#1e293b",
                color: canAfford ? color : "#64748b",
                border: `1px solid ${canAfford ? color + "55" : "#334155"}`,
              }}
            >
              {isBusy ? (
                <Loader2 size={14} className="animate-spin mx-auto" />
              ) : canAfford ? (
                `Upgrade \u2014 ${fmtCost(cost)} CUBE`
              ) : (
                `Need ${fmtCost(cost)} CUBE`
              )}
            </button>
          ) : isUnlocked ? (
            <div className="flex-1 rounded-lg px-3 py-2 text-xs text-center text-emerald-400 border border-emerald-900/40 bg-emerald-950/30">
              \u2713 Unlocked
            </div>
          ) : wrongBranch ? (
            <div className="flex-1 rounded-lg px-3 py-2 text-xs text-center text-slate-500 border border-slate-800">
              <Lock size={12} className="inline mr-1 -mt-0.5" />
              Wrong branch \u2014 you chose {info.branchId === 0 ? skill.branchA : skill.branchB}
            </div>
          ) : (
            <div className="flex-1 rounded-lg px-3 py-2 text-xs text-center text-slate-500 border border-slate-800">
              <Lock size={12} className="inline mr-1 -mt-0.5" />
              Reach level {targetLevel - 1} first
            </div>
          )}
        </div>

        {/* Respec option */}
        {isBranchRow && info.branchChosen && wrongBranch && (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => onRespec(skillId)}
            className="text-[10px] text-orange-400/80 hover:text-orange-400 transition-colors mb-3 text-center"
          >
            Respec branch (costs 50% of invested CUBE)
          </button>
        )}

        {/* Future levels preview */}
        {futureLevels.length > 0 && (
          <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1">
            <div className="text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              Upcoming Levels
            </div>
            <div className="space-y-1.5">
              {futureLevels.map((fl, idx) => {
                const isThisNode = fl.level === targetLevel && !fl.branchLabel?.startsWith("B");
                const flUnlocked = (() => {
                  if (fl.level < 5) return currentLevel >= fl.level;
                  if (!info.branchChosen) return false;
                  return currentLevel >= fl.level;
                })();
                return (
                  <div
                    key={`future-${fl.level}-${idx}`}
                    className={`flex items-start gap-2 rounded-md px-2.5 py-1.5 text-xs ${
                      isThisNode ? "bg-slate-800/80 border border-slate-700/50" : "bg-slate-900/40"
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          flUnlocked
                            ? "bg-emerald-900/50 text-emerald-400 border border-emerald-700/50"
                            : "bg-slate-800 text-slate-500 border border-slate-700/40"
                        }`}
                      >
                        {flUnlocked ? "\u2713" : fl.level}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {fl.branchLabel && (
                          <span className="text-[9px] px-1 py-px rounded bg-slate-800 text-slate-400 border border-slate-700/40">
                            {fl.branchLabel}
                          </span>
                        )}
                        <span className="text-[9px] text-slate-500">{fmtCost(fl.cost)}</span>
                      </div>
                      <p className={`text-[11px] mt-0.5 ${flUnlocked ? "text-emerald-300" : "text-slate-300"}`}>
                        {fl.effect}
                      </p>
                    </div>
                    {!flUnlocked && (
                      <ChevronRight size={12} className="flex-shrink-0 text-slate-600 mt-1" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

/* ------------------------------------------------------------------ */
/*  Build tree data                                                    */
/* ------------------------------------------------------------------ */

function buildTreeData(
  archetypeSkills: SkillDefinition[],
  allSkills: SkillInfo[],
  color: string,
  cubeBalance: number,
): { nodes: TreeNodeData[]; lines: LineData[] } {
  const nodes: TreeNodeData[] = [];
  const lines: LineData[] = [];

  archetypeSkills.forEach((skill, colIdx) => {
    const cx = COL_X[colIdx];
    const info = allSkills[skill.id - 1] ?? { level: 0, branchChosen: false, branchId: 0 };
    const skillDef = SKILLS[skill.id];

    // Core rows 0-3 (levels 1-4)
    for (let row = 0; row < 4; row++) {
      const targetLevel = row + 1;
      const cost = SKILL_TREE_COSTS[row];
      const unlocked = info.level >= targetLevel;
      const isNext = info.level === row;
      const canAfford = cubeBalance >= cost;

      const tier = getSkillTier(unlocked ? targetLevel : Math.max(0, targetLevel - 1));
      const iconSrc = getSkillTierIconPath(skillDef.name, tier);

      nodes.push({
        key: `core-${skill.id}-${row}`,
        xPct: cx,
        yPct: rowY(row),
        isCore: true,
        iconSrc,
        skillId: skill.id,
        targetLevel,
        unlocked,
        isNext,
        canAfford,
        dimmed: false,
        color,
        borderColor: unlocked ? color + "bb" : isNext ? color + "66" : "#1e293b55",
        nodeOpacity: 1,
        iconOpacity: unlocked ? 1 : isNext ? 0.6 : 0.25,
        iconFilter: !unlocked && !isNext ? "grayscale(1)" : "",
        badgeLabel: unlocked ? "\u2713" : fmtCost(cost),
        badgeColor: unlocked ? "#bbf7d0" : isNext ? "#fed7aa" : "#64748b",
        action: isNext && canAfford ? "upgrade" : "none",
        branchSide: -1,
      });

      // Vertical line to next core row
      if (row < 3) {
        const lit = info.level > targetLevel;
        lines.push({
          key: `vline-core-${skill.id}-${row}`,
          x1: cx, y1: rowY(row),
          x2: cx, y2: rowY(row + 1),
          color,
          opacity: lit ? 0.55 : 0.12,
        });
      }
    }

    // Fork: row 3 → row 4 (T-shape connector)
    const forkMidY = (rowY(3) + rowY(4)) / 2;
    const litA = info.branchChosen && info.branchId === 0 && info.level > 4;
    const litB = info.branchChosen && info.branchId === 1 && info.level > 4;
    const litGeneral = !info.branchChosen && info.level > 4;
    const forkLit = litA || litB || litGeneral;

    // Center vertical down
    lines.push({
      key: `fork-v-${skill.id}`,
      x1: cx, y1: rowY(3),
      x2: cx, y2: forkMidY,
      color,
      opacity: forkLit ? 0.55 : 0.12,
    });
    // Horizontal bar
    lines.push({
      key: `fork-h-${skill.id}`,
      x1: cx - BRANCH_OFF, y1: forkMidY,
      x2: cx + BRANCH_OFF, y2: forkMidY,
      color,
      opacity: forkLit ? 0.55 : 0.12,
    });
    // Down to branch A
    lines.push({
      key: `fork-a-${skill.id}`,
      x1: cx - BRANCH_OFF, y1: forkMidY,
      x2: cx - BRANCH_OFF, y2: rowY(4),
      color,
      opacity: litA || litGeneral ? 0.55 : 0.12,
    });
    // Down to branch B
    lines.push({
      key: `fork-b-${skill.id}`,
      x1: cx + BRANCH_OFF, y1: forkMidY,
      x2: cx + BRANCH_OFF, y2: rowY(4),
      color,
      opacity: litB || litGeneral ? 0.55 : 0.12,
    });

    // Branch rows 4-8 (levels 5-9)
    for (let row = 4; row < 9; row++) {
      const targetLevel = row + 1;
      const cost = SKILL_TREE_COSTS[row];
      const isForkRow = row === 4;
      const needsChoice = isForkRow && info.level === 4 && !info.branchChosen;

      // Branch A
      const nA = computeBranchNode(info, targetLevel, cost, cubeBalance, needsChoice, 0);
      const tierA = getSkillTier(nA.unlocked ? targetLevel : Math.max(0, targetLevel - 1));
      const iconSrcA = getSkillTierIconPath(skillDef.name, tierA);
      const wrongA = info.branchChosen && info.branchId !== 0;

      nodes.push({
        key: `brA-${skill.id}-${row}`,
        xPct: cx - BRANCH_OFF,
        yPct: rowY(row),
        isCore: false,
        iconSrc: iconSrcA,
        skillId: skill.id,
        targetLevel,
        unlocked: nA.unlocked,
        isNext: nA.isNext,
        canAfford: nA.canAfford,
        dimmed: wrongA && !needsChoice,
        color,
        borderColor: nA.unlocked
          ? color + "bb"
          : nA.isNext
            ? color + "66"
            : wrongA ? "#1e293b" : "#1e293b55",
        nodeOpacity: wrongA && !needsChoice ? 0.25 : 1,
        iconOpacity: nA.unlocked ? 1 : nA.isNext ? 0.6 : 0.25,
        iconFilter: !nA.unlocked && !nA.isNext ? "grayscale(1)" : "",
        badgeLabel: nA.unlocked ? "\u2713" : fmtCost(cost),
        badgeColor: nA.unlocked ? "#bbf7d0" : nA.isNext ? "#fed7aa" : "#64748b",
        action: needsChoice && nA.canAfford ? "branchA" : nA.isNext && nA.canAfford ? "upgrade" : "none",
        branchSide: 0,
      });

      // Branch B
      const nB = computeBranchNode(info, targetLevel, cost, cubeBalance, needsChoice, 1);
      const tierB = getSkillTier(nB.unlocked ? targetLevel : Math.max(0, targetLevel - 1));
      const iconSrcB = getSkillTierIconPath(skillDef.name, tierB);
      const wrongB = info.branchChosen && info.branchId !== 1;

      nodes.push({
        key: `brB-${skill.id}-${row}`,
        xPct: cx + BRANCH_OFF,
        yPct: rowY(row),
        isCore: false,
        iconSrc: iconSrcB,
        skillId: skill.id,
        targetLevel,
        unlocked: nB.unlocked,
        isNext: nB.isNext,
        canAfford: nB.canAfford,
        dimmed: wrongB && !needsChoice,
        color,
        borderColor: nB.unlocked
          ? color + "bb"
          : nB.isNext
            ? color + "66"
            : wrongB ? "#1e293b" : "#1e293b55",
        nodeOpacity: wrongB && !needsChoice ? 0.25 : 1,
        iconOpacity: nB.unlocked ? 1 : nB.isNext ? 0.6 : 0.25,
        iconFilter: !nB.unlocked && !nB.isNext ? "grayscale(1)" : "",
        badgeLabel: nB.unlocked ? "\u2713" : fmtCost(cost),
        badgeColor: nB.unlocked ? "#bbf7d0" : nB.isNext ? "#fed7aa" : "#64748b",
        action: needsChoice && nB.canAfford ? "branchB" : nB.isNext && nB.canAfford ? "upgrade" : "none",
        branchSide: 1,
      });

      // Branch vertical lines
      if (row < 8) {
        const bxA = cx - BRANCH_OFF;
        const bxB = cx + BRANCH_OFF;
        lines.push({
          key: `vline-brA-${skill.id}-${row}`,
          x1: bxA, y1: rowY(row),
          x2: bxA, y2: rowY(row + 1),
          color,
          opacity: info.branchChosen && info.branchId === 0 && info.level > targetLevel ? 0.55 : 0.1,
        });
        lines.push({
          key: `vline-brB-${skill.id}-${row}`,
          x1: bxB, y1: rowY(row),
          x2: bxB, y2: rowY(row + 1),
          color,
          opacity: info.branchChosen && info.branchId === 1 && info.level > targetLevel ? 0.55 : 0.1,
        });
      }
    }
  });

  return { nodes, lines };
}

function computeBranchNode(
  info: SkillInfo,
  targetLevel: number,
  cost: number,
  cubeBalance: number,
  needsChoice: boolean,
  branchIdx: number,
): { unlocked: boolean; isNext: boolean; canAfford: boolean } {
  const canAfford = cubeBalance >= cost;
  if (needsChoice) return { unlocked: false, isNext: true, canAfford };

  const chose = info.branchChosen;
  const isThisBranch = info.branchId === branchIdx;
  const unlocked = chose && isThisBranch && info.level >= targetLevel;
  const isNext = chose && isThisBranch && info.level === targetLevel - 1;
  const wrongBranch = chose && !isThisBranch;

  return {
    unlocked,
    isNext: isNext && !wrongBranch,
    canAfford: canAfford && !wrongBranch,
  };
}

export default SkillTreePage;

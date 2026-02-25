import { useState, useCallback, useMemo, useRef } from "react";
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
/*  Layout constants — all values in % of the tree container           */
/* ------------------------------------------------------------------ */

function fmtCost(cost: number): string {
  if (cost >= 1000)
    return `${(cost / 1000).toFixed(cost % 1000 === 0 ? 0 : 1)}K`;
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
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const SkillTreePage: React.FC = () => {
  const goBack = useNavigationStore((s) => s.goBack);
  const { cubeBalance } = useCubeBalance();
  const { skillTree, optimisticUpgrade, optimisticBranch, optimisticRespec } = useSkillTree();
  const { account } = useAccountCustom();
  const {
    setup: { systemCalls },
  } = useDojo();

  const [activeIndex, setActiveIndex] = useState(0);
  const [busySkillId, setBusySkillId] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const cubeBalanceNumber = Number(cubeBalance);

  // Swipe / drag gesture on the panel (touch + mouse)
  const panelRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const dragging = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) setActiveIndex((i) => Math.min(ARCHETYPE_ORDER.length - 1, i + 1));
    else setActiveIndex((i) => Math.max(0, i - 1));
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
  }, []);

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) setActiveIndex((i) => Math.min(ARCHETYPE_ORDER.length - 1, i + 1));
    else setActiveIndex((i) => Math.max(0, i - 1));
  }, []);

  const onMouseLeave = useCallback(() => {
    dragging.current = false;
  }, []);

  const skills: SkillInfo[] =
    skillTree?.skills ??
    Array.from({ length: 15 }, () => ({
      level: 0,
      branchChosen: false,
      branchId: 0,
    }));


  const handleUpgrade = useCallback(
    async (skillId: number) => {
      const info = skills[skillId - 1];
      if (!account || !info || info.level >= 9) return;
      if (info.level >= 4 && !info.branchChosen) return;
      const cost = SKILL_TREE_COSTS[info.level];
      if (cubeBalanceNumber < cost) return;
      try {
        setBusySkillId(skillId);
        await systemCalls.upgradeSkill({ account, skill_id: skillId });
        optimisticUpgrade(skillId);
      } catch (e) {
        console.error("upgrade_skill failed:", e);
      } finally {
        setBusySkillId(null);
        setModal(null);
      }
    },
    [account, skills, cubeBalanceNumber, systemCalls],
  );

  const handleBranch = useCallback(
    async (skillId: number, branch: number) => {
      if (!account) return;
      try {
        setBusySkillId(skillId);
        await systemCalls.chooseBranch({
          account,
          skill_id: skillId,
          branch_id: branch,
        });
        optimisticBranch(skillId, branch);
      } catch (e) {
        console.error("choose_branch failed:", e);
      } finally {
        setBusySkillId(null);
        setModal(null);
      }
    },
    [account, systemCalls],
  );

  const handleRespec = useCallback(
    async (skillId: number) => {
      if (!account) return;
      try {
        setBusySkillId(skillId);
        await systemCalls.respecBranch({ account, skill_id: skillId });
        optimisticRespec(skillId);
      } catch (e) {
        console.error("respec_branch failed:", e);
      } finally {
        setBusySkillId(null);
        setModal(null);
      }
    },
    [account, systemCalls],
  );

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
      <PageTopBar
        title="SKILL TREE"
        onBack={goBack}
        cubeBalance={cubeBalance}
      />

      {/* Pulse animation — defined once at page level */}
      <style>{`
        @keyframes skill-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        .skill-pulse { animation: skill-pulse 2s ease-in-out infinite; }
      `}</style>

      <div className="flex-1 min-h-0 flex items-center justify-center p-3 pt-1.5">
        <div
          ref={panelRef}
          className="relative w-full max-w-lg h-full rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-sm overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        >
          <TreeSlide
            archetypeId={ARCHETYPE_ORDER[activeIndex]}
            skills={skills}
            busySkillId={busySkillId}
            cubeBalance={cubeBalanceNumber}
            onNodeClick={handleNodeClick}
          />

          {/* Left arrow */}
          {activeIndex > 0 && (
            <button
              type="button"
              className="absolute left-1.5 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-black/50 p-1.5 text-white/70 hover:bg-black/70 hover:text-white"
              onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft size={18} />
            </button>
          )}

          {/* Right arrow */}
          {activeIndex < ARCHETYPE_ORDER.length - 1 && (
            <button
              type="button"
              className="absolute right-1.5 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-black/50 p-1.5 text-white/70 hover:bg-black/70 hover:text-white"
              onClick={() => setActiveIndex((i) => Math.min(ARCHETYPE_ORDER.length - 1, i + 1))}
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Skill detail modal */}
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
/*  TreeSlide — one archetype, fills the SwiperSlide                   */
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
  const iconSrc = getCommonAssetPath(
    `archetypes/archetype-${archetypeId}.png`,
  );

  const treeData = useMemo(
    () => buildTreeData(archetypeSkills, skills, archetype.color, cubeBalance),
    [archetypeSkills, skills, archetype.color, cubeBalance],
  );

  return (
    <div className="h-full flex flex-col">
      {/* ---- Archetype header ---- */}
      <div className="shrink-0 flex flex-col items-center gap-1 px-4 py-2.5 border-b border-white/10">
        <div
          className="w-10 h-10 rounded-lg overflow-hidden border-2 shrink-0"
          style={{ borderColor: archetype.color + '66' }}
        >
          <img
            src={iconSrc}
            alt={archetype.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
        <h2
          className="font-['Fredericka_the_Great'] text-base leading-tight text-center"
          style={{ color: archetype.color }}
        >
          {archetype.name}
        </h2>
        <p className="text-[11px] text-slate-400 text-center truncate max-w-[80%]">{archetype.description}</p>
        <div className="flex gap-1.5">
          {ARCHETYPE_ORDER.map((id) => (
            <div
              key={id}
              className={`w-2 h-2 rounded-full ${id === archetypeId ? 'scale-125' : 'opacity-40'}`}
              style={{ backgroundColor: id === archetypeId ? archetype.color : '#94a3b8' }}
            />
          ))}
        </div>
      </div>

      {/* ---- Skill name labels (CSS Grid) ---- */}
      <div className="shrink-0 grid grid-cols-3 text-center py-1.5 px-2">
        {archetypeSkills.map((skill) => (
          <div key={skill.id} className="min-w-0 px-1">
            <div
              className="font-bold text-slate-300 truncate"
              style={{ fontSize: "clamp(10px, 1.6vw, 14px)" }}
            >
              {skill.name}
            </div>
            <div
              className="text-slate-500"
              style={{ fontSize: "clamp(8px, 1.2vw, 11px)" }}
            >
              {skill.category === "bonus" ? "Active" : "Passive"}
            </div>
          </div>
        ))}
      </div>

      {/* ---- Tree area — takes ALL remaining height ---- */}
      <div className="flex-1 min-h-0 relative">
        {/* Connection lines (z-0, behind nodes) */}
        {treeData.lines.map((line) => (
          <TreeLine key={line.key} line={line} />
        ))}

        {/* Nodes (z-10, on top) */}
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
  );
};

/* ------------------------------------------------------------------ */
/*  TreeNode                                                           */
/* ------------------------------------------------------------------ */

interface TreeNodeProps {
  node: TreeNodeData;
  isBusy: boolean;
  onClick: (node: TreeNodeData) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, isBusy, onClick }) => {
  const size = node.isCore
    ? "clamp(30px, calc(2.2vw + 2.2vh + 4px), 54px)"
    : "clamp(24px, calc(1.8vw + 1.8vh + 4px), 46px)";
  const badgeSize = "clamp(13px, calc(0.8vw + 0.8vh + 2px), 22px)";
  const badgeFont = "clamp(6px, calc(0.4vw + 0.4vh + 1px), 11px)";
  const bw = node.isCore ? 2 : 1.5;

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
        style={{ width: size, height: size }}
      >
        {/* Unlocked glow */}
        {node.unlocked && (
          <div
            className="absolute rounded-full pointer-events-none"
            style={{ inset: "-3px", border: `1px solid ${node.color}40` }}
          />
        )}

        {/* Pulse for next-upgrade */}
        {node.isNext && node.canAfford && !isBusy && (
          <div
            className="absolute rounded-full pointer-events-none skill-pulse"
            style={{ inset: "-5px", border: `1.5px solid ${node.color}` }}
          />
        )}

        {/* Circle */}
        <div
          className="w-full h-full rounded-full overflow-hidden"
          style={{
            borderWidth: `${bw}px`,
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

        {/* Cost / checkmark badge */}
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

        {/* Busy */}
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
/*  TreeLine                                                           */
/* ------------------------------------------------------------------ */

const TreeLine: React.FC<{ line: LineData }> = ({ line }) => {
  const isVertical = line.x1 === line.x2;

  return isVertical ? (
    <div
      className="absolute"
      style={{
        left: `${line.x1}%`,
        top: `${Math.min(line.y1, line.y2)}%`,
        width: 2,
        height: `${Math.abs(line.y2 - line.y1)}%`,
        transform: "translateX(-50%)",
        backgroundColor: line.color,
        opacity: line.opacity,
      }}
    />
  ) : (
    <div
      className="absolute"
      style={{
        left: `${Math.min(line.x1, line.x2)}%`,
        top: `${line.y1}%`,
        width: `${Math.abs(line.x2 - line.x1)}%`,
        height: 2,
        transform: "translateY(-50%)",
        backgroundColor: line.color,
        opacity: line.opacity,
      }}
    />
  );
};

/* ------------------------------------------------------------------ */
/*  SkillModal                                                         */
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
  const info = skills[skillId - 1] ?? {
    level: 0,
    branchChosen: false,
    branchId: 0,
  };
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
          currentLevel >= 5 && info.branchChosen
            ? info.branchId + 1
            : undefined,
        )
      : null;

  const thisEffect = getSkillEffectDescription(
    skillId,
    targetLevel,
    branchForDesc,
  );
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
    isBranchRow &&
    info.branchChosen &&
    branchSide >= 0 &&
    info.branchId !== branchSide;

  const futureLevels = useMemo(() => {
    const levels: {
      level: number;
      cost: number;
      effect: string;
      branchLabel?: string;
    }[] = [];
    for (let lvl = targetLevel; lvl <= 9; lvl++) {
      const c = SKILL_TREE_COSTS[lvl - 1];
      if (lvl < 5) {
        levels.push({
          level: lvl,
          cost: c,
          effect: getSkillEffectDescription(skillId, lvl),
        });
      } else if (info.branchChosen) {
        levels.push({
          level: lvl,
          cost: c,
          effect: getSkillEffectDescription(skillId, lvl, info.branchId + 1),
          branchLabel: info.branchId === 0 ? skill.branchA : skill.branchB,
        });
      } else if (branchSide >= 0) {
        levels.push({
          level: lvl,
          cost: c,
          effect: getSkillEffectDescription(skillId, lvl, branchSide + 1),
          branchLabel: branchSide === 0 ? skill.branchA : skill.branchB,
        });
      } else {
        levels.push({
          level: lvl,
          cost: c,
          effect: getSkillEffectDescription(skillId, lvl, 1),
          branchLabel: `A: ${skill.branchA}`,
        });
        levels.push({
          level: lvl,
          cost: c,
          effect: getSkillEffectDescription(skillId, lvl, 2),
          branchLabel: `B: ${skill.branchB}`,
        });
      }
    }
    return levels;
  }, [skillId, targetLevel, info, branchSide, skill]);

  const tier = getSkillTier(
    isUnlocked ? targetLevel : Math.max(0, targetLevel - 1),
  );
  const iconSrc = getSkillTierIconPath(skill.name, tier);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[420px] w-[92%] rounded-xl px-5 py-5 max-h-[85vh] overflow-hidden flex flex-col">
        <DialogTitle className="sr-only">{skill.name} Details</DialogTitle>

        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0"
            style={{ borderColor: color + "88" }}
          >
            <img
              src={iconSrc}
              alt={skill.name}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
          <div className="min-w-0">
            <h3
              className="font-['Fredericka_the_Great'] text-xl leading-tight"
              style={{ color }}
            >
              {skill.name}
            </h3>
            <p className="text-xs text-slate-400">{skill.description}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {archetype.name} •{" "}
              {skill.category === "bonus" ? "Active Bonus" : "Passive World"} •
              Level {currentLevel + 1}/10
            </p>
          </div>
        </div>

        {/* Current effect */}
        {currentEffect && (
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 mb-3">
            <div className="text-[10px] font-semibold text-slate-400 mb-0.5">
              CURRENT (Level {currentLevel + 1})
            </div>
            <p className="text-xs text-emerald-300">{currentEffect}</p>
          </div>
        )}

        {/* This node */}
        <div
          className="rounded-lg border px-3 py-2 mb-3"
          style={{
            borderColor: isUnlocked
              ? color + "44"
              : isNext
                ? color + "33"
                : "#334155",
            backgroundColor: isUnlocked
              ? color + "11"
              : isNext
                ? color + "08"
                : "rgba(15,23,42,0.5)",
          }}
        >
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-semibold" style={{ color }}>
              {isUnlocked
                ? `\u2713 LEVEL ${targetLevel + 1}`
                : `LEVEL ${targetLevel + 1}`}
              {isBranchRow &&
                branchSide >= 0 &&
                ` \u2014 ${branchSide === 0 ? skill.branchA : skill.branchB}`}
            </span>
            {!isUnlocked && (
              <span className="text-[10px] text-slate-400">
                {fmtCost(cost)} CUBE
              </span>
            )}
          </div>
          <p
            className={`text-xs ${isUnlocked ? "text-emerald-300" : "text-slate-200"}`}
          >
            {thisEffect}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mb-3">
          {needsChoice ? (
            <>
              <button
                type="button"
                disabled={!canAfford || isBusy}
                onClick={() => onBranch(skillId, 0)}
                className="flex-1 rounded-lg px-3 py-2.5 text-xs font-semibold disabled:opacity-40"
                style={{
                  backgroundColor: color + "22",
                  color,
                  border: `1px solid ${color}55`,
                }}
              >
                {isBusy ? (
                  <Loader2 size={14} className="animate-spin mx-auto" />
                ) : (
                  <>
                    Choose {skill.branchA}
                    <span className="block text-[10px] opacity-60 mt-0.5">
                      {fmtCost(cost)} CUBE
                    </span>
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={!canAfford || isBusy}
                onClick={() => onBranch(skillId, 1)}
                className="flex-1 rounded-lg px-3 py-2.5 text-xs font-semibold disabled:opacity-40"
                style={{
                  backgroundColor: color + "22",
                  color,
                  border: `1px solid ${color}55`,
                }}
              >
                {isBusy ? (
                  <Loader2 size={14} className="animate-spin mx-auto" />
                ) : (
                  <>
                    Choose {skill.branchB}
                    <span className="block text-[10px] opacity-60 mt-0.5">
                      {fmtCost(cost)} CUBE
                    </span>
                  </>
                )}
              </button>
            </>
          ) : isNext && !wrongBranch ? (
            <button
              type="button"
              disabled={!canAfford || isBusy}
              onClick={() => onUpgrade(skillId)}
              className="flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold disabled:opacity-40"
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
              Wrong branch \u2014 you chose{" "}
              {info.branchId === 0 ? skill.branchA : skill.branchB}
            </div>
          ) : (
            <div className="flex-1 rounded-lg px-3 py-2 text-xs text-center text-slate-500 border border-slate-800">
              <Lock size={12} className="inline mr-1 -mt-0.5" />
              Reach level {targetLevel} first
            </div>
          )}
        </div>

        {/* Respec */}
        {isBranchRow && info.branchChosen && wrongBranch && (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => onRespec(skillId)}
            className="text-[10px] text-orange-400/80 hover:text-orange-400 mb-3 text-center"
          >
            Respec branch (costs 50% of invested CUBE)
          </button>
        )}

        {/* Future levels */}
        {futureLevels.length > 0 && (
          <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1">
            <div className="text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              Upcoming Levels
            </div>
            <div className="space-y-1.5">
              {futureLevels.map((fl, idx) => {
                const isThis =
                  fl.level === targetLevel &&
                  !fl.branchLabel?.startsWith("B");
                const done = (() => {
                  if (fl.level < 5) return currentLevel >= fl.level;
                  if (!info.branchChosen) return false;
                  return currentLevel >= fl.level;
                })();
                return (
                  <div
                    key={`fl-${fl.level}-${idx}`}
                    className={`flex items-start gap-2 rounded-md px-2.5 py-1.5 text-xs ${isThis ? "bg-slate-800/80 border border-slate-700/50" : "bg-slate-900/40"}`}
                  >
                    <div className="shrink-0 mt-0.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${done ? "bg-emerald-900/50 text-emerald-400 border border-emerald-700/50" : "bg-slate-800 text-slate-500 border border-slate-700/40"}`}
                      >
                        {done ? "\u2713" : fl.level + 1}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {fl.branchLabel && (
                          <span className="text-[9px] px-1 py-px rounded bg-slate-800 text-slate-400 border border-slate-700/40">
                            {fl.branchLabel}
                          </span>
                        )}
                        <span className="text-[9px] text-slate-500">
                          {fmtCost(fl.cost)}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] mt-0.5 ${done ? "text-emerald-300" : "text-slate-300"}`}
                      >
                        {fl.effect}
                      </p>
                    </div>
                    {!done && (
                      <ChevronRight
                        size={12}
                        className="shrink-0 text-slate-600 mt-1"
                      />
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
    const info = allSkills[skill.id - 1] ?? {
      level: 0,
      branchChosen: false,
      branchId: 0,
    };
    const def = SKILLS[skill.id];

    /* --- core rows 0-3 --- */
    for (let row = 0; row < 4; row++) {
      const tl = row + 1;
      const cost = SKILL_TREE_COSTS[row];
      const unlocked = info.level >= tl;
      const isNext = info.level === row;
      const canAfford = cubeBalance >= cost;
      const tier = getSkillTier(unlocked ? tl : Math.max(0, tl - 1));

      nodes.push({
        key: `c-${skill.id}-${row}`,
        xPct: cx,
        yPct: rowY(row),
        isCore: true,
        iconSrc: getSkillTierIconPath(def.name, tier),
        skillId: skill.id,
        targetLevel: tl,
        unlocked,
        isNext,
        canAfford,
        dimmed: false,
        color,
        borderColor: unlocked
          ? color + "bb"
          : isNext
            ? color + "66"
            : "#1e293b55",
        nodeOpacity: 1,
        iconOpacity: unlocked ? 1 : isNext ? 0.6 : 0.25,
        iconFilter: !unlocked && !isNext ? "grayscale(1)" : "",
        badgeLabel: unlocked ? "\u2713" : fmtCost(cost),
        badgeColor: unlocked
          ? "#bbf7d0"
          : isNext
            ? "#fed7aa"
            : "#64748b",
        action: isNext && canAfford ? "upgrade" : "none",
        branchSide: -1,
      });

      if (row < 3) {
        lines.push({
          key: `vc-${skill.id}-${row}`,
          x1: cx,
          y1: rowY(row),
          x2: cx,
          y2: rowY(row + 1),
          color,
          opacity: info.level > tl ? 0.55 : 0.12,
        });
      }
    }

    /* --- fork (row 3 → 4) T-shape --- */
    const midY = (rowY(3) + rowY(4)) / 2;
    const lA = info.branchChosen && info.branchId === 0 && info.level > 4;
    const lB = info.branchChosen && info.branchId === 1 && info.level > 4;
    const lG = !info.branchChosen && info.level > 4;
    const fk = lA || lB || lG;

    lines.push({
      key: `fv-${skill.id}`,
      x1: cx,
      y1: rowY(3),
      x2: cx,
      y2: midY,
      color,
      opacity: fk ? 0.55 : 0.12,
    });
    lines.push({
      key: `fh-${skill.id}`,
      x1: cx - BRANCH_OFF,
      y1: midY,
      x2: cx + BRANCH_OFF,
      y2: midY,
      color,
      opacity: fk ? 0.55 : 0.12,
    });
    lines.push({
      key: `fa-${skill.id}`,
      x1: cx - BRANCH_OFF,
      y1: midY,
      x2: cx - BRANCH_OFF,
      y2: rowY(4),
      color,
      opacity: lA || lG ? 0.55 : 0.12,
    });
    lines.push({
      key: `fb-${skill.id}`,
      x1: cx + BRANCH_OFF,
      y1: midY,
      x2: cx + BRANCH_OFF,
      y2: rowY(4),
      color,
      opacity: lB || lG ? 0.55 : 0.12,
    });

    /* --- branch rows 4-8 --- */
    for (let row = 4; row < 9; row++) {
      const tl = row + 1;
      const cost = SKILL_TREE_COSTS[row];
      const fork = row === 4;
      const nc = fork && info.level === 4 && !info.branchChosen;

      for (const side of [0, 1] as const) {
        const n = computeBranchNode(info, tl, cost, cubeBalance, nc, side);
        const tier = getSkillTier(
          n.unlocked ? tl : Math.max(0, tl - 1),
        );
        const wrong = info.branchChosen && info.branchId !== side;
        const bx = side === 0 ? cx - BRANCH_OFF : cx + BRANCH_OFF;

        nodes.push({
          key: `b${side}-${skill.id}-${row}`,
          xPct: bx,
          yPct: rowY(row),
          isCore: false,
          iconSrc: getSkillTierIconPath(def.name, tier),
          skillId: skill.id,
          targetLevel: tl,
          unlocked: n.unlocked,
          isNext: n.isNext,
          canAfford: n.canAfford,
          dimmed: wrong && !nc,
          color,
          borderColor: n.unlocked
            ? color + "bb"
            : n.isNext
              ? color + "66"
              : wrong
                ? "#1e293b"
                : "#1e293b55",
          nodeOpacity: wrong && !nc ? 0.25 : 1,
          iconOpacity: n.unlocked ? 1 : n.isNext ? 0.6 : 0.25,
          iconFilter: !n.unlocked && !n.isNext ? "grayscale(1)" : "",
          badgeLabel: n.unlocked ? "\u2713" : fmtCost(cost),
          badgeColor: n.unlocked
            ? "#bbf7d0"
            : n.isNext
              ? "#fed7aa"
              : "#64748b",
          action: nc && n.canAfford
            ? side === 0
              ? "branchA"
              : "branchB"
            : n.isNext && n.canAfford
              ? "upgrade"
              : "none",
          branchSide: side,
        });

        if (row < 8) {
          lines.push({
            key: `vb${side}-${skill.id}-${row}`,
            x1: bx,
            y1: rowY(row),
            x2: bx,
            y2: rowY(row + 1),
            color,
            opacity:
              info.branchChosen &&
              info.branchId === side &&
              info.level > tl
                ? 0.55
                : 0.1,
          });
        }
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
  const mine = info.branchId === branchIdx;
  const unlocked = chose && mine && info.level >= targetLevel;
  const isNext = chose && mine && info.level === targetLevel - 1;
  const wrong = chose && !mine;
  return {
    unlocked,
    isNext: isNext && !wrong,
    canAfford: canAfford && !wrong,
  };
}

export default SkillTreePage;

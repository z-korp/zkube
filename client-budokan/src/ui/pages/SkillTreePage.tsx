import { useState, useCallback, useRef, useMemo } from "react";
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
  type SkillDefinition,
} from "@/dojo/game/types/skillData";
import { SKILL_TREE_COSTS } from "@/dojo/game/helpers/runDataPacking";
import { getCommonAssetPath } from "@/config/themes";
import { getSkillTierIconPath } from "@/ui/theme/ImageAssets";
import PageTopBar from "@/ui/navigation/PageTopBar";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Format cost for display */
function fmtCost(cost: number): string {
  if (cost >= 1000) return `${(cost / 1000).toFixed(cost % 1000 === 0 ? 0 : 1)}K`;
  return String(cost);
}

// SVG viewBox dimensions
const VB_W = 100;
const VB_H = 130;

// Node radii (SVG units)
const R_CORE = 4.2;
const R_BRANCH = 3.4;

// Column X positions (3 skill columns)
const COL_X = [17, 50, 83];
// Branch offsets from column center
const BRANCH_OFF = 5.5;

// Row Y positions — 9 rows
const ROW_START_Y = 14;
const ROW_GAP = 12;

function rowY(row: number): number {
  return ROW_START_Y + row * ROW_GAP;
}

// Badge for cost/level label
const BADGE_R = 2.0;
const BADGE_FONT = 1.5;

/* ------------------------------------------------------------------ */
/*  Skill Info type                                                    */
/* ------------------------------------------------------------------ */

interface SkillInfo {
  level: number;
  branchChosen: boolean;
  branchId: number;
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
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  TreeSlide — SVG-based skill tree inside a dark panel               */
/* ------------------------------------------------------------------ */

interface TreeSlideProps {
  archetypeId: ArchetypeId;
  skills: SkillInfo[];
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

  // Build all SVG node/path data
  const treeData = useMemo(() => {
    return buildTreeData(archetypeSkills, skills, archetype.color, cubeBalance);
  }, [archetypeSkills, skills, archetype.color, cubeBalance]);

  return (
    <div className="h-full overflow-y-auto px-2 py-2">
      {/* Archetype header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-center gap-2.5 mb-2 max-w-[440px] mx-auto px-2"
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

      {/* Dark panel with SVG tree */}
      <div className="mx-auto max-w-[440px] rounded-2xl border border-slate-700/50 bg-slate-900/90 p-2 overflow-hidden">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-auto"
        >
          {/* Pulse animation for available nodes */}
          <defs>
            <style>{`
              @keyframes node-pulse {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 0.8; }
              }
              .skill-node-pulse {
                animation: node-pulse 2s ease-in-out infinite;
              }
            `}</style>
          </defs>

          {/* Skill name labels at top */}
          {archetypeSkills.map((skill, colIdx) => (
            <text
              key={`label-${skill.id}`}
              x={COL_X[colIdx]}
              y={ROW_START_Y - 7}
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize={2.8}
              fontWeight="bold"
              fontFamily="system-ui, sans-serif"
            >
              {skill.name}
            </text>
          ))}

          {/* Category sub-label */}
          {archetypeSkills.map((skill, colIdx) => (
            <text
              key={`cat-${skill.id}`}
              x={COL_X[colIdx]}
              y={ROW_START_Y - 4}
              textAnchor="middle"
              fill="#475569"
              fontSize={1.8}
              fontFamily="system-ui, sans-serif"
            >
              {skill.category === "bonus" ? "Active" : "World"}
            </text>
          ))}

          {/* Paths (render behind nodes) */}
          {treeData.paths.map((p, i) => (
            <path
              key={`path-${i}`}
              d={p.d}
              fill="none"
              stroke={p.color}
              strokeWidth={p.strokeWidth}
              strokeLinecap="round"
              opacity={p.opacity}
            />
          ))}

          {/* Nodes */}
          {treeData.nodes.map((node) => (
            <SvgNode
              key={node.key}
              node={node}
              isBusy={busySkillId === node.skillId}
              onUpgrade={onUpgrade}
              onBranch={onBranch}
              onRespec={onRespec}
            />
          ))}
        </svg>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  SVG Node rendering                                                 */
/* ------------------------------------------------------------------ */

interface TreeNodeData {
  key: string;
  cx: number;
  cy: number;
  r: number;
  iconSrc: string;
  skillId: number;
  targetLevel: number;
  unlocked: boolean;
  isNext: boolean;
  canAfford: boolean;
  dimmed: boolean;
  color: string;
  borderColor: string;
  borderWidth: number;
  nodeOpacity: number;
  iconOpacity: number;
  iconFilter: string;
  label: string;
  badgeLabel: string;
  badgeColor: string;
  action: "upgrade" | "branchA" | "branchB" | "none";
}

interface PathData {
  d: string;
  color: string;
  strokeWidth: number;
  opacity: number;
}

interface SvgNodeProps {
  node: TreeNodeData;
  isBusy: boolean;
  onUpgrade: (skillId: number) => void;
  onBranch: (skillId: number, branch: number) => void;
  onRespec: (skillId: number) => void;
}

const SvgNode: React.FC<SvgNodeProps> = ({ node, isBusy, onUpgrade, onBranch }) => {
  const clickable = node.isNext && node.canAfford && !isBusy && node.action !== "none";
  const clipId = `clip-${node.key}`;

  const handleClick = () => {
    if (!clickable) return;
    if (node.action === "upgrade") onUpgrade(node.skillId);
    else if (node.action === "branchA") onBranch(node.skillId, 0);
    else if (node.action === "branchB") onBranch(node.skillId, 1);
  };

  return (
    <g
      onClick={handleClick}
      style={{ cursor: clickable ? "pointer" : "default" }}
      opacity={node.nodeOpacity}
    >
      {/* Clip path for round icon */}
      <clipPath id={clipId}>
        <circle cx={node.cx} cy={node.cy} r={node.r} />
      </clipPath>

      {/* Background fill */}
      <circle
        cx={node.cx}
        cy={node.cy}
        r={node.r}
        fill={node.unlocked ? "#1e293b" : "#0f172a"}
      />

      {/* Skill icon */}
      <image
        href={node.iconSrc}
        x={node.cx - node.r}
        y={node.cy - node.r}
        width={node.r * 2}
        height={node.r * 2}
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${clipId})`}
        opacity={node.iconOpacity}
        filter={node.iconFilter || undefined}
      />

      {/* Border circle */}
      <circle
        cx={node.cx}
        cy={node.cy}
        r={node.r}
        fill="none"
        stroke={node.borderColor}
        strokeWidth={node.borderWidth}
      />

      {/* Glow for unlocked nodes */}
      {node.unlocked && (
        <circle
          cx={node.cx}
          cy={node.cy}
          r={node.r + 0.8}
          fill="none"
          stroke={node.color}
          strokeWidth={0.3}
          opacity={0.25}
        />
      )}

      {/* Pulse ring for available nodes */}
      {node.isNext && node.canAfford && !isBusy && (
        <circle
          cx={node.cx}
          cy={node.cy}
          r={node.r + 1}
          fill="none"
          stroke={node.color}
          strokeWidth={0.3}
          className="skill-node-pulse"
        />
      )}

      {/* Busy spinner overlay */}
      {isBusy && (
        <>
          <circle cx={node.cx} cy={node.cy} r={node.r} fill="rgba(0,0,0,0.5)" />
          <foreignObject
            x={node.cx - 2}
            y={node.cy - 2}
            width={4}
            height={4}
          >
            <div className="flex items-center justify-center w-full h-full">
              <Loader2 size={12} className="animate-spin text-white" />
            </div>
          </foreignObject>
        </>
      )}

      {/* Branch label (A/B) at fork row */}
      {node.label && (
        <>
          <rect
            x={node.cx - 1.8}
            y={node.cy + node.r - 2}
            width={3.6}
            height={2}
            rx={0.5}
            fill="rgba(0,0,0,0.7)"
          />
          <text
            x={node.cx}
            y={node.cy + node.r - 0.8}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#cbd5e1"
            fontSize={1.4}
            fontWeight="bold"
            fontFamily="system-ui, sans-serif"
          >
            {node.label}
          </text>
        </>
      )}

      {/* Badge: cost or level */}
      <circle
        cx={node.cx + node.r * 0.7}
        cy={node.cy + node.r * 0.7}
        r={BADGE_R}
        fill="rgba(0,0,0,0.8)"
        stroke={node.borderColor}
        strokeWidth={0.2}
      />
      <text
        x={node.cx + node.r * 0.7}
        y={node.cy + node.r * 0.7 + 0.15}
        textAnchor="middle"
        dominantBaseline="central"
        fill={node.badgeColor}
        fontSize={BADGE_FONT}
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        {node.badgeLabel}
      </text>
    </g>
  );
};

/* ------------------------------------------------------------------ */
/*  Build tree data — nodes + paths for all 3 skill columns            */
/* ------------------------------------------------------------------ */

function buildTreeData(
  archetypeSkills: SkillDefinition[],
  allSkills: SkillInfo[],
  color: string,
  cubeBalance: number,
): { nodes: TreeNodeData[]; paths: PathData[] } {
  const nodes: TreeNodeData[] = [];
  const paths: PathData[] = [];

  archetypeSkills.forEach((skill, colIdx) => {
    const cx = COL_X[colIdx];
    const info = allSkills[skill.id - 1] ?? { level: 0, branchChosen: false, branchId: 0 };
    const skillDef = SKILLS[skill.id];

    // Rows 0-3: core single path
    for (let row = 0; row < 4; row++) {
      const targetLevel = row + 1;
      const cost = SKILL_TREE_COSTS[row];
      const unlocked = info.level >= targetLevel;
      const isNext = info.level === row; // level === targetLevel - 1
      const canAfford = cubeBalance >= cost;

      const tier = getSkillTier(unlocked ? targetLevel : Math.max(0, targetLevel - 1));
      const iconSrc = getSkillTierIconPath(skillDef.name, tier);

      const borderColor = unlocked ? color + "bb" : isNext ? color + "66" : "#1e293b55";
      const iconOpacity = unlocked ? 1 : isNext ? 0.6 : 0.25;

      nodes.push({
        key: `core-${skill.id}-${row}`,
        cx,
        cy: rowY(row),
        r: R_CORE,
        iconSrc,
        skillId: skill.id,
        targetLevel,
        unlocked,
        isNext,
        canAfford,
        dimmed: false,
        color,
        borderColor,
        borderWidth: unlocked ? 0.5 : 0.35,
        nodeOpacity: 1,
        iconOpacity,
        iconFilter: !unlocked && !isNext ? "grayscale(1)" : "",
        label: "",
        badgeLabel: unlocked ? "✓" : fmtCost(cost),
        badgeColor: unlocked ? "#bbf7d0" : isNext ? "#fed7aa" : "#64748b",
        action: isNext && canAfford ? "upgrade" : "none",
      });

      // Path to next core row
      if (row < 3) {
        const nextY = rowY(row + 1);
        const lit = info.level > targetLevel;
        const midY = (rowY(row) + nextY) / 2;
        paths.push({
          d: `M ${cx} ${rowY(row) + R_CORE} C ${cx} ${midY}, ${cx} ${midY}, ${cx} ${nextY - R_CORE}`,
          color,
          strokeWidth: 0.5,
          opacity: lit ? 0.55 : 0.12,
        });
      }
    }

    // Fork paths from row 3 → row 4 (level 4 → level 5 branch)
    const forkFromY = rowY(3) + R_CORE;
    const forkToY = rowY(4) - R_BRANCH;
    const forkMidY = (forkFromY + forkToY) / 2;
    const litFork = info.level > 4;
    const litA = info.branchChosen && info.branchId === 0 && info.level > 4;
    const litB = info.branchChosen && info.branchId === 1 && info.level > 4;

    // Path to branch A
    paths.push({
      d: `M ${cx} ${forkFromY} C ${cx} ${forkMidY}, ${cx - BRANCH_OFF} ${forkMidY}, ${cx - BRANCH_OFF} ${forkToY}`,
      color,
      strokeWidth: 0.5,
      opacity: litA || (!info.branchChosen && litFork) ? 0.55 : 0.12,
    });
    // Path to branch B
    paths.push({
      d: `M ${cx} ${forkFromY} C ${cx} ${forkMidY}, ${cx + BRANCH_OFF} ${forkMidY}, ${cx + BRANCH_OFF} ${forkToY}`,
      color,
      strokeWidth: 0.5,
      opacity: litB || (!info.branchChosen && litFork) ? 0.55 : 0.12,
    });

    // Rows 4-8: branch rows (A left, B right)
    for (let row = 4; row < 9; row++) {
      const targetLevel = row + 1;
      const cost = SKILL_TREE_COSTS[row];
      const isForkRow = row === 4;
      const needsChoice = isForkRow && info.level === 4 && !info.branchChosen;

      // Branch A node
      const nodeA = computeBranchNode(info, targetLevel, cost, cubeBalance, needsChoice, 0);
      const tierA = getSkillTier(nodeA.unlocked ? targetLevel : Math.max(0, targetLevel - 1));
      const iconSrcA = getSkillTierIconPath(skillDef.name, tierA);
      const wrongA = info.branchChosen && info.branchId !== 0;

      nodes.push({
        key: `brA-${skill.id}-${row}`,
        cx: cx - BRANCH_OFF,
        cy: rowY(row),
        r: R_BRANCH,
        iconSrc: iconSrcA,
        skillId: skill.id,
        targetLevel,
        unlocked: nodeA.unlocked,
        isNext: nodeA.isNext,
        canAfford: nodeA.canAfford,
        dimmed: wrongA && !needsChoice,
        color,
        borderColor: nodeA.unlocked ? color + "bb" : nodeA.isNext ? color + "66" : wrongA ? "#1e293b" : "#1e293b55",
        borderWidth: nodeA.unlocked ? 0.45 : 0.3,
        nodeOpacity: wrongA && !needsChoice ? 0.25 : 1,
        iconOpacity: nodeA.unlocked ? 1 : nodeA.isNext ? 0.6 : 0.25,
        iconFilter: !nodeA.unlocked && !nodeA.isNext ? "grayscale(1)" : "",
        label: isForkRow ? "A" : "",
        badgeLabel: nodeA.unlocked ? "✓" : fmtCost(cost),
        badgeColor: nodeA.unlocked ? "#bbf7d0" : nodeA.isNext ? "#fed7aa" : "#64748b",
        action: needsChoice && nodeA.canAfford ? "branchA" : nodeA.isNext && nodeA.canAfford ? "upgrade" : "none",
      });

      // Branch B node
      const nodeB = computeBranchNode(info, targetLevel, cost, cubeBalance, needsChoice, 1);
      const tierB = getSkillTier(nodeB.unlocked ? targetLevel : Math.max(0, targetLevel - 1));
      const iconSrcB = getSkillTierIconPath(skillDef.name, tierB);
      const wrongB = info.branchChosen && info.branchId !== 1;

      nodes.push({
        key: `brB-${skill.id}-${row}`,
        cx: cx + BRANCH_OFF,
        cy: rowY(row),
        r: R_BRANCH,
        iconSrc: iconSrcB,
        skillId: skill.id,
        targetLevel,
        unlocked: nodeB.unlocked,
        isNext: nodeB.isNext,
        canAfford: nodeB.canAfford,
        dimmed: wrongB && !needsChoice,
        color,
        borderColor: nodeB.unlocked ? color + "bb" : nodeB.isNext ? color + "66" : wrongB ? "#1e293b" : "#1e293b55",
        borderWidth: nodeB.unlocked ? 0.45 : 0.3,
        nodeOpacity: wrongB && !needsChoice ? 0.25 : 1,
        iconOpacity: nodeB.unlocked ? 1 : nodeB.isNext ? 0.6 : 0.25,
        iconFilter: !nodeB.unlocked && !nodeB.isNext ? "grayscale(1)" : "",
        label: isForkRow ? "B" : "",
        badgeLabel: nodeB.unlocked ? "✓" : fmtCost(cost),
        badgeColor: nodeB.unlocked ? "#bbf7d0" : nodeB.isNext ? "#fed7aa" : "#64748b",
        action: needsChoice && nodeB.canAfford ? "branchB" : nodeB.isNext && nodeB.canAfford ? "upgrade" : "none",
      });

      // Paths between branch rows
      if (row < 8) {
        const nextY = rowY(row + 1);
        const midY = (rowY(row) + nextY) / 2;
        const bxA = cx - BRANCH_OFF;
        const bxB = cx + BRANCH_OFF;

        const litPathA = info.branchChosen && info.branchId === 0 && info.level > targetLevel;
        const litPathB = info.branchChosen && info.branchId === 1 && info.level > targetLevel;

        paths.push({
          d: `M ${bxA} ${rowY(row) + R_BRANCH} C ${bxA} ${midY}, ${bxA} ${midY}, ${bxA} ${nextY - R_BRANCH}`,
          color,
          strokeWidth: 0.4,
          opacity: litPathA ? 0.55 : 0.1,
        });
        paths.push({
          d: `M ${bxB} ${rowY(row) + R_BRANCH} C ${bxB} ${midY}, ${bxB} ${midY}, ${bxB} ${nextY - R_BRANCH}`,
          color,
          strokeWidth: 0.4,
          opacity: litPathB ? 0.55 : 0.1,
        });
      }
    }
  });

  return { nodes, paths };
}

/* ------------------------------------------------------------------ */
/*  Branch node state computation                                      */
/* ------------------------------------------------------------------ */

function computeBranchNode(
  info: SkillInfo,
  targetLevel: number,
  cost: number,
  cubeBalance: number,
  needsChoice: boolean,
  branchIdx: number,
): { unlocked: boolean; isNext: boolean; canAfford: boolean } {
  const canAfford = cubeBalance >= cost;

  if (needsChoice) {
    return { unlocked: false, isNext: true, canAfford };
  }

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

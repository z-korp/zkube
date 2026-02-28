import { useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "motion/react";
import { Loader2, RefreshCw, Zap } from "lucide-react";
import { useNavigationStore } from "@/stores/navigationStore";
import { useCubeBalance } from "@/hooks/useCubeBalance";
import { useGame } from "@/hooks/useGame";
import { useDraft } from "@/hooks/useDraft";
import { useSkillTree } from "@/hooks/useSkillTree";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { getRerollCost, isActiveSkill } from "@/dojo/game/helpers/runDataPacking";
import { MAX_LOADOUT_SLOTS, BRANCH_POINT_LEVEL } from "@/dojo/game/constants";
import {
  ARCHETYPES,
  getSkillById,
  getArchetypeForSkill,
  getSkillTier,
  getSkillAssetKey,
  decodeDraftChoice,
  getSkillEffectDescription,
} from "@/dojo/game/types/skillData";
import { showToast } from "@/utils/toast";
import { getSkillTierIconPath } from "@/ui/theme/ImageAssets";
import PageTopBar from "@/ui/navigation/PageTopBar";
import CubeIcon from "@/ui/components/CubeIcon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/elements/tooltip";

/* ------------------------------------------------------------------ */
/*  Animation Variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const DraftPage: React.FC = () => {
  const navigate = useNavigationStore((s) => s.navigate);
  const gameId = useNavigationStore((s) => s.gameId);
  const setPendingDraftEvent = useNavigationStore((s) => s.setPendingDraftEvent);
  const pendingDraftEvent = useNavigationStore((s) => s.pendingDraftEvent);
  const { cubeBalance } = useCubeBalance();
  const { account } = useAccountCustom();
  const {
    setup: { systemCalls },
  } = useDojo();

  const draftState = useDraft({ gameId: gameId ?? undefined });
  const { game } = useGame({
    gameId: gameId ?? undefined,
    shouldLog: false,
  });
  const { skillTree } = useSkillTree();

  const [isSelecting, setIsSelecting] = useState(false);
  const [isRerolling, setIsRerolling] = useState(false);

  const walletCubes = Number(cubeBalance);
  const spentCubes = draftState?.spentCubes ?? 0;
  const remainingCubes = Math.max(0, walletCubes - spentCubes);
  const rerollCost = getRerollCost(draftState?.rerollCount ?? 0);

  const runSlots = useMemo(
    () =>
      game
        ? game.runData.slots.slice(0, MAX_LOADOUT_SLOTS).filter((slot) => slot.skillId > 0)
        : [],
    [game],
  );

  const isFullLoadout = (game?.activeSlotCount ?? runSlots.length) >= MAX_LOADOUT_SLOTS;

  const cards = useMemo(() => {
    if (!draftState) return [];
    const choices = [draftState.choice1, draftState.choice2, draftState.choice3];
    return choices.map((rawChoice, index) => {
      const { skillId, isBranchB } = decodeDraftChoice(rawChoice);
      const skill = getSkillById(skillId);
      const slot = game?.runData.slots.find(
        (entry) => entry.skillId === skillId,
      );
      const treeInfo = skillTree?.skills[skillId - 1];
      const currentLevel = slot?.level ?? treeInfo?.level ?? 0;
      const branchId = treeInfo?.branchId;
      const archetype = getArchetypeForSkill(skillId);
      const nextLevel = isFullLoadout ? currentLevel + 1 : currentLevel;
      const treeHasBranch = treeInfo?.branchChosen ?? false;
      const effectBranchId = isBranchB
        ? 2
        : treeHasBranch
          ? treeInfo!.branchId === 0
            ? 1
            : 2
          : 0;
      return {
        slotIndex: index as 0 | 1 | 2,
        skillId,
        rawChoice,
        isBranchB,
        skill,
        level: currentLevel,
        branchId,
        archetype,
        effectDesc: getSkillEffectDescription(
          skillId,
          nextLevel,
          effectBranchId,
        ),
      };
    });
  }, [draftState, game?.runData.slots, isFullLoadout, skillTree]);

  useEffect(() => {
    if (gameId === null) {
      navigate("map");
      return;
    }
    if (!draftState) {
      return;
    }
    if (!draftState.active) {
      if (pendingDraftEvent) return;
      setPendingDraftEvent(null);
      navigate("map", gameId);
    }
  }, [draftState, gameId, navigate, pendingDraftEvent, setPendingDraftEvent]);

  const goToMap = () => {
    setPendingDraftEvent(null);
    navigate("map", gameId ?? undefined);
  };

  const rerollChoice = async (slot: 0 | 1 | 2) => {
    if (!account || gameId === null || !draftState?.active) return;
    if (remainingCubes < rerollCost) {
      showToast({
        message: `Need ${rerollCost} cubes for reroll.`,
        type: "error",
      });
      return;
    }

    try {
      setIsRerolling(true);
      await systemCalls.rerollDraft({
        account,
        game_id: gameId,
        reroll_slot: slot,
      });
    } catch (error) {
      console.error("Draft reroll failed:", error);
    } finally {
      setIsRerolling(false);
    }
  };

  const chooseChoice = async (slot: 0 | 1 | 2) => {
    if (!account || gameId === null || !draftState?.active) return;

    try {
      setIsSelecting(true);
      await systemCalls.selectDraft({
        account,
        game_id: gameId,
        selected_slot: slot,
      });
      setPendingDraftEvent(null);
      navigate("map", gameId);
    } catch (error) {
      console.error("Draft select failed:", error);
    } finally {
      setIsSelecting(false);
    }
  };

  /* ---- Loading / inactive state ---- */

  if (!draftState?.active) {
    return (
      <div className="h-screen-viewport flex flex-col text-white">
        <PageTopBar
          title="DRAFT EVENT"
          onBack={goToMap}
          cubeBalance={cubeBalance}
        />
        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            {pendingDraftEvent ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                <p className="font-['Fredericka_the_Great'] text-lg text-slate-300">
                  Preparing draft...
                </p>
              </div>
            ) : (
              <p className="text-slate-400">No active draft event.</p>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  /* ---- Main render ---- */

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-screen-viewport flex flex-col text-white">
        <PageTopBar
          title="DRAFT EVENT"
          onBack={goToMap}
          cubeBalance={cubeBalance}
        />

        <div className="flex-1 overflow-y-auto">
          <motion.div
            className="mx-auto max-w-[920px] px-3 py-3 md:px-6 pb-6 flex flex-col gap-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* ================================================= */}
            {/*  HEADER PANEL — economy + loadout                  */}
            {/* ================================================= */}
            <motion.section
              variants={itemVariants}
              className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/90 backdrop-blur-sm px-4 py-3"
            >
              {/* Subtle glow */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.06]"
                style={{
                  background: `radial-gradient(ellipse at 50% 0%, ${cards[0]?.archetype?.color ?? "#22c55e"}, transparent 70%)`,
                }}
              />

              {/* Economy strip */}
              <div className="relative flex items-center justify-center gap-2.5 text-[11px]">
                <span className="flex items-center gap-1 rounded-full border border-slate-600 bg-slate-800/80 px-2.5 py-1 text-slate-200">
                  <CubeIcon size="xs" /> {walletCubes}
                </span>
                <span className="flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-900/20 px-2.5 py-1 text-amber-200">
                  <RefreshCw size={10} /> <CubeIcon size="xs" /> {rerollCost}
                </span>
                <span className="flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-900/20 px-2.5 py-1 text-emerald-200">
                  <CubeIcon size="xs" /> {remainingCubes}
                </span>
              </div>

              {/* Loadout with tooltips */}
              <div className="relative mt-2.5 flex items-center justify-center gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mr-1">
                  Loadout
                </span>
                {Array.from({ length: 3 }, (_, index) => {
                  const slot = runSlots[index];

                  if (!slot) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-slate-700/60"
                      >
                        <span className="text-[10px] text-slate-600">?</span>
                      </div>
                    );
                  }

                  const skill = getSkillById(slot.skillId);
                  const arch = getArchetypeForSkill(slot.skillId);
                  const assetKey = getSkillAssetKey(slot.skillId) ?? "";
                  const tier = getSkillTier(slot.level);
                  const iconPath = getSkillTierIconPath(assetKey, tier);
                  const color = arch?.color ?? "#64748b";
                  const effectText = getSkillEffectDescription(slot.skillId, slot.level, undefined);

                  return (
                    <Tooltip key={`slot-${index}-${slot.skillId}`}>
                      <TooltipTrigger asChild>
                        <div className="relative cursor-default">
                          <div
                            className="h-10 w-10 rounded-full overflow-hidden border-2"
                            style={{ borderColor: color }}
                          >
                            <img
                              src={iconPath}
                              alt={skill?.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          {/* Level badge */}
                          <span
                            className="absolute -bottom-0.5 -left-0.5 flex h-[16px] w-[16px] items-center justify-center rounded-full text-[8px] font-bold text-white"
                            style={{ backgroundColor: color }}
                          >
                            {slot.level + 1}
                          </span>
                          {/* Charges badge */}
                          {isActiveSkill(slot.skillId) && (
                            <span
                              className={`absolute -top-0.5 -right-0.5 flex h-[16px] w-[16px] items-center justify-center rounded-full text-[8px] font-bold ${
                                slot.charges > 0
                                  ? "bg-yellow-500 text-white"
                                  : "bg-slate-600 text-slate-400"
                              }`}
                            >
                              {slot.charges}
                            </span>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        className="max-w-[200px] bg-slate-800 border border-slate-600 text-slate-100 px-3 py-2"
                        side="bottom"
                      >
                        <p className="font-semibold text-xs" style={{ color }}>{skill?.name}</p>
                        <p className="text-[10px] text-slate-300 mt-0.5">{effectText}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </motion.section>

            {/* ================================================= */}
            {/*  SKILL CHOICE CARDS — compact boon offerings       */}
            {/* ================================================= */}
            <motion.section
              className="flex flex-col gap-2.5 md:grid md:grid-cols-3 md:gap-3"
              variants={containerVariants}
            >
              {cards.map((choice) => {
                const assetKey = getSkillAssetKey(choice.skillId) ?? "";
                const tier = getSkillTier(choice.level);
                const iconPath = getSkillTierIconPath(assetKey, tier);
                const isBranchPoint = choice.level === BRANCH_POINT_LEVEL && isFullLoadout;
                const accentCol = choice.archetype?.color ?? "#64748b";
                const isPassive = choice.skill?.category === "world";
                const displayLevel = choice.level + 1;
                const archetypeColor = choice.skill
                  ? ARCHETYPES[choice.skill.archetype].color
                  : accentCol;
                const genericDesc = choice.skill?.description ?? "";

                return (
                  <motion.article
                    key={`draft-skill-${choice.slotIndex}-${choice.skillId}`}
                    variants={cardVariants}
                    whileHover={{ scale: 1.015, y: -1 }}
                    className="relative flex items-stretch overflow-hidden rounded-xl border bg-slate-900/90 backdrop-blur-sm"
                    style={{
                      borderColor: `${accentCol}40`,
                      boxShadow: `0 0 20px ${accentCol}10, 0 2px 12px rgba(0,0,0,0.3)`,
                    }}
                  >
                    {/* Left accent glow */}
                    <div
                      className="pointer-events-none absolute inset-y-0 left-0 w-24 opacity-[0.07]"
                      style={{
                        background: `radial-gradient(ellipse at 0% 50%, ${accentCol}, transparent 70%)`,
                      }}
                    />

                    {/* LEFT — Icon column */}
                    <div className="relative flex flex-col items-center justify-center px-3 py-3 shrink-0">
                      <div className="relative">
                        <div
                          className="h-12 w-12 rounded-full overflow-hidden border-2 bg-slate-950"
                          style={{
                            borderColor: accentCol,
                            boxShadow: `0 0 12px ${accentCol}30`,
                          }}
                        >
                          {iconPath && (
                            <img
                              src={iconPath}
                              alt={choice.skill?.name}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        {/* Level badge */}
                        <span
                          className="absolute -bottom-0.5 -left-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white z-10"
                          style={{ backgroundColor: isPassive ? accentCol : "#6366f1" }}
                        >
                          {displayLevel}
                        </span>
                      </div>

                      {/* Branch point indicator */}
                      {isBranchPoint && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="mt-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/40 cursor-default">
                              <Zap size={10} className="text-amber-400" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            className="max-w-[220px] bg-slate-800 border border-amber-500/30 text-slate-100 px-3 py-2"
                            side="right"
                          >
                            <p className="font-semibold text-xs text-amber-300">Branch Point at Lv{BRANCH_POINT_LEVEL}</p>
                            {choice.skill && (
                              <div className="mt-1 text-[10px] text-slate-300 space-y-0.5">
                                <p>A: {choice.skill.branchA} — {getSkillEffectDescription(choice.skillId, BRANCH_POINT_LEVEL + 1, 1)}</p>
                                <p>B: {choice.skill.branchB} — {getSkillEffectDescription(choice.skillId, BRANCH_POINT_LEVEL + 1, 2)}</p>
                              </div>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>

                    {/* CENTER — Info */}
                    <div className="relative flex-1 flex flex-col justify-center py-2.5 pr-1 min-w-0">
                      {/* Name + badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-['Fredericka_the_Great'] text-base leading-tight text-white truncate">
                          {choice.skill?.name ?? `Skill ${choice.skillId}`}
                        </h3>
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-semibold ${
                            isPassive
                              ? "border border-purple-400/30 bg-purple-900/25 text-purple-200"
                              : "border border-sky-400/30 bg-sky-900/25 text-sky-200"
                          }`}
                        >
                          {isPassive ? "Passive" : "Active"}
                        </span>
                        {choice.skill && (
                          <span
                            className="shrink-0 rounded-full border px-1.5 py-0.5 text-[8px] font-semibold"
                            style={{
                              color: archetypeColor,
                              borderColor: `${archetypeColor}66`,
                              backgroundColor: `${archetypeColor}1f`,
                            }}
                          >
                            {ARCHETYPES[choice.skill.archetype].name}
                          </span>
                        )}
                        {choice.isBranchB && choice.skill && (
                          <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-semibold border border-amber-400/30 bg-amber-900/25 text-amber-200">
                            {choice.skill.branchB}
                          </span>
                        )}
                        {!choice.isBranchB && choice.level >= BRANCH_POINT_LEVEL && choice.skill && (
                          <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-semibold border border-slate-400/30 bg-slate-900/25 text-slate-300">
                            {choice.skill.branchA}
                          </span>
                        )}
                      </div>

                      {/* Effect */}
                      <p className="mt-0.5 text-[11px] text-slate-100 leading-snug">
                        {choice.effectDesc}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400 leading-snug line-clamp-1">
                        {genericDesc}
                      </p>

                      {/* Upgrade comparison */}
                      {isFullLoadout && choice.level > 0 && (
                        <p className="mt-0.5 text-[9px] text-slate-500 truncate">
                          Current: {getSkillEffectDescription(choice.skillId, choice.level, choice.branchId)}
                        </p>
                      )}
                    </div>

                    {/* RIGHT — Actions */}
                    <div className="relative flex flex-col items-center justify-center gap-1.5 px-2.5 py-2 shrink-0">
                      <motion.button
                        type="button"
                        onClick={() => chooseChoice(choice.slotIndex)}
                        disabled={isSelecting || isRerolling}
                        whileHover={
                          isSelecting || isRerolling
                            ? undefined
                            : { scale: 1.05 }
                        }
                        whileTap={
                          isSelecting || isRerolling
                            ? undefined
                            : { scale: 0.95 }
                        }
                        className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-md shadow-green-500/20 transition-shadow hover:shadow-green-500/35 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {isSelecting ? (
                          <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                        ) : isFullLoadout ? (
                          "Upgrade"
                        ) : (
                          "Select"
                        )}
                      </motion.button>

                      <motion.button
                        type="button"
                        onClick={() => rerollChoice(choice.slotIndex)}
                        disabled={
                          isSelecting ||
                          isRerolling ||
                          remainingCubes < rerollCost
                        }
                        whileHover={
                          isSelecting || isRerolling || remainingCubes < rerollCost
                            ? undefined
                            : { scale: 1.05 }
                        }
                        whileTap={
                          isSelecting || isRerolling || remainingCubes < rerollCost
                            ? undefined
                            : { scale: 0.95 }
                        }
                        className="flex items-center gap-1 rounded-lg border border-amber-600/50 bg-amber-900/20 px-2.5 py-1 text-[10px] font-semibold text-amber-200 transition-colors hover:bg-amber-900/35 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isRerolling ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <RefreshCw size={11} />
                            <CubeIcon size="xs" /> {rerollCost}
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.article>
                );
              })}
            </motion.section>
          </motion.div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default DraftPage;

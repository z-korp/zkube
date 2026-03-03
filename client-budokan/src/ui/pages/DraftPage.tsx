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
import GameButton from "@/ui/components/shared/GameButton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/elements/tooltip";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
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

  const getStageLabel = () => {
    if (!draftState) return "Draft Event";
    const zone = Number(draftState.zone ?? NaN);
    const triggerLevel = Number(draftState.triggerLevel ?? NaN);
    const parts: string[] = [];
    if (Number.isFinite(zone) && zone > 0) parts.push(`Zone ${zone}`);
    if (Number.isFinite(triggerLevel) && triggerLevel > 0) parts.push(`Level ${triggerLevel}`);
    return parts.length > 0 ? parts.join(" - ") : "Draft Event";
  };

  const cards = useMemo(() => {
    if (!draftState) return [];
    const choices = [draftState.choice1, draftState.choice2, draftState.choice3];
    return choices.map((rawChoice, index) => {
      const { skillId, isBranchB } = decodeDraftChoice(rawChoice);
      const skill = getSkillById(skillId);
      const slot = game?.runData.slots.find((entry) => entry.skillId === skillId);
      const treeInfo = skillTree?.skills[skillId - 1];
      const currentLevel = slot?.level ?? treeInfo?.level ?? 0;
      const branchId = treeInfo?.branchId;
      const archetype = getArchetypeForSkill(skillId);
      const nextLevel = isFullLoadout ? currentLevel + 1 : Math.max(1, currentLevel);
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
        effectDesc: getSkillEffectDescription(skillId, nextLevel, effectBranchId),
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

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-screen-viewport flex flex-col bg-slate-900/90 text-white">
        <PageTopBar
          title="DRAFT EVENT"
          onBack={goToMap}
          cubeBalance={cubeBalance}
        />

        <div className="flex-1 overflow-y-auto">
          <motion.div
            className="mx-auto flex max-w-[920px] flex-col gap-4 px-3 pb-6 pt-3 md:px-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.section
              variants={itemVariants}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-5 backdrop-blur-sm"
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{
                  background: `radial-gradient(circle at 20% 0%, ${cards[0]?.archetype?.color ?? "#1ABC9C"}30, transparent 45%), radial-gradient(circle at 80% 100%, #0f766e30, transparent 45%)`,
                }}
              />

              <div className="relative text-center">
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">{getStageLabel()}</p>
                <h1 className="mt-1 font-['Fredericka_the_Great'] text-3xl leading-none text-white md:text-4xl">
                  Choose your power
                </h1>
                <p className="mt-2 text-sm text-slate-300">
                  Commit your next skill before you return to the map.
                </p>
              </div>

              <div className="relative mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px]">
                <span className="flex items-center gap-1 rounded-full border border-slate-700/50 bg-slate-800/80 px-3 py-1 text-slate-200">
                  <CubeIcon size="xs" /> Wallet: {walletCubes}
                </span>
                <span className="flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-900/20 px-3 py-1 text-amber-200">
                  <RefreshCw size={10} /> Reroll: <CubeIcon size="xs" /> {rerollCost}
                </span>
                <span className="flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-900/20 px-3 py-1 text-emerald-200">
                  Remaining: <CubeIcon size="xs" /> {remainingCubes}
                </span>
              </div>
            </motion.section>

            <motion.section
              variants={itemVariants}
              className="rounded-2xl border border-slate-700/50 bg-slate-900/90 p-3 backdrop-blur-sm"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Current Run Slots</p>
                <p className="text-xs text-slate-500">{runSlots.length}/{MAX_LOADOUT_SLOTS}</p>
              </div>
              <div className="flex items-center justify-center gap-2.5 md:gap-3">
                {Array.from({ length: MAX_LOADOUT_SLOTS }, (_, index) => {
                  const slot = runSlots[index];

                  if (!slot) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-slate-700/60 text-xs text-slate-600"
                      >
                        +
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
                            className="h-12 w-12 overflow-hidden rounded-full border-2"
                            style={{ borderColor: color, boxShadow: `0 0 12px ${color}35` }}
                          >
                            <img
                              src={iconPath}
                              alt={skill?.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <span
                            className="absolute -bottom-0.5 -left-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full text-[9px] font-bold text-white"
                            style={{ backgroundColor: color }}
                          >
                            {slot.level + 1}
                          </span>
                          {isActiveSkill(slot.skillId) && (
                            <span
                              className={`absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[9px] font-bold ${
                                slot.charges > 0 ? "bg-yellow-500 text-white" : "bg-slate-600 text-slate-300"
                              }`}
                            >
                              {slot.charges}
                            </span>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        className="max-w-[210px] border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100"
                        side="bottom"
                      >
                        <p className="text-xs font-semibold" style={{ color }}>{skill?.name}</p>
                        <p className="mt-0.5 text-[10px] text-slate-300">{effectText}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </motion.section>

            <motion.section
              className="grid grid-cols-1 gap-3 md:grid-cols-3"
              variants={containerVariants}
            >
              {cards.map((choice, index) => {
                const assetKey = getSkillAssetKey(choice.skillId) ?? "";
                const tier = getSkillTier(choice.level);
                const iconPath = getSkillTierIconPath(assetKey, tier);
                const isBranchPoint = choice.level === BRANCH_POINT_LEVEL && isFullLoadout;
                const accentCol = choice.archetype?.color ?? "#64748b";
                const isPassive = choice.skill?.category === "world";
                const displayLevel = isFullLoadout ? choice.level + 1 : Math.max(1, choice.level);
                const archetypeColor = choice.skill ? ARCHETYPES[choice.skill.archetype].color : accentCol;
                const genericDesc = choice.skill?.description ?? "";
                const currentEffect =
                  isFullLoadout && choice.level > 0
                    ? getSkillEffectDescription(choice.skillId, choice.level, choice.branchId)
                    : null;

                return (
                  <motion.article
                    key={`draft-skill-${choice.slotIndex}-${choice.skillId}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.38, delay: 0.08 + index * 0.08, ease: "easeOut" }}
                    whileHover={{ scale: 1.02 }}
                    className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/90 p-4 backdrop-blur-sm"
                    style={{
                      boxShadow: `0 0 24px ${accentCol}25, inset 0 1px 0 rgba(255,255,255,0.04)`,
                    }}
                  >
                    <div
                      className="pointer-events-none absolute inset-0 opacity-20"
                      style={{
                        background: `radial-gradient(circle at 50% 0%, ${accentCol}55, transparent 42%)`,
                      }}
                    />

                    <div className="relative flex flex-col items-center">
                      <div className="relative">
                        <div
                          className="h-20 w-20 overflow-hidden rounded-full border-[3px] bg-slate-950"
                          style={{ borderColor: accentCol, boxShadow: `0 0 24px ${accentCol}55` }}
                        >
                          {iconPath && (
                            <img
                              src={iconPath}
                              alt={choice.skill?.name}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <span
                          className="absolute -bottom-1 -left-1 z-10 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
                          style={{ backgroundColor: isPassive ? accentCol : "#6366f1" }}
                        >
                          {displayLevel}
                        </span>
                      </div>

                      {isBranchPoint && (
                        <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-900/20 px-2 py-1 text-[10px] font-semibold text-amber-200">
                          <Zap size={10} /> Branch Point
                        </span>
                      )}
                    </div>

                    <div className="relative mt-4 flex flex-1 flex-col">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="font-['Fredericka_the_Great'] text-2xl leading-none text-white">
                          {choice.skill?.name ?? `Skill ${choice.skillId}`}
                        </h3>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                            isPassive
                              ? "border border-purple-400/30 bg-purple-900/25 text-purple-200"
                              : "border border-sky-400/30 bg-sky-900/25 text-sky-200"
                          }`}
                        >
                          {isPassive ? "Passive" : "Active"}
                        </span>
                        {choice.skill && (
                          <span
                            className="shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold"
                            style={{
                              color: archetypeColor,
                              borderColor: `${archetypeColor}66`,
                              backgroundColor: `${archetypeColor}1f`,
                            }}
                          >
                            {ARCHETYPES[choice.skill.archetype].name}
                          </span>
                        )}
                      </div>

                      {(choice.isBranchB || (choice.level >= BRANCH_POINT_LEVEL && choice.skill)) && choice.skill && (
                        <p className="mt-1 text-[11px] text-amber-200">
                          Path: {choice.isBranchB ? choice.skill.branchB : choice.skill.branchA}
                        </p>
                      )}

                      <div className="mt-3 rounded-xl border border-slate-700/60 bg-slate-950/70 p-3">
                        <p className="text-[11px] leading-relaxed text-slate-100">{choice.effectDesc}</p>
                        <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{genericDesc}</p>
                      </div>

                      {currentEffect && (
                        <div className="mt-2 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-2">
                          <p className="text-[10px] text-emerald-300">Current: {currentEffect}</p>
                          <p className="mt-1 text-[10px] text-emerald-200">Upgrade to Level {displayLevel}</p>
                        </div>
                      )}

                      {isBranchPoint && choice.skill && (
                        <div className="mt-2 space-y-1 rounded-xl border border-amber-500/30 bg-amber-900/10 p-2 text-[10px] text-amber-100">
                          <p className="font-semibold text-amber-300">Branch Point Info</p>
                          <p>
                            A: {choice.skill.branchA} - {getSkillEffectDescription(choice.skillId, BRANCH_POINT_LEVEL + 1, 1)}
                          </p>
                          <p>
                            B: {choice.skill.branchB} - {getSkillEffectDescription(choice.skillId, BRANCH_POINT_LEVEL + 1, 2)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="relative mt-4 grid grid-cols-2 gap-2">
                      <motion.button
                        type="button"
                        onClick={() => chooseChoice(choice.slotIndex)}
                        disabled={isSelecting || isRerolling}
                        whileHover={isSelecting || isRerolling ? undefined : { scale: 1.02, y: -1 }}
                        whileTap={isSelecting || isRerolling ? undefined : { scale: 0.97, y: 1 }}
                        className="rounded-xl border border-b-4 border-emerald-700/80 bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-2 text-sm font-bold text-white shadow-lg shadow-green-500/25 transition-shadow hover:shadow-green-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSelecting ? (
                          <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                        ) : isFullLoadout ? (
                          `Upgrade Lv ${displayLevel}`
                        ) : (
                          "Choose"
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
                            : { scale: 1.02, y: -1 }
                        }
                        whileTap={
                          isSelecting || isRerolling || remainingCubes < rerollCost
                            ? undefined
                            : { scale: 0.97, y: 1 }
                        }
                        className="flex items-center justify-center gap-1 rounded-xl border border-b-4 border-amber-700/80 bg-gradient-to-r from-amber-500 to-orange-600 px-2 py-2 text-xs font-bold text-amber-50 shadow-lg shadow-amber-500/25 transition-shadow hover:shadow-amber-500/45 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {isRerolling ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <RefreshCw size={11} />
                            Reroll
                            <CubeIcon size="xs" />
                            {rerollCost}
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.article>
                );
              })}
            </motion.section>

            <motion.div variants={itemVariants} className="mt-1">
              <GameButton
                label="Back to Map"
                variant="secondary"
                onClick={goToMap}
                disabled={isSelecting || isRerolling}
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default DraftPage;

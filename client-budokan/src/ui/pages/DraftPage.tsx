import { useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "motion/react";
import { Loader2 } from "lucide-react";
import { useNavigationStore } from "@/stores/navigationStore";
import { useCubeBalance } from "@/hooks/useCubeBalance";
import { useGame } from "@/hooks/useGame";
import { useDraft } from "@/hooks/useDraft";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { getRerollCost } from "@/dojo/game/helpers/runDataPacking";
import {
  getSkillById,
  getArchetypeForSkill,
  getSkillTier,
} from "@/dojo/game/types/skillData";
import {
  getSkillEffectDescription,
} from "@/dojo/game/types/skillEffects";
import { showToast } from "@/utils/toast";
import { getSkillTierIconPath } from "@/ui/theme/ImageAssets";
import PageTopBar from "@/ui/navigation/PageTopBar";
import GameButton from "@/ui/components/shared/GameButton";
import CubeIcon from "@/ui/components/CubeIcon";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const getStageLabel = (
  eventType: number,
  triggerLevel: number,
  zone: number,
): string => {
  if (eventType === 1) return "Post Level 1 Draft";
  if (eventType === 2) {
    return `Post Boss ${Math.floor(triggerLevel / 10)} Draft (Zone ${zone})`;
  }
  return `Zone ${zone} Micro Draft`;
};

const getStageSubtitle = (
  eventType: number,
  isFullLoadout: boolean,
): string => {
  if (isFullLoadout) return "Upgrade one of your skills";
  if (eventType === 1) return "Choose your first power";
  if (eventType === 2) return "The boss has fallen — claim your reward";
  return "A new power awaits";
};

/* ------------------------------------------------------------------ */
/*  Animation Variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.34, 1.56, 0.64, 1] },
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

  const [isSelecting, setIsSelecting] = useState(false);
  const [isRerolling, setIsRerolling] = useState(false);

  const walletCubes = Number(cubeBalance);
  const spentCubes = draftState?.spentCubes ?? 0;
  const remainingCubes = Math.max(0, walletCubes - spentCubes);
  const rerollCost = getRerollCost(draftState?.rerollCount ?? 0);


  const runSlots = useMemo(
    () =>
      game
        ? game.runData.slots.slice(0, 3).filter((slot) => slot.skillId > 0)
        : [],
    [game],
  );

  const isFullLoadout = (game?.activeSlotCount ?? runSlots.length) >= 3;

  const cards = useMemo(() => {
    if (!draftState) return [];
    const choices = [draftState.choice1, draftState.choice2, draftState.choice3];
    return choices.map((skillId, index) => {
      const skill = getSkillById(skillId);
      const slot = game?.runData.slots.find(
        (entry) => entry.skillId === skillId,
      );
      const currentLevel = slot?.level ?? 0;
      const branchId = undefined; // Run slots don't track branch; branch comes from skill tree
      const archetype = getArchetypeForSkill(skillId);
      const nextLevel = isFullLoadout ? currentLevel + 1 : 0;
      return {
        slotIndex: index as 0 | 1 | 2,
        skillId,
        skill,
        level: currentLevel,
        branchId,
        archetype,
        effectDesc: getSkillEffectDescription(
          skillId,
          isFullLoadout ? nextLevel : 0,
          branchId,
        ),
      };
    });
  }, [draftState, game?.runData.slots, isFullLoadout]);

  useEffect(() => {
    if (gameId === null) {
      navigate("map");
      return;
    }
    if (!draftState) {
      return;
    }
    if (!draftState.active) {
      // If we have a pending draft event, wait for start_next_level to activate the draft
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

  const accentColor =
    cards.length > 0 && cards[0].archetype
      ? cards[0].archetype.color
      : "#22c55e";

  return (
    <div className="h-screen-viewport flex flex-col text-white">
      <PageTopBar
        title="DRAFT EVENT"
        onBack={goToMap}
        cubeBalance={cubeBalance}
      />

      <div className="flex-1 overflow-y-auto">
        <motion.div
          className="mx-auto max-w-[920px] px-4 py-4 md:px-6 pb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* ============================================= */}
          {/*  HERO HEADER                                  */}
          {/* ============================================= */}
          <motion.section
            variants={itemVariants}
            className="relative mb-5 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-sm px-5 py-5 text-center"
          >
            {/* Subtle glow accent */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{
                background: `radial-gradient(ellipse at 50% 0%, ${accentColor}, transparent 70%)`,
              }}
            />

            <motion.h2
              className="relative font-['Fredericka_the_Great'] text-2xl md:text-3xl text-white"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              {getStageLabel(
                draftState.eventType,
                draftState.triggerLevel,
                draftState.zone,
              )}
            </motion.h2>
            <motion.p
              className="relative mt-1.5 text-sm md:text-base text-slate-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              {getStageSubtitle(draftState.eventType, isFullLoadout)}
            </motion.p>

            {/* Cube economy strip */}
            <motion.div
              className="relative mt-4 flex flex-wrap items-center justify-center gap-3 text-xs"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <span className="flex items-center gap-1.5 rounded-full border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-slate-200">
                <CubeIcon size="xs" /> {walletCubes}
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-900/20 px-3 py-1.5 text-amber-200">
                Reroll: <CubeIcon size="xs" /> {rerollCost}
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-900/20 px-3 py-1.5 text-emerald-200">
                Remaining: <CubeIcon size="xs" /> {remainingCubes}
              </span>
            </motion.div>
          </motion.section>

          {/* ============================================= */}
          {/*  CURRENT RUN SLOTS — compact strip            */}
          {/* ============================================= */}
          <motion.section
            variants={itemVariants}
            className="mb-5 flex items-center justify-center gap-3"
          >
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Loadout
            </span>
            <div className="flex items-center gap-2">
              {Array.from({ length: 3 }, (_, index) => {
                const slot = runSlots[index];

                if (!slot) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-slate-700/60"
                    >
                      <span className="text-[10px] text-slate-600">?</span>
                    </div>
                  );
                }

                const skill = getSkillById(slot.skillId);
                const arch = getArchetypeForSkill(slot.skillId);
                const skillName = skill?.name?.toLowerCase() ?? "";
                const tier = getSkillTier(slot.level);
                const iconPath = getSkillTierIconPath(skillName, tier);
                const color = arch?.color ?? "#64748b";

                return (
                  <div key={`slot-${index}-${slot.skillId}`} className="relative">
                    <div
                      className="h-11 w-11 rounded-full overflow-hidden border-2"
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
                      className="absolute -bottom-0.5 -left-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full text-[9px] font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {slot.level + 1}
                    </span>
                    {/* Charges badge for bonus skills */}
                    {slot.skillId >= 1 && slot.skillId <= 5 && (
                      <span
                        className={`absolute -top-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full text-[9px] font-bold ${
                          slot.charges > 0
                            ? "bg-yellow-500 text-white"
                            : "bg-slate-600 text-slate-400"
                        }`}
                      >
                        {slot.charges}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.section>

          {/* ============================================= */}
          {/*  SKILL CHOICE CARDS — the main event          */}
          {/* ============================================= */}
          <motion.section
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
            variants={containerVariants}
          >
            {cards.map((choice) => {
              const skillName = choice.skill?.name?.toLowerCase() ?? "";
              const tier = getSkillTier(choice.level);
              const iconPath = getSkillTierIconPath(skillName, tier);
              const isBranchPoint = choice.level === 4 && isFullLoadout;
              const accentCol = choice.archetype?.color ?? "#64748b";
              const isPassive = choice.skill?.category === "world";

              return (
                <motion.article
                  key={`draft-skill-${choice.slotIndex}-${choice.skillId}`}
                  variants={cardVariants}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="relative flex flex-col overflow-hidden rounded-2xl border bg-slate-900/90 backdrop-blur-sm"
                  style={{
                    borderColor: `${accentCol}40`,
                    boxShadow: `0 0 24px ${accentCol}12, 0 4px 16px rgba(0,0,0,0.3)`,
                  }}
                >
                  {/* Top accent glow */}
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-[0.08]"
                    style={{
                      background: `radial-gradient(ellipse at 50% 0%, ${accentCol}, transparent 70%)`,
                    }}
                  />

                  <div className="relative flex flex-col items-center px-4 pt-5 pb-2">
                    {/* Skill icon — circular with archetype ring */}
                    <div className="relative mb-3">
                      <div
                        className="h-[72px] w-[72px] rounded-full overflow-hidden border-[3px] bg-slate-950"
                        style={{
                          borderColor: accentCol,
                          boxShadow: `0 0 18px ${accentCol}35`,
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
                        className="absolute -bottom-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white z-10"
                        style={{ backgroundColor: isPassive ? accentCol : undefined }}
                      >
                        {isPassive ? (
                          <span>{isFullLoadout ? choice.level + 1 : 0}</span>
                        ) : (
                          <span className="flex h-full w-full items-center justify-center rounded-full bg-indigo-500">
                            {isFullLoadout ? choice.level + 1 : 0}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Badges row */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          isPassive
                            ? "border border-purple-400/30 bg-purple-900/25 text-purple-200"
                            : "border border-sky-400/30 bg-sky-900/25 text-sky-200"
                        }`}
                      >
                        {isPassive ? "Passive" : "Active"}
                      </span>
                      {choice.archetype && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                          style={{
                            backgroundColor: `${accentCol}20`,
                            color: accentCol,
                            border: `1px solid ${accentCol}30`,
                          }}
                        >
                          {choice.archetype.name}
                        </span>
                      )}
                    </div>

                    {/* Skill name */}
                    <h3 className="font-['Fredericka_the_Great'] text-xl leading-tight text-white text-center">
                      {choice.skill?.name ?? `Skill ${choice.skillId}`}
                    </h3>

                    {/* Level info */}
                    <p className="mt-1 text-xs text-slate-400">
                      {isFullLoadout
                        ? `Upgrade to Level ${choice.level + 1}`
                        : "New Skill \u2022 Level 0"}
                    </p>
                  </div>

                  {/* Effect box */}
                  <div className="mx-4 mb-2 rounded-lg border border-slate-700/40 bg-slate-950/50 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/80 mb-1">
                      {isFullLoadout ? "Next Level Effect" : "Effect"}
                    </p>
                    <p className="text-sm text-slate-200 leading-snug">
                      {choice.effectDesc}
                    </p>
                  </div>

                  {/* Current level comparison (upgrade mode) */}
                  {isFullLoadout && choice.level > 0 && (
                    <div className="mx-4 mb-2 rounded-lg bg-slate-800/30 px-3 py-2">
                      <p className="text-[10px] text-slate-500">
                        Current (Lv{choice.level}):{" "}
                        <span className="text-slate-400">
                          {getSkillEffectDescription(
                            choice.skillId,
                            choice.level,
                            choice.branchId,
                          )}
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Branch point warning */}
                  {isBranchPoint && choice.skill && (
                    <div className="mx-4 mb-2 rounded-lg border border-amber-500/25 bg-amber-950/15 px-3 py-2.5">
                      <p className="text-[11px] font-semibold text-amber-300 mb-1.5">
                        ⚡ Branch Point at Level 5
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="rounded-md border border-slate-700/50 bg-slate-950/50 p-2">
                          <p className="font-bold text-sky-300 mb-0.5">
                            A: {choice.skill.branchA}
                          </p>
                          <p className="text-slate-400">
                            {getSkillEffectDescription(choice.skillId, 5, 1)}
                          </p>
                        </div>
                        <div className="rounded-md border border-slate-700/50 bg-slate-950/50 p-2">
                          <p className="font-bold text-purple-300 mb-0.5">
                            B: {choice.skill.branchB}
                          </p>
                          <p className="text-slate-400">
                            {getSkillEffectDescription(choice.skillId, 5, 2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Spacer to push buttons to bottom */}
                  <div className="flex-1" />

                  {/* Action buttons */}
                  <div className="px-4 pb-4 pt-2 flex flex-col gap-2">
                    <motion.button
                      type="button"
                      onClick={() => chooseChoice(choice.slotIndex)}
                      disabled={isSelecting || isRerolling}
                      whileHover={
                        isSelecting || isRerolling
                          ? undefined
                          : { scale: 1.02, y: -1 }
                      }
                      whileTap={
                        isSelecting || isRerolling
                          ? undefined
                          : { scale: 0.98, y: 1 }
                      }
                      className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-green-500/25 transition-shadow hover:shadow-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSelecting ? (
                        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                      ) : isFullLoadout ? (
                        "Upgrade This Skill"
                      ) : (
                        "Choose This Skill"
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
                          : { scale: 1.02 }
                      }
                      whileTap={
                        isSelecting || isRerolling || remainingCubes < rerollCost
                          ? undefined
                          : { scale: 0.98 }
                      }
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-b-4 border-amber-600 bg-gradient-to-b from-amber-400/15 to-amber-900/25 px-4 py-2.5 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-900/35 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isRerolling ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Reroll <CubeIcon size="xs" /> {rerollCost}
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.article>
              );
            })}
          </motion.section>

          {/* ============================================= */}
          {/*  BACK TO MAP                                  */}
          {/* ============================================= */}
          <motion.div
            variants={itemVariants}
            className="mx-auto mt-5 max-w-[420px]"
          >
            <GameButton
              label="BACK TO MAP"
              variant="secondary"
              onClick={goToMap}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default DraftPage;

import { useEffect, useMemo, useState } from "react";
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
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { getSkillTierIconPath } from "@/ui/theme/ImageAssets";
import PageTopBar from "@/ui/navigation/PageTopBar";
import GameButton from "@/ui/components/shared/GameButton";

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

  const { themeTemplate } = useTheme();

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
      const branchId = slot?.branchId;
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

  if (!draftState?.active) {
    return (
      <div className="h-screen-viewport flex flex-col text-white">
        <PageTopBar
          title="DRAFT EVENT"
          onBack={goToMap}
          cubeBalance={cubeBalance}
        />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center text-slate-300">
            {pendingDraftEvent
              ? "Preparing draft..."
              : "No active draft event."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen-viewport flex flex-col text-white">
      <PageTopBar
        title="DRAFT EVENT"
        onBack={goToMap}
        cubeBalance={cubeBalance}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
        <div className="mx-auto max-w-[860px] space-y-4 pb-8">
          <section className="rounded-2xl border border-emerald-300/30 bg-slate-900/80 px-5 py-4">
            <h2 className="font-['Fredericka_the_Great'] text-2xl text-emerald-200">
              {getStageLabel(
                draftState.eventType,
                draftState.triggerLevel,
                draftState.zone,
              )}
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Choose one skill from the unified pool of 15 skills.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-md border border-slate-600 bg-slate-800/80 px-2 py-1 text-slate-200">
                Wallet: {walletCubes} cubes
              </span>
              <span className="rounded-md border border-slate-600 bg-slate-800/80 px-2 py-1 text-slate-200">
                Rerolls used: {draftState.rerollCount}
              </span>
              <span className="rounded-md border border-slate-600 bg-slate-800/80 px-2 py-1 text-slate-200">
                Reroll spent: {spentCubes}
              </span>
              <span className="rounded-md border border-emerald-500/50 bg-emerald-900/40 px-2 py-1 text-emerald-200">
                Remaining: {remainingCubes}
              </span>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-600/70 bg-slate-900/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-['Fredericka_the_Great'] text-xl text-slate-100">
                Current Run Slots ({runSlots.length}/3)
              </h3>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => {
                const slot = runSlots[index];
                if (!slot) {
                  return (
                    <div
                      key={`empty-slot-${index}`}
                      className="rounded-lg border border-dashed border-slate-700 bg-slate-950/50 px-3 py-2 text-xs text-slate-500"
                    >
                      Empty Slot
                    </div>
                  );
                }

                const skill = getSkillById(slot.skillId);
                const arch = getArchetypeForSkill(slot.skillId);
                return (
                  <div
                    key={`run-slot-${index}-${slot.skillId}`}
                    className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs"
                    style={
                      arch
                        ? {
                            borderLeftColor: arch.color,
                            borderLeftWidth: 3,
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-slate-200">
                        {skill?.name ?? `Skill ${slot.skillId}`}
                      </p>
                      {arch && (
                        <span
                          className="rounded px-1 py-0.5 text-[9px] font-bold uppercase"
                          style={{
                            backgroundColor: `${arch.color}30`,
                            color: arch.color,
                          }}
                        >
                          {arch.name}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400">Level {slot.level}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      {getSkillEffectDescription(
                        slot.skillId,
                        slot.level,
                        slot.branchId,
                      )}
                    </p>
                    {slot.skillId >= 1 && slot.skillId <= 5 && (
                      <p className="text-emerald-300">
                        Charges {slot.charges}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {cards.map((choice) => {
              const skillName =
                choice.skill?.name?.toLowerCase() ?? "";
              const tier = getSkillTier(choice.level);
              const iconPath = getSkillTierIconPath(skillName, tier);
              const isBranchPoint =
                choice.level === 4 && isFullLoadout;

              return (
                <article
                  key={`draft-skill-${choice.slotIndex}-${choice.skillId}`}
                  className="rounded-2xl border bg-slate-900/80 p-4"
                  style={{
                    borderColor: choice.archetype
                      ? `${choice.archetype.color}50`
                      : "rgba(100,116,139,0.5)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    {iconPath && (
                      <img
                        src={iconPath}
                        alt={choice.skill?.name}
                        className="h-10 w-10 rounded-lg object-contain"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex rounded-md border border-sky-400/40 bg-sky-900/30 px-2 py-0.5 text-[10px] font-semibold text-sky-200">
                          {choice.skill?.category === "bonus"
                            ? "Active"
                            : "Passive"}
                        </span>
                        {choice.archetype && (
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                            style={{
                              backgroundColor: `${choice.archetype.color}25`,
                              color: choice.archetype.color,
                            }}
                          >
                            {choice.archetype.name}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1 font-['Fredericka_the_Great'] text-lg leading-tight text-white">
                        {choice.skill?.name ??
                          `Skill ${choice.skillId}`}
                      </h3>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    {isFullLoadout
                      ? `Upgrade to Level ${choice.level + 1}`
                      : "New Skill \u2022 Level 0"}
                  </p>

                  <div className="mt-2 rounded-lg border border-slate-700/50 bg-slate-950/40 px-3 py-2">
                    <p className="text-xs font-medium text-emerald-300">
                      {isFullLoadout
                        ? "Next Level Effect:"
                        : "Effect:"}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-200">
                      {choice.effectDesc}
                    </p>
                  </div>

                  {isFullLoadout && choice.level > 0 && (
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      Current (Lv{choice.level}):{" "}
                      {getSkillEffectDescription(
                        choice.skillId,
                        choice.level,
                        choice.branchId,
                      )}
                    </p>
                  )}

                  {isBranchPoint && choice.skill && (
                    <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2">
                      <p className="text-[11px] font-semibold text-amber-300">
                        Branch Point at Level 5
                      </p>
                      <div className="mt-1 grid grid-cols-2 gap-2 text-[10px]">
                        <div className="rounded border border-slate-700 bg-slate-950/40 p-1.5">
                          <p className="font-bold text-sky-300">
                            A: {choice.skill.branchA}
                          </p>
                          <p className="text-slate-400">
                            {getSkillEffectDescription(
                              choice.skillId,
                              5,
                              1,
                            )}
                          </p>
                        </div>
                        <div className="rounded border border-slate-700 bg-slate-950/40 p-1.5">
                          <p className="font-bold text-purple-300">
                            B: {choice.skill.branchB}
                          </p>
                          <p className="text-slate-400">
                            {getSkillEffectDescription(
                              choice.skillId,
                              5,
                              2,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => chooseChoice(choice.slotIndex)}
                      disabled={isSelecting || isRerolling}
                      className="w-full rounded-lg border border-emerald-400/50 bg-emerald-900/30 px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-900/50 disabled:opacity-50"
                    >
                      {isFullLoadout
                        ? "Upgrade This Skill"
                        : "Choose This Skill"}
                    </button>
                    <button
                      type="button"
                      onClick={() => rerollChoice(choice.slotIndex)}
                      disabled={
                        isSelecting ||
                        isRerolling ||
                        remainingCubes < rerollCost
                      }
                      className="w-full rounded-lg border border-amber-400/50 bg-amber-900/30 px-3 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-900/50 disabled:opacity-50"
                    >
                      Reroll ({rerollCost} cubes)
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          <div className="mx-auto max-w-[420px]">
            <GameButton
              label="BACK TO MAP"
              variant="secondary"
              onClick={goToMap}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraftPage;

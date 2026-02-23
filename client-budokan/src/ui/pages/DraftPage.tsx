import { useEffect, useMemo, useState } from "react";
import { useNavigationStore } from "@/stores/navigationStore";
import { useCubeBalance } from "@/hooks/useCubeBalance";
import { useGame } from "@/hooks/useGame";
import { useDraft } from "@/hooks/useDraft";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { decodeDraftChoice } from "@/utils/draftEvents";
import { showToast } from "@/utils/toast";
import PageTopBar from "@/ui/navigation/PageTopBar";
import GameButton from "@/ui/components/shared/GameButton";

type DraftChoiceKind =
  | "new_bonus"
  | "upgrade_bonus"
  | "zone_modifier"
  | "risk_contract"
  | "relic";

type DraftCardPool = "bonus" | "upgrade" | "world";

interface DraftCard {
  slot: 0 | 1 | 2;
  code: number;
  kind: DraftChoiceKind;
  pool: DraftCardPool;
  title: string;
  description: string;
}

const KIND_LABELS: Record<DraftChoiceKind, string> = {
  new_bonus: "New Bonus",
  upgrade_bonus: "Upgrade",
  zone_modifier: "Zone Mod",
  risk_contract: "Risk",
  relic: "Relic",
};

const KIND_BADGES: Record<DraftChoiceKind, string> = {
  new_bonus: "bg-sky-900/50 border-sky-400/50 text-sky-200",
  upgrade_bonus: "bg-emerald-900/50 border-emerald-400/50 text-emerald-200",
  zone_modifier: "bg-indigo-900/50 border-indigo-400/50 text-indigo-200",
  risk_contract: "bg-amber-900/50 border-amber-400/50 text-amber-200",
  relic: "bg-purple-900/50 border-purple-400/50 text-purple-200",
};

const POOL_TITLES: Record<DraftCardPool, string> = {
  bonus: "Bonus Pool",
  upgrade: "Upgrade Pool",
  world: "World Pool",
};

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

const getRerollCost = (rerollCount: number): number => {
  let cost = 5;
  for (let i = 0; i < rerollCount; i++) {
    cost = Math.ceil((cost * 3) / 2);
  }
  return cost;
};

const getBonusNameFromCode = (bonusCode: number): string => {
  switch (bonusCode) {
    case 1:
      return "Combo";
    case 2:
      return "Score";
    case 3:
      return "Harvest";
    case 4:
      return "Wave";
    case 5:
      return "Supply";
    default:
      return "Unknown";
  }
};

const fallbackCard = (slot: 0 | 1 | 2, code: number): DraftCard => {
  const pool: DraftCardPool = slot === 0 ? "bonus" : slot === 1 ? "upgrade" : "world";
  const fallbackKind: DraftChoiceKind =
    slot === 0 ? "new_bonus" : slot === 1 ? "upgrade_bonus" : "zone_modifier";
  return {
    slot,
    code,
    pool,
    kind: fallbackKind,
    title: `Draft Choice ${code}`,
    description: "Apply this draft choice to continue your run.",
  };
};

const DraftPage: React.FC = () => {
  const navigate = useNavigationStore((s) => s.navigate);
  const gameId = useNavigationStore((s) => s.gameId);
  const setPendingDraftEvent = useNavigationStore((s) => s.setPendingDraftEvent);
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

  const [busySlot, setBusySlot] = useState<number | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const walletCubes = Number(cubeBalance);
  const spentCubes = draftState?.spentCubes ?? 0;
  const remainingCubes = Math.max(0, walletCubes - spentCubes);

  useEffect(() => {
    if (gameId === null) {
      navigate("map");
      return;
    }
    if (!draftState) {
      return;
    }
    if (!draftState.active) {
      setPendingDraftEvent(null);
      navigate("map", gameId);
    }
  }, [draftState, gameId, navigate, setPendingDraftEvent]);

  const cards = useMemo<DraftCard[]>(() => {
    if (!draftState) return [];
    const values = [draftState.choice1, draftState.choice2, draftState.choice3] as const;
    return values.map((code, index) => {
      const slot = index as 0 | 1 | 2;
      const decoded = decodeDraftChoice(code);
      if (!decoded) {
        return fallbackCard(slot, code);
      }
      return {
        slot,
        code,
        kind: decoded.kind as DraftChoiceKind,
        pool: decoded.pool as DraftCardPool,
        title: decoded.title,
        description: decoded.description,
      };
    });
  }, [draftState]);

  const rerollCounts = useMemo<[number, number, number]>(() => {
    if (!draftState) return [0, 0, 0];
    return [draftState.reroll1, draftState.reroll2, draftState.reroll3];
  }, [draftState]);

  const equippedBonusNames = useMemo(() => {
    const selectedBonuses = [
      game?.selectedBonus1 ?? 0,
      game?.selectedBonus2 ?? 0,
      game?.selectedBonus3 ?? 0,
    ];
    return selectedBonuses
      .filter((value) => value > 0)
      .map((value) => getBonusNameFromCode(value));
  }, [game]);

  const goToMap = () => {
    setPendingDraftEvent(null);
    navigate("map", gameId ?? undefined);
  };

  const rerollChoice = async (slot: 0 | 1 | 2) => {
    if (!account || gameId === null || !draftState?.active) return;

    const cost = getRerollCost(rerollCounts[slot]);
    if (remainingCubes < cost) {
      showToast({
        message: `Need ${cost} cubes for reroll.`,
        type: "error",
      });
      return;
    }

    try {
      setBusySlot(slot);
      await systemCalls.rerollDraft({
        account,
        game_id: gameId,
        reroll_slot: slot,
      });
    } catch (error) {
      console.error("Draft reroll failed:", error);
    } finally {
      setBusySlot(null);
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
        <PageTopBar title="DRAFT EVENT" onBack={goToMap} cubeBalance={cubeBalance} />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center text-slate-300">No active draft event.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen-viewport flex flex-col text-white">
      <PageTopBar title="DRAFT EVENT" onBack={goToMap} cubeBalance={cubeBalance} />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
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
              Pick one card from the three dedicated pools. Each slot rerolls only its own pool.
            </p>
            {equippedBonusNames.length > 0 && (
              <p className="mt-2 text-xs text-slate-400">
                Equipped bonuses: {equippedBonusNames.join(", ")}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-md border border-slate-600 bg-slate-800/80 px-2 py-1 text-slate-200">
                Wallet: {walletCubes} cubes
              </span>
              <span className="rounded-md border border-slate-600 bg-slate-800/80 px-2 py-1 text-slate-200">
                Reroll spent: {spentCubes}
              </span>
              <span className="rounded-md border border-emerald-500/50 bg-emerald-900/40 px-2 py-1 text-emerald-200">
                Remaining: {remainingCubes}
              </span>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {cards.map((choice) => {
              const rerollCost = getRerollCost(rerollCounts[choice.slot]);
              const isBusy = busySlot === choice.slot || isSelecting;
              return (
                <article
                  key={`${choice.code}-${choice.slot}-${rerollCounts[choice.slot]}`}
                  className="rounded-2xl border border-slate-600/80 bg-slate-900/80 p-4"
                >
                  <div
                    className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-semibold ${KIND_BADGES[choice.kind]}`}
                  >
                    {KIND_LABELS[choice.kind]}
                  </div>
                  <div className="mt-2 text-[11px] uppercase tracking-wide text-slate-400">
                    {POOL_TITLES[choice.pool]}
                  </div>
                  <h3 className="mt-2 font-['Fredericka_the_Great'] text-lg text-white">
                    {choice.title}
                  </h3>
                  <p className="mt-1 min-h-[56px] text-sm text-slate-300">
                    {choice.description}
                  </p>

                  <div className="mt-4 space-y-2">
                    <button
                      type="button"
                      onClick={() => rerollChoice(choice.slot)}
                      disabled={isBusy}
                      className="w-full rounded-lg border border-amber-400/50 bg-amber-900/30 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-900/50 disabled:opacity-50"
                    >
                      Reroll {POOL_TITLES[choice.pool]} ({rerollCost} cubes)
                    </button>
                    <button
                      type="button"
                      onClick={() => chooseChoice(choice.slot)}
                      disabled={isBusy}
                      className="w-full rounded-lg border border-emerald-400/50 bg-emerald-900/30 px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-900/50 disabled:opacity-50"
                    >
                      Choose This
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          <div className="mx-auto max-w-[420px]">
            <GameButton label="BACK TO MAP" variant="secondary" onClick={goToMap} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraftPage;

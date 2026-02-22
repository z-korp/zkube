import { useEffect, useMemo, useState } from "react";
import { hash } from "starknet";
import { useNavigationStore } from "@/stores/navigationStore";
import { useGame } from "@/hooks/useGame";
import { useCubeBalance } from "@/hooks/useCubeBalance";
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

interface DraftOption {
  key: string;
  kind: DraftChoiceKind;
  title: string;
  description: string;
  minBossClears: number;
}

interface DraftChoiceCard extends DraftOption {
  slot: 0 | 1 | 2;
  pool: DraftCardPool;
}

interface BonusTemplate {
  key: string;
  bonusCode: number;
  bonusName: string;
}

const BONUS_TEMPLATES: BonusTemplate[] = [
  {
    key: "bonus-combo",
    bonusCode: 1,
    bonusName: "Combo",
  },
  {
    key: "bonus-score",
    bonusCode: 2,
    bonusName: "Score",
  },
  {
    key: "bonus-harvest",
    bonusCode: 3,
    bonusName: "Harvest",
  },
  {
    key: "bonus-wave",
    bonusCode: 4,
    bonusName: "Wave",
  },
  {
    key: "bonus-supply",
    bonusCode: 5,
    bonusName: "Supply",
  },
];

const UPGRADE_POOL: DraftOption[] = [
  {
    key: "upgrade-primary",
    kind: "upgrade_bonus",
    title: "Upgrade Active Bonus",
    description: "Increase one equipped bonus level by 1.",
    minBossClears: 0,
  },
  {
    key: "upgrade-double",
    kind: "upgrade_bonus",
    title: "Focus Upgrade",
    description: "Upgrade one bonus now and one after next level clear.",
    minBossClears: 1,
  },
  {
    key: "upgrade-specialize",
    kind: "upgrade_bonus",
    title: "Specialization Choice",
    description:
      "Choose one unlocked specialization path for an equipped bonus.",
    minBossClears: 2,
  },
  {
    key: "upgrade-advanced",
    kind: "upgrade_bonus",
    title: "Advanced Specialization",
    description: "Upgrade or deepen an existing specialization path.",
    minBossClears: 3,
  },
];

const WORLD_POOL: DraftOption[] = [
  {
    key: "zone-free-move",
    kind: "zone_modifier",
    title: "Zone Tempo",
    description: "First move each level in this zone costs 0 moves.",
    minBossClears: 0,
  },
  {
    key: "zone-cube-boost",
    kind: "zone_modifier",
    title: "Zone Bounty",
    description: "+25% cubes from clears for this zone.",
    minBossClears: 0,
  },
  {
    key: "risk-double-cubes",
    kind: "risk_contract",
    title: "Double Gain Contract",
    description: "Double cube gain next zone, add +1 constraint.",
    minBossClears: 0,
  },
  {
    key: "risk-tight-moves",
    kind: "risk_contract",
    title: "Tight Moves Contract",
    description: "Lose 5 max moves next zone, gain one bonus upgrade.",
    minBossClears: 1,
  },
  {
    key: "relic-first-combo",
    kind: "relic",
    title: "Relic: First Strike",
    description: "First combo each level grants a free bonus charge.",
    minBossClears: 2,
  },
  {
    key: "relic-boss-refill",
    kind: "relic",
    title: "Relic: Boss Vigor",
    description: "Boss clears refill all charges.",
    minBossClears: 3,
  },
  {
    key: "relic-constraint-fuel",
    kind: "relic",
    title: "Relic: Constraint Fuel",
    description: "Constraint completion grants one extra bonus charge.",
    minBossClears: 2,
  },
];

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

const SLOT_POOLS: readonly [DraftCardPool, DraftCardPool, DraftCardPool] = [
  "bonus",
  "upgrade",
  "world",
];

const POOL_TITLES: Record<DraftCardPool, string> = {
  bonus: "Bonus Pool",
  upgrade: "Upgrade Pool",
  world: "World Pool",
};

const poseidon = (values: bigint[]): bigint =>
  BigInt(hash.computePoseidonHashOnElements(values));

const modIndex = (value: bigint, size: number): number => {
  if (size <= 0) return 0;
  const abs = value < 0n ? -value : value;
  return Number(abs % BigInt(size));
};

const getRerollCost = (rerollCount: number): number => {
  let cost = 5;
  for (let i = 0; i < rerollCount; i++) {
    cost = Math.ceil((cost * 3) / 2);
  }
  return cost;
};

const getStageLabel = (
  eventType: string,
  triggerLevel: number,
  zone: number,
): string => {
  if (eventType === "post_level_1") return "Post Level 1 Draft";
  if (eventType === "post_boss") {
    return `Post Boss ${Math.floor(triggerLevel / 10)} Draft (Zone ${zone})`;
  }
  return `Zone ${zone} Micro Draft`;
};

const getBossClearsAtDraft = (
  eventType: string,
  triggerLevel: number,
): number => {
  if (eventType === "post_boss") {
    return Math.floor(triggerLevel / 10);
  }
  return Math.floor((triggerLevel - 1) / 10);
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

const parseDraftSession = (
  value: string | null,
): { rerollCounts: [number, number, number]; spentCubes: number } => {
  if (!value) return { rerollCounts: [0, 0, 0], spentCubes: 0 };

  try {
    const parsed = JSON.parse(value) as {
      rerollCounts?: [number, number, number];
      spentCubes?: number;
    };
    return {
      rerollCounts:
        parsed.rerollCounts && parsed.rerollCounts.length === 3
          ? parsed.rerollCounts
          : [0, 0, 0],
      spentCubes:
        typeof parsed.spentCubes === "number" &&
        Number.isFinite(parsed.spentCubes)
          ? parsed.spentCubes
          : 0,
    };
  } catch {
    return { rerollCounts: [0, 0, 0], spentCubes: 0 };
  }
};

const DraftPage: React.FC = () => {
  const goBack = useNavigationStore((s) => s.goBack);
  const navigate = useNavigationStore((s) => s.navigate);
  const gameId = useNavigationStore((s) => s.gameId);
  const pendingDraftEvent = useNavigationStore((s) => s.pendingDraftEvent);
  const setPendingDraftEvent = useNavigationStore(
    (s) => s.setPendingDraftEvent,
  );
  const { cubeBalance } = useCubeBalance();
  const { game, seed } = useGame({
    gameId: gameId ?? undefined,
    shouldLog: false,
  });

  const level = game?.level ?? 1;
  const activeDraftEvent =
    pendingDraftEvent ??
    ({
      type: "zone_micro",
      triggerLevel: level,
      zone: Math.max(1, Math.ceil(level / 10)),
      eventId: `fallback:${level}`,
    } as const);

  const eventType = activeDraftEvent.type;
  const triggerLevel = activeDraftEvent.triggerLevel;
  const stageZone = activeDraftEvent.zone;
  const bossClears = getBossClearsAtDraft(eventType, triggerLevel);
  const selectedBonuses = [
    game?.selectedBonus1 ?? 0,
    game?.selectedBonus2 ?? 0,
    game?.selectedBonus3 ?? 0,
  ];
  const hasEmptySlot = selectedBonuses.some((value) => value === 0);

  const equippedBonusNames = selectedBonuses
    .filter((value) => value > 0)
    .map((value) => getBonusNameFromCode(value));

  const bonusPool = useMemo<DraftOption[]>(() => {
    return BONUS_TEMPLATES.filter((template) => {
      if (hasEmptySlot) return true;
      return !selectedBonuses.includes(template.bonusCode);
    }).map((template) => ({
      key: template.key,
      kind: "new_bonus",
      title: hasEmptySlot
        ? `Add ${template.bonusName} Bonus`
        : `Swap to ${template.bonusName}`,
      description: hasEmptySlot
        ? `Fill an empty slot with ${template.bonusName}.`
        : `Replace one equipped bonus with ${template.bonusName}.`,
      minBossClears: 0,
    }));
  }, [hasEmptySlot, selectedBonuses]);

  const upgradePool = useMemo(
    () => UPGRADE_POOL.filter((choice) => choice.minBossClears <= bossClears),
    [bossClears],
  );

  const worldPool = useMemo(
    () => WORLD_POOL.filter((choice) => choice.minBossClears <= bossClears),
    [bossClears],
  );

  const poolBySlot: Record<DraftCardPool, DraftOption[]> = {
    bonus: bonusPool,
    upgrade: upgradePool,
    world: worldPool,
  };

  const sessionKey = `zkube:draft-session:${gameId ?? "anon"}:${activeDraftEvent.eventId}`;
  const pickKey = `zkube:draft-pick:${gameId ?? "anon"}:${activeDraftEvent.eventId}`;

  const [rerollCounts, setRerollCounts] = useState<[number, number, number]>([
    0, 0, 0,
  ]);
  const [spentCubes, setSpentCubes] = useState(0);

  useEffect(() => {
    const saved = parseDraftSession(localStorage.getItem(sessionKey));
    setRerollCounts(saved.rerollCounts);
    setSpentCubes(saved.spentCubes);
  }, [sessionKey]);

  useEffect(() => {
    localStorage.setItem(
      sessionKey,
      JSON.stringify({
        rerollCounts,
        spentCubes,
      }),
    );
  }, [rerollCounts, sessionKey, spentCubes]);

  const walletCubes = Number(cubeBalance);
  const remainingCubes = Math.max(0, walletCubes - spentCubes);

  const choices = useMemo<DraftChoiceCard[]>(() => {
    const typeSeed =
      eventType === "post_level_1" ? 1n : eventType === "post_boss" ? 2n : 3n;
    const baseSeed = poseidon([
      seed,
      BigInt(triggerLevel),
      BigInt(stageZone),
      typeSeed,
    ]);

    return [0, 1, 2].map((slot) => {
      const poolId = SLOT_POOLS[slot];
      const pool = poolBySlot[poolId];
      const rerollSeed = BigInt(rerollCounts[slot]);
      const slotSeed = poseidon([baseSeed, BigInt(slot), rerollSeed]);
      const index = modIndex(slotSeed, pool.length);

      const fallback: DraftOption = {
        key: `fallback-${poolId}-${slot}`,
        kind: "upgrade_bonus",
        title: "Fallback Upgrade",
        description: "Increase one equipped bonus level by 1.",
        minBossClears: 0,
      };

      const picked = pool[index] ?? fallback;

      return {
        ...picked,
        slot: slot as 0 | 1 | 2,
        pool: poolId,
      };
    });
  }, [eventType, poolBySlot, rerollCounts, seed, stageZone, triggerLevel]);

  const rerollChoice = (slot: 0 | 1 | 2) => {
    const cost = getRerollCost(rerollCounts[slot]);
    if (remainingCubes < cost) {
      showToast({
        message: `Need ${cost} cubes for reroll.`,
        type: "error",
      });
      return;
    }

    setSpentCubes((prev) => prev + cost);
    setRerollCounts((prev) => {
      const next: [number, number, number] = [...prev] as [
        number,
        number,
        number,
      ];
      next[slot] = next[slot] + 1;
      return next;
    });

    const poolName = POOL_TITLES[SLOT_POOLS[slot]];

    showToast({
      message: `${poolName} rerolled for ${cost} cubes.`,
      type: "success",
    });
  };

  const chooseChoice = (choice: DraftChoiceCard) => {
    localStorage.setItem(
      pickKey,
      JSON.stringify({
        ...choice,
        event: activeDraftEvent,
      }),
    );
    localStorage.removeItem(sessionKey);
    setPendingDraftEvent(null);

    showToast({
      message: `Selected: ${choice.title}`,
      type: "success",
    });

    navigate("map", gameId ?? undefined);
  };

  return (
    <div className="h-screen-viewport flex flex-col text-white">
      <PageTopBar
        title="DRAFT EVENT"
        onBack={goBack}
        cubeBalance={cubeBalance}
      />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
        <div className="mx-auto max-w-[860px] space-y-4 pb-8">
          <section className="rounded-2xl border border-emerald-300/30 bg-slate-900/80 px-5 py-4">
            <h2 className="font-['Fredericka_the_Great'] text-2xl text-emerald-200">
              {getStageLabel(eventType, triggerLevel, stageZone)}
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Pick one card from the three dedicated pools. Each slot rerolls
              only its own pool.
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
            {choices.map((choice) => {
              const rerollCost = getRerollCost(rerollCounts[choice.slot]);
              return (
                <article
                  key={`${choice.key}-${choice.slot}-${rerollCounts[choice.slot]}`}
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
                      className="w-full rounded-lg border border-amber-400/50 bg-amber-900/30 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-900/50"
                    >
                      Reroll {POOL_TITLES[choice.pool]} ({rerollCost} cubes)
                    </button>
                    <button
                      type="button"
                      onClick={() => chooseChoice(choice)}
                      className="w-full rounded-lg border border-emerald-400/50 bg-emerald-900/30 px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-900/50"
                    >
                      Choose This
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
              onClick={() => navigate("map", gameId ?? undefined)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraftPage;

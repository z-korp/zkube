import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useDojo } from "@/dojo/useDojo";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import useAccountCustom from "@/hooks/useAccountCustom";
import {
  Bonus,
  BonusType,
  bonusTypeToContractValue,
} from "@/dojo/game/types/bonus";
import { DEFAULT_SETTINGS_ID } from "@/dojo/game/types/level";
import { showToast } from "@/utils/toast";
import { useNavigationStore } from "@/stores/navigationStore";
import ImageAssets from "@/ui/theme/ImageAssets";
import PageTopBar from "@/ui/navigation/PageTopBar";
import GameButton from "@/ui/components/shared/GameButton";
import useViewport from "@/hooks/useViewport";

const LOADOUT_STORAGE_KEY = "zkube_loadout";

interface LoadoutData {
  selectedBonuses: BonusType[];
}

const loadSavedLoadout = (): LoadoutData | null => {
  try {
    const saved = localStorage.getItem(LOADOUT_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    /* noop */
  }
  return null;
};

const saveLoadout = (loadout: LoadoutData) => {
  try {
    localStorage.setItem(LOADOUT_STORAGE_KEY, JSON.stringify(loadout));
  } catch {
    /* noop */
  }
};

const ALL_BONUSES: BonusType[] = [
  BonusType.Combo,
  BonusType.Score,
  BonusType.Harvest,
  BonusType.Wave,
  BonusType.Supply,
];

const DEFAULT_BONUSES: BonusType[] = [
  BonusType.Combo,
  BonusType.Harvest,
  BonusType.Score,
];

const LoadoutPage: React.FC = () => {
  useViewport();

  const { account } = useAccountCustom();
  const { themeTemplate } = useTheme();
  const { username } = useControllerUsername();
  const goBack = useNavigationStore((s) => s.goBack);
  const navigate = useNavigationStore((s) => s.navigate);
  const imgAssets = ImageAssets(themeTemplate);

  const {
    setup: {
      systemCalls: { freeMint, create },
    },
  } = useDojo();

  const [selected, setSelected] = useState<BonusType[]>(DEFAULT_BONUSES);
  const [isLoading, setIsLoading] = useState(false);
  const autoStartTriggered = useRef(false);

  useEffect(() => {
    const saved = loadSavedLoadout();
    if (saved) {
      setSelected(
        saved.selectedBonuses.length === 3
          ? saved.selectedBonuses
          : DEFAULT_BONUSES,
      );
    }
  }, []);

  const unlockedMap = useMemo(
    (): Record<BonusType, boolean> => ({
      [BonusType.None]: true,
      [BonusType.Combo]: true,
      [BonusType.Score]: true,
      [BonusType.Harvest]: true,
      [BonusType.Wave]: true,
      [BonusType.Supply]: true,
    }),
    [],
  );

  const unlockedBonuses = useMemo(
    () => ALL_BONUSES.filter((b) => unlockedMap[b]),
    [unlockedMap],
  );

  const getBonusIcon = useCallback(
    (type: BonusType): string => {
      switch (type) {
        case BonusType.Combo:
          return imgAssets.combo;
        case BonusType.Score:
          return imgAssets.score;
        case BonusType.Harvest:
          return imgAssets.harvest;
        case BonusType.Wave:
          return imgAssets.wave;
        case BonusType.Supply:
          return imgAssets.supply;
        default:
          return "";
      }
    },
    [
      imgAssets.combo,
      imgAssets.score,
      imgAssets.harvest,
      imgAssets.wave,
      imgAssets.supply,
    ],
  );

  const getBonusStats = useCallback((type: BonusType) => {
    void type;
    return { bagSize: 0, startingCount: 0 };
  }, []);

  const toggleBonus = useCallback(
    (type: BonusType) => {
      if (!unlockedMap[type]) return;
      setSelected((prev) => {
        if (prev.includes(type)) return prev.filter((b) => b !== type);
        if (prev.length >= 3) return prev;
        return [...prev, type];
      });
    },
    [unlockedMap],
  );

  const handleStartGame = useCallback(
    async (bonusOverride?: BonusType[]) => {
      const bonuses = bonusOverride ?? selected;
      if (!account || bonuses.length !== 3) return;

      setIsLoading(true);
      try {
        saveLoadout({ selectedBonuses: bonuses });

        const mintResult = await freeMint({
          account,
          name: username ?? "",
          settingsId: DEFAULT_SETTINGS_ID,
        });

        const gameId = mintResult.game_id;
        if (!gameId) throw new Error("Failed to extract game_id from mint");

        const selectedValues = bonuses.map((type) =>
          bonusTypeToContractValue(type),
        );
        await create({
          account,
          token_id: gameId,
          selected_bonuses: selectedValues,
        });

        showToast({
          message: `Game #${gameId} started!`,
          type: "success",
        });

        navigate("map", gameId);
      } catch (error) {
        console.error("Error starting game:", error);
        showToast({
          message:
            "Failed to start game. Check My Games if a token was minted.",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [account, selected, username, freeMint, create, navigate],
  );

  void autoStartTriggered;

  return (
    <div className="h-screen-viewport flex flex-col">
      <PageTopBar title="SELECT LOADOUT" onBack={goBack} cubeBalance={0n} />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
        <div className="max-w-[520px] mx-auto flex flex-col gap-6 pb-8">
          <section className="bg-slate-900/80 rounded-xl border border-slate-600/60 p-4">
            <p className="text-center text-base font-['Fredericka_the_Great'] text-slate-200 mb-1">
              Choose Your Bonuses
            </p>
            <p className="text-center text-xs text-slate-400 mb-4">
              Pick 3 bonuses to bring into your run. Use them during gameplay to
              clear lines, boost score, or earn cubes.
            </p>

            {selected.length !== 3 && (
              <div className="text-center text-sm text-orange-400 mb-3 bg-orange-500/10 py-2 rounded-lg">
                Select {3 - selected.length} more bonus
                {3 - selected.length !== 1 ? "es" : ""}
              </div>
            )}

            <div className="flex flex-col gap-2">
              {ALL_BONUSES.map((bonusType, index) => {
                const isSelected = selected.includes(bonusType);
                const icon = getBonusIcon(bonusType);
                const stats = getBonusStats(bonusType);
                const bonus = new Bonus(bonusType);
                const description = bonus.getEffect(0);

                return (
                  <motion.button
                    key={bonusType}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleBonus(bonusType)}
                    className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-yellow-400 bg-yellow-500/15 shadow-[0_0_14px_rgba(250,204,21,0.2)]"
                        : "border-slate-600 bg-slate-800/80"
                    } hover:border-slate-400`}
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-slate-600">
                      <img
                        src={icon}
                        alt={bonusType}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
                      <span className="text-sm font-['Fredericka_the_Great'] font-semibold text-white">
                        {bonusType}
                      </span>
                      <span className="text-xs text-slate-400 text-left">
                        {description}
                      </span>
                      {(stats.startingCount > 0 || stats.bagSize > 0) && (
                        <div className="flex gap-1 mt-0.5">
                          {stats.startingCount > 0 && (
                            <span className="bg-green-500/20 text-green-400 text-[9px] px-1.5 py-0.5 rounded">
                              +{stats.startingCount} start
                            </span>
                          )}
                          {stats.bagSize > 0 && (
                            <span className="bg-blue-500/20 text-blue-400 text-[9px] px-1.5 py-0.5 rounded">
                              Bag {stats.bagSize}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </section>

          <div className="flex flex-col gap-3">
            <GameButton
              label="START GAME"
              variant="primary"
              disabled={selected.length !== 3}
              loading={isLoading}
              onClick={() => handleStartGame()}
            />
            <GameButton
              label="CANCEL"
              variant="secondary"
              onClick={goBack}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadoutPage;

import { Dialog, DialogContent, DialogTitle } from "@/ui/elements/dialog";
import { usePlayerMeta, type PlayerMetaData } from "@/hooks/usePlayerMeta";
import { useCubeBalance } from "@/hooks/useCubeBalance";
import { useDojo } from "@/dojo/useDojo";
import { useMusicPlayer } from "@/contexts/hooks";
import useAccountCustom from "@/hooks/useAccountCustom";
import { Button } from "@/ui/elements/button";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ImageAssets from "@/ui/theme/ImageAssets";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/elements/tooltip";
import { ArrowUp, Info } from "lucide-react";

interface ShopDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Upgrade costs matching the contract
const STARTING_BONUS_COSTS = [100, 250, 500];
const BAG_SIZE_COSTS = [100, 250, 500];
const BRIDGING_COSTS = [200, 500, 1000];
const UNLOCK_BONUS_COST = 200;

const getBagSizeCost = (level: number): number | null =>
  level < 3 ? BAG_SIZE_COSTS[level] : null;
const getBridgingCost = (rank: number): number | null =>
  rank < 3 ? BRIDGING_COSTS[rank] : null;
const getStartingBonusCost = (level: number): number | null =>
  level < 3 ? STARTING_BONUS_COSTS[level] : null;
const getMaxCubesToBring = (rank: number): number => {
  if (rank === 0) return 0;
  return 5 * Math.pow(2, rank - 1);
};

interface OptimisticOverrides {
  startingCombo?: number;
  startingScore?: number;
  startingHarvest?: number;
  startingWave?: number;
  startingSupply?: number;
  bagComboLevel?: number;
  bagScoreLevel?: number;
  bagHarvestLevel?: number;
  bagWaveLevel?: number;
  bagSupplyLevel?: number;
  bridgingRank?: number;
  shrinkUnlocked?: boolean;
  shuffleUnlocked?: boolean;
}

const BONUS_DESCRIPTIONS: Record<number, string> = {
  0: "Add combo to your next move.",
  1: "Add instant bonus score.",
  2: "Destroy all blocks of a chosen size.",
  3: "Clear horizontal rows.",
  4: "Add new lines at no move cost.",
};

const LevelPips = ({ current, max }: { current: number; max: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: max }).map((_, i) => (
      <div
        key={i}
        className={`w-1.5 h-1.5 rounded-full ${
          i < current ? "bg-yellow-400" : "bg-slate-600"
        }`}
      />
    ))}
  </div>
);

const InfoTip = ({ text }: { text: string }) => (
  <TooltipProvider delayDuration={0}>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help ml-1 text-slate-500 hover:text-slate-300 transition-colors">
          <Info size={10} className="text-[10px]" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[200px] text-xs">
        {text}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const ShopDialog: React.FC<ShopDialogProps> = ({ isOpen, onClose }) => {
  const { playerMeta } = usePlayerMeta();
  const {
    cubeBalance: cubeBalanceBigInt,
    refetch: refetchCubeBalance,
  } = useCubeBalance();
  const { account } = useAccountCustom();
  const { playSfx } = useMusicPlayer();
  const {
    setup: { systemCalls },
  } = useDojo();
  const { themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);

  const [isUpgrading, setIsUpgrading] = useState(false);
  const [optimisticOverrides, setOptimisticOverrides] =
    useState<OptimisticOverrides>({});
  const [optimisticCubeSpent, setOptimisticCubeSpent] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setOptimisticOverrides({});
      setOptimisticCubeSpent(0);
    }
  }, [isOpen]);

  const data: PlayerMetaData | null = useMemo(() => {
    const chainData = playerMeta?.data;
    if (!chainData) return null;
    return { ...chainData, ...optimisticOverrides };
  }, [playerMeta?.data, optimisticOverrides]);

  const cubeBalance = Number(cubeBalanceBigInt) - optimisticCubeSpent;

  const applyOptimistic = useCallback(
    (field: keyof OptimisticOverrides, newValue: number | boolean, cost: number) => {
      setOptimisticOverrides((prev) => ({ ...prev, [field]: newValue }));
      setOptimisticCubeSpent((prev) => prev + cost);
    },
    [],
  );

  const handleUpgradeStartingBonus = async (bonusType: number) => {
    if (!account || !data) return;
    const fieldMap: Record<number, keyof OptimisticOverrides> = {
      0: "startingCombo",
      1: "startingScore",
      2: "startingHarvest",
      3: "startingWave",
      4: "startingSupply",
    };
    const field = fieldMap[bonusType];
    const currentLevel = data[field] as number;
    const cost = getStartingBonusCost(currentLevel);
    if (cost === null) return;

    applyOptimistic(field, currentLevel + 1, cost);
    setIsUpgrading(true);
    try {
      await systemCalls.upgradeStartingBonus({
        account,
        bonus_type: bonusType,
      });
      playSfx("shop-purchase");
      // Reset optimistic cube spent before refetch to avoid double deduction
      setOptimisticCubeSpent(0);
      await refetchCubeBalance();
    } catch (error) {
      console.error("Upgrade failed:", error);
      setOptimisticOverrides((prev) => ({ ...prev, [field]: undefined }));
      setOptimisticCubeSpent((prev) => prev - cost);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleUpgradeBagSize = async (bonusType: number) => {
    if (!account || !data) return;
    const fieldMap: Record<number, keyof OptimisticOverrides> = {
      0: "bagComboLevel",
      1: "bagScoreLevel",
      2: "bagHarvestLevel",
      3: "bagWaveLevel",
      4: "bagSupplyLevel",
    };
    const field = fieldMap[bonusType];
    const currentLevel = data[field] as number;
    const cost = getBagSizeCost(currentLevel);
    if (cost === null) return;

    applyOptimistic(field, currentLevel + 1, cost);
    setIsUpgrading(true);
    try {
      await systemCalls.upgradeBagSize({ account, bonus_type: bonusType });
      playSfx("shop-purchase");
      // Reset optimistic cube spent before refetch to avoid double deduction
      setOptimisticCubeSpent(0);
      await refetchCubeBalance();
    } catch (error) {
      console.error("Upgrade failed:", error);
      setOptimisticOverrides((prev) => ({ ...prev, [field]: undefined }));
      setOptimisticCubeSpent((prev) => prev - cost);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleUpgradeBridging = async () => {
    if (!account || !data) return;
    const currentRank = data.bridgingRank;
    const cost = getBridgingCost(currentRank);
    if (cost === null) return;

    applyOptimistic("bridgingRank", currentRank + 1, cost);
    setIsUpgrading(true);
    try {
      await systemCalls.upgradeBridgingRank({ account });
      // Reset optimistic cube spent before refetch to avoid double deduction
      setOptimisticCubeSpent(0);
      await refetchCubeBalance();
    } catch (error) {
      console.error("Upgrade failed:", error);
      setOptimisticOverrides((prev) => ({
        ...prev,
        bridgingRank: undefined,
      }));
      setOptimisticCubeSpent((prev) => prev - cost);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleUnlockBonus = async (bonusType: number) => {
    if (!account || !data) return;
    const field: keyof OptimisticOverrides = bonusType === 4 ? "shrinkUnlocked" : "shuffleUnlocked";
    const alreadyUnlocked = field === "shrinkUnlocked" ? data.shrinkUnlocked : data.shuffleUnlocked;
    if (alreadyUnlocked) return;

    applyOptimistic(field, true, UNLOCK_BONUS_COST);
    setIsUpgrading(true);
    try {
      await systemCalls.unlockBonus({ account, bonus_type: bonusType });
      // Reset optimistic cube spent before refetch to avoid double deduction
      setOptimisticCubeSpent(0);
      await refetchCubeBalance();
    } catch (error) {
      console.error("Unlock failed:", error);
      setOptimisticOverrides((prev) => ({ ...prev, [field]: undefined }));
      setOptimisticCubeSpent((prev) => prev - UNLOCK_BONUS_COST);
    } finally {
      setIsUpgrading(false);
    }
  };

  const bonusTypes = [
    { id: 0, name: "Combo", img: imgAssets.combo },
    { id: 1, name: "Score", img: imgAssets.score },
    { id: 2, name: "Harvest", img: imgAssets.harvest },
    { id: 3, name: "Wave", img: imgAssets.wave },
    { id: 4, name: "Supply", img: imgAssets.supply },
  ];

  const getStartingLevel = (bonusId: number): number => {
    if (!data) return 0;
    return bonusId === 0
      ? data.startingCombo
      : bonusId === 1
        ? data.startingScore
        : bonusId === 2
          ? data.startingHarvest
          : bonusId === 3
            ? data.startingWave
            : data.startingSupply;
  };

  const getBagLevel = (bonusId: number): number => {
    if (!data) return 0;
    return bonusId === 0
      ? data.bagComboLevel
      : bonusId === 1
        ? data.bagScoreLevel
        : bonusId === 2
          ? data.bagHarvestLevel
          : bonusId === 3
            ? data.bagWaveLevel
            : data.bagSupplyLevel;
  };

  const bridgingRank = data?.bridgingRank || 0;
  const bridgingCost = getBridgingCost(bridgingRank);
  const bridgingMaxed = bridgingCost === null;
  const canAffordBridging = !bridgingMaxed && cubeBalance >= (bridgingCost ?? 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[460px] w-[95%] flex flex-col mx-auto justify-start rounded-lg px-4 py-4 max-h-[85vh] overflow-y-auto gap-0"
      >
        <DialogTitle className="text-2xl text-center mb-2">
          Permanent Shop
        </DialogTitle>

        {/* Cube Balance */}
        <div className="text-center mb-3 bg-slate-800/50 py-2 rounded-lg">
          <div className="text-xl font-bold text-yellow-400 flex items-center justify-center gap-2">
            <span>🧊</span>
            {cubeBalance.toLocaleString()}
            <span className="text-sm font-normal text-slate-400">cubes</span>
          </div>
        </div>

        {/* Grid: 2 columns, 3 rows (5 bonuses + bridging) */}
        <div className="grid grid-cols-2 gap-2">
          {bonusTypes.map((bonus) => {
            const startLevel = getStartingLevel(bonus.id);
            const bagLevel = getBagLevel(bonus.id);
            const startCost = getStartingBonusCost(startLevel);
            const bagCost = getBagSizeCost(bagLevel);
            const startMaxed = startCost === null;
            const bagMaxed = bagCost === null;
            const isUnlocked = bonus.id <= 2
              ? true
              : bonus.id === 3
                ? data?.shrinkUnlocked
                : data?.shuffleUnlocked;
            const canAffordStart = !!isUnlocked && !startMaxed && cubeBalance >= (startCost ?? 0);
            const canAffordBag = !!isUnlocked && !bagMaxed && cubeBalance >= (bagCost ?? 0);

            return (
              <div
                key={bonus.id}
                className="bg-slate-800/30 rounded-lg p-2.5 border border-slate-700/40 flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={bonus.img}
                    alt={bonus.name}
                    className="w-7 h-7"
                  />
                  <span className="text-xs font-semibold">{bonus.name}</span>
                  <InfoTip text={BONUS_DESCRIPTIONS[bonus.id]} />
                </div>

                {/* Starting bonus */}
                <div className="mb-1.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider">
                      Starting
                    </span>
                    <LevelPips current={startLevel} max={3} />
                  </div>
                  <Button
                    size="sm"
                    disabled={isUpgrading || !isUnlocked || startMaxed || !canAffordStart}
                    onClick={() => handleUpgradeStartingBonus(bonus.id)}
                    className="w-full text-[10px] h-6"
                  >
                    {!isUnlocked ? "Locked" : startMaxed ? "MAX" : `${startCost} 🧊`}
                  </Button>
                </div>

                {/* Bag size */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider">
                      Bag
                    </span>
                    <LevelPips current={bagLevel} max={3} />
                  </div>
                  <Button
                    size="sm"
                    disabled={isUpgrading || !isUnlocked || bagMaxed || !canAffordBag}
                    onClick={() => handleUpgradeBagSize(bonus.id)}
                    className="w-full text-[10px] h-6"
                  >
                    {!isUnlocked ? "Locked" : bagMaxed ? "MAX" : `${bagCost} 🧊`}
                  </Button>
                </div>

                {!isUnlocked && bonus.id >= 3 && (
                  <div className="mt-1.5">
                    <Button
                      size="sm"
                      disabled={isUpgrading || cubeBalance < UNLOCK_BONUS_COST}
                      onClick={() => handleUnlockBonus(bonus.id + 1)}
                      className="w-full text-[10px] h-6"
                    >
                      {UNLOCK_BONUS_COST} 🧊 Unlock
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Bridging Rank - inline with bonuses */}
          <div className="bg-slate-800/30 rounded-lg p-2.5 border border-slate-700/40 flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center">
                <ArrowUp size={12} className="text-purple-400 text-xs" />
              </div>
              <span className="text-xs font-semibold">Bridging</span>
              <InfoTip text="Bring cubes from your wallet into a run to spend at the in-game shop." />
            </div>

            {/* Rank display */}
            <div className="mb-1.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider">
                  Rank
                </span>
                <LevelPips current={bridgingRank} max={3} />
              </div>
              <div className="text-[10px] text-slate-400 mb-1">
                Max {getMaxCubesToBring(bridgingRank)} cubes/run
              </div>
            </div>

            {/* Upgrade button */}
            <Button
              size="sm"
              disabled={isUpgrading || bridgingMaxed || !canAffordBridging}
              onClick={handleUpgradeBridging}
              className="w-full text-[10px] h-6 mt-auto"
            >
              {bridgingMaxed ? "MAX" : `${bridgingCost} 🧊`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

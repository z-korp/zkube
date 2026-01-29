import { Dialog, DialogContent, DialogTitle } from "@/ui/elements/dialog";
import { usePlayerMeta, type PlayerMetaData } from "@/hooks/usePlayerMeta";
import { useCubeBalance } from "@/hooks/useCubeBalance";
import { useDojo } from "@/dojo/useDojo";
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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUp,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";

interface ShopDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Upgrade costs matching the contract
const STARTING_BONUS_COSTS = [50, 200, 500];
const BAG_SIZE_BASE_COST = 10;
const BRIDGING_BASE_COST = 100;

const getBagSizeCost = (level: number) =>
  BAG_SIZE_BASE_COST * Math.pow(2, level);
const getBridgingCost = (rank: number) =>
  BRIDGING_BASE_COST * Math.pow(2, rank);
const getStartingBonusCost = (level: number): number | null =>
  level < 3 ? STARTING_BONUS_COSTS[level] : null;
const getMaxCubesToBring = (rank: number): number => {
  if (rank === 0) return 0;
  return 5 * Math.pow(2, rank - 1);
};

interface OptimisticOverrides {
  startingHammer?: number;
  startingWave?: number;
  startingTotem?: number;
  bagHammerLevel?: number;
  bagWaveLevel?: number;
  bagTotemLevel?: number;
  bridgingRank?: number;
}

const BONUS_DESCRIPTIONS: Record<number, string> = {
  0: "Destroys a block and all connected blocks of the same color.",
  1: "Clears an entire horizontal row.",
  2: "Clears all blocks in a vertical column.",
};

const LevelPips = ({ current, max }: { current: number; max: number }) => (
  <div className="flex gap-1">
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
          <FontAwesomeIcon icon={faCircleInfo} className="text-xs" />
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
    (field: keyof OptimisticOverrides, newValue: number, cost: number) => {
      setOptimisticOverrides((prev) => ({ ...prev, [field]: newValue }));
      setOptimisticCubeSpent((prev) => prev + cost);
    },
    [],
  );

  const handleUpgradeStartingBonus = async (bonusType: number) => {
    if (!account || !data) return;
    const fieldMap: Record<number, keyof OptimisticOverrides> = {
      0: "startingHammer",
      1: "startingWave",
      2: "startingTotem",
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
      refetchCubeBalance();
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
      0: "bagHammerLevel",
      1: "bagWaveLevel",
      2: "bagTotemLevel",
    };
    const field = fieldMap[bonusType];
    const currentLevel = data[field] as number;
    const cost = getBagSizeCost(currentLevel);

    applyOptimistic(field, currentLevel + 1, cost);
    setIsUpgrading(true);
    try {
      await systemCalls.upgradeBagSize({ account, bonus_type: bonusType });
      refetchCubeBalance();
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

    applyOptimistic("bridgingRank", currentRank + 1, cost);
    setIsUpgrading(true);
    try {
      await systemCalls.upgradeBridgingRank({ account });
      refetchCubeBalance();
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

  const bonusTypes = [
    { id: 0, name: "Hammer", img: imgAssets.hammer },
    { id: 1, name: "Wave", img: imgAssets.wave },
    { id: 2, name: "Totem", img: imgAssets.tiki },
  ];

  const getStartingLevel = (bonusId: number): number => {
    if (!data) return 0;
    return bonusId === 0
      ? data.startingHammer
      : bonusId === 1
        ? data.startingWave
        : data.startingTotem;
  };

  const getBagLevel = (bonusId: number): number => {
    if (!data) return 0;
    return bonusId === 0
      ? data.bagHammerLevel
      : bonusId === 1
        ? data.bagWaveLevel
        : data.bagTotemLevel;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[500px] w-[95%] flex flex-col mx-auto justify-start rounded-lg px-5 py-5 max-h-[85vh] overflow-y-auto gap-0"
      >
        <DialogTitle className="text-3xl text-center mb-3">
          Permanent Shop
        </DialogTitle>

        {/* Cube Balance */}
        <div className="text-center mb-4 bg-slate-800/50 py-2 rounded-lg">
          <div className="text-2xl font-bold text-yellow-400 flex items-center justify-center gap-2">
            <span>🧊</span>
            {cubeBalance.toLocaleString()}
            <span className="text-sm font-normal text-slate-400">cubes</span>
          </div>
        </div>

        {/* Bonus tiles: 2 per row, 3rd centered */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {bonusTypes.map((bonus) => {
            const startLevel = getStartingLevel(bonus.id);
            const bagLevel = getBagLevel(bonus.id);
            const startCost = getStartingBonusCost(startLevel);
            const bagCost = getBagSizeCost(bagLevel);
            const startMaxed = startCost === null;
            const canAffordStart = !startMaxed && cubeBalance >= startCost;
            const canAffordBag = cubeBalance >= bagCost;

            // 3rd item spans full width but renders at half size centered
            const isLast = bonus.id === bonusTypes.length - 1 && bonusTypes.length % 2 !== 0;

            return (
              <div
                key={bonus.id}
                className={`bg-slate-800/30 rounded-lg p-3 border border-slate-700/40 flex flex-col ${
                  isLast ? "col-span-2 max-w-[50%] mx-auto w-full" : ""
                }`}
              >
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                  <img
                    src={bonus.img}
                    alt={bonus.name}
                    className="w-8 h-8"
                  />
                  <span className="text-sm font-semibold">{bonus.name}</span>
                  <InfoTip text={BONUS_DESCRIPTIONS[bonus.id]} />
                </div>

                {/* Starting bonus */}
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Starting
                    </span>
                    <LevelPips current={startLevel} max={3} />
                  </div>
                  <Button
                    size="sm"
                    disabled={isUpgrading || startMaxed || !canAffordStart}
                    onClick={() => handleUpgradeStartingBonus(bonus.id)}
                    className="w-full text-xs h-7"
                  >
                    {startMaxed ? "MAX" : `${startCost} 🧊`}
                  </Button>
                </div>

                {/* Bag size */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Bag
                    </span>
                    <LevelPips current={bagLevel} max={5} />
                  </div>
                  <Button
                    size="sm"
                    disabled={isUpgrading || !canAffordBag}
                    onClick={() => handleUpgradeBagSize(bonus.id)}
                    className="w-full text-xs h-7"
                  >
                    {bagCost} 🧊
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bridging Rank */}
        <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faArrowUp}
                  className="text-purple-400 text-sm"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">Bridging</span>
                  <InfoTip text="Bring cubes from your wallet into a run to spend at the in-game shop." />
                  <LevelPips current={data?.bridgingRank || 0} max={5} />
                </div>
                <div className="text-[10px] text-slate-400">
                  Rank {data?.bridgingRank || 0} — max{" "}
                  {getMaxCubesToBring(data?.bridgingRank || 0)} cubes/run
                </div>
              </div>
            </div>
            <Button
              size="sm"
              disabled={
                isUpgrading ||
                cubeBalance < getBridgingCost(data?.bridgingRank || 0)
              }
              onClick={handleUpgradeBridging}
              className="min-w-[80px] text-xs h-7"
            >
              {getBridgingCost(data?.bridgingRank || 0)} 🧊
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

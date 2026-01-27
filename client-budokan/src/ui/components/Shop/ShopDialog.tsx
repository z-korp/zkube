import { Dialog, DialogContent, DialogTitle } from "@/ui/elements/dialog";
import { usePlayerMeta } from "@/hooks/usePlayerMeta";
import { useCubeBalance } from "@/hooks/useCubeBalance";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { Button } from "@/ui/elements/button";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHammer, faWater, faTree, faArrowUp } from "@fortawesome/free-solid-svg-icons";

interface ShopDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Upgrade costs matching the contract
const STARTING_BONUS_COSTS = [50, 200, 500]; // Levels 1, 2, 3
const BAG_SIZE_BASE_COST = 10; // 10 * 2^level
const BRIDGING_BASE_COST = 100; // 100 * 2^rank

const getBagSizeCost = (level: number) => BAG_SIZE_BASE_COST * Math.pow(2, level);
const getBridgingCost = (rank: number) => BRIDGING_BASE_COST * Math.pow(2, rank);
const getStartingBonusCost = (level: number) => level < 3 ? STARTING_BONUS_COSTS[level] : null;

export const ShopDialog: React.FC<ShopDialogProps> = ({ isOpen, onClose }) => {
  const { playerMeta } = usePlayerMeta();
  const { cubeBalance: cubeBalanceBigInt, refetch: refetchCubeBalance } = useCubeBalance();
  const { account } = useAccountCustom();
  const {
    setup: { systemCalls },
  } = useDojo();

  const [isUpgrading, setIsUpgrading] = useState(false);

  const cubeBalance = Number(cubeBalanceBigInt);
  const data = playerMeta?.data;

  const handleUpgradeStartingBonus = async (bonusType: number) => {
    if (!account) return;
    setIsUpgrading(true);
    try {
      await systemCalls.upgradeStartingBonus({ account, bonus_type: bonusType });
      // Refetch cube balance after successful upgrade
      await refetchCubeBalance();
    } catch (error) {
      console.error("Upgrade failed:", error);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleUpgradeBagSize = async (bonusType: number) => {
    if (!account) return;
    setIsUpgrading(true);
    try {
      await systemCalls.upgradeBagSize({ account, bonus_type: bonusType });
      // Refetch cube balance after successful upgrade
      await refetchCubeBalance();
    } catch (error) {
      console.error("Upgrade failed:", error);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleUpgradeBridging = async () => {
    if (!account) return;
    setIsUpgrading(true);
    try {
      await systemCalls.upgradeBridgingRank({ account });
      // Refetch cube balance after successful upgrade
      await refetchCubeBalance();
    } catch (error) {
      console.error("Upgrade failed:", error);
    } finally {
      setIsUpgrading(false);
    }
  };

  const bonusTypes = [
    { id: 0, name: "Hammer", icon: faHammer, color: "text-red-400" },
    { id: 1, name: "Wave", icon: faWater, color: "text-blue-400" },
    { id: 2, name: "Totem", icon: faTree, color: "text-green-400" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[500px] w-[95%] flex flex-col mx-auto justify-start rounded-lg px-6 py-8 max-h-[80vh] overflow-y-auto"
      >
        <DialogTitle className="text-3xl text-center mb-2">
          Permanent Shop
        </DialogTitle>

        {/* Cube Balance */}
        <div className="text-center mb-6 bg-slate-800/50 py-3 rounded-lg">
          <div className="text-2xl font-bold text-yellow-400 flex items-center justify-center gap-2">
            <span>🧊</span>
            {cubeBalance.toLocaleString()}
            <span className="text-sm font-normal text-slate-400">cubes</span>
          </div>
        </div>

        {/* Starting Bonuses Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-slate-300">Starting Bonuses</h3>
          <p className="text-xs text-slate-500 mb-3">Start each run with bonus items</p>
          <div className="flex flex-col gap-2">
            {bonusTypes.map((bonus) => {
              const currentLevel = data ? 
                (bonus.id === 0 ? data.startingHammer : bonus.id === 1 ? data.startingWave : data.startingTotem) : 0;
              const cost = getStartingBonusCost(currentLevel);
              const canAfford = cost !== null && cubeBalance >= cost;
              const isMaxed = cost === null;

              return (
                <div key={bonus.id} className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={bonus.icon} className={`${bonus.color} text-xl`} />
                    <div>
                      <div className="font-medium">{bonus.name}</div>
                      <div className="text-xs text-slate-400">Level {currentLevel}/3</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={isUpgrading || isMaxed || !canAfford}
                    onClick={() => handleUpgradeStartingBonus(bonus.id)}
                    className="min-w-[100px]"
                  >
                    {isMaxed ? "MAX" : `${cost} 🧊`}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bag Size Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-slate-300">Bag Size</h3>
          <p className="text-xs text-slate-500 mb-3">Carry more bonuses during a run</p>
          <div className="flex flex-col gap-2">
            {bonusTypes.map((bonus) => {
              const currentLevel = data ?
                (bonus.id === 0 ? data.bagHammerLevel : bonus.id === 1 ? data.bagWaveLevel : data.bagTotemLevel) : 0;
              const cost = getBagSizeCost(currentLevel);
              const canAfford = cubeBalance >= cost;
              const maxCapacity = 3 + currentLevel; // Base 3 + level

              return (
                <div key={bonus.id} className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={bonus.icon} className={`${bonus.color} text-xl`} />
                    <div>
                      <div className="font-medium">{bonus.name} Bag</div>
                      <div className="text-xs text-slate-400">Capacity: {maxCapacity}</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={isUpgrading || !canAfford}
                    onClick={() => handleUpgradeBagSize(bonus.id)}
                    className="min-w-[100px]"
                  >
                    {cost} 🧊
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bridging Rank Section */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-3 text-slate-300">Bridging Rank</h3>
          <p className="text-xs text-slate-500 mb-3">Unlock special abilities</p>
          <div className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faArrowUp} className="text-purple-400 text-xl" />
              <div>
                <div className="font-medium">Bridging</div>
                <div className="text-xs text-slate-400">Rank {data?.bridgingRank || 0}</div>
              </div>
            </div>
            <Button
              size="sm"
              disabled={isUpgrading || cubeBalance < getBridgingCost(data?.bridgingRank || 0)}
              onClick={handleUpgradeBridging}
              className="min-w-[100px]"
            >
              {getBridgingCost(data?.bridgingRank || 0)} 🧊
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

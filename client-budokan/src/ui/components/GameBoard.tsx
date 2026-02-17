import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Card } from "@/ui/elements/card";
import { useDojo } from "@/dojo/useDojo";
import { useMediaQuery } from "react-responsive";
import { Account } from "starknet";
import Grid from "./Grid";
import { transformDataContractIntoBlock } from "@/utils/gridUtils";
import NextLine from "./NextLine";
import type { Block } from "@/types/types";
import LevelHeaderCompact from "./LevelHeaderCompact";
import { Bonus, BonusType, bonusTypeFromContractValue } from "@/dojo/game/types/bonus";
import { getBonusInventoryCount } from "@/dojo/game/helpers/runDataPacking";
import { Game } from "@/dojo/game/models/game";
import { useGameLevel } from "@/hooks/useGameLevel";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ImageAssets from "@/ui/theme/ImageAssets";

import "../../grid.css";

interface GameBoardProps {
  initialGrid: number[][];
  nextLine: number[];
  score: number;
  combo: number;
  maxCombo: number;
  account: Account | null;
  game: Game;
  seed?: bigint;
}

const GameBoard: React.FC<GameBoardProps> = ({
  initialGrid,
  nextLine,
  score,
  combo,
  maxCombo,
  account,
  game,
  seed = BigInt(0),
}) => {
  const {
    setup: {
      systemCalls: { applyBonus },
    },
  } = useDojo();

  const { themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);

  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });
  const ROWS = 10;
  const COLS = 8;
  const GRID_SIZE = isMdOrLarger ? 50 : 40;

  // Fetch GameLevel model from contract (single source of truth for level config)
  const gameLevel = useGameLevel({ gameId: game.id });

  const [isTxProcessing, setIsTxProcessing] = useState(false);

  // State that will allow us to hide or display the next line
  const [nextLineHasBeenConsumed, setNextLineHasBeenConsumed] = useState(false);

  // Optimistic data (score, combo, maxcombo)
  const [optimisticScore, setOptimisticScore] = useState(score);
  const [optimisticCombo, setOptimisticCombo] = useState(combo);
  const [optimisticMaxCombo, setOptimisticMaxCombo] = useState(maxCombo);
  const [bonusDescription, setBonusDescription] = useState("");

  const [bonus, setBonus] = useState<BonusType>(BonusType.None);

  const bonusCounts = useMemo(() => ({
    [BonusType.Combo]: game.comboBonus,
    [BonusType.Score]: game.scoreBonus,
    [BonusType.Harvest]: game.harvest,
    [BonusType.Wave]: game.wave,
    [BonusType.Supply]: game.supply,
  }), [game.comboBonus, game.scoreBonus, game.harvest, game.wave, game.supply]);

  const getBonusTooltip = (type: BonusType): string => {
    switch (type) {
      case BonusType.Combo:
        return "Add combo to next move";
      case BonusType.Score:
        return "Add bonus score";
      case BonusType.Harvest:
        return "Destroy all blocks of chosen size";
      case BonusType.Wave:
        return "Clear horizontal rows";
      case BonusType.Supply:
        return "Add new lines at no move cost";
      default:
        return "";
    }
  };

  const getBonusDescription = (type: BonusType): string => {
    switch (type) {
      case BonusType.Harvest:
        return "Select a block size to harvest";
      case BonusType.Score:
        return "Apply instant score bonus";
      case BonusType.Combo:
        return "Apply combo bonus";
      case BonusType.Wave:
        return "Select rows to clear";
      case BonusType.Supply:
        return "Add a new line for free";
      default:
        return "";
    }
  };

  const getBonusIcon = (type: BonusType): string => {
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
  };

  const selectedBonusSlots = useMemo(() => {
    const slots = [
      { slot: 0, value: game.selectedBonus1, level: game.bonus1Level },
      { slot: 1, value: game.selectedBonus2, level: game.bonus2Level },
      { slot: 2, value: game.selectedBonus3, level: game.bonus3Level },
    ];

    return slots.map((slot) => {
      const type = bonusTypeFromContractValue(slot.value);
      return {
        slot: slot.slot,
        type,
        level: slot.level,
        count: getBonusInventoryCount(game.runData, slot.value),
        icon: getBonusIcon(type),
        tooltip: getBonusTooltip(type),
      };
    });
  }, [game.runData, game.selectedBonus1, game.selectedBonus2, game.selectedBonus3, game.bonus1Level, game.bonus2Level, game.bonus3Level, imgAssets]);

  const handleBonusSelect = (type: BonusType) => {
    const count = bonusCounts[type] ?? 0;
    if (count === 0) return;
    if (bonus === type) {
      setBonus(BonusType.None);
      setBonusDescription("");
    } else {
      setBonus(type);
      setBonusDescription(getBonusDescription(type));
    }
  };

  const handleBonusTx = useCallback(
    async (bonusType: BonusType, rowIndex: number, colIndex: number) => {
      if (!account) return;

      setIsTxProcessing(true);
      try {
        await applyBonus({
          account: account as Account,
          game_id: game.id,
          bonus: new Bonus(bonusType).into(),
          row_index: ROWS - rowIndex - 1,
          block_index: colIndex,
        });
      } finally {
        //setIsLoading(false);
      }
    },
    [account, applyBonus, game.id]
  );

  const selectBlock = useCallback(
    async (block: Block) => {
      if (bonus === BonusType.Harvest) {
        handleBonusTx(BonusType.Harvest, block.y, 0);
      } else if (bonus === BonusType.Score) {
        handleBonusTx(BonusType.Score, block.y, block.x);
      } else if (bonus === BonusType.Combo) {
        handleBonusTx(BonusType.Combo, block.y, block.x);
      } else if (bonus === BonusType.Wave) {
        handleBonusTx(BonusType.Wave, block.y, block.x);
      } else if (bonus === BonusType.Supply) {
        handleBonusTx(BonusType.Supply, block.y, block.x);
      } else if (bonus === BonusType.None) {
        // No bonus selected
      }
    },
    [bonus, handleBonusTx]
  );

  useEffect(() => {
    // Reset the isTxProcessing state and the bonus state when the grid changes
    // meaning the tx as been processed, and the client state updated
    setBonus(BonusType.None);
    setBonusDescription("");
  }, [initialGrid]);

  const memoizedInitialData = useMemo(() => {
    return transformDataContractIntoBlock(initialGrid);
  }, [initialGrid]);

  const memoizedNextLineData = useMemo(() => {
    return transformDataContractIntoBlock([nextLine]);
    // initialGrid on purpose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialGrid]);

  if (memoizedInitialData.length === 0) return null; // otherwise sometimes
  // the grid is not displayed in Grid because the data is not ready

  return (
    <>
      <Card
        className={`relative p-2 md:p-3 bg-secondary ${
          isTxProcessing && "cursor-wait"
        }`}
      >
        {/* Compact Level Header with inline bonuses */}
        <div className={`${isMdOrLarger ? "w-[420px]" : "w-[340px]"} px-1 mb-1.5`}>
          <LevelHeaderCompact
            level={game.level}
            levelScore={optimisticScore}
            levelMoves={game.levelMoves}
            totalCubes={game.totalCubes}
            totalScore={game.totalScore}
            maxCombo={optimisticMaxCombo}
            seed={seed}
            constraintProgress={game.constraintProgress}
            constraint2Progress={game.constraint2Progress}
            bonusUsedThisLevel={game.bonusUsedThisLevel}
            gameLevel={gameLevel}
            cubesBrought={game.cubesBrought}
            cubesSpent={game.cubesSpent}
            activeBonus={bonus}
            bonusSlots={selectedBonusSlots.map((slot) => ({
              ...slot,
              onClick: () => handleBonusSelect(slot.type),
            }))}
          />
        </div>

        {/* Game Grid */}
        <div
          className={`flex justify-center items-center ${
            !isTxProcessing && "cursor-move"
          }`}
        >
          <Grid
            gameId={game.id}
            initialData={memoizedInitialData}
            nextLineData={memoizedNextLineData}
            setNextLineHasBeenConsumed={setNextLineHasBeenConsumed}
            gridSize={GRID_SIZE}
            gridHeight={ROWS}
            gridWidth={COLS}
            selectBlock={selectBlock}
            bonus={bonus}
            account={account}
            score={game.score}
            combo={game.combo}
            maxCombo={game.max_combo}
            setOptimisticScore={setOptimisticScore}
            setOptimisticCombo={setOptimisticCombo}
            setOptimisticMaxCombo={setOptimisticMaxCombo}
            isTxProcessing={isTxProcessing}
            setIsTxProcessing={setIsTxProcessing}
          />
        </div>

        {/* Bonus description overlay */}
        {bonus !== BonusType.None && (
          <div className="absolute inset-x-0 top-1/2 flex justify-center pointer-events-none z-50">
            <div className="text-yellow-500 px-3 py-1.5 rounded font-bold text-sm bg-black/70 whitespace-nowrap">
              {bonusDescription}
            </div>
          </div>
        )}

        {/* Next Line Preview */}
        <div className="mt-1">
          <NextLine
            nextLineData={nextLineHasBeenConsumed ? [] : memoizedNextLineData}
            gridSize={GRID_SIZE}
            gridHeight={1}
            gridWidth={COLS}
          />
        </div>
      </Card>
    </>
  );
};

export default GameBoard;

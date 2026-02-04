import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Card } from "@/ui/elements/card";
import { useDojo } from "@/dojo/useDojo";
import { useMediaQuery } from "react-responsive";
import { Account } from "starknet";
import { GameStage, GameStageRef } from "@/pixi/components/GameStage";
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
import { useGameStateMachine } from "@/pixi/hooks/useGameStateMachine";

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
  const stageRef = useRef<GameStageRef>(null);

  // State that will allow us to hide or display the next line
  const [nextLineHasBeenConsumed, setNextLineHasBeenConsumed] = useState(false);

  // Optimistic data (score, combo, maxcombo)
  const [optimisticScore, setOptimisticScore] = useState(score);
  const [optimisticCombo, setOptimisticCombo] = useState(combo);
  const [optimisticMaxCombo, setOptimisticMaxCombo] = useState(maxCombo);
  const [bonusDescription, setBonusDescription] = useState("");

  const [bonus, setBonus] = useState<BonusType>(BonusType.None);

  // Use the state machine hook for game logic
  const {
    blocks,
    isTxProcessing,
    isPlayerInDanger,
    handleMove,
    lineExplodedCount,
  } = useGameStateMachine({
    initialBlocks: transformDataContractIntoBlock(initialGrid),
    nextLineBlocks: transformDataContractIntoBlock([nextLine]),
    gridWidth: COLS,
    gridHeight: ROWS,
    game,
    account,
    score,
    combo,
    maxCombo,
    setOptimisticScore,
    setOptimisticCombo,
    setOptimisticMaxCombo,
    setNextLineHasBeenConsumed,
  });

  const bonusCounts = useMemo(() => ({
    [BonusType.Hammer]: game.hammer,
    [BonusType.Wave]: game.wave,
    [BonusType.Totem]: game.totem,
    [BonusType.Shrink]: game.shrink,
    [BonusType.Shuffle]: game.shuffle,
  }), [game.hammer, game.wave, game.totem, game.shrink, game.shuffle]);

  const getBonusTooltip = (type: BonusType): string => {
    switch (type) {
      case BonusType.Hammer:
        return "Destroy a block and connected same-size blocks";
      case BonusType.Wave:
        return "Destroy an entire horizontal line";
      case BonusType.Totem:
        return "Destroy all blocks of the same size";
      case BonusType.Shrink:
        return "Shrink a block by one size";
      case BonusType.Shuffle:
        return "Shuffle a row of blocks";
      default:
        return "";
    }
  };

  const getBonusDescription = (type: BonusType): string => {
    switch (type) {
      case BonusType.Wave:
        return "Select the line you want to destroy";
      case BonusType.Totem:
        return "Select the block type you want to destroy";
      case BonusType.Hammer:
        return "Select the block you want to destroy";
      case BonusType.Shrink:
        return "Select the block you want to shrink";
      case BonusType.Shuffle:
        return "Select a row to shuffle";
      default:
        return "";
    }
  };

  const getBonusIcon = (type: BonusType): string => {
    switch (type) {
      case BonusType.Hammer:
        return imgAssets.hammer;
      case BonusType.Wave:
        return imgAssets.wave;
      case BonusType.Totem:
        return imgAssets.tiki;
      case BonusType.Shrink:
        return imgAssets.shrink;
      case BonusType.Shuffle:
        return imgAssets.shuffle;
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

      try {
        await applyBonus({
          account: account as Account,
          game_id: game.id,
          bonus: new Bonus(bonusType).into(),
          row_index: ROWS - rowIndex - 1,
          block_index: colIndex,
        });
      } catch (error) {
        console.error("Bonus apply error:", error);
      }
    },
    [account, applyBonus, game.id]
  );

  const selectBlock = useCallback(
    async (block: Block) => {
      // Trigger explosion effect
      if (stageRef.current) {
        const centerX = block.x * GRID_SIZE + (block.width * GRID_SIZE) / 2;
        const centerY = block.y * GRID_SIZE + GRID_SIZE / 2;
        stageRef.current.triggerExplosion(centerX, centerY);
      }

      if (bonus === BonusType.Wave) {
        handleBonusTx(BonusType.Wave, block.y, 0);
      } else if (bonus === BonusType.Totem) {
        handleBonusTx(BonusType.Totem, block.y, block.x);
      } else if (bonus === BonusType.Hammer) {
        handleBonusTx(BonusType.Hammer, block.y, block.x);
      } else if (bonus === BonusType.Shrink) {
        handleBonusTx(BonusType.Shrink, block.y, block.x);
      } else if (bonus === BonusType.Shuffle) {
        handleBonusTx(BonusType.Shuffle, block.y, block.x);
      }
    },
    [bonus, handleBonusTx, GRID_SIZE]
  );

  useEffect(() => {
    // Reset the bonus state when the grid changes
    setBonus(BonusType.None);
    setBonusDescription("");
  }, [initialGrid]);

  const memoizedNextLineData = useMemo(() => {
    return transformDataContractIntoBlock([nextLine]);
  }, [initialGrid]); // eslint-disable-line react-hooks/exhaustive-deps

  if (blocks.length === 0) return null;

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

        {/* Game Grid - PixiJS Renderer */}
        <div className="flex justify-center items-center">
          <GameStage
            ref={stageRef}
            blocks={blocks}
            nextLine={memoizedNextLineData}
            gridSize={GRID_SIZE}
            gridHeight={ROWS}
            gridWidth={COLS}
            onMove={handleMove}
            onBonusApply={selectBlock}
            bonus={bonus}
            isTxProcessing={isTxProcessing}
            isPlayerInDanger={isPlayerInDanger}
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

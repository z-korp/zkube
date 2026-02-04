import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useDojo } from "@/dojo/useDojo";
import { Account } from "starknet";
import { GameCanvas, BonusSlotData } from "@/pixi/components";
import type { GameStageRef } from "@/pixi/types";
import { transformDataContractIntoBlock } from "@/utils/gridUtils";
import type { Block } from "@/types/types";
import { Bonus, BonusType, bonusTypeFromContractValue } from "@/dojo/game/types/bonus";
import { getBonusInventoryCount } from "@/dojo/game/helpers/runDataPacking";
import { Game } from "@/dojo/game/models/game";
import { useGameLevel } from "@/hooks/useGameLevel";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ImageAssets from "@/ui/theme/ImageAssets";
import { useGameStateMachine } from "@/pixi/hooks/useGameStateMachine";
import { useGameLayout } from "@/pixi/hooks/useGameLayout";

/**
 * Calculate star rating based on score progress
 * 3 stars: >= 100% of target
 * 2 stars: >= 75% of target
 * 1 star: >= 50% of target
 * 0 stars: < 50% of target
 */
function calculateStarRating(score: number, target: number): number {
  if (target <= 0) return 0;
  const ratio = score / target;
  if (ratio >= 1) return 3;
  if (ratio >= 0.75) return 2;
  if (ratio >= 0.5) return 1;
  return 0;
}

interface GameBoardCanvasProps {
  initialGrid: number[][];
  nextLine: number[];
  score: number;
  combo: number;
  maxCombo: number;
  account: Account | null;
  game: Game;
  seed?: bigint;
}

/**
 * New GameBoard using the unified GameCanvas with dynamic layout
 */
const GameBoardCanvas: React.FC<GameBoardCanvasProps> = ({
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

  const ROWS = 10;
  const COLS = 8;

  // Use dynamic layout hook
  const layout = useGameLayout({
    gridCols: COLS,
    gridRows: ROWS,
  });

  // Fetch GameLevel model from contract
  const gameLevel = useGameLevel({ gameId: game.id });
  const stageRef = useRef<GameStageRef>(null);

  // State for next line visibility
  const [nextLineHasBeenConsumed, setNextLineHasBeenConsumed] = useState(false);

  // Optimistic data
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

  const getBonusIcon = useCallback((type: BonusType): string => {
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
  }, [imgAssets]);

  const getBonusTooltip = useCallback((type: BonusType): string => {
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
  }, []);

  const getBonusDescription = useCallback((type: BonusType): string => {
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
  }, []);

  // Create bonus slots data
  const bonusSlots: BonusSlotData[] = useMemo(() => {
    const slots = [
      { slot: 0, value: game.selectedBonus1, level: game.bonus1Level },
      { slot: 1, value: game.selectedBonus2, level: game.bonus2Level },
      { slot: 2, value: game.selectedBonus3, level: game.bonus3Level },
    ];

    return slots.map((slot) => {
      const bonusType = bonusTypeFromContractValue(slot.value);
      const count = getBonusInventoryCount(game.runData, slot.value);
      return {
        type: slot.value,       // Contract numeric value
        bonusType,              // BonusType enum value
        level: slot.level,
        count,
        icon: getBonusIcon(bonusType),
        tooltip: getBonusTooltip(bonusType),
        onClick: () => handleBonusSelect(bonusType, count),
      };
    });
  }, [game.runData, game.selectedBonus1, game.selectedBonus2, game.selectedBonus3, 
      game.bonus1Level, game.bonus2Level, game.bonus3Level, getBonusIcon, getBonusTooltip]);

  const handleBonusSelect = useCallback((type: BonusType, count: number) => {
    if (count === 0) return;
    if (bonus === type) {
      setBonus(BonusType.None);
      setBonusDescription("");
    } else {
      setBonus(type);
      setBonusDescription(getBonusDescription(type));
    }
  }, [bonus, getBonusDescription]);

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
        const centerX = block.x * layout.cellSize + (block.width * layout.cellSize) / 2;
        const centerY = block.y * layout.cellSize + layout.cellSize / 2;
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
      
      // Reset bonus after applying
      setBonus(BonusType.None);
      setBonusDescription("");
    },
    [bonus, handleBonusTx, layout.cellSize]
  );

  useEffect(() => {
    // Reset the bonus state when the grid changes
    setBonus(BonusType.None);
    setBonusDescription("");
  }, [initialGrid]);

  const memoizedNextLineData = useMemo(() => {
    return transformDataContractIntoBlock([nextLine]);
  }, [initialGrid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate target score and stars
  const targetScore = useMemo(() => {
    if (gameLevel) {
      return gameLevel.pointsTarget;
    }
    // Fallback: estimate based on level (20 points base + 5 per level)
    return 20 + game.level * 5;
  }, [gameLevel, game.level]);

  const stars = useMemo(() => {
    return calculateStarRating(optimisticScore, targetScore);
  }, [optimisticScore, targetScore]);

  if (blocks.length === 0) return null;

  return (
    <div className="relative flex flex-col items-center">
      <GameCanvas
        ref={stageRef}
        layout={layout}
        blocks={blocks}
        nextLine={memoizedNextLineData}
        nextLineConsumed={nextLineHasBeenConsumed}
        level={game.level}
        levelScore={optimisticScore}
        targetScore={targetScore}
        moves={game.levelMoves}
        combo={optimisticCombo}
        maxCombo={optimisticMaxCombo}
        stars={stars}
        bonusSlots={bonusSlots}
        selectedBonus={bonus}
        isTxProcessing={isTxProcessing}
        isPlayerInDanger={isPlayerInDanger}
        onMove={handleMove}
        onBonusApply={selectBlock}
      />

      {/* Bonus description overlay */}
      {bonus !== BonusType.None && (
        <div className="absolute inset-x-0 top-1/2 flex justify-center pointer-events-none z-50">
          <div className="text-yellow-500 px-3 py-1.5 rounded font-bold text-sm bg-black/70 whitespace-nowrap">
            {bonusDescription}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoardCanvas;

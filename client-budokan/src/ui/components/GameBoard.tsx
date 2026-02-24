import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Card } from "@/ui/elements/card";
import { useDojo } from "@/dojo/useDojo";
import { Account } from "starknet";
import Grid from "./Grid";
import { transformDataContractIntoBlock } from "@/utils/gridUtils";
import NextLine from "./NextLine";
import type { Block } from "@/types/types";
import { Bonus, BonusType } from "@/dojo/game/types/bonus";
import { Game } from "@/dojo/game/models/game";
import { useMusicPlayer } from "@/contexts/hooks";

import "../../grid.css";

interface GameBoardProps {
  initialGrid: number[][];
  nextLine: number[];
  account: Account | null;
  game: Game;
  activeBonus: BonusType;
  bonusDescription: string;
  activeBonusLevel: number;
}

const GameBoard: React.FC<GameBoardProps> = ({
  initialGrid,
  nextLine,
  account,
  game,
  activeBonus,
  bonusDescription,
  activeBonusLevel,
}) => {
  const {
    setup: {
      systemCalls: { applyBonus },
    },
  } = useDojo();
  const { playSfx } = useMusicPlayer();

  const ROWS = 10;
  const COLS = 8;
  const containerRef = useRef<HTMLDivElement>(null);
  const [gridSize, setGridSize] = useState(40);

  const [isTxProcessing, setIsTxProcessing] = useState(false);

  // State that will allow us to hide or display the next line
  const [nextLineHasBeenConsumed, setNextLineHasBeenConsumed] = useState(false);


  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      const padding = 24;
      const cellSize = Math.floor((w - padding) / COLS);
      setGridSize(Math.max(28, Math.min(cellSize, 56)));
    });

    observer.observe(el);

    return () => observer.disconnect();
  }, [COLS]);

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
        playSfx("bonus-activate");
      } finally {
        setIsTxProcessing(false);
      }
    },
    [account, applyBonus, game.id, playSfx]
  );

  const selectBlock = useCallback(
    async (block: Block) => {
      if (activeBonus === BonusType.Harvest) {
        handleBonusTx(BonusType.Harvest, block.y, 0);
      } else if (activeBonus === BonusType.Score) {
        handleBonusTx(BonusType.Score, block.y, block.x);
      } else if (activeBonus === BonusType.Combo) {
        handleBonusTx(BonusType.Combo, block.y, block.x);
      } else if (activeBonus === BonusType.Wave) {
        handleBonusTx(BonusType.Wave, block.y, block.x);
      } else if (activeBonus === BonusType.None) {
        // No bonus selected
      }
    },
    [activeBonus, handleBonusTx]
  );

  const memoizedInitialData = useMemo(() => {
    return transformDataContractIntoBlock(initialGrid);
  }, [initialGrid]);

  const memoizedNextLineData = useMemo(() => {
    return transformDataContractIntoBlock([nextLine]);
  }, [nextLine]);

  if (memoizedInitialData.length === 0) return null; // otherwise sometimes
  // the grid is not displayed in Grid because the data is not ready

  return (
    <>
        <Card
          ref={containerRef}
          className={`relative p-2 md:p-3 w-full max-w-[500px] ${
            isTxProcessing && "cursor-wait"
          }`}
          style={{
            backgroundImage: `var(--theme-grid-bg-image, none)`,
            backgroundSize: "cover",
            backgroundColor: `var(--theme-grid-bg, #10172A)`,
          }}
        >
        <div
          className={`flex flex-col items-center ${
            !isTxProcessing && "cursor-move"
          }`}
        >
          <Grid
            gameId={game.id}
            initialData={memoizedInitialData}
            nextLineData={memoizedNextLineData}
            setNextLineHasBeenConsumed={setNextLineHasBeenConsumed}
            gridSize={gridSize}
            gridHeight={ROWS}
            gridWidth={COLS}
            selectBlock={selectBlock}
            bonus={activeBonus}
            account={account}
            isTxProcessing={isTxProcessing}
            setIsTxProcessing={setIsTxProcessing}
            activeBonusLevel={activeBonusLevel}          />
          <div className="mt-1">
            <NextLine
              nextLineData={nextLineHasBeenConsumed ? [] : memoizedNextLineData}
              gridSize={gridSize}
              gridHeight={1}
              gridWidth={COLS}
            />
          </div>
        </div>

        {activeBonus !== BonusType.None && (
          <div className="absolute inset-x-0 top-1/2 flex justify-center pointer-events-none z-50">
            <div className="text-yellow-500 px-3 py-1.5 rounded font-bold text-sm bg-black/70 whitespace-nowrap">
              {bonusDescription}
            </div>
          </div>
        )}
      </Card>
    </>
  );
};

export default GameBoard;

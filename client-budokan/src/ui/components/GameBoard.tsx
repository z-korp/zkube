import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { motion } from "motion/react";
import { ChevronUp } from "lucide-react";
import { Card } from "@/ui/elements/card";
import { useDojo } from "@/dojo/useDojo";
import { Account } from "starknet";
import Grid from "./Grid";
import { transformDataContractIntoBlock } from "@/utils/gridUtils";
import NextLine from "./NextLine";
import type { Block } from "@/types/types";
import { BonusType } from "@/dojo/game/types/bonusTypes";
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
  onCascadeComplete?: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
  initialGrid,
  nextLine,
  account,
  game,
  activeBonus,
  bonusDescription,
  activeBonusLevel,
  onCascadeComplete,
}) => {
  const {
    setup: {
      systemCalls: { applyBonus },
    },
  } = useDojo();
  const { playSfx } = useMusicPlayer();

  const ROWS = 10;
  const COLS = 8;
  const NEXT_LINE_ROWS = 1;
  const HORIZONTAL_PADDING = 24;
  const VERTICAL_CHROME = 36;
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
      const h = entry.contentRect.height;
      const safeWidth = Math.max(1, w - HORIZONTAL_PADDING);
      const safeHeight = Math.max(1, h - VERTICAL_CHROME);
      const cellByWidth = Math.floor(safeWidth / COLS);
      const cellByHeight = Math.floor(safeHeight / (ROWS + NEXT_LINE_ROWS));
      const cellSize = Math.min(cellByWidth, cellByHeight);
      setGridSize(Math.max(28, Math.min(cellSize, 56)));
    });

    observer.observe(el);

    return () => observer.disconnect();
  }, [COLS, ROWS, NEXT_LINE_ROWS, HORIZONTAL_PADDING, VERTICAL_CHROME]);

  const handleBonusTx = useCallback(
    async (_bonusType: BonusType, rowIndex: number, colIndex: number) => {
      if (!account) return;

      setIsTxProcessing(true);
      try {
        await applyBonus({
          account: account as Account,
          game_id: game.id,
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
      if (activeBonus === BonusType.Hammer) {
        handleBonusTx(BonusType.Hammer, block.y, block.x);
      } else if (activeBonus === BonusType.Totem) {
        handleBonusTx(BonusType.Totem, block.y, block.x);
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
          className={`relative flex h-full min-h-0 w-full max-w-[500px] flex-col p-2 md:p-3 ${
            isTxProcessing && "cursor-wait"
          }`}
          style={{
            backgroundImage: `var(--theme-grid-bg-image, none)`,
            backgroundSize: "cover",
            backgroundColor: `var(--theme-grid-bg, #10172A)`,
          }}
        >
        <div
          className={`flex min-h-0 flex-1 flex-col items-center ${
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
            activeBonusLevel={activeBonusLevel}
            levelTransitionPending={game.levelTransitionPending}
            onCascadeComplete={onCascadeComplete}
          />
          <div className="mt-1 flex items-center justify-center gap-1 py-0.5">
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ChevronUp size={14} className="text-white/50" />
            </motion.div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
              Next Row
            </span>
          </div>
          <div>
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

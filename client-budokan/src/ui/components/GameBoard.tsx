import React, { useState, useEffect, useMemo, useRef } from "react";
import { Card } from "@/ui/elements/card";
import { Account } from "starknet";
import Grid from "./Grid";
import { transformDataContractIntoBlock } from "@/utils/gridUtils";
import NextLine from "./NextLine";
import { Game } from "@/dojo/game/models/game";

import "../../grid.css";

interface GameBoardProps {
  initialGrid: number[][];
  nextLine: number[];
  account: Account | null;
  game: Game;
  onCascadeComplete?: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
  initialGrid,
  nextLine,
  account,
  game,
  onCascadeComplete,
}) => {
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
            account={account}
            isTxProcessing={isTxProcessing}
            setIsTxProcessing={setIsTxProcessing}
            levelTransitionPending={game.levelTransitionPending}
            onCascadeComplete={onCascadeComplete}
          />
          <div className="mt-1">
            <NextLine
              nextLineData={nextLineHasBeenConsumed ? [] : memoizedNextLineData}
              gridSize={gridSize}
              gridHeight={1}
              gridWidth={COLS}
            />
          </div>
        </div>

      </Card>
    </>
  );
};

export default GameBoard;

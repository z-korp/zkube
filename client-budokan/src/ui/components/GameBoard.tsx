import React, { useState, useEffect, useMemo, useRef } from "react";
import { ChevronUp } from "lucide-react";
import Grid from "./Grid";
import { transformDataContractIntoBlock } from "@/utils/gridUtils";
import NextLine from "./NextLine";
import { BonusType } from "@/dojo/game/types/bonusTypes";
import { Game } from "@/dojo/game/models/game";
import { Account } from "starknet";

import "../../grid.css";

interface GameBoardProps {
  initialGrid: number[][];
  nextLine: number[];
  account: Account | null;
  game: Game;
  activeBonus: BonusType;
  bonusDescription: string;
  onCascadeComplete?: () => void;
  forceTxProcessing?: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({
  initialGrid,
  nextLine,
  account,
  game,
  activeBonus,
  bonusDescription,
  onCascadeComplete,
  forceTxProcessing = false,
}) => {
  const ROWS = 10;
  const COLS = 8;
  const NEXT_LINE_ROWS = 1;
  const HORIZONTAL_PADDING = 24;
  const VERTICAL_CHROME = 36;
  const containerRef = useRef<HTMLDivElement>(null);
  const [gridSize, setGridSize] = useState(40);

  const [isTxProcessing, setIsTxProcessing] = useState(false);
  const effectiveTxProcessing = isTxProcessing || forceTxProcessing;
  const [nextLineHasBeenConsumed, setNextLineHasBeenConsumed] = useState(false);
  const [nextLineOverride, setNextLineOverride] = useState<number[] | null>(null);

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
      setGridSize(Math.max(28, Math.min(cellSize, 72)));
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const memoizedInitialData = useMemo(() => {
    return transformDataContractIntoBlock(initialGrid);
  }, [initialGrid]);

  const memoizedNextLineData = useMemo(() => {
    return transformDataContractIntoBlock([nextLineOverride ?? nextLine]);
  }, [nextLine, nextLineOverride]);

  if (memoizedInitialData.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={`relative flex h-full min-h-0 w-full flex-col p-2 md:p-3 ${
        effectiveTxProcessing ? "cursor-wait" : ""
      }`}
    >
      <div className={`flex min-h-0 flex-1 flex-col items-center ${!effectiveTxProcessing ? "cursor-move" : ""}`}>
        <Grid
          gameId={game.id}
          initialData={memoizedInitialData}
          nextLineData={memoizedNextLineData}
          setNextLineHasBeenConsumed={setNextLineHasBeenConsumed}
          gridSize={gridSize}
          gridHeight={ROWS}
          gridWidth={COLS}
          bonus={activeBonus}
          account={account}
          isTxProcessing={effectiveTxProcessing}
          setIsTxProcessing={setIsTxProcessing}
          levelTransitionPending={game.levelTransitionPending}
          onCascadeComplete={onCascadeComplete}
          onNextLineUpdate={setNextLineOverride}
        />
        <div className="mt-1 flex items-center justify-center gap-1 py-0.5">
          <div className="chevron-pulse">
            <ChevronUp size={14} className="text-white/50" />
          </div>
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
    </div>
  );
};

export default GameBoard;

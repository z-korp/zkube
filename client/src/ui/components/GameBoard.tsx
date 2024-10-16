import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Card } from "@/ui/elements/card";
import { useDojo } from "@/dojo/useDojo";
import { GameBonus } from "../containers/GameBonus";
import { useMediaQuery } from "react-responsive";
import { Account } from "starknet";
import Grid from "./Grid";
import { transformDataContratIntoBlock } from "@/utils/gridUtils";
import NextLine from "./NextLine";
import { Block } from "@/types/types";
import { BonusName } from "@/enums/bonusEnum";
import GameScores from "./GameScores";

interface GameBoardProps {
  initialGrid: number[][];
  nextLine: number[];
  score: number;
  combo: number;
  maxCombo: number;
  hammerCount: number;
  waveCount: number;
  totemCount: number;
  account: Account | null;
}

const GameBoard: React.FC<GameBoardProps> = ({
  initialGrid,
  nextLine,
  score,
  combo,
  maxCombo,
  waveCount,
  hammerCount,
  totemCount,
  account,
}) => {
  const {
    setup: {
      systemCalls: { applyBonus },
    },
  } = useDojo();

  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });
  const ROWS = 10;
  const COLS = 8;
  const GRID_SIZE = isMdOrLarger ? 50 : 40;

  const [isTxProcessing, setIsTxProcessing] = useState(false);

  // State that will allow us to hide or display the next line
  const [nextLineHasBeenConsumed, setNextLineHasBeenConsumed] = useState(false);

  useEffect(() => {
    if (nextLineHasBeenConsumed) {
      setNextLineHasBeenConsumed(false);
    }
  }, [nextLine]);

  // Optimistic data (score, combo, maxcombo)
  const [optimisticScore, setOptimisticScore] = useState(score);
  const [optimisticCombo, setOptimisticCombo] = useState(combo);
  const [optimisticMaxCombo, setOptimisticMaxCombo] = useState(maxCombo);

  useEffect(() => {
    // Every time the initial grid changes, we erase the optimistic data
    // and set the data to the one returned by the contract
    // just in case of discrepancies
    setOptimisticScore(score);
    setOptimisticCombo(combo);
    setOptimisticMaxCombo(maxCombo);
  }, [initialGrid]);

  const [bonus, setBonus] = useState<BonusName>(BonusName.NONE);

  const handleBonusWaveClick = () => {
    if (waveCount === 0) return;
    if (bonus === BonusName.WAVE) {
      setBonus(BonusName.NONE);
    } else setBonus(BonusName.WAVE);
  };

  const handleBonusTikiClick = () => {
    if (totemCount === 0) return;
    if (bonus === BonusName.TIKI) {
      setBonus(BonusName.NONE);
    } else setBonus(BonusName.TIKI);
  };

  const handleBonusHammerClick = () => {
    if (hammerCount === 0) return;
    if (bonus === BonusName.HAMMER) {
      setBonus(BonusName.NONE);
    } else setBonus(BonusName.HAMMER);
  };

  const handleBonusWaveTx = useCallback(
    async (rowIndex: number) => {
      if (!account) return;

      setIsTxProcessing(true);
      try {
        await applyBonus({
          account: account as Account,
          bonus: 3,
          row_index: ROWS - rowIndex - 1,
          block_index: 0,
        });
      } finally {
        //setIsLoading(false);
      }
    },
    [account],
  );

  const handleBonusHammerTx = useCallback(
    async (rowIndex: number, colIndex: number) => {
      if (!account) return;

      setIsTxProcessing(true);
      console.log("hammer with block", rowIndex, COLS - colIndex);
      try {
        await applyBonus({
          account: account as Account,
          bonus: 1,
          row_index: ROWS - rowIndex - 1,
          block_index: colIndex,
        });
      } finally {
        //setIsLoading(false);
      }
    },
    [account],
  );

  const handleBonusTikiTx = useCallback(
    async (rowIndex: number, colIndex: number) => {
      if (!account) return;

      setIsTxProcessing(true);
      try {
        await applyBonus({
          account: account as Account,
          bonus: 2,
          row_index: ROWS - rowIndex - 1,
          block_index: colIndex,
        });
      } finally {
        //setIsLoading(false);
      }
    },
    [account],
  );

  const selectBlock = useCallback(
    async (block: Block) => {
      if (bonus === BonusName.WAVE) {
        console.log("wave with block", block);
        handleBonusWaveTx(block.y);
      } else if (bonus === BonusName.TIKI) {
        console.log("tiki with block", block);
        handleBonusTikiTx(block.y, block.x);
      } else if (bonus === BonusName.HAMMER) {
        console.log("hammer with block", block);
        handleBonusHammerTx(block.y, block.x);
      } else if (bonus === BonusName.NONE) {
        console.log("none", block);
      }
    },
    [bonus],
  );

  useEffect(() => {
    // Reset the isTxProcessing state and the bonus state when the grid changes
    // meaning the tx as been processed, and the client state updated
    setIsTxProcessing(false);
    setBonus(BonusName.NONE);
  }, [initialGrid]);

  const memorizedInitialData = useMemo(() => {
    return transformDataContratIntoBlock(initialGrid);
  }, [initialGrid]);

  const memorizedNextLineData = useMemo(() => {
    return transformDataContratIntoBlock([nextLine]);
  }, [nextLine]);

  if (memorizedInitialData.length === 0) return null; // otherwise sometimes
  // the grid is not displayed in Grid because the data is not ready

  return (
    <>
      <Card
        className={`p-3 pt-4 bg-secondary ${isTxProcessing && "cursor-wait"}`}
      >
        <div
          className={`${isMdOrLarger ? "w-[420px]" : "w-[338px]"} mb-3 flex justify-between px-1`}
        >
          <div className="w-5/12">
            <GameBonus
              onBonusWaveClick={handleBonusWaveClick}
              onBonusTikiClick={handleBonusTikiClick}
              onBonusHammerClick={handleBonusHammerClick}
              hammerCount={hammerCount}
              tikiCount={totemCount}
              waveCount={waveCount}
              bonus={bonus}
            />
          </div>
          <GameScores
            score={optimisticScore}
            combo={optimisticCombo}
            maxCombo={optimisticMaxCombo}
            isMdOrLarger={isMdOrLarger}
          />
        </div>
        <div
          className={`flex justify-center items-center ${!isTxProcessing && "cursor-move"}`}
        >
          <Grid
            initialData={memorizedInitialData}
            nextLineData={memorizedNextLineData}
            setNextLineHasBeenConsumed={setNextLineHasBeenConsumed}
            gridSize={GRID_SIZE}
            gridHeight={ROWS}
            gridWidth={COLS}
            selectBlock={selectBlock}
            bonus={bonus}
            account={account}
            setOptimisticScore={setOptimisticScore}
            setOptimisticCombo={setOptimisticCombo}
            setOptimisticMaxCombo={setOptimisticMaxCombo}
            isTxProcessing={isTxProcessing}
            setIsTxProcessing={setIsTxProcessing}
          />
        </div>
        <div className="flex justify-center items-center mt-3">
          <NextLine
            nextLineData={nextLineHasBeenConsumed ? [] : memorizedNextLineData}
            gridSize={GRID_SIZE}
            gridHeight={1}
            gridWidth={COLS}
          />
        </div>
      </Card>
      <div className="flex gap-4">
        <div>{score}</div>
        <div>{combo}</div>
        <div>{maxCombo}</div>
      </div>
    </>
  );
};

export default GameBoard;

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Card } from "@/ui/elements/card";
import { useDojo } from "@/dojo/useDojo";
import { GameBonus } from "../containers/GameBonus";
import { useMediaQuery } from "react-responsive";
import { Account } from "starknet";
import Grid from "./Grid";
import { transformDataContractIntoBlock } from "@/utils/gridUtils";
import NextLine from "./NextLine";
import { Block } from "@/types/types";
import GameScores from "./GameScores";
import { Bonus, BonusType } from "@/dojo/game/types/bonus";

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

  const [bonus, setBonus] = useState<BonusType>(BonusType.None);

  const handleBonusWaveClick = () => {
    if (waveCount === 0) return;
    if (bonus === BonusType.Wave) {
      setBonus(BonusType.None);
    } else setBonus(BonusType.Wave);
  };

  const handleBonusTikiClick = () => {
    if (totemCount === 0) return;
    if (bonus === BonusType.Totem) {
      setBonus(BonusType.None);
    } else setBonus(BonusType.Totem);
  };

  const handleBonusHammerClick = () => {
    if (hammerCount === 0) return;
    if (bonus === BonusType.Hammer) {
      setBonus(BonusType.None);
    } else setBonus(BonusType.Hammer);
  };

  const handleBonusWaveTx = useCallback(
    async (rowIndex: number) => {
      if (!account) return;

      setIsTxProcessing(true);
      try {
        await applyBonus({
          account: account as Account,
          bonus: new Bonus(BonusType.Wave).into(),
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
      try {
        await applyBonus({
          account: account as Account,
          bonus: new Bonus(BonusType.Hammer).into(),
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
          bonus: new Bonus(BonusType.Totem).into(),
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
      if (bonus === BonusType.Wave) {
        handleBonusWaveTx(block.y);
      } else if (bonus === BonusType.Totem) {
        handleBonusTikiTx(block.y, block.x);
      } else if (bonus === BonusType.Hammer) {
        handleBonusHammerTx(block.y, block.x);
      } else if (bonus === BonusType.None) {
        console.log("none", block);
      }
    },
    [bonus],
  );

  useEffect(() => {
    // Reset the isTxProcessing state and the bonus state when the grid changes
    // meaning the tx as been processed, and the client state updated
    setBonus(BonusType.None);
  }, [initialGrid]);

  const memoizedInitialData = useMemo(() => {
    return transformDataContractIntoBlock(initialGrid);
  }, [initialGrid]);

  const memoizedNextLineData = useMemo(() => {
    return transformDataContractIntoBlock([nextLine]);
  }, [initialGrid]);

  if (memoizedInitialData.length === 0) return null; // otherwise sometimes
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
            initialData={memoizedInitialData}
            nextLineData={memoizedNextLineData}
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

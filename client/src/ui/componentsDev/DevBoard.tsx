import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Card } from "@/ui/elements/card";
import { GameBonus } from "../containers/GameBonus";
import { useMediaQuery } from "react-responsive";
import {
  generateRandomNextLine,
  transformDataContractIntoBlock,
} from "@/utils/gridUtils";
import { Block } from "@/types/types";
import { BonusType } from "@/dojo/game/types/bonus";

import "../../grid.css";
import BonusAnimation from "../components/BonusAnimation";
import NextLine from "../components/NextLine";
import GameScores from "../components/GameScores";
import GridDev from "./DevGrid";

interface GameBoardProps {
  initialGrid: number[][];
  nextLine: number[];
  score: number;
  combo: number;
  maxCombo: number;
  hammerCount: number;
  waveCount: number;
  totemCount: number;
}

const DevBoard: React.FC<GameBoardProps> = ({
  initialGrid,
  nextLine,
  score,
  combo,
  maxCombo,
  waveCount,
  hammerCount,
  totemCount,
}) => {
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
  const [bonusDescription, setBonusDescription] = useState("");
  const [generateNewData, setGenerateNewData] = useState(0);

  const [bonus, setBonus] = useState<BonusType>(BonusType.None);

  const handleBonusWaveClick = () => {
    if (waveCount === 0) return;
    if (bonus === BonusType.Wave) {
      setBonus(BonusType.None);
      setBonusDescription("");
    } else {
      setBonus(BonusType.Wave);
      setBonusDescription("Select the line you want to destroy");
    }
  };

  const handleBonusTikiClick = () => {
    // Exemple d'utilisation
    if (totemCount === 0) return;
    if (bonus === BonusType.Totem) {
      setBonus(BonusType.None);
      setBonusDescription("");
    } else {
      setBonus(BonusType.Totem);
      setBonusDescription("Select the block type you want to destroy");
    }
  };

  const handleBonusHammerClick = () => {
    if (hammerCount === 0) return;
    if (bonus === BonusType.Hammer) {
      setBonus(BonusType.None);
      setBonusDescription("");
    } else {
      setBonus(BonusType.Hammer);
      setBonusDescription("Select the block you want to destroy");
    }
  };

  const handleBonusWaveTx = useCallback(async (rowIndex: number) => {
    // TBD : should I keep it ?
    setIsTxProcessing(true);
    console.log("handleBonusWaveTx", rowIndex);
  }, []);

  const handleBonusHammerTx = useCallback(
    async (rowIndex: number, colIndex: number) => {
      // TBD : should I keep it ?
      setIsTxProcessing(true);
      console.log("handleBonusHammerTx", rowIndex, colIndex);
    },
    [],
  );

  const handleBonusTikiTx = useCallback(
    async (rowIndex: number, colIndex: number) => {
      // TBD : should I keep it ?
      setIsTxProcessing(true);
      console.log("handleBonusTikiTx", rowIndex, colIndex);
    },
    [],
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
    [bonus, handleBonusHammerTx, handleBonusTikiTx, handleBonusWaveTx],
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
    return transformDataContractIntoBlock([generateRandomNextLine()]);
    // initialGrid on purpose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generateNewData]);

  if (memoizedInitialData.length === 0) return null; // otherwise sometimes
  // the grid is not displayed in Grid because the data is not ready

  return (
    <>
      <Card
        className={`relative p-3 md:pt-4 bg-secondary ${isTxProcessing && "cursor-wait"} pb-2 md:pb-3`}
      >
        <BonusAnimation
          isMdOrLarger={isMdOrLarger}
          optimisticScore={optimisticScore}
          optimisticCombo={optimisticCombo}
          optimisticMaxCombo={optimisticMaxCombo}
        />
        <div
          className={`${isMdOrLarger ? "w-[420px]" : "w-[338px]"} mb-2 md:mb-3 flex justify-between px-1`}
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
          <GridDev
            initialData={memoizedInitialData}
            nextLineData={memoizedNextLineData}
            setNextLineHasBeenConsumed={setNextLineHasBeenConsumed}
            gridSize={GRID_SIZE}
            gridHeight={ROWS}
            gridWidth={COLS}
            selectBlock={selectBlock}
            bonus={bonus}
            score={score}
            combo={combo}
            maxCombo={maxCombo}
            setOptimisticScore={setOptimisticScore}
            setOptimisticCombo={setOptimisticCombo}
            setOptimisticMaxCombo={setOptimisticMaxCombo}
            isTxProcessing={isTxProcessing}
            setIsTxProcessing={setIsTxProcessing}
            generateNewData={generateNewData}
            setGenerateNewData={setGenerateNewData}
          />
        </div>

        <div className="relative">
          <div className="absolute z-50 text-lg w-full flex justify-center items-center mt-2 md:mt-3 left-1/2 transform -translate-x-1/2">
            {bonus !== BonusType.None && (
              <h1
                className={`text-yellow-500 p-2 rounded font-bold ${bonusDescription.length > 20 ? "text-sm" : "text-2xl"} md:text-lg bg-black bg-opacity-50 whitespace-nowrap overflow-hidden text-ellipsis`}
              >
                {bonusDescription}
              </h1>
            )}
          </div>
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

export default DevBoard;

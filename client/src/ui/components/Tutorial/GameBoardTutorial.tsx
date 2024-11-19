import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Card } from "@/ui/elements/card";
import { useDojo } from "@/dojo/useDojo";
import { GameBonus } from "../../containers/GameBonus";
import { useMediaQuery } from "react-responsive";
import { transformDataContractIntoBlock } from "@/utils/gridUtils";
import NextLine from "../NextLine";
import { Block } from "@/types/types";
import GameScores from "../GameScores";
import { Bonus, BonusType } from "@/dojo/game/types/bonus";
import BonusAnimation from "../BonusAnimation";

import "../../../grid.css";
import TutorialGrid from "./TutorialGrid";

interface GameBoardProps {
  initialGrid: number[][];
  nextLine: number[];
  combo: number;
  maxCombo: number;
  hammerCount: number;
  waveCount: number;
  totemCount: number;
  tutorialProps?: {
    step: number;
    targetBlock: { x: number; y: number; type: "block" | "row" } | null;
    isIntermission: boolean;
  };
  onBlockSelect?: (block: Block) => void;
}

const GameBoardTutorial: React.FC<GameBoardProps> = ({
  initialGrid,
  nextLine,
  combo,
  maxCombo,
  waveCount,
  hammerCount,
  totemCount,
  tutorialProps,
  onBlockSelect,
}) => {
  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });
  const ROWS = 10;
  const COLS = 8;
  const GRID_SIZE = isMdOrLarger ? 50 : 40;

  const [isTxProcessing, setIsTxProcessing] = useState(false);
  // State that will allow us to hide or display the next line
  const [nextLineHasBeenConsumed, setNextLineHasBeenConsumed] = useState(false);
  // Optimistic data (score, combo, maxcombo)
  const [optimisticScore, setOptimisticScore] = useState(0);
  const [optimisticCombo, setOptimisticCombo] = useState(combo);
  const [optimisticMaxCombo, setOptimisticMaxCombo] = useState(maxCombo);
  const [bonusDescription, setBonusDescription] = useState("");
  const [score, setScore] = useState<number | undefined>(0);
  const [isIntermission, setIsIntermission] = useState(false);

  useEffect(() => {
    // Every time the initial grid changes, we erase the optimistic data
    // and set the data to the one returned by the contract
    // just in case of discrepancies
    setOptimisticScore(0);
    setOptimisticCombo(combo);
    setOptimisticMaxCombo(maxCombo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialGrid]);
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

  const updateValue = (intermission: boolean) => {
    setScore((score ?? 0) + 15);
    setIsIntermission(intermission);
  };

  const handleBonusWaveTx = useCallback(async (rowIndex: number) => {
    setIsTxProcessing(true);
    try {
      // await applyBonus({
      //   account: account as Account,
      //   bonus: new Bonus(BonusType.Wave).into(),
      //   row_index: ROWS - rowIndex - 1,
      //   block_index: 0,
      // });
    } finally {
      //setIsLoading(false);
    }
  }, []);

  const handleBonusHammerTx = useCallback(
    async (rowIndex: number, colIndex: number) => {
      setIsTxProcessing(true);
      try {
        // await applyBonus({
        //   account: account as Account,
        //   bonus: new Bonus(BonusType.Hammer).into(),
        //   row_index: ROWS - rowIndex - 1,
        //   block_index: colIndex,
        // });
      } finally {
        //setIsLoading(false);
      }
    },
    [],
  );

  const handleBonusTikiTx = useCallback(
    async (rowIndex: number, colIndex: number) => {
      setIsTxProcessing(true);
      try {
        // await applyBonus({
        //   account: account as Account,
        //   bonus: new Bonus(BonusType.Totem).into(),
        //   row_index: ROWS - rowIndex - 1,
        //   block_index: colIndex,
        // });
      } finally {
        //setIsLoading(false);
      }
    },
    [],
  );

  const selectBlock = useCallback(
    async (block: Block) => {
      if (onBlockSelect) {
        await onBlockSelect(block);
        return;
      }

      if (bonus === BonusType.Wave) {
        handleBonusWaveTx(block.y);
      } else if (bonus === BonusType.Totem) {
        handleBonusTikiTx(block.y, block.x);
      } else if (bonus === BonusType.Hammer) {
        handleBonusHammerTx(block.y, block.x);
      }
    },
    [bonus, handleBonusWaveTx, handleBonusTikiTx, handleBonusHammerTx],
  );

  useEffect(() => {
    // Reset the isTxProcessing state and the bonus state when the grid changes
    // meaning the tx as been processed, and the client state updated
    setBonus(BonusType.None);
    setBonusDescription("");
  }, [initialGrid]);

  const memorizedInitialData = useMemo(() => {
    return transformDataContractIntoBlock(initialGrid);
  }, [initialGrid]);

  const memorizedNextLineData = useMemo(() => {
    return transformDataContractIntoBlock([nextLine]);
    // initialGrid on purpose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialGrid]);

  if (memorizedInitialData.length === 0) return null; // otherwise sometimes
  // the grid is not displayed in Grid because the data is not ready

  return (
    <>
      <Card
        className={`relative p-3 md:pt-4 bg-secondary ${isTxProcessing && "cursor-wait"} pb-2 md:pb-3`}
      >
        <BonusAnimation
          isMdOrLarger={isMdOrLarger}
          optimisticScore={optimisticScore ?? 0}
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
            score={optimisticScore ?? 0}
            combo={optimisticCombo}
            maxCombo={optimisticMaxCombo}
            isMdOrLarger={isMdOrLarger}
          />
        </div>

        <div
          className={`flex justify-center items-center ${!isTxProcessing && "cursor-move"}`}
        >
          {/* <Grid
            initialData={memoizedInitialData}
            nextLineData={memoizedNextLineData}
            setNextLineHasBeenConsumed={setNextLineHasBeenConsumed}
            gridSize={GRID_SIZE}
            gridHeight={ROWS}
            gridWidth={COLS}
            selectBlock={selectBlock}
            bonus={bonus}
            account={null}
            setOptimisticScore={setOptimisticScore}
            setOptimisticCombo={setOptimisticCombo}
            setOptimisticMaxCombo={setOptimisticMaxCombo}
            isTxProcessing={isTxProcessing}
            setIsTxProcessing={setIsTxProcessing}
            tutorialHighlight={tutorialProps?.targetBlock}
            isIntermission={tutorialProps?.isIntermission}
          /> */}
          <TutorialGrid
            initialData={memorizedInitialData}
            nextLineData={memorizedNextLineData}
            gridSize={GRID_SIZE}
            gridHeight={ROWS}
            gridWidth={COLS}
            selectBlock={selectBlock}
            bonus={bonus}
            account={null}
            tutorialStep={tutorialProps?.step ?? 0}
            intermission={tutorialProps?.isIntermission}
            tutorialTargetBlock={tutorialProps?.targetBlock ?? null}
            onUpdate={(intermission: boolean) => {
              // Ignore the intermission parameter since we only care about score updates
              setOptimisticScore((prev) => (prev ?? 0) + 1);
            }}
            ref={setBonus}
          />
        </div>

        <div className="relative">
          <div className="absolute z-50 text-lg w-full flex justify-center items-center mt-2 md:mt-3 left-1/2 transform -translate-x-1/2">
            {bonus !== BonusType.None && (
              <h1
                className={`text-yellow-500 p-2 rounded font-bold ${
                  bonusDescription.length > 20 ? "text-sm" : "text-2xl"
                } md:text-lg bg-black bg-opacity-50 whitespace-nowrap overflow-hidden text-ellipsis`}
              >
                {bonusDescription}
              </h1>
            )}
          </div>
          <NextLine
            nextLineData={nextLineHasBeenConsumed ? [] : memorizedNextLineData}
            gridSize={GRID_SIZE}
            gridHeight={1}
            gridWidth={COLS}
          />
        </div>
      </Card>
    </>
  );
};

export default GameBoardTutorial;

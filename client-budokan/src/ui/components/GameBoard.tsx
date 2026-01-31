import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Card } from "@/ui/elements/card";
import { useDojo } from "@/dojo/useDojo";
import { useMediaQuery } from "react-responsive";
import { Account } from "starknet";
import Grid from "./Grid";
import { transformDataContractIntoBlock } from "@/utils/gridUtils";
import NextLine from "./NextLine";
import type { Block } from "@/types/types";
import LevelHeaderCompact from "./LevelHeaderCompact";
import { Bonus, BonusType } from "@/dojo/game/types/bonus";
import { Game } from "@/dojo/game/models/game";
import { useGameLevel } from "@/hooks/useGameLevel";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ImageAssets from "@/ui/theme/ImageAssets";

import "../../grid.css";

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
  game: Game;
  seed: bigint;
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
  game,
  seed,
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

  const [isTxProcessing, setIsTxProcessing] = useState(false);

  // State that will allow us to hide or display the next line
  const [nextLineHasBeenConsumed, setNextLineHasBeenConsumed] = useState(false);

  // Optimistic data (score, combo, maxcombo)
  const [optimisticScore, setOptimisticScore] = useState(score);
  const [optimisticCombo, setOptimisticCombo] = useState(combo);
  const [optimisticMaxCombo, setOptimisticMaxCombo] = useState(maxCombo);
  const [bonusDescription, setBonusDescription] = useState("");

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

  const handleBonusWaveTx = useCallback(
    async (rowIndex: number) => {
      if (!account) return;

      setIsTxProcessing(true);
      try {
        await applyBonus({
          account: account as Account,
          game_id: game.id,
          bonus: new Bonus(BonusType.Wave).into(),
          row_index: ROWS - rowIndex - 1,
          block_index: 0,
        });
      } finally {
        //setIsLoading(false);
      }
    },
    [account, applyBonus]
  );

  const handleBonusHammerTx = useCallback(
    async (rowIndex: number, colIndex: number) => {
      if (!account) return;

      setIsTxProcessing(true);
      try {
        await applyBonus({
          account: account as Account,
          game_id: game.id,
          bonus: new Bonus(BonusType.Hammer).into(),
          row_index: ROWS - rowIndex - 1,
          block_index: colIndex,
        });
      } finally {
        //setIsLoading(false);
      }
    },
    [account, applyBonus]
  );

  const handleBonusTikiTx = useCallback(
    async (rowIndex: number, colIndex: number) => {
      if (!account) return;

      setIsTxProcessing(true);
      try {
        await applyBonus({
          account: account as Account,
          game_id: game.id,
          bonus: new Bonus(BonusType.Totem).into(),
          row_index: ROWS - rowIndex - 1,
          block_index: colIndex,
        });
      } finally {
        //setIsLoading(false);
      }
    },
    [account, applyBonus]
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
    [bonus, handleBonusHammerTx, handleBonusTikiTx, handleBonusWaveTx]
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
    return transformDataContractIntoBlock([nextLine]);
    // initialGrid on purpose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialGrid]);

  if (memoizedInitialData.length === 0) return null; // otherwise sometimes
  // the grid is not displayed in Grid because the data is not ready

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
            hammerCount={hammerCount}
            waveCount={waveCount}
            totemCount={totemCount}
            activeBonus={bonus}
            onBonusHammerClick={handleBonusHammerClick}
            onBonusWaveClick={handleBonusWaveClick}
            onBonusTotemClick={handleBonusTikiClick}
            bonusImages={{
              hammer: imgAssets.hammer,
              wave: imgAssets.wave,
              tiki: imgAssets.tiki,
            }}
          />
        </div>

        {/* Game Grid */}
        <div
          className={`flex justify-center items-center ${
            !isTxProcessing && "cursor-move"
          }`}
        >
          <Grid
            gameId={game.id}
            initialData={memoizedInitialData}
            nextLineData={memoizedNextLineData}
            setNextLineHasBeenConsumed={setNextLineHasBeenConsumed}
            gridSize={GRID_SIZE}
            gridHeight={ROWS}
            gridWidth={COLS}
            selectBlock={selectBlock}
            bonus={bonus}
            account={account}
            score={game.score}
            combo={game.combo}
            maxCombo={game.max_combo}
            setOptimisticScore={setOptimisticScore}
            setOptimisticCombo={setOptimisticCombo}
            setOptimisticMaxCombo={setOptimisticMaxCombo}
            isTxProcessing={isTxProcessing}
            setIsTxProcessing={setIsTxProcessing}
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

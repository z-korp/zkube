import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
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
import BonusAnimation from "./BonusAnimation";
import TournamentTimer from "./TournamentTimer";
import { Mode, ModeType } from "@/dojo/game/types/mode";
import useTournament from "@/hooks/useTournament";
import { Game as GameModel } from "@/dojo/game/models/game";
import useRank from "@/hooks/useRank";
import { setComponent } from "@dojoengine/recs";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { Packer } from "@/dojo/game/helpers/packer";
import { packGridToBigint, packRowToU32 } from "@/offchain/grid";

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
  game: GameModel;
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
}) => {
  const {
    setup: {
      systemCalls: { applyBonus },
      clientModels: { models },
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
  const [bonusDescription, setBonusDescription] = useState("");

  const [bonus, setBonus] = useState<BonusType>(BonusType.None);
  const offchain = String(import.meta.env.VITE_PUBLIC_OFFCHAIN).toLowerCase() === "true";
  const gameRef = useRef(game);
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

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
          bonus: new Bonus(BonusType.Wave).into(),
          row_index: ROWS - rowIndex - 1,
          block_index: 0,
        });
      } finally {
        //setIsLoading(false);
      }
    },
    [account, applyBonus],
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
    [account, applyBonus],
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
    [account, applyBonus],
  );

  const selectBlock = useCallback(
    async (block: Block) => {
      if (offchain) {
        // Handled locally by Grid state machine
        return;
      }
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
    [bonus, handleBonusHammerTx, handleBonusTikiTx, handleBonusWaveTx, offchain],
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

  const { endTimestamp } = useTournament(game.mode.value);
  const { rank, suffix } = useRank({
    tournamentId: game.tournament_id,
    gameId: game.id,
  });

  const handleFinalizeStateOffchain = useCallback(
    (grid: number[][], newNextRow: number[], isOver: boolean) => {
      // Sync RECS Game component so hooks pick up new state
      const g = gameRef.current;
      if (!g) return;
      const gameEntity = getEntityIdFromKeys([BigInt(g.id)]);
      const packedBlocks = packGridToBigint(grid);
      const packedNextRow = packRowToU32(newNextRow);
      setComponent(models.Game, gameEntity as any, {
        id: Number(g.id),
        seed: BigInt(0),
        blocks: packedBlocks,
        player_id: parseInt(g.player_id, 16) || 0,
        over: isOver,
        mode: new Mode(g.mode.value).into(),
        score: optimisticScore,
        moves: g.moves + 1,
        next_row: isOver ? 0 : packedNextRow,
        start_time: Math.floor(Date.now() / 1000),
        hammer_bonus: g.hammer,
        wave_bonus: g.wave,
        totem_bonus: g.totem,
        hammer_used: g.hammer_used,
        wave_used: g.wave_used,
        totem_used: g.totem_used,
        combo_counter: optimisticCombo,
        max_combo: Math.max(optimisticMaxCombo, g.max_combo),
        tournament_id: g.tournament_id ?? 0,
      } as any);
    },
    [optimisticCombo, optimisticMaxCombo, optimisticScore, models],
  );

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
            score={game.score}
            combo={game.combo}
            maxCombo={game.max_combo}
            setOptimisticScore={setOptimisticScore}
            setOptimisticCombo={setOptimisticCombo}
            setOptimisticMaxCombo={setOptimisticMaxCombo}
            isTxProcessing={isTxProcessing}
            setIsTxProcessing={setIsTxProcessing}
            onFinalizeState={offchain ? handleFinalizeStateOffchain : undefined}
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

        {(game.mode.value === ModeType.Daily ||
          game.mode.value === ModeType.Normal) && (
          <div className="flex w-full items-center justify-between px-1 mt-2 md:mt-3 font-semibold md:font-normal">
            <div>
              Ranked {rank}
              <sup>{suffix}</sup>
            </div>
            <div className="flex gap-4">
              <h2 className="text-GRID_SIZEsm md:text-base font-semibold">
                Tournament:
              </h2>
              <TournamentTimer
                mode={game.mode.value}
                endTimestamp={endTimestamp}
              />
            </div>
          </div>
        )}
      </Card>
    </>
  );
};

export default GameBoard;

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Card } from "@/ui/elements/card";
import { useDojo } from "@/dojo/useDojo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire, faStar } from "@fortawesome/free-solid-svg-icons";
import { GameBonus } from "../containers/GameBonus";
import { useMediaQuery } from "react-responsive";
import { Account } from "starknet";
import MaxComboIcon from "./MaxComboIcon";
import Grid from "./Grid";
import { transformDataContratIntoBlock } from "@/utils/gridUtils";
import NextLine from "./NextLine";
import { Block } from "@/types/types";
import { BonusName } from "@/enums/bonusEnum";
import { useLerpNumber } from "@/hooks/useLerpNumber";

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

  const [isTxProcessing, setIsTxProcessing] = useState(false);

  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  const rows = 10;
  const cols = 8;
  const gridSize = isMdOrLarger ? 50 : 40;

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
          row_index: rows - rowIndex - 1,
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
      console.log("hammer with block", rowIndex, cols - colIndex);
      try {
        await applyBonus({
          account: account as Account,
          bonus: 1,
          row_index: rows - rowIndex - 1,
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
          row_index: rows - rowIndex - 1,
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
      }
      if (bonus === BonusName.TIKI) {
        console.log("tiki with block", block);
        handleBonusTikiTx(block.y, block.x);
      }
      if (bonus === BonusName.HAMMER) {
        console.log("hammer with block", block);
        handleBonusHammerTx(block.y, block.x);
      }
      if (bonus === BonusName.NONE) {
        console.log("none", block);
      }
    },
    [bonus],
  );

  useEffect(() => {
    setIsTxProcessing(false);
    setBonus(BonusName.NONE);
  }, [initialGrid]);

  const memorizedInitialData = useMemo(() => {
    return transformDataContratIntoBlock(initialGrid);
  }, [initialGrid]);

  //console.log("memorized initial data", memorizedInitialData);
  const memorizedNextLineData = useMemo(
    () => transformDataContratIntoBlock([nextLine]),
    [initialGrid],
  );

  const displayScore = useLerpNumber(score, {
    integer: true,
  });
  const displayCombo = useLerpNumber(combo, {
    integer: true,
  });
  const displayMaxCombo = useLerpNumber(maxCombo, {
    integer: true,
  });

  return (
    <>
      <Card
        className={`p-4 bg-secondary ${isTxProcessing ? "cursor-wait" : "cursor-move"}`}
      >
        <div
          className={`${isMdOrLarger ? "w-[420px]" : "w-[338px]"} mb-4 flex justify-between`}
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
          <div className="flex gap-2">
            <div
              className={`flex items-center ${isMdOrLarger ? "text-4xl" : "text-2xl"}`}
            >
              <span>{displayScore}</span>
              <FontAwesomeIcon
                icon={faStar}
                className="text-yellow-500 ml-1"
                width={26}
                height={26}
              />
            </div>
            <div
              className={`flex items-center ${isMdOrLarger ? "text-4xl" : "text-2xl"}`}
            >
              <span
                className={`${isMdOrLarger ? "w-[38px]" : "w-[26px]"} text-right`}
              >
                {displayCombo}
              </span>
              <FontAwesomeIcon
                icon={faFire}
                className="text-yellow-500 ml-1"
                width={26}
                height={26}
              />
            </div>
            <div
              className={`flex items-center ${isMdOrLarger ? "text-4xl" : "text-2xl"}`}
            >
              <span
                className={`${isMdOrLarger ? "w-[20px]" : "w-[13px]"} text-right`}
              >
                {displayMaxCombo}
              </span>
              <MaxComboIcon
                width={isMdOrLarger ? 31 : 25}
                height={isMdOrLarger ? 31 : 25}
                className="text-yellow-500 ml-1"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-center items-center">
          <Grid
            initialData={memorizedInitialData}
            nextLineData={memorizedNextLineData}
            gridSize={gridSize}
            gridHeight={rows}
            gridWidth={cols}
            selectBlock={selectBlock}
            bonus={bonus}
            account={account}
          />
        </div>
        <br />
        <div className="flex justify-center items-center">
          <NextLine
            nextLineData={memorizedNextLineData}
            gridSize={gridSize}
            gridHeight={1}
            gridWidth={cols}
          />
        </div>
      </Card>
    </>
  );
};

export default GameBoard;

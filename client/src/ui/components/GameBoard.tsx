import React, { useState, useCallback, useEffect } from "react";
import { Card } from "@/ui/elements/card";
import { useDojo } from "@/dojo/useDojo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire, faStar } from "@fortawesome/free-solid-svg-icons";
import { GameBonus } from "../containers/GameBonus";
import { useMediaQuery } from "react-responsive";
import { Account } from "starknet";
import useAccountCustom from "@/hooks/useAccountCustom";
import MaxComboIcon from "./MaxComboIcon";
import Grid from "./Grid";
import { transformDataContratIntoBlock } from "@/utils/gridUtils";
import NextLine from "./NextLine";
import { Block } from "@/types/types";
import { BonusName } from "@/enums/bonusEnum";

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

const GameBoard: React.FC<GameBoardProps> = ({
  initialGrid,
  nextLine,
  score,
  combo,
  maxCombo,
  waveCount,
  hammerCount,
  totemCount,
}) => {
  const {
    setup: {
      systemCalls: { applyBonus },
    },
  } = useDojo();
  const { account } = useAccountCustom();

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

  const selectBlock = (block: Block) => {
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
  };

  useEffect(() => {
    setIsTxProcessing(false);
    setBonus(BonusName.NONE);
  }, [initialGrid]);

  return (
    <>
      <Card
        className={`p-4 bg-secondary ${isTxProcessing ? "cursor-wait" : "cursor-move"}`}
      >
        <div
          className={`${isMdOrLarger ? "w-[420px]" : "w-[320px]"} mb-4 flex justify-between`}
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
          <div className="flex gap-1">
            <div
              className={`flex items-center ${isMdOrLarger ? "text-4xl" : "text-2xl"}`}
            >
              <span>{score}</span>
              <FontAwesomeIcon
                icon={faStar}
                className="text-yellow-500 ml-2"
                width={26}
                height={26}
              />
            </div>
            <div
              className={`flex items-center ${isMdOrLarger ? "text-4xl" : "text-2xl"}`}
            >
              <span>{combo}</span>
              <FontAwesomeIcon
                icon={faFire}
                className="text-yellow-500 ml-2"
                width={26}
                height={26}
              />
            </div>
            <div
              className={`flex items-center ${isMdOrLarger ? "text-4xl" : "text-2xl"}`}
            >
              <span>{maxCombo}</span>
              <MaxComboIcon
                width={26}
                height={26}
                className={`text-yellow-500 ml-2 `}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-center items-center">
          <Grid
            initialData={transformDataContratIntoBlock(initialGrid)}
            nextLineData={transformDataContratIntoBlock([nextLine])}
            gridSize={gridSize}
            gridHeight={rows}
            gridWidth={cols}
            selectBlock={selectBlock}
          />
        </div>
        <br />
        <div className="flex justify-center items-center">
          <NextLine
            nextLineData={transformDataContratIntoBlock([nextLine])}
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

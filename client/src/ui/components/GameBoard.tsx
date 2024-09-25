import React, { useState, useCallback } from "react";
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
import { dataContrat } from "@/fixtures/dataTest";
import NextLine from "./NextLine";

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
  const [isAnimating, setIsAnimating] = useState(false);

  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  const rows = 10;
  const cols = 8;
  const gridSize = isMdOrLarger ? 50 : 40;

  const [bonusWave, setBonusWave] = useState(false);
  const [bonusTiki, setBonusTiki] = useState(false);
  const [bonusHammer, setBonusHammer] = useState(false);

  const handleBonusWaveClick = () => {
    setBonusWave(true);
    setBonusTiki(false);
    setBonusHammer(false);
  };

  const handleBonusTikiClick = () => {
    setBonusWave(false);
    setBonusTiki(true);
    setBonusHammer(false);
  };

  const handleBonusHammerClick = () => {
    setBonusWave(false);
    setBonusTiki(false);
    setBonusHammer(true);
  };

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    const actualRowIndex = rows - 1 - rowIndex;
    //const clickedPiece = grid[rowIndex][colIndex];

    //if (bonusTiki && clickedPiece.pieceId !== null) {
    //removePieceFromGridByCell(actualRowIndex, colIndex);
    setBonusTiki(false);
    //handleBonusTikiTx(actualRowIndex, colIndex);
    // }
  };

  const handleRowClick = (rowIndex: number) => {
    if (bonusWave) {
      const actualRowIndex = rows - 1 - rowIndex;
      //checkAndClearSelectedLine(rowIndex);
      setBonusWave(false);
      // Call TX for bonus wave
      handleBonusWaveTx(actualRowIndex);
    }
  };

  const handleBonusWaveTx = useCallback(
    async (rowIndex: number) => {
      if (isAnimating) return;
      if (!account) return;

      setIsTxProcessing(true);
      try {
        await applyBonus({
          account: account as Account,
          bonus: 3,
          row_index: rowIndex,
          block_index: 0,
        });
      } finally {
        //setIsLoading(false);
      }
    },
    [account],
  );

  return (
    <>
      <Card
        className={`p-4 bg-secondary ${isTxProcessing || isAnimating ? "cursor-wait" : "cursor-move"}`}
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

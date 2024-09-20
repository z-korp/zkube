import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/ui/elements/card";
import { useDojo } from "@/dojo/useDojo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire, faStar } from "@fortawesome/free-solid-svg-icons";
import { GameBonus } from "../containers/GameBonus";
import { Piece, Cell as CellType } from "@/types/types";
import Cell from "./Cell";
import { useMediaQuery } from "react-responsive";
import { Account } from "starknet";
import useAccountCustom from "@/hooks/useAccountCustom";
import MaxComboIcon from "./MaxComboIcon";
import Grid from "./Grid";

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

interface Block {
  id: number;
  x: number;
  y: number;
  width: number;
}

function transformDataContratIntoBlock(grid: number[][]): Block[] {
  let blockId = 1; // Pour générer des identifiants uniques pour chaque bloc

  return grid.flatMap((row, y) => {
    const blocks: Block[] = [];
    let x = 0;

    while (x < row.length) {
      const currentValue = row[x];
      if (currentValue > 0) {
        // La largeur est définie par la valeur
        blocks.push({ id: blockId++, x, y, width: currentValue });
        x += currentValue; // Passer à la prochaine position après ce bloc
      } else {
        x++; // Passer à la colonne suivante si la valeur est 0
      }
    }

    return blocks; // Retourner les blocs trouvés dans cette ligne
  });
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
      systemCalls: { move, applyBonus },
    },
  } = useDojo();
  const { account } = useAccountCustom();

  const [grid, setGrid] = useState<CellType[][]>([]);
  const [isTxProcessing, setIsTxProcessing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const rows = 10;
  const cols = 8;

  const [bonusWave, setBonusWave] = useState(false);
  const [bonusTiki, setBonusTiki] = useState(false);
  const [bonusHammer, setBonusHammer] = useState(false);

  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  const dataContrat = [
    [0, 2, 2, 2, 2, 0, 0, 0], // Deux blocs de 2
    [0, 4, 4, 4, 4, 0, 0, 0], // Un bloc de 5
    [0, 0, 0, 0, 0, 0, 0, 0], // Aucun bloc
    [0, 0, 0, 0, 0, 0, 0, 0], // Aucun bloc
    [0, 1, 1, 3, 3, 3, 0, 0], // Deux blocks de 1 et un bloc de 3
    [0, 0, 0, 0, 0, 0, 0, 0], // Aucun bloc
    [1, 2, 2, 4, 4, 4, 4, 1], // un bloc de 1, 1 bloc de 2 et un bloc de 4, un bloc de 1
  ];

  const result = transformDataContratIntoBlock(dataContrat);

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
    const clickedPiece = grid[rowIndex][colIndex];

    if (bonusTiki && clickedPiece.pieceId !== null) {
      //removePieceFromGridByCell(actualRowIndex, colIndex);
      setBonusTiki(false);
      //handleBonusTikiTx(actualRowIndex, colIndex);
    }
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
          className={`${isMdOrLarger ? "w-[413px]" : "w-[300px]"} mb-4 flex justify-between`}
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
          <Grid initialData={result} />
        </div>
      </Card>
    </>
  );
};

export default GameBoard;

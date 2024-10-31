import { useEffect, useRef, useState } from "react";
import { useGame } from "@/hooks/useGame"; // Assurez-vous d'utiliser le bon chemin
import {
  deepCompareNumberArrays,
  formatBigIntToBinaryArrayCustom,
} from "@/utils/gridUtils";

interface DebugData {
  blocksRaw: bigint;
  blocksRawBinary: string;
  blocksRawFormatted: string[];
  blocksRawFormattedContractOrder: string[];
  blocks: number[][];
}

export const useGrid = ({
  gameId,
  shouldLog,
}: {
  gameId: string | undefined;
  shouldLog: boolean;
}) => {
  // Utiliser useGame pour récupérer game et gameKey
  const { game } = useGame({ gameId, shouldLog });

  // Utiliser un ref pour garder les blocks précédents
  const prevBlocksRef = useRef<number[][] | null>(null);
  const [blocks, setBlocks] = useState<number[][]>([]);

  // Utiliser useEffect pour gérer le log quand la grille change
  useEffect(() => {
    if (game?.blocks) {
      // Vérifier si la grille a changé
      if (!deepCompareNumberArrays(game.blocks, prevBlocksRef.current)) {
        // Si shouldLog est true, on log les données
        if (shouldLog) {
          const num = game.blocksRaw;
          const binaryString = num.toString(2);
          const [formattedRows, formattedRowsContractOrder] =
            formatBigIntToBinaryArrayCustom(num);

          const debugData: DebugData = {
            blocksRaw: num,
            blocksRawBinary: binaryString,
            blocksRawFormatted: formattedRows,
            blocksRawFormattedContractOrder: formattedRowsContractOrder,
            blocks: game.blocks,
          };

          console.log("Grid updated:", debugData);
        }

        // Mettre à jour la référence des blocs précédents
        prevBlocksRef.current = game.blocks;
        setBlocks(game.blocks);
      }
    }
  }, [game?.blocks, game?.blocksRaw, shouldLog]);

  // Retourner la grille
  return blocks;
};

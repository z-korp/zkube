import { useDojo } from "@/dojo/useDojo";
import { useEffect, useMemo, useRef } from "react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useComponentValue } from "@dojoengine/react";
import { Entity } from "@dojoengine/recs";
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

export const useGame = ({
  gameId,
  shouldLog,
}: {
  gameId: string | undefined;
  shouldLog: boolean;
}) => {
  const {
    setup: {
      clientModels: {
        models: { Game },
        classes: { Game: GameClass },
      },
    },
  } = useDojo();

  const gameKey = useMemo(
    () => getEntityIdFromKeys([BigInt(gameId || 0)]) as Entity,
    [gameId],
  );

  const component = useComponentValue(Game, gameKey);

  const game = useMemo(() => {
    return component ? new GameClass(component) : null;
  }, [component]);

  // Use a ref to keep track of the previous blocks
  const prevBlocksRef = useRef<number[][] | null>(null);

  useEffect(() => {
    if (game) {
      // Perform a deep comparison between current and previous blocks
      if (!deepCompareNumberArrays(game.blocks, prevBlocksRef.current)) {
        if (shouldLog) {
          const num = game.blocksRaw;
          const binaryString = num.toString(2);
          const ret = formatBigIntToBinaryArrayCustom(num);
          const formattedRows = ret[0];
          const formattedRowsContractOrder = ret[1];

          // Collect debug information into an object
          const newDebugData: DebugData = {
            blocksRaw: num,
            blocksRawBinary: binaryString,
            blocksRawFormatted: formattedRows,
            blocksRawFormattedContractOrder: formattedRowsContractOrder,
            blocks: game.blocks,
          };

          // Optionally log the debug data
          console.log("Grid updated:", newDebugData);
        }
        prevBlocksRef.current = game.blocks; // Update the previous blocks reference
      }
    }
  }, [game?.blocks]);

  return { game, gameKey };
};

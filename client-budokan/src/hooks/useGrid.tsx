import { useEffect, useState, useRef } from "react";
import { useGame } from "@/hooks/useGame";
import useDeepMemo from "./useDeepMemo";

export const useGrid = ({
  gameId,
  shouldLog,
}: {
  gameId: bigint | undefined;
  shouldLog: boolean;
}) => {
  const { game } = useGame({ gameId, shouldLog });

  // État pour la grille de blocs
  const [blocks, setBlocks] = useState<number[][]>([]);

  // Ref pour garder les blocs les plus récents
  const blocksRef = useRef<number[][]>(blocks);

  // Mémoriser en profondeur les changements dans les blocs du jeu
  const memoizedBlocks = useDeepMemo(() => game?.blocks ?? [], [game?.blocks]);

  useEffect(() => {
    if (game?.isOver()) {
      setBlocks([]);
      blocksRef.current = [];
      return;
    }
    // During level transitions the chain grid is stale (old level's final state).
    // Skip the update instead of clearing — this prevents isGridLoading from
    // flickering true, which would unmount the Grid and kill in-progress combo
    // animations. The Grid's receipt-based sync handles its own state.
    if (game?.levelTransitionPending) return;
    if (game && memoizedBlocks.length > 0) {
      setBlocks(memoizedBlocks);
      blocksRef.current = memoizedBlocks;
    }
  }, [memoizedBlocks, game, shouldLog]);

  // Retourner la ref actuelle pour garantir la synchronisation immédiate
  return blocksRef.current;
};

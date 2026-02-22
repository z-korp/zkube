import { useEffect, useState, useRef } from "react";
import { useGame } from "@/hooks/useGame";
import useDeepMemo from "./useDeepMemo";

export const useGrid = ({
  gameId,
  shouldLog,
}: {
  gameId: number | undefined;
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
    if (game && memoizedBlocks.length > 0) {
      // Mettre à jour `blocks` et `blocksRef` simultanément
      setBlocks(memoizedBlocks);
      blocksRef.current = memoizedBlocks; // synchroniser la ref
    }
  }, [memoizedBlocks, game, shouldLog]);

  // Retourner la ref actuelle pour garantir la synchronisation immédiate
  return blocksRef.current;
};

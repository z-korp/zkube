import { useDojo } from "@/dojo/useDojo";
import { useMemo } from "react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useComponentValue } from "@dojoengine/react";
import useDeepMemo from "./useDeepMemo";
import { normalizeEntityId } from "@/utils/entityId";
import { useReceiptGameStore } from "@/stores/receiptGameStore";

export const useGame = ({
  gameId,
}: {
  gameId: bigint | undefined;
  shouldLog: boolean;
}) => {
  const {
    setup: {
      clientModels: {
        models: { Game, GameSeed },
        classes: { Game: GameClass },
      },
    },
  } = useDojo();

  const gameKeySource = gameId ?? 0n;

  const gameKey = useMemo(() => {
    const rawKey = getEntityIdFromKeys([gameKeySource]);
    return normalizeEntityId(rawKey);
  }, [gameKeySource]);

  const component = useComponentValue(Game, gameKey);
  const seedComponent = useComponentValue(GameSeed, gameKey);

  // Receipt-based fast path: when a start-game TX has just confirmed, the
  // receipt store holds the freshly-minted Game + GameSeed, so we skip the
  // wait for Torii to index. Only honor it when the gameId matches.
  const receiptGameId = useReceiptGameStore((s) => s.gameId);
  const receiptGame = useReceiptGameStore((s) => s.game);
  const receiptSeed = useReceiptGameStore((s) => s.seed);
  const useReceipt =
    gameId !== undefined &&
    receiptGameId !== null &&
    BigInt(gameId) === receiptGameId;

  const toriiGame = useDeepMemo(() => {
    return component ? new GameClass(component) : null;
  }, [component]);

  const game = useReceipt && receiptGame ? receiptGame : toriiGame;

  const seed = useMemo(() => {
    if (useReceipt && receiptSeed != null) return receiptSeed;
    return seedComponent?.seed ? BigInt(seedComponent.seed) : 0n;
  }, [useReceipt, receiptSeed, seedComponent]);

  return { game, gameKey, seed };
};

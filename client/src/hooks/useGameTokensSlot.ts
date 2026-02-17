import { useDojo } from "@/dojo/useDojo";
import { useEffect, useState, useCallback, useRef } from "react";
import { getComponentValue, Has, runQuery } from "@dojoengine/recs";
import type { GameTokenData } from "metagame-sdk";
import { unpackRunData } from "@/dojo/game/helpers/runDataPacking";
import { createLogger } from "@/utils/logger";
import { addAddressPadding } from "starknet";
import type { Subscription, TokenBalance } from "@dojoengine/torii-client";

const log = createLogger("useGameTokensSlot");

const { VITE_PUBLIC_DEPLOY_TYPE, VITE_PUBLIC_GAME_TOKEN_ADDRESS } = import.meta.env;
export const isSlotMode = VITE_PUBLIC_DEPLOY_TYPE === "slot";

type UseGameTokensSlotResult = {
  games: GameTokenData[];
  loading: boolean;
  metadataLoading: boolean;
  refetch: () => void;
};

export const useGameTokensSlot = ({
  owner,
  limit = 100,
  forceRecs = false,
}: {
  owner?: string;
  sortBy?: string;
  sortOrder?: string;
  limit?: number;
  includeMetadata?: boolean;
  gameAddresses?: string[];
  forceRecs?: boolean;
}): UseGameTokensSlotResult => {
  const {
    setup: {
      toriiClient,
      clientModels: {
        models: { Game },
      },
    },
  } = useDojo();

  const [games, setGames] = useState<GameTokenData[]>([]);
  const [loading, setLoading] = useState(true);
  const subscriptionRef = useRef<Subscription | null>(null);
  const cancelledRef = useRef(false);

  const shouldFetch = (isSlotMode || forceRecs) && !!owner;

  const buildGamesList = useCallback((ownedTokenIds: Set<number>) => {
    const gameEntities = runQuery([Has(Game)]);
    const gameList: GameTokenData[] = [];
    const seenIds = new Set<number>();

    for (const entity of gameEntities) {
      const gameData = getComponentValue(Game, entity);
      if (!gameData || gameData.game_id === 0) continue;
      if (!ownedTokenIds.has(gameData.game_id)) continue;
      if (seenIds.has(gameData.game_id)) continue;
      seenIds.add(gameData.game_id);

      const runData = unpackRunData(gameData.run_data ? BigInt(gameData.run_data) : BigInt(0));
      const { currentLevel: level, cubesBrought, cubesSpent, totalCubes, totalScore } = runData;

      const metadata = JSON.stringify({
        name: `Game #${gameData.game_id}`,
        attributes: [
          { trait_type: "Level", value: level },
          { trait_type: "Total Cubes", value: totalCubes },
          { trait_type: "Total Score", value: totalScore },
          { trait_type: "Cubes Brought", value: cubesBrought },
          { trait_type: "Cubes Spent", value: cubesSpent },
        ],
      });

      gameList.push({
        token_id: gameData.game_id,
        score: totalScore,
        game_over: gameData.over,
        metadata,
        gameMetadata: { name: `Game #${gameData.game_id}` },
      } as GameTokenData);

      if (gameList.length >= limit) break;
    }

    gameList.sort((a, b) => b.token_id - a.token_id);
    return gameList;
  }, [Game, limit]);

  const fetchOwnedTokenIds = useCallback(async (): Promise<Set<number>> => {
    if (!toriiClient || !VITE_PUBLIC_GAME_TOKEN_ADDRESS || !owner) {
      return new Set();
    }

    const contractAddresses = [addAddressPadding(VITE_PUBLIC_GAME_TOKEN_ADDRESS)];
    const accountAddresses = [addAddressPadding(owner)];

    const balances = await toriiClient.getTokenBalances({
      contract_addresses: contractAddresses,
      account_addresses: accountAddresses,
      token_ids: [],
      pagination: { cursor: undefined, direction: "Backward", limit, order_by: [] },
    });

    const ids = new Set<number>();
    for (const b of balances.items) {
      if (BigInt(b.contract_address) !== BigInt(VITE_PUBLIC_GAME_TOKEN_ADDRESS)) continue;
      if (!b.token_id) continue;
      const id = Number(BigInt(b.token_id));
      if (id > 0) ids.add(id);
    }

    log.debug("Owned token IDs:", ids.size);
    return ids;
  }, [toriiClient, owner, limit]);

  const refresh = useCallback(async () => {
    if (!shouldFetch) return;
    setLoading(true);
    try {
      const ownedIds = await fetchOwnedTokenIds();
      if (!cancelledRef.current) {
        setGames(buildGamesList(ownedIds));
      }
    } catch (error) {
      log.error("Error fetching games:", error);
      if (!cancelledRef.current) setGames([]);
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [shouldFetch, fetchOwnedTokenIds, buildGamesList]);

  // Initial fetch + subscription setup (same pattern as useCubeBalance)
  useEffect(() => {
    if (!shouldFetch || !toriiClient || !VITE_PUBLIC_GAME_TOKEN_ADDRESS || !owner) {
      setLoading(false);
      return;
    }

    cancelledRef.current = false;

    const setup = async () => {
      setLoading(true);

      try {
        const ownedIds = await fetchOwnedTokenIds();
        if (!cancelledRef.current) {
          setGames(buildGamesList(ownedIds));
        }
      } catch (error) {
        log.error("Error fetching games:", error);
        if (!cancelledRef.current) setGames([]);
      } finally {
        if (!cancelledRef.current) setLoading(false);
      }

      if (subscriptionRef.current) {
        try { subscriptionRef.current.cancel(); } catch { /* ignore */ }
        subscriptionRef.current = null;
      }

      try {
        const contractAddresses = [addAddressPadding(VITE_PUBLIC_GAME_TOKEN_ADDRESS)];
        const accountAddresses = [addAddressPadding(owner)];

        const subscription = await toriiClient.onTokenBalanceUpdated(
          contractAddresses,
          accountAddresses,
          [],
          (_update: TokenBalance) => {
            if (cancelledRef.current) return;
            log.info("ERC721 token balance updated, rebuilding games list");
            refresh();
          },
        );

        if (!cancelledRef.current) {
          subscriptionRef.current = subscription;
          log.info("ERC721 token subscription active");
        } else {
          try { subscription.cancel(); } catch { /* ignore */ }
        }
      } catch (err) {
        log.error("Error setting up ERC721 subscription:", err);
      }
    };

    setup();

    return () => {
      cancelledRef.current = true;
      if (subscriptionRef.current) {
        try { subscriptionRef.current.cancel(); } catch { /* ignore */ }
        subscriptionRef.current = null;
      }
    };
  }, [toriiClient, owner, shouldFetch, fetchOwnedTokenIds, buildGamesList, refresh]);

  return {
    games,
    loading,
    metadataLoading: false,
    refetch: refresh,
  };
};

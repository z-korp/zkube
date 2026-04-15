import { useMemo } from "react";
import { useComponentValue } from "@dojoengine/react";
import type { Entity } from "@dojoengine/recs";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useDojo } from "@/dojo/useDojo";
import { normalizeEntityId } from "@/utils/entityId";

export function usePlayerEntry(
  challengeId: number | undefined,
  playerAddress: string | undefined,
) {
  const {
    setup: {
      contractComponents: { DailyEntry },
    },
  } = useDojo();

  const entryKey = useMemo(() => {
    if (challengeId === undefined || !playerAddress) return undefined;
    const rawKey = getEntityIdFromKeys([
      BigInt(challengeId),
      BigInt(playerAddress),
    ]);
    return normalizeEntityId(rawKey);
  }, [challengeId, playerAddress]);

  const rawEntry = useComponentValue(
    DailyEntry,
    entryKey as Entity | undefined,
  );

  return {
    entry: rawEntry ?? null,
    isRegistered: rawEntry !== undefined && rawEntry !== null,
  };
}

export default usePlayerEntry;

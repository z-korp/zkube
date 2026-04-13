import { useMemo } from "react";
import { useToken } from "@provable-games/denshokan-sdk/react";

/**
 * Resolve the `settings_id` a Denshokan-minted token was created against.
 *
 * Why this exists: the zone-endless formula `zoneId * 2 - 1` (used across the
 * client) only matches for zone runs. Tournaments and community-created
 * settings get auto-incremented ids (e.g. Tournament Mayan at id 23 on
 * sepolia), so the formula lands on the wrong `GameSettings` and the HUD
 * reads the wrong endless ramp / multipliers.
 *
 * The source of truth is Denshokan's `TokenMetadata.settings_id`, which the
 * SDK fetches via REST (with RPC fallback).
 *
 * Returns `{ settingsId: null, isLoading: true }` until the token resolves,
 * so callers can fall back to their formula without flicker.
 */
export function useTokenSettingsId(gameId: bigint | null | undefined): {
  settingsId: number | null;
  isLoading: boolean;
} {
  const tokenIdStr = useMemo(
    () => (gameId && gameId !== 0n ? `0x${gameId.toString(16)}` : undefined),
    [gameId],
  );
  const { data, isLoading } = useToken(tokenIdStr);
  return {
    settingsId: data?.settingsId ?? null,
    isLoading,
  };
}

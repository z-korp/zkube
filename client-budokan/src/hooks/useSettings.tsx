import { useMemo } from "react";
import { useComponentValue } from "@dojoengine/react";
import type { Entity } from "@dojoengine/recs";
import { useDojo } from "@/dojo/useDojo";
import type { GameSettings } from "@/dojo/game/types/level";
import { DEFAULT_SETTINGS, parseGameSettings } from "@/dojo/game/types/level";
import { getEntityIdFromKeys } from "@dojoengine/utils";

/**
 * Hook to get GameSettings from RECS
 * @param settingsId - The settings ID to fetch (default: 1 for progressive difficulty)
 * @returns The game settings object
 */
export function useSettings(settingsId: number = 1): {
  settings: GameSettings;
  isLoading: boolean;
} {
  const {
    setup: {
      contractComponents: { GameSettings: GameSettingsComponent },
    },
  } = useDojo();

  // Get entity key for the settings
  const settingsKey = useMemo(() => {
    return getEntityIdFromKeys([BigInt(settingsId)]) as Entity;
  }, [settingsId]);

  // Read settings from RECS
  const rawSettings = useComponentValue(GameSettingsComponent, settingsKey);

  // Parse and memoize the settings
  const settings = useMemo(() => {
    if (!rawSettings) {
      return DEFAULT_SETTINGS;
    }
    return parseGameSettings(rawSettings);
  }, [rawSettings]);

  return {
    settings,
    isLoading: !rawSettings,
  };
}

export default useSettings;

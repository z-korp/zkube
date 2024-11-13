import { useDojo } from "@/dojo/useDojo";
import { useMemo } from "react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useComponentValue } from "@dojoengine/react";
import { Entity } from "@dojoengine/recs";
import useDeepMemo from "./useDeepMemo";

export const useSettings = () => {
  const {
    setup: {
      clientModels: {
        models: { Settings },
        classes: { Settings: SettingsClass },
      },
    },
  } = useDojo();

  const settingsKey = useMemo(
    () => getEntityIdFromKeys([BigInt(1)]) as Entity,
    [],
  );

  const component = useComponentValue(Settings, settingsKey);
  const settings = useDeepMemo(() => {
    return component ? new SettingsClass(component) : null;
  }, [component]);

  return { settings, settingsKey };
};

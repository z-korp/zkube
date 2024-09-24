import { useDojo } from "@/dojo/useDojo";
import { useMemo } from "react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useComponentValue } from "@dojoengine/react";
import { Entity } from "@dojoengine/recs";

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
  const settings = useMemo(() => {
    return component ? new SettingsClass(component) : null;
  }, [component]);

  //console.log("settings", settings);

  return { settings, settingsKey };
};

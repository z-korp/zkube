import { useEffect } from "react";
import { useApplication } from "@pixi/react";
import { usePerformanceSettings } from "../themes/ThemeContext";

export const TickerConfig = () => {
  const { app } = useApplication();
  const { targetFPS } = usePerformanceSettings();

  useEffect(() => {
    if (app?.ticker) {
      app.ticker.maxFPS = targetFPS;
    }
  }, [app, targetFPS]);

  return null;
};

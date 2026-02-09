import { manifest } from "./manifest";
import { createLogger } from "@/utils/logger";

const log = createLogger("metagame/config");

// Metagame config with fallbacks to main world config
export const metagameConfig = {
  toriiUrl: import.meta.env.VITE_PUBLIC_METAGAME_TORII_URL || import.meta.env.VITE_PUBLIC_TORII,
  worldAddress: import.meta.env.VITE_PUBLIC_DENSHOKAN_ADDRESS || import.meta.env.VITE_PUBLIC_WORLD_ADDRESS || manifest?.world?.address,
  namespace: import.meta.env.VITE_PUBLIC_METAGAME_NAMESPACE || import.meta.env.VITE_PUBLIC_NAMESPACE,
};

log.info("Metagame configuration", {
  toriiUrl: metagameConfig.toriiUrl,
  worldAddress: metagameConfig.worldAddress,
  namespace: metagameConfig.namespace,
  sources: {
    toriiUrl: import.meta.env.VITE_PUBLIC_METAGAME_TORII_URL ? "METAGAME_TORII_URL" : "TORII",
    worldAddress: import.meta.env.VITE_PUBLIC_DENSHOKAN_ADDRESS ? "DENSHOKAN_ADDRESS" 
      : import.meta.env.VITE_PUBLIC_WORLD_ADDRESS ? "WORLD_ADDRESS" : "manifest",
    namespace: import.meta.env.VITE_PUBLIC_METAGAME_NAMESPACE ? "METAGAME_NAMESPACE" : "NAMESPACE",
  },
});

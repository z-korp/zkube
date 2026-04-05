import { manifest } from "./manifest";

// Metagame config with fallbacks to main world config
export const metagameConfig = {
  toriiUrl: import.meta.env.VITE_PUBLIC_METAGAME_TORII_URL || import.meta.env.VITE_PUBLIC_TORII,
  worldAddress: import.meta.env.VITE_PUBLIC_DENSHOKAN_ADDRESS || import.meta.env.VITE_PUBLIC_WORLD_ADDRESS || manifest?.world?.address,
  namespace: import.meta.env.VITE_PUBLIC_METAGAME_NAMESPACE || import.meta.env.VITE_PUBLIC_NAMESPACE,
};


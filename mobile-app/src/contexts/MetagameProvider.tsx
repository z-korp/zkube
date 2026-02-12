import { useEffect, useState, type ReactNode } from "react";
import {
  initMetagame,
  MetagameProvider as MetagameSDKProvider,
} from "metagame-sdk";
import { metagameConfig } from "@/config/metagame";
import { createLogger } from "@/utils/logger";

const log = createLogger("MetagameProvider");

export const MetagameProvider = ({ children }: { children: ReactNode }) => {
  const [metagameClient, setMetagameClient] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const setupMetagame = async () => {
      log.info("Initializing with config:", {
        toriiUrl: metagameConfig.toriiUrl,
        worldAddress: metagameConfig.worldAddress,
      });

      // Skip initialization if required config is missing
      if (!metagameConfig.toriiUrl || !metagameConfig.worldAddress) {
        log.warn("Not initialized: missing toriiUrl or worldAddress");
        return;
      }

      try {
        const client = await initMetagame({
          toriiUrl: metagameConfig.toriiUrl,
          worldAddress: metagameConfig.worldAddress,
        });

        log.info("Successfully initialized client");

        if (mounted) {
          setMetagameClient(client);
        }
      } catch (error) {
        log.error("Failed to initialize:", error);
      }
    };

    setupMetagame();

    return () => {
      mounted = false;
    };
  }, []);

  if (!metagameClient) {
    // Allow the rest of the app to render while Metagame initializes.
    // Hooks that rely on metagame-sdk should handle the "not ready" case
    // via getMetagameClientSafe().
    return <>{children}</>;
  }

  return (
    <MetagameSDKProvider metagameClient={metagameClient}>
      {children}
    </MetagameSDKProvider>
  );
};

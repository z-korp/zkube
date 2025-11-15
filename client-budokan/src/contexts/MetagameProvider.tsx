import { useEffect, useState, type ReactNode } from "react";
import {
  initMetagame,
  MetagameProvider as MetagameSDKProvider,
} from "metagame-sdk";
import { metagameConfig } from "@/config/metagame";

export const MetagameProvider = ({ children }: { children: ReactNode }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [metagameClient, setMetagameClient] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const setupMetagame = async () => {
      try {
        const client = await initMetagame({
          toriiUrl: metagameConfig.toriiUrl,
          worldAddress: metagameConfig.worldAddress,
        });

        if (mounted) {
          setMetagameClient(client);
        }
      } catch (error) {
        console.error("Failed to initialize Metagame SDK:", error);
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


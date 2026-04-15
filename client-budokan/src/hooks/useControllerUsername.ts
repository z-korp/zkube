import { useCallback, useEffect, useState } from "react";
import { useAccount } from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";

/**
 * Hook to get the current connected user's Cartridge controller username.
 * Gets the username directly from the connector, which is more reliable
 * than looking it up via address.
 */
export const useControllerUsername = () => {
  const { address, connector } = useAccount();
  const [username, setUsername] = useState<string | undefined>(undefined);

  const getUsername = useCallback(async () => {
    if (!connector || connector.id !== "controller") return;

    try {
      const controllerConnector = connector as unknown as ControllerConnector;
      const name = await controllerConnector.username();
      setUsername(name || undefined);
    } catch (error) {
      console.error("[useControllerUsername] Failed to fetch username:", error);
      setUsername(undefined);
    }
  }, [connector]);

  useEffect(() => {
    getUsername();
  }, [getUsername, address]);

  return { username };
};

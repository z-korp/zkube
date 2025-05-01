import { useAccount } from "@starknet-react/core";
import { useState, useEffect } from "react";
import ControllerConnector from "@cartridge/connector/controller";

export const fetchUsername = async (
  address: string | undefined,
  connector: any,
): Promise<string | undefined> => {
  if (!address || !connector) {
    return undefined;
  }

  const controllerConnector = connector as ControllerConnector;
  if (typeof controllerConnector.username === "function") {
    try {
      return await controllerConnector.username();
    } catch (error) {
      console.error("Error fetching username:", error);
      return undefined;
    }
  }
  return undefined;
};

export const useControllerUsername = () => {
  const { address, connector } = useAccount();
  const [username, setUsername] = useState<string | undefined>(undefined);

  useEffect(() => {
    const updateUsername = async () => {
      const name = await fetchUsername(address, connector);
      setUsername(name);
    };

    updateUsername();
  }, [address, connector]);

  return { username };
};

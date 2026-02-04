import type { Controller } from "@dojoengine/torii-client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { BigNumberish } from "starknet";
import { useDojo } from "@/dojo/useDojo";

type ControllersProviderProps = {
  children: React.ReactNode;
};

type ControllersProviderState = {
  controllers: Controller[];
  refresh: () => Promise<void>;
  find: (address: string) => Controller | undefined;
};

const ControllersProviderContext = createContext<
  ControllersProviderState | undefined
>(undefined);

export function ControllersProvider({
  children,
}: ControllersProviderProps) {
  const { setup } = useDojo();
  const { toriiClient } = setup;
  const [controllers, setControllers] = useState<Controller[]>([]);

  const refresh = useCallback(async () => {
    if (!toriiClient) return;
    try {
      const res = await toriiClient.getControllers({
        contract_addresses: [],
        usernames: [],
        pagination: {
          cursor: undefined,
          direction: "Backward",
          limit: 50_000,
          order_by: [],
        },
      });
      setControllers(res.items as Controller[]);
    } catch (error) {
      console.error("Error fetching controllers:", error);
    }
  }, [toriiClient]);

  const find = useCallback(
    (address: BigNumberish): Controller | undefined => {
      try {
        return controllers.find(
          (controller) => BigInt(controller.address) === BigInt(address)
        );
      } catch {
        return undefined;
      }
    },
    [controllers]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ControllersProviderContext.Provider
      value={{
        controllers,
        refresh,
        find,
      }}
    >
      {children}
    </ControllersProviderContext.Provider>
  );
}

export const useControllers = () => {
  const context = useContext(ControllersProviderContext);

  if (context === undefined)
    throw new Error("useControllers must be used within a ControllersProvider");

  return context;
};

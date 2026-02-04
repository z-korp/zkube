import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { SetupResult } from "./setup";

export const DojoContext = createContext<SetupResult | null>(null);

export const DojoProvider = ({
  children,
  value,
}: {
  children: ReactNode;
  value: SetupResult;
}) => {
  const currentValue = useContext(DojoContext);
  if (currentValue) throw new Error("DojoProvider can only be used once");

  /*const {
    config: { rpcUrl, masterAddress, masterPrivateKey },
    //burnerManager,
  } = value;

  /*const rpcProvider = useMemo(
    () =>
      new RpcProvider({
        nodeUrl: rpcUrl,
      }),
    [rpcUrl],
  );

  /*const masterAccount = useMemo(
    () => new Account(rpcProvider, masterAddress, masterPrivateKey),
    [rpcProvider, masterAddress, masterPrivateKey],
  );*/

  //const burnerManagerData = useBurnerManager({ burnerManager });

  return (
    <DojoContext.Provider
      value={{
        ...value,
        /*account: {
          ...burnerManagerData,
          account: burnerManagerData.account || masterAccount,
        },
        master: masterAccount,*/
      }}
    >
      {children}
    </DojoContext.Provider>
  );
};

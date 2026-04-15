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

  return (
    <DojoContext.Provider value={value}>
      {children}
    </DojoContext.Provider>
  );
};

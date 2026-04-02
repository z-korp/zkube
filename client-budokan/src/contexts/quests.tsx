import type React from "react";
import { createContext, useContext } from "react";

interface QuestsContextType {
  status: "loading" | "success";
}

const QuestsContext = createContext<QuestsContextType>({ status: "loading" });

export function QuestsProvider({ children }: { children: React.ReactNode }) {
  return (
    <QuestsContext.Provider value={{ status: "success" }}>
      {children}
    </QuestsContext.Provider>
  );
}

export function useQuestsContext() {
  return useContext(QuestsContext);
}

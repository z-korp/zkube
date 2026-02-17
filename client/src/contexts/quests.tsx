import type React from "react";
import { createContext, useContext } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojo } from "@/dojo/useDojo";
import { useQuestSync } from "@/hooks/useQuestSync";
import { useQuestSelectors } from "@/hooks/useQuestSelectors";
import type { QuestReward } from "@/dojo/models/quest";
import type { QuestFamily } from "@/types/questFamily";

export type QuestProps = {
  id: string;
  intervalId: number;
  name: string;
  description: string;
  end: number;
  completed: boolean;
  locked: boolean;
  claimed: boolean;
  progression: number;
  registry: string;
  rewards: QuestReward[];
  tasks: {
    description: string;
    total: bigint;
    count: bigint;
  }[];
};

interface QuestsContextType {
  quests: QuestProps[];
  questFamilies: QuestFamily[];
  status: "loading" | "error" | "success";
  refresh: () => Promise<void>;
}

const QuestsContext = createContext<QuestsContextType | undefined>(undefined);

export function QuestsProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const { setup } = useDojo();
  const { toriiClient } = setup;

  const { definitions, completions, advancements, creations, status, refresh } =
    useQuestSync(toriiClient, address);

  const { quests, questFamilies } =
    useQuestSelectors(definitions, completions, advancements, creations);

  const value: QuestsContextType = { quests, questFamilies, status, refresh };

  return (
    <QuestsContext.Provider value={value}>{children}</QuestsContext.Provider>
  );
}

export function useQuests() {
  const context = useContext(QuestsContext);
  if (!context) {
    throw new Error("useQuests must be used within a QuestsProvider");
  }
  return context;
}

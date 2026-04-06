import { getSyncEntities } from "@dojoengine/state";
import * as torii from "@dojoengine/torii-client";
import { KeysClause } from "@dojoengine/sdk";
import { models } from "./models.ts";
import { systems } from "./systems.ts";
import { defineContractComponents } from "./contractModels";
import { world } from "./world.ts";
import type { Config } from "../../dojo.config.ts";
import { setupWorld } from "./contractSystems.ts";
import { createLogger } from "@/utils/logger";

export type SetupResult = Awaited<ReturnType<typeof setup>>;

const { VITE_PUBLIC_NAMESPACE } = import.meta.env;
const namespace = VITE_PUBLIC_NAMESPACE || "zkube_v2_1_0";
const arcadeNamespace = "zkube_v2_1_0";
const log = createLogger("dojo/setup");

export async function setup({ ...config }: Config) {
  const worldAddress = config.manifest.world.address || "";

  log.info("Initializing Dojo setup", {
    toriiUrl: config.toriiUrl,
    worldAddress,
    namespace,
  });

  const toriiClient = await new torii.ToriiClient({
    toriiUrl: config.toriiUrl,
    worldAddress,
  });

  log.info("Torii client initialized");

  // Define contract components based on the world configuration
  const contractComponents = defineContractComponents(world);

  // Create client-side components that mirror the contract components
  const clientModels = models({ contractComponents });

  const modelsToSync = [
    `${namespace}-Game`,
    `${namespace}-GameSeed`,
    `${namespace}-GameLevel`,
    `${namespace}-GameSettings`,
    `${namespace}-PlayerMeta`,
    `${namespace}-PlayerBestRun`,
    `${namespace}-GameSettingsMetadata`,
    `${namespace}-ZoneEntitlement`,
    `${namespace}-DailyChallenge`,
    `${namespace}-DailyEntry`,
    `${namespace}-DailyLeaderboard`,
    `${namespace}-GameChallenge`,
    `${namespace}-StoryZoneProgress`,
    `${namespace}-StoryAttempt`,
    `${namespace}-ActiveStoryAttempt`,
    `${arcadeNamespace}-QuestAdvancement`,
    `${arcadeNamespace}-QuestCompletion`,
    `${arcadeNamespace}-AchievementAdvancement`,
    `${arcadeNamespace}-AchievementCompletion`,
  ] as `${string}-${string}`[];
  const modelsToWatch = [
    `${namespace}-Game`,
    `${namespace}-GameSeed`,
    `${namespace}-GameLevel`,
    `${namespace}-GameSettings`,
    `${namespace}-PlayerMeta`,
    `${namespace}-PlayerBestRun`,
    `${namespace}-GameSettingsMetadata`,
    `${namespace}-ZoneEntitlement`,
    `${namespace}-DailyChallenge`,
    `${namespace}-DailyEntry`,
    `${namespace}-DailyLeaderboard`,
    `${namespace}-GameChallenge`,
    `${namespace}-StoryZoneProgress`,
    `${namespace}-StoryAttempt`,
    `${namespace}-ActiveStoryAttempt`,
    `${arcadeNamespace}-QuestAdvancement`,
    `${arcadeNamespace}-QuestCompletion`,
    `${arcadeNamespace}-AchievementAdvancement`,
    `${arcadeNamespace}-AchievementCompletion`,
  ];

  log.info("Starting entity sync", {
    modelsToSync,
    modelsToWatch,
    batchLimit: 10000,
  });

  const sync = await getSyncEntities(
    toriiClient,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contractComponents as any,
    KeysClause(
      modelsToSync,
      [undefined],
      "VariableLen"
    ).build(),
    [],
    modelsToWatch,
    10000,
    false
  );

  log.info("Entity sync started");

  // Set up the world client for interacting with smart contracts
  const client = setupWorld(config);

  return {
    client,
    clientModels,
    contractComponents,
    systemCalls: systems({ client }),
    config,
    world,
    rpcProvider: null, // No longer using DojoProvider
    sync,
    toriiClient,
  };
}

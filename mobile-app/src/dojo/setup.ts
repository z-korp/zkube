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
const namespace = VITE_PUBLIC_NAMESPACE || "zkube_budo_v1_2_0";
const log = createLogger("dojo/setup");

export async function setup({ ...config }: Config) {
  log.info("Initializing Dojo setup", {
    toriiUrl: config.toriiUrl,
    worldAddress: config.manifest.world.address,
    namespace,
  });

  // Initialize Torii client for interacting with the Dojo network
  const toriiClient = await new torii.ToriiClient({
    toriiUrl: config.toriiUrl,
    worldAddress: config.manifest.world.address || "",
  });

  log.info("Torii client initialized");

  // Define contract components based on the world configuration
  const contractComponents = defineContractComponents(world);

  // Create client-side components that mirror the contract components
  const clientModels = models({ contractComponents });

  // Sync Game, GameSeed, GameLevel, PlayerMeta models
  // All use a single key (game_id or player address) so [undefined] VariableLen works
  const modelsToSync = [
    `${namespace}-Game`,
    `${namespace}-GameSeed`,
    `${namespace}-GameLevel`,
    `${namespace}-PlayerMeta`,
  ];
  const modelsToWatch = [
    `${namespace}-Game`,
    `${namespace}-GameSeed`,
    `${namespace}-GameLevel`,
    `${namespace}-GameSettingsMetadata`,
    `${namespace}-PlayerMeta`,
  ];

  log.info("Starting entity sync", {
    modelsToSync,
    modelsToWatch,
    pollingInterval: 10000,
  });

  const sync = await getSyncEntities(
    toriiClient,
    contractComponents as any,
    KeysClause(
      modelsToSync,
      [undefined],
      "VariableLen"
    ).build(),
    [],
    modelsToWatch,
    10000,
    true
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

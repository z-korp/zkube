import { getSyncEntities } from "@dojoengine/state";
import * as torii from "@dojoengine/torii-client";
import { KeysClause } from "@dojoengine/sdk";
import { models } from "./models.ts";
import { systems } from "./systems.ts";
import { defineContractComponents } from "./contractModels";
import { world } from "./world.ts";
import type { Config } from "../../dojo.config.ts";
import { setupWorld } from "./contractSystems.ts";
import { DojoProvider } from "@dojoengine/core";

export type SetupResult = Awaited<ReturnType<typeof setup>>;

export async function setup({ ...config }: Config) {
  // Initialize Torii client for interacting with the Dojo network
  const toriiClient = await new torii.ToriiClient({
    toriiUrl: config.toriiUrl,
    worldAddress: config.manifest.world.address || "",
  });

  // Define contract components based on the world configuration
  const contractComponents = defineContractComponents(world);

  // Create client-side components that mirror the contract components
  const clientModels = models({ contractComponents });

  // Initialize the Dojo provider with the manifest and RPC URL
  const dojoProvider = new DojoProvider(config.manifest, config.rpcUrl, "info");

  const sync = await getSyncEntities(
    toriiClient,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contractComponents as any,
    KeysClause(
      ["zkube_budo_v1_1_3-Game"],
      [undefined],
      "VariableLen"
    ).build(),
    [],
    ["zkube_budo_v1_1_3-Game", "zkube_budo_v1_1_3-GameSettingsMetadata"],
    10000,
    true
  );

  // Set up the world client for interacting with smart contracts
  const client = await setupWorld(dojoProvider, config);

  return {
    client,
    clientModels,
    contractComponents,
    systemCalls: systems({ client }),
    config,
    world,
    //burnerManager,
    rpcProvider: dojoProvider.provider,
    sync,
    toriiClient,
  };
}

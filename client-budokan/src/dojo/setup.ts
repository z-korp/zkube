import { getSyncEntities } from "@dojoengine/state";
import * as torii from "@dojoengine/torii-client";
import { KeysClause } from "@dojoengine/sdk";
import { models } from "./models.ts";
import { systems } from "./systems.ts";
import { defineContractComponents } from "./contractModels";
import { world } from "./world.ts";
import type { Config } from "../../dojo.config.ts";
import { setupWorld } from "./contractSystems.ts";

export type SetupResult = Awaited<ReturnType<typeof setup>>;

const { VITE_PUBLIC_NAMESPACE } = import.meta.env;
const namespace = VITE_PUBLIC_NAMESPACE || "zkube_budo_v1_1_3";

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

  const sync = await getSyncEntities(
    toriiClient,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contractComponents as any,
    KeysClause(
      [`${namespace}-Game`],
      [undefined],
      "VariableLen"
    ).build(),
    [],
    [`${namespace}-Game`, `${namespace}-GameSettingsMetadata`],
    10000,
    true
  );

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

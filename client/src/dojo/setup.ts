import { getSyncEntities } from "@dojoengine/state";
import * as torii from "@dojoengine/torii-client";
import { models } from "./models.ts";
import { systems } from "./systems.ts";
import { defineContractComponents } from "./contractModels";
import { world } from "./world.ts";
import { Config } from "../../dojo.config.ts";
import { setupWorld } from "./contractSystems.ts";
import { DojoProvider } from "@dojoengine/core";

export type SetupResult = Awaited<ReturnType<typeof setup>>;

const { VITE_PUBLIC_NAMESPACE } = import.meta.env;

export async function setup({ ...config }: Config) {
  // Initialize Torii client for interacting with the Dojo network
  const toriiClient = await torii.createClient({
    rpcUrl: config.rpcUrl,
    toriiUrl: config.toriiUrl,
    relayUrl: "",
    worldAddress: config.manifest.world.address || "",
  });

  // Define contract components based on the world configuration
  const contractComponents = defineContractComponents(world);

  // Create client-side components that mirror the contract components
  const clientModels = models({ contractComponents });

  // Initialize the Dojo provider with the manifest and RPC URL
  const dojoProvider = new DojoProvider(config.manifest, config.rpcUrl);

  // fetch all existing entities from torii
  // await getSyncEntities(toriiClient, contractModels as any, []);
  const allExceptMintClause: torii.KeysClause = {
    keys: [undefined],
    pattern_matching: "FixedLen",
    models: [
      `${VITE_PUBLIC_NAMESPACE}-Game`,
      `${VITE_PUBLIC_NAMESPACE}-GamePrize`,
      `${VITE_PUBLIC_NAMESPACE}-Player`,
      `${VITE_PUBLIC_NAMESPACE}-PlayerInfo`,
      `${VITE_PUBLIC_NAMESPACE}-Tournament`,
      `${VITE_PUBLIC_NAMESPACE}-TournamentPrize`,
      `${VITE_PUBLIC_NAMESPACE}-Settings`,
      `${VITE_PUBLIC_NAMESPACE}-Chest`,
      `${VITE_PUBLIC_NAMESPACE}-Participation`,
      `${VITE_PUBLIC_NAMESPACE}-Admin`,
    ],
  };

  const sync = await getSyncEntities(
    toriiClient,
    contractComponents as any,
    { Keys: allExceptMintClause },
    [],
    30_000,
    false,
  );

  // Set up the world client for interacting with smart contracts
  const client = await setupWorld(dojoProvider, config);

  // Initialize the burner account manager
  /*const burnerManager = new BurnerManager({
    masterAccount: new Account(
      {
        nodeUrl: config.rpcUrl,
      },
      config.masterAddress,
      config.masterPrivateKey,
    ),
    feeTokenAddress: config.feeTokenAddress,
    accountClassHash: config.accountClassHash,
    rpcProvider: dojoProvider.provider,
  });

  try {
    await burnerManager.init();

    if (burnerManager.list().length === 0) {
      await burnerManager.create();
    } else {
      burnerManager.select(burnerManager.list()[0].address);
    }
  } catch (e) {
    console.error(e);
  }*/

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

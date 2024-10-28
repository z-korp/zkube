import { getSyncEntities ,setEntities, syncEntities } from "@dojoengine/state";
import * as torii from "@dojoengine/torii-client";
import { models } from "./models.ts";
import { systems } from "./systems.ts";
import { defineContractComponents } from "./contractModels";
import { world } from "./world.ts";
import { Config } from "../../dojo.config.ts";
import { setupWorld } from "./contractSystems.ts";
import { DojoProvider } from "@dojoengine/core";
import { BurnerManager } from "@dojoengine/create-burner";
import { Account, RpcProvider } from "starknet";
import { Component, Metadata, Schema } from "@dojoengine/recs";

export type SetupResult = Awaited<ReturnType<typeof setup>>;
let sync: any;

export async function setup({ ...config }: Config) {
  const toriiClient = await torii.createClient({
    rpcUrl: config.rpcUrl,
    toriiUrl: config.toriiUrl,
    relayUrl: "",
    worldAddress: config.manifest.world.address || "",
  });

  const contractModels = defineContractComponents(world);

  const clientModels = models({ contractModels });

  const getEntitiesQuery = async <S extends Schema>(
    client: torii.ToriiClient,
    components: Component<S, Metadata, undefined>[], query: torii.Query,
    limit: number = 100, 
    ) => {
        let cursor = 0;
        let continueFetching = true;
        contractModels.Player

        while (continueFetching) {
            query.offset = cursor;
            const fetchedEntities: torii.Entities = await client.getEntities(query);
            console.log(fetchedEntities);

            setEntities(fetchedEntities, components as any);

            if (Object.keys(fetchedEntities).length < limit) {
                continueFetching = false;
            } else {
                cursor += limit;
            }
        }
    };

  const client = await setupWorld(
    new DojoProvider(config.manifest, config.rpcUrl),
    config,
  );

  const rpcProvider = new RpcProvider({
    nodeUrl: config.rpcUrl,
  });

  const burnerManager = new BurnerManager({
    masterAccount: new Account(
      rpcProvider,
      config.masterAddress,
      config.masterPrivateKey,
    ),
    feeTokenAddress: config.feeTokenAddress,
    accountClassHash: config.accountClassHash,

    rpcProvider,
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
  }

  // const componentArray = Object.values(contractModels);
  // const names = [ ...componentArray.map((c) => c.metadata?.name as string),];
  // console.log(names);

  async function syncEntitiesForGameID() {
    const burner = burnerManager.account?.address;
  
    const playerClause: torii.KeysClause = {
      keys: [undefined],
      pattern_matching: "FixedLen",
      models: ["zkube-Player"]
    };
  
    const gameClause: torii.MemberClause = {
      model: "zkube-Game",
      member: "player_id",
      operator: "Eq",
      value: {Felt252: burner}
    };
  
    const PlayerQuery: torii.Query = {
      limit: 10000,
      offset: 0,
      clause: {Keys: playerClause}
    }; 
  
    const GameQuery: torii.Query = {
      limit: 10000,
      offset: 0,
      clause: {Member: gameClause}
    }; 
  
    await getEntitiesQuery(toriiClient, contractModels as any, PlayerQuery);
    await getEntitiesQuery(toriiClient, contractModels as any, GameQuery);
    sync = await syncEntities(toriiClient, contractModels as any, []);
  
    //fetch all existing entities from torii
    // sync = await getSyncEntities(
    //   toriiClient,
    //   contractModels as any,
    //   [],
    //   1000,
    // );

  }

  return {
    client,
    clientModels,
    contractComponents: clientModels,
    systemCalls: systems({ client, clientModels }),
    config,
    world,
    burnerManager,
    rpcProvider,
    sync,
    toriiClient,
    syncCallback: async () => await syncEntitiesForGameID()
  };
}

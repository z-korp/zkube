import type { Config } from "../../dojo.config.ts";
import {
  Account,
  CairoOption,
  CairoOptionVariant,
  CallData,
} from "starknet";
import { stringToFelt, type Manifest } from "@/cartridgeConnector.tsx";

const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;

// VRF is only available on Sepolia/Mainnet, not on Slot
export const VRF_PROVIDER_ADDRESS =
  "0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f";

const isSlotMode = VITE_PUBLIC_DEPLOY_TYPE === "slot";

export interface Signer {
  account: Account;
}

export interface Surrender extends Signer {
  game_id: number;
}

export interface Create extends Signer {
  token_id: number;
}

export interface FreeMint extends Signer {
  name: string;
  settingsId: number;
}

export interface Move extends Signer {
  game_id: number;
  row_index: number;
  start_index: number;
  final_index: number;
}

export interface BonusTx extends Signer {
  game_id: number;
  bonus: number;
  row_index: number;
  block_index: number;
}

export interface ShopUpgrade extends Signer {
  bonus_type: number; // 0=Hammer, 1=Wave, 2=Totem
}

export interface CreateWithCubes extends Signer {
  token_id: number;
  cubes_amount: number;
}

export interface PurchaseConsumable extends Signer {
  game_id: number;
  consumable_type: number; // 0=Hammer, 1=Wave, 2=Totem, 3=ExtraMoves
}

export interface ClaimQuest extends Signer {
  quest_id: string; // felt252 encoded quest ID
  interval_id: number; // Current interval ID for the quest
}

export type IWorld = ReturnType<typeof setupWorld>;

export function setupWorld(config: Config) {
  function game() {
    const contract_name = "game_system";
    const contract = config.manifest.contracts.find(
      (c: Manifest["contracts"][number]) => c.tag.includes(contract_name)
    );
    if (!contract) {
      throw new Error(`Contract ${contract_name} not found in manifest`);
    }

    const free_mint = async ({ account, name, settingsId = 0 }: FreeMint) => {
      try {
        const trimmedName = name.trim();

        return await account.execute([
          {
            contractAddress: contract.address,
            entrypoint: "mint_game",
            calldata: CallData.compile([
              new CairoOption(CairoOptionVariant.Some, stringToFelt(trimmedName)),
              new CairoOption(CairoOptionVariant.Some, settingsId),
              1, // start
              1, // end
              1, // objective_ids
              1, // context
              1, // client_url
              1, // renderer_address
              account.address,
              false, // soulbound
            ])
          }
        ]);
      } catch (error) {
        console.error("Error executing free_mint:", error);
        throw error;
      }
    };

    const create = async ({ account, token_id }: Create) => {
      try {
        console.log("token_id", token_id);

        // On Slot, skip VRF call since it's not deployed
        if (isSlotMode) {
          return await account.execute([
            {
              contractAddress: contract.address,
              entrypoint: "create",
              calldata: [token_id],
            },
          ]);
        }

        // On Sepolia/Mainnet, include VRF request
        return await account.execute([
          {
            contractAddress: VRF_PROVIDER_ADDRESS,
            entrypoint: "request_random",
            calldata: CallData.compile({
              caller: contract.address,
              source: { type: 0, address: account.address },
            }),
          },
          {
            contractAddress: contract.address,
            entrypoint: "create",
            calldata: [token_id],
          },
        ]);
      } catch (error) {
        console.error("Error executing start:", error);
        throw error;
      }
    };

    const surrender = async ({ account, game_id }: Surrender) => {
      try {
        return await account.execute([
          {
            contractAddress: contract.address,
            entrypoint: "surrender",
            calldata: [game_id],
          },
        ]);
      } catch (error) {
        console.error("Error executing surrender:", error);
        throw error;
      }
    };

    const move = async ({
      account,
      game_id,
      row_index,
      start_index,
      final_index,
    }: Move) => {
      try {
        return await account.execute([
          {
            contractAddress: contract.address,
            entrypoint: "move",
            calldata: [game_id, row_index, start_index, final_index],
          },
        ]);
      } catch (error) {
        console.error("Error executing move:", error);
        throw error;
      }
    };

    const bonus = async ({
      account,
      game_id,
      bonus,
      row_index,
      block_index,
    }: BonusTx) => {
      try {
        // Bonus enum serializes as just the variant index:
        // 0 = None, 1 = Hammer, 2 = Totem, 3 = Wave
        return await account.execute([
          {
            contractAddress: contract.address,
            entrypoint: "apply_bonus",
            calldata: [game_id, bonus, row_index, block_index],
          },
        ]);
      } catch (error) {
        console.error("Error executing bonus:", error);
        throw error;
      }
    };

    const create_with_cubes = async ({ account, token_id, cubes_amount }: CreateWithCubes) => {
      try {
        console.log("create_with_cubes - token_id:", token_id, "cubes:", cubes_amount);

        // On Slot, skip VRF call since it's not deployed
        if (isSlotMode) {
          return await account.execute([
            {
              contractAddress: contract.address,
              entrypoint: "create_with_cubes",
              calldata: [token_id, cubes_amount],
            },
          ]);
        }

        // On Sepolia/Mainnet, include VRF request
        return await account.execute([
          {
            contractAddress: VRF_PROVIDER_ADDRESS,
            entrypoint: "request_random",
            calldata: CallData.compile({
              caller: contract.address,
              source: { type: 0, address: account.address },
            }),
          },
          {
            contractAddress: contract.address,
            entrypoint: "create_with_cubes",
            calldata: [token_id, cubes_amount],
          },
        ]);
      } catch (error) {
        console.error("Error executing create_with_cubes:", error);
        throw error;
      }
    };

    return {
      address: contract.address,
      free_mint,
      create,
      create_with_cubes,
      surrender,
      move,
      bonus,
    };
  }

  function shop() {
    const contract_name = "shop_system";
    const contract = config.manifest.contracts.find(
      (c: Manifest["contracts"][number]) => c.tag.includes(contract_name)
    );
    if (!contract) {
      throw new Error(`Contract ${contract_name} not found in manifest`);
    }

    const upgrade_starting_bonus = async ({ account, bonus_type }: ShopUpgrade) => {
      try {
        return await account.execute([
          {
            contractAddress: contract.address,
            entrypoint: "upgrade_starting_bonus",
            calldata: [bonus_type],
          },
        ]);
      } catch (error) {
        console.error("Error executing upgrade_starting_bonus:", error);
        throw error;
      }
    };

    const upgrade_bag_size = async ({ account, bonus_type }: ShopUpgrade) => {
      try {
        return await account.execute([
          {
            contractAddress: contract.address,
            entrypoint: "upgrade_bag_size",
            calldata: [bonus_type],
          },
        ]);
      } catch (error) {
        console.error("Error executing upgrade_bag_size:", error);
        throw error;
      }
    };

    const upgrade_bridging_rank = async ({ account }: Signer) => {
      try {
        return await account.execute([
          {
            contractAddress: contract.address,
            entrypoint: "upgrade_bridging_rank",
            calldata: [],
          },
        ]);
      } catch (error) {
        console.error("Error executing upgrade_bridging_rank:", error);
        throw error;
      }
    };

    const purchase_consumable = async ({ account, game_id, consumable_type }: PurchaseConsumable) => {
      try {
        // ConsumableType enum serializes as just the variant index:
        // 0 = Hammer, 1 = Wave, 2 = Totem, 3 = ExtraMoves
        return await account.execute([
          {
            contractAddress: contract.address,
            entrypoint: "purchase_consumable",
            calldata: [game_id, consumable_type],
          },
        ]);
      } catch (error) {
        console.error("Error executing purchase_consumable:", error);
        throw error;
      }
    };

    return {
      address: contract.address,
      upgrade_starting_bonus,
      upgrade_bag_size,
      upgrade_bridging_rank,
      purchase_consumable,
    };
  }

  function quest() {
    const contract_name = "quest_system";
    const contract = config.manifest.contracts.find(
      (c: Manifest["contracts"][number]) => c.tag.includes(contract_name)
    );
    if (!contract) {
      console.warn(`Contract ${contract_name} not found in manifest - quest system disabled`);
      return null;
    }

    const claim = async ({ account, quest_id, interval_id }: ClaimQuest) => {
      try {
        return await account.execute([
          {
            contractAddress: contract.address,
            entrypoint: "claim",
            calldata: [quest_id, interval_id],
          },
        ]);
      } catch (error) {
        console.error("Error executing quest claim:", error);
        throw error;
      }
    };

    return {
      address: contract.address,
      claim,
    };
  }

  return {
    game: game(),
    shop: shop(),
    quest: quest(),
  };
}

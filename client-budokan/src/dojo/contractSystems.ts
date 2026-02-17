import type { Config } from "../../dojo.config.ts";
import type { Manifest } from "@/config/manifest.ts";
import {
  Account,
  CairoOption,
  CairoOptionVariant,
  CallData,
} from "starknet";
import { stringToFelt } from "@/cartridgeConnector.tsx";

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
  selected_bonuses: number[]; // [] uses default Combo/Harvest/Score
  cubes_amount: number; // 0 if not bringing cubes
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
  bonus_type: number; // 0=Combo, 1=Score, 2=Harvest, 3=Wave, 4=Supply
}

export interface UnlockBonus extends Signer {
  bonus_type: number; // 4=Wave, 5=Supply
}

export interface PurchaseConsumable extends Signer {
  game_id: number;
  consumable_type: number;
  bonus_slot: number;
}

export interface LevelUpBonus extends Signer {
  game_id: number;
  bonus_slot: number;
}

export interface AllocateCharge extends Signer {
  game_id: number;
  bonus_slot: number;
}

export interface SwapBonus extends Signer {
  game_id: number;
  bonus_slot: number;
  new_bonus_type: number;
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

    // move_system handles move() function
    const move_contract_name = "move_system";
    const move_contract = config.manifest.contracts.find(
      (c: Manifest["contracts"][number]) => c.tag.includes(move_contract_name)
    );
    if (!move_contract) {
      throw new Error(`Contract ${move_contract_name} not found in manifest`);
    }

    // bonus_system handles apply_bonus() function
    const bonus_contract_name = "bonus_system";
    const bonus_contract = config.manifest.contracts.find(
      (c: Manifest["contracts"][number]) => c.tag.includes(bonus_contract_name)
    );
    if (!bonus_contract) {
      throw new Error(`Contract ${bonus_contract_name} not found in manifest`);
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

    const create = async ({ account, token_id, selected_bonuses, cubes_amount }: Create) => {
      try {
        const bonusList = selected_bonuses ?? [];
        const calldata = [token_id, bonusList.length, ...bonusList, cubes_amount];
        console.log("[create] calldata:", calldata);

        // On Slot, skip VRF call since it's not deployed
        if (isSlotMode) {
          return await account.execute([
            {
              contractAddress: contract.address,
              entrypoint: "create",
              calldata,
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
            calldata,
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
            contractAddress: move_contract.address,
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
        // 0 = None, 1 = Combo, 2 = Score, 3 = Harvest, 4 = Wave, 5 = Supply
        return await account.execute([
          {
            contractAddress: bonus_contract.address,
            entrypoint: "apply_bonus",
            calldata: [game_id, bonus, row_index, block_index],
          },
        ]);
      } catch (error) {
        console.error("Error executing bonus:", error);
        throw error;
      }
    };

    return {
      address: contract.address,
      free_mint,
      create,
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

    const purchase_consumable = async ({ account, game_id, consumable_type, bonus_slot }: PurchaseConsumable) => {
      try {
        return await account.execute([
          {
            contractAddress: contract.address,
            entrypoint: "purchase_consumable",
            calldata: [game_id, consumable_type, bonus_slot],
          },
        ]);
      } catch (error) {
        console.error("Error executing purchase_consumable:", error);
        throw error;
      }
    };

    const allocate_charge = async ({ account, game_id, bonus_slot }: AllocateCharge) => {
      try {
        return await account.execute([
          {
            contractAddress: contract.address,
            entrypoint: "allocate_charge",
            calldata: [game_id, bonus_slot],
          },
        ]);
      } catch (error) {
        console.error("Error executing allocate_charge:", error);
        throw error;
      }
    };

    const swap_bonus = async ({ account, game_id, bonus_slot, new_bonus_type }: SwapBonus) => {
      try {
        return await account.execute([
          {
            contractAddress: contract.address,
            entrypoint: "swap_bonus",
            calldata: [game_id, bonus_slot, new_bonus_type],
          },
        ]);
      } catch (error) {
        console.error("Error executing swap_bonus:", error);
        throw error;
      }
    };

    const unlock_bonus = async ({ account, bonus_type }: UnlockBonus) => {
      try {
        return await account.execute([
          {
            contractAddress: contract.address,
            entrypoint: "unlock_bonus",
            calldata: [bonus_type],
          },
        ]);
      } catch (error) {
        console.error("Error executing unlock_bonus:", error);
        throw error;
      }
    };

    const level_up_bonus = async ({ account, game_id, bonus_slot }: LevelUpBonus) => {
      try {
        return await account.execute([
          {
            contractAddress: contract.address,
            entrypoint: "level_up_bonus",
            calldata: [game_id, bonus_slot],
          },
        ]);
      } catch (error) {
        console.error("Error executing level_up_bonus:", error);
        throw error;
      }
    };

    return {
      address: contract.address,
      upgrade_starting_bonus,
      upgrade_bag_size,
      upgrade_bridging_rank,
      purchase_consumable,
      allocate_charge,
      swap_bonus,
      unlock_bonus,
      level_up_bonus,
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

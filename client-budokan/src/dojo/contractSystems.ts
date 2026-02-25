import type { Config } from "../../dojo.config.ts";
import type { Manifest } from "@/config/manifest.ts";
import { Account, CairoOption, CairoOptionVariant, CallData, hash } from "starknet";
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

export interface StartNextLevel extends Signer {
  game_id: number;
  current_level: number; // Current level (for VRF salt)
}

export interface ClaimQuest extends Signer {
  quest_id: string; // felt252 encoded quest ID
  interval_id: number; // Current interval ID for the quest
}

export interface DraftReroll extends Signer {
  game_id: number;
  reroll_slot: number;
  current_count?: number;
}

export interface DraftSelect extends Signer {
  game_id: number;
  selected_slot: number;
}

export interface SkillTreeUpgrade extends Signer {
  skill_id: number;
}

export interface SkillTreeChooseBranch extends Signer {
  skill_id: number;
  branch_id: number;
}

export interface SkillTreeRespec extends Signer {
  skill_id: number;
}

export type IWorld = ReturnType<typeof setupWorld>;

// Build VRF request_random call using Source::Salt for deterministic, game-state-derived randomness.
// Salt must match the contract-side consume_random(Source::Salt(salt)) call.
const buildVrfRequestCall = (callerAddress: string, salt: bigint | string) => {
  const normalizedSalt = typeof salt === "bigint" ? salt : BigInt(salt);

  return {
    contractAddress: VRF_PROVIDER_ADDRESS,
    entrypoint: "request_random",
    calldata: CallData.compile({
      caller: callerAddress,
      source: { type: 1, salt: normalizedSalt },
    }),
  };
};

export function setupWorld(config: Config) {
  function game() {
    const contract_name = "game_system";
    const contract = config.manifest.contracts.find(
      (c: Manifest["contracts"][number]) => c.tag.includes(contract_name),
    );
    if (!contract) {
      throw new Error(`Contract ${contract_name} not found in manifest`);
    }

    // move_system handles move() function
    const move_contract_name = "move_system";
    const move_contract = config.manifest.contracts.find(
      (c: Manifest["contracts"][number]) => c.tag.includes(move_contract_name),
    );
    if (!move_contract) {
      throw new Error(`Contract ${move_contract_name} not found in manifest`);
    }

    // bonus_system handles apply_bonus() function
    const bonus_contract_name = "bonus_system";
    const bonus_contract = config.manifest.contracts.find(
      (c: Manifest["contracts"][number]) => c.tag.includes(bonus_contract_name),
    );
    if (!bonus_contract) {
      throw new Error(`Contract ${bonus_contract_name} not found in manifest`);
    }

    const level_contract_name = "level_system";
    const level_contract = config.manifest.contracts.find(
      (c: Manifest["contracts"][number]) => c.tag.includes(level_contract_name),
    );
    if (!level_contract) {
      throw new Error(`Contract ${level_contract_name} not found in manifest`);
    }

    const free_mint = async ({ account, name, settingsId = 0 }: FreeMint) => {
      try {
        const trimmedName = name.trim();

        return await account.execute([
          {
            contractAddress: contract.address,
            entrypoint: "mint_game",
            calldata: CallData.compile([
              new CairoOption(
                CairoOptionVariant.Some,
                stringToFelt(trimmedName),
              ),
              new CairoOption(CairoOptionVariant.Some, settingsId),
              1, // start
              1, // end
              1, // objective_ids
              1, // context
              1, // client_url
              1, // renderer_address
              account.address,
              false, // soulbound
            ]),
          },
        ]);
      } catch (error) {
        console.error("Error executing free_mint:", error);
        throw error;
      }
    };

    const create = async ({ account, token_id }: Create) => {
      try {
        const calldata = [token_id];

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
          buildVrfRequestCall(contract.address, BigInt(token_id)),
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
        // move() no longer needs VRF - level transitions are handled by start_next_level()
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
        // bonus() no longer needs VRF - level transitions are handled by start_next_level()
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

    const startNextLevel = async ({
      account,
      game_id,
      current_level,
    }: StartNextLevel) => {
      try {
        if (isSlotMode) {
          // On Slot, no VRF - call start_next_level directly
          return await account.execute([
            {
              contractAddress: level_contract.address,
              entrypoint: "start_next_level",
              calldata: [game_id],
            },
          ]);
        }

        // On Sepolia/Mainnet, include VRF request
        // Salt = poseidon(game_id, current_level) matching the contract
        return await account.execute([
          buildVrfRequestCall(
            level_contract.address,
            BigInt(
              hash.computePoseidonHashOnElements([
                BigInt(game_id),
                BigInt(current_level),
              ]),
            ),
          ),
          {
            contractAddress: level_contract.address,
            entrypoint: "start_next_level",
            calldata: [game_id],
          },
        ]);
      } catch (error) {
        console.error("Error executing startNextLevel:", error);
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
      startNextLevel,
    };
  }

  function quest() {
    const contract_name = "quest_system";
    const contract = config.manifest.contracts.find(
      (c: Manifest["contracts"][number]) => c.tag.includes(contract_name),
    );
    if (!contract) {
      console.warn(
        `Contract ${contract_name} not found in manifest - quest system disabled`,
      );
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

  function draft() {
    const contract_name = "draft_system";
    const contract = config.manifest.contracts.find(
      (c: Manifest["contracts"][number]) => c.tag.includes(contract_name),
    );
    if (!contract) {
      throw new Error(`Contract ${contract_name} not found in manifest`);
    }

    const reroll = async ({
      account,
      game_id,
      reroll_slot,
      current_count,
    }: DraftReroll) => {
      try {
        const rerollCount = current_count ?? 0;
        if (isSlotMode) {
          return await account.execute([
            {
              contractAddress: contract.address,
              entrypoint: "reroll",
              calldata: [game_id, reroll_slot],
            },
          ]);
        }

        return await account.execute([
          buildVrfRequestCall(
            contract.address,
            BigInt(
              hash.computePoseidonHashOnElements([
                BigInt(game_id),
                BigInt(rerollCount),
              ]),
            ),
          ),
          {
            contractAddress: contract.address,
            entrypoint: "reroll",
            calldata: [game_id, reroll_slot],
          },
        ]);
      } catch (error) {
        console.error("Error executing draft reroll:", error);
        throw error;
      }
    };

    const select = async ({
      account,
      game_id,
      selected_slot,
    }: DraftSelect) => {
      try {
        return await account.execute([
          {
            contractAddress: contract.address,
            entrypoint: "select",
            calldata: [game_id, selected_slot],
          },
        ]);
      } catch (error) {
        console.error("Error executing draft select:", error);
        throw error;
      }
    };

    return {
      address: contract.address,
      reroll,
      select,
    };
  }

  function skill_tree() {
    const contract_name = "skill_tree_system";
    const contract = config.manifest.contracts.find(
      (c: Manifest["contracts"][number]) => c.tag.includes(contract_name),
    );
    if (!contract) {
      throw new Error(`Contract ${contract_name} not found in manifest`);
    }

    const upgrade_skill = async ({
      account,
      skill_id,
    }: SkillTreeUpgrade) => {
      try {
        return await account.execute([
          {
            contractAddress: contract.address,
            entrypoint: "upgrade_skill",
            calldata: [skill_id],
          },
        ]);
      } catch (error) {
        console.error("Error executing upgrade_skill:", error);
        throw error;
      }
    };

    const choose_branch = async ({
      account,
      skill_id,
      branch_id,
    }: SkillTreeChooseBranch) => {
      try {
        return await account.execute([
          {
            contractAddress: contract.address,
            entrypoint: "choose_branch",
            calldata: [skill_id, branch_id],
          },
        ]);
      } catch (error) {
        console.error("Error executing choose_branch:", error);
        throw error;
      }
    };

    const respec_branch = async ({
      account,
      skill_id,
    }: SkillTreeRespec) => {
      try {
        return await account.execute([
          {
            contractAddress: contract.address,
            entrypoint: "respec_branch",
            calldata: [skill_id],
          },
        ]);
      } catch (error) {
        console.error("Error executing respec_branch:", error);
        throw error;
      }
    };

    return {
      address: contract.address,
      upgrade_skill,
      choose_branch,
      respec_branch,
    };
  }

  return {
    game: game(),
    quest: quest(),
    draft: draft(),
    skill_tree: skill_tree(),
  };
}

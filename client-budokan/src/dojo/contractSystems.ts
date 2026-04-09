import type { Config } from "../../dojo.config.ts";
import type { Manifest } from "@/config/manifest.ts";
import {
  Account,
  CairoOption,
  CairoOptionVariant,
  CallData,
  hash,
  type BigNumberish,
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
  game_id: BigNumberish;
}

export interface Create extends Signer {
  token_id: BigNumberish;
  run_type: number;
}

export interface CreateRun extends Signer {
  game_id: BigNumberish;
  run_type: number;
}

export interface StartRun extends Signer { zone_id: number; }
export interface ReplayLevel extends Signer { zone_id: number; level: number; }
export interface ClaimPerfection extends Signer { zone_id: number; }

export interface FreeMint extends Signer {
  name: string;
  settingsId: number;
}

export interface Move extends Signer {
  game_id: BigNumberish;
  row_index: number;
  start_index: number;
  final_index: number;
}

export interface BonusTx extends Signer {
  game_id: BigNumberish;
  row_index: number;
  block_index: number;
}

export interface AddCustomGameSettings extends Signer {
  name: string;
  description: string;
  difficulty: number;
  base_moves: number;
  max_moves: number;
  base_ratio_x100: number;
  max_ratio_x100: number;
  tier_1_threshold: number;
  tier_2_threshold: number;
  tier_3_threshold: number;
  tier_4_threshold: number;
  tier_5_threshold: number;
  tier_6_threshold: number;
  tier_7_threshold: number;
  constraints_enabled: number;
  constraint_start_level: number;
  constraint_lines_budgets: string;
  constraint_chances: number;
  veryeasy_size1_weight: number;
  veryeasy_size2_weight: number;
  veryeasy_size3_weight: number;
  veryeasy_size4_weight: number;
  veryeasy_size5_weight: number;
  master_size1_weight: number;
  master_size2_weight: number;
  master_size3_weight: number;
  master_size4_weight: number;
  master_size5_weight: number;
  early_variance_percent: number;
  mid_variance_percent: number;
  late_variance_percent: number;
  early_level_threshold: number;
  mid_level_threshold: number;
  level_cap: number;
  zone_id: number;
  active_mutator_id: number;
  passive_mutator_id: number;
  boss_id: number;
}

export interface QuestClaim extends Signer {
  player: string;
  quest_id: string;
  interval_id: number;
}

export interface PurchaseMap extends Signer {
  settings_id: number;
}

export interface UnlockWithStars extends Signer {
  settings_id: number;
}

export interface StartDailyGame extends Signer {}

export interface SettleChallenge extends Signer {
  challenge_id: number;
  ranked_players: BigNumberish[];
}

export interface SettleWeeklyEndless extends Signer {
  week_id: number;
  settings_id: number;
  ranked_players: BigNumberish[];
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
              new CairoOption(CairoOptionVariant.None),
              new CairoOption(CairoOptionVariant.None),
              new CairoOption(CairoOptionVariant.None),
              new CairoOption(CairoOptionVariant.None),
              new CairoOption(CairoOptionVariant.None),
              new CairoOption(CairoOptionVariant.None),
              new CairoOption(CairoOptionVariant.None),
              account.address,
              false,
              false,
              0,
              0,
            ]),
          },
        ]);
      } catch (error) {
        console.error("Error executing free_mint:", error);
        throw error;
      }
    };

    const create = async ({ account, token_id, run_type }: Create) => {
      try {
        const calldata = [token_id, run_type];

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
      row_index,
      block_index,
    }: BonusTx) => {
      try {
        return await account.execute([
          {
            contractAddress: contract.address,
            entrypoint: "apply_bonus",
            calldata: [game_id, row_index, block_index],
          },
        ]);
      } catch (error) {
        console.error("Error executing apply_bonus:", error);
        throw error;
      }
    };

    const createRun = async ({ account, game_id, run_type }: CreateRun) => {
      try {
        if (isSlotMode) {
          return await account.execute([
            {
              contractAddress: contract.address,
              entrypoint: "create_run",
              calldata: [game_id, run_type],
            },
          ]);
        }

        return await account.execute([
          buildVrfRequestCall(
            contract.address,
            BigInt(
              hash.computePoseidonHashOnElements([BigInt(game_id)]),
            ),
          ),
          {
            contractAddress: contract.address,
            entrypoint: "create_run",
            calldata: [game_id, run_type],
          },
        ]);
      } catch (error) {
        console.error("Error executing createRun:", error);
        throw error;
      }
    };

    return {
      address: contract.address,
      free_mint,
      create,
      createRun,
      surrender,
      move,
      bonus,
    };
  }

  function storySystem() {
    const contract_name = "story_system";
    const contract = config.manifest.contracts.find(
      (c: Manifest["contracts"][number]) => c.tag.includes(contract_name),
    );
    if (!contract) {
      console.warn(`Contract ${contract_name} not found in manifest - story system disabled`);
      return null;
    }

    const startRun = async ({ account, zone_id }: StartRun) => account.execute([{ contractAddress: contract.address, entrypoint: "start_story_attempt", calldata: [zone_id] }]);
    const replayLevel = async ({ account, zone_id, level }: ReplayLevel) => account.execute([{ contractAddress: contract.address, entrypoint: "replay_story_level", calldata: [zone_id, level] }]);
    const claimPerfection = async ({ account, zone_id }: ClaimPerfection) => account.execute([{ contractAddress: contract.address, entrypoint: "claim_zone_perfection", calldata: [zone_id] }]);

    return { address: contract.address, startRun, replayLevel, claimPerfection };
  }

  function configSystem() {
    const contract_name = "config_system";
    const contract = config.manifest.contracts.find(
      (c: Manifest["contracts"][number]) => c.tag.includes(contract_name),
    );
    if (!contract) {
      console.warn(`Contract ${contract_name} not found in manifest - config system disabled`);
      return null;
    }

    const add_custom_game_settings = async ({
      account,
      name,
      description,
      difficulty,
      base_moves,
      max_moves,
      base_ratio_x100,
      max_ratio_x100,
      tier_1_threshold,
      tier_2_threshold,
      tier_3_threshold,
      tier_4_threshold,
      tier_5_threshold,
      tier_6_threshold,
      tier_7_threshold,
      constraints_enabled,
      constraint_start_level,
      constraint_lines_budgets,
      constraint_chances,
      veryeasy_size1_weight,
      veryeasy_size2_weight,
      veryeasy_size3_weight,
      veryeasy_size4_weight,
      veryeasy_size5_weight,
      master_size1_weight,
      master_size2_weight,
      master_size3_weight,
      master_size4_weight,
      master_size5_weight,
      early_variance_percent,
      mid_variance_percent,
      late_variance_percent,
      early_level_threshold,
      mid_level_threshold,
      level_cap,
      zone_id,
      active_mutator_id,
      passive_mutator_id,
      boss_id,
    }: AddCustomGameSettings) => {
      try {
        return await account.execute([
          {
            contractAddress: contract.address,
            entrypoint: "add_custom_game_settings",
            calldata: CallData.compile([
              stringToFelt(name),
              description,
              difficulty,
              base_moves,
              max_moves,
              base_ratio_x100,
              max_ratio_x100,
              tier_1_threshold,
              tier_2_threshold,
              tier_3_threshold,
              tier_4_threshold,
              tier_5_threshold,
              tier_6_threshold,
              tier_7_threshold,
              constraints_enabled,
              constraint_start_level,
              constraint_lines_budgets,
              constraint_chances,
              veryeasy_size1_weight,
              veryeasy_size2_weight,
              veryeasy_size3_weight,
              veryeasy_size4_weight,
              veryeasy_size5_weight,
              master_size1_weight,
              master_size2_weight,
              master_size3_weight,
              master_size4_weight,
              master_size5_weight,
              early_variance_percent,
              mid_variance_percent,
              late_variance_percent,
              early_level_threshold,
              mid_level_threshold,
              level_cap,
              zone_id,
              active_mutator_id,
              passive_mutator_id,
              boss_id,
            ]),
          },
        ]);
      } catch (error) {
        console.error("Error executing add_custom_game_settings:", error);
        throw error;
      }
    };

    const purchase_zone_access = async ({ account, settings_id }: PurchaseMap) => {
      try {
        return await account.execute([
          {
            contractAddress: contract.address,
            entrypoint: "purchase_zone_access",
            calldata: [settings_id],
          },
        ]);
      } catch (error) {
        console.error("Error executing purchase_zone_access:", error);
        throw error;
      }
    };

    const unlock_zone_with_stars = async ({ account, settings_id }: UnlockWithStars) => {
      try {
        return await account.execute([
          {
            contractAddress: contract.address,
            entrypoint: "unlock_zone_with_stars",
            calldata: [settings_id],
          },
        ]);
      } catch (error) {
        console.error("Error executing unlock_zone_with_stars:", error);
        throw error;
      }
    };

    return {
      address: contract.address,
      add_custom_game_settings,
      purchase_zone_access,
      unlock_zone_with_stars,
    };
  }

  function daily_challenge() {
    const contract_name = "daily_challenge_system";
    const contract = config.manifest.contracts.find(
      (c: Manifest["contracts"][number]) => c.tag.includes(contract_name),
    );
    if (!contract) {
      console.warn(`Contract ${contract_name} not found in manifest - daily challenge disabled`);
      return null;
    }

    const start_daily_game = async ({ account }: StartDailyGame) => {
      try {
        return await account.execute([
          {
            contractAddress: contract.address,
            entrypoint: "start_daily_game",
            calldata: [],
          },
        ]);
      } catch (error) {
        console.error("Error executing start_daily_game:", error);
        throw error;
      }
    };

    const settle_challenge = async ({ account, challenge_id, ranked_players }: SettleChallenge) => {
      try {
        return await account.execute([
          {
            contractAddress: contract.address,
            entrypoint: "settle_challenge",
            calldata: CallData.compile([challenge_id, ranked_players]),
          },
        ]);
      } catch (error) {
        console.error("Error executing settle_challenge:", error);
        throw error;
      }
    };

    const settle_weekly_endless = async ({ account, week_id, settings_id, ranked_players }: SettleWeeklyEndless) => {
      try {
        return await account.execute([
          {
            contractAddress: contract.address,
            entrypoint: "settle_weekly_endless",
            calldata: CallData.compile([week_id, settings_id, ranked_players]),
          },
        ]);
      } catch (error) {
        console.error("Error executing settle_weekly_endless:", error);
        throw error;
      }
    };

    return {
      address: contract.address,
      start_daily_game,
      settle_challenge,
      settle_weekly_endless,
    };
  }

  function progressSystem() {
    const contract_name = "progress_system";
    const contract = config.manifest.contracts.find(
      (c: Manifest["contracts"][number]) => c.tag.includes(contract_name),
    );
    if (!contract) {
      console.warn(`Contract ${contract_name} not found in manifest - progress system disabled`);
      return null;
    }

    const questClaim = async ({ account, player, quest_id, interval_id }: QuestClaim) => {
      try {
        return await account.execute([
          {
            contractAddress: contract.address,
            entrypoint: "quest_claim",
            calldata: CallData.compile({
              player,
              quest_id,
              interval_id,
            }),
          },
        ]);
      } catch (error) {
        console.error("Error executing quest_claim:", error);
        throw error;
      }
    };

    return { address: contract.address, questClaim };
  }

  return {
    game: game(),
    story_system: storySystem(),
    config: configSystem(),
    daily_challenge: daily_challenge(),
    progress_system: progressSystem(),
  };
}

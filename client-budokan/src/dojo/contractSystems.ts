import { DojoProvider } from "@dojoengine/core";
import type { Config } from "../../dojo.config.ts";
import {
  Account,
  CairoCustomEnum,
  CairoOption,
  CairoOptionVariant,
  shortString,
  type UniversalDetails,
} from "starknet";
import type { Manifest } from "@/cartridgeConnector.tsx";

const { VITE_PUBLIC_NAMESPACE } = import.meta.env;

export const VRF_PROVIDER_ADDRESS =
  "0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f";

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

export type IWorld = Awaited<ReturnType<typeof setupWorld>>;

export async function setupWorld(provider: DojoProvider, config: Config) {
  const details: UniversalDetails | undefined = undefined;

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
        const playerNameOption =
          trimmedName.length > 0
            ? new CairoOption<string>(
                CairoOptionVariant.Some,
                shortString.encodeShortString(trimmedName)
              )
            : new CairoOption(CairoOptionVariant.None);
        const settingsOption = new CairoOption<number>(
          CairoOptionVariant.Some,
          settingsId
        );
        const noneOption = () => new CairoOption(CairoOptionVariant.None);

        return await provider.execute(
          account,
          [
            {
              contractAddress: contract.address,
              entrypoint: "mint_game",
              calldata: [
                playerNameOption,
                settingsOption,
                noneOption(), // start
                noneOption(), // end
                noneOption(), // objective_ids
                noneOption(), // context
                noneOption(), // client_url
                noneOption(), // renderer_address
                account.address,
                0, // soulbound = false
              ],
            },
          ],
          VITE_PUBLIC_NAMESPACE,
          details
        );
      } catch (error) {
        console.error("Error executing free_mint:", error);
        throw error;
      }
    };

    const create = async ({ account, token_id }: Create) => {
      try {
        console.log("token_id", token_id);
        return await provider.execute(
          account,
          [
            {
              contractAddress: VRF_PROVIDER_ADDRESS,
              entrypoint: "request_random",
              calldata: [
                contract.address,
                { type: 0, address: account.address },
              ],
            },
            {
              contractName: contract_name,
              entrypoint: "create",
              calldata: [token_id],
            },
          ],
          VITE_PUBLIC_NAMESPACE,
          details
        );
      } catch (error) {
        console.error("Error executing start:", error);
        throw error;
      }
    };

    const surrender = async ({ account, game_id }: Surrender) => {
      try {
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "surrender",
            calldata: [game_id],
          },
          VITE_PUBLIC_NAMESPACE,
          details
        );
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
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "move",
            calldata: [game_id, row_index, start_index, final_index],
          },
          VITE_PUBLIC_NAMESPACE,
          details
        );
      } catch (error) {
        console.error("Error executing move:", error);
        throw error;
      }
    };
    const getCustomEnum = (bonusIndex: number) => {
      if (bonusIndex === 1) {
        return new CairoCustomEnum({ Hammer: "()" });
      } else if (bonusIndex === 2) {
        return new CairoCustomEnum({ Totem: "()" });
      } else if (bonusIndex === 3) {
        return new CairoCustomEnum({ Wave: "()" });
      }
      return new CairoCustomEnum({ None: "()" });
    };

    const bonus = async ({
      account,
      game_id,
      bonus,
      row_index,
      block_index,
    }: BonusTx) => {
      try {
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "apply_bonus",
            calldata: [game_id, getCustomEnum(bonus), row_index, block_index],
          },
          VITE_PUBLIC_NAMESPACE,
          details
        );
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

  return {
    game: game(),
  };
}

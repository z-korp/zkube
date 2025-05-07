import { DojoProvider } from "@dojoengine/core";
import type { Config } from "../../dojo.config.ts";
import { Account, CallData, cairo } from "starknet";
import type { UniversalDetails } from "starknet";
import type { Manifest } from "@/cartridgeConnector.tsx";

const { VITE_PUBLIC_NAMESPACE } = import.meta.env;

export const VRF_PROVIDER_ADDRESS =
  "0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f";

export interface Signer {
  account: Account;
}

export interface Create extends Signer {
  token_id: bigint;
}

export interface Move extends Signer {
  row_index: number;
  start_index: number;
  final_index: number;
}

export interface Bonus extends Signer {
  bonus: number;
  row_index: number;
  block_index: number;
}

export type IWorld = Awaited<ReturnType<typeof setupWorld>>;

export async function setupWorld(provider: DojoProvider, config: Config) {
  const details: UniversalDetails | undefined = { maxFee: 1e15 };

  function game() {
    const contract_name = "game";
    const contract = config.manifest.contracts.find(
      (c: Manifest["contracts"][number]) => c.tag.includes(contract_name)
    );
    if (!contract) {
      throw new Error(`Contract ${contract_name} not found in manifest`);
    }

    const create = async ({ account, token_id }: Create) => {
      try {
        return await provider.execute(
          account,
          [
            {
              contractAddress: VRF_PROVIDER_ADDRESS,
              entrypoint: "request_random",
              calldata: CallData.compile({
                caller: contract.address,
                source: { type: 0, address: account.address },
              }),
            },

            {
              contractName: contract_name,
              entrypoint: "create",
              calldata: [cairo.uint256(token_id)],
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

    const surrender = async ({ account }: Signer) => {
      try {
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "surrender",
            calldata: [],
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
            calldata: [row_index, start_index, final_index],
          },
          VITE_PUBLIC_NAMESPACE,
          details
        );
      } catch (error) {
        console.error("Error executing move:", error);
        throw error;
      }
    };

    const bonus = async ({ account, bonus, row_index, block_index }: Bonus) => {
      try {
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "apply_bonus",
            calldata: [bonus, row_index, block_index],
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

import { DojoProvider } from "@dojoengine/core";
import { Config } from "../../dojo.config.ts";
import { Account, UniversalDetails, cairo } from "starknet";
import { Manifest } from "@/cartridgeConnector.tsx";

const { VITE_PUBLIC_NAMESPACE } = import.meta.env;

const {
  VITE_PUBLIC_GAME_TOKEN_ADDRESS,
  VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS,
} = import.meta.env;

export interface Signer {
  account: Account;
}

export interface Start extends Signer {
  token_id: bigint;
  mode: number;
  x: bigint;
  y: bigint;
  c: bigint;
  s: bigint;
  sqrt_ratio_hint: bigint;
  seed: bigint;
  beta: bigint;
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

  function play() {
    const contract_name = "play";
    const contract = config.manifest.contracts.find(
      (c: Manifest["contracts"][number]) => c.tag.includes(contract_name),
    );
    if (!contract) {
      throw new Error(`Contract ${contract_name} not found in manifest`);
    }

    const start = async ({
      account,
      token_id,
      mode,
      x,
      y,
      c,
      s,
      sqrt_ratio_hint,
      seed,
      beta,
    }: Start) => {
      const contract_name = "play";
      const contract = config.manifest.contracts.find(
        (c: Manifest["contracts"][number]) => c.tag.includes(contract_name),
      );
      if (!contract) {
        throw new Error(`Contract ${contract_name} not found in manifest`);
      }

      if (token_id === 0n) {
        // Free game
        try {
          return await provider.execute(
            account,
            [
              {
                contractName: contract_name,
                entrypoint: "create",
                calldata: [
                  cairo.uint256(token_id),
                  mode,
                  x,
                  y,
                  c,
                  s,
                  sqrt_ratio_hint,
                  seed,
                  beta,
                ],
              },
            ],
            VITE_PUBLIC_NAMESPACE,
            details,
          );
        } catch (error) {
          console.error("Error executing start:", error);
          throw error;
        }
      } else {
        // Paid game
        try {
          return await provider.execute(
            account,
            [
              /*{
                contractAddress: VITE_PUBLIC_GAME_TOKEN_ADDRESS,
                entrypoint: "approve",
                calldata: [
                  VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS,
                  cairo.uint256(price),
                ], // Set allowance
              },*/
              {
                contractAddress: VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS,
                entrypoint: "approve",
                calldata: [contract.address, cairo.uint256(token_id)], // Set allowance
              },
              {
                contractName: contract_name,
                entrypoint: "create",
                calldata: [
                  cairo.uint256(token_id),
                  mode,
                  x,
                  y,
                  c,
                  s,
                  sqrt_ratio_hint,
                  seed,
                  beta,
                ],
              },
              {
                contractAddress: VITE_PUBLIC_GAME_TOKEN_ADDRESS,
                entrypoint: "approve",
                calldata: [
                  VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS,
                  cairo.uint256(0),
                ], // Clear allowance
              },
            ],
            VITE_PUBLIC_NAMESPACE,
            details,
          );
        } catch (error) {
          console.error("Error executing start:", error);
          throw error;
        }
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
          details,
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
          details,
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
          details,
        );
      } catch (error) {
        console.error("Error executing bonus:", error);
        throw error;
      }
    };

    return {
      address: contract.address,
      start,
      surrender,
      move,
      bonus,
    };
  }

  return {
    play: play(),
  };
}

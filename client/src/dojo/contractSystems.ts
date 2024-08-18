import { DojoProvider } from "@dojoengine/core";
import { Config } from "../../dojo.config.ts";
import { Account, UniversalDetails, shortString } from "starknet";

const NAMESPACE = "zkube";

export interface Signer {
  account: Account;
}

export interface Create extends Signer {
  name: string;
}

export interface Rename extends Signer {
  name: string;
}

export interface Start extends Signer {
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

export const getContractByName = (manifest: any, name: string) => {
  const contract = manifest.contracts.find((contract: any) =>
    contract.name.includes("::" + name),
  );
  if (contract) {
    return contract.address;
  } else {
    return "";
  }
};

export async function setupWorld(provider: DojoProvider, config: Config) {
  const details: UniversalDetails | undefined = undefined; // { maxFee: 1e15 };

  function actions() {
    const contract_name = "actions";
    const contract = config.manifest.contracts.find((c: any) =>
      c.tag.includes(contract_name),
    );
    if (!contract) {
      throw new Error(`Contract ${contract_name} not found in manifest`);
    }

    const create = async ({ account, name }: Create) => {
      try {
        const encoded_name = shortString.encodeShortString(name);
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "create",
            calldata: [encoded_name],
          },
          NAMESPACE,
          details,
        );
      } catch (error) {
        console.error("Error executing create:", error);
        throw error;
      }
    };

    const rename = async ({ account, name }: Rename) => {
      try {
        const encoded_name = shortString.encodeShortString(name);
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "rename",
            calldata: [encoded_name],
          },
          NAMESPACE,
          details,
        );
      } catch (error) {
        console.error("Error executing rename:", error);
        throw error;
      }
    };

    const start = async ({
      account,
      mode,
      x,
      y,
      c,
      s,
      sqrt_ratio_hint,
      seed,
      beta,
    }: Start) => {
      try {
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "start",
            calldata: [mode, x, y, c, s, sqrt_ratio_hint, seed, beta],
          },
          NAMESPACE,
          details,
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
          NAMESPACE,
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
          NAMESPACE,
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
          NAMESPACE,
          details,
        );
      } catch (error) {
        console.error("Error executing bonus:", error);
        throw error;
      }
    };

    return {
      address: contract.address,
      create,
      rename,
      start,
      surrender,
      move,
      bonus,
    };
  }

  return {
    actions: actions(),
  };
}

import { DojoProvider } from "@dojoengine/core";
import { Config } from "../../dojo.config.ts";
import { Account, UniversalDetails, cairo, shortString } from "starknet";
import { Manifest } from "@/cartridgeConnector.tsx";

const NAMESPACE = "zkube";

const { VITE_PUBLIC_GAME_TOKEN_ADDRESS } = import.meta.env;

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
  price: bigint;
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

export interface ChestSponsor extends Signer {
  chest_id: number;
  amount: bigint;
}

export interface ChestClaim extends Signer {
  chest_id: number;
}

export interface UpdateDailyModePrice extends Signer {
  value: bigint;
}

export interface UpdateNormalModePrice extends Signer {
  value: bigint;
}

export interface SetAdmin extends Signer {
  address: bigint;
}

export interface DeleteAdmin extends Signer {
  address: bigint;
}

export interface TournamentClaim extends Signer {
  mode: number;
  tournament_id: number;
  rank: number;
}

export interface AddFreeMint extends Signer {
  to: string;
  amount: number;
  expiration_timestamp: number;
}

export interface AddFreeMintSimple {
  to: string;
  amount: number;
  expiration_timestamp: number;
}
export interface AddFreeMintBatch extends Signer {
  freeMints: AddFreeMintSimple[];
}

export type IWorld = Awaited<ReturnType<typeof setupWorld>>;

export async function setupWorld(provider: DojoProvider, config: Config) {
  const details: UniversalDetails | undefined = { maxFee: 1e15 };

  function account() {
    const contract_name = "account";
    const contract = config.manifest.contracts.find(
      (contract: Manifest["contracts"][number]) =>
        contract.tag.includes(contract_name),
    );
    if (!contract) {
      throw new Error(`Contract ${contract_name} not found in manifest`);
    }

    const create = async ({ account, name }: Create) => {
      console.log("contract", contract);
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

    return {
      address: contract.address,
      create,
      rename,
    };
  }

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
      mode,
      price,
      x,
      y,
      c,
      s,
      sqrt_ratio_hint,
      seed,
      beta,
    }: Start) => {
      const contract_name_chest = "chest";
      const contract_chest = config.manifest.contracts.find(
        (c: Manifest["contracts"][number]) =>
          c.tag.includes(contract_name_chest),
      );
      if (!contract_chest) {
        throw new Error(
          `Contract ${contract_name_chest} not found in manifest`,
        );
      }
      const contract_name_tournament = "tournament";
      const contract_tournament = config.manifest.contracts.find(
        (c: Manifest["contracts"][number]) =>
          c.tag.includes(contract_name_tournament),
      );
      if (!contract_tournament) {
        throw new Error(
          `Contract ${contract_name_tournament} not found in manifest`,
        );
      }

      const contract_name_zkorp = "zkorp";
      const contract_zkorp = config.manifest.contracts.find(
        (c: Manifest["contracts"][number]) =>
          c.tag.includes(contract_name_zkorp),
      );
      if (!contract_zkorp) {
        throw new Error(
          `Contract ${contract_name_zkorp} not found in manifest`,
        );
      }

      try {
        return await provider.execute(
          account,
          [
            {
              contractAddress: VITE_PUBLIC_GAME_TOKEN_ADDRESS,
              entrypoint: "approve",
              calldata: [contract_zkorp.address, cairo.uint256(price)], // Set allowance
            },
            {
              contractAddress: VITE_PUBLIC_GAME_TOKEN_ADDRESS,
              entrypoint: "approve",
              calldata: [contract_chest.address, cairo.uint256(price)], // Set allowance
            },
            {
              contractAddress: VITE_PUBLIC_GAME_TOKEN_ADDRESS,
              entrypoint: "approve",
              calldata: [contract_tournament.address, cairo.uint256(price)], // Set allowance
            },
            {
              contractName: contract_name,
              entrypoint: "create",
              calldata: [mode, x, y, c, s, sqrt_ratio_hint, seed, beta],
            },
            {
              contractAddress: VITE_PUBLIC_GAME_TOKEN_ADDRESS,
              entrypoint: "approve",
              calldata: [contract_zkorp.address, cairo.uint256(0)], // Clear allowance
            },
            {
              contractAddress: VITE_PUBLIC_GAME_TOKEN_ADDRESS,
              entrypoint: "approve",
              calldata: [contract_chest.address, cairo.uint256(0)], // Clear allowance
            },
            {
              contractAddress: VITE_PUBLIC_GAME_TOKEN_ADDRESS,
              entrypoint: "approve",
              calldata: [contract_tournament.address, cairo.uint256(0)], // Clear allowance
            },
          ],
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
      start,
      surrender,
      move,
      bonus,
    };
  }

  function chest() {
    const contract_name = "chest";
    const contract = config.manifest.contracts.find(
      (c: Manifest["contracts"][number]) => c.tag.includes(contract_name),
    );
    if (!contract) {
      throw new Error(`Contract ${contract_name} not found in manifest`);
    }

    const claim = async ({ account, chest_id }: ChestClaim) => {
      try {
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "claim",
            calldata: [chest_id],
          },
          NAMESPACE,
          details,
        );
      } catch (error) {
        console.error("Error executing claim:", error);
        throw error;
      }
    };

    const sponsor = async ({ account, chest_id, amount }: ChestSponsor) => {
      try {
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "sponsor",
            calldata: [chest_id, amount],
          },
          NAMESPACE,
          details,
        );
      } catch (error) {
        console.error("Error executing sponsor:", error);
        throw error;
      }
    };

    return {
      address: contract.address,
      claim,
      sponsor,
    };
  }

  function settings() {
    const contract_name = "settings";
    const contract = config.manifest.contracts.find(
      (c: Manifest["contracts"][number]) => c.tag.includes(contract_name),
    );
    if (!contract) {
      throw new Error(`Contract ${contract_name} not found in manifest`);
    }

    const update_zkorp_address = async ({
      account,
      value,
    }: UpdateDailyModePrice) => {
      try {
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "update_zkorp_address",
            calldata: [value],
          },
          NAMESPACE,
          details,
        );
      } catch (error) {
        console.error("Error executing update_zkorp_address:", error);
        throw error;
      }
    };

    const update_erc721_address = async ({
      account,
      value,
    }: UpdateNormalModePrice) => {
      try {
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "update_erc721_address",
            calldata: [value],
          },
          NAMESPACE,
          details,
        );
      } catch (error) {
        console.error("Error executing update_erc721_address:", error);
        throw error;
      }
    };

    const set_admin = async ({ account, address }: SetAdmin) => {
      try {
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "set_admin",
            calldata: [address],
          },
          NAMESPACE,
          details,
        );
      } catch (error) {
        console.error("Error executing set_admin:", error);
        throw error;
      }
    };

    const delete_admin = async ({ account, address }: DeleteAdmin) => {
      try {
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "delete_admin",
            calldata: [address],
          },
          NAMESPACE,
          details,
        );
      } catch (error) {
        console.error("Error executing delete_admin:", error);
        throw error;
      }
    };

    return {
      address: contract.address,
      update_zkorp_address,
      update_erc721_address,
      set_admin,
      delete_admin,
    };
  }

  function tournament() {
    const contract_name = "tournament";
    const contract = config.manifest.contracts.find(
      (c: Manifest["contracts"][number]) => c.tag.includes(contract_name),
    );
    if (!contract) {
      throw new Error(`Contract ${contract_name} not found in manifest`);
    }

    const claim = async ({
      account,
      mode,
      tournament_id,
      rank,
    }: TournamentClaim) => {
      try {
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "claim",
            calldata: [mode, tournament_id, rank],
          },
          NAMESPACE,
          details,
        );
      } catch (error) {
        console.error("Error executing claim:", error);
        throw error;
      }
    };

    return {
      address: contract.address,
      claim,
    };
  }

  function minter() {
    const contract_name = "minter";
    const contract = config.manifest.contracts.find(
      (c: Manifest["contracts"][number]) => c.tag.includes(contract_name),
    );
    if (!contract) {
      throw new Error(`Contract ${contract_name} not found in manifest`);
    }

    const add_free_mint = async ({
      account,
      to,
      amount,
      expiration_timestamp,
    }: AddFreeMint) => {
      try {
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "add_free_mint",
            calldata: [to, amount, expiration_timestamp],
          },
          NAMESPACE,
          details,
        );
      } catch (error) {
        console.error("Error executing claim:", error);
        throw error;
      }
    };

    const claim_free_mint = async ({ account }: Signer) => {
      try {
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "claim_free_mint",
            calldata: [],
          },
          NAMESPACE,
          details,
        );
      } catch (error) {
        console.error("Error executing claim:", error);
        throw error;
      }
    };

    return {
      address: contract.address,
      add_free_mint,
      claim_free_mint,
    };
  }

  return {
    account: account(),
    play: play(),
    chest: chest(),
    tournament: tournament(),
    settings: settings(),
    minter: minter(),
  };
}

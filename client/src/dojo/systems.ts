import type { IWorld } from "./contractSystems";
import { toast } from "sonner";
import * as SystemTypes from "./contractSystems";
import { shortenHex } from "@dojoengine/utils";
import { Account } from "starknet";
import {
  getToastPlacement,
  getUrl,
  getWalnutUrl,
  shouldShowToast,
  getToastAction,
  notify,
} from "@/utils/toast";

export type SystemCalls = ReturnType<typeof systems>;

export function systems({ client }: { client: IWorld }) {
  const toastPlacement = getToastPlacement();

  const handleTransaction = async (
    account: Account,
    action: () => Promise<{ transaction_hash: string }>,
    successMessage: string,
  ) => {
    try {
      // Initiate the transaction and obtain the transaction_hash
      const { transaction_hash } = await action();
      console.log(
        "transaction_hash",
        transaction_hash,
        getUrl(transaction_hash),
        getWalnutUrl(transaction_hash),
      );

      const toastId = transaction_hash; // Unique ID based on transaction_hash

      if (shouldShowToast()) {
        // Display a loading toast with the unique toastId
        toast.loading("Transaction in progress...", {
          description: shortenHex(transaction_hash),
          action: getToastAction(transaction_hash),
          id: toastId, // Assign the unique toastId
          position: toastPlacement,
        });
      }

      // Wait for the transaction to complete
      const transaction = await account.waitForTransaction(transaction_hash, {
        retryInterval: 200,
      });

      // Notify success or error using the same toastId
      notify(successMessage, transaction);
    } catch (error) {
      console.error("Error executing transaction:", error);

      if (shouldShowToast()) {
        toast.error("Transaction failed.", {
          id: `error-${Date.now()}`, // Generic toast ID
          position: toastPlacement,
        });
      }

      throw error;
    }
  };

  const create = async ({ account, ...props }: SystemTypes.Create) => {
    await handleTransaction(
      account,
      () => client.account.create({ account, ...props }),
      "Player has been created.",
    );
  };

  const rename = async ({ account, ...props }: SystemTypes.Rename) => {
    await handleTransaction(
      account,
      () => client.account.rename({ account, ...props }),
      "Player has been renamed.",
    );
  };

  const start = async ({ account, ...props }: SystemTypes.Start) => {
    await handleTransaction(
      account,
      () => client.play.start({ account, ...props }),
      "Game has been started.",
    );
  };

  const surrender = async ({ account, ...props }: SystemTypes.Signer) => {
    await handleTransaction(
      account,
      () => client.play.surrender({ account, ...props }),
      "Game has been surrendered.",
    );
  };

  const move = async ({ account, ...props }: SystemTypes.Move) => {
    console.log("move", account, props);
    await handleTransaction(
      account,
      () => client.play.move({ account, ...props }),
      "Move has been done.",
    );
  };

  const applyBonus = async ({ account, ...props }: SystemTypes.Bonus) => {
    await handleTransaction(
      account,
      () => client.play.bonus({ account, ...props }),
      "Bonus has been applied.",
    );
  };

  const claimChest = async ({ account, ...props }: SystemTypes.ChestClaim) => {
    await handleTransaction(
      account,
      () => client.chest.claim({ account, ...props }),
      "Chest rewards have been claimed.",
    );
  };

  const claimTournament = async ({
    account,
    ...props
  }: SystemTypes.TournamentClaim) => {
    await handleTransaction(
      account,
      () => client.tournament.claim({ account, ...props }),
      "Tournament rewards have been claimed.",
    );
  };

  const claimFreeMint = async ({ account, ...props }: SystemTypes.Signer) => {
    await handleTransaction(
      account,
      () => client.minter.claim_free_mint({ account, ...props }),
      "Games have been claimed.",
    );
  };

  return {
    // account
    create,
    rename,
    // play
    start,
    surrender,
    move,
    applyBonus,
    // chest
    claimChest,
    // tournament
    claimTournament,
    // airdrops
    claimFreeMint,
  };
}

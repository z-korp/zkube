import type { IWorld } from "./contractSystems";
import { toast } from "sonner";
import * as SystemTypes from "./contractSystems";
import { shortenHex } from "@dojoengine/utils";
import { Account, GetTransactionReceiptResponse } from "starknet";

export type SystemCalls = ReturnType<typeof systems>;

const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;

export function systems({ client }: { client: IWorld }) {
  // Function to extract error messages from a given string
  function extractErrorMessages(errorString: string) {
    const regex = /Error message:(.*?)(?=\n|$)/gs;
    const matches = errorString.match(regex);

    if (matches) {
      return matches.map((match) => match.replace("Error message:", "").trim());
    } else {
      return [errorString.trim()]; // Return the entire message if no specific pattern found
    }
  }

  const extractedMessage = (message: string) => {
    const errorMessages = extractErrorMessages(message);

    return errorMessages.length > 0 ? errorMessages[0] : message;
  };

  const isMdOrLarger = (): boolean => {
    return window.matchMedia("(min-width: 768px)").matches;
  };

  const shouldShowToast = (): boolean => {
    return isMdOrLarger();
  };

  const isSmallHeight = (): boolean => {
    return window.matchMedia("(max-height: 768px)").matches;
  };

  const getUrl = (transaction_hash: string) => {
    if (
      VITE_PUBLIC_DEPLOY_TYPE === "sepolia" ||
      VITE_PUBLIC_DEPLOY_TYPE === "sepoliadev1" ||
      VITE_PUBLIC_DEPLOY_TYPE === "sepoliadev2"
    ) {
      return `https://sepolia.starkscan.co/tx/${transaction_hash}`;
    } else {
      return `https://worlds.dev/networks/slot/worlds/zkube-${VITE_PUBLIC_DEPLOY_TYPE}/txs/${transaction_hash}`;
    }
  };

  const getWalnutUrl = (transaction_hash: string) => {
    return `https://app.walnut.dev/transactions?rpcUrl=https%3A%2F%2Fapi.cartridge.gg%2Fx%2Fstarknet%2Fsepolia&txHash=${transaction_hash}`;
  };

  const getToastAction = (transaction_hash: string) => {
    return {
      label: "View",
      onClick: () => window.open(getUrl(transaction_hash), "_blank"),
    };
  };

  const getToastPlacement = ():
    | "top-center"
    | "bottom-center"
    | "bottom-right" => {
    if (!isMdOrLarger()) {
      // if mobile
      return isSmallHeight() ? "top-center" : "bottom-right";
    }
    return "bottom-right";
  };

  const toastPlacement = getToastPlacement();

  const notify = (message: string, transaction: any) => {
    const toastId = transaction.transaction_hash;

    if (transaction.execution_status !== "REVERTED") {
      if (!shouldShowToast()) return; // Exit if screen is smaller than medium
      toast.success(message, {
        id: toastId, // Use the transaction_hash as the unique toast ID
        description: shortenHex(transaction.transaction_hash),
        action: getToastAction(transaction.transaction_hash),
        position: toastPlacement,
      });
    } else {
      toast.error(extractedMessage(transaction.revert_reason), {
        id: toastId, // Use the same transaction_hash ID for error
        position: toastPlacement,
      });
    }
  };

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
        retryInterval: 50,
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
      "Player has been moved.",
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

import type { IWorld } from "./contractSystems";
import { toast } from "sonner";
import * as SystemTypes from "./contractSystems";
import { shortenHex } from "@dojoengine/utils";
import { Account, type TransactionReceipt } from "starknet";
import {
  getToastPlacement,
  getUrl,
  getWalnutUrl,
  shouldShowToast,
  getToastAction,
  notify,
} from "@/utils/toast";
import { useMoveStore } from "@/stores/moveTxStore";
import { createLogger } from "@/utils/logger";

export type SystemCalls = ReturnType<typeof systems>;

// Helper to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Maximum retries for pre-confirmed transaction waiting
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 500;
const POLL_INTERVAL_MS = 275;

export function systems({ client }: { client: IWorld }) {
  const toastPlacement = getToastPlacement();
  const log = createLogger("dojo/systems");

  /**
   * Wait for a transaction to reach PRE_CONFIRMED status (or better).
   * Uses Starknet's new pre-confirmation feature for faster feedback.
   * Retries on failure with exponential backoff.
   */
  const waitForPreConfirmedTransaction = async (
    account: Account,
    txHash: string,
    retries = 0
  ): Promise<TransactionReceipt & { events: any[] }> => {
    if (retries > MAX_RETRIES) {
      throw new Error("Transaction confirmation timed out after max retries");
    }

    try {
      const receipt = (await account.waitForTransaction(txHash, {
        retryInterval: POLL_INTERVAL_MS,
        successStates: ["PRE_CONFIRMED", "ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
      })) as TransactionReceipt & { events: any[] };

      return receipt;
    } catch (error) {
      log.warn(`Pre-confirm wait failed (attempt ${retries + 1}/${MAX_RETRIES + 1})`, error);
      await delay(RETRY_DELAY_MS);
      return waitForPreConfirmedTransaction(account, txHash, retries + 1);
    }
  };

  const handleTransaction = async (
    account: Account,
    action: () => Promise<{ transaction_hash: string }>,
    successMessage: string
  ): Promise<{ transaction_hash: string; events: any[] }> => {
    // Generate a unique ID for this transaction attempt
    const toastId = `tx-${Date.now()}`;

    try {
      if (shouldShowToast()) {
        // Show initial loading toast before transaction
        toast.loading("Transaction in progress...", {
          id: toastId,
          position: toastPlacement,
        });
      }

      // Execute the transaction
      const { transaction_hash } = await action();
      log.debug("Transaction submitted", {
        transaction_hash,
        url: getUrl(transaction_hash),
        walnutUrl: getWalnutUrl(transaction_hash),
      });

      if (shouldShowToast()) {
        // Update the same toast with transaction hash
        toast.loading("Transaction in progress...", {
          description: shortenHex(transaction_hash),
          action: getToastAction(transaction_hash),
          id: toastId,
          position: toastPlacement,
        });
      }

      // Wait for pre-confirmed status (faster than full L2 confirmation)
      const receipt = await waitForPreConfirmedTransaction(
        account,
        transaction_hash
      );
      const events = receipt.events;

      // Check if transaction was reverted
      if ((receipt as any).execution_status === "REVERTED") {
        log.error("Transaction reverted", receipt);
        if (shouldShowToast()) {
          toast.error("Transaction reverted.", {
            id: toastId,
            position: toastPlacement,
          });
        }
        throw new Error("Transaction reverted");
      }

      // Notify success using same toastId
      notify(successMessage, receipt, toastId);
      return { transaction_hash, events };
    } catch (error) {
      log.error("Error executing transaction", error);

      if (shouldShowToast()) {
        // Don't override if we already showed a revert error
        const errorMessage =
          error instanceof Error && error.message === "Transaction reverted"
            ? "Transaction reverted."
            : "Transaction failed.";
        toast.error(errorMessage, {
          id: toastId,
          position: toastPlacement,
        });
      }

      throw error;
    }
  };

  const freeMint = async ({
    account,
    settingsId,
    ...props
  }: SystemTypes.FreeMint): Promise<{ game_id: number }> => {
    const { transaction_hash, events } = await handleTransaction(
      account,
      () => client.game.free_mint({ account, ...props, settingsId }),
      "Game has been minted."
    );
    log.info("freeMint transaction", { transaction_hash });

    // Try to extract token_id from Transfer event (ERC721)
    // Transfer event has 5 keys: [selector, from, to, token_id_low, token_id_high]
    const transferEvent = events.find(
      (event: any) => event.keys?.length === 5 && event.data?.length === 0
    );

    let game_id = 0;
    if (transferEvent) {
      // token_id is in keys[3] (low) and keys[4] (high) for u256
      const tokenIdLow = BigInt(transferEvent.keys[3] || "0");
      const tokenIdHigh = BigInt(transferEvent.keys[4] || "0");
      game_id = Number(tokenIdLow + (tokenIdHigh << 128n));
      log.info("freeMint game_id extracted from transfer", { game_id });
    } else {
      // Fallback: try TokenMetadata event with data.length === 11
      const tokenMetadataEvent = events.find(
        (event: any) => event.data.length === 11
      );
      if (tokenMetadataEvent) {
        game_id = parseInt(tokenMetadataEvent.data[1], 16);
        log.info("freeMint game_id extracted from fallback metadata", { game_id });
      } else {
        log.warn("Could not find Transfer or TokenMetadata event for freeMint");
      }
    }

    return { game_id };
  };

  const create = async ({ account, ...props }: SystemTypes.Create) => {
    log.debug("create params", {
      token_id: props.token_id,
      selected_bonuses: props.selected_bonuses,
      cubes_amount: props.cubes_amount,
    });
    await handleTransaction(
      account,
      () => client.game.create({ account, ...props }),
      "Game has been started."
    );
    log.info("create success");
  };

  const surrender = async ({ account, ...props }: SystemTypes.Surrender) => {
    await handleTransaction(
      account,
      () => client.game.surrender({ account, ...props }),
      "Game has been surrendered."
    );
  };

  const move = async ({ account, ...props }: SystemTypes.Move) => {
    log.debug("move", { account: account.address, ...props });
    const setMoveComplete = useMoveStore.getState().setMoveComplete; //  Zustand
    setMoveComplete(false); // Reset before transaction

    try {
      await handleTransaction(
        account,
        () => client.game.move({ account, ...props }),
        "Move has been done."
      );
      setMoveComplete(true);
    } catch (error) {
      setMoveComplete(true);
      throw error;
    }
  };

  const applyBonus = async ({ account, ...props }: SystemTypes.BonusTx) => {
    const setMoveComplete = useMoveStore.getState().setMoveComplete; //  Zustand
    setMoveComplete(false); // Reset before transaction
    try {
      await handleTransaction(
        account,
        () => client.game.bonus({ account, ...props }),
        "Bonus has been applied."
      );
      setMoveComplete(true);
    } catch (error) {
      setMoveComplete(true);
      throw error;
    }
  };

  const upgradeStartingBonus = async ({ account, ...props }: SystemTypes.ShopUpgrade) => {
    await handleTransaction(
      account,
      () => client.shop.upgrade_starting_bonus({ account, ...props }),
      "Starting bonus upgraded!"
    );
  };

  const upgradeBagSize = async ({ account, ...props }: SystemTypes.ShopUpgrade) => {
    await handleTransaction(
      account,
      () => client.shop.upgrade_bag_size({ account, ...props }),
      "Bag size upgraded!"
    );
  };

  const upgradeBridgingRank = async ({ account }: SystemTypes.Signer) => {
    await handleTransaction(
      account,
      () => client.shop.upgrade_bridging_rank({ account }),
      "Bridging rank upgraded!"
    );
  };

  const unlockBonus = async ({ account, ...props }: SystemTypes.UnlockBonus) => {
    await handleTransaction(
      account,
      () => client.shop.unlock_bonus({ account, ...props }),
      "Bonus unlocked!"
    );
  };

  const purchaseConsumable = async ({ account, ...props }: SystemTypes.PurchaseConsumable) => {
    const setMoveComplete = useMoveStore.getState().setMoveComplete;
    setMoveComplete(false);
    try {
      await handleTransaction(
        account,
        () => client.shop.purchase_consumable({ account, ...props }),
        "Consumable purchased!"
      );
      setMoveComplete(true);
    } catch (error) {
      setMoveComplete(true);
      throw error;
    }
  };

  const levelUpBonus = async ({ account, ...props }: SystemTypes.LevelUpBonus) => {
    await handleTransaction(
      account,
      () => client.shop.level_up_bonus({ account, ...props }),
      "Bonus leveled up!"
    );
  };

  const claimQuest = async ({ account, ...props }: SystemTypes.ClaimQuest) => {
    if (!client.quest) {
      throw new Error("Quest system not available");
    }
    await handleTransaction(
      account,
      () => client.quest!.claim({ account, ...props }),
      "Quest reward claimed!"
    );
  };

  return {
    // play
    freeMint,
    create,
    surrender,
    move,
    applyBonus,
    // in-game shop
    purchaseConsumable,
    levelUpBonus,
    // permanent shop
    upgradeStartingBonus,
    upgradeBagSize,
    upgradeBridgingRank,
    unlockBonus,
    // quests
    claimQuest,
  };
}

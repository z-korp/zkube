/* eslint-disable @typescript-eslint/no-explicit-any */
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

export type SystemCalls = ReturnType<typeof systems>;

export function systems({ client }: { client: IWorld }) {
  const toastPlacement = getToastPlacement();

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
      console.log(
        "transaction_hash",
        transaction_hash,
        getUrl(transaction_hash),
        getWalnutUrl(transaction_hash)
      );

      if (shouldShowToast()) {
        // Update the same toast with transaction hash
        toast.loading("Transaction in progress...", {
          description: shortenHex(transaction_hash),
          action: getToastAction(transaction_hash),
          id: toastId,
          position: toastPlacement,
        });
      }

      // Wait for completion
      const receipt = (await account.waitForTransaction(transaction_hash, {
        retryInterval: 200,
      })) as TransactionReceipt & { events: any[] };
      const events = receipt.events;
      console.log("events", receipt.events);
      console.log("1) transaction", receipt);

      // Notify success using same toastId
      notify(successMessage, receipt, toastId);
      return { transaction_hash, events };
    } catch (error) {
      console.error("Error executing transaction:", error);

      if (shouldShowToast()) {
        toast.error("Transaction failed.", {
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
    console.info(
      "[freeMint] Transaction hash",
      transaction_hash,
      getUrl(transaction_hash)
    );

    // Log all events with full details for debugging
    console.log("=== FULL EVENT DATA ===");
    events.forEach((event: any, index: number) => {
      console.log(`Event ${index}:`, {
        from_address: event.from_address,
        keys: event.keys,
        data: event.data,
        keys_length: event.keys?.length,
        data_length: event.data?.length,
      });
    });
    console.log("=== END EVENT DATA ===");

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
      console.log("Extracted token_id from Transfer event:", game_id, {
        low: transferEvent.keys[3],
        high: transferEvent.keys[4],
      });
    } else {
      // Fallback: try TokenMetadata event with data.length === 11
      const tokenMetadataEvent = events.find(
        (event: any) => event.data.length === 11
      );
      if (tokenMetadataEvent) {
        game_id = parseInt(tokenMetadataEvent.data[1], 16);
        console.log("Fallback: extracted game_id from TokenMetadata:", game_id);
      } else {
        console.warn("Could not find Transfer or TokenMetadata event");
      }
    }

    console.log("game_id", game_id);

    return { game_id };
  };

  const create = async ({ account, ...props }: SystemTypes.Create) => {
    await handleTransaction(
      account,
      () => client.game.create({ account, ...props }),
      "Game has been started."
    );
  };

  const createWithCubes = async ({ account, ...props }: SystemTypes.CreateWithCubes) => {
    await handleTransaction(
      account,
      () => client.game.create_with_cubes({ account, ...props }),
      "Game started with cubes!"
    );
  };

  const surrender = async ({ account, ...props }: SystemTypes.Surrender) => {
    await handleTransaction(
      account,
      () => client.game.surrender({ account, ...props }),
      "Game has been surrendered."
    );
  };

  const move = async ({ account, ...props }: SystemTypes.Move) => {
    console.log("move", account, props);
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
    createWithCubes,
    surrender,
    move,
    applyBonus,
    // in-game shop
    purchaseConsumable,
    // permanent shop
    upgradeStartingBonus,
    upgradeBagSize,
    upgradeBridgingRank,
    // quests
    claimQuest,
  };
}

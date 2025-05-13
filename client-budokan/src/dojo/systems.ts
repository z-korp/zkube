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
import { dojoConfig } from "../../dojo.config";

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

  const translateName = (selector: string) => {
    const model = dojoConfig().manifest.models.find(
      (model: any) => model.selector === selector
    );
    return model?.tag?.split("-")[1];
  };

  const translateEvent = (event: any) => {
    const name = translateName(event.keys[1]);
    const data = event.data;
    return { name, data };
  };

  const freeMint = async ({
    account,
    ...props
  }: SystemTypes.FreeMint): Promise<{ game_id: number }> => {
    const { events } = await handleTransaction(
      account,
      () => client.game.free_mint({ account, ...props }),
      "Game has been minted."
    );

    let game_id = 0;
    events.forEach((event) => {
      const { name, data } = translateEvent(event);
      if (name == "TokenMetadata") {
        game_id = parseInt(data[1], 16);
      }
    });

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

  const applyBonus = async ({ account, ...props }: SystemTypes.Bonus) => {
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

  return {
    // play
    freeMint,
    create,
    surrender,
    move,
    applyBonus,
  };
}

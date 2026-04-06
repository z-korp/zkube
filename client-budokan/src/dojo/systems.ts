/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IWorld } from "./contractSystems";
import * as SystemTypes from "./contractSystems";
import { Account, type TransactionReceipt, uint256, type Uint256 } from "starknet";
import {
  getUrl,
  getWalnutUrl,
  shouldShowToast,
  notify,
  showToast,
  deriveUserFacingErrorMessage,
} from "@/utils/toast";
import { useMoveStore } from "@/stores/moveTxStore";
import { createLogger } from "@/utils/logger";

export type SystemCalls = ReturnType<typeof systems>;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const SESSION_ERROR_PATTERNS = [
  "session/deserialize-error",
  "session/not-registered",
  "contract not found",
  "73657373696f6e2f646573657269616c697a652d6572726f72",
  "73657373696f6e2f6e6f742d726567697374657265",
];

function isSessionError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error);
  const lower = message.toLowerCase();
  return SESSION_ERROR_PATTERNS.some((p) => lower.includes(p));
}

function clearSessionAndReload() {
  localStorage.removeItem("sessionSigner");
  localStorage.removeItem("session");
  localStorage.removeItem("sessionPolicies");
  localStorage.removeItem("lastUsedConnector");
  localStorage.removeItem("controllerSessionVersion");
  window.location.reload();
}

const normalizeHex = (value: unknown): string => {
  if (typeof value !== "string") return "";
  const withPrefix = value.startsWith("0x") ? value : `0x${value}`;
  const stripped = withPrefix.slice(2).replace(/^0+/, "") || "0";
  return `0x${stripped}`.toLowerCase();
};

const parseBigIntSafe = (value: unknown): bigint => {
  if (typeof value !== "string") return 0n;
  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
};

const extractStoryGameIdFromEvents = (
  events: any[],
  storySystemAddress: string,
  playerAddress?: string,
): bigint => {
  const storyAddress = normalizeHex(storySystemAddress);
  const player = normalizeHex(playerAddress);

  for (const event of events) {
    const keys: unknown[] = event?.keys ?? [];
    const data: unknown[] = event?.data ?? [];

    const fromStory = keys.some((key) => normalizeHex(String(key)) === storyAddress);
    if (!fromStory) continue;
    if (data.length !== 5) continue;

    const gameId = parseBigIntSafe(String(data[data.length - 1]));
    if (gameId <= 0n) continue;

    if (!player || data.some((item) => normalizeHex(String(item)) === player)) {
      return gameId;
    }
  }

  for (const event of events) {
    const keys: unknown[] = event?.keys ?? [];
    const data: unknown[] = event?.data ?? [];

    const fromStory = keys.some((key) => normalizeHex(String(key)) === storyAddress);
    if (!fromStory) continue;
    if (data.length < 3) continue;

    const gameId = parseBigIntSafe(String(data[1]));
    if (gameId <= 0n) continue;

    if (!player || data.some((item) => normalizeHex(String(item)) === player)) {
      return gameId;
    }
  }

  return 0n;
};

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 500;
const POLL_INTERVAL_MS = 275;

export function systems({ client }: { client: IWorld }) {
  const log = createLogger("dojo/systems");

  const waitForPreConfirmedTransaction = async (
    account: Account,
    txHash: string,
    retries = 0,
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
      log.warn(
        `Pre-confirm wait failed (attempt ${retries + 1}/${MAX_RETRIES + 1})`,
        error,
      );
      await delay(RETRY_DELAY_MS);
      return waitForPreConfirmedTransaction(account, txHash, retries + 1);
    }
  };

  const handleTransaction = async (
    account: Account,
    action: () => Promise<{ transaction_hash: string }>,
    successMessage: string,
  ): Promise<{ transaction_hash: string; events: any[] }> => {
    const toastId = `tx-${Date.now()}`;

    try {
      if (shouldShowToast()) {
        showToast({
          message: "Transaction in progress...",
          type: "loading",
          toastId,
        });
      }

      const { transaction_hash } = await action();
      log.debug("Transaction submitted", {
        transaction_hash,
        url: getUrl(transaction_hash),
        walnutUrl: getWalnutUrl(transaction_hash),
      });

      if (shouldShowToast()) {
        showToast({
          message: "Transaction in progress...",
          txHash: transaction_hash,
          type: "loading",
          toastId,
        });
      }

      const receipt = await waitForPreConfirmedTransaction(
        account,
        transaction_hash,
      );
      const events = receipt.events;

      if ((receipt as any).execution_status === "REVERTED") {
        const revertReason = (receipt as any).revert_reason ?? "";
        if (isSessionError(revertReason)) {
          log.warn(
            "Transaction reverted with session error, clearing and reloading",
          );
          showToast({
            message: "Session expired. Reconnecting...",
            type: "loading",
            toastId,
            durationMs: 3000,
          });
          clearSessionAndReload();
          return { transaction_hash, events: [] };
        }

        log.error("Transaction reverted", receipt);
        if (shouldShowToast()) {
          showToast({
            message: "Transaction reverted.",
            type: "error",
            toastId,
          });
        }
        throw new Error("Transaction reverted");
      }

      notify(successMessage, receipt, toastId);
      return { transaction_hash, events };
    } catch (error) {
      log.error("Error executing transaction", error);

      if (isSessionError(error)) {
        log.warn("Stale session detected, clearing and reloading");
        showToast({
          message: "Session expired. Reconnecting...",
          type: "loading",
          toastId,
          durationMs: 3000,
        });
        clearSessionAndReload();
        return { transaction_hash: "", events: [] };
      }

      if (shouldShowToast()) {
        const errorMessage =
          error instanceof Error && error.message === "Transaction reverted"
            ? "Transaction reverted."
            : deriveUserFacingErrorMessage(error, "Transaction failed.");
        showToast({ message: errorMessage, type: "error", toastId });
      }

      throw error;
    }
  };

  const freeMint = async ({
    account,
    settingsId,
    ...props
  }: SystemTypes.FreeMint): Promise<{ game_id: bigint }> => {
    const { transaction_hash, events } = await handleTransaction(
      account,
      () => client.game.free_mint({ account, ...props, settingsId }),
      "Game has been minted.",
    );
    log.info("freeMint transaction", { transaction_hash });

    const transferEvent = events.find(
      (event: any) => event.keys?.length === 5 && event.data?.length === 0,
    );

    let game_id = 0n;
    if (transferEvent) {
      const tokenIdLow = BigInt(transferEvent.keys[3] || "0");
      const tokenIdHigh = BigInt(transferEvent.keys[4] || "0");
      const uint256Value: Uint256 = { low: tokenIdLow, high: tokenIdHigh };
      game_id = uint256.uint256ToBN(uint256Value);
      log.info("freeMint game_id extracted from transfer", { game_id });
    } else {
      const tokenMetadataEvent = events.find(
        (event: any) => event.data.length === 11,
      );
      if (tokenMetadataEvent) {
        game_id = BigInt(tokenMetadataEvent.data[1]);
        log.info("freeMint game_id extracted from fallback metadata", {
          game_id,
        });
      } else {
        log.warn("Could not find Transfer or TokenMetadata event for freeMint");
      }
    }

    return { game_id };
  };

  const create = async ({ account, ...props }: SystemTypes.Create) => {
    log.debug("create params", {
      token_id: props.token_id,
      mode: props.mode,
    });
    await handleTransaction(
      account,
      () => client.game.create({ account, ...props }),
      "Game has been started.",
    );
    log.info("create success");
  };

  const createRun = async ({ account, ...props }: SystemTypes.CreateRun) => {
    log.debug("createRun params", {
      game_id: props.game_id,
      mode: props.mode,
    });
    await handleTransaction(
      account,
      () => client.game.createRun({ account, ...props }),
      "Run has been created.",
    );
    log.info("createRun success");
  };

  const startRun = async ({ account, ...props }: SystemTypes.StartRun): Promise<{ game_id: bigint }> => {
    if (!client.story_system) throw new Error("Story system not available");
    const { events } = await handleTransaction(account, () => client.story_system!.startRun({ account, ...props }), "Story run started.");
    const gameId = extractStoryGameIdFromEvents(events, client.story_system.address, account.address);
    return { game_id: gameId };
  };

  const replayLevel = async ({ account, ...props }: SystemTypes.ReplayLevel): Promise<{ game_id: bigint }> => {
    if (!client.story_system) throw new Error("Story system not available");
    const { events } = await handleTransaction(account, () => client.story_system!.replayLevel({ account, ...props }), "Story level replayed.");
    const gameId = extractStoryGameIdFromEvents(events, client.story_system.address, account.address);
    return { game_id: gameId };
  };

  const claimPerfection = async ({ account, ...props }: SystemTypes.ClaimPerfection) => {
    if (!client.story_system) throw new Error("Story system not available");
    await handleTransaction(account, () => client.story_system!.claimPerfection({ account, ...props }), "Perfection claimed.");
  };

  const surrender = async ({ account, ...props }: SystemTypes.Surrender) => {
    await handleTransaction(
      account,
      () => client.game.surrender({ account, ...props }),
      "Game has been surrendered.",
    );
  };

  const move = async ({ account, ...props }: SystemTypes.Move) => {
    log.debug("move", { account: account.address, ...props });
    const setMoveComplete = useMoveStore.getState().setMoveComplete;
    setMoveComplete(false);

    try {
      await handleTransaction(
        account,
        () => client.game.move({ account, ...props }),
        "Move has been done.",
      );
      setMoveComplete(true);
    } catch (error) {
      setMoveComplete(true);
      throw error;
    }
  };

  const applyBonus = async ({ account, ...props }: SystemTypes.BonusTx) => {
    log.debug("applyBonus", { account: account.address, ...props });
    const setMoveComplete = useMoveStore.getState().setMoveComplete;
    setMoveComplete(false);

    try {
      await handleTransaction(
        account,
        () => client.game.bonus({ account, ...props }),
        "Bonus has been applied.",
      );
      setMoveComplete(true);
    } catch (error) {
      setMoveComplete(true);
      throw error;
    }
  };

  const addCustomGameSettings = async ({
    account,
    ...props
  }: SystemTypes.AddCustomGameSettings) => {
    if (!client.config) {
      throw new Error("Config system not available");
    }
    await handleTransaction(
      account,
      () => client.config!.add_custom_game_settings({ account, ...props }),
      "Game settings created.",
    );
  };

  const purchaseMap = async ({ account, ...props }: SystemTypes.PurchaseMap) => {
    if (!client.config) {
      throw new Error("Config system not available");
    }
    await handleTransaction(
      account,
      () => client.config!.purchase_map({ account, ...props }),
      "Map purchased.",
    );
  };

  const unlockWithStars = async ({
    account,
    ...props
  }: SystemTypes.UnlockWithStars) => {
    if (!client.config) {
      throw new Error("Config system not available");
    }
    await handleTransaction(
      account,
      () => client.config!.unlock_with_stars({ account, ...props }),
      "Map unlocked with stars.",
    );
  };

  const createDailyChallenge = async ({
    account,
    ...props
  }: SystemTypes.CreateDailyChallenge) => {
    if (!client.daily_challenge) {
      throw new Error("Daily challenge system not available");
    }
    await handleTransaction(
      account,
      () => client.daily_challenge!.create_daily_challenge({ account, ...props }),
      "Daily challenge created.",
    );
  };

  const registerEntry = async ({
    account,
    ...props
  }: SystemTypes.RegisterEntry) => {
    if (!client.daily_challenge) {
      throw new Error("Daily challenge system not available");
    }
    await handleTransaction(
      account,
      () => client.daily_challenge!.register_entry({ account, ...props }),
      "Entry registered.",
    );
  };

  const submitResult = async ({
    account,
    ...props
  }: SystemTypes.SubmitResult) => {
    if (!client.daily_challenge) {
      throw new Error("Daily challenge system not available");
    }
    await handleTransaction(
      account,
      () => client.daily_challenge!.submit_result({ account, ...props }),
      "Result submitted.",
    );
  };

  const settleChallenge = async ({
    account,
    ...props
  }: SystemTypes.SettleChallenge) => {
    if (!client.daily_challenge) {
      throw new Error("Daily challenge system not available");
    }
    await handleTransaction(
      account,
      () => client.daily_challenge!.settle_challenge({ account, ...props }),
      "Challenge settled.",
    );
  };

  const settleWeeklyEndless = async ({
    account,
    ...props
  }: SystemTypes.SettleWeeklyEndless) => {
    if (!client.daily_challenge) {
      throw new Error("Daily challenge system not available");
    }
    await handleTransaction(
      account,
      () => client.daily_challenge!.settle_weekly_endless({ account, ...props }),
      "Weekly endless settled.",
    );
  };

  const claimPrize = async ({
    account,
    ...props
  }: SystemTypes.ClaimPrize) => {
    if (!client.daily_challenge) {
      throw new Error("Daily challenge system not available");
    }
    await handleTransaction(
      account,
      () => client.daily_challenge!.claim_prize({ account, ...props }),
      "Prize claimed!",
    );
  };

  const withdrawUnclaimed = async ({
    account,
    ...props
  }: SystemTypes.WithdrawUnclaimed) => {
    if (!client.daily_challenge) {
      throw new Error("Daily challenge system not available");
    }
    await handleTransaction(
      account,
      () => client.daily_challenge!.withdraw_unclaimed({ account, ...props }),
      "Unclaimed prizes withdrawn.",
    );
  };

  const questClaim = async ({ account, ...props }: SystemTypes.QuestClaim) => {
    await handleTransaction(
      account,
      () => client.game.questClaim({ account, ...props }),
      "Quest reward claimed!",
    );
  };

  return {
    freeMint,
    create,
    createRun,
    startRun,
    replayLevel,
    claimPerfection,
    surrender,
    move,
    applyBonus,
    addCustomGameSettings,
    purchaseMap,
    unlockWithStars,
    createDailyChallenge,
    registerEntry,
    submitResult,
    settleChallenge,
    settleWeeklyEndless,
    claimPrize,
    withdrawUnclaimed,
    questClaim,
  };
}

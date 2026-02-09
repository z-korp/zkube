import { shortenHex } from "@dojoengine/utils";
import { usePixiToastStore, type PixiToastType } from "@/pixi/notifications/store";

const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;

export const isMdOrLarger = (): boolean => {
  return window.matchMedia("(min-width: 768px)").matches;
};

export const shouldShowToast = (): boolean => {
  // Always show toasts on all screen sizes
  // Mobile toasts are positioned at top-center via CSS in index.css
  return true;
};

export const isSmallHeight = (): boolean => {
  return window.matchMedia("(max-height: 768px)").matches;
};

export const getUrl = (transaction_hash: string): string => {
  if (
    VITE_PUBLIC_DEPLOY_TYPE === "sepolia" ||
    VITE_PUBLIC_DEPLOY_TYPE === "sepoliadev1" ||
    VITE_PUBLIC_DEPLOY_TYPE === "sepoliadev2"
  ) {
    return `https://sepolia.voyager.online/tx/${transaction_hash}`;
  } else if (VITE_PUBLIC_DEPLOY_TYPE === "mainnet") {
    return `https://starkscan.co/tx/${transaction_hash}`;
  } else {
    return `https://worlds.dev/networks/slot/worlds/zkube-${VITE_PUBLIC_DEPLOY_TYPE}/txs/${transaction_hash}`;
  }
};

export const getWalnutUrl = (transaction_hash: string): string => {
  return `https://app.walnut.dev/transactions?rpcUrl=https%3A%2F%2Fapi.cartridge.gg%2Fx%2Fstarknet%2Fsepolia&txHash=${transaction_hash}`;
};

export const getToastAction = (transaction_hash: string) => {
  return {
    label: "View",
    onClick: () => window.open(getUrl(transaction_hash), "_blank"),
  };
};

export const getToastPlacement = ():
  | "top-center"
  | "bottom-center"
  | "bottom-right" => {
  // Mobile: bottom-center (CSS moves it to middle), Desktop: bottom-right
  return isMdOrLarger() ? "bottom-right" : "bottom-center";
};

export function extractErrorMessages(errorString: string) {
  const regex = /Error message:(.*?)(?=\n|$)/gs;
  const matches = errorString.match(regex);

  if (matches) {
    return matches.map((match) => match.replace("Error message:", "").trim());
  } else {
    return [errorString.trim()];
  }
}

export const extractedMessage = (message: string) => {
  const errorMessages = extractErrorMessages(message);
  return errorMessages.length > 0 ? errorMessages[0] : message;
};

export const notify = (message: string, transaction: any, toastId: string) => {
  if (transaction.execution_status !== "REVERTED") {
    if (!shouldShowToast()) return;
    usePixiToastStore.getState().upsertToast({
      id: toastId,
      message,
      description: shortenHex(transaction.transaction_hash),
      type: "success",
    });
  } else {
    usePixiToastStore.getState().upsertToast({
      id: toastId,
      message: extractedMessage(transaction.revert_reason),
      type: "error",
    });
  }
};

interface ShowToastOptions {
  message: string;
  txHash?: string;
  type?: PixiToastType;
  toastId?: string;
  durationMs?: number;
}

export const showToast = ({
  message,
  txHash,
  type = "loading",
  toastId = "transaction-toast",
  durationMs,
}: ShowToastOptions) => {
  if (!shouldShowToast()) return;

  usePixiToastStore.getState().upsertToast({
    id: toastId,
    message,
    description: txHash ? shortenHex(txHash) : undefined,
    type,
    durationMs,
  });
};

import { toast } from "sonner";
import { shortenHex } from "@dojoengine/utils";

const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;

export const isMdOrLarger = (): boolean => {
  return window.matchMedia("(min-width: 768px)").matches;
};

export const shouldShowToast = (): boolean => {
  return isMdOrLarger();
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
  if (!isMdOrLarger()) {
    return isSmallHeight() ? "top-center" : "bottom-right";
  }
  return "bottom-right";
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
  const toastPlacement = getToastPlacement();

  if (transaction.execution_status !== "REVERTED") {
    if (!shouldShowToast()) return;
    toast.success(message, {
      id: toastId,
      description: shortenHex(transaction.transaction_hash),
      action: getToastAction(transaction.transaction_hash),
      position: toastPlacement,
    });
  } else {
    toast.error(extractedMessage(transaction.revert_reason), {
      id: toastId,
      position: toastPlacement,
    });
  }
};

interface ShowToastOptions {
  message: string;
  txHash?: string;
  type?: "loading" | "success" | "error";
  toastId?: string;
}

export const showToast = ({
  message,
  txHash,
  type = "loading",
  toastId = "transaction-toast",
}: ShowToastOptions) => {
  if (!shouldShowToast()) return;

  const toastPlacement = getToastPlacement();
  const toastOptions = {
    id: toastId,
    description: txHash ? shortenHex(txHash) : undefined,
    action: txHash ? getToastAction(txHash) : undefined,
    position: toastPlacement,
  };

  switch (type) {
    case "loading":
      toast.loading(message, toastOptions);
      break;
    case "success":
      toast.success(message, toastOptions);
      break;
    case "error":
      toast.error(message, toastOptions);
      break;
  }
};

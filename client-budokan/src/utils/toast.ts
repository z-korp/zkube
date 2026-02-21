import { toast } from "sonner";
import { shortenHex } from "@dojoengine/utils";

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
  description?: string;
  type?: "loading" | "success" | "error";
  toastId?: string;
  durationMs?: number;
}

export const showToast = ({
  message,
  txHash,
  description,
  type = "loading",
  toastId = "transaction-toast",
  durationMs,
}: ShowToastOptions) => {
  if (!shouldShowToast()) return;

  const toastPlacement = getToastPlacement();
  const toastOptions = {
    id: toastId,
    description: description ?? (txHash ? shortenHex(txHash) : undefined),
    action: txHash ? getToastAction(txHash) : undefined,
    position: toastPlacement,
    duration: durationMs,
  };

  switch (type) {
    case "loading":
      toast.loading(message, { ...toastOptions, duration: toastOptions.duration ?? 5000 });
      break;
    case "success":
      toast.success(message, toastOptions);
      break;
    case "error":
      toast.error(message, toastOptions);
      break;
  }
};

export const normalizeErrorMessage = (raw: string): string => {
  const message = extractedMessage(raw).trim();

  if (!message) {
    return "Something went wrong.";
  }

  const lower = message.toLowerCase();

  if (
    lower.includes("user aborted") ||
    lower.includes("user rejected") ||
    lower.includes("transaction rejected") ||
    lower.includes("request rejected")
  ) {
    return "Transaction cancelled.";
  }

  if (lower.includes("timed out") || lower.includes("timeout")) {
    return "Transaction timed out. Network may be slow.";
  }

  if (lower.includes("insufficient") && lower.includes("balance")) {
    return "Insufficient balance for this action.";
  }

  return message;
};

export const deriveUserFacingErrorMessage = (
  error: unknown,
  fallback = "Transaction failed."
): string => {
  if (error instanceof Error) {
    return normalizeErrorMessage(error.message || fallback);
  }

  if (typeof error === "string") {
    return normalizeErrorMessage(error);
  }

  if (error && typeof error === "object" && "message" in error) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string") {
      return normalizeErrorMessage(maybeMessage);
    }
  }

  return fallback;
};

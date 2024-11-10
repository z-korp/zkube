import { useAccount } from "@starknet-react/core";
import { KATANA_ETH_CONTRACT_ADDRESS } from "@dojoengine/core";
import Balance from "./Balance";
import { useMediaQuery } from "react-responsive";
import DisconnectButton from "./DisconnectButton";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import { FaucetButton } from "./FaucetButton";
import { Copy } from "lucide-react";
import { useState } from "react";

const { VITE_PUBLIC_GAME_TOKEN_ADDRESS, VITE_PUBLIC_GAME_TOKEN_SYMBOL } =
  import.meta.env;

const shortAddress = (address: string, size = 4) => {
  return `${address.slice(0, size)}...${address.slice(-size)}`;
};

const AccountDetails = () => {
  const { status } = useAccount();
  const { account } = useAccountCustom();
  const { username } = useControllerUsername();
  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (account?.address) {
      await navigator.clipboard.writeText(account.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (status === "connected" && account?.address) {
    return (
      <div className="flex gap-3 items-center flex-col w-full">
        <div className="flex items-center gap-2 w-full">
          <div className="flex items-center gap-1 md:gap-2 rounded-lg bg-secondary text-secondary-foreground shadow-sm px-2 md:px-3 py-1 justify-between h-[36px] w-full">
            <div className="px-1">{username}</div>
            <p className="text-sm">
              {shortAddress(account.address, isMdOrLarger ? 5 : 6)}
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center h-[36px] w-[36px] rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            title={copied ? "Copied!" : "Copy address"}
          >
            <Copy className={`h-4 ${copied ? "text-green-500" : ""}`} />
          </button>
          <DisconnectButton />
        </div>
        <div className="flex w-full gap-3">
          <div className="rounded-lg px-2 md:px-3 py-1 bg-secondary text-secondary-foreground shadow-sm h-[36px] w-full flex justify-center items-center">
            <Balance
              address={account.address}
              token_address={KATANA_ETH_CONTRACT_ADDRESS}
              symbol="ETH"
            />
          </div>
          <div className="rounded-lg px-2 md:px-3 py-1 bg-secondary text-secondary-foreground shadow-sm h-[36px] w-full flex justify-center items-center">
            <Balance
              address={account.address}
              token_address={VITE_PUBLIC_GAME_TOKEN_ADDRESS}
              symbol={VITE_PUBLIC_GAME_TOKEN_SYMBOL}
            />
          </div>
        </div>
        <FaucetButton />
      </div>
    );
  }
};

export default AccountDetails;

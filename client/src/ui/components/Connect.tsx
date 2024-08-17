import { useConnect, useAccount, useDisconnect } from "@starknet-react/core";
import { KATANA_ETH_CONTRACT_ADDRESS } from "@dojoengine/core";
import { Copy } from "lucide-react";
import { Button } from "../elements/button";
import Balance from "./Balance";
import { useMediaQuery } from "react-responsive";

const shortAddress = (address: string, size = 4) => {
  return `${address.slice(0, size)}...${address.slice(-size)}`;
};

const Connect = () => {
  const { connect, connectors } = useConnect();
  const { address, status } = useAccount();
  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  if (status === "connected" && address) {
    return (
      <div className="flex gap-3 items-center flex-col">
        <div className="flex items-center gap-3 w-full">
          <div className="flex items-center gap-1 md:gap-2 rounded-lg px-2 md:px-3 py-1 justify-between border">
            <p className="text-sm">
              {shortAddress(address, isMdOrLarger ? 4 : 3)}
            </p>
            <Balance
              address={address}
              token_address={KATANA_ETH_CONTRACT_ADDRESS}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {connectors.map((connector) => (
        <span key={connector.id}>
          <Button
            onClick={() => {
              connect({ connector });
            }}
          >
            Connect
          </Button>
        </span>
      ))}
    </div>
  );
};

export default Connect;

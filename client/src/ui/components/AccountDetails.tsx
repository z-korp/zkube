import { useAccount } from "@starknet-react/core";
import { KATANA_ETH_CONTRACT_ADDRESS } from "@dojoengine/core";
import Balance from "./Balance";
import { useMediaQuery } from "react-responsive";
import DisconnectButton from "./DisconnectButton";

const shortAddress = (address: string, size = 4) => {
  return `${address.slice(0, size)}...${address.slice(-size)}`;
};

const AccountDetails = () => {
  const { address, status } = useAccount();
  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  if (status === "connected" && address) {
    return (
      <div className="flex gap-3 items-center flex-col ">
        <div className="flex items-center gap-3 w-full">
          <div className="flex items-center gap-1 md:gap-2 rounded-lg px-2 md:px-3 py-1 justify-between border h-[36px]">
            <p className="text-sm">
              {shortAddress(address, isMdOrLarger ? 4 : 3)}
            </p>
            <Balance
              address={address}
              token_address={KATANA_ETH_CONTRACT_ADDRESS}
            />
          </div>
          <div className="flex items-center gap-1 md:gap-2 rounded-lg px-2 md:px-3 py-1 justify-between border h-[36px]">
            <p className="text-sm">
              Strk Bal:
            </p>
            <Balance
              address={address}
              token_address={KATANA_ETH_CONTRACT_ADDRESS}
              symbol="STRK"
            />
          </div>
          <DisconnectButton />
        </div>
      </div>
    );
  }
};

export default AccountDetails;

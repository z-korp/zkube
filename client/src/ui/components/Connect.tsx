import { useConnect, useAccount } from "@starknet-react/core";
import { Button } from "../elements/button";

const Connect = () => {
  const { connect, connectors } = useConnect();
  const { address, status } = useAccount();

  if (status === "connected" && address) {
    return null;
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

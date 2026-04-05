import { useConnect } from "@starknet-react/core";
import { Gamepad2 } from "lucide-react";
import ArcadeButton from "@/ui/components/shared/ArcadeButton";

const Connect = () => {
  const { connect, connectors, isPending } = useConnect();

  const handleConnect = () => {
    // Find the controller connector (primary) or use first available
    const controllerConnector = connectors.find((c) => c.id === "controller");
    const connector = controllerConnector || connectors[0];
    
    if (connector) {
      connect({ connector });
    }
  };

  return (
    <ArcadeButton onClick={handleConnect} disabled={isPending}>
      <Gamepad2 size={22} strokeWidth={2.5} />
      {isPending ? "CONNECTING..." : "CONNECT TO PLAY"}
    </ArcadeButton>
  );
};

export default Connect;

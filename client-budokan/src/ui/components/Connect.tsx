import { useConnect } from "@starknet-react/core";
import { Gamepad2 } from "lucide-react";
import ArcadeButton from "@/ui/components/shared/ArcadeButton";

type ConnectProps = {
  ctaLabel?: string;
  pendingLabel?: string;
};

const Connect = ({ ctaLabel = "CONNECT ACCOUNT", pendingLabel = "CONNECTING..." }: ConnectProps) => {
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
      {isPending ? pendingLabel : ctaLabel}
    </ArcadeButton>
  );
};

export default Connect;

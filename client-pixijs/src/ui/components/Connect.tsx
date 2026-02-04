import { useConnect } from "@starknet-react/core";
import { Button } from "@/ui/elements/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGamepad } from "@fortawesome/free-solid-svg-icons";

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
    <Button
      variant="default"
      onClick={handleConnect}
      disabled={isPending}
      isLoading={isPending}
      className="gap-2"
    >
      <FontAwesomeIcon icon={faGamepad} />
      {isPending ? "Connecting..." : "Log In"}
    </Button>
  );
};

export default Connect;

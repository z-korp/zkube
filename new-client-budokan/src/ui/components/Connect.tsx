import { useConnect } from "@starknet-react/core";
import { Button } from "@/ui/elements/button";
import { Gamepad2 } from "lucide-react";

const Connect = () => {
  const { connect, connectors, isPending } = useConnect();

  const handleConnect = () => {
    const controllerConnector = connectors.find((c) => c.id === "controller");
    const connector = controllerConnector || connectors[0];

    if (connector) {
      connect({ connector });
    }
  };

  return (
    <Button
      onClick={handleConnect}
      disabled={isPending}
      isLoading={isPending}
      className="gap-2 w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-bold rounded-xl shadow-lg shadow-emerald-900/30 transition-all active:scale-[0.97]"
    >
      <Gamepad2 size={20} />
      {isPending ? "Connecting..." : "Connect & Play"}
    </Button>
  );
};

export default Connect;

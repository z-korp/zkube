import { useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { Button } from "../elements/button";
import { Gamepad2 } from "lucide-react";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import ControllerConnector from "@cartridge/connector/controller";

interface ControllerProps {
  className?: string;
}

const shortAddress = (address: string, size = 4) => {
  return `${address.slice(0, size + 2)}...${address.slice(-size)}`;
};

export const Controller = ({ className = "" }: ControllerProps) => {
  const { address, connector } = useAccount();
  const { username } = useControllerUsername();

  const openProfile = useCallback(() => {
    const controllerConnector = connector as ControllerConnector;
    if (controllerConnector?.controller?.openProfile) {
      controllerConnector.controller.openProfile();
    }
  }, [connector]);

  if (!address) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={openProfile}
      className={`gap-2 ${className}`}
      title="Open Profile"
    >
      <Gamepad2 size={16} />
      <span className="hidden sm:inline">
        {username || shortAddress(address)}
      </span>
    </Button>
  );
};

export default Controller;

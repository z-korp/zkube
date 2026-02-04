import { useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { Button } from "../elements/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGamepad } from "@fortawesome/free-solid-svg-icons";
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
      <FontAwesomeIcon icon={faGamepad} />
      <span className="hidden sm:inline">
        {username || shortAddress(address)}
      </span>
    </Button>
  );
};

export default Controller;

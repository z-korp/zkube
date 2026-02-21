import { Button } from "../elements/button";
import { useDisconnect } from "@starknet-react/core";
import { LogOut } from "lucide-react";

const DisconnectButton = () => {
  const { disconnect } = useDisconnect();
  return (
    <Button variant="outline" size="icon" onClick={() => disconnect()}>
      <LogOut size={16} />
    </Button>
  );
};

export default DisconnectButton;

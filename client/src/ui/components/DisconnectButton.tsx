import { faSignOut } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "../elements/button";
import { useDisconnect } from "@starknet-react/core";

const DisconnectButton = () => {
  const { disconnect } = useDisconnect();
  return (
    <Button variant="outline" size="icon" onClick={() => disconnect()}>
      <FontAwesomeIcon icon={faSignOut} />
    </Button>
  );
};

export default DisconnectButton;

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "../elements/button";
import { faWallet } from "@fortawesome/free-solid-svg-icons";
import { useCallback } from "react";
import { useAccount } from "@starknet-react/core";

export const Controller = () => {
  const { connector } = useAccount();
  const handleTrophyClick = useCallback(() => {
    if (!connector?.controller) {
      console.error("Connector not initialized");
      return;
    }
    connector?.controller.openProfile("trophies");
  }, [connector]);

  return (
    <Button variant="outline" onClick={() => handleTrophyClick()}>
      <FontAwesomeIcon icon={faWallet} />
    </Button>
  );
};

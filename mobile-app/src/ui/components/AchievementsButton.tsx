import { useCallback } from "react";
import { Button } from "@/ui/elements/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import { useAccount } from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";

interface AchievementsButtonProps {
  className?: string;
  iconOnly?: boolean;
}

export const AchievementsButton: React.FC<AchievementsButtonProps> = ({ 
  className = "",
  iconOnly = false,
}) => {
  const { connector } = useAccount();

  const handleClick = useCallback(() => {
    // Open Controller profile at trophies tab
    const controllerConnector = connector as ControllerConnector;
    if (controllerConnector?.controller?.openProfile) {
      controllerConnector.controller.openProfile("trophies");
    }
  }, [connector]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={className}
      title="View Achievements"
    >
      <FontAwesomeIcon icon={faTrophy} className={iconOnly ? "" : "mr-2"} />
      {!iconOnly && "Trophies"}
    </Button>
  );
};

export default AchievementsButton;

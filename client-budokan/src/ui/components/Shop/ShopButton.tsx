import { useState } from "react";
import { Button } from "@/ui/elements/button";
import { ShopDialog } from "./ShopDialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStore } from "@fortawesome/free-solid-svg-icons";

export const ShopButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <FontAwesomeIcon icon={faStore} />
        <span>Shop</span>
      </Button>
      <ShopDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

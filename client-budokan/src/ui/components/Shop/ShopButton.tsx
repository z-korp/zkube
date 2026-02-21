import { useState } from "react";
import { Button } from "@/ui/elements/button";
import { ShopDialog } from "./ShopDialog";
import { Store } from "lucide-react";

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
        <Store size={16} />
        <span>Shop</span>
      </Button>
      <ShopDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

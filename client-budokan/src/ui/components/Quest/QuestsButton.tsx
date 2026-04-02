import { useState } from "react";
import { Button } from "@/ui/elements/button";
import { QuestsDialog } from "./QuestsDialog";
import { Scroll } from "lucide-react";

interface QuestsButtonProps {
  className?: string;
}

export const QuestsButton: React.FC<QuestsButtonProps> = ({ className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const claimableCount = 0;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={`relative ${className}`}
      >
        <Scroll size={16} className="mr-2" />
        Quests
        {claimableCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-black text-xs font-bold rounded-full flex items-center justify-center">
            {claimableCount}
          </span>
        )}
      </Button>
      <QuestsDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default QuestsButton;

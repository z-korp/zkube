import { useState, useMemo } from "react";
import { Button } from "@/ui/elements/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faScroll } from "@fortawesome/free-solid-svg-icons";
import { QuestsDialog } from "./QuestsDialog";
import { useQuests } from "@/contexts/quests";

interface QuestsButtonProps {
  className?: string;
}

export const QuestsButton: React.FC<QuestsButtonProps> = ({ className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { quests } = useQuests();

  // Count claimable quests (completed but not claimed)
  const claimableCount = useMemo(() => {
    return quests.filter((q) => q.completed && !q.claimed && !q.locked).length;
  }, [quests]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={`relative ${className}`}
      >
        <FontAwesomeIcon icon={faScroll} className="mr-2" />
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

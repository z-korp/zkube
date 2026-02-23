import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/ui/elements/dialog";
import { Button } from "@/ui/elements/button";
import type { RunData } from "@/dojo/game/helpers/runDataPacking";

interface PendingLevelUpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: number;
  runData: RunData;
}

const PendingLevelUpDialog: React.FC<PendingLevelUpDialogProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] w-[95%] rounded-lg px-4 py-5">
        <DialogTitle className="text-xl text-center mb-2 text-amber-300">
          Bonus Level-Up Removed
        </DialogTitle>
        <p className="text-sm text-slate-300 text-center">
          Boss level bonus upgrades are no longer part of the run flow.
        </p>
        <Button onClick={onClose} variant="outline" className="w-full mt-4">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default PendingLevelUpDialog;

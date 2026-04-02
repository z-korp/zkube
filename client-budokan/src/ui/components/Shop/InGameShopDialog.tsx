import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/ui/elements/dialog";
import { Button } from "@/ui/elements/button";

interface InGameShopDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const InGameShopDialog: React.FC<InGameShopDialogProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] w-[95%] rounded-lg px-4 py-5">
        <DialogTitle className="text-xl text-center mb-2 text-amber-300">
          In-Game Shop Removed
        </DialogTitle>
        <p className="text-sm text-slate-300 text-center">
          This system was replaced by the draft and skill tree flow.
        </p>
        <Button onClick={onClose} variant="outline" className="w-full mt-4">
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default InGameShopDialog;

import { Dialog, DialogContent, DialogTitle } from "@/ui/elements/dialog";

interface QuestsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuestsDialog: React.FC<QuestsDialogProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] w-[95%] rounded-lg px-4 py-5">
        <DialogTitle className="text-xl text-center mb-2 text-amber-300">
          Quests moved
        </DialogTitle>
        <p className="text-sm text-slate-300 text-center">
          Legacy quest panel was removed in this migration phase.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default QuestsDialog;

import { Dialog, DialogContent, DialogTitle } from "@/ui/elements/dialog";
import { Button } from "@/ui/elements/button";

interface ShopDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShopDialog: React.FC<ShopDialogProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[460px] w-[95%] rounded-lg px-6 py-6">
        <DialogTitle className="text-2xl text-center mb-2 text-purple-400">
          Permanent Shop Removed
        </DialogTitle>
        <p className="text-sm text-slate-300 text-center">
          Permanent upgrades and bridging have been removed.
        </p>
        <p className="text-xs text-slate-400 text-center mt-2">
          Progression now happens through run events and draft flow.
        </p>
        <div className="mt-5 flex justify-center">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShopDialog;

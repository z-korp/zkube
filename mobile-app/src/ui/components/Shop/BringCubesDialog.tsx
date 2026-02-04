import { Dialog, DialogContent, DialogTitle } from "@/ui/elements/dialog";
import { Button } from "@/ui/elements/button";
import { useState } from "react";
import { Slider } from "@/ui/elements/slider";

interface BringCubesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (cubes: number) => void;
  maxCubes: number;
  cubeBalance: number;
  isLoading?: boolean;
}

// Calculate max cubes allowed based on bridging rank
// Rank 1 = 5, Rank 2 = 10, Rank 3 = 20, Rank 4 = 40, etc.
export const getMaxCubesForRank = (rank: number): number => {
  if (rank === 0) return 0;
  return 5 * Math.pow(2, rank - 1);
};

export const BringCubesDialog: React.FC<BringCubesDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  maxCubes,
  cubeBalance,
  isLoading = false,
}) => {
  const [cubesToBring, setCubesToBring] = useState(0);

  // Can't bring more than wallet balance or max allowed by rank
  const actualMax = Math.min(maxCubes, cubeBalance);

  const handleConfirm = () => {
    onConfirm(cubesToBring);
  };

  const handleStartWithout = () => {
    onConfirm(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[420px] w-[95%] flex flex-col mx-auto justify-start rounded-lg px-6 py-8"
      >
        <DialogTitle className="text-2xl text-center mb-2">
          Bring Cubes?
        </DialogTitle>

        <div className="text-center mb-6">
          <p className="text-slate-400 text-sm mb-4">
            Bring cubes into your run to spend at the in-game shop.
            <br />
            <span className="text-yellow-500">Warning:</span> Brought cubes are lost if you die!
          </p>
        </div>

        {/* Wallet Balance */}
        <div className="text-center mb-4 bg-slate-800/50 py-3 rounded-lg">
          <div className="text-lg font-semibold text-yellow-400 flex items-center justify-center gap-2">
            <span>Wallet Balance:</span>
            <span>{cubeBalance.toLocaleString()} cubes</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Max allowed: {maxCubes} cubes (from Bridging Rank)
          </div>
        </div>

        {/* Slider */}
        {actualMax > 0 && (
          <div className="mb-6 px-2">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-slate-400">Cubes to bring:</span>
              <span className="text-lg font-bold text-yellow-400">{cubesToBring}</span>
            </div>
            <Slider
              value={[cubesToBring]}
              onValueChange={(value) => setCubesToBring(value[0])}
              min={0}
              max={actualMax}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between mt-1 text-xs text-slate-500">
              <span>0</span>
              <span>{actualMax}</span>
            </div>
          </div>
        )}

        {actualMax === 0 && (
          <div className="text-center mb-6 text-slate-500 text-sm">
            You don't have any cubes to bring.
          </div>
        )}

        {/* Quick select buttons */}
        {actualMax > 0 && (
          <div className="flex gap-2 mb-6 justify-center flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCubesToBring(0)}
              className="min-w-[60px]"
            >
              0
            </Button>
            {actualMax >= 5 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCubesToBring(Math.min(5, actualMax))}
                className="min-w-[60px]"
              >
                5
              </Button>
            )}
            {actualMax >= 10 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCubesToBring(Math.min(10, actualMax))}
                className="min-w-[60px]"
              >
                10
              </Button>
            )}
            {actualMax >= 20 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCubesToBring(Math.min(20, actualMax))}
                className="min-w-[60px]"
              >
                20
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCubesToBring(actualMax)}
              className="min-w-[60px]"
            >
              Max
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleStartWithout}
            disabled={isLoading}
            className="flex-1"
          >
            Start Without
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || (cubesToBring === 0 && actualMax > 0)}
            isLoading={isLoading}
            className="flex-1"
          >
            {cubesToBring > 0 ? `Bring ${cubesToBring} Cubes` : "Start Game"}
          </Button>
        </div>

        {cubesToBring > 0 && (
          <p className="text-center text-xs text-slate-500 mt-4">
            These cubes will be burned from your wallet and available to spend during the run.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BringCubesDialog;

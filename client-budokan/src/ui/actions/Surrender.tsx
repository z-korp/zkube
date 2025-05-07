import { useDojo } from "@/dojo/useDojo";
import { useCallback, useMemo, useState } from "react";
import { Account } from "starknet";
import { Button } from "@/ui/elements/button";
import { useGame } from "@/hooks/useGame";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/ui/elements/dialog";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useGeneralStore } from "@/stores/generalStore";
import { cn } from "../utils";

interface SurrenderProps {
  variant?:
    | "default"
    | "link"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost";
  red?: boolean;
  className?: string;
}

export const Surrender: React.FC<SurrenderProps> = ({
  variant = "default",
  red = false,
  className,
}) => {
  const { account } = useAccountCustom();
  const { setIsUnmounting } = useGeneralStore();
  const {
    setup: {
      systemCalls: { surrender },
    },
  } = useDojo();
  const { game } = useGame({
    gameId: /*TBD player?.game_id*/ "0",
    shouldLog: false,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setIsUnmounting(true);
    setIsLoading(true);
    try {
      await surrender({ account: account as Account });
    } finally {
      setIsLoading(false);
    }
  }, [account, setIsUnmounting, surrender]);

  const disabled = useMemo(() => {
    return !account || !game || game.over;
  }, [account, game]);

  if (disabled) return null;

  return (
    <div className={cn("flex gap-4", className)}>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            disabled={isLoading}
            isLoading={isLoading}
            variant={variant}
            className={cn("text-xl", className, red && "bg-red-600")}
          >
            Surrender
          </Button>
        </DialogTrigger>
        <DialogContent
          aria-describedby={undefined}
          className="sm:max-w-[700px] w-[95%] flex flex-col mx-auto justify-start rounded-lg px-4"
        >
          <DialogHeader>
            <DialogTitle>Surrender Game?</DialogTitle>
          </DialogHeader>

          <div className="flex gap-4">
            <DialogClose asChild className="w-full">
              <Button className="flex-1">No, Continue</Button>
            </DialogClose>
            <DialogClose asChild className="w-full">
              <Button
                variant="destructive"
                disabled={isLoading}
                isLoading={isLoading}
                onClick={handleClick}
                className="flex-1"
              >
                Yes, Surrender
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

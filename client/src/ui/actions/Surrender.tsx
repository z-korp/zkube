import { useDojo } from "@/dojo/useDojo";
import { useCallback, useMemo, useState } from "react";
import { Account } from "starknet";
import { Button } from "@/ui/elements/button";
import { useGame } from "@/hooks/useGame";
import { usePlayer } from "@/hooks/usePlayer";
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
  outline?: boolean;
  red?: boolean;
  className?: string;
}

export const Surrender: React.FC<SurrenderProps> = ({
  outline = false,
  red = false,
  className,
}) => {
  const { account } = useAccountCustom();
  const { setIsUnmounting } = useGeneralStore();
  const {
    master,
    setup: {
      systemCalls: { surrender },
    },
  } = useDojo();
  const { player } = usePlayer({ playerId: account?.address });
  const { game } = useGame({
    gameId: player?.game_id || "0x0",
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
  }, [account]);

  const disabled = useMemo(() => {
    return (
      !account || !master || account === master || !player || !game || game.over
    );
  }, [account, master, player, game]);

  if (disabled) return null;

  return (
    <div className={cn("flex gap-4", className)}>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            disabled={isLoading}
            isLoading={isLoading}
            variant={outline ? "outline" : "default"}
            className={cn("text-xl", className, red && "bg-red-600")}
          >
            Surrender
          </Button>
        </DialogTrigger>
        <DialogContent
          aria-describedby={undefined}
          className="w-[90%] p-8 flex flex-col gap-4"
        >
          <DialogHeader>
            <DialogTitle>Surrender Game?</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <DialogClose asChild className="">
              <Button>No, Continue Playing</Button>
            </DialogClose>
            <DialogClose asChild className="">
              <Button
                variant="destructive"
                disabled={isLoading}
                isLoading={isLoading}
                onClick={handleClick}
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

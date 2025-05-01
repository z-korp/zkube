import { useDojo } from "@/dojo/useDojo";
import { useCallback, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/ui/elements/dialog";
import { Button } from "@/ui/elements/button";
import { Input } from "@/ui/elements/input";
import { usePlayer } from "@/hooks/usePlayer";
import { Account } from "starknet";
import { MAX_CHAR_PSEUDO } from "../constants";
import useAccountCustom from "@/hooks/useAccountCustom";

export const Create = () => {
  const [playerName, setPlayerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { account } = useAccountCustom();
  const {
    setup: {
      systemCalls: { rename },
    },
  } = useDojo();

  const { player } = usePlayer();

  const handleClick = useCallback(async () => {
    setIsLoading(true);
    try {
      await rename({ account: account as Account, name: playerName });
    } finally {
      setIsLoading(false);
    }
  }, [account, playerName, rename]);

  const disabled = useMemo(() => {
    return !account || !player;
  }, [account, player]);

  if (disabled) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button disabled={disabled}>Rename</Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Rename the player</DialogTitle>
          <DialogDescription>Choose a name.</DialogDescription>
        </DialogHeader>

        <Input
          className="w-full"
          placeholder="Player Name"
          type="text"
          value={playerName}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHAR_PSEUDO) {
              setPlayerName(e.target.value);
            }
          }}
        />

        <DialogClose asChild>
          <Button
            disabled={!playerName || isLoading}
            isLoading={isLoading}
            onClick={handleClick}
          >
            Rename
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

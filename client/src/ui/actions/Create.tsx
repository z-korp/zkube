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

export const Create = () => {
  const [playerName, setPlayerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    account: { account },
    master,
    setup: {
      systemCalls: { create },
    },
  } = useDojo();

  const { player } = usePlayer({ playerId: account.address });

  const handleClick = useCallback(async () => {
    setIsLoading(true);
    try {
      await create({ account: account as Account, name: playerName });
    } finally {
      setIsLoading(false);
    }
  }, [account, playerName]);

  const disabled = useMemo(() => {
    return !account || !master || account === master || !!player;
  }, [account, master, player]);

  if (disabled) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button isLoading={isLoading} disabled={isLoading} className="text-xl">
          Create my Profile
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new player</DialogTitle>
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
            Create my Profile
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

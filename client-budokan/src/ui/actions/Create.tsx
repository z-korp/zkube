import { useDojo } from "@/dojo/useDojo";
import { useCallback, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
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
  const [open, setOpen] = useState(true);
  const { account } = useAccountCustom();
  const {
    setup: {
      systemCalls: { create },
    },
  } = useDojo();

  const { player } = usePlayer();

  const handleClick = useCallback(async () => {
    setIsLoading(true);
    try {
      await create({ account: account as Account, name: playerName });
      setOpen(false); // Close the dialog after successful creation
    } finally {
      setIsLoading(false);
    }
  }, [account, playerName, create]);

  console.log(account);
  console.log(player);

  const disabled = useMemo(() => {
    return !account || !!player;
  }, [account, player]);

  if (disabled) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button isLoading={isLoading} disabled={isLoading} className="text-xl">
          Sign Up
        </Button>
      </DialogTrigger>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[700px] w-[95%] flex flex-col mx-auto justify-start rounded-lg px-4"
      >
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
            Create Player
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

import { useDojo } from "@/dojo/useDojo";
import { useCallback, useMemo, useState } from "react";
import { Account } from "starknet";
import { Button } from "@/ui/elements/button";
import { useGame } from "@/hooks/useGame";
import { usePlayer } from "@/hooks/usePlayer";
import { fetchVrfData } from "@/api/vrf";
import { Mode, ModeType } from "@/dojo/game/types/mode";
import useAccountCustom from "@/hooks/useAccountCustom";

interface StartProps {
  mode: ModeType;
}

export const Start: React.FC<StartProps> = ({ mode }) => {
  const {
    master,
    setup: {
      systemCalls: { start },
    },
  } = useDojo();

  const { account } = useAccountCustom();

  const { player } = usePlayer({ playerId: account?.address });

  const { game } = useGame({
    gameId: player?.game_id || "0x0",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setIsLoading(true);
    try {
      const {
        seed,
        proof_gamma_x,
        proof_gamma_y,
        proof_c,
        proof_s,
        proof_verify_hint,
        beta,
      } = await fetchVrfData();

      await start({
        account: account as Account,
        mode: new Mode(mode).into(),
        seed,
        x: proof_gamma_x,
        y: proof_gamma_y,
        c: proof_c,
        s: proof_s,
        sqrt_ratio_hint: proof_verify_hint,
        beta: beta,
      });
    } finally {
      setIsLoading(false);
    }
  }, [account, mode]);

  const disabled = useMemo(() => {
    return (
      !account ||
      !master ||
      account === master ||
      !player || 
      (player?.daily_games_available === 0) ||
      (!!game && !game.isOver())
    );
  }, [account, master, player, game]);

  const cost = useMemo(() =>{
    if(player && player?.daily_games_available >0) return "Free"
    return "0.01 STRK" //TODO: replace with actual cost
  }, [player, account])

  // if (disabled) return null;

  return (
    <Button
      disabled={isLoading || disabled}
      isLoading={isLoading}
      onClick={handleClick}
      className="text-xl min-w-[200px]"
    >
      Start {mode} {cost}
    </Button>
  );
};

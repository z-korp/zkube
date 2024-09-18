import { useDojo } from "@/dojo/useDojo";
import { useCallback, useMemo, useState } from "react";
import { Account } from "starknet";
import { Button } from "@/ui/elements/button";
import { useGame } from "@/hooks/useGame";
import { usePlayer } from "@/hooks/usePlayer";
import { fetchVrfData } from "@/api/vrf";
import { Mode, ModeType } from "@/dojo/game/types/mode";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useCredits } from "@/hooks/useCredits";

interface StartProps {
  mode: ModeType;
  handleGameMode: () => void;
  potentialWinnings: string; // New prop for potential winnings
  remainingTime?: string; // New prop for remaining time (optional for Normal mode)
}

export const Start: React.FC<StartProps> = ({
  mode,
  handleGameMode,
  potentialWinnings,
  remainingTime,
}) => {
  const {
    master,
    setup: {
      systemCalls: { start },
    },
  } = useDojo();

  const { account } = useAccountCustom();

  const { player } = usePlayer({ playerId: account?.address });
  const { credits } = useCredits({ playerId: account?.address });

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
        price: 5000000000000000n, // 0.0005 ETH
        seed,
        x: proof_gamma_x,
        y: proof_gamma_y,
        c: proof_c,
        s: proof_s,
        sqrt_ratio_hint: proof_verify_hint,
        beta: beta,
      });
      handleGameMode();
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
      (!!game && !game.isOver())
    );
  }, [account, master, player, game]);

  const cost = useMemo(() => {
    if (player && credits && credits.get_remaining(Date.now() / 1000) > 0)
      return "Free";
    return "0.0005 ETH"; //TODO: replace with actual cost
  }, [player, credits]);

  return (
    <div className=" p-4 rounded-lg shadow-lg w-full h-full bg-gray-900 m-2">
      <h2 className="text-2xl font-bold mb-2">
        {mode === ModeType.Daily ? "Daily Mode" : "Normal Mode"}
      </h2>
      <p className="text-lg">
        <strong>Potential Winnings:</strong> {potentialWinnings}
      </p>
      <p className="text-lg">
        <strong>Price:</strong> {cost}
      </p>
      {remainingTime && (
        <p className="text-lg text-red-500">
          <strong>Remaining Time:</strong> {remainingTime}
        </p>
      )}
      <Button
        disabled={isLoading || disabled}
        isLoading={isLoading}
        onClick={handleClick}
        className="text-xl mt-4 w-full transition-transform duration-300 ease-in-out hover:scale-105"
      >
        Play
      </Button>
    </div>
  );
};

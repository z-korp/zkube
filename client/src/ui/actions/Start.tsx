import { useDojo } from "@/dojo/useDojo";
import { useCallback, useMemo, useState } from "react";
import { Account } from "starknet";
import { Button } from "@/ui/elements/button";
import { useGame } from "@/hooks/useGame";
import { usePlayer } from "@/hooks/usePlayer";
import { fetchVrfData } from "@/api/vrf";
import { Mode, ModeType } from "@/dojo/game/types/mode";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useSettings } from "@/hooks/useSettings";
import { createFaucetClaimHandler } from "@/utils/faucet";
import { useContract } from "@starknet-react/core";
import { erc20ABI } from "@/utils/erc20";
import { useCredits } from "@/hooks/useCredits";

interface BalanceData {
  balance: {
    low: bigint;
  };
}

const { VITE_PUBLIC_GAME_TOKEN_ADDRESS } = import.meta.env;

interface StartProps {
  mode: ModeType;
  handleGameMode: () => void;
}

export const Start: React.FC<StartProps> = ({ mode, handleGameMode }) => {
  const {
    master,
    setup: {
      systemCalls: { start },
    },
  } = useDojo();

  const { account } = useAccountCustom();
  const { player } = usePlayer({ playerId: account?.address });
  const { credits } = useCredits({ playerId: account?.address });
  const { settings } = useSettings();
  const { contract } = useContract({
    abi: erc20ABI,
    address: VITE_PUBLIC_GAME_TOKEN_ADDRESS,
  });

  const { game } = useGame({
    gameId: player?.game_id || "0x0",
  });

  const [isLoading, setIsLoading] = useState(false);

  const disabled = useMemo(() => {
    return (
      !account ||
      !master ||
      account === master ||
      !player ||
      (!!game && !game.isOver())
    );
  }, [account, master, player, game]);

  const handleClick = useCallback(async () => {
    console.log(
      "Starting game 1 ",
      account?.address,
      credits === null,
      settings === null,
      contract === undefined,
    );
    if (credits === null) return;
    if (settings === null) return;
    if (contract === undefined) return;
    if (!account?.address) return;

    console.log("Starting game");

    setIsLoading(true);

    // Check if the user has any remaining credits
    // If not, check if the user has enough balance to claim from the faucet
    if (credits.remaining === 0) {
      try {
        const balance = (await contract.call("balanceOf", [
          account?.address,
        ])) as BalanceData;
        if (balance.balance.low < settings.normal_mode_price) {
          console.log("Not enough balance, trying to claim faucet");

          await createFaucetClaimHandler(account as Account, contract, () => {
            return;
          })();
        }
      } catch (error) {
        console.error("Error claiming from faucet:", error);
      }
    }

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
        price:
          mode === ModeType.Daily
            ? settings.daily_mode_price
            : settings.normal_mode_price,
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
  }, [account, mode, settings, credits]);

  return (
    <Button
      disabled={isLoading || disabled}
      isLoading={isLoading}
      onClick={handleClick}
      className="text-sm sm:text-xl w-full transition-transform duration-300 ease-in-out hover:scale-105"
    >
      Play
    </Button>
  );
};

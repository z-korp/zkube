import { useDojo } from "@/dojo/useDojo";
import { useCallback, useState } from "react";
import { Button } from "@/ui/elements/button";
import useAccountCustom from "@/hooks/useAccountCustom";
import { showToast } from "@/utils/toast";
import { useControllerUsername } from "@/hooks/useControllerUsername";

type PlayFreeGameProps = {
  onMintSuccess?: () => void | Promise<void>;
};

export const PlayFreeGame = ({ onMintSuccess }: PlayFreeGameProps) => {
  const {
    setup: {
      systemCalls: { freeMint, create },
    },
  } = useDojo();
  const { account } = useAccountCustom();
  const { username } = useControllerUsername();

  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (!account) return;

    setIsLoading(true);
    try {
      // Mint a new free game
      const result = await freeMint({
        account,
        name: username ?? "",
        settingsId: 1,
      });

      await create({ account, token_id: result.game_id });

      showToast({
        message: "Game minted! You can resume it from My Games.",
        type: "success",
      });

      onMintSuccess?.();
    } catch (error) {
      console.error("Error minting game:", error);
      showToast({
        message: "Failed to mint game",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [account, create, freeMint, onMintSuccess, username]);

  return (
    <Button
      disabled={isLoading}
      isLoading={isLoading}
      onClick={handleClick}
      variant="default"
      className="text-lg w-[300px] transition-transform duration-300 ease-in-out hover:scale-105"
    >
      Mint Game
    </Button>
  );
};

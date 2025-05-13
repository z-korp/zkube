import { useDojo } from "@/dojo/useDojo";
import { useCallback, useState } from "react";
import { Button } from "@/ui/elements/button";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useMediaQuery } from "react-responsive";
import { showToast } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import { useControllerUsername } from "@/hooks/useControllerUsername";

export const PlayFreeGame = () => {
  const {
    setup: {
      systemCalls: { freeMint, create },
    },
  } = useDojo();

  const navigate = useNavigate();
  const { account } = useAccountCustom();
  const { username } = useControllerUsername();

  const [isLoading, setIsLoading] = useState(false);
  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  const handleClick = useCallback(async () => {
    if (!account) return;

    setIsLoading(true);
    try {
      // Start the game
      const result = await freeMint({
        account,
        name: username ?? "",
        settingsId: 0,
      });

      await create({ account, token_id: result.game_id });

      // Navigate to the game screen with the new game ID
      if (result && result.game_id) {
        navigate(`/play/${result.game_id}`);
      }
    } catch (error) {
      console.error("Error starting game:", error);
      showToast({
        message: "Failed to start game",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [account, create, freeMint, navigate, username]);

  return (
    <Button
      disabled={isLoading}
      isLoading={isLoading}
      onClick={handleClick}
      variant={`${!isMdOrLarger ? "brutal" : "default"}`}
      className={`text-lg w-full transition-transform duration-300 ease-in-out hover:scale-105 ${
        !isMdOrLarger &&
        "py-6 border-4 border-white rounded-none text-white bg-sky-900 shadow-lg font-sans font-bold "
      }`}
    >
      Play !
    </Button>
  );
};

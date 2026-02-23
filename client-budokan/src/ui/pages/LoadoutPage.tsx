import { useCallback, useState } from "react";
import { motion } from "motion/react";
import { useDojo } from "@/dojo/useDojo";
import { DEFAULT_SETTINGS_ID } from "@/dojo/game/types/level";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import useAccountCustom from "@/hooks/useAccountCustom";
import useViewport from "@/hooks/useViewport";
import { useNavigationStore } from "@/stores/navigationStore";
import { showToast } from "@/utils/toast";
import PageTopBar from "@/ui/navigation/PageTopBar";
import GameButton from "@/ui/components/shared/GameButton";

const LoadoutPage: React.FC = () => {
  useViewport();

  const { account } = useAccountCustom();
  const { username } = useControllerUsername();
  const goBack = useNavigationStore((s) => s.goBack);
  const navigate = useNavigationStore((s) => s.navigate);

  const {
    setup: {
      systemCalls: { freeMint, create },
    },
  } = useDojo();

  const [isLoading, setIsLoading] = useState(false);

  const handleStartGame = useCallback(async () => {
    if (!account) return;

    setIsLoading(true);
    try {
      const mintResult = await freeMint({
        account,
        name: username ?? "",
        settingsId: DEFAULT_SETTINGS_ID,
      });

      const gameId = mintResult.game_id;
      if (!gameId) throw new Error("Failed to extract game_id from mint");

      await create({
        account,
        token_id: gameId,
      });

      showToast({
        message: `Game #${gameId} started!`,
        type: "success",
      });

      navigate("map", gameId);
    } catch (error) {
      console.error("Error starting game:", error);
      showToast({
        message: "Failed to start game. Check My Games if a token was minted.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [account, create, freeMint, navigate, username]);

  return (
    <div className="h-screen-viewport flex flex-col text-white">
      <PageTopBar title="START RUN" onBack={goBack} cubeBalance={0n} />

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
        <div className="mx-auto flex max-w-[560px] flex-col gap-4 pb-8">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-emerald-300/25 bg-slate-900/85 px-5 py-6"
          >
            <h2 className="font-['Fredericka_the_Great'] text-3xl text-emerald-200">
              Starting New Run
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Your run now uses the draft and skill tree systems. Press start to
              mint a game token and begin immediately.
            </p>

            <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-xs text-slate-300">
              - Step 1: Mint game token
              <br />- Step 2: Create run
              <br />- Step 3: Enter map
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <GameButton
                label="START GAME"
                variant="primary"
                loading={isLoading}
                onClick={handleStartGame}
              />
              <GameButton
                label="CANCEL"
                variant="secondary"
                disabled={isLoading}
                onClick={goBack}
              />
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default LoadoutPage;

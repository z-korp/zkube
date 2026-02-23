import { motion } from "motion/react";
import { useNavigationStore } from "@/stores/navigationStore";
import PageTopBar from "@/ui/navigation/PageTopBar";
import GameButton from "@/ui/components/shared/GameButton";

const InGameShopPage = () => {
  const goBack = useNavigationStore((s) => s.goBack);
  const navigate = useNavigationStore((s) => s.navigate);

  return (
    <div className="h-screen-viewport flex flex-col text-white">
      <PageTopBar title="IN-GAME SHOP" onBack={goBack} cubeBalance={0n} />

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
        <div className="mx-auto flex max-w-[720px] flex-col gap-4 pb-8">
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-amber-300/25 bg-black/40 px-5 py-5 backdrop-blur-sm"
          >
            <h2 className="font-['Fredericka_the_Great'] text-2xl text-amber-100">
              In-Game Shop Removed
            </h2>
            <p className="mt-2 text-sm text-slate-200">
              Run progression now uses the draft and skill systems. Shop actions
              from prior versions are no longer available.
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <GameButton
                label="GO TO HOME"
                variant="primary"
                onClick={() => navigate("home")}
              />
              <GameButton label="BACK" variant="secondary" onClick={goBack} />
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default InGameShopPage;

import { motion } from "motion/react";
import { useNavigationStore } from "@/stores/navigationStore";
import PageTopBar from "@/ui/navigation/PageTopBar";
import GameButton from "@/ui/components/shared/GameButton";

const ShopPage = () => {
  const goBack = useNavigationStore((s) => s.goBack);
  const navigate = useNavigationStore((s) => s.navigate);

  return (
    <div className="h-screen-viewport flex flex-col text-white">
      <PageTopBar title="SHOP" onBack={goBack} cubeBalance={0n} />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
        <div className="mx-auto flex max-w-[720px] flex-col gap-4 pb-8">
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-slate-900/90 px-5 py-5"
          >
            <h2 className="font-['Fredericka_the_Great'] text-2xl text-amber-100">
              Permanent Shop Removed
            </h2>
            <p className="mt-2 text-sm text-slate-200">
              Iteration 1 removes permanent upgrades and bridging. All bonuses are now available
              from the start of each run.
            </p>
            <p className="mt-3 text-xs text-slate-400">
              Use the in-game shop during runs for temporary and run-specific decisions.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-2 text-xs text-slate-300">
              <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 px-3 py-2">
                - Bridging rank upgrades removed
              </div>
              <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 px-3 py-2">
                - Starting charge and bag upgrades removed
              </div>
              <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 px-3 py-2">
                - Wave and Supply unlock purchases removed
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <GameButton label="GO TO HOME" variant="primary" onClick={() => navigate("home")} />
              <GameButton label="BACK" variant="secondary" onClick={goBack} />
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;

import { useCallback, useMemo, useState } from "react";
import { motion } from "motion/react";

import type { ThemeColors } from "@/config/themes";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useZoneProgress } from "@/hooks/useZoneProgress";
import { useZStarBalance } from "@/hooks/useZStarBalance";
import QuestsTab from "@/ui/components/profile/QuestsTab";

const itemVariants: any = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

interface QuestsRewardsTabProps {
  colors: ThemeColors;
}

const QuestsRewardsTab: React.FC<QuestsRewardsTabProps> = ({ colors }) => {
  const { account } = useAccountCustom();
  const { balance: zStarBalance } = useZStarBalance(account?.address);
  const { zones } = useZoneProgress(account?.address, zStarBalance);
  const {
    setup: { systemCalls },
  } = useDojo();
  const [claimingZone, setClaimingZone] = useState<number | null>(null);

  const perfectZones = useMemo(
    () => zones.filter((z) => z.stars >= 30 && z.cleared && z.unlocked),
    [zones],
  );

  const handleClaimPerfection = useCallback(
    async (zoneId: number) => {
      if (!account || claimingZone) return;
      setClaimingZone(zoneId);
      try {
        await systemCalls.claimPerfection({ account, zone_id: zoneId });
      } catch (error) {
        console.error("Failed to claim perfection:", error);
      } finally {
        setClaimingZone(null);
      }
    },
    [account, claimingZone, systemCalls],
  );

  return (
    <div className="flex flex-col gap-4">
      {perfectZones.length > 0 && (
        <motion.section
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="rounded-2xl border p-3 backdrop-blur-xl"
          style={{ background: "rgba(255,215,0,0.08)", borderColor: "rgba(255,215,0,0.3)" }}
        >
          <p className="mb-2 font-sans text-[12px] font-extrabold uppercase tracking-[0.12em]" style={{ color: "#FFD700" }}>
            Zone Perfection Bonus
          </p>
          <div className="flex flex-col gap-2">
            {perfectZones.map((zone) => (
              <div
                key={zone.zoneId}
                className="flex items-center justify-between rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-3 py-2.5"
              >
                <div>
                  <p className="font-sans text-sm font-bold text-white">{zone.name}</p>
                  <p className="font-sans text-[11px] text-white/60">30/30 stars — perfection!</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleClaimPerfection(zone.zoneId)}
                  disabled={claimingZone === zone.zoneId}
                  className="rounded-full px-3 py-1.5 font-sans text-[11px] font-extrabold uppercase text-[#0a1628] disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #FFD700, #FFA500)",
                    boxShadow: "0 0 12px rgba(255,215,0,0.4)",
                  }}
                >
                  {claimingZone === zone.zoneId ? "Claiming..." : "Claim +20★"}
                </motion.button>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      <QuestsTab colors={colors} />
    </div>
  );
};

export default QuestsRewardsTab;

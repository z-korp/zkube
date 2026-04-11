import { useState } from "react";
import { motion } from "motion/react";

import { getThemeColors } from "@/config/themes";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useClaimableCounts } from "@/hooks/useClaimableCount";
import PageHeader from "@/ui/components/shared/PageHeader";
import Connect from "@/ui/components/Connect";
import DailyTab from "@/ui/components/rewards/DailyTab";
import WeeklyTab from "@/ui/components/rewards/WeeklyTab";
import QuestsRewardsTab from "@/ui/components/rewards/QuestsRewardsTab";

const TABS = ["Quests", "Daily", "Weekly"] as const;

const RewardsPage: React.FC = () => {
  const { themeTemplate } = useTheme();
  const colors = getThemeColors(themeTemplate);
  const { account } = useAccountCustom();
  const claimableCounts = useClaimableCounts();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Quests");

  if (!account) {
    return (
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden pb-[100px] pt-12">
        <PageHeader title="Rewards" />
        <div className="mx-4 mt-2 mb-4 flex flex-1 min-h-0 flex-col items-center justify-center text-center">
          <span className="mb-4 text-6xl opacity-50">🎁</span>
          <p className="mb-6 font-sans text-2xl font-semibold text-white/85">
            Connect to view rewards
          </p>
          <div className="w-full max-w-[320px]">
            <Connect />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden pb-[100px] pt-12">
      <div className="shrink-0 pb-2">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        >
          <PageHeader title="Rewards" />
        </motion.div>
        <div className="mx-6 mt-2 flex rounded-full border border-white/[0.16] bg-white/[0.1] p-1 shadow-[inset_0_2px_8px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          {TABS.map((tab) => {
            const badgeCount = tab === "Quests"
              ? claimableCounts.daily + claimableCounts.weekly
              : tab === "Daily"
                ? claimableCounts.unsettledDaily
                : tab === "Weekly"
                  ? claimableCounts.unsettledWeeklyZones.size
                  : 0;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative flex-1 py-1.5 px-3 rounded-full text-[12px] font-bold transition-colors duration-200 z-10 font-sans tracking-wide uppercase ${
                  activeTab === tab
                    ? "text-white"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="rewards-tab-indicator"
                    className="absolute inset-0 bg-white/20 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] border border-white/[0.08]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-20 drop-shadow-sm">{tab}</span>
                {badgeCount > 0 && (
                  <span className="absolute -top-1 -right-0.5 z-30 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 font-sans text-[10px] font-bold leading-none text-white shadow-md">
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-4 mt-2 mb-4 flex-1 min-h-0 overflow-y-auto hide-scrollbar">
        {activeTab === "Daily" && <DailyTab colors={colors} />}
        {activeTab === "Weekly" && <WeeklyTab colors={colors} />}
        {activeTab === "Quests" && <QuestsRewardsTab colors={colors} />}
      </div>
    </div>
  );
};

export default RewardsPage;

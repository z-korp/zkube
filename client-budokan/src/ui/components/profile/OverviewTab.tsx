import type { ThemeColors } from "@/config/themes";
import { motion } from "motion/react";
import { Wallet } from "lucide-react";

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export interface WalletBalance {
  label: string;
  symbol: string;
  amount: string;
  usdcValue: number;
  icon: string;
}

interface OverviewTabProps {
  colors: ThemeColors;
  totalGames: number;
  totalLines: number;
  combo4Count: number;
  totalBosses: number;
  walletBalances: WalletBalance[];
  onFundAccount: () => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  colors,
  totalGames,
  totalLines,
  combo4Count,
  totalBosses,
  walletBalances,
  onFundAccount,
}) => {
  const stats = [
    { label: "Games", value: totalGames.toLocaleString() },
    { label: "4+ Combos", value: combo4Count > 0 ? combo4Count.toLocaleString() : "--" },
    { label: "Lines", value: totalLines > 0 ? totalLines.toLocaleString() : "--" },
    { label: "Guardians", value: totalBosses > 0 ? totalBosses.toLocaleString() : "--" },
  ];

  const totalUsdcValue = walletBalances.reduce((sum, b) => sum + b.usdcValue, 0);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-4 pb-2">

      <section>
        <motion.div variants={itemVariants} className="mb-2 flex items-center justify-between">
          <p className="font-sans text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: colors.textMuted }}>
            Wallet
          </p>
          <p className="font-sans text-[12px] font-black" style={{ color: colors.accent }}>
            ~${totalUsdcValue.toFixed(2)}
          </p>
        </motion.div>

        <div className="flex flex-col gap-2">
          {walletBalances.map((b) => (
            <motion.div
              variants={itemVariants}
              key={b.symbol}
              className="flex items-center justify-between rounded-2xl border px-3 py-2.5 backdrop-blur-xl"
              style={{ background: "rgba(255,255,255,0.08)", borderColor: colors.border }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{b.icon}</span>
                <p className="font-sans text-[13px] font-bold" style={{ color: colors.text }}>{b.label}</p>
              </div>
              <p className="font-sans text-[15px] font-black tabular-nums" style={{ color: colors.accent }}>
                {b.amount} <span className="text-xs font-semibold" style={{ color: colors.textMuted }}>{b.symbol}</span>
              </p>
            </motion.div>
          ))}
        </div>

        <motion.button
          variants={itemVariants}
          type="button"
          onClick={onFundAccount}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 font-sans text-[12px] font-bold uppercase tracking-[0.08em] transition-colors hover:bg-white/[0.06]"
          style={{ borderColor: `${colors.accent}55`, color: colors.accent }}
        >
          <Wallet size={14} />
          Fund Account
        </motion.button>
      </section>

      <section>
        <motion.p variants={itemVariants} className="mb-2 font-sans text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: colors.textMuted }}>
          Stats
        </motion.p>
        <div className="grid grid-cols-2 gap-2.5">
          {stats.map((stat) => (
            <motion.div
              variants={itemVariants}
              key={stat.label}
              className="rounded-2xl px-3 py-3 text-center backdrop-blur-xl"
              style={{ background: "rgba(255,255,255,0.1)", border: `1px solid ${colors.border}` }}
            >
              <p className="font-sans text-2xl font-black" style={{ color: colors.text }}>
                {stat.value}
              </p>
              <p className="font-sans text-xs font-semibold" style={{ color: colors.textMuted }}>
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};

export default OverviewTab;

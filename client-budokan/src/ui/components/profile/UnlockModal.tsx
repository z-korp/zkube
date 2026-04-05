import type { ThemeColors } from "@/config/themes";
import type { ZoneProgressData } from "@/config/profileData";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import ProgressBar from "@/ui/components/shared/ProgressBar";
import ArcadeButton from "@/ui/components/shared/ArcadeButton";
import { formatUsdcAmount } from "@/utils/payment";
import { X } from "lucide-react";

interface UnlockModalProps {
  colors: ThemeColors;
  zone: ZoneProgressData;
  onClose: () => void;
}

const UnlockModal: React.FC<UnlockModalProps> = ({ colors, zone, onClose }) => {
  const {
    setup: { systemCalls, client },
  } = useDojo();
  const { account } = useAccountCustom();

  const settingsId = zone.settingsId;
  const starCost = zone.starCost ?? 1;
  const currentStars = zone.currentStars ?? 0;
  const discount = Math.min(100, Math.floor((currentStars / starCost) * 100));
  const basePriceRaw = zone.price ?? 0n;
  const finalPriceRaw = BigInt(
    Math.max(0, Math.floor((Number(basePriceRaw) * (100 - discount)) / 100)),
  );
  const basePrice = formatUsdcAmount(basePriceRaw);
  const finalPrice = formatUsdcAmount(finalPriceRaw);
  const starsRemaining = Math.max(starCost - currentStars, 0);
  const canUnlockWithStars = currentStars >= starCost;

  const handleUnlockWithStars = async () => {
    if (!account) return;

    try {
      const unlockWithStars = (
        systemCalls as {
          unlockWithStars?: (args: {
            account: typeof account;
            settings_id: number;
          }) => Promise<unknown>;
        }
      ).unlockWithStars;

      if (unlockWithStars) {
        await unlockWithStars({ account, settings_id: settingsId });
      } else if (client.config) {
        await client.config.unlock_with_stars({ account, settings_id: settingsId });
      }
      onClose?.();
    } catch (error) {
      console.error("Failed to unlock with stars:", error);
    }
  };

  const handlePurchaseMap = async () => {
    if (!account) return;

    try {
      await systemCalls.purchaseMap({ account, settings_id: settingsId });
      onClose?.();
    } catch (error) {
      console.error("Failed to purchase map:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-2 md:items-center md:p-6">
      <button
        type="button"
        aria-label="Close unlock modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-md"
      />

      <div
        className="relative w-full max-w-[980px] rounded-3xl border border-white/[0.2] bg-slate-950/92 px-4 pb-5 pt-4 shadow-[0_30px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl md:px-6 md:pb-6"
        style={{
          background: `linear-gradient(180deg, ${colors.backgroundGradientStart}F2, ${colors.background}F0)`,
        }}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-black/25 text-white/80"
        >
          <X size={16} />
        </button>

        <div className="mb-3 flex justify-center md:hidden">
          <div className="h-1 w-10 rounded bg-white/20" />
        </div>

        <div className="mb-4 flex items-center gap-3">
          <span className="text-[32px] md:text-[38px]">{zone.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="font-sans text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: colors.accent }}>
              Unlock Zone
            </p>
            <p className="truncate font-display text-2xl font-black text-white md:text-3xl">{zone.name}</p>
            <p className="font-sans text-sm font-semibold text-white/70">10 levels · Boss battle · Endless mode</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr] md:gap-4">
          <section
            className="rounded-2xl border border-white/[0.14] bg-white/[0.06] p-4 backdrop-blur-xl"
            style={{ boxShadow: `inset 0 0 12px ${colors.accent2}1F` }}
          >
            <p className="mb-2 font-sans text-xs font-bold uppercase tracking-[0.12em]" style={{ color: colors.accent2 }}>
              Earn It
            </p>
            <p className="font-sans text-3xl font-black leading-none" style={{ color: colors.accent2 }}>
              {starCost}★
            </p>
            <p className="mb-3 mt-1 font-sans text-sm font-semibold text-white/70">Stars required</p>

            <ProgressBar value={currentStars} max={starCost} color={colors.accent2} height={8} glow />
            <p className="mt-2 font-sans text-sm font-bold" style={{ color: colors.accent2 }}>
              {currentStars}/{starCost}★
            </p>
            <p className="mt-0.5 font-sans text-sm text-white/70">
              {starsRemaining} stars to go
            </p>

            {canUnlockWithStars ? (
              <div className="mt-3">
                <ArcadeButton onClick={handleUnlockWithStars}>Unlock Free</ArcadeButton>
              </div>
            ) : (
              <p className="mt-3 font-sans text-sm font-semibold text-white/65">
                Keep playing story levels to collect stars.
              </p>
            )}
          </section>

          <div className="hidden items-center justify-center md:flex">
            <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-white/50">OR</span>
          </div>

          <section
            className="rounded-2xl border border-white/[0.14] bg-white/[0.06] p-4 backdrop-blur-xl"
            style={{ boxShadow: `inset 0 0 12px ${colors.accent}1F` }}
          >
            <p className="mb-2 font-sans text-xs font-bold uppercase tracking-[0.12em]" style={{ color: colors.accent }}>
              Buy with USDC
            </p>

            {discount > 0 && (
              <p className="font-sans text-sm font-semibold text-white/50 line-through">
                {basePrice} USDC
              </p>
            )}

            <p className="font-sans text-3xl font-black leading-none" style={{ color: colors.accent }}>
              {finalPrice} USDC
            </p>

            {discount > 0 ? (
              <p className="mt-1 inline-flex rounded-full bg-pink-500/25 px-2 py-0.5 font-sans text-xs font-bold text-pink-200">
                {discount}% discount from stars
              </p>
            ) : (
              <p className="mt-1 font-sans text-sm text-white/70">Price lowers as you collect stars.</p>
            )}

            <div className="mt-4">
              <ArcadeButton onClick={handlePurchaseMap}>Buy Now</ArcadeButton>
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-2xl border border-white/[0.1] bg-white/[0.04] p-3">
          <p className="mb-2 font-sans text-xs font-bold uppercase tracking-[0.12em] text-white/70">
            Star Discount Scale
          </p>

          <div className="mb-1.5 grid grid-cols-10 gap-1">
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map((pct) => {
              const active = discount >= pct;
              return (
                <div
                  key={pct}
                  className="h-3 rounded-full"
                  style={{ background: active ? `${colors.accent}A6` : "rgba(255,255,255,0.08)" }}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-white/65">
            <span>0★ = full price</span>
            <span style={{ color: colors.accent }}>90%★ = 90% off</span>
          </div>
        </section>
      </div>
    </div>
  );
};

export default UnlockModal;

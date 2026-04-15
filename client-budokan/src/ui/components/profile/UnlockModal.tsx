import { useState } from "react";
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

const DISCOUNT_TIERS = [0, 10, 20, 30, 40, 50] as const;

const UnlockModal: React.FC<UnlockModalProps> = ({ colors, zone, onClose }) => {
  const {
    setup: { systemCalls, client },
  } = useDojo();
  const { account } = useAccountCustom();

  const settingsId = zone.settingsId;
  const starCost = zone.starCost ?? 1;
  const currentStars = zone.currentStars ?? 0;
  const basePriceRaw = zone.price ?? 0n;
  const canUnlockWithStars = currentStars >= starCost;

  const [selectedDiscount, setSelectedDiscount] = useState<number>(() => {
    // Default to the max discount the user can afford
    let maxAffordable = 0;
    for (const tier of DISCOUNT_TIERS) {
      const starsNeeded = Math.ceil((tier * starCost) / 100);
      if (currentStars >= starsNeeded) maxAffordable = tier;
    }
    return maxAffordable;
  });

  const starsForDiscount = Math.ceil((selectedDiscount * starCost) / 100);
  const finalPriceRaw = BigInt(
    Math.max(0, Math.floor((Number(basePriceRaw) * (100 - selectedDiscount)) / 100)),
  );
  const basePrice = formatUsdcAmount(basePriceRaw);
  const finalPrice = formatUsdcAmount(finalPriceRaw);
  const starsRemaining = Math.max(starCost - currentStars, 0);

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
        await client.config.unlock_zone_with_stars({ account, settings_id: settingsId });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 pb-[110px] pt-3 md:p-6">
      <button
        type="button"
        aria-label="Close unlock modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-md"
      />

      <div
        className="relative max-h-full w-full max-w-[980px] overflow-y-auto rounded-3xl border border-white/[0.2] bg-slate-950/92 px-4 pb-4 pt-4 shadow-[0_30px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl md:px-6 md:pb-6"
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
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr] md:gap-4">
          <section
            className="flex flex-col rounded-2xl border border-white/[0.14] bg-white/[0.06] p-4 backdrop-blur-xl"
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

            <div className="mt-auto pt-3">
              {canUnlockWithStars ? (
                <ArcadeButton onClick={handleUnlockWithStars}>Unlock Free</ArcadeButton>
              ) : (
                <p className="font-sans text-sm font-semibold text-white/65">
                  Keep playing story levels to collect stars.
                </p>
              )}
            </div>
          </section>

          <div className="hidden items-center justify-center md:flex">
            <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-white/50">OR</span>
          </div>

          <section
            className="flex flex-col rounded-2xl border border-white/[0.14] bg-white/[0.06] p-4 backdrop-blur-xl"
            style={{ boxShadow: `inset 0 0 12px ${colors.accent}1F` }}
          >
            <p className="mb-2 font-sans text-xs font-bold uppercase tracking-[0.12em]" style={{ color: colors.accent }}>
              Buy with USDC
            </p>

            {selectedDiscount > 0 && (
              <p className="font-sans text-sm font-semibold text-white/50 line-through">
                {basePrice} USDC
              </p>
            )}

            <p className="font-sans text-3xl font-black leading-none" style={{ color: colors.accent }}>
              {finalPrice} USDC
            </p>

            {selectedDiscount > 0 ? (
              <p className="mt-1 inline-flex rounded-full bg-pink-500/25 px-2 py-0.5 font-sans text-xs font-bold text-pink-200">
                {selectedDiscount}% discount · {starsForDiscount}★ burned
              </p>
            ) : (
              <p className="mt-1 font-sans text-sm text-white/70">Use stars below to lower the price.</p>
            )}

            <div className="mt-3 rounded-xl border border-white/[0.1] bg-white/[0.04] p-3">
              <p className="mb-2 font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-white/70">
                Star Discount
              </p>
              <div className="flex gap-1.5">
                {DISCOUNT_TIERS.map((tier) => {
                  const starsNeeded = Math.ceil((tier * starCost) / 100);
                  const canAfford = currentStars >= starsNeeded;
                  const isActive = selectedDiscount === tier;

                  return (
                    <button
                      key={tier}
                      type="button"
                      disabled={!canAfford}
                      onClick={() => setSelectedDiscount(tier)}
                      className="flex-1 rounded-lg py-1.5 text-center font-sans text-[11px] font-bold transition-all"
                      style={{
                        background: isActive ? `${colors.accent}33` : canAfford ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                        border: isActive ? `1.5px solid ${colors.accent}` : "1.5px solid transparent",
                        color: isActive ? colors.accent : canAfford ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)",
                        cursor: canAfford ? "pointer" : "not-allowed",
                      }}
                    >
                      {tier}%
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 font-sans text-[10px] text-white/50">
                {selectedDiscount > 0
                  ? `Burns ${starsForDiscount} of your ${currentStars}★`
                  : "Select a tier to burn stars for a discount"}
              </p>
            </div>

            <div className="mt-auto pt-3">
              <ArcadeButton onClick={handlePurchaseMap}>Buy Now</ArcadeButton>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default UnlockModal;

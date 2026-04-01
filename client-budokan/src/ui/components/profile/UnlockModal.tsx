import type { ThemeColors } from "@/config/themes";
import type { ZoneProgressData } from "@/config/profileData";
import ProgressBar from "@/ui/components/shared/ProgressBar";

interface UnlockModalProps {
  colors: ThemeColors;
  zone: ZoneProgressData;
  onClose: () => void;
}

const UnlockModal: React.FC<UnlockModalProps> = ({ colors, zone, onClose }) => {
  const starCost = zone.starCost ?? 1;
  const currentStars = zone.currentStars ?? 0;
  const basePrice = zone.ethPrice ?? 0;
  const discount = Math.min(100, Math.floor((currentStars / starCost) * 100));
  const finalPrice = (basePrice * (1 - discount / 100)).toFixed(4);
  const starPercent = Math.min(100, Math.floor((currentStars / starCost) * 100));

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close unlock modal"
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      />

      <div
        className="relative rounded-t-[20px] px-[18px] pb-7 pt-5"
        style={{
          background: `linear-gradient(180deg, ${colors.backgroundGradientStart}, ${colors.background})`,
          border: `1px solid ${colors.border}`,
          borderBottom: "none",
        }}
      >
        <div className="mb-3 flex justify-center">
          <div className="h-1 w-9 rounded bg-white/15" />
        </div>

        <div className="mb-4 flex items-center gap-2.5">
          <span className="text-[32px]">{zone.emoji}</span>
          <div>
            <p
              className="font-['DM_Sans'] text-[8px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: colors.accent }}
            >
              Unlock Zone
            </p>
            <p className="font-display text-lg font-black" style={{ color: colors.text }}>
              {zone.name}
            </p>
            <p className="font-['DM_Sans'] text-[9px]" style={{ color: colors.textMuted }}>
              10 levels · Boss battle · Endless mode
            </p>
          </div>
        </div>

        <div className="mb-3.5 h-px" style={{ background: colors.border }} />

        <div className="mb-3.5 flex gap-2">
          <div
            className="relative flex flex-1 flex-col items-center overflow-hidden rounded-[14px] px-2.5 py-3"
            style={{ background: `${colors.accent2}14`, border: `1px solid ${colors.accent2}33` }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: `linear-gradient(90deg, transparent, ${colors.accent2}66, transparent)`,
              }}
            />
            <p
              className="mb-2 font-['DM_Sans'] text-[9px] font-bold uppercase tracking-[0.15em]"
              style={{ color: colors.accent2 }}
            >
              Earn It
            </p>
            <span className="mb-0.5 text-2xl">⭐</span>
            <p className="font-display text-xl font-black" style={{ color: colors.accent2 }}>
              {starCost}
            </p>
            <p className="mb-2 font-['DM_Sans'] text-[8px]" style={{ color: colors.textMuted }}>
              stars required
            </p>

            <div className="w-full">
              <ProgressBar value={currentStars} max={starCost} color={colors.accent2} height={5} glow />
            </div>
            <p className="mt-1 font-display text-[9px] font-bold" style={{ color: colors.accent2 }}>
              {currentStars}/{starCost}
            </p>
            <p className="mt-0.5 font-['DM_Sans'] text-[7px]" style={{ color: colors.textMuted }}>
              {Math.max(starCost - currentStars, 0)} more to go
            </p>

            {currentStars >= starCost ? (
              <button
                type="button"
                className="mt-2 w-full rounded-lg py-2 font-display text-[10px] font-extrabold tracking-[0.05em]"
                style={{ background: colors.accent2, color: colors.background }}
              >
                UNLOCK FREE
              </button>
            ) : (
              <p className="mt-2 text-center font-['DM_Sans'] text-[8px]" style={{ color: colors.textMuted }}>
                Keep playing to earn stars
              </p>
            )}
          </div>

          <div className="flex flex-col items-center justify-center px-0.5">
            <div className="w-px flex-1 bg-white/10" />
            <p className="py-1.5 font-['DM_Sans'] text-[9px] font-bold" style={{ color: colors.textMuted }}>
              OR
            </p>
            <div className="w-px flex-1 bg-white/10" />
          </div>

          <div
            className="relative flex flex-1 flex-col items-center overflow-hidden rounded-[14px] px-2.5 py-3"
            style={{ background: `${colors.accent}14`, border: `1px solid ${colors.accent}33` }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: `linear-gradient(90deg, transparent, ${colors.accent}66, transparent)`,
              }}
            />
            <p
              className="mb-2 font-['DM_Sans'] text-[9px] font-bold uppercase tracking-[0.15em]"
              style={{ color: colors.accent }}
            >
              Skip Ahead
            </p>
            <span className="mb-0.5 text-2xl">◆</span>

            {discount > 0 ? (
              <>
                <p
                  className="font-display text-[11px] font-semibold"
                  style={{ color: colors.textMuted, textDecoration: "line-through" }}
                >
                  {basePrice} ETH
                </p>
                <p className="font-display text-xl font-black" style={{ color: colors.accent }}>
                  {finalPrice}
                </p>
              </>
            ) : (
              <p className="font-display text-xl font-black" style={{ color: colors.accent }}>
                {basePrice}
              </p>
            )}
            <p className="mb-1 font-['DM_Sans'] text-[8px]" style={{ color: colors.textMuted }}>
              ETH
            </p>

            {discount > 0 && (
              <span
                className="mb-1 rounded px-1.5 py-[2px] font-display text-[9px] font-extrabold tracking-[0.03em] text-white"
                style={{ background: "linear-gradient(135deg, #FF6B8A, rgba(255,107,138,0.85))" }}
              >
                {discount}% OFF
              </span>
            )}

            <p className="mb-1 text-center font-['DM_Sans'] text-[7px] leading-[1.4]" style={{ color: colors.textMuted }}>
              {discount > 0 ? `Your ${currentStars}★ saved you ${discount}%` : "Price drops as you earn stars"}
            </p>

            <button
              type="button"
              className="mt-auto w-full rounded-lg py-2 font-display text-[10px] font-extrabold tracking-[0.05em]"
              style={{
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}CC)`,
                color: colors.background,
                boxShadow: `0 0 16px ${colors.accent}66`,
              }}
            >
              BUY NOW
            </button>
          </div>
        </div>

        <div
          className="rounded-[10px] px-3 py-2.5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p
            className="mb-2 font-['DM_Sans'] text-[8px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: colors.textMuted }}
          >
            Star Discount Scale
          </p>
          <div className="mb-1.5 flex h-9 items-end gap-[3px]">
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map((pct, index) => {
              const active = starPercent >= pct;
              const current = starPercent >= pct && starPercent < pct + 10;

              return (
                <div
                  key={pct}
                  className="relative flex-1 rounded-sm"
                  style={{
                    height: `${30 + index * 7}%`,
                    background: active
                      ? current
                        ? "linear-gradient(180deg, #FF6B8A, rgba(255,107,138,0.55))"
                        : `${colors.accent}66`
                      : "rgba(255,255,255,0.05)",
                  }}
                >
                  {current && (
                    <span
                      className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap font-display text-[7px] font-bold"
                      style={{ color: "#FF6B8A" }}
                    >
                      YOU
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <span className="font-['DM_Sans'] text-[7px]" style={{ color: colors.textMuted }}>
              0★ = Full price
            </span>
            <span className="font-['DM_Sans'] text-[7px]" style={{ color: colors.accent }}>
              90%★ = 90% off
            </span>
          </div>
          <p className="mt-1.5 text-center font-['DM_Sans'] text-[8px] font-semibold" style={{ color: colors.accent2 }}>
            100% stars = FREE unlock · Every star counts toward a discount
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnlockModal;

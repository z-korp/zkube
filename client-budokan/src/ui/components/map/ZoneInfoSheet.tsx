import { motion } from "motion/react";
import { X } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { getMutatorDef } from "@/config/mutatorConfig";
import { ZONE_NAMES } from "@/config/profileData";
import { getThemeColors, getThemeImages, type ThemeId } from "@/config/themes";
import { getZoneGuardian } from "@/config/bossCharacters";

interface ZoneInfoSheetProps {
  zoneId: number;
  onClose: () => void;
}

const ZoneInfoSheet: React.FC<ZoneInfoSheetProps> = ({ zoneId, onClose }) => {
  const settingsId = (zoneId - 1) * 2;
  const { settings } = useSettings(settingsId);

  const zoneName = ZONE_NAMES[zoneId] ?? `Zone ${zoneId}`;
  const themeId = `theme-${zoneId}` as ThemeId;
  const colors = getThemeColors(themeId);
  const images = getThemeImages(themeId);

  const activeMutator = settings.activeMutatorId > 0 ? getMutatorDef(settings.activeMutatorId) : null;
  const passiveMutator = settings.passiveMutatorId > 0 ? getMutatorDef(settings.passiveMutatorId) : null;
  const guardian = getZoneGuardian(zoneId);

  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-end justify-center bg-black/65 backdrop-blur-sm px-3 pb-4 md:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/20 shadow-2xl backdrop-blur-xl"
        style={{ background: `linear-gradient(180deg, ${colors.backgroundGradientStart ?? "#0a1628"}F0, ${colors.background ?? "#050a12"}F5)` }}
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Zone hero header */}
        <div className="relative h-24 overflow-hidden">
          <img src={images.background} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white/70 backdrop-blur-md"
          >
            <X size={14} />
          </button>
          <div className="absolute bottom-3 left-4">
            <p className="font-display text-xl font-black text-white drop-shadow-md">{zoneName}</p>
          </div>
        </div>

        <div className="px-4 py-3 space-y-3">
          {/* Guardian greeting */}
          <div className="rounded-xl bg-white/[0.04] px-3 py-2.5">
            <p className="font-sans text-[12px] italic text-white/70 leading-relaxed">
              "{guardian.greeting}"
            </p>
            <p className="mt-1 text-right font-sans text-[10px] font-bold" style={{ color: colors.accent }}>
              — {guardian.name}, {guardian.title}
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex gap-2">
            <div className="flex-1 rounded-xl bg-white/[0.06] px-3 py-2 text-center">
              <p className="font-sans text-lg font-black" style={{ color: colors.accent }}>10</p>
              <p className="font-sans text-[10px] font-semibold text-white/50">Levels</p>
            </div>
            <div className="flex-1 rounded-xl bg-white/[0.06] px-3 py-2 text-center">
              <p className="font-sans text-lg font-black" style={{ color: colors.accent }}>{settings.baseMoves}–{settings.maxMoves}</p>
              <p className="font-sans text-[10px] font-semibold text-white/50">Moves</p>
            </div>
            <div className="flex-1 rounded-xl bg-white/[0.06] px-3 py-2 text-center">
              <p className="font-sans text-lg font-black" style={{ color: colors.accent }}>30</p>
              <p className="font-sans text-[10px] font-semibold text-white/50">Max ★</p>
            </div>
          </div>

          {/* Mutators */}
          {(activeMutator || passiveMutator) && (
            <div className="space-y-1.5">
              <p className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">Mutators</p>
              {activeMutator && (
                <div className="rounded-xl border border-orange-400/20 bg-orange-500/8 px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{activeMutator.icon}</span>
                    <span className="font-sans text-[12px] font-bold text-orange-300">{activeMutator.name}</span>
                    <span className="rounded-full bg-orange-500/20 px-1.5 py-0.5 font-sans text-[8px] font-bold uppercase text-orange-300/80">Active</span>
                  </div>
                  {activeMutator.effects.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {activeMutator.effects.map((e) => (
                        <span key={e} className="rounded-full bg-orange-500/10 px-1.5 py-0.5 font-sans text-[9px] font-semibold text-orange-200/70">{e}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {passiveMutator && (
                <div className="rounded-xl border border-purple-400/20 bg-purple-500/8 px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{passiveMutator.icon}</span>
                    <span className="font-sans text-[12px] font-bold text-purple-300">{passiveMutator.name}</span>
                    <span className="rounded-full bg-purple-500/20 px-1.5 py-0.5 font-sans text-[8px] font-bold uppercase text-purple-300/80">Passive</span>
                  </div>
                  {passiveMutator.effects.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {passiveMutator.effects.map((e) => (
                        <span key={e} className="rounded-full bg-purple-500/10 px-1.5 py-0.5 font-sans text-[9px] font-semibold text-purple-200/70">{e}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Perfection goal */}
          <div className="rounded-xl border border-pink-400/20 bg-pink-500/8 px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">💎</span>
                <span className="font-sans text-[12px] font-bold text-pink-300">Perfection Bonus</span>
              </div>
              <span className="font-sans text-[12px] font-black text-pink-300">+20★</span>
            </div>
            <p className="mt-0.5 font-sans text-[10px] text-white/50">Earn 3 stars on all 10 levels</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ZoneInfoSheet;

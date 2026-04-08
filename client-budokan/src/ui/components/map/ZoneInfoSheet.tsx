import { motion } from "motion/react";
import { X } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { getMutatorDef } from "@/config/mutatorConfig";
import { ZONE_NAMES } from "@/config/profileData";

interface ZoneInfoSheetProps {
  zoneId: number;
  onClose: () => void;
}

const ZoneInfoSheet: React.FC<ZoneInfoSheetProps> = ({ zoneId, onClose }) => {
  const settingsId = (zoneId - 1) * 2;
  const { settings } = useSettings(settingsId);

  const zoneName = ZONE_NAMES[zoneId] ?? `Zone ${zoneId}`;

  const activeMutator = getDisplayMutator(settings.activeMutatorId, "Active");
  const passiveMutator = getDisplayMutator(settings.passiveMutatorId, "Passive");

  const hasConstraints = settings.constraintsEnabled;
  const constraintStart = settings.constraintStartLevel;

  const difficultyLabel =
    settings.tier1Threshold <= 2
      ? "Ramps up fast!"
      : settings.tier1Threshold <= 4
        ? "Gets harder mid-way"
        : "Slow and steady";

  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/65 backdrop-blur-sm px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-sm rounded-2xl border border-white/20 bg-slate-950/90 p-5 shadow-2xl backdrop-blur-xl"
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-slate-300 transition-colors hover:bg-slate-700/60 hover:text-white"
        >
          <X size={18} />
        </button>

        <h3 className="pr-8 font-display text-xl text-white">
          Zone {zoneId} · {zoneName}
        </h3>

        <div className="mt-4 space-y-3">
            <InfoRow emoji="📏" label="10 Levels + 1 Boss" />
            <InfoRow
              emoji="🎯"
              label={`${settings.baseMoves}–${settings.maxMoves} moves per level`}
            />
            <InfoRow emoji="📈" label={difficultyLabel} />
            {hasConstraints ? (
              <InfoRow
                emoji="🧩"
                label={`Special rules from Level ${constraintStart}`}
              />
            ) : (
              <InfoRow emoji="🧩" label="No special rules" />
            )}
            <div className="space-y-1">
              <InfoRow emoji={activeMutator.icon} label={activeMutator.label} />
              {activeMutator.effects.length > 0 && (
                <div className="ml-9 flex flex-wrap gap-1">
                  {activeMutator.effects.map((e) => (
                    <span key={e} className="rounded-full bg-orange-500/10 px-2 py-0.5 font-sans text-[10px] font-semibold text-orange-200/70">{e}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <InfoRow emoji={passiveMutator.icon} label={passiveMutator.label} />
              {passiveMutator.effects.length > 0 && (
                <div className="ml-9 flex flex-wrap gap-1">
                  {passiveMutator.effects.map((e) => (
                    <span key={e} className="rounded-full bg-purple-500/10 px-2 py-0.5 font-sans text-[10px] font-semibold text-purple-200/70">{e}</span>
                  ))}
                </div>
              )}
            </div>
            <InfoRow emoji="👑" label={settings.bossId > 0 ? `Boss ${settings.bossId} on Level 10` : "Boss on Level 10"} />
        </div>
      </motion.div>
    </motion.div>
  );
};

const getDisplayMutator = (id: number, kind: "Active" | "Passive") => {
  if (id <= 0) {
    return {
      icon: kind === "Active" ? "✨" : "🛡️",
      label: `${kind}: None`,
      effects: [] as string[],
    };
  }

  const mutator = getMutatorDef(id);
  const isKnown = mutator.id !== 0;

  return {
    icon: isKnown ? mutator.icon : kind === "Active" ? "✨" : "🛡️",
    label: `${kind}: ${isKnown ? mutator.name : `Mutator ${id}`}`,
    effects: isKnown ? mutator.effects : [],
  };
};

const InfoRow: React.FC<{ emoji: string; label: string }> = ({
  emoji,
  label,
}) => (
  <div className="flex items-center gap-3 rounded-lg bg-white/[0.04] px-3 py-2">
    <span className="text-lg leading-none">{emoji}</span>
    <span className="font-sans text-sm text-white/90">{label}</span>
  </div>
);

export default ZoneInfoSheet;

import { motion } from "motion/react";
import {
  Check,
  Copy,
  Palette,
  ChevronLeft,
  UserRound,
} from "lucide-react";
import { THEME_IDS, THEME_META, getThemeColors, type ThemeId } from "@/config/themes";
import { useMusicPlayer } from "@/contexts/hooks";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useNavigationStore } from "@/stores/navigationStore";
import PageHeader from "@/ui/components/shared/PageHeader";
import ImageAssets from "@/ui/theme/ImageAssets";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useZoneProgress } from "@/hooks/useZoneProgress";
import { useZStarBalance } from "@/hooks/useZStarBalance";
import { ZONE_THEMES } from "@/hooks/useMapData";
import { useDisconnect } from "@starknet-react/core";
import Connect from "@/ui/components/Connect";
import { useMemo, useState } from "react";

const toPercent = (value: number): number => Math.round(value * 100);

const SettingsPage: React.FC = () => {
  const { themeTemplate, setThemeTemplate } = useTheme();
  const colors = getThemeColors(themeTemplate);
  const goBack = useNavigationStore((s) => s.goBack);
  const { username } = useControllerUsername();
  const { account } = useAccountCustom();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);
  const { balance: zStarBalance } = useZStarBalance(account?.address);
  const { zones } = useZoneProgress(account?.address, zStarBalance);

  const unlockedThemes = useMemo(() => {
    const themeSet = new Set<ThemeId>();
    for (const zone of zones) {
      if (zone.unlocked) {
        const themeId = ZONE_THEMES[zone.zoneId - 1];
        if (themeId) themeSet.add(themeId);
      }
    }
    // Fallback: always include at least theme-1
    if (themeSet.size === 0) themeSet.add("theme-1");
    return THEME_IDS.filter((id) => themeSet.has(id));
  }, [zones]);
  const { musicVolume, effectsVolume, setMusicVolume, setEffectsVolume } =
    useMusicPlayer();

  const truncatedAddress = account?.address
    ? `${account.address.slice(0, 8)}...${account.address.slice(-6)}`
    : "Not connected";

  const handleCopyAddress = async () => {
    if (!account?.address) return;
    try {
      await navigator.clipboard.writeText(account.address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden pb-[100px] pt-12">
      <PageHeader
        title="Settings"
        leftSlot={
          <button
            onClick={goBack}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] shadow-lg backdrop-blur-md transition-all hover:bg-white/[0.08] active:scale-95"
            aria-label="Go Back"
          >
            <ChevronLeft size={20} className="text-white/80" />
          </button>
        }
      />

      <div className="mx-4 mt-2 mb-4 flex-1 min-h-0 overflow-y-auto hide-scrollbar">
        <div className="max-w-[760px] mx-auto flex flex-col gap-4">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl shadow-lg shadow-black/20 p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🎵</span>
              <h2 className="font-display text-lg tracking-wide" style={{ color: colors.text }}>
                AUDIO
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 24 }}
                className="flex items-center gap-3"
              >
                <span className="text-base shrink-0">🎵</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={toPercent(musicVolume)}
                  onChange={(event) =>
                    setMusicVolume(Number(event.target.value) / 100)
                  }
                  className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-white/10"
                  style={{ accentColor: colors.accent }}
                />
                <span className="font-display text-lg tracking-wider w-8 text-right" style={{ color: colors.accent }}>
                  {toPercent(musicVolume)}
                </span>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 24 }}
                className="flex items-center gap-3"
              >
                <span className="text-base shrink-0">🔔</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={toPercent(effectsVolume)}
                  onChange={(event) =>
                    setEffectsVolume(Number(event.target.value) / 100)
                  }
                  className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-white/10"
                  style={{ accentColor: colors.accent2 }}
                />
                <span className="font-display text-lg tracking-wider w-8 text-right" style={{ color: colors.accent2 }}>
                  {toPercent(effectsVolume)}
                </span>
              </motion.div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.04 }}
            className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl shadow-lg shadow-black/20 p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Palette size={18} style={{ color: colors.accent }} />
              <h2 className="font-display text-lg tracking-wide" style={{ color: colors.text }}>
                THEME
              </h2>
            </div>

              <div className="flex flex-wrap gap-2">
              {unlockedThemes.map((themeId, index) => {
                const themeAssets = ImageAssets(themeId);
                const isSelected = themeTemplate === themeId;

                return (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + index * 0.03, type: "spring", stiffness: 300, damping: 24 }}
                    key={themeId}
                    type="button"
                    whileTap={{ scale: 0.93 }}
                    onClick={() => setThemeTemplate(themeId)}
                    title={THEME_META[themeId].name}
                    className={`relative rounded-xl border overflow-hidden transition-colors w-14 h-14 flex items-center justify-center ${
                      isSelected
                        ? "bg-white/10"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"
                    }`}
                    style={{
                      borderColor: isSelected ? colors.accent : undefined,
                    }}
                  >
                    <img
                      src={themeAssets.themeIcon}
                      alt={THEME_META[themeId].name}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                    {isSelected && (
                      <Check
                        size={14}
                        className="absolute bottom-1 right-1 drop-shadow-md"
                        style={{ color: colors.accent }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.08 }}
            className="rounded-2xl border border-white/[0.12] bg-white/[0.08] p-4 backdrop-blur-xl"
          >
            <h3 className="mb-3 flex items-center gap-2 font-sans text-base font-bold text-white">
              <UserRound size={16} style={{ color: colors.accent }} />
              Account
            </h3>

            {account ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2.5">
                  <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.1em] text-white/55">Username</p>
                  <p className="font-sans text-base font-semibold text-white">{username ?? "Controller User"}</p>
                </div>

                <div className="rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.1em] text-white/55">Wallet Address</p>
                      <p className="font-sans text-sm font-semibold text-white/90">{truncatedAddress}</p>
                    </div>
                    <button
                      onClick={handleCopyAddress}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/[0.15] bg-white/[0.08] px-2.5 py-1.5 font-sans text-xs font-semibold text-white/80"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    localStorage.removeItem("sessionSigner");
                    localStorage.removeItem("session");
                    localStorage.removeItem("sessionPolicies");
                    localStorage.removeItem("lastUsedConnector");
                    for (let i = localStorage.length - 1; i >= 0; i--) {
                      const key = localStorage.key(i);
                      if (key?.startsWith("@cartridge/")) localStorage.removeItem(key);
                    }
                    disconnect();
                    window.location.reload();
                  }}
                  className="w-full rounded-xl border border-red-400/35 bg-red-500/15 py-2.5 font-sans text-sm font-bold text-red-300 transition-colors hover:bg-red-500/25"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <Connect />
            )}
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

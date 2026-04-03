import { useState } from "react";
import { motion } from "motion/react";
import {
  Check,
  Copy,
  Palette,
  UserRound,
  ChevronLeft,
} from "lucide-react";
import { useDisconnect } from "@starknet-react/core";
import { THEME_IDS, THEME_META, getThemeColors } from "@/config/themes";
import { useMusicPlayer } from "@/contexts/hooks";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useNavigationStore } from "@/stores/navigationStore";
import GameButton from "@/ui/components/shared/GameButton";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ImageAssets from "@/ui/theme/ImageAssets";

const truncateAddress = (address: string): string => {
  if (address.length <= 14) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
};

const toPercent = (value: number): number => Math.round(value * 100);

const SettingsPage: React.FC = () => {
  const goBack = useNavigationStore((state) => state.goBack);
  const { account } = useAccountCustom();
  const { username } = useControllerUsername();
  const { disconnect } = useDisconnect();
  const { themeTemplate, setThemeTemplate } = useTheme();
  const colors = getThemeColors(themeTemplate);
  const { musicVolume, effectsVolume, setMusicVolume, setEffectsVolume } =
    useMusicPlayer();

  const [copied, setCopied] = useState(false);

  const accountAddress = account?.address;
  const resolvedUsername = username ?? "Controller User";

  const handleCopyAddress = async () => {
    if (!accountAddress) return;

    try {
      await navigator.clipboard.writeText(accountAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="h-screen-viewport flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <button onClick={goBack} className="h-10 w-10 rounded-xl flex items-center justify-center text-white/60 hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-display text-lg font-bold text-white">Settings</h1>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 py-4">
        <div className="max-w-[760px] mx-auto flex flex-col gap-4 pb-[72px]">
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
              {THEME_IDS.map((themeId, index) => {
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
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.08 }}
            className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl shadow-lg shadow-black/20 p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <UserRound size={18} style={{ color: colors.accent2 }} />
              <h2 className="font-display text-lg tracking-wide" style={{ color: colors.text }}>
                ACCOUNT
              </h2>
            </div>

            {accountAddress ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
                  <p className="font-sans text-xs mb-1" style={{ color: colors.textMuted }}>Username</p>
                  <p className="font-sans text-sm font-medium" style={{ color: colors.text }}>{resolvedUsername}</p>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
                  <p className="font-sans text-xs mb-1" style={{ color: colors.textMuted }}>Wallet Address</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-sans text-sm font-medium truncate" style={{ color: colors.text }}>
                      {truncateAddress(accountAddress)}
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      className="inline-flex items-center gap-1 font-sans text-xs transition-colors"
                      style={{ color: copied ? colors.accent : colors.textMuted }}
                      title={copied ? "Copied" : "Copy address"}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <GameButton
                    label="DISCONNECT"
                    variant="danger"
                    onClick={() => disconnect()}
                  />
                </motion.div>
              </div>
            ) : (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 font-sans text-sm" style={{ color: colors.textMuted }}>
                Connect a wallet to manage your account settings.
              </div>
            )}
          </motion.section>


        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

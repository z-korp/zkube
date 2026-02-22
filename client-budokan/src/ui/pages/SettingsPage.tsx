import { useState } from "react";
import { motion } from "motion/react";
import {
  Check,
  Copy,
  Palette,
  UserRound,
} from "lucide-react";
import { useDisconnect } from "@starknet-react/core";
import { THEME_IDS, THEME_META } from "@/config/themes";
import { useMusicPlayer } from "@/contexts/hooks";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useNavigationStore } from "@/stores/navigationStore";
import GameButton from "@/ui/components/shared/GameButton";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import PageTopBar from "@/ui/navigation/PageTopBar";
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
      <PageTopBar title="SETTINGS" onBack={goBack} />

      <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 py-4">
        <div className="max-w-[760px] mx-auto flex flex-col gap-4 pb-20">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="bg-slate-900/80 rounded-xl p-4 border border-slate-600/60"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🎵</span>
              <h2 className="font-['Fredericka_the_Great'] text-lg text-white tracking-wide">
                AUDIO
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
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
                  className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-slate-600 accent-cyan-400"
                />
                <span className="font-['Fredericka_the_Great'] text-cyan-200 text-lg tracking-wider w-8 text-right">
                  {toPercent(musicVolume)}
                </span>
              </div>

              <div className="flex items-center gap-3">
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
                  className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-slate-600 accent-emerald-400"
                />
                <span className="font-['Fredericka_the_Great'] text-emerald-200 text-lg tracking-wider w-8 text-right">
                  {toPercent(effectsVolume)}
                </span>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.04 }}
            className="bg-slate-900/80 rounded-xl p-4 border border-slate-600/60"
          >
            <div className="flex items-center gap-2 mb-3">
              <Palette size={18} className="text-amber-300" />
              <h2 className="font-['Fredericka_the_Great'] text-lg text-white tracking-wide">
                THEME
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {THEME_IDS.map((themeId) => {
                const themeAssets = ImageAssets(themeId);
                const isSelected = themeTemplate === themeId;

                return (
                  <motion.button
                    key={themeId}
                    type="button"
                    whileTap={{ scale: 0.93 }}
                    onClick={() => setThemeTemplate(themeId)}
                    title={THEME_META[themeId].name}
                    className={`relative rounded-xl border overflow-hidden transition-colors w-14 h-14 flex items-center justify-center ${
                      isSelected
                        ? "border-yellow-300 bg-yellow-500/15"
                        : "border-slate-600/70 bg-slate-900/40 hover:border-slate-400"
                    }`}
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
                        className="absolute bottom-1 right-1 text-yellow-200 drop-shadow-md"
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
            className="bg-slate-900/80 rounded-xl p-4 border border-slate-600/60"
          >
            <div className="flex items-center gap-2 mb-3">
              <UserRound size={18} className="text-indigo-300" />
              <h2 className="font-['Fredericka_the_Great'] text-lg text-white tracking-wide">
                ACCOUNT
              </h2>
            </div>

            {accountAddress ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-slate-600/70 bg-slate-900/45 p-3">
                  <p className="text-xs text-slate-400 mb-1">Username</p>
                  <p className="text-white text-sm">{resolvedUsername}</p>
                </div>

                <div className="rounded-lg border border-slate-600/70 bg-slate-900/45 p-3">
                  <p className="text-xs text-slate-400 mb-1">Wallet Address</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-white text-sm truncate">
                      {truncateAddress(accountAddress)}
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      className="inline-flex items-center gap-1 text-xs text-slate-200 hover:text-white"
                      title={copied ? "Copied" : "Copy address"}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <GameButton
                  label="DISCONNECT"
                  variant="danger"
                  onClick={() => disconnect()}
                />
              </div>
            ) : (
              <div className="rounded-lg border border-slate-600/70 bg-slate-900/45 p-4 text-sm text-slate-300">
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

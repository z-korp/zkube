import { useState } from "react";
import { motion } from "motion/react";
import { Check, Copy } from "lucide-react";
import { useDisconnect } from "@starknet-react/core";
import { THEME_META } from "@/config/themes";
import { useMusicPlayer } from "@/contexts/hooks";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ImageAssets from "@/ui/theme/ImageAssets";
import type { ThemeId } from "@/config/themes";

const ZONE_THEMES: { themeId: ThemeId; name: string }[] = [
  { themeId: "theme-1", name: "Polynesian" },
  { themeId: "theme-5", name: "Feudal Japan" },
  { themeId: "theme-7", name: "Ancient Persia" },
];

const truncateAddress = (address: string): string => {
  if (address.length <= 14) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
};

const SettingsPage: React.FC = () => {
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
    <div className="flex h-full flex-col">
      <div className="pt-4 pb-2 px-4">
        <h1 className="font-['Fredericka_the_Great'] text-xl text-white text-center">
          Settings
        </h1>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        <div className="max-w-[500px] mx-auto flex flex-col gap-3">
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/80 rounded-xl p-4 border border-white/10"
          >
            <h2 className="font-['Fredericka_the_Great'] text-sm text-slate-300 tracking-wider mb-3">
              AUDIO
            </h2>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm shrink-0 w-14 text-slate-300">Music</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(musicVolume * 100)}
                  onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
                  className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-cyan-400"
                />
                <span className="font-['Fredericka_the_Great'] text-cyan-200 text-sm w-8 text-right tabular-nums">
                  {Math.round(musicVolume * 100)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm shrink-0 w-14 text-slate-300">Effects</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(effectsVolume * 100)}
                  onChange={(e) => setEffectsVolume(Number(e.target.value) / 100)}
                  className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-emerald-400"
                />
                <span className="font-['Fredericka_the_Great'] text-emerald-200 text-sm w-8 text-right tabular-nums">
                  {Math.round(effectsVolume * 100)}
                </span>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="bg-slate-900/80 rounded-xl p-4 border border-white/10"
          >
            <h2 className="font-['Fredericka_the_Great'] text-sm text-slate-300 tracking-wider mb-3">
              THEME
            </h2>
            <div className="flex gap-2">
              {ZONE_THEMES.map(({ themeId, name }) => {
                const themeAssets = ImageAssets(themeId);
                const isSelected = themeTemplate === themeId;
                return (
                  <motion.button
                    key={themeId}
                    type="button"
                    whileTap={{ scale: 0.93 }}
                    onClick={() => setThemeTemplate(themeId)}
                    title={name}
                    className={`relative rounded-xl border overflow-hidden transition-colors w-20 h-20 flex items-center justify-center ${
                      isSelected
                        ? "border-cyan-400 bg-cyan-500/10 ring-1 ring-cyan-400/30"
                        : "border-slate-600/70 bg-slate-900/40 hover:border-slate-400"
                    }`}
                  >
                    <img
                      src={themeAssets.themeIcon}
                      alt={name}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                    {isSelected && (
                      <Check
                        size={14}
                        className="absolute bottom-1 right-1 text-cyan-300 drop-shadow-md"
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-slate-900/80 rounded-xl p-4 border border-white/10"
          >
            <h2 className="font-['Fredericka_the_Great'] text-sm text-slate-300 tracking-wider mb-3">
              ACCOUNT
            </h2>
            {accountAddress ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-black/30 p-3">
                  <p className="text-[10px] text-slate-400 mb-0.5">Username</p>
                  <p className="text-white text-sm">{resolvedUsername}</p>
                </div>
                <div className="rounded-lg bg-black/30 p-3">
                  <p className="text-[10px] text-slate-400 mb-0.5">Wallet</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-white text-sm truncate">
                      {truncateAddress(accountAddress)}
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white"
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => disconnect()}
                  className="w-full py-2.5 rounded-xl text-sm font-medium bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                >
                  Disconnect
                </motion.button>
              </div>
            ) : (
              <div className="rounded-lg bg-black/30 p-4 text-sm text-slate-400">
                Connect a wallet to manage your account.
              </div>
            )}
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

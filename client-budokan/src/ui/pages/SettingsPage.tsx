import { useState } from "react";
import { motion } from "motion/react";
import { Check, Copy } from "lucide-react";
import { useDisconnect } from "@starknet-react/core";
import { useMusicPlayer } from "@/contexts/hooks";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { getThemeColors, type ThemeId } from "@/config/themes";

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

  const ToggleSwitch = ({
    checked,
    onClick,
  }: {
    checked: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="relative h-[22px] w-10 rounded-full border transition-all"
      style={{
        backgroundColor: checked ? colors.accent : `${colors.textMuted}26`,
        borderColor: checked ? `${colors.accent}80` : colors.border,
      }}
    >
      <span
        className="absolute top-[2px] h-[16px] w-[16px] rounded-full transition-all"
        style={{
          backgroundColor: colors.text,
          left: checked ? 22 : 2,
          boxShadow: colors.glow,
        }}
      />
    </button>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="pt-4 pb-2 px-4">
        <h1 className="font-display text-[18px] font-extrabold text-center" style={{ color: colors.text }}>
          Settings
        </h1>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        <div className="max-w-[500px] mx-auto flex flex-col gap-3">
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="mb-2 text-[10px] uppercase tracking-[0.15em]" style={{ color: colors.textMuted }}>
              ACCOUNT
            </h2>
            <div
              className="rounded-xl border p-3"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              {accountAddress ? (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-xs font-bold" style={{ color: colors.text }}>
                        {resolvedUsername}
                      </p>
                      <p className="mt-0.5 text-[9px]" style={{ color: colors.textMuted }}>
                        {truncateAddress(accountAddress)}
                      </p>
                    </div>
                    <span className="text-[10px]" style={{ color: colors.accent }}>
                      Cartridge ✓
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      className="flex items-center gap-1 rounded-md border px-2 py-1 text-[10px]"
                      style={{ borderColor: colors.border, color: colors.textMuted }}
                    >
                      {copied ? <Check size={11} /> : <Copy size={11} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button
                      type="button"
                      onClick={() => disconnect()}
                      className="rounded-md border px-2 py-1 text-[10px]"
                      style={{ borderColor: `${colors.accent2}80`, color: colors.accent2 }}
                    >
                      Disconnect
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  Connect a wallet to manage your account.
                </p>
              )}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 }}
          >
            <h2 className="mb-2 text-[10px] uppercase tracking-[0.15em]" style={{ color: colors.textMuted }}>
              PREVIEW THEME
            </h2>
            <div className="flex gap-2">
              {ZONE_THEMES.map(({ themeId, name }) => {
                const isSelected = themeTemplate === themeId;
                const dotColor = getThemeColors(themeId).accent;
                return (
                  <button
                    key={themeId}
                    type="button"
                    onClick={() => setThemeTemplate(themeId)}
                    className="flex flex-1 flex-col items-center rounded-xl border px-2 py-2"
                    style={{
                      borderColor: isSelected ? colors.accent : colors.border,
                      backgroundColor: isSelected ? `${colors.accent}26` : colors.surface,
                    }}
                  >
                    <span
                      className="h-5 w-5 rounded-full"
                      style={{ backgroundColor: dotColor }}
                    />
                    <span className="mt-1 text-[8px]" style={{ color: isSelected ? colors.accent : colors.textMuted }}>
                      {name.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
          >
            <h2 className="mb-2 text-[10px] uppercase tracking-[0.15em]" style={{ color: colors.textMuted }}>
              AUDIO
            </h2>
            <div className="space-y-2">
              {[
                {
                  label: "Music",
                  isOn: musicVolume > 0,
                  toggle: () => setMusicVolume(musicVolume > 0 ? 0 : 0.7),
                },
                {
                  label: "Sound Effects",
                  isOn: effectsVolume > 0,
                  toggle: () => setEffectsVolume(effectsVolume > 0 ? 0 : 0.7),
                },
              ].map((audio) => (
                <div
                  key={audio.label}
                  className="flex items-center justify-between rounded-xl border px-3 py-2"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                >
                  <span className="text-sm" style={{ color: colors.text }}>
                    {audio.label}
                  </span>
                  <ToggleSwitch checked={audio.isOn} onClick={audio.toggle} />
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <h2 className="mb-2 text-[10px] uppercase tracking-[0.15em]" style={{ color: colors.textMuted }}>
              ABOUT
            </h2>
            <div
              className="rounded-xl border p-3"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <p className="text-[11px]" style={{ color: colors.text }}>
                zKube v1.0 · Dojo 1.8.0
              </p>
              <p className="mt-1 text-[9px]" style={{ color: colors.textMuted }}>
                Fully on-chain · Starknet
              </p>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

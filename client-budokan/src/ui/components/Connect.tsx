import { useConnect } from "@starknet-react/core";
import { Gamepad2 } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { getThemeColors } from "@/config/themes";

const Connect = () => {
  const { connect, connectors, isPending } = useConnect();
  const { themeTemplate } = useTheme();
  const colors = getThemeColors(themeTemplate);

  const handleConnect = () => {
    // Find the controller connector (primary) or use first available
    const controllerConnector = connectors.find((c) => c.id === "controller");
    const connector = controllerConnector || connectors[0];
    
    if (connector) {
      connect({ connector });
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleConnect}
      disabled={isPending}
      className="flex w-full items-center justify-center gap-3 rounded-2xl px-4 py-4.5 font-display text-[18px] font-black tracking-[0.12em] shadow-xl disabled:opacity-50"
      style={{
        background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}E6)`,
        color: "#0a1628",
        boxShadow: `0 8px 24px -4px ${colors.accent}80, inset 0 2px 0 rgba(255,255,255,0.4)`,
      }}
    >
      <Gamepad2 size={22} strokeWidth={2.5} />
      {isPending ? "CONNECTING..." : "CONNECT TO PLAY"}
    </motion.button>
  );
};

export default Connect;

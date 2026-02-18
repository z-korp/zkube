import { motion } from "motion/react";
import type { MapNodeData, NodeState } from "@/hooks/useMapData";

const STATE_COLORS: Record<
  NodeState,
  { fill: string; border: string; alpha: number; text: string }
> = {
  locked: { fill: "#334155", border: "#475569", alpha: 0.5, text: "#94a3b8" },
  cleared: { fill: "#14532d", border: "#22c55e", alpha: 1, text: "#bbf7d0" },
  current: { fill: "#0f2743", border: "#3b82f6", alpha: 1, text: "#bfdbfe" },
  available: { fill: "#1e293b", border: "#f97316", alpha: 1, text: "#fed7aa" },
  visited: { fill: "#1e3a2f", border: "#4ade80", alpha: 0.85, text: "#bbf7d0" },
};

export interface MapNodeProps {
  node: MapNodeData;
  xPercent: number;
  yPercent: number;
  onTap?: (node: MapNodeData) => void;
}

const isInteractiveState = (state: NodeState): boolean => state !== "locked";

const getLabel = (node: MapNodeData): string => {
  if (node.type === "shop") {
    return node.state === "visited" ? "✓" : "SHOP";
  }
  if (node.type === "boss") {
    return node.state === "cleared" ? "✓" : "★";
  }
  if (node.state === "cleared") {
    return "✓";
  }
  return String(node.contractLevel ?? "");
};

export const MapNode: React.FC<MapNodeProps> = ({ node, xPercent, yPercent, onTap }) => {
  const colors = STATE_COLORS[node.state];
  const isInteractive = isInteractiveState(node.state);
  const label = getLabel(node);

  const nodeBody =
    node.type === "shop" ? (
      <svg viewBox="0 0 52 44" className="h-14 w-16 overflow-visible" aria-hidden>
        <rect
          x={2}
          y={2}
          width={48}
          height={40}
          rx={10}
          fill={colors.fill}
          stroke={colors.border}
          strokeWidth={2.5}
          opacity={colors.alpha}
        />
        <text
          x="26"
          y="26"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={colors.text}
          className="font-['Bangers'] text-[10px] tracking-wider"
        >
          {label}
        </text>
      </svg>
    ) : (
      <svg viewBox="0 0 64 64" className="h-16 w-16 overflow-visible" aria-hidden>
        <circle
          cx="32"
          cy="32"
          r={node.type === "boss" ? 28 : 22}
          fill={colors.fill}
          stroke={colors.border}
          strokeWidth={node.type === "boss" ? 3 : 2.5}
          opacity={colors.alpha}
        />
        <text
          x="32"
          y="34"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={colors.text}
          className="font-['Bangers'] text-base"
        >
          {label}
        </text>
      </svg>
    );

  return (
    <motion.button
      type="button"
      onClick={() => {
        if (isInteractive) onTap?.(node);
      }}
      className={`absolute -translate-x-1/2 -translate-y-1/2 ${isInteractive ? "cursor-pointer" : "cursor-default"}`}
      style={{ left: `${xPercent}%`, top: `${yPercent}%`, opacity: colors.alpha }}
      whileTap={isInteractive ? { scale: 0.94 } : undefined}
      animate={node.state === "current" ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={
        node.state === "current"
          ? { duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
          : { duration: 0.2 }
      }
      disabled={!isInteractive}
    >
      {nodeBody}
      {node.state === "cleared" && (
        <div className="absolute left-1/2 top-[calc(100%+2px)] -translate-x-1/2 text-xs leading-none text-yellow-400">
          {"★".repeat(node.stars || 3)}
        </div>
      )}
    </motion.button>
  );
};

export default MapNode;

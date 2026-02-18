import type { NodeState } from "@/hooks/useMapData";

export interface MapPathProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromState: NodeState;
  toState: NodeState;
}

type PathType = "cleared" | "active" | "locked";

function getPathType(fromState: NodeState, toState: NodeState): PathType {
  if (fromState === "cleared" && (toState === "cleared" || toState === "visited")) {
    return "cleared";
  }
  if (fromState === "cleared" && (toState === "current" || toState === "available")) {
    return "active";
  }
  return "locked";
}

export const MapPath: React.FC<MapPathProps> = ({
  fromX,
  fromY,
  toX,
  toY,
  fromState,
  toState,
}) => {
  const pathType = getPathType(fromState, toState);
  const midY = (fromY + toY) / 2;
  const d = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;

  if (pathType === "cleared") {
    return <path d={d} fill="none" stroke="#22c55e" strokeWidth={4} strokeLinecap="round" opacity={0.85} />;
  }

  if (pathType === "active") {
    return <path d={d} fill="none" stroke="#f97316" strokeWidth={4} strokeLinecap="round" opacity={0.85} />;
  }

  return (
    <path
      d={d}
      fill="none"
      stroke="#6b7280"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeDasharray="8 7"
      opacity={0.45}
    />
  );
};

export default MapPath;

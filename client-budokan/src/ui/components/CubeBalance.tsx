import { useCubeBalance } from "@/hooks/useCubeBalance";
import React from "react";

interface CubeBalanceProps {
  showLabel?: boolean;
  className?: string;
}

const CubeBalance: React.FC<CubeBalanceProps> = ({
  showLabel = true,
  className = "",
}) => {
  const { cubeBalance, isLoading, error } = useCubeBalance();

  // Convert bigint to number for display
  const displayBalance = Number(cubeBalance);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <span className="text-lg">🧊</span>
        <span className="text-sm text-slate-400">...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <span className="text-lg">🧊</span>
        <span className="text-sm text-red-400">?</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="text-lg">🧊</span>
      <span className="text-sm font-semibold text-yellow-400">
        {displayBalance.toLocaleString()}
      </span>
      {showLabel && <span className="text-xs text-slate-400">cubes</span>}
    </div>
  );
};

export default CubeBalance;

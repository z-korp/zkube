import { useCubeBalance } from "@/hooks/useCubeBalance";
import React, { useState } from "react";
import useAccountCustom from "@/hooks/useAccountCustom";

const { VITE_PUBLIC_CUBE_TOKEN_ADDRESS, VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;
const isSlotMode = VITE_PUBLIC_DEPLOY_TYPE === "slot";

interface CubeBalanceProps {
  showLabel?: boolean;
  className?: string;
}

const CubeBalance: React.FC<CubeBalanceProps> = ({
  showLabel = true,
  className = "",
}) => {
  const { cubeBalance, isLoading, error, refetch } = useCubeBalance();
  const { account } = useAccountCustom();
  const [minting, setMinting] = useState(false);

  const displayBalance = Number(cubeBalance);

  const handleMintDev = async () => {
    if (!account || !VITE_PUBLIC_CUBE_TOKEN_ADDRESS) return;
    setMinting(true);
    try {
      await account.execute([{
        contractAddress: VITE_PUBLIC_CUBE_TOKEN_ADDRESS,
        entrypoint: "mint_dev",
        calldata: ["1000", "0"], // u256 (low, high)
      }]);
      // Wait a bit for indexing then refetch
      setTimeout(() => {
        refetch();
      }, 2000);
    } catch (err: any) {
      console.error("[mint_dev] failed:", err);
      if (err?.message) console.error("[mint_dev] message:", err.message);
      if (err?.data) console.error("[mint_dev] data:", err.data);
    } finally {
      setMinting(false);
    }
  };

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
      {isSlotMode && (
        <button
          onClick={handleMintDev}
          disabled={minting || !account}
          className="ml-1 text-xs px-1.5 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50"
          title="Dev: Mint 1000 cubes"
        >
          {minting ? "..." : "+1k"}
        </button>
      )}
    </div>
  );
};

export default CubeBalance;

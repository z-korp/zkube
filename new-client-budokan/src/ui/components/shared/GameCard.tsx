import type { ReactNode } from "react";

interface GameCardProps {
  variant?: "glass" | "solid";
  className?: string;
  children: ReactNode;
  padding?: string;
}

const VARIANT_STYLES = {
  glass: "bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl",
  solid: "bg-slate-900/90 border border-white/10 rounded-xl",
} as const;

const GameCard = ({
  variant = "solid",
  className = "",
  children,
  padding = "p-4",
}: GameCardProps) => {
  return (
    <div className={`${VARIANT_STYLES[variant]} ${padding} ${className}`}>
      {children}
    </div>
  );
};

export default GameCard;

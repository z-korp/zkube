import React from "react";

interface CubeIconProps {
  className?: string;
  size?: "xs" | "sm" | "base" | "lg" | "xl";
}

const sizeMap: Record<string, string> = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  base: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-7 h-7",
};

const CubeIcon: React.FC<CubeIconProps> = ({ className, size = "base" }) => (
  <img
    src="/assets/logo-zkorp-cube.png"
    alt="ZKUBE"
    className={className ?? `${sizeMap[size]} inline-block`}
  />
);

export default CubeIcon;

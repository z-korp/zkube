import React from "react";

interface CubeIconProps {
  className?: string;
  size?: "xs" | "sm" | "base" | "lg" | "xl";
}

const sizeMap: Record<string, string> = {
  xs: "w-5 h-5",
  sm: "w-7 h-7",
  base: "w-8 h-8",
  lg: "w-10 h-10",
  xl: "w-14 h-14",
};

const CubeIcon: React.FC<CubeIconProps> = ({ className, size = "base" }) => (
  <img
    src="/assets/logo-zkorp-cube.png"
    alt="ZKUBE"
    className={className ?? `${sizeMap[size]} inline-block`}
  />
);

export default CubeIcon;

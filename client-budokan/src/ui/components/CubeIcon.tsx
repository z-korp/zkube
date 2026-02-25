import React from "react";

interface CubeIconProps {
  className?: string;
  size?: "xs" | "sm" | "base" | "lg" | "xl";
}

const sizeMap: Record<string, string> = {
  xs: "w-4 h-4",
  sm: "w-5 h-5",
  base: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-10 h-10",
};

const CubeIcon: React.FC<CubeIconProps> = ({ className, size = "base" }) => (
  <img
    src="/assets/logo-zkorp-cube.png"
    alt="ZKUBE"
    className={className ?? `${sizeMap[size]} inline-block`}
  />
);

export default CubeIcon;

import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, leftSlot, rightSlot }) => {
  return (
    <div className="relative z-10 flex min-h-10 items-center justify-center px-6 pb-2">
      <div className="absolute left-6 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center">
        {leftSlot}
      </div>
      <h1 className="text-center font-display text-2xl font-bold tracking-wide text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
        {title}
      </h1>
      <div className="absolute right-6 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center">
        {rightSlot}
      </div>
    </div>
  );
};

export default PageHeader;

import type { ReactNode } from "react";

interface PhoneFrameProps {
  children: ReactNode;
}

const PhoneFrame = ({ children }: PhoneFrameProps) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#080414]">
      <div className="relative w-full h-dvh max-w-[430px] md:border md:border-white/5 md:rounded-2xl md:shadow-2xl md:overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default PhoneFrame;

import { Separator } from "@/ui/elements/separator";
import { useMediaQuery } from "react-responsive";
import DesktopHeader from "../components/DesktopHeader";
import MobileHeader from "../components/MobileHeader";

interface HeaderProps {
  onStartTutorial: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onStartTutorial }) => {
  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  return isMdOrLarger ? (
    <div>
      <DesktopHeader onStartTutorial={onStartTutorial} />
      <Separator />
    </div>
  ) : (
    <div>
      <MobileHeader onStartTutorial={onStartTutorial} />
      <Separator />
    </div>
  );
};

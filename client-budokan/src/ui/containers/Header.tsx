import { Separator } from "@/ui/elements/separator";
import { useMediaQuery } from "react-responsive";
import DesktopHeader from "../components/DesktopHeader";
import MobileHeader from "../components/MobileHeader";

interface HeaderProps {
  onStartTutorial: () => void;
  showTutorial?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onStartTutorial,
  showTutorial = false,
}) => {
  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  return isMdOrLarger ? (
    <div>
      <DesktopHeader
        onStartTutorial={onStartTutorial}
        showTutorial={showTutorial}
      />
      <Separator />
    </div>
  ) : (
    <div>
      <MobileHeader
        onStartTutorial={onStartTutorial}
        showTutorial={showTutorial}
      />
      <Separator />
    </div>
  );
};

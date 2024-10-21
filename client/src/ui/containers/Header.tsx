import { Separator } from "@/ui/elements/separator";
import { useMediaQuery } from "react-responsive";
import DesktopHeader from "../components/DesktopHeader";
import MobileHeader from "../components/MobileHeader";

export const Header = () => {
  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  return isMdOrLarger ? (
    <div>
      <DesktopHeader />
      <Separator />
    </div>
  ) : (
    <div>
      <MobileHeader />
      <Separator />
    </div>
  );
};

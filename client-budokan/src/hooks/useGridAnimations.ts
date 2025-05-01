import { ComboMessages } from "@/enums/comboEnum";
import { useEffect, useState, useCallback } from "react";

const useGridAnimations = (lineExplodedCount: number) => {
  const [shouldBounce, setShouldBounce] = useState(false);
  const [animateText, setAnimateText] = useState(ComboMessages.None);

  const resetAnimateText = useCallback((): void => {
    setAnimateText(ComboMessages.None);
  }, []);

  useEffect(() => {
    if (lineExplodedCount > 0) {
      setShouldBounce(true); // Trigger bounce animation
      setTimeout(() => setShouldBounce(false), 500); // Stop bouncing after 0.5s
    }
  }, [lineExplodedCount]);

  return {
    shouldBounce,
    animateText,
    resetAnimateText,
    setAnimateText,
  };
};

export default useGridAnimations;

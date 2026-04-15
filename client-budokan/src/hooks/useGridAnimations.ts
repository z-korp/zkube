import { ComboMessages } from "@/enums/comboEnum";
import { useEffect, useState, useCallback } from "react";

const useGridAnimations = (lineExplodedCount: number) => {
  const [shouldBounce, setShouldBounce] = useState(false);
  const [animateText, setAnimateText] = useState<string>(ComboMessages.None);
  const [animatedPoints, setAnimatedPoints] = useState(0);
  const [animatedCubes, setAnimatedCubes] = useState(0);

  const resetAnimateText = useCallback((): void => {
    setAnimateText(ComboMessages.None);
    setAnimatedPoints(0);
    setAnimatedCubes(0);
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
    animatedPoints,
    setAnimatedPoints,
    animatedCubes,
    setAnimatedCubes,
  };
};

export default useGridAnimations;

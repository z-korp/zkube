import { useState, useEffect } from "react";

const getSecondsUntil = (targetTimestamp: number): number => {
  const now = Date.now();
  const distance = targetTimestamp - now;

  if (distance < 0) {
    return 0;
  }

  return Math.floor(distance / 1000);
};

const useCountdown = (targetTimestamp: number): number => {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    getSecondsUntil(targetTimestamp),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(getSecondsUntil(targetTimestamp));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [targetTimestamp]);

  return secondsLeft;
};

export default useCountdown;

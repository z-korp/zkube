import { useState, useEffect } from "react";

const getSecondsUntil = (targetDate: Date): number => {
  const now: Date = new Date();
  const distance = Number(targetDate) - Number(now);

  if (distance < 0) {
    return 0;
  }

  return Math.floor(distance / 1000);
};

const useCountdown = (targetDate: Date): number => {
  const [secondsLeft, setSecondsLeft] = useState(getSecondsUntil(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(getSecondsUntil(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return secondsLeft;
};

export default useCountdown;

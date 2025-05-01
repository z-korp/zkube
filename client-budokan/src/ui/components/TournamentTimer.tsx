import React from "react";
import { ModeType } from "@/dojo/game/types/mode";
import useCountdown from "@/hooks/useCountdown";

const FixedWidthDigit: React.FC<{ value: string }> = ({ value }) => (
  <span className="inline-block text-center w-[8px] md:w-[10px]">{value}</span>
);

const formatRemainingTime = (
  mode: ModeType,
  seconds: number,
): React.ReactNode => {
  const padNumber = (num: number, width: number): React.ReactNode[] => {
    return num
      .toString()
      .padStart(width, "0")
      .split("")
      .map((digit, index) => <FixedWidthDigit key={index} value={digit} />);
  };

  if (mode === ModeType.Normal) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return (
      <>
        {padNumber(days, 1)}
        <span className="pr-1 pl-[1px]">d</span>
        {padNumber(hours, 2)}
        <span className="pr-1 pl-[1px]">h</span>
        {padNumber(minutes, 2)}
        <span className="pr-1 pl-[1px]">m</span>
        {padNumber(secs, 2)}
        <span className="pl-[1px]">s</span>
      </>
    );
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return (
      <>
        {padNumber(hours, 2)}
        <span className="pr-1 pl-[1px]">h</span>
        {padNumber(minutes, 2)}
        <span className="pr-1 pl-[1px]">m</span>
        {padNumber(secs, 2)}
        <span className="pl-[1px]">s</span>
      </>
    );
  }
};

interface TournamentTimerProps {
  mode: ModeType;
  endTimestamp: number;
}

const TournamentTimer: React.FC<TournamentTimerProps> = ({
  mode,
  endTimestamp,
}) => {
  const secondsLeft = useCountdown(endTimestamp * 1000);

  return (
    <div>
      <p className="text-sm md:text-base font-semibold md:font-normal">
        {formatRemainingTime(mode, secondsLeft)}
      </p>
    </div>
  );
};

export default TournamentTimer;

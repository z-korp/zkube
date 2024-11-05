import React, { useMemo } from "react";
import { Hourglass, Trophy, Coins, Zap, HelpCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../elements/card";
import { ModeType } from "@/dojo/game/types/mode";
import { usePlayer } from "@/hooks/usePlayer";
import { useSettings } from "@/hooks/useSettings";
import useTournament from "@/hooks/useTournament";
import { ethers } from "ethers";
import { Start } from "../actions/Start";
import TournamentTimer from "./TournamentTimer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../elements/tooltip";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useMediaQuery } from "react-responsive";

const { VITE_PUBLIC_GAME_TOKEN_SYMBOL } = import.meta.env;

interface GameModeCardProps {
  mode: ModeType;
  handleGameMode: () => void;
}

const GameModeCard: React.FC<GameModeCardProps> = ({
  mode,
  handleGameMode,
}) => {
  const { account } = useAccountCustom();
  const { player } = usePlayer({ playerId: account?.address });
  const { settings } = useSettings();

  const { endTimestamp, tournament } = useTournament(mode);

  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  const potentialWin = useMemo(() => {
    if (!tournament) return `0 ${VITE_PUBLIC_GAME_TOKEN_SYMBOL}`;
    const rawEthPrize = ethers.utils.formatEther(tournament.prize);
    const formattedPrize = parseFloat(rawEthPrize).toString();
    return `${formattedPrize} ${VITE_PUBLIC_GAME_TOKEN_SYMBOL}`;
  }, [tournament]);

  const cost = useMemo(() => {
    if (!settings) return "";
    const weiCost =
      mode === ModeType.Daily
        ? settings.daily_mode_price
        : settings.normal_mode_price;
    const ethCost = ethers.utils.formatEther(weiCost);
    const formattedCost =
      parseFloat(ethCost) % 1 === 0 ? parseInt(ethCost).toString() : ethCost;
    return `${formattedCost} ${VITE_PUBLIC_GAME_TOKEN_SYMBOL}`;
  }, [player, settings, mode]);

  const difficultyRule = useMemo(() => {
    switch (mode) {
      case ModeType.Daily:
        return {
          name: "Pro Mode",
          description:
            "A fixed high-difficulty challenge that tests your skills at their peak.",
        };
      case ModeType.Normal:
        return {
          name: "Escalation Mode",
          description:
            "Difficulty increases over time, pushing you to adapt and improve.",
        };
      case ModeType.Free:
        return {
          name: "Escalation Mode",
          description:
            "Difficulty increases over time, pushing you to adapt and improve.",
        };
      default:
        return {
          name: "Normal Mode",
          description:
            "A standard mode with a fixed difficulty level for consistent play.",
        };
    }
  }, [mode]);

  return (
    <Card className="w-full max-w-sm bg-gray-900 text-white border-0 relative font-semibold md:font-normal">
      {isMdOrLarger &&
        (mode === ModeType.Daily || mode === ModeType.Normal) && (
          <div className="absolute top-0 bg-white text-black text-xs px-2 py-1 rounded-br-lg rounded-tl-xl">
            Tournament
          </div>
        )}
      <CardHeader className="pt-4 pb-2 md:pb-4">
        <CardTitle className="text-xl md:text-2xl font-bold text-center">
          {mode}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm md:text-base pb-4">
        <div className="flex items-center space-x-2 gap-2">
          <Coins className="h-5 w-5 flex-shrink-0" />
          <div className="flex-grow flex justify-between items-center">
            <span className="font-semibold">Cost</span>
            <span className="text-slate-300">
              {mode === ModeType.Free ? "Free" : cost}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 gap-2">
          <Zap className="h-5 w-5 flex-shrink-0" />
          <div className="flex-grow flex justify-between items-center">
            <span className="font-semibold">Difficulty</span>
            <span className="flex items-center text-slate-300 relative">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="mr-3">
                    {difficultyRule.name}
                    <HelpCircle className="h-3 w-3 cursor-help absolute top-0 right-0" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">{difficultyRule.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
          </div>
        </div>

        {(mode === ModeType.Daily || mode === ModeType.Normal) && (
          <>
            <div className="flex items-center space-x-2 w-full gap-2">
              <Hourglass className="h-5 w-5 flex-shrink-0" />
              <div className="flex-grow flex justify-between items-center">
                <span className="font-semibold">Ends in</span>
                <div className="text-slate-300">
                  <TournamentTimer mode={mode} endTimestamp={endTimestamp} />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 w-full gap-2">
              <Trophy className="h-5 w-5 flex-shrink-0" />
              <div className="flex-grow flex justify-between items-center">
                <span className="font-semibold">Prize Pool</span>
                <span className="text-slate-300">{potentialWin}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="pb-5 md:pb-6">
        <Start mode={mode} handleGameMode={handleGameMode} />
      </CardFooter>
    </Card>
  );
};

export default GameModeCard;
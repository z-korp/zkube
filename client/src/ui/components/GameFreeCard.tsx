import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../elements/card";
import { ModeType } from "@/dojo/game/types/mode";
import { Start } from "../actions/Start";

interface GameModeCardProps {
  mode: ModeType;
  handleGameMode: () => void;
}

const GameModeCard: React.FC<GameModeCardProps> = ({
  mode,
  handleGameMode,
}) => {
  return (
    <Card className="w-full max-w-sm bg-gray-900 text-white border-0">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-bold">{mode}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm md:text-base"></CardContent>
      <CardFooter>
        <Start mode={mode} handleGameMode={handleGameMode} />
      </CardFooter>
    </Card>
  );
};

export default GameModeCard;

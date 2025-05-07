import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../elements/card";
import { Create } from "../actions/Create";

interface GameModeCardProps {
  handleGameMode: () => void;
}

const GameModeCard: React.FC<GameModeCardProps> = ({ handleGameMode }) => {
  return (
    <Card className="w-full max-w-sm bg-gray-900 text-white border-0">
      <CardContent className="space-y-2 text-sm md:text-base"></CardContent>
      <CardFooter>
        <Create handleGameMode={handleGameMode} />
      </CardFooter>
    </Card>
  );
};

export default GameModeCard;

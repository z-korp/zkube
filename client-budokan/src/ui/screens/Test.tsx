import { usePlayerId } from "@/hooks/usePlayerId";
import { useGeneralStore } from "@/stores/generalStore";
import { useAccount } from "@starknet-react/core";
import { Header } from "../containers/Header";
import { Create } from "../actions/Create";
import { usePlayer } from "@/hooks/usePlayer";
import { usePlayerInfoList } from "@/hooks/usePlayerInfoList";
import { useTournaments } from "@/hooks/useTournaments";
import { ModeType } from "@/dojo/game/types/mode";
import { T } from "@dojoengine/recs/dist/types-3444e4c1";

export const Test = () => {
  const { account } = useAccount();
  usePlayerId({ playerAddress: account?.address });

  const handleStartTutorial = () => {
    console.log("start tutorial");
  };

  const { player } = usePlayer();
  const playerInfos = usePlayerInfoList();
  console.log("playerInfos", playerInfos);

  const tournaments = useTournaments({ mode: ModeType.Daily });
  console.log("tournaments", tournaments);

  return (
    <div>
      {<Header onStartTutorial={handleStartTutorial} />}
      <Create />
      <div>{player?.name}</div>
      <div>{player?.points}</div>
      <div>{player?.daily_streak}</div>
      <div>{player?.last_active_day}</div>
      <div>{player?.account_creation_day}</div>
    </div>
  );
};

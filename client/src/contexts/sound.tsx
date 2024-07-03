import { useDojo } from "@/dojo/useDojo";
import { useGame } from "@/hooks/useGame";
import { usePlayer } from "@/hooks/usePlayer";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useMusicPlayer } from "./music";

const SoundPlayerContext = createContext({});

export const SoundPlayerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { setTheme, playStart, playOver } = useMusicPlayer();
  const [over, setOver] = useState(false);
  const [start, setStart] = useState(false);

  const {
    account: { account },
  } = useDojo();
  const { player } = usePlayer({ playerId: account.address });
  const { game } = useGame({ gameId: player?.game_id });

  useEffect(() => {
    setTheme(!game || game.isOver());
  }, [game, over]);

  // [Check] This is a useEffect hook that runs when the game is over
  useEffect(() => {
    if (!game && !start && !over) {
      setStart(false);
      setOver(true);
    } else if (game && !start && !over) {
      setStart(true);
      setOver(false);
    } else if (game && !start && over && !game.isOver()) {
      setStart(true);
      setOver(false);
      playStart();
    } else if (start && !over && (!game || game.isOver())) {
      setOver(true);
      setStart(false);
      playOver();
    }
  }, [game, start, over]);

  return (
    <SoundPlayerContext.Provider value={{}}>
      {children}
    </SoundPlayerContext.Provider>
  );
};

export const useSoundPlayer = () => {
  return useContext(SoundPlayerContext);
};

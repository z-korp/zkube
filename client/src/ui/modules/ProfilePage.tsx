import React, { useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/elements/dialog";
import { CardContent } from "@/ui/elements/card";
import { Button } from "@/ui/elements/button";
import { Statistics } from "./Statistics";
import Connect from "../components/Connect";
import { useGames } from "@/hooks/useGames";
import { usePlayer } from "@/hooks/usePlayer";
import useAccountCustom, { ACCOUNT_CONNECTOR } from "@/hooks/useAccountCustom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/elements/tabs";
import { motion } from "framer-motion";
import { Rewards } from "./Rewards";
import { useRewardsStore } from "@/stores/rewardsStore";
import NotifCount from "../components/NotifCount";
import Airdrop from "./Airdrop";

interface ProfilePageProps {
  wfit: boolean;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ wfit }) => {
  const { account } = useAccountCustom();
  const { player } = usePlayer({ playerId: account?.address });
  const { games } = useGames();

  const rewardsCount = useRewardsStore((state) => state.rewardsCount);

  const filteredGames = useMemo(() => {
    if (!account?.address || !games) return [];
    return games.filter((game) => game.player_id === account?.address);
  }, [games, account?.address]);

  const portalRootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    portalRootRef.current = document.getElementById(
      "portal-root",
    ) as HTMLDivElement;
  }, []);

  return (
    <>
      {player && (
        <Dialog
          onOpenChange={(open) => {
            if (open) {
              document.body.style.overflow = "hidden";
              if (portalRootRef.current) {
                portalRootRef.current.style.pointerEvents = "none";
              }
            } else {
              document.body.style.overflow = "";
              if (portalRootRef.current) {
                portalRootRef.current.style.pointerEvents = "";
              }
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className={`relative w-${wfit ? "fit" : "full"}`}
            >
              {player.name}
              {rewardsCount > 0 && <NotifCount count={rewardsCount} />}
            </Button>
          </DialogTrigger>
          <DialogContent
            className="sm:max-w-[700px] w-[95%] rounded-lg p-2 pt-4"
            aria-describedby={undefined}
          >
            <DialogHeader className="flex items-center text-2xl">
              <DialogTitle>Profile</DialogTitle>
            </DialogHeader>
            <Tabs
              defaultValue="rewards"
              className="flex-grow min-h-[480px] flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-3">
                {/*<TabsTrigger value="achievements">Achievements</TabsTrigger>*/}
                <TabsTrigger
                  value="airdrop"
                  className="relative font-semibold md:font-normal"
                >
                  Airdrop
                </TabsTrigger>
                <TabsTrigger
                  value="rewards"
                  className="relative font-semibold md:font-normal"
                >
                  Rewards
                  {rewardsCount > 0 && <NotifCount count={rewardsCount} />}
                </TabsTrigger>
                <TabsTrigger
                  value="stats"
                  className="font-semibold md:font-normal"
                >
                  Statistics
                </TabsTrigger>
              </TabsList>
              <TabsContent
                className="max-h-[480px] overflow-y-auto"
                value="airdrop"
                asChild
              >
                <Airdrop />
              </TabsContent>
              <TabsContent
                className="max-h-[480px] overflow-y-auto"
                value="rewards"
                asChild
              >
                <motion.div
                  key="rewards"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  {/*<CardContent>
                    <Achievements
                      level={levelPlayer?.value || 1}
                      highestScore={highestScore}
                      highestCombo={highestCombo}
                    />
                  </CardContent>*/}
                  <CardContent className="p-0 mt-2">
                    <Rewards />
                  </CardContent>
                </motion.div>
              </TabsContent>
              <TabsContent className="max-h-[480px]" value="stats" asChild>
                <motion.div
                  key="statistics"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <CardContent className="p-0">
                    <Statistics games={filteredGames} player={player} />
                  </CardContent>
                </motion.div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
      {ACCOUNT_CONNECTOR === "controller" && <Connect inMenu={true} />}
    </>
  );
};

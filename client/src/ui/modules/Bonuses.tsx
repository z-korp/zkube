import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/ui/elements/carousel";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/ui/elements/drawer";
import { Button } from "@/ui/elements/button";
import { BonusDetail, Game } from "@/dojo/game/models/game";
import { useMemo, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { useDojo } from "@/dojo/useDojo";
import { usePlayer } from "@/hooks/usePlayer";

export const Bonuses = () => {
  const {
    account: { account },
  } = useDojo();

  const { player } = usePlayer({ playerId: account.address });
  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });
  const bonuses = useMemo(() => Game.getBonuses(), []);

  return (
    <Drawer handleOnly={true}>
      <DrawerTrigger asChild>
        <Button variant="outline">Achievements</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="w-full max-w-sm md:max-w-full m-auto pb-4">
          <DrawerHeader>
            <DrawerTitle className="text-center text-2xl">
              Achievements
            </DrawerTitle>
          </DrawerHeader>

          <Carousel
            className="w-full"
            orientation={"horizontal"}
            opts={{ dragFree: isMdOrLarger }}
          >
            <CarouselContent className="flex items-end">
              {bonuses.map((detail, index) => (
                <CarouselItem
                  key={index}
                  className="sm:basis-1/2 md:basis-1/3 lg:basis-1/5 xl:basis-1/6"
                >
                  <Canvas detail={detail} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export const Canvas = ({ detail }: { detail: BonusDetail }) => {
  const { bonus, score, combo, description } = detail;
  const enabled = true;

  return (
    <div className="flex flex-col justify-center items-center gap-2 pb-2">
      <div className={`${!enabled && "grayscale"}`}>
        <div>{score}</div>
        <div>{combo}</div>
        <div>{description}</div>
        <img src={bonus.getIcon()} alt={"icon"} />
      </div>
    </div>
  );
};

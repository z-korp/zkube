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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/ui/elements/card";
import { BonusDetail, Player } from "@/dojo/game/models/player";
import { useMemo } from "react";
import { useMediaQuery } from "react-responsive";
import { usePlayer } from "@/hooks/usePlayer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKhanda, faStar } from "@fortawesome/free-solid-svg-icons";
import { useAccount } from "@starknet-react/core";

export const Achievements = () => {
  const { account } = useAccount();

  const { player } = usePlayer({ playerId: account?.address });
  const counts = useMemo(() => {
    if (!player) return undefined;
    return [player.hammer, player.totem, player.wave];
  }, [player]);

  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });
  const bonuses = useMemo(() => Player.getBonuses({ counts }), [counts]);

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
            <CarouselContent className="flex items-stretch">
              {bonuses.map((detail, index) => (
                <CarouselItem
                  key={index}
                  className="sm:basis-1/2 md:basis-1/3 lg:basis-1/5 xl:basis-[14.2857143%]"
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
  const { bonus, score, combo, description, name, has } = detail;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col justify-center items-center">
        <CardTitle>{name}</CardTitle>
        <CardDescription className="text-center">
          {bonus.getEffect()}
        </CardDescription>
      </CardHeader>
      <CardContent
        className={`flex justify-center items-center ${!has && "grayscale"}`}
      >
        <img className="h-20" src={bonus.getIcon()} alt={"icon"} />
      </CardContent>
      <CardFooter className="flex flex-col gap-4 justify-between items-center">
        {!!score && (
          <div className="flex gap-2 justify-center items-center text-2xl">
            {score}
            <FontAwesomeIcon icon={faStar} className="text-yellow-500" />
          </div>
        )}
        {!!combo && (
          <div className="flex gap-2 justify-center items-center text-2xl">
            {combo}
            <FontAwesomeIcon icon={faKhanda} className="text-slate-500" />
          </div>
        )}
        {!!description && <div>{description}</div>}
      </CardFooter>
    </Card>
  );
};

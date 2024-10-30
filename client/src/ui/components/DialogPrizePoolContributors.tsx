import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../elements/dialog";
import { ScrollArea } from "@/ui/elements/scroll-area";

import { faHeart, faUsers } from "@fortawesome/free-solid-svg-icons";

const fakeDataName = [
  "EpicNoodleMaster",
  "CactusSniper69",
  "L33tPenguinWarrior",
  "GlitterBombGamer",
  "SirLagALot",
  "NoobSlayerX",
  "SpicyTacoHunter",
  "QuantumFrogster",
  "NinjaPastaChef",
  "BouncingUnicorn47",
];

export function DialogPrizePoolContributors() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className={`w-10 h-10 rounded-full border border-yellow-300 transform }`}
        >
          <FontAwesomeIcon icon={faUsers} className="text-yellow-300" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] w-[95%]">
        <DialogHeader>
          <DialogTitle>
            <div className="text-2xl text-yellow-300">Real MVPs</div>
          </DialogTitle>
          <DialogDescription>
            Here’s a shoutout to our top legends that contributed on the chest
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[300px]  p-4">
          <div className="grid gap-4 py-4">
            {fakeDataName.map((name, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-4 py-2 bg-sky-800 rounded-lg"
              >
                <div>{name}</div>
                <div>1000 LORDS</div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <FontAwesomeIcon icon={faHeart} className="text-yellow-300" />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

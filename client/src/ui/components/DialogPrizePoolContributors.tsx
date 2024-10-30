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
import { faUsers } from "@fortawesome/free-solid-svg-icons";

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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <p> Coucou</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p> Coucou 2</p>
          </div>
        </div>
        <DialogFooter>
          <button type="submit">Save changes</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

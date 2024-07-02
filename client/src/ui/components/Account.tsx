import { Button } from "@/ui/elements/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/elements/tooltip";
import { useDojo } from "@/dojo/useDojo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "@/ui/elements/select";
import { shortenHex } from "@dojoengine/utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faRocket } from "@fortawesome/free-solid-svg-icons";

export const Account = () => {
  const {
    account: { account, create, clear, list, select },
  } = useDojo();

  return (
    <div className="flex gap-2 min-w-64 w-full">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={() => create()}>
              <FontAwesomeIcon icon={faRocket} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="select-none">Deploy a burner account</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Select
        onValueChange={(value: any) => select(value)}
        value={account.address}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Addr" />
        </SelectTrigger>
        <SelectContent className="grow">
          <SelectGroup>
            {list().map((account, index) => {
              return (
                <div key={index} className="flex">
                  <SelectItem value={account.address}>
                    <p className="tracking-[.3em]">
                      {shortenHex(account.address)}
                    </p>
                  </SelectItem>
                </div>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={() => clear()}>
              <FontAwesomeIcon icon={faTrash} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="select-none">Clear all burner accounts</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

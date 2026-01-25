import { useConnect, useAccount, useDisconnect } from "@starknet-react/core";
import { motion } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/elements/select";
import { useState } from "react";

interface connectProps {
  inMenu?: boolean;
}

const shortAddress = (address: string) => {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const Connect = ({ inMenu = false }: connectProps) => {
  const { connect, connectors, isPending } = useConnect();
  const { address, status, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const isMediumOrLarger = useMediaQuery({ query: "(min-width: 768px)" });
  const [selectedConnectorId, setSelectedConnectorId] = useState<string | undefined>(undefined);

  // If connected, show connected state with disconnect option
  if (status === "connected" && address) {
    const isController = connector?.id === "controller";
    return (
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            isController
              ? "border-orange-200 bg-orange-50 text-orange-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {connector?.name ?? "Connected"}
        </span>
        <span className="text-sm font-mono">{shortAddress(address)}</span>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => disconnect()}
          className="cursor-pointer px-2 py-1 text-xs border rounded hover:bg-red-100 hover:border-red-300"
        >
          Disconnect
        </motion.button>
      </div>
    );
  }

  // Always show dropdown for connector selection
  return (
    <div className="flex items-center gap-3">
      <Select
        value={selectedConnectorId}
        disabled={isPending}
        onValueChange={async (value) => {
          const item = connectors.find((c) => c.id === value);
          if (!item) return;
          setSelectedConnectorId(value);
          try {
            connect({ connector: item });
          } catch (err) {
            console.error("Connection error:", err);
          } finally {
            setSelectedConnectorId(undefined);
          }
        }}
      >
        <SelectTrigger className="w-[180px] bg-background">
          <SelectValue
            placeholder={isPending ? "Connecting..." : "Connect wallet"}
          />
        </SelectTrigger>
        <SelectContent>
          {connectors.map((item) => {
            const isController = item.id === "controller";
            const isBurner = item.id === "burner";
            return (
              <SelectItem
                key={item.id}
                value={item.id}
                className="cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isController
                        ? "bg-orange-500"
                        : isBurner
                        ? "bg-green-500"
                        : "bg-blue-500"
                    }`}
                  />
                  <span className="font-medium">{item.name}</span>
                  {isBurner && (
                    <span className="text-xs text-muted-foreground">(Slot)</span>
                  )}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

export default Connect;

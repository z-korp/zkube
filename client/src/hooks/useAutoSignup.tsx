import { useEffect, useRef, useState } from "react";
import { useDojo } from "@/dojo/useDojo";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useAccount } from "@starknet-react/core";
import { Account } from "starknet";
import { Entity, getComponentValue } from "@dojoengine/recs";
import { fetchUsername } from "./useControllerUsername";

const useAutoSignup = (): boolean => {
  const {
    setup: {
      clientModels: {
        models: { Player },
      },
      systemCalls: { create },
    },
  } = useDojo();

  const { account, connector } = useAccount();

  // Initialize isSigning state
  const [isSigning, setIsSigning] = useState<boolean>(false);

  // Reference to store the timeout ID
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Define a flag to prevent multiple handlers
    let isMounted = true;

    const handleAccountChange = async (newAccount: Account) => {
      if (!isMounted) return;

      try {
        console.log("Account changed:", newAccount.address);
        setIsSigning(true); // Start signing

        // Check if account exists
        const playerKey = getEntityIdFromKeys([
          BigInt(newAccount.address),
        ]) as Entity;
        const component = getComponentValue(Player, playerKey);

        if (!component) {
          console.log("Player not found");
          const userName = await fetchUsername(newAccount.address, connector);
          console.log("Username", userName);
          try {
            if (userName !== undefined) {
              await create({ account: newAccount, name: userName });
            } else {
              console.log("Username not found");
              await create({ account: newAccount, name: "unknown" });
            }
          } catch (error) {
            console.error("Error creating account:", error);
          }
        } else {
          console.log("Player found");
        }
      } catch (error) {
        console.error("Error handling account change:", error);
      } finally {
        if (isMounted) {
          // Set isSigning to false after a 1-second delay
          timeoutRef.current = window.setTimeout(() => {
            if (isMounted) {
              setIsSigning(false);
            }
          }, 1000);
        }
      }
    };

    // Handle account change if account exists
    if (account) {
      handleAccountChange(account as Account);
    }

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [account, connector, create, Player]);

  return isSigning;
};

export default useAutoSignup;

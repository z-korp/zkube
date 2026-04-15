import { useEffect, useMemo, useState } from "react";
import { lookupAddresses } from "@cartridge/controller";

/**
 * Normalizes an address for consistent lookups.
 * Removes leading zeros after 0x and lowercases.
 */
export function normalizeAddress(address: string): string {
  return address.replace(/^0x0+/, "0x").toLowerCase();
}

/**
 * Hook for batch username lookup from Cartridge Controller.
 * Takes an array of addresses and returns a Map of address -> username.
 */
export const useGetUsernames = (addresses: string[]) => {
  const [usernames, setUsernames] = useState<Map<string, string> | undefined>(
    undefined
  );

  // Memoize addresses key to prevent unnecessary re-fetches
  const addressesKey = useMemo(() => {
    return addresses
      .map(normalizeAddress)
      .sort()
      .join(",");
  }, [addresses]);

  const fetchUsernames = async () => {
    if (addresses.length === 0) return;
    
    try {
      // Normalize addresses before lookup
      const normalizedAddresses = addresses.map(normalizeAddress);
      const addressMap = await lookupAddresses(normalizedAddresses);
      setUsernames(addressMap);
    } catch (error) {
      console.error("[useGetUsernames] Error looking up usernames:", error);
      setUsernames(new Map());
    }
  };

  useEffect(() => {
    fetchUsernames();
  }, [addressesKey]);

  return {
    usernames,
    refetch: fetchUsernames,
  };
};

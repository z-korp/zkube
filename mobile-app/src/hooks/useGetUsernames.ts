import { useCallback, useEffect, useMemo, useState } from "react";
import { lookupAddresses } from "@cartridge/controller";
import { normalizeAddress } from "@/utils/address";

/**
 * Hook for batch username lookup from Cartridge Controller.
 * Takes an array of addresses and returns a Map of address -> username.
 */
export const useGetUsernames = (addresses: string[]) => {
  const [usernames, setUsernames] = useState<Map<string, string> | undefined>(
    undefined
  );

  const addressesKey = useMemo(() => {
    return addresses
      .map(normalizeAddress)
      .sort()
      .join(",");
  }, [addresses]);

  const fetchUsernames = useCallback(async () => {
    if (addresses.length === 0) return;
    
    try {
      const normalizedAddresses = addresses.map(normalizeAddress);
      const addressMap = await lookupAddresses(normalizedAddresses);
      setUsernames(addressMap);
    } catch (error) {
      console.error("[useGetUsernames] Error looking up usernames:", error);
      setUsernames(new Map());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- addressesKey is a stable serialization of addresses
  }, [addressesKey]);

  useEffect(() => {
    fetchUsernames();
  }, [fetchUsernames]);

  return {
    usernames,
    refetch: fetchUsernames,
  };
};

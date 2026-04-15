import { hash, shortString } from "starknet";

/**
 * Mirror the contract's `start_daily_game` zone derivation so the Home page can
 * paint the Daily Challenge panel with the correct theme BEFORE anyone has
 * played today (at which point `DailyChallenge.zone_id` doesn't exist yet in
 * Torii). Contract reference:
 *   `contracts/src/systems/daily_challenge.cairo:170-177`
 *     day_id = floor(timestamp / 86400)
 *     seed   = poseidon_hash_span([day_id, 'DAILY_CHALLENGE'])
 *     zone_id = (seed % 10) + 1
 */
const DAILY_TAG = BigInt(shortString.encodeShortString("DAILY_CHALLENGE"));

export const predictedDailyZoneId = (timestampSeconds: number = Math.floor(Date.now() / 1000)): number => {
  const dayId = Math.floor(timestampSeconds / 86400);
  const seedHex = hash.computePoseidonHashOnElements([BigInt(dayId), DAILY_TAG]);
  const seed = BigInt(seedHex);
  const absSeed = seed < 0n ? -seed : seed;
  return Number(absSeed % 10n) + 1;
};

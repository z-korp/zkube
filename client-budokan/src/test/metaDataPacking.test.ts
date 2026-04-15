import { describe, expect, it } from "vitest";
import { unpackMetaData } from "@/dojo/game/helpers/metaDataPacking";

describe("unpackMetaData", () => {
  it("unpacks zero data", () => {
    const result = unpackMetaData(0n);
    expect(result).toEqual({ totalRuns: 0, dailyStars: 0, lifetimeXp: 0 });
  });

  it("unpacks total_runs in bits 0-15", () => {
    const packed = 42n;
    expect(unpackMetaData(packed).totalRuns).toBe(42);
  });

  it("unpacks daily_stars in bits 16-31", () => {
    const packed = 100n << 16n;
    expect(unpackMetaData(packed).dailyStars).toBe(100);
  });

  it("unpacks lifetime_xp in bits 32-63", () => {
    const packed = 5000n << 32n;
    expect(unpackMetaData(packed).lifetimeXp).toBe(5000);
  });

  it("unpacks all fields simultaneously", () => {
    const packed = 10n | (20n << 16n) | (3000n << 32n);
    expect(unpackMetaData(packed)).toEqual({ totalRuns: 10, dailyStars: 20, lifetimeXp: 3000 });
  });

  it("handles max values", () => {
    const packed = 0xFFFFn | (0xFFFFn << 16n) | (0xFFFFFFFFn << 32n);
    expect(unpackMetaData(packed)).toEqual({ totalRuns: 65535, dailyStars: 65535, lifetimeXp: 4294967295 });
  });
});

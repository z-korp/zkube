import { describe, expect, it } from "vitest";
import { unpackRunData } from "@/dojo/game/helpers/runDataPacking";

describe("unpackRunData", () => {
  it("unpacks zero data", () => {
    const result = unpackRunData(0n);
    expect(result.currentLevel).toBe(0);
    expect(result.totalScore).toBe(0);
    expect(result.zoneCleared).toBe(false);
    expect(result.mode).toBe(0);
    expect(result.bonusType).toBe(0);
    expect(result.bonusCharges).toBe(0);
  });

  it("unpacks current_level in bits 0-7", () => {
    const packed = 42n;
    expect(unpackRunData(packed).currentLevel).toBe(42);
  });

  it("unpacks total_score in bits 48-79", () => {
    const packed = 123456n << 48n;
    expect(unpackRunData(packed).totalScore).toBe(123456);
  });

  it("unpacks zone_cleared at bit 80", () => {
    const packed = 1n << 80n;
    expect(unpackRunData(packed).zoneCleared).toBe(true);
  });

  it("unpacks mode at bit 101", () => {
    const packed = 1n << 101n;
    expect(unpackRunData(packed).mode).toBe(1);
  });

  it("unpacks bonus_type at bits 102-103", () => {
    const packed = 2n << 102n;
    expect(unpackRunData(packed).bonusType).toBe(2);
  });

  it("unpacks bonus_charges at bits 104-107", () => {
    const packed = 9n << 104n;
    expect(unpackRunData(packed).bonusCharges).toBe(9);
  });
});

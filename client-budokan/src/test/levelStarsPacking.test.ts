import { describe, expect, it } from "vitest";
import { getLevelStars, sumStars, unpackAllLevelStars } from "@/dojo/game/helpers/levelStarsPacking";

describe("getLevelStars", () => {
  it("returns 0 for empty packed value", () => {
    expect(getLevelStars(0n, 1)).toBe(0);
  });

  it("extracts stars for level 1 (bits 0-1)", () => {
    expect(getLevelStars(0x3n, 1)).toBe(3);
    expect(getLevelStars(0x2n, 1)).toBe(2);
  });

  it("extracts stars for level 5 (bits 8-9)", () => {
    const packed = 2n << 8n;
    expect(getLevelStars(packed, 5)).toBe(2);
  });

  it("extracts stars for level 10 (bits 18-19)", () => {
    const packed = 3n << 18n;
    expect(getLevelStars(packed, 10)).toBe(3);
  });

  it("returns 0 for out-of-range levels", () => {
    expect(getLevelStars(0xFFFFFn, 0)).toBe(0);
    expect(getLevelStars(0xFFFFFn, 11)).toBe(0);
  });
});

describe("unpackAllLevelStars", () => {
  it("unpacks all 10 levels", () => {
    const packed = 0x3n | (0x2n << 2n) | (0x1n << 4n);
    const stars = unpackAllLevelStars(packed);
    expect(stars).toEqual([3, 2, 1, 0, 0, 0, 0, 0, 0, 0]);
  });

  it("handles all 3-star", () => {
    const packed = (1n << 20n) - 1n;
    expect(unpackAllLevelStars(packed)).toEqual([3, 3, 3, 3, 3, 3, 3, 3, 3, 3]);
  });
});

describe("sumStars", () => {
  it("sums correctly", () => {
    const packed = 0x3n | (0x2n << 2n) | (0x1n << 4n);
    expect(sumStars(packed)).toBe(6);
  });
});

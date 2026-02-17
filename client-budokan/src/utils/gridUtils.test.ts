import { describe, expect, it } from "vitest";
import { transformDataContractIntoBlock } from "./gridUtils";

describe("transformDataContractIntoBlock", () => {
  it("should transform a row with empty spaces and blocks", () => {
    const input: number[][] = [[0, 0, 1, 2, 2, 3, 3, 3]];
    const result = transformDataContractIntoBlock(input);

    expect(result).toHaveLength(3);
    // Block of width 1
    expect(result[0]).toMatchObject({
      x: 2,
      y: 0,
      width: 1,
    });
    // Block of width 2
    expect(result[1]).toMatchObject({
      x: 3,
      y: 0,
      width: 2,
    });
    // Block of width 3
    expect(result[2]).toMatchObject({
      x: 5,
      y: 0,
      width: 3,
    });
  });

  it("should handle multiple blocks of the same width", () => {
    const input: number[][] = [[2, 2, 0, 2, 2, 0, 2, 2]];
    const result = transformDataContractIntoBlock(input);

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      x: 0,
      y: 0,
      width: 2,
    });
    expect(result[1]).toMatchObject({
      x: 3,
      y: 0,
      width: 2,
    });
    expect(result[2]).toMatchObject({
      x: 6,
      y: 0,
      width: 2,
    });
  });

  it("should handle multiple rows", () => {
    const input: number[][] = [
      [0, 0, 1, 2, 2, 3, 3, 3],
      [2, 2, 0, 0, 2, 2, 0, 0],
      [3, 3, 3, 0, 0, 2, 2, 0],
    ];
    const result = transformDataContractIntoBlock(input);

    expect(result).toHaveLength(7);

    // First row
    expect(result[0]).toMatchObject({
      x: 2,
      y: 0,
      width: 1,
    });
    expect(result[1]).toMatchObject({
      x: 3,
      y: 0,
      width: 2,
    });
    expect(result[2]).toMatchObject({
      x: 5,
      y: 0,
      width: 3,
    });

    // Second row
    expect(result[3]).toMatchObject({
      x: 0,
      y: 1,
      width: 2,
    });
    expect(result[4]).toMatchObject({
      x: 4,
      y: 1,
      width: 2,
    });

    // Third row
    expect(result[5]).toMatchObject({
      x: 0,
      y: 2,
      width: 3,
    });
    expect(result[6]).toMatchObject({
      x: 5,
      y: 2,
      width: 2,
    });
  });
});

describe("transformDataContractIntoBlock", () => {
  it("should handle grid pattern with blocks of different widths", () => {
    const input: number[][] = [
      [0, 2, 2, 2, 2, 0, 0, 0], // One block of width 2 starting at x=1 and one block of width 2 starting at x=3
      [0, 1, 3, 3, 3, 0, 0, 0], // One block of width 1 at x=1, one block of width 3 at x=2
      [1, 2, 2, 0, 2, 2, 0, 0], // One block of width 1 at x=0, two blocks of width 2 at x=1 and x=4
    ];

    const result = transformDataContractIntoBlock(input);

    expect(result).toHaveLength(7); // Total number of blocks

    // First row: [0, 2, 2, 2, 2, 0, 0, 0]
    expect(result[0]).toMatchObject({
      x: 1,
      y: 0,
      width: 2,
    });

    expect(result[1]).toMatchObject({
      x: 3,
      y: 0,
      width: 2,
    });

    // Second row: [0, 1, 3, 3, 3, 0, 0, 0]
    expect(result[2]).toMatchObject({
      x: 1,
      y: 1,
      width: 1,
    });
    expect(result[3]).toMatchObject({
      x: 2,
      y: 1,
      width: 3,
    });

    // Third row: [1, 2, 2, 0, 2, 2, 0, 0]
    expect(result[4]).toMatchObject({
      x: 0,
      y: 2,
      width: 1,
    });
    expect(result[5]).toMatchObject({
      x: 1,
      y: 2,
      width: 2,
    });
    expect(result[6]).toMatchObject({
      x: 4,
      y: 2,
      width: 2,
    });
  });
});

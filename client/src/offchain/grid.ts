import { Packer } from "@/dojo/game/helpers/packer";

export function blocksToWidthsGrid(
  blocks: { x: number; y: number; width: number }[],
  gridWidth: number,
  gridHeight: number,
): number[][] {
  const grid: number[][] = Array.from({ length: gridHeight }, () =>
    Array(gridWidth).fill(0),
  );
  for (const b of blocks) {
    if (b.y >= 0 && b.y < gridHeight && b.x >= 0 && b.x < gridWidth) {
      grid[b.y][b.x] = Math.max(1, Math.min(b.width, 7));
    }
  }
  return grid;
}

export function generateNextRow(gridWidth = 8): number[] {
  const row: number[] = Array(gridWidth).fill(0);
  let x = 0;
  while (x < gridWidth) {
    // 50% chance to place a block at this position
    const place = Math.random() < 0.5;
    if (place) {
      const maxWidth = Math.min(3, gridWidth - x);
      const width = Math.max(1, Math.floor(Math.random() * maxWidth) + 1);
      row[x] = width; // encode width at start index
      x += width; // skip covered cells
    } else {
      x += 1; // leave empty cell
    }
  }
  return row;
}

export function packRowToU32(row: number[]): number {
  const packed = Packer.pack(row, BigInt(3));
  // ensure fits into u32 range
  return Number(packed & BigInt(0xffffffff));
}

export function packGridToBigint(grid: number[][]): bigint {
  const rowsPacked = grid
    .slice() // copy
    .reverse() // bottom row packed last in game logic
    .map((row) => Packer.pack(row, BigInt(3)));
  return Packer.pack(rowsPacked.map((r) => Number(r)), BigInt(24));
}


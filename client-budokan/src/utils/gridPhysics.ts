import { Block } from "@/types/types";

export const isCollision = (
  x: number,
  y: number,
  width: number,
  blocks: Block[],
  blockId: number,
) => {
  return blocks.some(
    (block) =>
      block.id !== blockId &&
      block.y === y &&
      x < block.x + block.width &&
      x + width > block.x,
  );
};

export const calculateFallDistance = (
  block: Block,
  blocks: Block[],
  gridHeight: number,
) => {
  let maxFall = gridHeight - block.y - 1;
  for (let y = block.y + 1; y < gridHeight; y++) {
    if (isCollision(block.x, y, block.width, blocks, block.id)) {
      maxFall = y - block.y - 1;
      break;
    }
  }
  return maxFall;
};

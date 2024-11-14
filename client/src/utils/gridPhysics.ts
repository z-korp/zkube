import { Block } from "@/types/types";

export const isBlocked = (
  initialX: number,
  newX: number,
  y: number,
  width: number,
  blocks: Block[],
  blockId: number,
) => {
  const rowBlocks = blocks.filter(
    (block) => block.y === y && block.id !== blockId,
  );

  if (newX > initialX) {
    for (const block of rowBlocks) {
      if (block.x >= initialX + width && block.x < newX + width) {
        return true;
      }
    }
  } else {
    for (const block of rowBlocks) {
      if (block.x + block.width > newX && block.x <= initialX) {
        return true;
      }
    }
  }

  return false;
};

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

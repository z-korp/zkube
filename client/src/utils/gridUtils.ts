import { Block } from "@/types/types";

export const transformToGridFormat = (
  blocks: Block[],
  gridWidth: number,
  gridHeight: number,
): number[][] => {
  const grid = Array.from({ length: gridHeight }, () =>
    Array(gridWidth).fill(0),
  );

  blocks.forEach((block) => {
    for (let i = 0; i < block.width; i++) {
      grid[block.y][block.x + i] = block.id;
    }
  });

  return grid;
};

export const removeCompleteRows = (
  blocks: Block[],
  gridWidth: number,
  gridHeight: number,
): { updatedBlocks: Block[]; completeRows: number[] } => {
  const grid = transformToGridFormat(blocks, gridWidth, gridHeight);

  const completeRows = grid
    .map((row, index) => (row.every((cell) => cell !== 0) ? index : -1))
    .filter((index) => index !== -1);

  const updatedBlocks = blocks.filter((block) => {
    const isBlockOnCompleteRow = completeRows.some((rowIndex) => {
      return block.y === rowIndex;
    });
    return !isBlockOnCompleteRow;
  });

  return { updatedBlocks, completeRows };
};

export const concatenateAndShiftBlocks = (
  initialData: Block[],
  nextLineData: Block[],
  gridHeight: number,
): Block[] => {
  const shiftedInitialData = initialData.map((block) => ({
    ...block,
    y: block.y - 1,
  }));
  const shiftedNextLineData = nextLineData.map((block) => ({
    ...block,
    y: gridHeight - 1,
  }));
  return [...shiftedInitialData, ...shiftedNextLineData];
};

export const transformDataContratIntoBlock = (grid: number[][]): Block[] => {
  return grid.flatMap((row, y) => {
    const blocks: Block[] = [];
    let x = 0;

    while (x < row.length) {
      const currentValue = row[x];
      if (currentValue > 0) {
        // La largeur est définie par la valeur
        blocks.push({
          id: Math.floor(Math.random() * 1000000),
          x,
          y,
          width: currentValue,
        });
        x += currentValue; // Passer à la prochaine position après ce bloc
      } else {
        x++; // Passer à la colonne suivante si la valeur est 0
      }
    }

    return blocks; // Retourner les blocs trouvés dans cette ligne
  });
};

export const isGridFull = (blocks: { y: number }[]): boolean => {
  return blocks.some((block) => block.y < 0);
};

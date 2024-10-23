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

export const transformDataContractIntoBlock = (grid: number[][]): Block[] => {
  return grid.flatMap((row, y) => {
    const blocks: Block[] = [];
    let x = 0;

    while (x < row.length) {
      const currentValue = row[x];
      if (currentValue > 0) {
        // La largeur est définie par la valeur
        blocks.push({
          id: Math.floor(Math.random() * 1000000) + Date.now(),
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

export const removeBlocksSameWidth = (
  block: Block,
  blocks: Block[],
): Block[] => {
  return blocks.filter((b) => b.width !== block.width);
};

export const removeBlocksSameRow = (block: Block, blocks: Block[]): Block[] => {
  return blocks.filter((b) => b.y !== block.y);
};

export const getBlocksSameRow = (
  rowIndex: number,
  blocks: Block[],
): Block[] => {
  return blocks.filter((b) => b.y == rowIndex);
};

export const removeBlockId = (block: Block, blocks: Block[]): Block[] => {
  return blocks.filter((b) => b.id !== block.id);
};

export const deepCompareBlocks = (
  array1: { id: number; x: number; y: number; width: number }[],
  array2: { id: number; x: number; y: number; width: number }[],
): boolean => {
  // Vérifie si les longueurs des deux tableaux sont différentes
  if (array1.length !== array2.length) {
    return false;
  }

  // Parcourt chaque objet des deux tableaux
  for (let i = 0; i < array1.length; i++) {
    const obj1 = array1[i];
    const obj2 = array2[i];

    // Comparaison des propriétés des objets (id, x, y, width)
    if (obj1.x !== obj2.x || obj1.y !== obj2.y || obj1.width !== obj2.width) {
      return false;
    }
  }

  // Si aucune différence n'a été trouvée, les deux tableaux sont identiques
  return true;
};

/**
 * Deeply compares two two-dimensional arrays of numbers.
 * @param a - The first array to compare.
 * @param b - The second array to compare.
 * @returns `true` if both arrays are deeply equal, `false` otherwise.
 */
export const deepCompareNumberArrays = (
  a: number[][] | null,
  b: number[][] | null,
): boolean => {
  if (a === b) return true; // Both are null or same reference
  if (a === null || b === null) return false; // One is null, the other is not
  if (a.length !== b.length) return false; // Different number of rows

  for (let i = 0; i < a.length; i++) {
    const rowA = a[i];
    const rowB = b[i];

    if (rowA.length !== rowB.length) return false; // Different number of columns

    for (let j = 0; j < rowA.length; j++) {
      if (rowA[j] !== rowB[j]) return false; // Different cell values
    }
  }

  return true; // All checks passed; arrays are deeply equal
};

/**
 * Formats a BigInt into a binary string with specific grouping:
 * - Splits into 3-bit blocks separated by '_'
 * - Inserts a line break after every 8 blocks (24 bits)
 * - Ensures a total of 10 rows by prepending zero rows if necessary
 *
 * @param {BigInt} num - The BigInt number to format.
 * @returns {string} - The formatted binary string.
 */
export function formatBigIntToBinaryArrayCustom(
  num: bigint,
  bitsPerBlock = 3,
  blocksPerRow = 8,
  totalRowsDesired = 10,
) {
  // Step 1: Convert BigInt to binary string
  let binaryStr = num.toString(2);

  // Step 2: Pad with leading zeros to make the length a multiple of bitsPerBlock
  const remainder = binaryStr.length % bitsPerBlock;
  if (remainder !== 0) {
    binaryStr = "0".repeat(bitsPerBlock - remainder) + binaryStr;
  }

  // Step 3: Split into bitsPerBlock blocks starting from the end
  const blocks = [];
  for (let i = binaryStr.length; i > 0; i -= bitsPerBlock) {
    const start = Math.max(i - bitsPerBlock, 0);
    const block = binaryStr.slice(start, i);
    blocks.unshift(block); // Add to the beginning to maintain order
  }

  // Step 4: Group into rows of blocksPerRow blocks each
  const rows: string[][] = [];
  let currentRow: string[] = [];
  blocks.reverse().forEach((block, index) => {
    currentRow.push(block);
    if ((index + 1) % blocksPerRow === 0) {
      rows.push(currentRow);
      currentRow = [];
    }
  });

  // Step 5: Handle the incomplete row by padding with '000'
  if (currentRow.length > 0) {
    const blocksNeeded = blocksPerRow - currentRow.length;
    for (let i = 0; i < blocksNeeded; i++) {
      currentRow.push("000"); // Pad with '000' blocks
    }
    rows.push(currentRow);
  }

  // Step 6: Prepend zero rows to make totalRowsDesired rows
  const zeroRow = ["000", "000", "000", "000", "000", "000", "000", "000"];
  const zeroRowsNeeded = totalRowsDesired - rows.length;

  const paddedRows: string[][] = [];

  for (let i = 0; i < zeroRowsNeeded; i++) {
    paddedRows.push(zeroRow);
  }

  // Combine zero rows with the data rows
  const finalRows = [...paddedRows, ...rows.reverse()];

  // Return
  const blockRawFormatted = finalRows.map((row) => row.join("_"));
  const blockRawFormattedReversed = finalRows.map((row) =>
    row.reverse().join("_"),
  );
  return [blockRawFormatted, blockRawFormattedReversed];
}

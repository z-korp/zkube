import { Piece , Cell as CellType} from '@/types/types';
import { convertGridToPieces } from '@/utils/piece';
import { useState, useEffect } from 'react';


export const usePieces = (initialGrid: CellType[][]) => {
    const [grid, setGrid] = useState<CellType[][]>(initialGrid);
    const [pieces, setPieces] = useState<Piece[]>([]);

    useEffect(() => {
      setPieces(convertGridToPieces(grid));
    }, [grid]);

    const updateGrid = (newGrid: CellType[][]) => {
      setGrid(newGrid);
    };

    return { pieces, updateGrid };
};
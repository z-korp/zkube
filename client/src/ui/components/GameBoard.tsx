import React, { useState, useEffect } from "react";
import { Card } from "@/ui/elements/ui/card";

interface Cell {
  id: string;
  element: string | null;
}

const GameBoard = () => {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const rows = 8;
  const cols = 6;

  useEffect(() => {
    initializeGrid();
  }, []);

  const initializeGrid = () => {
    const newGrid: Cell[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: Cell[] = [];
      for (let j = 0; j < cols; j++) {
        if (Math.random() < 0.33) {
          row.push({ id: `${i}-${j}`, element: getRandomElement() });
        } else {
          row.push({ id: `${i}-${j}`, element: null });
        }
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
  };

  const getRandomElement = (): string | null => {
    const elements: (string | null)[] = [
      "stone1",
      "stone2",
      "stone3",
      "stone4",
    ];
    return elements[Math.floor(Math.random() * elements.length)];
  };

  const applyGravity = () => {
    const newGrid = [...grid];
    for (let col = 0; col < cols; col++) {
      let emptyRow = rows - 1;
      for (let row = rows - 1; row >= 0; row--) {
        if (newGrid[row][col].element) {
          if (row !== emptyRow) {
            newGrid[emptyRow][col].element = newGrid[row][col].element;
            newGrid[row][col].element = null;
          }
          emptyRow--;
        }
      }
    }
    setGrid(newGrid);
  };

  const fillEmptySpaces = () => {
    // ... (code de fillEmptySpaces ici)
  };

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    const newGrid = [...grid];
    newGrid[rowIndex][colIndex].element = null;
    setGrid(newGrid);

    // Appliquer la gravité et remplir les espaces vides après un court délai
    setTimeout(() => {
      applyGravity();
      setTimeout(fillEmptySpaces, 300); // Délai avant de remplir les espaces vides
    }, 100);
  };

  return (
    <Card className="p-4 bg-slate-800">
      <div className="grid grid-cols-6 gap-1">
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={cell.id}
              className="w-12 h-12 bg-slate-700 flex items-center justify-center cursor-pointer"
              onClick={() => handleCellClick(rowIndex, colIndex)}
            >
              {cell.element && (
                <div
                  className={`w-10 h-10 rounded-md ${getElementColor(cell.element)}`}
                />
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

const getElementColor = (element: any) => {
  switch (element) {
    case "stone1":
      return "bg-red-500";
    case "stone2":
      return "bg-blue-500";
    case "stone3":
      return "bg-green-500";
    case "stone4":
      return "bg-yellow-500";
    default:
      return "";
  }
};

export default GameBoard;

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
    const newGrid = [];
    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < cols; j++) {
        row.push({ id: `${i}-${j}`, element: getRandomElement() });
      }
      newGrid.push(row);
    }
    setGrid(newGrid as any);
  };

  const getRandomElement = () => {
    const elements = ["stone1", "stone2", "stone3", "stone4", null];
    return elements[Math.floor(Math.random() * elements.length)];
  };

  return (
    <Card className="p-4 bg-slate-800">
      <div className="grid grid-cols-6 gap-1">
        {grid.map((row, rowIndex) =>
          row.map((cell: any) => (
            <div
              key={cell.id}
              className="w-12 h-12 bg-slate-700 flex items-center justify-center"
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

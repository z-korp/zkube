import React from "react";
import { Card } from "@/ui/elements/ui/card";

const NextLine = ({ numbers }: { numbers: number[] }) => {
  const cols = 8; // Définissez le nombre de colonnes pour la grille
  const rows = Math.ceil(numbers.length / cols); // Calculez le nombre de lignes nécessaires

  return (
    <Card className="p-4 bg-secondary">
      <div className="bg-slate-800">
        <div
          className="border-4 border-slate-800 grid grid-cols-[repeat(8,1fr)] gap-1"
          style={{ padding: "20px" }}
        >
          {numbers.map((number, index) => (
            <div
              key={index}
              className="h-12 w-12 bg-secondary flex items-center justify-center text-white"
              style={{
                gridColumn: "span 1",
              }}
            >
              {number}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default NextLine;

import React from "react";
import { Card } from "@/ui/elements/ui/card";

// Images importées
import stone1Image from "/assets/block-1.png";
import stone2Image from "/assets/block-2.png";
import stone3Image from "/assets/block-3.png";
import stone4Image from "/assets/block-4.png";

// Mapping des nombres aux images
const numberToImage = {
  1: stone1Image,
  2: stone2Image,
  3: stone3Image,
  4: stone4Image,
  // Ajoutez plus si nécessaire
};

const NumberDisplay = ({ numbers }) => {
  const cols = 8;
  const rows = Math.ceil(numbers.length / cols);

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
              className="h-12 w-12 bg-secondary flex items-center justify-center"
              style={{
                backgroundImage: `url(${numberToImage[number]})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            ></div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default NumberDisplay;

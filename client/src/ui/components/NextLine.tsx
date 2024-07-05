import React from "react";
import { Card } from "@/ui/elements/card";

import stone1Image from "/assets/block-1.png";
import stone2Image from "/assets/block-2.png";
import stone3Image from "/assets/block-3.png";
import stone4Image from "/assets/block-4.png";

const numberToImage = {
  1: stone1Image,
  2: stone2Image,
  3: stone3Image,
  4: stone4Image,
};

const NextLine = ({ numbers }: { numbers: any }) => {
  const cols = 8;

  return (
    <Card className="px-4 bg-secondary">
      <div className="bg-slate-800 relative">
        <div
          className="border-4 border-slate-800 grid grid-cols-[repeat(32,1fr)] sm:gap-2 gap-[2px]"
          style={{ position: "relative" }}
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div
              key={`cell-${colIndex}`}
              className="h-10 w-10 sm:h-12 sm:w-12 bg-secondary relative"
              style={{ gridColumn: "span 4" }}
            >
              {numbers[colIndex] !== 0 && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    backgroundImage: `url(${numberToImage[numbers[colIndex]]})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default NextLine;

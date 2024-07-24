import { Card } from "@/ui/elements/card";
import ImageBlock from "../theme/ImageBlock";
import useTemplateTheme from "@/hooks/useTemplateTheme";
import { useMediaQuery } from "react-responsive";

interface Block {
  number: number;
  count: number;
}

interface BlocksResult {
  blocks: Block[];
  toString: () => string;
}

const createBlocks = ({ numbers }: { numbers: number[] }): BlocksResult => {
  if (!numbers || numbers.length === 0) {
    return {
      blocks: [],
      toString: () => "No blocks available",
    };
  }

  const blocks: Block[] = [];
  let currentNumber = numbers[0];
  let currentCount = 1;

  for (let i = 1; i < numbers.length; i++) {
    if (
      numbers[i] === currentNumber &&
      currentCount < numbers[i] &&
      numbers[i] !== 0
    ) {
      currentCount++;
    } else {
      blocks.push({ number: currentNumber, count: currentCount });
      currentNumber = numbers[i];
      currentCount = 1;
    }
  }
  blocks.push({ number: currentNumber, count: currentCount });

  return {
    blocks,
    toString: function () {
      return this.blocks
        .map((block) => `${block.count} x ${block.number}`)
        .join(", ");
    },
  };
};

const NextLine = ({ numbers }: { numbers: number[] }) => {
  const result = createBlocks({ numbers });

  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  const { themeTemplate } = useTemplateTheme();
  const imgsBlock: { [key: number]: string } = ImageBlock(themeTemplate);

  return (
    <Card className="px-4 bg-secondary p-4">
      <div className="bg-slate-800 relative">
        <div
          className={`border-4 border-slate-800 grid gap-1 ${isMdOrLarger ? "w-[412px]" : "w-[300px]"}`}
          style={{
            gridTemplateColumns: "repeat(8, 1fr)",
          }}
        >
          {result.blocks.map((block, blockIndex) => (
            <div
              key={`block-${blockIndex}`}
              className="h-8 sm:h-12 bg-secondary relative"
              style={{ gridColumn: `span ${block.count}` }}
            >
              {block.number !== 0 && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    backgroundImage: `url(${imgsBlock[block.number]})`,
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

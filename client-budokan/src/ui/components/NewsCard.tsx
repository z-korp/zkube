import { Card, CardContent, CardHeader, CardTitle } from "../elements/card";

export default function NewsCard({
  index,
  title,
  description,
  timestamp,
}: {
  index: string;
  title: string;
  description: string;
  timestamp: string;
}) {
  return (
    <Card className=" bg-[#1c283a] w-full shadow-md rounded-lg md:h-[250px]">
      <CardHeader className="flex flex-col justify-center items-center">
        <CardTitle className="p-2 md:p-3 mt-[-50px] bg-[#172232] rounded-md">
          News {index}
        </CardTitle>
      </CardHeader>
      <CardContent className="mt-[-10px]">
        <h2 className="text-center mb-3 text-lg">{title}</h2>
        <p className="text-sm text-center mb-4">{description}</p>
        <h2 className="text-right text-xs">{timestamp}</h2>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "../elements/card";
export default function ChestCard({
  type,
  reward,
  image,
  availability,
}: {
  type: string;
  reward: string;
  image: string;
  availability: string;
}) {
  return (
    <Card className=" bg-[#1c283a] w-full shadow-md rounded-lg h-fit">
      <CardHeader className="flex flex-col justify-center items-center">
        <CardTitle className="p-3 mt-[-50px] bg-[#172232] rounded-md">
          {type} Chest
        </CardTitle>
      </CardHeader>
      <CardContent className="mt-[-10px]">
        <div className="w-full bg-[#11172a] rounded-md h-[200px]">
          <img src={image} alt="" />
        </div>
        <p className="text-sm text-center my-4">{reward} stark to share</p>
        <div className="mx-auto w-fit py-2 px-4 rounded-md bg-[#11172a]">
          {availability}
        </div>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "../elements/card";

export default function QuestCard({
  title,
  objective,
  reward,
  deadline,
}: {
  title: string;
  objective: string;
  reward: string;
  deadline: string;
}) {
  return (
    <Card className=" bg-[#1c283a] w-full shadow-md rounded-lg md:h-[250px]">
      <CardHeader className="flex flex-col justify-center items-center">
        <CardTitle className="p-2 md:p-3 mt-[-50px] bg-[#172232] rounded-md">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="md:text-base text-sm flex flex-col md:gap-y-4 gap-y-2">
        <p>Objective: {objective}</p>
        <p>Reward: {reward}</p>
        <p>Deadline: {deadline}</p>
      </CardContent>
    </Card>
  );
}

import React from "react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Card, CardHeader, CardContent, CardTitle } from "@/ui/elements/card";

const ContentTabs = () => {
  const [selectedTab, setSelectedTab] = useState("weekly-quests");

  return (
    <div className="absolute inset-0 bg-white bg-opacity-65 flex justify-center pt-[120px] z-[20] backdrop-blur-sm">
      <div className="py-5 px-[40px] bg-black h-fit bg-opacity-85 rounded-md">
        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="w-[1000px]"
        >
          <TabsList className="flex justify-center text-2xl gap-x-4">
            <TabsTrigger
              value="weekly-quests"
              className="px-4 py-2 data-[state=active]:bg-[#1c283a] bg-[#10172a] rounded-t-md"
            >
              Weekly Quests
            </TabsTrigger>
            <TabsTrigger
              value="news"
              className="px-4 py-2 data-[state=active]:bg-[#1c283a] bg-[#10172a] rounded-t-md"
            >
              News
            </TabsTrigger>
            <TabsTrigger
              value="chests"
              className="px-4 py-2 data-[state=active]:bg-[#1c283a] bg-[#10172a] rounded-t-md"
            >
              Chests
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="weekly-quests"
            className="py-8 bg-[#1c283a] rounded"
          >
            <WeeklyQuests />
          </TabsContent>

          <TabsContent value="news" className="py-8 bg-[#1c283a] rounded">
            <News />
          </TabsContent>

          <TabsContent value="chests" className="py-8 bg-[#1c283a] rounded">
            <Chests />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const WeeklyQuests = () => (
  <div className="grid grid-cols-3 gap-x-3 bg-[#11172a] py-5  pt-[35px] px-8">
    <QuestCard
      title="Quest 1"
      objective="Capture the flag"
      reward="30 usdt"
      deadline="28th August 2024"
    />
    <QuestCard
      title="Quest 2"
      objective="Capture the flag"
      reward="30 usdt"
      deadline="12th October 2024"
    />
    <QuestCard
      title="Quest 3"
      objective="Capture the flag"
      reward="30 usdt"
      deadline="28th January 2024"
    />
  </div>
);

const QuestCard = ({
  title,
  objective,
  reward,
  deadline,
}: {
  title: string;
  objective: string;
  reward: string;
  deadline: string;
}) => (
  <Card className=" bg-[#1c283a] w-full shadow-md rounded-lg h-[250px]">
    <CardHeader className="flex flex-col justify-center items-center">
      <CardTitle className="p-3 mt-[-50px] bg-[#172232] rounded-md">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="text-base flex flex-col gap-y-4">
      <p>Objective: {objective}</p>
      <p>Reward: {reward}</p>
      <p>Deadline: {deadline}</p>
    </CardContent>
  </Card>
);

const News = () => (
  <div className="grid grid-cols-3 gap-x-3 bg-[#11172a] py-5  pt-[35px] px-8">
    <NewsCard
      title="Zkube gets a major upgrade"
      index="1"
      description="Developers at zkube have updated the user interface of zkube"
      timestamp="28th January 2024"
    />
    <NewsCard
      title="Zkube gets a major upgrade"
      index="2"
      description="Developers at zkube have updated the user interface of zkube"
      timestamp="28th January 2024"
    />
    <NewsCard
      title="Zkube gets a major upgrade"
      index="3"
      description="Developers at zkube have updated the user interface of zkube"
      timestamp="28th January 2024"
    />
  </div>
);

const NewsCard = ({
  index,
  title,
  description,
  timestamp,
}: {
  index: string;
  title: string;
  description: string;
  timestamp: string;
}) => (
  <Card className=" bg-[#1c283a] w-full shadow-md rounded-lg h-[250px]">
    <CardHeader className="flex flex-col justify-center items-center">
      <CardTitle className="p-3 mt-[-50px] bg-[#172232] rounded-md">
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

const Chests = () => (
  <div className="grid grid-cols-3 gap-x-3 bg-[#11172a] py-5  pt-[35px] px-8">
    <ChestCard type="Gold" reward="100" availability="12 / 128" image="" />
    <ChestCard type="Silver" reward="130" availability="5656 / 6578" image="" />
    <ChestCard type="Bronze" reward="270" availability="367 / 1237" image="" />
  </div>
);

const ChestCard = ({
  type,
  reward,
  image,
  availability,
}: {
  type: string;
  reward: string;
  image: string;
  availability: string;
}) => (
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

export default ContentTabs;

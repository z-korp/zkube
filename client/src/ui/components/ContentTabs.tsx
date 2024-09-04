import React from "react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Card, CardHeader, CardContent, CardTitle } from "@/ui/elements/card";
import WeeklyQuests from "./WeeklyQuests";
import News from "./News";
import Chests from "./Chests";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../elements/dialog";
import { Button } from "../elements/button";

const ContentTabs = () => {
  const [selectedTab, setSelectedTab] = useState("weekly-quests");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Extras</Button>
      </DialogTrigger>
      <DialogContent className="min-w-[1000px]">
        <DialogHeader className="flex items-center text-2xl">
          <DialogTitle>Extras</DialogTitle>
        </DialogHeader>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="">
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
      </DialogContent>
    </Dialog>
  );
};

export default ContentTabs;

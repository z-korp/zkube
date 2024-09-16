import React from "react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/elements/tabs";
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
import { Button } from "@/ui/elements/button";

const ContentTabs = () => {
  const [selectedTab, setSelectedTab] = useState("weekly-quests");

  return ( 
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Extras</Button>
      </DialogTrigger>
      <DialogContent className="lg:max-w-[65%] px-3 lg:min-w-[65%] max-w-[90%]">
        <DialogHeader className="flex items-center text-base md:text-2xl">
          <DialogTitle>Extras</DialogTitle>
        </DialogHeader>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="flex w-full justify-center bg-transparent gap-x-1 md:gap-x-4">
            <TabsTrigger
              value="weekly-quests"
              className="px-4 py-2 w-fit data-[state=active]:bg-[#1c283a] bg-[#10172a] rounded-none rounded-t-md"
            >
              Weekly Quests
            </TabsTrigger>
            <TabsTrigger
              value="news"
              className="px-4 py-2 data-[state=active]:bg-[#1c283a] bg-[#10172a] rounded-none rounded-t-md"
            >
              News
            </TabsTrigger>
            <TabsTrigger
              value="chests"
              className="px-4 py-2 data-[state=active]:bg-[#1c283a] bg-[#10172a] rounded-none rounded-t-md"
            >
              Chests
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="weekly-quests"
            className="py-4 mt-0 md:py-8 bg-[#1c283a] rounded"
          >
            <WeeklyQuests />
          </TabsContent>

          <TabsContent
            value="news"
            className="py-4 md:py-8 mt-0 bg-[#1c283a] rounded"
          >
            <News />
          </TabsContent>

          <TabsContent
            value="chests"
            className="py-4 md:py-8 mt-0 bg-[#1c283a] rounded"
          >
            <Chests />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ContentTabs;

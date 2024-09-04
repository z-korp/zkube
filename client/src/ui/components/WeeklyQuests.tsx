import QuestCard from "./QuestCard";

export default function WeeklyQuests() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-3 gap-y-10 bg-[#11172a] md:py-5 py-3  pt-[35px] px-4 md:px-8 md:max-h-fit max-h-[500px] overflow-y-auto">
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
}

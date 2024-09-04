import QuestCard from "./QuestCard";

export default function WeeklyQuests() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3 bg-[#11172a] sm:py-5 py-3  pt-[35px] px-4 sm:px-8">
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

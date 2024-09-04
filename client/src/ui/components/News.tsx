import NewsCard from "./NewsCard";

export default function News() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-3 gap-y-10 bg-[#11172a] md:py-9 py-3  pt-[35px] px-4 md:px-8 md:max-h-fit max-h-[500px] overflow-y-auto">
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
}

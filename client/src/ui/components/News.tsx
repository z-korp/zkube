import NewsCard from "./NewsCard";

export default function News() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3 bg-[#11172a] sm:py-5 py-3  pt-[35px] px-4 sm:px-8">
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

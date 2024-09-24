import ChestCard from "./ChestCard";

export default function Chests() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-3 gap-y-10 bg-[#11172a] md:py-9 py-3  pt-[35px] px-4 lg:px-8 md:max-h-fit max-h-[500px] overflow-y-auto">
      <ChestCard type="Gold" reward="100" availability="12 / 128" image="" />
      <ChestCard
        type="Silver"
        reward="130"
        availability="5656 / 6578"
        image=""
      />
      <ChestCard
        type="Bronze"
        reward="270"
        availability="367 / 1237"
        image=""
      />
    </div>
  );
}

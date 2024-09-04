import ChestCard from "./ChestCard";

export default function Chests() {
  return (
    <div className="grid grid-cols-3 gap-x-3 bg-[#11172a] py-5  pt-[35px] px-8">
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

import BonusButton from "../components/BonusButton";
import { BonusType } from "@/dojo/game/types/bonus";

interface GameBonusProps {
  bonusSlots: {
    type: BonusType;
    count: number;
    icon: string;
    tooltip: string;
    onClick: () => void;
  }[];
  bonus: BonusType;
}

export const GameBonus: React.FC<GameBonusProps> = ({ bonusSlots, bonus }) => {
  return (
    <div className="grid grid-cols-3 gap-1">
      {bonusSlots.map((slot, index) => (
        <div
          key={`${slot.type}-${index}`}
          className={index === 0 ? "flex flex-col items-start" : index === 1 ? "flex flex-col items-center" : "flex flex-col w-full items-end"}
        >
          <BonusButton
            onClick={slot.onClick}
            urlImage={slot.icon}
            bonusCount={slot.count}
            tooltipText={slot.tooltip}
            bonusName={slot.type}
            bonus={bonus}
          />
        </div>
      ))}
    </div>
  );
};

export default GameBonus;

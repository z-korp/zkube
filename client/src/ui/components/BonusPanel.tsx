import React from "react";
import { GameBonus } from "../containers/GameBonus";

interface BonusPanelProps {
  onBonusWaveClick: () => void;
  onBonusTikiClick: () => void;
  onBonusHammerClick: () => void;
  hammerCount: number;
  tikiCount: number;
  waveCount: number;
}

const BonusPanel: React.FC<BonusPanelProps> = (props) => {
  return <GameBonus {...props} />;
};

export default BonusPanel;

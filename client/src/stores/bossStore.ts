import { create } from "zustand";

const useBossStore = create((set) => ({
  // initial states
  bossLifePoint: 100,
  bossStamina: 0,
  bossShield: 80,

  // actions to update states
  setBossLifePoint: (lifePoint: number) => set({ bossLifePoint: lifePoint }),
  setBossStamina: (stamina: number) => set({ bossStamina: stamina }),
  setBossShield: (shield: number) => set({ bossShield: shield }),

  // actions to reset states
  resetBoss: () => set({ bossLifePoint: 100, bossStamina: 0, bossShield: 80 }),
}));

export default useBossStore;

export interface MutatorDef {
  id: number;
  name: string;
  description: string;
  icon: string;
  effects: string[];
}

export const MUTATOR_DEFS: Record<number, MutatorDef> = {
  0: {
    id: 0,
    name: "No Mutator",
    description: "Standard rules apply",
    icon: "⚖️",
    effects: [],
  },
  1: {
    id: 1,
    name: "Tidecaller",
    description: "The ocean rewards clean sweeps",
    icon: "🌊",
    effects: ["+2 bonus lines per line clear", "Rewards efficient clearing"],
  },
  2: {
    id: 2,
    name: "Riptide",
    description: "Combos surge with increasing power",
    icon: "🌀",
    effects: ["1.5× combo score multiplier", "1.3× endless difficulty ramp"],
  },
};

export const getMutatorDef = (id: number): MutatorDef =>
  MUTATOR_DEFS[id] ?? MUTATOR_DEFS[0];

export const BONUS_TYPES: Record<number, { name: string; icon: string; description: string }> = {
  0: { name: "None", icon: "", description: "" },
  1: { name: "Hammer", icon: "/assets/bonus/hammer.png", description: "Destroy a single block" },
  2: { name: "Totem", icon: "/assets/bonus/tiki.png", description: "Destroy all blocks of one size" },
  3: { name: "Wave", icon: "/assets/bonus/wave.png", description: "Clear an entire row" },
};

export const getBonusType = (id: number) => BONUS_TYPES[id] ?? BONUS_TYPES[0];

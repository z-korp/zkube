export interface MutatorDef {
  id: number;
  name: string;
  description: string;
  icon: string;
  effects: string[];
}

// Trigger types: 1=combo, 2=lines, 3=score
// Bonus types: 1=Hammer (destroy 1 block), 2=Totem (destroy all blocks of same size), 3=Wave (clear entire row)

export const MUTATOR_DEFS: Record<number, MutatorDef> = {
  0: {
    id: 0,
    name: "No Mutator",
    description: "Standard rules apply",
    icon: "⚖️",
    effects: [],
  },

  // ── Active Mutators (odd IDs 1-19) — earn bonus powers during play ──

  1: {
    id: 1,
    name: "Tidecaller",
    description: "Earn 3 different bonus tools as you play",
    icon: "🌊",
    effects: ["Chain 4 combos → destroy a block", "Reach 20 points → clear a row", "Clear 10 lines → destroy same-size blocks"],
  },
  3: {
    id: 3,
    name: "Pharaoh's Command",
    description: "Start with a row-clearing power, earn more as you go",
    icon: "☀️",
    effects: ["Chain 3 combos → clear a row (start with 1 free use)", "Clear 6 lines → destroy a block"],
  },
  5: {
    id: 5,
    name: "Ragnarok",
    description: "Same-size destruction powers build up fast",
    icon: "⚡",
    effects: ["Chain 3 combos → destroy same-size blocks (start with 1)", "Clear 8 lines → destroy same-size blocks"],
  },
  7: {
    id: 7,
    name: "Athena's Chisel",
    description: "Precision block-breaking through combos and scoring",
    icon: "🏛️",
    effects: ["Chain 4 combos → destroy a block", "Reach 15 points → destroy a block"],
  },
  9: {
    id: 9,
    name: "Dragon Breath",
    description: "Row-clearing sweeps dominate this zone",
    icon: "🐉",
    effects: ["Clear 6 lines → clear a row (start with 1)", "Reach 18 points → clear a row"],
  },
  11: {
    id: 11,
    name: "Mosaic Eye",
    description: "Pattern recognition unlocks same-size destruction",
    icon: "🔮",
    effects: ["Reach 15 points → destroy same-size blocks", "Clear 7 lines → destroy same-size blocks"],
  },
  13: {
    id: 13,
    name: "Iai Strike",
    description: "Quick combos and efficient clears earn surgical strikes",
    icon: "⛩️",
    effects: ["Chain 3 combos → destroy a block", "Clear 5 lines → destroy a block"],
  },
  15: {
    id: 15,
    name: "Blood Ritual",
    description: "Start with 2 charges of every tool — the most powerful zone",
    icon: "💀",
    effects: ["Chain 6 combos → destroy a block (start with 2)", "Clear 12 lines → clear a row (start with 2)", "Reach 30 points → destroy same-size blocks (start with 2)"],
  },
  17: {
    id: 17,
    name: "War Beat",
    description: "Higher combos unlock increasingly powerful tools",
    icon: "🥁",
    effects: ["4-combo → destroy a block", "5-combo → destroy same-size blocks", "6-combo → clear a row"],
  },
  19: {
    id: 19,
    name: "Inti's Demand",
    description: "Only one tool — master the combo to earn it",
    icon: "🌞",
    effects: ["Chain 5 combos → destroy a block"],
  },

  // ── Passive Mutators (even IDs 2-20) — change the rules of the zone ──

  2: {
    id: 2,
    name: "Calm Tides",
    description: "A gentle introduction — extra lines appear when you clear, and stars are easier to earn",
    icon: "🌀",
    effects: ["+1 bonus line per clear", "Easier star thresholds"],
  },
  4: {
    id: 4,
    name: "Foundation Stone",
    description: "Start with more rows on the grid, but combos score 50% more and perfect clears are rewarded",
    icon: "🧱",
    effects: ["1.5x combo score", "+15 points for perfect clears", "5 starting rows"],
  },
  6: {
    id: 6,
    name: "Frozen Rage",
    description: "Combos hit harder and clearing lines spawns extra rows — aggressive and rewarding",
    icon: "❄️",
    effects: ["1.5x combo score", "+2 bonus lines per clear", "4 starting rows"],
  },
  8: {
    id: 8,
    name: "Marble Discipline",
    description: "Perfect clears are rewarded, but earning stars requires more precision",
    icon: "🏺",
    effects: ["+10 points for perfect clears", "Harder star thresholds", "4 starting rows"],
  },
  10: {
    id: 10,
    name: "Imperial Scale",
    description: "Extra lines flood the grid when you clear — overwhelming but powerful if controlled",
    icon: "🐲",
    effects: ["+3 bonus lines per clear", "5 starting rows"],
  },
  12: {
    id: 12,
    name: "Geometric Flow",
    description: "Balanced modifiers — slightly better combos, extra lines, but tighter star goals",
    icon: "🕌",
    effects: ["1.2x combo score", "+1 bonus line per clear", "Harder star thresholds", "4 starting rows"],
  },
  14: {
    id: 14,
    name: "Bushido",
    description: "The warrior's code — combos hit 30% harder and perfect clears are honored",
    icon: "🗡️",
    effects: ["1.3x combo score", "+5 points for perfect clears", "4 starting rows"],
  },
  16: {
    id: 16,
    name: "Jungle Altar",
    description: "Combos are supercharged at 1.75x — chain them for massive scores",
    icon: "🌿",
    effects: ["1.75x combo score", "4 starting rows"],
  },
  18: {
    id: 18,
    name: "Primal Pulse",
    description: "Raw combo power at 1.6x, but stars are harder to earn — risk and reward",
    icon: "🔥",
    effects: ["1.6x combo score", "Harder star thresholds", "4 starting rows"],
  },
  20: {
    id: 20,
    name: "Altitude",
    description: "The ultimate test — 2x combo score and huge perfect clear bonuses, but the hardest star thresholds",
    icon: "⛰️",
    effects: ["2x combo score", "+20 points for perfect clears", "Hardest star thresholds", "5 starting rows"],
  },
};

const createFallbackMutator = (id: number, onChainName?: string): MutatorDef => ({
  id,
  name: onChainName || `Mutator ${id}`,
  description: onChainName
    ? `On-chain mutator: ${onChainName}`
    : "Unknown mutator",
  icon: id % 2 === 0 ? "🛡️" : "✨",
  effects: [],
});

export const getMutatorDef = (id: number, onChainName?: string): MutatorDef =>
  id <= 0 ? MUTATOR_DEFS[0] : (MUTATOR_DEFS[id] ?? createFallbackMutator(id, onChainName));

export const BONUS_TYPES: Record<number, { name: string; icon: string; description: string }> = {
  0: { name: "None", icon: "", description: "" },
  1: { name: "Hammer", icon: "/assets/bonus/hammer.png", description: "Destroy a single block" },
  2: { name: "Totem", icon: "/assets/bonus/tiki.png", description: "Destroy all blocks of one size" },
  3: { name: "Wave", icon: "/assets/bonus/wave.png", description: "Clear an entire row" },
};

export const getBonusType = (id: number) => BONUS_TYPES[id] ?? BONUS_TYPES[0];

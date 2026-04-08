export interface MutatorDef {
  id: number;
  name: string;
  description: string;
  icon: string;
  effects: string[];
}

// Trigger types: 1=combo, 2=lines, 3=score
// Bonus types: 1=Hammer, 2=Totem, 3=Wave

export const MUTATOR_DEFS: Record<number, MutatorDef> = {
  0: {
    id: 0,
    name: "No Mutator",
    description: "Standard rules apply",
    icon: "⚖️",
    effects: [],
  },

  // ── Active Mutators (odd IDs 1-19) — bonus slots ──

  1: {
    id: 1,
    name: "Tidecaller",
    description: "The ocean rewards patience and precision",
    icon: "🌊",
    effects: ["Hammer on 4-combo", "Wave on 20 score", "Totem on 10 lines"],
  },
  3: {
    id: 3,
    name: "Pharaoh's Command",
    description: "Ancient power grants tools from the start",
    icon: "☀️",
    effects: ["Wave on 3-combo (starts with 1)", "Hammer on 6 lines"],
  },
  5: {
    id: 5,
    name: "Ragnarok",
    description: "Norse fury channels totemic destruction",
    icon: "⚡",
    effects: ["Totem on 3-combo (starts with 1)", "Totem on 8 lines"],
  },
  7: {
    id: 7,
    name: "Athena's Chisel",
    description: "Precision strikes carve through the grid",
    icon: "🏛️",
    effects: ["Hammer on 4-combo", "Hammer on 15 score"],
  },
  9: {
    id: 9,
    name: "Dragon Breath",
    description: "Sweeping waves engulf the battlefield",
    icon: "🐉",
    effects: ["Wave on 6 lines (starts with 1)", "Wave on 18 score"],
  },
  11: {
    id: 11,
    name: "Mosaic Eye",
    description: "Patterns reveal hidden connections",
    icon: "🔮",
    effects: ["Totem on 15 score", "Totem on 7 lines"],
  },
  13: {
    id: 13,
    name: "Iai Strike",
    description: "Swift decisive blows shatter blocks",
    icon: "⛩️",
    effects: ["Hammer on 3-combo", "Hammer on 5 lines"],
  },
  15: {
    id: 15,
    name: "Blood Ritual",
    description: "Ancient rites grant triple bonus power",
    icon: "💀",
    effects: ["Hammer on 6-combo (starts with 2)", "Wave on 12 lines (starts with 2)", "Totem on 30 score (starts with 2)"],
  },
  17: {
    id: 17,
    name: "War Beat",
    description: "Escalating combos unlock greater tools",
    icon: "🥁",
    effects: ["Hammer on 4-combo", "Totem on 5-combo", "Wave on 6-combo"],
  },
  19: {
    id: 19,
    name: "Inti's Demand",
    description: "The sun god demands focused strikes",
    icon: "🌞",
    effects: ["Hammer on 5-combo"],
  },

  // ── Passive Mutators (even IDs 2-20) — stat modifiers ──

  2: {
    id: 2,
    name: "Calm Tides",
    description: "Gentle currents ease your path",
    icon: "🌀",
    effects: ["+1 bonus line per clear", "Slightly easier stars"],
  },
  4: {
    id: 4,
    name: "Foundation Stone",
    description: "Build upon a solid base",
    icon: "🧱",
    effects: ["1.5x combo score", "+15 perfect clear bonus", "5 starting rows"],
  },
  6: {
    id: 6,
    name: "Frozen Rage",
    description: "Cold fury amplifies combos",
    icon: "❄️",
    effects: ["1.5x combo score", "+2 bonus lines per clear", "4 starting rows"],
  },
  8: {
    id: 8,
    name: "Marble Discipline",
    description: "Precise form demands excellence",
    icon: "🏺",
    effects: ["+10 perfect clear bonus", "Harder star thresholds", "4 starting rows"],
  },
  10: {
    id: 10,
    name: "Imperial Scale",
    description: "Grand design rewards line mastery",
    icon: "🐲",
    effects: ["+3 bonus lines per clear", "5 starting rows"],
  },
  12: {
    id: 12,
    name: "Geometric Flow",
    description: "Elegant patterns amplify scoring",
    icon: "🕌",
    effects: ["1.2x combo score", "+1 bonus line per clear", "Harder star thresholds", "4 starting rows"],
  },
  14: {
    id: 14,
    name: "Bushido",
    description: "The warrior's code rewards honor",
    icon: "🗡️",
    effects: ["1.3x combo score", "+5 perfect clear bonus", "4 starting rows"],
  },
  16: {
    id: 16,
    name: "Jungle Altar",
    description: "Primal energy supercharges combos",
    icon: "🌿",
    effects: ["1.75x combo score", "4 starting rows"],
  },
  18: {
    id: 18,
    name: "Primal Pulse",
    description: "Raw power surges through each move",
    icon: "🔥",
    effects: ["1.6x combo score", "Harder star thresholds", "4 starting rows"],
  },
  20: {
    id: 20,
    name: "Altitude",
    description: "Thin air demands peak performance",
    icon: "⛰️",
    effects: ["2x combo score", "+20 perfect clear bonus", "Harder star thresholds", "5 starting rows"],
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

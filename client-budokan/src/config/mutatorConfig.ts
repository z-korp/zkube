export interface MutatorDef {
  id: number;
  name: string;
  description: string;
  icon: string;
  /** Zone-mode effects (includes star-threshold lines). */
  effects: string[];
  /**
   * Endless / tournament effects — star thresholds are omitted because star
   * ratings don't apply to those modes. Falls back to `effects` when absent.
   */
  effectsEndless?: string[];
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

  // Zone 1 — Mako 🐢 / Tiki / Ocean
  1: { id: 1, name: "Mako's Bounty", description: "The sea turtle shares three gifts of the tide", icon: "🐢",
    effects: ["Chain 4 combos → destroy a block", "Reach 20 points → clear a row", "Clear 10 lines → destroy same-size blocks"] },
  // Zone 2 — Sobek 🐊 / Egypt
  3: { id: 3, name: "Sobek's Decree", description: "The Nile Guardian grants a row-clearing wave. Earn more through mastery.", icon: "🐊",
    effects: ["Chain 3 combos → clear a row (start with 1 free use)", "Clear 6 lines → destroy a block"] },
  // Zone 3 — Fenris 🐺 / Norse
  5: { id: 5, name: "Fenris Howl", description: "The frost wolf's cry shatters the alike. Chain combos to unleash it.", icon: "🐺",
    effects: ["Chain 3 combos → destroy same-size blocks (start with 1)", "Clear 8 lines → destroy same-size blocks"] },
  // Zone 4 — Noctua 🦉 / Greece
  7: { id: 7, name: "Noctua's Insight", description: "The owl sees what others miss. Combos and scores yield precise strikes.", icon: "🦉",
    effects: ["Chain 4 combos → destroy a block", "Reach 15 points → destroy a block"] },
  // Zone 5 — Long 🐲 / China
  9: { id: 9, name: "Dragon's Breath", description: "Sweeping waves of fire clear entire rows. The dragon favors the relentless.", icon: "🐲",
    effects: ["Clear 6 lines → clear a row (start with 1)", "Reach 18 points → clear a row"] },
  // Zone 6 — Lamassu 🦁 / Persia
  11: { id: 11, name: "Lamassu's Gaze", description: "The gate guardian reveals hidden patterns. Score well to shatter the alike.", icon: "🦁",
    effects: ["Reach 15 points → destroy same-size blocks", "Clear 7 lines → destroy same-size blocks"] },
  // Zone 7 — Kitsune 🦊 / Japan
  13: { id: 13, name: "Foxfire", description: "Swift strikes from the spirit fox. Quick combos and clears earn surgical blows.", icon: "🦊",
    effects: ["Chain 3 combos → destroy a block", "Clear 5 lines → destroy a block"] },
  // Zone 8 — Balam 🐆 / Mayan
  15: { id: 15, name: "Balam's Ritual", description: "The three-eyed jaguar grants all powers. Start with 2 charges of every tool.", icon: "🐆",
    effects: ["Chain 6 combos → destroy a block (start with 2)", "Clear 12 lines → clear a row (start with 2)", "Reach 30 points → destroy same-size blocks (start with 2)"] },
  // Zone 9 — Mamba 🐍 / Tribal
  17: { id: 17, name: "Mamba's Rhythm", description: "The serpent's beat grows. Higher combos unlock increasingly deadly tools.", icon: "🐍",
    effects: ["4-combo → destroy a block", "5-combo → destroy same-size blocks", "6-combo → clear a row"] },
  // Zone 10 — Kuntur 🦅 / Inca
  19: { id: 19, name: "Kuntur's Trial", description: "One tool. One chance. Master the condor's demanding combo.", icon: "🦅",
    effects: ["Chain 5 combos → destroy a block"] },

  // ── Passive Mutators (even IDs 2-20) — change the rules of the zone ──

  // Zone 1 — Mako 🐢 / Tiki / Ocean
  2: { id: 2, name: "Calm Tides", description: "Gentle waters. Each line clear trickles a bonus and stars come more easily.", icon: "🌊",
    effects: ["+1 bonus per line clear", "−5% star thresholds (easier)", "4 starting rows"],
    effectsEndless: ["+1 bonus per line clear", "4 starting rows"] },
  // Zone 2 — Sobek 🐊 / Egypt
  4: { id: 4, name: "Foundation Stone", description: "Every scored move boosts your level score by +20%, and a perfect clear pays big.", icon: "☀️",
    effects: ["Level score ×1.2 after each scoring move", "+20 on perfect clears", "5 starting rows"],
    effectsEndless: ["Level score ×1.2 after each scoring move", "+20 on perfect clears", "5 starting rows"] },
  // Zone 3 — Fenris 🐺 / Norse
  6: { id: 6, name: "Frozen Rage", description: "Fury rewards fury. Combos detonate and line clears chain steady pressure.", icon: "❄️",
    effects: ["Level score ×1.1 after each scoring move", "×1.5 combo bonus on multi-line clears", "+3 per line clear", "4 starting rows"],
    effectsEndless: ["Level score ×1.1 after each scoring move", "×1.5 combo bonus on multi-line clears", "+3 per line clear", "4 starting rows"] },
  // Zone 4 — Noctua 🦉 / Greece
  8: { id: 8, name: "Marble Discipline", description: "Precision demanded. Stars harder to earn, but scoring and cleanups rewarded.", icon: "🏛️",
    effects: ["Level score ×1.3 after each scoring move", "+15 on perfect clears", "+10% star thresholds (harder)", "5 starting rows"],
    effectsEndless: ["Level score ×1.3 after each scoring move", "+15 on perfect clears", "5 starting rows"] },
  // Zone 5 — Long 🐲 / China
  10: { id: 10, name: "Imperial Scale", description: "Waves roll in from the dragon's domain. Ride the pressure for steady rewards.", icon: "🐉",
    effects: ["Level score ×1.15 after each scoring move", "+4 per line clear", "6 starting rows"],
    effectsEndless: ["Level score ×1.15 after each scoring move", "+4 per line clear", "6 starting rows"] },
  // Zone 6 — Lamassu 🦁 / Persia
  12: { id: 12, name: "Geometric Flow", description: "Patterns reward skilled combos. Stars tighter, but every multi-line clear explodes.", icon: "🕌",
    effects: ["Level score ×1.15 after each scoring move", "×1.75 combo bonus on multi-line clears", "+1 per line clear", "+10 on perfect clears", "+5% star thresholds (harder)", "5 starting rows"],
    effectsEndless: ["Level score ×1.15 after each scoring move", "×1.75 combo bonus on multi-line clears", "+1 per line clear", "+10 on perfect clears", "5 starting rows"] },
  // Zone 7 — Kitsune 🦊 / Japan
  14: { id: 14, name: "Bushido", description: "The warrior's code. A strong flat multiplier, but only the cleanest runs earn stars.", icon: "🗡️",
    effects: ["Level score ×1.4 after each scoring move", "+10 on perfect clears", "+15% star thresholds (quite hard)", "5 starting rows"],
    effectsEndless: ["Level score ×1.4 after each scoring move", "+10 on perfect clears", "5 starting rows"] },
  // Zone 8 — Balam 🐆 / Mayan
  16: { id: 16, name: "Jungle Altar", description: "The jaguar favors the skilled. Combos detonate ×2 — but stars demand perfection.", icon: "🌿",
    effects: ["Level score ×1.2 after each scoring move", "×2 combo bonus on multi-line clears", "+10% star thresholds (harder)", "6 starting rows"],
    effectsEndless: ["Level score ×1.2 after each scoring move", "×2 combo bonus on multi-line clears", "6 starting rows"] },
  // Zone 9 — Mamba 🐍 / Tribal
  18: { id: 18, name: "Primal Pulse", description: "The serpent's drum. Combos cascade at ×1.75 and lines keep the rhythm.", icon: "🔥",
    effects: ["Level score ×1.25 after each scoring move", "×1.75 combo bonus on multi-line clears", "+2 per line clear", "+10% star thresholds (harder)", "6 starting rows"],
    effectsEndless: ["Level score ×1.25 after each scoring move", "×1.75 combo bonus on multi-line clears", "+2 per line clear", "6 starting rows"] },
  // Zone 10 — Kuntur 🦅 / Inca
  20: { id: 20, name: "Altitude", description: "Thin air, crushing pressure. Massive scoring, ×2.5 combos and perfect-clear rewards — but stars are brutal.", icon: "⛰️",
    effects: ["Level score ×1.6 after each scoring move", "×2.5 combo bonus on multi-line clears", "+30 on perfect clears", "+20% star thresholds (hardest)", "7 starting rows"],
    effectsEndless: ["Level score ×1.6 after each scoring move", "×2.5 combo bonus on multi-line clears", "+30 on perfect clears", "7 starting rows"] },
};

const createFallbackMutator = (id: number): MutatorDef => ({
  id,
  name: `Mutator ${id}`,
  description: "Unknown mutator",
  icon: id % 2 === 0 ? "🛡️" : "✨",
  effects: [],
});

export const getMutatorDef = (id: number): MutatorDef =>
  id <= 0 ? MUTATOR_DEFS[0] : (MUTATOR_DEFS[id] ?? createFallbackMutator(id));

/**
 * Return the effect list tailored for the run's mode. In endless / tournament
 * runs (run_type === 1) star thresholds aren't scored, so we skip those lines.
 */
export const getMutatorEffects = (def: MutatorDef, isEndless: boolean): string[] =>
  isEndless ? (def.effectsEndless ?? def.effects) : def.effects;

export const BONUS_TYPES: Record<number, { name: string; icon: string; description: string }> = {
  0: { name: "None", icon: "", description: "" },
  1: { name: "Hammer", icon: "/assets/common/bonus/hammer.png", description: "Destroy a single block" },
  2: { name: "Totem", icon: "/assets/common/bonus/tiki.png", description: "Destroy all blocks of one size" },
  3: { name: "Wave", icon: "/assets/common/bonus/wave.png", description: "Clear an entire row" },
};

export const getBonusType = (id: number) => BONUS_TYPES[id] ?? BONUS_TYPES[0];

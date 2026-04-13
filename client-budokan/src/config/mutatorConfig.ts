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

  // ── Active Mutators (odd IDs 1-19) — at run start, one trigger from the
  // enabled pool is rolled. Completing it during play earns a charge of the
  // zone's bonus (Hammer / Totem / Wave). Listed effects describe the pool.

  // Zone 1 — Mako 🐢 / Tiki / Ocean
  1: { id: 1, name: "Mako's Gift", description: "The sea turtle offers a rolling Wave. Any path through the tide earns a charge.", icon: "🐢",
    effects: ["Clear 3+ lines in a move → Wave charge", "Every 10 lines cleared → Wave charge", "Every 30 points scored → Wave charge", "Start with 1 charge"] },
  // Zone 2 — Sobek 🐊 / Egypt
  3: { id: 3, name: "Sobek's Strike", description: "The Nile crocodile snaps precise and sudden. Combos or clears earn the Hammer.", icon: "🐊",
    effects: ["Clear 4+ lines in a move → Hammer charge", "Every 20 lines cleared → Hammer charge", "Start with 1 charge"] },
  // Zone 3 — Fenris 🐺 / Norse
  5: { id: 5, name: "Fenris Howl", description: "The frost wolf's cry shatters the alike. Combos or scoring unleash the Totem.", icon: "🐺",
    effects: ["Clear 4+ lines in a move → Totem charge", "Every 30 points scored → Totem charge", "Start with 1 charge"] },
  // Zone 4 — Noctua 🦉 / Greece
  7: { id: 7, name: "Noctua's Sight", description: "The owl sees the single flaw. Combos or scoring guide the Hammer home.", icon: "🦉",
    effects: ["Clear 4+ lines in a move → Hammer charge", "Every 30 points scored → Hammer charge", "Start with 1 charge"] },
  // Zone 5 — Long 🐲 / China
  9: { id: 9, name: "Long's Breath", description: "The dragon's sweeping flame clears a row. Ride the lines or the score to earn a Wave.", icon: "🐲",
    effects: ["Every 20 lines cleared → Wave charge", "Every 30 points scored → Wave charge", "Start with 1 charge"] },
  // Zone 6 — Lamassu 🦁 / Persia
  11: { id: 11, name: "Lamassu's Gaze", description: "The gate guardian shatters the alike. Lines or scores fuel the Totem.", icon: "🦁",
    effects: ["Every 20 lines cleared → Totem charge", "Every 30 points scored → Totem charge", "Start with 1 charge"] },
  // Zone 7 — Kitsune 🦊 / Japan
  13: { id: 13, name: "Kitsune's Spark", description: "The spirit fox darts and a single block vanishes. Combos or clears earn the Hammer.", icon: "🦊",
    effects: ["Clear 4+ lines in a move → Hammer charge", "Every 20 lines cleared → Hammer charge", "Start with 1 charge"] },
  // Zone 8 — Balam 🐆 / Mayan
  15: { id: 15, name: "Balam's Rite", description: "The three-eyed jaguar accepts any offering and answers in Waves. 2 charges to start.", icon: "🐆",
    effects: ["Clear 5+ lines in a move → Wave charge", "Every 30 lines cleared → Wave charge", "Every 50 points scored → Wave charge", "Start with 2 charges"] },
  // Zone 9 — Mamba 🐍 / Tribal
  17: { id: 17, name: "Mamba's Rhythm", description: "The serpent's drum shatters the alike. Combos or scores feed the Totem.", icon: "🐍",
    effects: ["Clear 4+ lines in a move → Totem charge", "Every 50 points scored → Totem charge", "Start with 1 charge"] },
  // Zone 10 — Kuntur 🦅 / Inca
  19: { id: 19, name: "Kuntur's Trial", description: "The condor accepts only mastery. Deep combos or long grinds earn the Hammer.", icon: "🦅",
    effects: ["Clear 5+ lines in a move → Hammer charge", "Every 30 lines cleared → Hammer charge", "Start with 1 charge"] },

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

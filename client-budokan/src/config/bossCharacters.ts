export interface ZoneGuardian {
  zoneId: number;
  name: string;
  title: string;
  personality: string;
  greeting: string;
  zoneHint: string;
  encouragement: string;
  trialIntro: string;
  respectLine: string;
  emoji: string;
}

export const ZONE_GUARDIANS: Record<number, ZoneGuardian> = {
  1: {
    zoneId: 1,
    name: "Mako",
    title: "Spirit of the Tides",
    personality: "Ancient sea turtle spirit, wise and patient",
    greeting: "The ocean has many lessons, young one. Let the tides guide your hands.",
    zoneHint: "A gentle start — earn bonus tools through combos, scoring, and line clears. The perfect zone to learn.",
    encouragement: "The current is with you. Trust the flow.",
    trialIntro: "The ocean's final wave approaches. Show me you've learned its rhythm.",
    respectLine: "The tides accept you. Swim with us now.",
    emoji: "🐢",
  },
  2: {
    zoneId: 2,
    name: "Khepri",
    title: "The Scarab Sun",
    personality: "Sacred scarab beetle spirit, eternal and precise",
    greeting: "The sands remember all who enter. Only the precise survive the sun's judgment.",
    zoneHint: "You start with a free row-clear power. Combos score 50% more, but the grid starts fuller.",
    encouragement: "Patience and precision. Empires were built one stone at a time.",
    trialIntro: "The sun reaches its zenith. Prove your discipline beneath its gaze.",
    respectLine: "The scarab rolls the sun for you. You have earned the light.",
    emoji: "🪲",
  },
  3: {
    zoneId: 3,
    name: "Fenris",
    title: "The Frost Wolf",
    personality: "Massive ice wolf spirit, fierce and relentless",
    greeting: "The frozen wastes spare no one. Only those with fire in their heart survive.",
    zoneHint: "Combos hit 50% harder and clearing lines spawns extra rows. Aggressive play is rewarded.",
    encouragement: "Strike hard. Strike fast. The frost does not wait.",
    trialIntro: "The blizzard howls. Face the storm or be buried beneath it.",
    respectLine: "The pack accepts your strength. Run with us through the ice.",
    emoji: "🐺",
  },
  4: {
    zoneId: 4,
    name: "Noctua",
    title: "The Marble Owl",
    personality: "Wise owl spirit carved from living marble",
    greeting: "Welcome to the arena of the mind. Here, strategy conquers all.",
    zoneHint: "Precision-focused — perfect clears are rewarded, but stars are harder to earn. Every move counts.",
    encouragement: "Think before you act. Every move is a theorem.",
    trialIntro: "Wisdom alone is not enough. Now prove you can act on it.",
    respectLine: "Knowledge and action, united. The owl sees your worth.",
    emoji: "🦉",
  },
  5: {
    zoneId: 5,
    name: "Tsuru",
    title: "The Paper Crane",
    personality: "Ethereal origami crane spirit, swift and precise",
    greeting: "The path of the blade demands absolute focus. Clear your mind.",
    zoneHint: "Fast surgical strikes — combos and line clears earn block-destroying powers quickly.",
    encouragement: "One fold. One purpose. Make it count.",
    trialIntro: "A thousand cranes have fallen. Only the sharpest fold remains.",
    respectLine: "Your precision is art. The crane unfolds for you.",
    emoji: "🕊️",
  },
  6: {
    zoneId: 6,
    name: "Long",
    title: "The Jade Dragon",
    personality: "Ancient jade dragon spirit, patient and overwhelming",
    greeting: "The dragon waits. Those who endure its gaze earn its power.",
    zoneHint: "Extra lines flood the grid when you clear. Overwhelming, but powerful if you can keep control.",
    encouragement: "Flow like the river. It carves mountains given time.",
    trialIntro: "The dragon stirs. Withstand its breath or be consumed.",
    respectLine: "The dragon bows. Your endurance is worthy of the heavens.",
    emoji: "🐲",
  },
  7: {
    zoneId: 7,
    name: "Simurgh",
    title: "The Mosaic Phoenix",
    personality: "Geometric phoenix spirit made of living tilework",
    greeting: "Every tile has its place in the mosaic. Can you see the pattern?",
    zoneHint: "Balanced challenge — slightly better combos and extra lines, but tighter star goals.",
    encouragement: "Look deeper. The pattern reveals itself to the patient eye.",
    trialIntro: "The mosaic shatters and reforms. Reassemble it — or be lost in the pieces.",
    respectLine: "You see what others cannot. The mosaic is whole again.",
    emoji: "🦚",
  },
  8: {
    zoneId: 8,
    name: "Balam",
    title: "The Jungle Jaguar",
    personality: "Shadow jaguar spirit, primal and three-headed",
    greeting: "The jungle speaks to those who listen. Three gifts await the worthy.",
    zoneHint: "The most powerful zone — start with 2 charges of every tool. Combos score 1.75x.",
    encouragement: "The ritual demands everything. Give it all.",
    trialIntro: "Three eyes open. Three powers converge. Survive the jaguar's gaze.",
    respectLine: "The jungle accepts you as one of its own. Walk unseen.",
    emoji: "🐆",
  },
  9: {
    zoneId: 9,
    name: "Djembe",
    title: "The Thunder Drum",
    personality: "Living ceremonial drum spirit, rhythmic and escalating",
    greeting: "Listen. The drums beat for those brave enough to follow their rhythm.",
    zoneHint: "Combo-driven — higher combos unlock stronger tools. Build chains to unleash devastation.",
    encouragement: "Feel the beat. Let it guide your hands.",
    trialIntro: "The drums grow deafening! Match the rhythm or be silenced.",
    respectLine: "Your rhythm is true. The drums echo your name.",
    emoji: "🪘",
  },
  10: {
    zoneId: 10,
    name: "Kuntur",
    title: "The Sun Condor",
    personality: "Golden condor spirit, austere and all-seeing",
    greeting: "The mountain path is narrow and the air is thin. Only the focused reach the summit.",
    zoneHint: "The ultimate test — 2x combo score and huge perfect clear bonuses, but only one tool and the hardest star goals.",
    encouragement: "Less is more. One wing beat, one purpose.",
    trialIntro: "The summit awaits. With nothing but your will, prove you belong among the stars.",
    respectLine: "You stand at the peak. The sun condor carries your name to the heavens.",
    emoji: "🦅",
  },
};

export function getZoneGuardian(zoneId: number): ZoneGuardian {
  return ZONE_GUARDIANS[zoneId] ?? ZONE_GUARDIANS[1];
}

/**
 * Returns the path to the guardian's portrait image.
 * Falls back to emoji if the asset doesn't exist yet.
 */
export function getGuardianPortrait(zoneId: number): string {
  return `/assets/theme-${zoneId}/boss/portrait.png`;
}

export function getGuardianPortraitSmall(zoneId: number): string {
  return `/assets/theme-${zoneId}/boss/portrait-small.png`;
}

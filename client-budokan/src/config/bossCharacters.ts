export interface ZoneGuardian {
  zoneId: number;
  name: string;
  title: string;
  personality: string;
  greeting: string;
  encouragement: string;
  trialIntro: string;
  respectLine: string;
  emoji: string;
}

export const ZONE_GUARDIANS: Record<number, ZoneGuardian> = {
  1: {
    zoneId: 1,
    name: "Maui",
    title: "Tidecaller",
    personality: "Bold, playful, earns respect through ocean trials",
    greeting: "Welcome, challenger! The ocean has many lessons to teach. Show me you can ride the tides.",
    encouragement: "The current is with you. Trust the flow.",
    trialIntro: "You've come far, but the ocean's final test awaits. Prove yourself to me!",
    respectLine: "Ha! You've earned the ocean's blessing. Well done, warrior.",
    emoji: "🌊",
  },
  2: {
    zoneId: 2,
    name: "Nefertari",
    title: "Sun Sovereign",
    personality: "Regal, demanding, rewards precision",
    greeting: "The sands remember all who enter. Only the precise survive the sun's judgment.",
    encouragement: "Patience and precision. The pharaohs built empires one stone at a time.",
    trialIntro: "You stand before the throne. Show me the discipline of a true architect.",
    respectLine: "The sun shines upon you. You have earned a place among the builders.",
    emoji: "☀️",
  },
  3: {
    zoneId: 3,
    name: "Sigrun",
    title: "Frostbane",
    personality: "Fierce, honorable, respects brute force",
    greeting: "The frozen wastes spare no one. Only those with fire in their heart survive.",
    encouragement: "Strike hard. Strike fast. The frost does not wait.",
    trialIntro: "You've proven your strength. Now face the final storm — face me.",
    respectLine: "You fight with honor. The Valkyries sing your name.",
    emoji: "❄️",
  },
  4: {
    zoneId: 4,
    name: "Athenos",
    title: "Marble Sage",
    personality: "Calculating, strategic, values intellect",
    greeting: "Welcome to the arena of the mind. Here, strategy conquers all.",
    encouragement: "Think before you act. Every move is a thesis.",
    trialIntro: "You have studied well. But can your mind withstand the final theorem?",
    respectLine: "Brilliant. Your mind is as sharp as any blade in Athens.",
    emoji: "🏛️",
  },
  5: {
    zoneId: 5,
    name: "Hanzo",
    title: "Shadow Blade",
    personality: "Disciplined, swift, demands perfection",
    greeting: "The path of the blade demands absolute focus. Clear your mind.",
    encouragement: "One cut. One chance. Make it count.",
    trialIntro: "Your blade is steady, but mine is sharper. Prove your discipline.",
    respectLine: "Your spirit is forged in steel. The dojo accepts you.",
    emoji: "⛩️",
  },
  6: {
    zoneId: 6,
    name: "Mei Lin",
    title: "Dragon Empress",
    personality: "Majestic, patient, tests endurance",
    greeting: "The dragon waits. Those who endure its gaze earn its power.",
    encouragement: "Flow like the river. It carves mountains given time.",
    trialIntro: "The dragon has watched you patiently. Now it demands your full strength.",
    respectLine: "The dragon bows to you. Your endurance is worthy of the empire.",
    emoji: "🐉",
  },
  7: {
    zoneId: 7,
    name: "Cyra",
    title: "Mosaic Eye",
    personality: "Mysterious, geometric, pattern-focused",
    greeting: "Every tile has its place in the mosaic. Can you see the pattern?",
    encouragement: "Look deeper. The pattern reveals itself to the patient eye.",
    trialIntro: "You've seen the pieces. Now assemble the final mosaic before me.",
    respectLine: "You see what others cannot. The mosaic is complete.",
    emoji: "🔮",
  },
  8: {
    zoneId: 8,
    name: "Ixchel",
    title: "Blood Oracle",
    personality: "Primal, ritualistic, triple-powered",
    greeting: "The jungle speaks to those who listen. Three gifts await the worthy.",
    encouragement: "The ritual demands sacrifice. Give everything.",
    trialIntro: "The oracle has foreseen this moment. All three powers converge — survive.",
    respectLine: "The jungle accepts you as one of its own. The ritual is complete.",
    emoji: "💀",
  },
  9: {
    zoneId: 9,
    name: "Ngoma",
    title: "War Drummer",
    personality: "Rhythmic, escalating, combo-driven",
    greeting: "Listen to the drums. They beat for those brave enough to follow their rhythm.",
    encouragement: "Feel the beat. Let it guide your hands.",
    trialIntro: "The drums grow louder! Match my rhythm or be silenced.",
    respectLine: "Your rhythm is true. The tribe welcomes you, warrior.",
    emoji: "🥁",
  },
  10: {
    zoneId: 10,
    name: "Inti'ka",
    title: "Sun Heir",
    personality: "Austere, demanding, minimal tools",
    greeting: "The mountain path is narrow and the air is thin. Only the focused reach the summit.",
    encouragement: "Less is more. One tool, one purpose.",
    trialIntro: "The summit awaits. With nothing but your will, prove you belong among the stars.",
    respectLine: "You stand at the peak. The sun acknowledges your ascent.",
    emoji: "🌞",
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

export interface ZoneGuardian {
  zoneId: number;
  name: string;
  title: string;
  personality: string;
  greeting: string;
  dailyGreeting: string;
  zoneHint: string;
  encouragement: string;
  trialIntro: string;
  respectLine: string;
  oneStar: string;
  twoStar: string;
  threeStar: string;
  incomplete: string;
  emoji: string;
}

export const ZONE_GUARDIANS: Record<number, ZoneGuardian> = {
  1: {
    zoneId: 1,
    name: "Mako",
    title: "Spirit of the Tides",
    personality: "Ancient sea turtle spirit, wise and patient",
    greeting: "The ocean has many lessons, young one. Let the tides guide your hands.",
    dailyGreeting: "Today the tides shift for all challengers equally. Ride them better than anyone.",
    zoneHint: "A gentle start. Earn bonus tools through combos, scoring, and line clears. The perfect zone to learn.",
    encouragement: "The current is with you. Trust the flow.",
    trialIntro: "The ocean's final wave approaches. Show me you've learned its rhythm.",
    respectLine: "The tides accept you. Swim with us now.",
    oneStar: "You survived the wave, but the ocean has more to teach.",
    twoStar: "Good form. The current carried you well.",
    threeStar: "The ocean itself bows. Perfect rhythm.",
    incomplete: "The tide recedes... but it always returns. Try again.",
    emoji: "🐢",
  },
  2: {
    zoneId: 2,
    name: "Sobek",
    title: "The Nile Guardian",
    personality: "Ancient crocodile spirit, patient and devastating",
    greeting: "The sands remember all who enter. Only the precise survive the Nile's judgment.",
    dailyGreeting: "The Nile tests all equally today. Precision will separate the worthy from the rest.",
    zoneHint: "You start with a free row-clear power. Combos score 50% more, but the grid starts fuller.",
    encouragement: "Patience and precision. The Nile rewards those who wait.",
    trialIntro: "The waters rise. Face the jaws of the Nile or be swept away.",
    respectLine: "The Nile parts for you. You have earned safe passage.",
    oneStar: "You crossed the river, but barely. The Nile demands more.",
    twoStar: "A worthy passage. The sands note your precision.",
    threeStar: "Flawless. The pharaohs would envy your discipline.",
    incomplete: "The sands swallow those who hesitate. Return stronger.",
    emoji: "🐊",
  },
  3: {
    zoneId: 3,
    name: "Fenris",
    title: "The Frost Wolf",
    personality: "Massive ice wolf spirit, fierce and relentless",
    greeting: "The frozen wastes spare no one. Only those with fire in their heart survive.",
    dailyGreeting: "The storm rages equally for all today. Strike harder than your rivals.",
    zoneHint: "Combos hit 50% harder and clearing lines spawns extra rows. Aggressive play is rewarded.",
    encouragement: "Strike hard. Strike fast. The frost does not wait.",
    trialIntro: "The blizzard howls. Face the storm or be buried beneath it.",
    respectLine: "The pack accepts your strength. Run with us through the ice.",
    oneStar: "You endured, but the frost nearly claimed you.",
    twoStar: "Strong. The ice bends to your will.",
    threeStar: "Even the blizzard could not touch you. Legendary.",
    incomplete: "The cold takes the weak. Return with fire in your heart.",
    emoji: "🐺",
  },
  4: {
    zoneId: 4,
    name: "Noctua",
    title: "The Marble Owl",
    personality: "Wise owl spirit carved from living marble",
    greeting: "Welcome to the arena of the mind. Here, strategy conquers all.",
    dailyGreeting: "The same puzzle for all minds today. Prove yours is the sharpest.",
    zoneHint: "Precision-focused. Perfect clears are rewarded, but stars are harder to earn. Every move counts.",
    encouragement: "Think before you act. Every move is a theorem.",
    trialIntro: "Wisdom alone is not enough. Now prove you can act on it.",
    respectLine: "Knowledge and action, united. The owl sees your worth.",
    oneStar: "A passing grade, but far from elegant.",
    twoStar: "Well reasoned. Your logic holds.",
    threeStar: "A theorem proven without flaw. Brilliant.",
    incomplete: "The equation remains unsolved. Reconsider your approach.",
    emoji: "🦉",
  },
  5: {
    zoneId: 5,
    name: "Long",
    title: "The Jade Dragon",
    personality: "Ancient jade dragon spirit, patient and overwhelming",
    greeting: "The dragon waits. Those who endure its gaze earn its power.",
    dailyGreeting: "The dragon's gaze falls on all challengers today. Outlast them all.",
    zoneHint: "Extra lines flood the grid when you clear. Overwhelming, but powerful if you can keep control.",
    encouragement: "Flow like the river. It carves mountains given time.",
    trialIntro: "The dragon stirs. Withstand its breath or be consumed.",
    respectLine: "The dragon bows. Your endurance is worthy of the heavens.",
    oneStar: "You survived the flood, but only just.",
    twoStar: "The river bends to your patience. Well done.",
    threeStar: "Even the dragon's torrent could not shake you. Imperial.",
    incomplete: "The current swept you away. Plant your feet deeper next time.",
    emoji: "🐲",
  },
  6: {
    zoneId: 6,
    name: "Lamassu",
    title: "The Gate Guardian",
    personality: "Winged lion spirit, ancient and all-knowing",
    greeting: "Every tile has its place in the mosaic. Can you see the pattern?",
    dailyGreeting: "The same mosaic for all eyes today. See the pattern faster than anyone.",
    zoneHint: "Balanced challenge. Slightly better combos and extra lines, but tighter star goals.",
    encouragement: "Look deeper. The pattern reveals itself to the patient eye.",
    trialIntro: "The gate opens for those who see the pattern. Prove your sight.",
    respectLine: "The gate stands open. You see what others cannot.",
    oneStar: "You found the pattern, but missed its beauty.",
    twoStar: "The mosaic takes shape under your hands.",
    threeStar: "Every tile in its place. The pattern is complete.",
    incomplete: "The tiles scatter. Gather them and try again.",
    emoji: "🦁",
  },
  7: {
    zoneId: 7,
    name: "Kitsune",
    title: "The Spirit Fox",
    personality: "Mystical nine-tailed fox spirit, swift and cunning",
    greeting: "Catch me if you can. But beware, little puzzler, foxfire burns the careless.",
    dailyGreeting: "The same trick for all challengers today. Let's see who falls for it last.",
    zoneHint: "Fast and tricky. Combos and line clears earn block-destroying powers quickly.",
    encouragement: "Quick paws, quick mind. Don't overthink it.",
    trialIntro: "Nine tails, nine illusions. See through them all or be lost forever.",
    respectLine: "You saw through every trick. The fox respects a sharp eye.",
    oneStar: "You escaped my illusions, but just barely.",
    twoStar: "Not bad. You kept your wits when the foxfire flickered.",
    threeStar: "Every illusion shattered. You're sharper than my claws.",
    incomplete: "Lost in the illusion. Find your way back and try again.",
    emoji: "🦊",
  },
  8: {
    zoneId: 8,
    name: "Balam",
    title: "The Jungle Jaguar",
    personality: "Shadow jaguar spirit, primal and three-headed",
    greeting: "The jungle speaks to those who listen. Three gifts await the worthy.",
    dailyGreeting: "The jungle offers its three gifts to all today. Use them wisely, others won't hesitate.",
    zoneHint: "The most powerful zone. Start with 2 charges of every tool. Combos score 1.75x.",
    encouragement: "The ritual demands everything. Give it all.",
    trialIntro: "Three eyes open. Three powers converge. Survive the jaguar's gaze.",
    respectLine: "The jungle accepts you as one of its own. Walk unseen.",
    oneStar: "The ritual was... adequate. The jungle expects more.",
    twoStar: "The spirits stir. Your offering pleases them.",
    threeStar: "A perfect ritual. The jungle sings your name.",
    incomplete: "The ritual failed. The spirits turn away. Begin anew.",
    emoji: "🐆",
  },
  9: {
    zoneId: 9,
    name: "Mamba",
    title: "The Shadow Mamba",
    personality: "Colossal black mamba spirit, rhythmic and relentless",
    greeting: "Listen. The rhythm pulses through the earth. Follow it or fall.",
    dailyGreeting: "The same beat for all today. Match the rhythm longer than anyone else.",
    zoneHint: "Combo-driven. Higher combos unlock stronger tools. Build chains to unleash devastation.",
    encouragement: "Feel the pulse. Let it guide your strikes.",
    trialIntro: "The mamba strikes without warning. Match its speed or be consumed.",
    respectLine: "You move like shadow. The mamba acknowledges its equal.",
    oneStar: "You kept the beat, but stumbled on the drops.",
    twoStar: "Your rhythm is strong. The drums resonate.",
    threeStar: "Thunder itself dances to your beat. Flawless.",
    incomplete: "You lost the rhythm. Listen again, and return.",
    emoji: "🐍",
  },
  10: {
    zoneId: 10,
    name: "Kuntur",
    title: "The Sun Condor",
    personality: "Golden condor spirit, austere and all-seeing",
    greeting: "The mountain path is narrow and the air is thin. Only the focused reach the summit.",
    dailyGreeting: "One path. One summit. All climbers face the same mountain today. Reach highest.",
    zoneHint: "The ultimate test. 2x combo score and huge perfect clear bonuses, but only one tool and the hardest star goals.",
    encouragement: "Less is more. One wing beat, one purpose.",
    trialIntro: "The summit awaits. With nothing but your will, prove you belong among the stars.",
    respectLine: "You stand at the peak. The sun condor carries your name to the heavens.",
    oneStar: "You reached the ledge, but the summit is far above.",
    twoStar: "The altitude tests you, and you endure.",
    threeStar: "The peak is yours. The sun shines on no one brighter.",
    incomplete: "The mountain rejects the unprepared. Train and return.",
    emoji: "🦅",
  },
};

export function getGuardianStarText(guardian: ZoneGuardian, stars: number): string {
  if (stars >= 3) return guardian.threeStar;
  if (stars >= 2) return guardian.twoStar;
  if (stars >= 1) return guardian.oneStar;
  return guardian.incomplete;
}

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


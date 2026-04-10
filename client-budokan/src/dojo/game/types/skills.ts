export interface SkillDef {
  id: number;
  name: string;
  description: string;
  category: "bonus" | "world";
}

export const SKILLS: Record<number, SkillDef> = {
  1: { id: 1, name: "combo", description: "Combo boost", category: "bonus" },
  2: { id: 2, name: "score", description: "Score boost", category: "bonus" },
  3: { id: 3, name: "harvest", description: "Harvest blocks", category: "bonus" },
  4: { id: 4, name: "wave", description: "Wave clear", category: "bonus" },
  5: { id: 5, name: "supply", description: "Supply lines", category: "bonus" },
};

export const getSkillById = (id: number): SkillDef | undefined => SKILLS[id];

export const getSkillName = (id: number): string => getSkillById(id)?.name ?? "Unknown";

export const getSkillTier = (level: number): number => Math.max(1, Math.min(3, level + 1));

export const getArchetypeForSkill = (_id: number): { name: string; color: string } | null => null;

import { motion } from "motion/react";
import {
  ARCHETYPES,
  getSkillsByArchetype,
  type ArchetypeId,
} from "@/dojo/game/types/skillData";
import { getCommonAssetPath } from "@/config/themes";
import type { SkillTreeInfo } from "@/hooks/useSkillTree";
import SkillNode from "./SkillNode";

interface ArchetypeColumnProps {
  archetypeId: ArchetypeId;
  /** All 15 skill infos (index 0 = skill ID 1) */
  skills: SkillTreeInfo[];
  selectedSkillId: number | null;
  busySkillId: number | null;
  onSkillClick: (skillId: number) => void;
  /** Stagger animation index (0-4) */
  index: number;
}

/** Vertical gap between node centers in px (used for SVG line positioning) */
const NODE_GAP = 88;

const ArchetypeColumn: React.FC<ArchetypeColumnProps> = ({
  archetypeId,
  skills,
  selectedSkillId,
  busySkillId,
  onSkillClick,
  index,
}) => {
  const archetype = ARCHETYPES[archetypeId];
  const archetypeSkills = getSkillsByArchetype(archetypeId);
  const iconSrc = getCommonAssetPath(
    `archetypes/archetype-${archetypeId}.png`,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center w-[140px] md:w-[160px] flex-shrink-0"
    >
      {/* Archetype header */}
      <div className="flex flex-col items-center gap-1 mb-4">
        <div
          className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden border-2"
          style={{ borderColor: archetype.color + "66" }}
        >
          <img
            src={iconSrc}
            alt={archetype.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
        <h3
          className="font-['Fredericka_the_Great'] text-sm md:text-base leading-tight"
          style={{ color: archetype.color }}
        >
          {archetype.name}
        </h3>
        <p className="text-[9px] md:text-[10px] text-slate-400 text-center leading-tight max-w-[130px]">
          {archetype.description}
        </p>
      </div>

      {/* Skill nodes with connecting lines */}
      <div className="relative flex flex-col items-center">
        {archetypeSkills.map((skill, idx) => {
          const treeInfo = skills[skill.id - 1] ?? {
            level: 0,
            branchChosen: false,
            branchId: 0,
          };
          const nextSkill = archetypeSkills[idx + 1];
          const nextTreeInfo = nextSkill
            ? skills[nextSkill.id - 1] ?? {
                level: 0,
                branchChosen: false,
                branchId: 0,
              }
            : null;

          return (
            <div
              key={skill.id}
              className="relative flex flex-col items-center"
              style={{ marginTop: idx === 0 ? 0 : `${NODE_GAP - 70}px` }}
            >
              {/* SVG connection line to NEXT node */}
              {nextSkill && nextTreeInfo && (
                <svg
                  className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                  style={{
                    top: "64px", // below current node (md: 80px, but we use 64 for the line start)
                    width: "2px",
                    height: `${NODE_GAP - 30}px`,
                  }}
                  viewBox={`0 0 2 ${NODE_GAP - 30}`}
                  preserveAspectRatio="none"
                >
                  <line
                    x1="1"
                    y1="0"
                    x2="1"
                    y2={NODE_GAP - 30}
                    stroke={archetype.color}
                    strokeWidth="2"
                    strokeOpacity={nextTreeInfo.level > 0 ? 0.8 : 0.2}
                    strokeDasharray={
                      nextTreeInfo.level > 0 ? "none" : "4 4"
                    }
                  />
                </svg>
              )}

              <SkillNode
                skillId={skill.id}
                treeInfo={treeInfo}
                isSelected={selectedSkillId === skill.id}
                isBusy={busySkillId === skill.id}
                isRoot={idx === 0}
                onClick={onSkillClick}
              />
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ArchetypeColumn;

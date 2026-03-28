import { useCallback, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  ChevronDown,
  ChevronUp,
  Layers,
  Plus,
  Settings2,
} from "lucide-react";
import { Has, runQuery, getComponentValue } from "@dojoengine/recs";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useNavigationStore } from "@/stores/navigationStore";
import { DEFAULT_SETTINGS } from "@/dojo/game/types/level";
import PageTopBar from "@/ui/navigation/PageTopBar";
import GameButton from "@/ui/components/shared/GameButton";

// ─── Packing Helpers ─────────────────────────────────────────────────────────

function packConstraintLinesBudgets(
  veryeasyMinLines: number,
  masterMinLines: number,
  veryeasyMaxLines: number,
  masterMaxLines: number,
  veryeasyBudgetMin: number,
  veryeasyBudgetMax: number,
  masterBudgetMin: number,
  masterBudgetMax: number,
  veryeasyMinTimes: number,
  masterMinTimes: number,
): string {
  let packed = BigInt(0);
  packed |= BigInt(veryeasyMinLines & 0xf);
  packed |= BigInt(masterMinLines & 0xf) << BigInt(4);
  packed |= BigInt(veryeasyMaxLines & 0xf) << BigInt(8);
  packed |= BigInt(masterMaxLines & 0xf) << BigInt(12);
  packed |= BigInt(veryeasyBudgetMin & 0xff) << BigInt(16);
  packed |= BigInt(veryeasyBudgetMax & 0xff) << BigInt(24);
  packed |= BigInt(masterBudgetMin & 0xff) << BigInt(32);
  packed |= BigInt(masterBudgetMax & 0xff) << BigInt(40);
  packed |= BigInt(veryeasyMinTimes & 0xf) << BigInt(48);
  packed |= BigInt(masterMinTimes & 0xf) << BigInt(52);
  return "0x" + packed.toString(16);
}

function packConstraintChances(
  veryeasyDualChance: number,
  masterDualChance: number,
  veryeasySecondaryNoBonusChance: number,
  masterSecondaryNoBonusChance: number,
): number {
  let packed = 0;
  packed |= veryeasyDualChance & 0xff;
  packed |= (masterDualChance & 0xff) << 8;
  packed |= (veryeasySecondaryNoBonusChance & 0xff) << 16;
  packed |= (masterSecondaryNoBonusChance & 0xff) << 24;
  return packed;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DIFFICULTY_NAMES = [
  "VeryEasy",
  "Easy",
  "Medium",
  "MediumHard",
  "Hard",
  "VeryHard",
  "Expert",
  "Master",
];

interface FormSection {
  id: string;
  title: string;
}

const SECTIONS: FormSection[] = [
  { id: "basic", title: "Basic Info" },
  { id: "scaling", title: "Level Scaling" },
  { id: "cubes", title: "Cube Thresholds" },
  { id: "tiers", title: "Difficulty Tiers" },
  { id: "constraints", title: "Constraints" },
  { id: "blocks", title: "Block Weights" },
  { id: "variance", title: "Variance" },
  { id: "run", title: "Run Settings" },
];

// ─── Form Field ──────────────────────────────────────────────────────────────

const FormField: React.FC<{
  label: string;
  value: number | string;
  onChange: (val: string) => void;
  type?: "text" | "number";
  min?: number;
  max?: number;
}> = ({ label, value, onChange, type = "number", min, max }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs text-slate-400">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min={min}
      max={max}
      className="w-full bg-black/30 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
    />
  </div>
);

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const SettingsPresetsPage: React.FC = () => {
  const goBack = useNavigationStore((s) => s.goBack);
  const { account } = useAccountCustom();
  const {
    setup: {
      systemCalls,
      contractComponents: { GameSettingsMetadata },
    },
  } = useDojo();

  const [submitting, setSubmitting] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(["basic"]),
  );
  const [showForm, setShowForm] = useState(false);

  // Form state initialized with defaults
  const [form, setForm] = useState({
    name: "",
    description: "",
    difficulty: 1,
    base_moves: DEFAULT_SETTINGS.baseMoves,
    max_moves: DEFAULT_SETTINGS.maxMoves,
    base_ratio_x100: DEFAULT_SETTINGS.baseRatioX100,
    max_ratio_x100: DEFAULT_SETTINGS.maxRatioX100,
    cube_3_percent: DEFAULT_SETTINGS.cube3Percent,
    cube_2_percent: DEFAULT_SETTINGS.cube2Percent,
    tier_1: DEFAULT_SETTINGS.tier1Threshold,
    tier_2: DEFAULT_SETTINGS.tier2Threshold,
    tier_3: DEFAULT_SETTINGS.tier3Threshold,
    tier_4: DEFAULT_SETTINGS.tier4Threshold,
    tier_5: DEFAULT_SETTINGS.tier5Threshold,
    tier_6: DEFAULT_SETTINGS.tier6Threshold,
    tier_7: DEFAULT_SETTINGS.tier7Threshold,
    constraints_enabled: 1,
    constraint_start_level: DEFAULT_SETTINGS.constraintStartLevel,
    ve_min_lines: DEFAULT_SETTINGS.veryeasyMinLines,
    m_min_lines: DEFAULT_SETTINGS.masterMinLines,
    ve_max_lines: DEFAULT_SETTINGS.veryeasyMaxLines,
    m_max_lines: DEFAULT_SETTINGS.masterMaxLines,
    ve_budget_min: DEFAULT_SETTINGS.veryeasyBudgetMin,
    ve_budget_max: DEFAULT_SETTINGS.veryeasyBudgetMax,
    m_budget_min: DEFAULT_SETTINGS.masterBudgetMin,
    m_budget_max: DEFAULT_SETTINGS.masterBudgetMax,
    ve_min_times: DEFAULT_SETTINGS.veryeasyMinTimes,
    m_min_times: DEFAULT_SETTINGS.masterMinTimes,
    ve_dual_chance: DEFAULT_SETTINGS.veryeasyDualChance,
    m_dual_chance: DEFAULT_SETTINGS.masterDualChance,
    ve_no_bonus_chance: DEFAULT_SETTINGS.veryeasySecondaryNoBonusChance,
    m_no_bonus_chance: DEFAULT_SETTINGS.masterSecondaryNoBonusChance,
    ve_size1: DEFAULT_SETTINGS.veryeasySize1Weight,
    ve_size2: DEFAULT_SETTINGS.veryeasySize2Weight,
    ve_size3: DEFAULT_SETTINGS.veryeasySize3Weight,
    ve_size4: DEFAULT_SETTINGS.veryeasySize4Weight,
    ve_size5: DEFAULT_SETTINGS.veryeasySize5Weight,
    m_size1: DEFAULT_SETTINGS.masterSize1Weight,
    m_size2: DEFAULT_SETTINGS.masterSize2Weight,
    m_size3: DEFAULT_SETTINGS.masterSize3Weight,
    m_size4: DEFAULT_SETTINGS.masterSize4Weight,
    m_size5: DEFAULT_SETTINGS.masterSize5Weight,
    early_variance: DEFAULT_SETTINGS.earlyVariancePercent,
    mid_variance: DEFAULT_SETTINGS.midVariancePercent,
    late_variance: DEFAULT_SETTINGS.lateVariancePercent,
    early_level_threshold: DEFAULT_SETTINGS.earlyLevelThreshold,
    mid_level_threshold: DEFAULT_SETTINGS.midLevelThreshold,
    level_cap: DEFAULT_SETTINGS.levelCap,
    boss_upgrades_enabled: 1,
    reroll_base_cost: DEFAULT_SETTINGS.rerollBaseCost,
    starting_charges: DEFAULT_SETTINGS.startingCharges,
  });

  const setField = useCallback((key: string, val: string) => {
    setForm((prev) => ({
      ...prev,
      [key]:
        key === "name" || key === "description" ? val : Number(val) || 0,
    }));
  }, []);

  const toggleSection = useCallback((id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Query existing presets
  const existingPresets = useMemo(() => {
    try {
      const metaEntities = Array.from(
        runQuery([Has(GameSettingsMetadata)]),
      );
      const presets: Array<{ id: number; name: string; description: string }> =
        [];
      for (const entity of metaEntities) {
        const meta = getComponentValue(GameSettingsMetadata, entity);
        if (meta) {
          presets.push({
            id: meta.settings_id,
            name: meta.name || `Preset #${meta.settings_id}`,
            description: meta.description || "",
          });
        }
      }
      return presets.sort((a, b) => a.id - b.id);
    } catch {
      return [];
    }
  }, [GameSettingsMetadata]);

  const handleSubmit = useCallback(async () => {
    if (!account || submitting || !form.name.trim()) return;
    setSubmitting(true);
    try {
      const constraintLinesBudgets = packConstraintLinesBudgets(
        form.ve_min_lines,
        form.m_min_lines,
        form.ve_max_lines,
        form.m_max_lines,
        form.ve_budget_min,
        form.ve_budget_max,
        form.m_budget_min,
        form.m_budget_max,
        form.ve_min_times,
        form.m_min_times,
      );
      const constraintChances = packConstraintChances(
        form.ve_dual_chance,
        form.m_dual_chance,
        form.ve_no_bonus_chance,
        form.m_no_bonus_chance,
      );

      await systemCalls.addCustomGameSettings({
        account,
        name: form.name,
        description: form.description,
        difficulty: form.difficulty,
        base_moves: form.base_moves,
        max_moves: form.max_moves,
        base_ratio_x100: form.base_ratio_x100,
        max_ratio_x100: form.max_ratio_x100,
        cube_3_percent: form.cube_3_percent,
        cube_2_percent: form.cube_2_percent,
        tier_1_threshold: form.tier_1,
        tier_2_threshold: form.tier_2,
        tier_3_threshold: form.tier_3,
        tier_4_threshold: form.tier_4,
        tier_5_threshold: form.tier_5,
        tier_6_threshold: form.tier_6,
        tier_7_threshold: form.tier_7,
        constraints_enabled: form.constraints_enabled,
        constraint_start_level: form.constraint_start_level,
        constraint_lines_budgets: constraintLinesBudgets,
        constraint_chances: constraintChances,
        veryeasy_size1_weight: form.ve_size1,
        veryeasy_size2_weight: form.ve_size2,
        veryeasy_size3_weight: form.ve_size3,
        veryeasy_size4_weight: form.ve_size4,
        veryeasy_size5_weight: form.ve_size5,
        master_size1_weight: form.m_size1,
        master_size2_weight: form.m_size2,
        master_size3_weight: form.m_size3,
        master_size4_weight: form.m_size4,
        master_size5_weight: form.m_size5,
        early_variance_percent: form.early_variance,
        mid_variance_percent: form.mid_variance,
        late_variance_percent: form.late_variance,
        early_level_threshold: form.early_level_threshold,
        mid_level_threshold: form.mid_level_threshold,
        level_cap: form.level_cap,
        boss_upgrades_enabled: form.boss_upgrades_enabled,
        reroll_base_cost: form.reroll_base_cost,
        starting_charges: form.starting_charges,
      });
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  }, [account, form, submitting, systemCalls]);

  const renderSection = (section: FormSection, content: React.ReactNode) => {
    const isOpen = openSections.has(section.id);
    return (
      <div
        key={section.id}
        className="border border-slate-700/50 rounded-lg overflow-hidden"
      >
        <button
          type="button"
          onClick={() => toggleSection(section.id)}
          className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-800/50 hover:bg-slate-800/80 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings2 size={14} className="text-cyan-400" />
            <span className="font-['Fredericka_the_Great'] text-sm text-white">
              {section.title}
            </span>
          </div>
          {isOpen ? (
            <ChevronUp size={16} className="text-slate-400" />
          ) : (
            <ChevronDown size={16} className="text-slate-400" />
          )}
        </button>
        {isOpen && (
          <div className="p-3 grid grid-cols-2 gap-3">{content}</div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen-viewport flex flex-col overflow-hidden">
      <PageTopBar title="GAME PRESETS" onBack={goBack} />

      <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 py-4">
        <div className="max-w-[760px] mx-auto flex flex-col gap-4 pb-20">
          {/* Existing Presets */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="bg-slate-900/90 rounded-xl p-4 border border-white/10"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-cyan-300" />
                <h2 className="font-['Fredericka_the_Great'] text-lg text-white">
                  Existing Presets
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                {existingPresets.length} preset
                {existingPresets.length !== 1 ? "s" : ""}
              </span>
            </div>

            {existingPresets.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                No presets created yet.
              </p>
            ) : (
              <div className="space-y-2">
                {existingPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between rounded-lg bg-black/30 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm text-white">{preset.name}</p>
                      {preset.description && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[300px]">
                          {preset.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      ID: {preset.id}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.section>

          {/* Toggle Create Form */}
          {!showForm && (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="show"
            >
              <GameButton
                label="CREATE NEW PRESET"
                variant="primary"
                onClick={() => setShowForm(true)}
              />
            </motion.div>
          )}

          {/* Create Form */}
          {showForm && (
            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-slate-900/90 rounded-xl p-4 border border-white/10"
            >
              <div className="flex items-center gap-2 mb-4">
                <Plus size={18} className="text-green-400" />
                <h2 className="font-['Fredericka_the_Great'] text-lg text-white">
                  New Preset
                </h2>
              </div>

              <div className="flex flex-col gap-3">
                {/* Basic Info */}
                {renderSection(SECTIONS[0], (
                  <>
                    <div className="col-span-2">
                      <FormField
                        label="Name"
                        value={form.name}
                        onChange={(v) => setField("name", v)}
                        type="text"
                      />
                    </div>
                    <div className="col-span-2">
                      <FormField
                        label="Description"
                        value={form.description}
                        onChange={(v) => setField("description", v)}
                        type="text"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-slate-400">
                        Difficulty
                      </label>
                      <select
                        value={form.difficulty}
                        onChange={(e) =>
                          setField("difficulty", e.target.value)
                        }
                        className="w-full bg-black/30 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 mt-1"
                      >
                        {DIFFICULTY_NAMES.map((name, i) => (
                          <option key={i} value={i}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ))}

                {/* Level Scaling */}
                {renderSection(SECTIONS[1], (
                  <>
                    <FormField
                      label="Base Moves"
                      value={form.base_moves}
                      onChange={(v) => setField("base_moves", v)}
                      min={1}
                      max={255}
                    />
                    <FormField
                      label="Max Moves"
                      value={form.max_moves}
                      onChange={(v) => setField("max_moves", v)}
                      min={1}
                      max={255}
                    />
                    <FormField
                      label="Base Ratio x100"
                      value={form.base_ratio_x100}
                      onChange={(v) => setField("base_ratio_x100", v)}
                      min={1}
                    />
                    <FormField
                      label="Max Ratio x100"
                      value={form.max_ratio_x100}
                      onChange={(v) => setField("max_ratio_x100", v)}
                      min={1}
                    />
                  </>
                ))}

                {/* Cube Thresholds */}
                {renderSection(SECTIONS[2], (
                  <>
                    <FormField
                      label="3-Cube %"
                      value={form.cube_3_percent}
                      onChange={(v) => setField("cube_3_percent", v)}
                      min={0}
                      max={100}
                    />
                    <FormField
                      label="2-Cube %"
                      value={form.cube_2_percent}
                      onChange={(v) => setField("cube_2_percent", v)}
                      min={0}
                      max={100}
                    />
                  </>
                ))}

                {/* Difficulty Tiers */}
                {renderSection(SECTIONS[3], (
                  <>
                    <FormField
                      label="Tier 1 (Easy)"
                      value={form.tier_1}
                      onChange={(v) => setField("tier_1", v)}
                      min={1}
                      max={255}
                    />
                    <FormField
                      label="Tier 2 (Medium)"
                      value={form.tier_2}
                      onChange={(v) => setField("tier_2", v)}
                      min={1}
                      max={255}
                    />
                    <FormField
                      label="Tier 3 (MedHard)"
                      value={form.tier_3}
                      onChange={(v) => setField("tier_3", v)}
                      min={1}
                      max={255}
                    />
                    <FormField
                      label="Tier 4 (Hard)"
                      value={form.tier_4}
                      onChange={(v) => setField("tier_4", v)}
                      min={1}
                      max={255}
                    />
                    <FormField
                      label="Tier 5 (VHard)"
                      value={form.tier_5}
                      onChange={(v) => setField("tier_5", v)}
                      min={1}
                      max={255}
                    />
                    <FormField
                      label="Tier 6 (Expert)"
                      value={form.tier_6}
                      onChange={(v) => setField("tier_6", v)}
                      min={1}
                      max={255}
                    />
                    <FormField
                      label="Tier 7 (Master)"
                      value={form.tier_7}
                      onChange={(v) => setField("tier_7", v)}
                      min={1}
                      max={255}
                    />
                    <FormField
                      label="Level Cap"
                      value={form.level_cap}
                      onChange={(v) => setField("level_cap", v)}
                      min={1}
                      max={255}
                    />
                  </>
                ))}

                {/* Constraints */}
                {renderSection(SECTIONS[4], (
                  <>
                    <div className="col-span-2 flex items-center gap-3">
                      <label className="text-xs text-slate-400">
                        Enabled
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setField(
                            "constraints_enabled",
                            form.constraints_enabled ? "0" : "1",
                          )
                        }
                        className={`w-10 h-5 rounded-full transition-colors ${form.constraints_enabled ? "bg-green-500" : "bg-slate-600"}`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${form.constraints_enabled ? "translate-x-5" : "translate-x-0"}`}
                        />
                      </button>
                    </div>
                    <FormField
                      label="Start Level"
                      value={form.constraint_start_level}
                      onChange={(v) =>
                        setField("constraint_start_level", v)
                      }
                      min={1}
                    />
                    <div />
                    <FormField
                      label="VE Min Lines"
                      value={form.ve_min_lines}
                      onChange={(v) => setField("ve_min_lines", v)}
                      min={0}
                      max={15}
                    />
                    <FormField
                      label="M Min Lines"
                      value={form.m_min_lines}
                      onChange={(v) => setField("m_min_lines", v)}
                      min={0}
                      max={15}
                    />
                    <FormField
                      label="VE Max Lines"
                      value={form.ve_max_lines}
                      onChange={(v) => setField("ve_max_lines", v)}
                      min={0}
                      max={15}
                    />
                    <FormField
                      label="M Max Lines"
                      value={form.m_max_lines}
                      onChange={(v) => setField("m_max_lines", v)}
                      min={0}
                      max={15}
                    />
                    <FormField
                      label="VE Budget Min"
                      value={form.ve_budget_min}
                      onChange={(v) => setField("ve_budget_min", v)}
                      min={0}
                      max={255}
                    />
                    <FormField
                      label="VE Budget Max"
                      value={form.ve_budget_max}
                      onChange={(v) => setField("ve_budget_max", v)}
                      min={0}
                      max={255}
                    />
                    <FormField
                      label="M Budget Min"
                      value={form.m_budget_min}
                      onChange={(v) => setField("m_budget_min", v)}
                      min={0}
                      max={255}
                    />
                    <FormField
                      label="M Budget Max"
                      value={form.m_budget_max}
                      onChange={(v) => setField("m_budget_max", v)}
                      min={0}
                      max={255}
                    />
                    <FormField
                      label="VE Min Times"
                      value={form.ve_min_times}
                      onChange={(v) => setField("ve_min_times", v)}
                      min={0}
                      max={15}
                    />
                    <FormField
                      label="M Min Times"
                      value={form.m_min_times}
                      onChange={(v) => setField("m_min_times", v)}
                      min={0}
                      max={15}
                    />
                    <FormField
                      label="VE Dual Chance"
                      value={form.ve_dual_chance}
                      onChange={(v) => setField("ve_dual_chance", v)}
                      min={0}
                      max={100}
                    />
                    <FormField
                      label="M Dual Chance"
                      value={form.m_dual_chance}
                      onChange={(v) => setField("m_dual_chance", v)}
                      min={0}
                      max={100}
                    />
                    <FormField
                      label="VE NoBonus%"
                      value={form.ve_no_bonus_chance}
                      onChange={(v) => setField("ve_no_bonus_chance", v)}
                      min={0}
                      max={100}
                    />
                    <FormField
                      label="M NoBonus%"
                      value={form.m_no_bonus_chance}
                      onChange={(v) => setField("m_no_bonus_chance", v)}
                      min={0}
                      max={100}
                    />
                  </>
                ))}

                {/* Block Weights */}
                {renderSection(SECTIONS[5], (
                  <>
                    <div className="col-span-2 text-xs text-slate-500 -mb-1">
                      VeryEasy
                    </div>
                    <FormField
                      label="Size 1"
                      value={form.ve_size1}
                      onChange={(v) => setField("ve_size1", v)}
                      min={0}
                      max={100}
                    />
                    <FormField
                      label="Size 2"
                      value={form.ve_size2}
                      onChange={(v) => setField("ve_size2", v)}
                      min={0}
                      max={100}
                    />
                    <FormField
                      label="Size 3"
                      value={form.ve_size3}
                      onChange={(v) => setField("ve_size3", v)}
                      min={0}
                      max={100}
                    />
                    <FormField
                      label="Size 4"
                      value={form.ve_size4}
                      onChange={(v) => setField("ve_size4", v)}
                      min={0}
                      max={100}
                    />
                    <FormField
                      label="Size 5"
                      value={form.ve_size5}
                      onChange={(v) => setField("ve_size5", v)}
                      min={0}
                      max={100}
                    />
                    <div className="col-span-2 text-xs text-slate-500 -mb-1 mt-1">
                      Master
                    </div>
                    <FormField
                      label="Size 1"
                      value={form.m_size1}
                      onChange={(v) => setField("m_size1", v)}
                      min={0}
                      max={100}
                    />
                    <FormField
                      label="Size 2"
                      value={form.m_size2}
                      onChange={(v) => setField("m_size2", v)}
                      min={0}
                      max={100}
                    />
                    <FormField
                      label="Size 3"
                      value={form.m_size3}
                      onChange={(v) => setField("m_size3", v)}
                      min={0}
                      max={100}
                    />
                    <FormField
                      label="Size 4"
                      value={form.m_size4}
                      onChange={(v) => setField("m_size4", v)}
                      min={0}
                      max={100}
                    />
                    <FormField
                      label="Size 5"
                      value={form.m_size5}
                      onChange={(v) => setField("m_size5", v)}
                      min={0}
                      max={100}
                    />
                  </>
                ))}

                {/* Variance */}
                {renderSection(SECTIONS[6], (
                  <>
                    <FormField
                      label="Early Variance %"
                      value={form.early_variance}
                      onChange={(v) => setField("early_variance", v)}
                      min={0}
                      max={50}
                    />
                    <FormField
                      label="Mid Variance %"
                      value={form.mid_variance}
                      onChange={(v) => setField("mid_variance", v)}
                      min={0}
                      max={50}
                    />
                    <FormField
                      label="Late Variance %"
                      value={form.late_variance}
                      onChange={(v) => setField("late_variance", v)}
                      min={0}
                      max={50}
                    />
                    <div />
                    <FormField
                      label="Early Lvl Threshold"
                      value={form.early_level_threshold}
                      onChange={(v) =>
                        setField("early_level_threshold", v)
                      }
                      min={1}
                      max={255}
                    />
                    <FormField
                      label="Mid Lvl Threshold"
                      value={form.mid_level_threshold}
                      onChange={(v) =>
                        setField("mid_level_threshold", v)
                      }
                      min={1}
                      max={255}
                    />
                  </>
                ))}

                {renderSection(SECTIONS[7], (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">
                        Boss Upgrades
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setField(
                            "boss_upgrades_enabled",
                            form.boss_upgrades_enabled ? "0" : "1",
                          )
                        }
                        className={`w-10 h-5 rounded-full transition-colors ${form.boss_upgrades_enabled ? "bg-green-500" : "bg-slate-600"}`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${form.boss_upgrades_enabled ? "translate-x-5" : "translate-x-0"}`}
                        />
                      </button>
                    </div>
                    <FormField
                      label="Reroll Base Cost"
                      value={form.reroll_base_cost}
                      onChange={(v) => setField("reroll_base_cost", v)}
                      min={0}
                      max={255}
                    />
                    <FormField
                      label="Starting Charges"
                      value={form.starting_charges}
                      onChange={(v) => setField("starting_charges", v)}
                      min={0}
                      max={255}
                    />
                  </>
                ))}

                {/* Submit */}
                <div className="flex gap-3 mt-2">
                  <GameButton
                    label="CANCEL"
                    variant="secondary"
                    onClick={() => setShowForm(false)}
                    disabled={submitting}
                  />
                  <GameButton
                    label={submitting ? "CREATING..." : "CREATE PRESET"}
                    variant="primary"
                    loading={submitting}
                    disabled={submitting || !form.name.trim()}
                    onClick={handleSubmit}
                  />
                </div>
              </div>
            </motion.section>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPresetsPage;

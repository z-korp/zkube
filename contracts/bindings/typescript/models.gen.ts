import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

import { CairoCustomEnum, CairoOption, CairoOptionVariant, BigNumberish } from 'starknet';

// Type definition for `achievement::models::index::AchievementAdvancement` struct
export interface AchievementAdvancement {
	player_id: BigNumberish;
	achievement_id: BigNumberish;
	task_id: BigNumberish;
	count: BigNumberish;
	timestamp: BigNumberish;
}

// Type definition for `achievement::models::index::AchievementAssociation` struct
export interface AchievementAssociation {
	task_id: BigNumberish;
	achievements: Array<BigNumberish>;
}

// Type definition for `achievement::models::index::AchievementCompletion` struct
export interface AchievementCompletion {
	player_id: BigNumberish;
	achievement_id: BigNumberish;
	timestamp: BigNumberish;
	unclaimed: boolean;
}

// Type definition for `achievement::models::index::AchievementDefinition` struct
export interface AchievementDefinition {
	id: BigNumberish;
	start: BigNumberish;
	end: BigNumberish;
	tasks: Array<Task>;
}

// Type definition for `achievement::types::task::Task` struct
export interface Task {
	id: BigNumberish;
	total: BigNumberish;
	description: string;
}

// Type definition for `quest::models::index::QuestAdvancement` struct
export interface QuestAdvancement {
	player_id: BigNumberish;
	quest_id: BigNumberish;
	task_id: BigNumberish;
	interval_id: BigNumberish;
	count: BigNumberish;
	timestamp: BigNumberish;
}

// Type definition for `quest::models::index::QuestAssociation` struct
export interface QuestAssociation {
	task_id: BigNumberish;
	quests: Array<BigNumberish>;
}

// Type definition for `quest::models::index::QuestCompletion` struct
export interface QuestCompletion {
	player_id: BigNumberish;
	quest_id: BigNumberish;
	interval_id: BigNumberish;
	timestamp: BigNumberish;
	unclaimed: boolean;
	lock_count: BigNumberish;
}

// Type definition for `quest::models::index::QuestCondition` struct
export interface QuestCondition {
	quest_id: BigNumberish;
	quests: Array<BigNumberish>;
}

// Type definition for `quest::models::index::QuestDefinition` struct
export interface QuestDefinition {
	id: BigNumberish;
	start: BigNumberish;
	end: BigNumberish;
	duration: BigNumberish;
	interval: BigNumberish;
	tasks: Array<Task>;
	conditions: Array<BigNumberish>;
}

// Type definition for `quest::types::task::Task` struct
export interface Task {
	id: BigNumberish;
	total: BigNumberish;
	description: string;
}

// Type definition for `zkube::models::config::GameSettings` struct
export interface GameSettings {
	settings_id: BigNumberish;
	mode: BigNumberish;
	base_moves: BigNumberish;
	max_moves: BigNumberish;
	base_ratio_x100: BigNumberish;
	max_ratio_x100: BigNumberish;
	tier_1_threshold: BigNumberish;
	tier_2_threshold: BigNumberish;
	tier_3_threshold: BigNumberish;
	tier_4_threshold: BigNumberish;
	tier_5_threshold: BigNumberish;
	tier_6_threshold: BigNumberish;
	tier_7_threshold: BigNumberish;
	constraints_enabled: BigNumberish;
	constraint_start_level: BigNumberish;
	constraint_lines_budgets: BigNumberish;
	veryeasy_size1_weight: BigNumberish;
	veryeasy_size2_weight: BigNumberish;
	veryeasy_size3_weight: BigNumberish;
	veryeasy_size4_weight: BigNumberish;
	veryeasy_size5_weight: BigNumberish;
	master_size1_weight: BigNumberish;
	master_size2_weight: BigNumberish;
	master_size3_weight: BigNumberish;
	master_size4_weight: BigNumberish;
	master_size5_weight: BigNumberish;
	early_variance_percent: BigNumberish;
	mid_variance_percent: BigNumberish;
	late_variance_percent: BigNumberish;
	early_level_threshold: BigNumberish;
	mid_level_threshold: BigNumberish;
	level_cap: BigNumberish;
	endless_difficulty_thresholds: BigNumberish;
	endless_score_multipliers: BigNumberish;
	zone_id: BigNumberish;
	active_mutator_id: BigNumberish;
	passive_mutator_id: BigNumberish;
	boss_id: BigNumberish;
}

// Type definition for `zkube::models::config::GameSettingsMetadata` struct
export interface GameSettingsMetadata {
	settings_id: BigNumberish;
	name: BigNumberish;
	description: string;
	created_by: string;
	created_at: BigNumberish;
	theme_id: BigNumberish;
	is_free: boolean;
	is_tournament: boolean;
	enabled: boolean;
	price: BigNumberish;
	payment_token: string;
	star_cost: BigNumberish;
}

// Type definition for `zkube::models::cosmetic::CosmeticDef` struct
export interface CosmeticDef {
	cosmetic_id: BigNumberish;
	name: BigNumberish;
	star_cost: BigNumberish;
	category: BigNumberish;
	enabled: boolean;
}

// Type definition for `zkube::models::cosmetic::CosmeticUnlock` struct
export interface CosmeticUnlock {
	player: string;
	cosmetic_id: BigNumberish;
	purchased_at: BigNumberish;
}

// Type definition for `zkube::models::daily::ActiveDailyAttempt` struct
export interface ActiveDailyAttempt {
	player: string;
	game_id: BigNumberish;
	challenge_id: BigNumberish;
	level: BigNumberish;
	is_replay: boolean;
}

// Type definition for `zkube::models::daily::DailyAttempt` struct
export interface DailyAttempt {
	game_id: BigNumberish;
	player: string;
	zone_id: BigNumberish;
	challenge_id: BigNumberish;
	level: BigNumberish;
	is_replay: boolean;
}

// Type definition for `zkube::models::daily::DailyChallenge` struct
export interface DailyChallenge {
	challenge_id: BigNumberish;
	settings_id: BigNumberish;
	seed: BigNumberish;
	start_time: BigNumberish;
	end_time: BigNumberish;
	total_entries: BigNumberish;
	settled: boolean;
	zone_id: BigNumberish;
	active_mutator_id: BigNumberish;
	passive_mutator_id: BigNumberish;
	boss_id: BigNumberish;
}

// Type definition for `zkube::models::daily::DailyEntry` struct
export interface DailyEntry {
	challenge_id: BigNumberish;
	player: string;
	level_stars: BigNumberish;
	total_stars: BigNumberish;
	highest_cleared: BigNumberish;
	last_star_time: BigNumberish;
	joined_at: BigNumberish;
	rank: BigNumberish;
	star_reward: BigNumberish;
}

// Type definition for `zkube::models::daily::GameChallenge` struct
export interface GameChallenge {
	game_id: BigNumberish;
	challenge_id: BigNumberish;
}

// Type definition for `zkube::models::entitlement::ZoneEntitlement` struct
export interface ZoneEntitlement {
	player: string;
	settings_id: BigNumberish;
	purchased_at: BigNumberish;
}

// Type definition for `zkube::models::game::Game` struct
export interface Game {
	game_id: BigNumberish;
	blocks: BigNumberish;
	next_row: BigNumberish;
	combo_counter: BigNumberish;
	max_combo: BigNumberish;
	run_data: BigNumberish;
	level_stars: BigNumberish;
	started_at: BigNumberish;
	over: boolean;
}

// Type definition for `zkube::models::game::GameLevel` struct
export interface GameLevel {
	game_id: BigNumberish;
	level: BigNumberish;
	points_required: BigNumberish;
	max_moves: BigNumberish;
	difficulty: BigNumberish;
	constraint_type: BigNumberish;
	constraint_value: BigNumberish;
	constraint_count: BigNumberish;
	constraint2_type: BigNumberish;
	constraint2_value: BigNumberish;
	constraint2_count: BigNumberish;
	mutator_id: BigNumberish;
}

// Type definition for `zkube::models::game::GameSeed` struct
export interface GameSeed {
	game_id: BigNumberish;
	seed: BigNumberish;
	level_seed: BigNumberish;
	vrf_enabled: boolean;
}

// Type definition for `zkube::models::mutator::MutatorDef` struct
export interface MutatorDef {
	mutator_id: BigNumberish;
	zone_id: BigNumberish;
	moves_modifier: BigNumberish;
	ratio_modifier: BigNumberish;
	difficulty_offset: BigNumberish;
	combo_score_mult_x100: BigNumberish;
	star_threshold_modifier: BigNumberish;
	endless_ramp_mult_x100: BigNumberish;
	line_clear_bonus: BigNumberish;
	perfect_clear_bonus: BigNumberish;
	starting_rows: BigNumberish;
	bonus_1_type: BigNumberish;
	bonus_1_trigger_type: BigNumberish;
	bonus_1_trigger_threshold: BigNumberish;
	bonus_1_starting_charges: BigNumberish;
	bonus_2_type: BigNumberish;
	bonus_2_trigger_type: BigNumberish;
	bonus_2_trigger_threshold: BigNumberish;
	bonus_2_starting_charges: BigNumberish;
	bonus_3_type: BigNumberish;
	bonus_3_trigger_type: BigNumberish;
	bonus_3_trigger_threshold: BigNumberish;
	bonus_3_starting_charges: BigNumberish;
}

// Type definition for `zkube::models::player::PlayerBestRun` struct
export interface PlayerBestRun {
	player: string;
	settings_id: BigNumberish;
	run_type: BigNumberish;
	best_score: BigNumberish;
	best_stars: BigNumberish;
	best_level: BigNumberish;
	zone_cleared: boolean;
	best_level_stars: BigNumberish;
	best_game_id: BigNumberish;
}

// Type definition for `zkube::models::player::PlayerMeta` struct
export interface PlayerMeta {
	player: string;
	data: BigNumberish;
	best_level: BigNumberish;
	last_active: BigNumberish;
}

// Type definition for `zkube::models::story::ActiveStoryAttempt` struct
export interface ActiveStoryAttempt {
	player: string;
	game_id: BigNumberish;
	zone_id: BigNumberish;
	level: BigNumberish;
	is_replay: boolean;
}

// Type definition for `zkube::models::story::StoryAttempt` struct
export interface StoryAttempt {
	game_id: BigNumberish;
	player: string;
	zone_id: BigNumberish;
	level: BigNumberish;
	is_replay: boolean;
}

// Type definition for `zkube::models::story::StoryZoneProgress` struct
export interface StoryZoneProgress {
	player: string;
	zone_id: BigNumberish;
	level_stars: BigNumberish;
	highest_cleared: BigNumberish;
	boss_cleared: boolean;
	perfection_claimed: boolean;
}

// Type definition for `zkube::models::weekly::WeeklyEndless` struct
export interface WeeklyEndless {
	week_id: BigNumberish;
	total_participants: BigNumberish;
	settled: boolean;
}

// Type definition for `achievement::events::index::AchievementClaimed` struct
export interface AchievementClaimed {
	player_id: BigNumberish;
	achievement_id: BigNumberish;
	time: BigNumberish;
}

// Type definition for `achievement::events::index::AchievementCompleted` struct
export interface AchievementCompleted {
	player_id: BigNumberish;
	achievement_id: BigNumberish;
	time: BigNumberish;
}

// Type definition for `achievement::events::index::TrophyCreation` struct
export interface TrophyCreation {
	id: BigNumberish;
	hidden: boolean;
	index: BigNumberish;
	points: BigNumberish;
	start: BigNumberish;
	end: BigNumberish;
	group: BigNumberish;
	icon: BigNumberish;
	title: BigNumberish;
	description: string;
	tasks: Array<Task>;
	data: string;
}

// Type definition for `achievement::events::index::TrophyProgression` struct
export interface TrophyProgression {
	player_id: BigNumberish;
	task_id: BigNumberish;
	count: BigNumberish;
	time: BigNumberish;
}

// Type definition for `quest::events::index::QuestClaimed` struct
export interface QuestClaimed {
	player_id: BigNumberish;
	quest_id: BigNumberish;
	interval_id: BigNumberish;
	time: BigNumberish;
}

// Type definition for `quest::events::index::QuestCompleted` struct
export interface QuestCompleted {
	player_id: BigNumberish;
	quest_id: BigNumberish;
	interval_id: BigNumberish;
	time: BigNumberish;
}

// Type definition for `quest::events::index::QuestCreation` struct
export interface QuestCreation {
	id: BigNumberish;
	definition: QuestDefinition;
	metadata: string;
}

// Type definition for `quest::events::index::QuestProgression` struct
export interface QuestProgression {
	player_id: BigNumberish;
	task_id: BigNumberish;
	count: BigNumberish;
	time: BigNumberish;
}

// Type definition for `quest::events::index::QuestUnlocked` struct
export interface QuestUnlocked {
	player_id: BigNumberish;
	quest_id: BigNumberish;
	interval_id: BigNumberish;
	time: BigNumberish;
}

// Type definition for `zkube::events::ConstraintProgress` struct
export interface ConstraintProgress {
	game_id: BigNumberish;
	constraint_type: ConstraintTypeEnum;
	current: BigNumberish;
	required: BigNumberish;
}

// Type definition for `zkube::events::LevelCompleted` struct
export interface LevelCompleted {
	game_id: BigNumberish;
	player: string;
	level: BigNumberish;
	moves_used: BigNumberish;
	score: BigNumberish;
	total_score: BigNumberish;
}

// Type definition for `zkube::events::LevelStarted` struct
export interface LevelStarted {
	game_id: BigNumberish;
	player: string;
	level: BigNumberish;
	points_required: BigNumberish;
	max_moves: BigNumberish;
	constraint_type: ConstraintTypeEnum;
	constraint_value: BigNumberish;
	constraint_required: BigNumberish;
}

// Type definition for `zkube::events::RunEnded` struct
export interface RunEnded {
	game_id: BigNumberish;
	player: string;
	final_level: BigNumberish;
	final_score: BigNumberish;
	current_difficulty: BigNumberish;
	started_at: BigNumberish;
	ended_at: BigNumberish;
}

// Type definition for `zkube::events::StartGame` struct
export interface StartGame {
	player: string;
	timestamp: BigNumberish;
	game_id: BigNumberish;
}

// Type definition for `zkube::events::ZoneClearBonus` struct
export interface ZoneClearBonus {
	player: string;
	settings_id: BigNumberish;
	amount: BigNumberish;
}

// Type definition for `game_components_interfaces::structs::metagame::GameContext` struct
export interface GameContext {
	name: BigNumberish;
	value: BigNumberish;
}

// Type definition for `game_components_interfaces::structs::metagame::GameContextDetails` struct
export interface GameContextDetails {
	name: string;
	description: string;
	id: CairoOption<BigNumberish>;
	context: Array<GameContext>;
}

// Type definition for `game_components_interfaces::structs::minigame::GameDetail` struct
export interface GameDetail {
	name: BigNumberish;
	value: BigNumberish;
}

// Type definition for `game_components_interfaces::structs::minigame::GameSetting` struct
export interface GameSetting {
	name: BigNumberish;
	value: BigNumberish;
}

// Type definition for `game_components_interfaces::structs::minigame::GameSettingDetails` struct
export interface GameSettingDetails {
	name: string;
	description: string;
	settings: Array<GameSetting>;
}

// Type definition for `game_components_interfaces::structs::minigame::MintGameParams` struct
export interface MintGameParams {
	player_name: CairoOption<BigNumberish>;
	settings_id: CairoOption<BigNumberish>;
	start: CairoOption<BigNumberish>;
	end: CairoOption<BigNumberish>;
	objective_id: CairoOption<BigNumberish>;
	context: CairoOption<GameContextDetails>;
	client_url: CairoOption<string>;
	renderer_address: CairoOption<string>;
	skills_address: CairoOption<string>;
	to: string;
	soulbound: boolean;
	paymaster: boolean;
	salt: BigNumberish;
	metadata: BigNumberish;
}

// Type definition for `openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleAdminChanged` struct
export interface RoleAdminChanged {
	role: BigNumberish;
	previous_admin_role: BigNumberish;
	new_admin_role: BigNumberish;
}

// Type definition for `openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleGranted` struct
export interface RoleGranted {
	role: BigNumberish;
	account: string;
	sender: string;
}

// Type definition for `openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleGrantedWithDelay` struct
export interface RoleGrantedWithDelay {
	role: BigNumberish;
	account: string;
	sender: string;
	delay: BigNumberish;
}

// Type definition for `openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleRevoked` struct
export interface RoleRevoked {
	role: BigNumberish;
	account: string;
	sender: string;
}

// Type definition for `zkube::systems::config::config_system::GameSettingsCreated` struct
export interface GameSettingsCreated {
	settings_id: BigNumberish;
	name: BigNumberish;
	difficulty: DifficultyEnum;
	created_by: string;
}

// Type definition for `zkube::types::constraint::ConstraintType` enum
export const constraintType = [
	'None',
	'ComboLines',
	'BreakBlocks',
	'ComboStreak',
] as const;
export type ConstraintType = { [key in typeof constraintType[number]]: string };
export type ConstraintTypeEnum = CairoCustomEnum;

// Type definition for `zkube::types::difficulty::Difficulty` enum
export const difficulty = [
	'None',
	'Increasing',
	'VeryEasy',
	'Easy',
	'Medium',
	'MediumHard',
	'Hard',
	'VeryHard',
	'Expert',
	'Master',
] as const;
export type Difficulty = { [key in typeof difficulty[number]]: string };
export type DifficultyEnum = CairoCustomEnum;

export interface SchemaType extends ISchemaType {
	zkube: {
		AchievementAdvancement: AchievementAdvancement,
		AchievementAssociation: AchievementAssociation,
		AchievementCompletion: AchievementCompletion,
		AchievementDefinition: AchievementDefinition,
		Task: Task,
		QuestAdvancement: QuestAdvancement,
		QuestAssociation: QuestAssociation,
		QuestCompletion: QuestCompletion,
		QuestCondition: QuestCondition,
		QuestDefinition: QuestDefinition,
		GameSettings: GameSettings,
		GameSettingsMetadata: GameSettingsMetadata,
		CosmeticDef: CosmeticDef,
		CosmeticUnlock: CosmeticUnlock,
		ActiveDailyAttempt: ActiveDailyAttempt,
		DailyAttempt: DailyAttempt,
		DailyChallenge: DailyChallenge,
		DailyEntry: DailyEntry,
		GameChallenge: GameChallenge,
		ZoneEntitlement: ZoneEntitlement,
		Game: Game,
		GameLevel: GameLevel,
		GameSeed: GameSeed,
		MutatorDef: MutatorDef,
		PlayerBestRun: PlayerBestRun,
		PlayerMeta: PlayerMeta,
		ActiveStoryAttempt: ActiveStoryAttempt,
		StoryAttempt: StoryAttempt,
		StoryZoneProgress: StoryZoneProgress,
		WeeklyEndless: WeeklyEndless,
		AchievementClaimed: AchievementClaimed,
		AchievementCompleted: AchievementCompleted,
		TrophyCreation: TrophyCreation,
		TrophyProgression: TrophyProgression,
		QuestClaimed: QuestClaimed,
		QuestCompleted: QuestCompleted,
		QuestCreation: QuestCreation,
		QuestProgression: QuestProgression,
		QuestUnlocked: QuestUnlocked,
		ConstraintProgress: ConstraintProgress,
		LevelCompleted: LevelCompleted,
		LevelStarted: LevelStarted,
		RunEnded: RunEnded,
		StartGame: StartGame,
		ZoneClearBonus: ZoneClearBonus,
		GameContext: GameContext,
		GameContextDetails: GameContextDetails,
		GameDetail: GameDetail,
		GameSetting: GameSetting,
		GameSettingDetails: GameSettingDetails,
		MintGameParams: MintGameParams,
		RoleAdminChanged: RoleAdminChanged,
		RoleGranted: RoleGranted,
		RoleGrantedWithDelay: RoleGrantedWithDelay,
		RoleRevoked: RoleRevoked,
		GameSettingsCreated: GameSettingsCreated,
	},
}
export const schema: SchemaType = {
	zkube: {
		AchievementAdvancement: {
			player_id: 0,
			achievement_id: 0,
			task_id: 0,
			count: 0,
			timestamp: 0,
		},
		AchievementAssociation: {
			task_id: 0,
			achievements: [0],
		},
		AchievementCompletion: {
			player_id: 0,
			achievement_id: 0,
			timestamp: 0,
			unclaimed: false,
		},
		AchievementDefinition: {
			id: 0,
			start: 0,
			end: 0,
			tasks: [{ id: 0, total: 0, description: "", }],
		},
		Task: {
			id: 0,
			total: 0,
		description: "",
		},
		QuestAdvancement: {
			player_id: 0,
			quest_id: 0,
			task_id: 0,
			interval_id: 0,
			count: 0,
			timestamp: 0,
		},
		QuestAssociation: {
			task_id: 0,
			quests: [0],
		},
		QuestCompletion: {
			player_id: 0,
			quest_id: 0,
			interval_id: 0,
			timestamp: 0,
			unclaimed: false,
			lock_count: 0,
		},
		QuestCondition: {
			quest_id: 0,
			quests: [0],
		},
		QuestDefinition: {
			id: 0,
			start: 0,
			end: 0,
			duration: 0,
			interval: 0,
			tasks: [{ id: 0, total: 0, description: "", }],
			conditions: [0],
		},
		GameSettings: {
			settings_id: 0,
			mode: 0,
			base_moves: 0,
			max_moves: 0,
			base_ratio_x100: 0,
			max_ratio_x100: 0,
			tier_1_threshold: 0,
			tier_2_threshold: 0,
			tier_3_threshold: 0,
			tier_4_threshold: 0,
			tier_5_threshold: 0,
			tier_6_threshold: 0,
			tier_7_threshold: 0,
			constraints_enabled: 0,
			constraint_start_level: 0,
			constraint_lines_budgets: 0,
			veryeasy_size1_weight: 0,
			veryeasy_size2_weight: 0,
			veryeasy_size3_weight: 0,
			veryeasy_size4_weight: 0,
			veryeasy_size5_weight: 0,
			master_size1_weight: 0,
			master_size2_weight: 0,
			master_size3_weight: 0,
			master_size4_weight: 0,
			master_size5_weight: 0,
			early_variance_percent: 0,
			mid_variance_percent: 0,
			late_variance_percent: 0,
			early_level_threshold: 0,
			mid_level_threshold: 0,
			level_cap: 0,
			endless_difficulty_thresholds: 0,
			endless_score_multipliers: 0,
			zone_id: 0,
			active_mutator_id: 0,
			passive_mutator_id: 0,
			boss_id: 0,
		},
		GameSettingsMetadata: {
			settings_id: 0,
			name: 0,
		description: "",
			created_by: "",
			created_at: 0,
			theme_id: 0,
			is_free: false,
			is_tournament: false,
			enabled: false,
			price: 0,
			payment_token: "",
			star_cost: 0,
		},
		CosmeticDef: {
			cosmetic_id: 0,
			name: 0,
			star_cost: 0,
			category: 0,
			enabled: false,
		},
		CosmeticUnlock: {
			player: "",
			cosmetic_id: 0,
			purchased_at: 0,
		},
		ActiveDailyAttempt: {
			player: "",
			game_id: 0,
			challenge_id: 0,
			level: 0,
			is_replay: false,
		},
		DailyAttempt: {
			game_id: 0,
			player: "",
			zone_id: 0,
			challenge_id: 0,
			level: 0,
			is_replay: false,
		},
		DailyChallenge: {
			challenge_id: 0,
			settings_id: 0,
			seed: 0,
			start_time: 0,
			end_time: 0,
			total_entries: 0,
			settled: false,
			zone_id: 0,
			active_mutator_id: 0,
			passive_mutator_id: 0,
			boss_id: 0,
		},
		DailyEntry: {
			challenge_id: 0,
			player: "",
			level_stars: 0,
			total_stars: 0,
			highest_cleared: 0,
			last_star_time: 0,
			joined_at: 0,
			rank: 0,
			star_reward: 0,
		},
		GameChallenge: {
			game_id: 0,
			challenge_id: 0,
		},
		ZoneEntitlement: {
			player: "",
			settings_id: 0,
			purchased_at: 0,
		},
		Game: {
			game_id: 0,
			blocks: 0,
			next_row: 0,
			combo_counter: 0,
			max_combo: 0,
			run_data: 0,
			level_stars: 0,
			started_at: 0,
			over: false,
		},
		GameLevel: {
			game_id: 0,
			level: 0,
			points_required: 0,
			max_moves: 0,
			difficulty: 0,
			constraint_type: 0,
			constraint_value: 0,
			constraint_count: 0,
			constraint2_type: 0,
			constraint2_value: 0,
			constraint2_count: 0,
			mutator_id: 0,
		},
		GameSeed: {
			game_id: 0,
			seed: 0,
			level_seed: 0,
			vrf_enabled: false,
		},
		MutatorDef: {
			mutator_id: 0,
			zone_id: 0,
			moves_modifier: 0,
			ratio_modifier: 0,
			difficulty_offset: 0,
			combo_score_mult_x100: 0,
			star_threshold_modifier: 0,
			endless_ramp_mult_x100: 0,
			line_clear_bonus: 0,
			perfect_clear_bonus: 0,
			starting_rows: 0,
			bonus_1_type: 0,
			bonus_1_trigger_type: 0,
			bonus_1_trigger_threshold: 0,
			bonus_1_starting_charges: 0,
			bonus_2_type: 0,
			bonus_2_trigger_type: 0,
			bonus_2_trigger_threshold: 0,
			bonus_2_starting_charges: 0,
			bonus_3_type: 0,
			bonus_3_trigger_type: 0,
			bonus_3_trigger_threshold: 0,
			bonus_3_starting_charges: 0,
		},
		PlayerBestRun: {
			player: "",
			settings_id: 0,
			run_type: 0,
			best_score: 0,
			best_stars: 0,
			best_level: 0,
			zone_cleared: false,
			best_level_stars: 0,
			best_game_id: 0,
		},
		PlayerMeta: {
			player: "",
			data: 0,
			best_level: 0,
			last_active: 0,
		},
		ActiveStoryAttempt: {
			player: "",
			game_id: 0,
			zone_id: 0,
			level: 0,
			is_replay: false,
		},
		StoryAttempt: {
			game_id: 0,
			player: "",
			zone_id: 0,
			level: 0,
			is_replay: false,
		},
		StoryZoneProgress: {
			player: "",
			zone_id: 0,
			level_stars: 0,
			highest_cleared: 0,
			boss_cleared: false,
			perfection_claimed: false,
		},
		WeeklyEndless: {
			week_id: 0,
			total_participants: 0,
			settled: false,
		},
		AchievementClaimed: {
			player_id: 0,
			achievement_id: 0,
			time: 0,
		},
		AchievementCompleted: {
			player_id: 0,
			achievement_id: 0,
			time: 0,
		},
		TrophyCreation: {
			id: 0,
			hidden: false,
			index: 0,
			points: 0,
			start: 0,
			end: 0,
			group: 0,
			icon: 0,
			title: 0,
		description: "",
			tasks: [{ id: 0, total: 0, description: "", }],
		data: "",
		},
		TrophyProgression: {
			player_id: 0,
			task_id: 0,
			count: 0,
			time: 0,
		},
		QuestClaimed: {
			player_id: 0,
			quest_id: 0,
			interval_id: 0,
			time: 0,
		},
		QuestCompleted: {
			player_id: 0,
			quest_id: 0,
			interval_id: 0,
			time: 0,
		},
		QuestCreation: {
			id: 0,
		definition: { id: 0, start: 0, end: 0, duration: 0, interval: 0, tasks: [{ id: 0, total: 0, description: "", }], conditions: [0], },
		metadata: "",
		},
		QuestProgression: {
			player_id: 0,
			task_id: 0,
			count: 0,
			time: 0,
		},
		QuestUnlocked: {
			player_id: 0,
			quest_id: 0,
			interval_id: 0,
			time: 0,
		},
		ConstraintProgress: {
			game_id: 0,
		constraint_type: new CairoCustomEnum({ 
					None: "",
				ComboLines: undefined,
				BreakBlocks: undefined,
				ComboStreak: undefined, }),
			current: 0,
			required: 0,
		},
		LevelCompleted: {
			game_id: 0,
			player: "",
			level: 0,
			moves_used: 0,
			score: 0,
			total_score: 0,
		},
		LevelStarted: {
			game_id: 0,
			player: "",
			level: 0,
			points_required: 0,
			max_moves: 0,
		constraint_type: new CairoCustomEnum({ 
					None: "",
				ComboLines: undefined,
				BreakBlocks: undefined,
				ComboStreak: undefined, }),
			constraint_value: 0,
			constraint_required: 0,
		},
		RunEnded: {
			game_id: 0,
			player: "",
			final_level: 0,
			final_score: 0,
			current_difficulty: 0,
			started_at: 0,
			ended_at: 0,
		},
		StartGame: {
			player: "",
			timestamp: 0,
			game_id: 0,
		},
		ZoneClearBonus: {
			player: "",
			settings_id: 0,
		amount: 0,
		},
		GameContext: {
			name: 0,
			value: 0,
		},
		GameContextDetails: {
		name: "",
		description: "",
			id: new CairoOption(CairoOptionVariant.None),
			context: [{ name: 0, value: 0, }],
		},
		GameDetail: {
			name: 0,
			value: 0,
		},
		GameSetting: {
			name: 0,
			value: 0,
		},
		GameSettingDetails: {
		name: "",
		description: "",
			settings: [{ name: 0, value: 0, }],
		},
		MintGameParams: {
			player_name: new CairoOption(CairoOptionVariant.None),
			settings_id: new CairoOption(CairoOptionVariant.None),
			start: new CairoOption(CairoOptionVariant.None),
			end: new CairoOption(CairoOptionVariant.None),
			objective_id: new CairoOption(CairoOptionVariant.None),
			context: new CairoOption(CairoOptionVariant.None),
			client_url: new CairoOption(CairoOptionVariant.None),
			renderer_address: new CairoOption(CairoOptionVariant.None),
			skills_address: new CairoOption(CairoOptionVariant.None),
			to: "",
			soulbound: false,
			paymaster: false,
			salt: 0,
			metadata: 0,
		},
		RoleAdminChanged: {
			role: 0,
			previous_admin_role: 0,
			new_admin_role: 0,
		},
		RoleGranted: {
			role: 0,
			account: "",
			sender: "",
		},
		RoleGrantedWithDelay: {
			role: 0,
			account: "",
			sender: "",
			delay: 0,
		},
		RoleRevoked: {
			role: 0,
			account: "",
			sender: "",
		},
		GameSettingsCreated: {
			settings_id: 0,
			name: 0,
		difficulty: new CairoCustomEnum({ 
					None: "",
				Increasing: undefined,
				VeryEasy: undefined,
				Easy: undefined,
				Medium: undefined,
				MediumHard: undefined,
				Hard: undefined,
				VeryHard: undefined,
				Expert: undefined,
				Master: undefined, }),
			created_by: "",
		},
	},
};
export enum ModelsMapping {
	AchievementAdvancement = 'achievement-AchievementAdvancement',
	AchievementAssociation = 'achievement-AchievementAssociation',
	AchievementCompletion = 'achievement-AchievementCompletion',
	AchievementDefinition = 'achievement-AchievementDefinition',
	Task = 'achievement-Task',
	QuestAdvancement = 'quest-QuestAdvancement',
	QuestAssociation = 'quest-QuestAssociation',
	QuestCompletion = 'quest-QuestCompletion',
	QuestCondition = 'quest-QuestCondition',
	QuestDefinition = 'quest-QuestDefinition',
	Task = 'quest-Task',
	GameSettings = 'zkube-GameSettings',
	GameSettingsMetadata = 'zkube-GameSettingsMetadata',
	CosmeticDef = 'zkube-CosmeticDef',
	CosmeticUnlock = 'zkube-CosmeticUnlock',
	ActiveDailyAttempt = 'zkube-ActiveDailyAttempt',
	DailyAttempt = 'zkube-DailyAttempt',
	DailyChallenge = 'zkube-DailyChallenge',
	DailyEntry = 'zkube-DailyEntry',
	GameChallenge = 'zkube-GameChallenge',
	ZoneEntitlement = 'zkube-ZoneEntitlement',
	Game = 'zkube-Game',
	GameLevel = 'zkube-GameLevel',
	GameSeed = 'zkube-GameSeed',
	MutatorDef = 'zkube-MutatorDef',
	PlayerBestRun = 'zkube-PlayerBestRun',
	PlayerMeta = 'zkube-PlayerMeta',
	ActiveStoryAttempt = 'zkube-ActiveStoryAttempt',
	StoryAttempt = 'zkube-StoryAttempt',
	StoryZoneProgress = 'zkube-StoryZoneProgress',
	WeeklyEndless = 'zkube-WeeklyEndless',
	AchievementClaimed = 'achievement-AchievementClaimed',
	AchievementCompleted = 'achievement-AchievementCompleted',
	TrophyCreation = 'achievement-TrophyCreation',
	TrophyProgression = 'achievement-TrophyProgression',
	QuestClaimed = 'quest-QuestClaimed',
	QuestCompleted = 'quest-QuestCompleted',
	QuestCreation = 'quest-QuestCreation',
	QuestProgression = 'quest-QuestProgression',
	QuestUnlocked = 'quest-QuestUnlocked',
	ConstraintProgress = 'zkube-ConstraintProgress',
	LevelCompleted = 'zkube-LevelCompleted',
	LevelStarted = 'zkube-LevelStarted',
	RunEnded = 'zkube-RunEnded',
	StartGame = 'zkube-StartGame',
	ZoneClearBonus = 'zkube-ZoneClearBonus',
	ConstraintType = 'zkube-ConstraintType',
	GameContext = 'game_components_interfaces-GameContext',
	GameContextDetails = 'game_components_interfaces-GameContextDetails',
	GameDetail = 'game_components_interfaces-GameDetail',
	GameSetting = 'game_components_interfaces-GameSetting',
	GameSettingDetails = 'game_components_interfaces-GameSettingDetails',
	MintGameParams = 'game_components_interfaces-MintGameParams',
	RoleAdminChanged = 'openzeppelin_access-RoleAdminChanged',
	RoleGranted = 'openzeppelin_access-RoleGranted',
	RoleGrantedWithDelay = 'openzeppelin_access-RoleGrantedWithDelay',
	RoleRevoked = 'openzeppelin_access-RoleRevoked',
	GameSettingsCreated = 'zkube-GameSettingsCreated',
	Difficulty = 'zkube-Difficulty',
}
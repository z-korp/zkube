import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

import { CairoCustomEnum, CairoOption, CairoOptionVariant, BigNumberish } from 'starknet';

// Type definition for `tournaments::components::models::game::GameCounter` struct
export interface GameCounter {
	key: BigNumberish;
	count: BigNumberish;
}

// Type definition for `tournaments::components::models::game::GameCounterValue` struct
export interface GameCounterValue {
	count: BigNumberish;
}

// Type definition for `tournaments::components::models::game::GameMetadata` struct
export interface GameMetadata {
	contract_address: string;
	creator_address: string;
	name: BigNumberish;
	description: string;
	developer: BigNumberish;
	publisher: BigNumberish;
	genre: BigNumberish;
	image: string;
}

// Type definition for `tournaments::components::models::game::GameMetadataValue` struct
export interface GameMetadataValue {
	creator_address: string;
	name: BigNumberish;
	description: string;
	developer: BigNumberish;
	publisher: BigNumberish;
	genre: BigNumberish;
	image: string;
}

// Type definition for `tournaments::components::models::game::Score` struct
export interface Score {
	game_id: BigNumberish;
	score: BigNumberish;
}

// Type definition for `tournaments::components::models::game::ScoreValue` struct
export interface ScoreValue {
	score: BigNumberish;
}

// Type definition for `tournaments::components::models::game::Settings` struct
export interface Settings {
	id: BigNumberish;
	name: BigNumberish;
	value: BigNumberish;
}

// Type definition for `tournaments::components::models::game::SettingsCounter` struct
export interface SettingsCounter {
	key: BigNumberish;
	count: BigNumberish;
}

// Type definition for `tournaments::components::models::game::SettingsCounterValue` struct
export interface SettingsCounterValue {
	count: BigNumberish;
}

// Type definition for `tournaments::components::models::game::SettingsDetails` struct
export interface SettingsDetails {
	id: BigNumberish;
	name: BigNumberish;
	description: string;
	exists: boolean;
}

// Type definition for `tournaments::components::models::game::SettingsDetailsValue` struct
export interface SettingsDetailsValue {
	name: BigNumberish;
	description: string;
	exists: boolean;
}

// Type definition for `tournaments::components::models::game::SettingsValue` struct
export interface SettingsValue {
	value: BigNumberish;
}

// Type definition for `tournaments::components::models::game::TokenMetadata` struct
export interface TokenMetadata {
	token_id: BigNumberish;
	minted_by: string;
	player_name: BigNumberish;
	settings_id: BigNumberish;
	lifecycle: Lifecycle;
}

// Type definition for `tournaments::components::models::game::TokenMetadataValue` struct
export interface TokenMetadataValue {
	minted_by: string;
	player_name: BigNumberish;
	settings_id: BigNumberish;
	lifecycle: Lifecycle;
}

// Type definition for `tournaments::components::models::lifecycle::Lifecycle` struct
export interface Lifecycle {
	mint: BigNumberish;
	start: CairoOption<BigNumberish>;
	end: CairoOption<BigNumberish>;
}

// Type definition for `zkube::models::config::GameSettings` struct
export interface GameSettings {
	settings_id: BigNumberish;
	difficulty: DifficultyEnum;
}

// Type definition for `zkube::models::config::GameSettingsMetadata` struct
export interface GameSettingsMetadata {
	settings_id: BigNumberish;
	name: BigNumberish;
	description: string;
	created_by: string;
	created_at: BigNumberish;
}

// Type definition for `zkube::models::config::GameSettingsMetadataValue` struct
export interface GameSettingsMetadataValue {
	name: BigNumberish;
	description: string;
	created_by: string;
	created_at: BigNumberish;
}

// Type definition for `zkube::models::config::GameSettingsValue` struct
export interface GameSettingsValue {
	difficulty: DifficultyEnum;
}

// Type definition for `zkube::models::game::Game` struct
export interface Game {
	game_id: BigNumberish;
	blocks: BigNumberish;
	next_row: BigNumberish;
	score: BigNumberish;
	moves: BigNumberish;
	combo_counter: BigNumberish;
	max_combo: BigNumberish;
	hammer_bonus: BigNumberish;
	wave_bonus: BigNumberish;
	totem_bonus: BigNumberish;
	hammer_used: BigNumberish;
	wave_used: BigNumberish;
	totem_used: BigNumberish;
	over: boolean;
}

// Type definition for `zkube::models::game::GameSeed` struct
export interface GameSeed {
	game_id: BigNumberish;
	seed: BigNumberish;
}

// Type definition for `zkube::models::game::GameSeedValue` struct
export interface GameSeedValue {
	seed: BigNumberish;
}

// Type definition for `zkube::models::game::GameValue` struct
export interface GameValue {
	blocks: BigNumberish;
	next_row: BigNumberish;
	score: BigNumberish;
	moves: BigNumberish;
	combo_counter: BigNumberish;
	max_combo: BigNumberish;
	hammer_bonus: BigNumberish;
	wave_bonus: BigNumberish;
	totem_bonus: BigNumberish;
	hammer_used: BigNumberish;
	wave_used: BigNumberish;
	totem_used: BigNumberish;
	over: boolean;
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

// Type definition for `achievement::events::index::TrophyCreationValue` struct
export interface TrophyCreationValue {
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

// Type definition for `achievement::events::index::TrophyProgressionValue` struct
export interface TrophyProgressionValue {
	count: BigNumberish;
	time: BigNumberish;
}

// Type definition for `achievement::types::index::Task` struct
export interface Task {
	id: BigNumberish;
	total: BigNumberish;
	description: string;
}

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
	tournaments: {
		GameCounter: GameCounter,
		GameCounterValue: GameCounterValue,
		GameMetadata: GameMetadata,
		GameMetadataValue: GameMetadataValue,
		Score: Score,
		ScoreValue: ScoreValue,
		Settings: Settings,
		SettingsCounter: SettingsCounter,
		SettingsCounterValue: SettingsCounterValue,
		SettingsDetails: SettingsDetails,
		SettingsDetailsValue: SettingsDetailsValue,
		SettingsValue: SettingsValue,
		TokenMetadata: TokenMetadata,
		TokenMetadataValue: TokenMetadataValue,
		Lifecycle: Lifecycle,
	},
	zkube: {
		GameSettings: GameSettings,
		GameSettingsMetadata: GameSettingsMetadata,
		GameSettingsMetadataValue: GameSettingsMetadataValue,
		GameSettingsValue: GameSettingsValue,
		Game: Game,
		GameSeed: GameSeed,
		GameSeedValue: GameSeedValue,
		GameValue: GameValue,
	},
	achievement: {
		TrophyCreation: TrophyCreation,
		TrophyCreationValue: TrophyCreationValue,
		TrophyProgression: TrophyProgression,
		TrophyProgressionValue: TrophyProgressionValue,
		Task: Task,
	},
}
export const schema: SchemaType = {
	tournaments: {
		GameCounter: {
			key: 0,
			count: 0,
		},
		GameCounterValue: {
			count: 0,
		},
		GameMetadata: {
			contract_address: "",
			creator_address: "",
			name: 0,
		description: "",
			developer: 0,
			publisher: 0,
			genre: 0,
		image: "",
		},
		GameMetadataValue: {
			creator_address: "",
			name: 0,
		description: "",
			developer: 0,
			publisher: 0,
			genre: 0,
		image: "",
		},
		Score: {
			game_id: 0,
			score: 0,
		},
		ScoreValue: {
			score: 0,
		},
		Settings: {
			id: 0,
			name: 0,
			value: 0,
		},
		SettingsCounter: {
			key: 0,
			count: 0,
		},
		SettingsCounterValue: {
			count: 0,
		},
		SettingsDetails: {
			id: 0,
			name: 0,
		description: "",
			exists: false,
		},
		SettingsDetailsValue: {
			name: 0,
		description: "",
			exists: false,
		},
		SettingsValue: {
			value: 0,
		},
		TokenMetadata: {
			token_id: 0,
			minted_by: "",
			player_name: 0,
			settings_id: 0,
		lifecycle: { mint: 0, start: new CairoOption(CairoOptionVariant.None), end: new CairoOption(CairoOptionVariant.None), },
		},
		TokenMetadataValue: {
			minted_by: "",
			player_name: 0,
			settings_id: 0,
		lifecycle: { mint: 0, start: new CairoOption(CairoOptionVariant.None), end: new CairoOption(CairoOptionVariant.None), },
		},
		Lifecycle: {
			mint: 0,
		start: new CairoOption(CairoOptionVariant.None),
		end: new CairoOption(CairoOptionVariant.None),
		},
		GameSettings: {
			settings_id: 0,
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
		},
		GameSettingsMetadata: {
			settings_id: 0,
			name: 0,
		description: "",
			created_by: "",
			created_at: 0,
		},
		GameSettingsMetadataValue: {
			name: 0,
		description: "",
			created_by: "",
			created_at: 0,
		},
		GameSettingsValue: {
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
		},
		Game: {
			game_id: 0,
			blocks: 0,
			next_row: 0,
			score: 0,
			moves: 0,
			combo_counter: 0,
			max_combo: 0,
			hammer_bonus: 0,
			wave_bonus: 0,
			totem_bonus: 0,
			hammer_used: 0,
			wave_used: 0,
			totem_used: 0,
			over: false,
		},
		GameSeed: {
			game_id: 0,
			seed: 0,
		},
		GameSeedValue: {
			seed: 0,
		},
		GameValue: {
			blocks: 0,
			next_row: 0,
			score: 0,
			moves: 0,
			combo_counter: 0,
			max_combo: 0,
			hammer_bonus: 0,
			wave_bonus: 0,
			totem_bonus: 0,
			hammer_used: 0,
			wave_used: 0,
			totem_used: 0,
			over: false,
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
		TrophyCreationValue: {
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
		TrophyProgressionValue: {
			count: 0,
			time: 0,
		},
		Task: {
			id: 0,
			total: 0,
		description: "",
		},
	},
};
export enum ModelsMapping {
	GameCounter = 'tournaments-GameCounter',
	GameCounterValue = 'tournaments-GameCounterValue',
	GameMetadata = 'tournaments-GameMetadata',
	GameMetadataValue = 'tournaments-GameMetadataValue',
	Score = 'tournaments-Score',
	ScoreValue = 'tournaments-ScoreValue',
	Settings = 'tournaments-Settings',
	SettingsCounter = 'tournaments-SettingsCounter',
	SettingsCounterValue = 'tournaments-SettingsCounterValue',
	SettingsDetails = 'tournaments-SettingsDetails',
	SettingsDetailsValue = 'tournaments-SettingsDetailsValue',
	SettingsValue = 'tournaments-SettingsValue',
	TokenMetadata = 'tournaments-TokenMetadata',
	TokenMetadataValue = 'tournaments-TokenMetadataValue',
	Lifecycle = 'tournaments-Lifecycle',
	GameSettings = 'zkube-GameSettings',
	GameSettingsMetadata = 'zkube-GameSettingsMetadata',
	GameSettingsMetadataValue = 'zkube-GameSettingsMetadataValue',
	GameSettingsValue = 'zkube-GameSettingsValue',
	Game = 'zkube-Game',
	GameSeed = 'zkube-GameSeed',
	GameSeedValue = 'zkube-GameSeedValue',
	GameValue = 'zkube-GameValue',
	Difficulty = 'zkube-Difficulty',
	TrophyCreation = 'achievement-TrophyCreation',
	TrophyCreationValue = 'achievement-TrophyCreationValue',
	TrophyProgression = 'achievement-TrophyProgression',
	TrophyProgressionValue = 'achievement-TrophyProgressionValue',
	Task = 'achievement-Task',
}
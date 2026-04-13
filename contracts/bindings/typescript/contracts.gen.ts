import { DojoProvider, DojoCall } from "@dojoengine/core";
import { Account, AccountInterface, BigNumberish, CairoOption, CairoCustomEnum } from "starknet";
import * as models from "./models.gen";

export function setupWorld(provider: DojoProvider) {

	const build_config_system_addCustomGameSettings_calldata = (name: BigNumberish, description: string, difficulty: CairoCustomEnum, baseMoves: BigNumberish, maxMoves: BigNumberish, baseRatioX100: BigNumberish, maxRatioX100: BigNumberish, tier1Threshold: BigNumberish, tier2Threshold: BigNumberish, tier3Threshold: BigNumberish, tier4Threshold: BigNumberish, tier5Threshold: BigNumberish, tier6Threshold: BigNumberish, tier7Threshold: BigNumberish, constraintsEnabled: BigNumberish, constraintStartLevel: BigNumberish, constraintLinesBudgets: BigNumberish, veryeasySize1Weight: BigNumberish, veryeasySize2Weight: BigNumberish, veryeasySize3Weight: BigNumberish, veryeasySize4Weight: BigNumberish, veryeasySize5Weight: BigNumberish, masterSize1Weight: BigNumberish, masterSize2Weight: BigNumberish, masterSize3Weight: BigNumberish, masterSize4Weight: BigNumberish, masterSize5Weight: BigNumberish, earlyVariancePercent: BigNumberish, midVariancePercent: BigNumberish, lateVariancePercent: BigNumberish, earlyLevelThreshold: BigNumberish, midLevelThreshold: BigNumberish, levelCap: BigNumberish, zoneId: BigNumberish, activeMutatorId: BigNumberish, passiveMutatorId: BigNumberish, bossId: BigNumberish, isTournament: boolean): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "add_custom_game_settings",
			calldata: [name, description, difficulty, baseMoves, maxMoves, baseRatioX100, maxRatioX100, tier1Threshold, tier2Threshold, tier3Threshold, tier4Threshold, tier5Threshold, tier6Threshold, tier7Threshold, constraintsEnabled, constraintStartLevel, constraintLinesBudgets, veryeasySize1Weight, veryeasySize2Weight, veryeasySize3Weight, veryeasySize4Weight, veryeasySize5Weight, masterSize1Weight, masterSize2Weight, masterSize3Weight, masterSize4Weight, masterSize5Weight, earlyVariancePercent, midVariancePercent, lateVariancePercent, earlyLevelThreshold, midLevelThreshold, levelCap, zoneId, activeMutatorId, passiveMutatorId, bossId, isTournament],
		};
	};

	const config_system_addCustomGameSettings = async (snAccount: Account | AccountInterface, name: BigNumberish, description: string, difficulty: CairoCustomEnum, baseMoves: BigNumberish, maxMoves: BigNumberish, baseRatioX100: BigNumberish, maxRatioX100: BigNumberish, tier1Threshold: BigNumberish, tier2Threshold: BigNumberish, tier3Threshold: BigNumberish, tier4Threshold: BigNumberish, tier5Threshold: BigNumberish, tier6Threshold: BigNumberish, tier7Threshold: BigNumberish, constraintsEnabled: BigNumberish, constraintStartLevel: BigNumberish, constraintLinesBudgets: BigNumberish, veryeasySize1Weight: BigNumberish, veryeasySize2Weight: BigNumberish, veryeasySize3Weight: BigNumberish, veryeasySize4Weight: BigNumberish, veryeasySize5Weight: BigNumberish, masterSize1Weight: BigNumberish, masterSize2Weight: BigNumberish, masterSize3Weight: BigNumberish, masterSize4Weight: BigNumberish, masterSize5Weight: BigNumberish, earlyVariancePercent: BigNumberish, midVariancePercent: BigNumberish, lateVariancePercent: BigNumberish, earlyLevelThreshold: BigNumberish, midLevelThreshold: BigNumberish, levelCap: BigNumberish, zoneId: BigNumberish, activeMutatorId: BigNumberish, passiveMutatorId: BigNumberish, bossId: BigNumberish, isTournament: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				build_config_system_addCustomGameSettings_calldata(name, description, difficulty, baseMoves, maxMoves, baseRatioX100, maxRatioX100, tier1Threshold, tier2Threshold, tier3Threshold, tier4Threshold, tier5Threshold, tier6Threshold, tier7Threshold, constraintsEnabled, constraintStartLevel, constraintLinesBudgets, veryeasySize1Weight, veryeasySize2Weight, veryeasySize3Weight, veryeasySize4Weight, veryeasySize5Weight, masterSize1Weight, masterSize2Weight, masterSize3Weight, masterSize4Weight, masterSize5Weight, earlyVariancePercent, midVariancePercent, lateVariancePercent, earlyLevelThreshold, midLevelThreshold, levelCap, zoneId, activeMutatorId, passiveMutatorId, bossId, isTournament),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_config_system_getGameSettings_calldata = (settingsId: BigNumberish): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "get_game_settings",
			calldata: [settingsId],
		};
	};

	const config_system_getGameSettings = async (settingsId: BigNumberish) => {
		try {
			return await provider.call("zkube_v2_1_0", build_config_system_getGameSettings_calldata(settingsId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_config_system_getGameSettingsMetadata_calldata = (settingsId: BigNumberish): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "get_game_settings_metadata",
			calldata: [settingsId],
		};
	};

	const config_system_getGameSettingsMetadata = async (settingsId: BigNumberish) => {
		try {
			return await provider.call("zkube_v2_1_0", build_config_system_getGameSettingsMetadata_calldata(settingsId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_config_system_getRoleAdmin_calldata = (role: BigNumberish): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "get_role_admin",
			calldata: [role],
		};
	};

	const config_system_getRoleAdmin = async (role: BigNumberish) => {
		try {
			return await provider.call("zkube_v2_1_0", build_config_system_getRoleAdmin_calldata(role));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_config_system_getTreasury_calldata = (): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "get_treasury",
			calldata: [],
		};
	};

	const config_system_getTreasury = async () => {
		try {
			return await provider.call("zkube_v2_1_0", build_config_system_getTreasury_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_config_system_getZstarAddress_calldata = (): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "get_zstar_address",
			calldata: [],
		};
	};

	const config_system_getZstarAddress = async () => {
		try {
			return await provider.call("zkube_v2_1_0", build_config_system_getZstarAddress_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_config_system_grantRole_calldata = (role: BigNumberish, account: string): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "grant_role",
			calldata: [role, account],
		};
	};

	const config_system_grantRole = async (snAccount: Account | AccountInterface, role: BigNumberish, account: string) => {
		try {
			return await provider.execute(
				snAccount,
				build_config_system_grantRole_calldata(role, account),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_config_system_hasRole_calldata = (role: BigNumberish, account: string): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "has_role",
			calldata: [role, account],
		};
	};

	const config_system_hasRole = async (role: BigNumberish, account: string) => {
		try {
			return await provider.call("zkube_v2_1_0", build_config_system_hasRole_calldata(role, account));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_config_system_hasZoneAccess_calldata = (player: string, settingsId: BigNumberish): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "has_zone_access",
			calldata: [player, settingsId],
		};
	};

	const config_system_hasZoneAccess = async (player: string, settingsId: BigNumberish) => {
		try {
			return await provider.call("zkube_v2_1_0", build_config_system_hasZoneAccess_calldata(player, settingsId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_config_system_isStarEligible_calldata = (settingsId: BigNumberish): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "is_star_eligible",
			calldata: [settingsId],
		};
	};

	const config_system_isStarEligible = async (settingsId: BigNumberish) => {
		try {
			return await provider.call("zkube_v2_1_0", build_config_system_isStarEligible_calldata(settingsId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_config_system_purchaseZoneAccess_calldata = (settingsId: BigNumberish): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "purchase_zone_access",
			calldata: [settingsId],
		};
	};

	const config_system_purchaseZoneAccess = async (snAccount: Account | AccountInterface, settingsId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_config_system_purchaseZoneAccess_calldata(settingsId),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_config_system_renounceRole_calldata = (role: BigNumberish, account: string): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "renounce_role",
			calldata: [role, account],
		};
	};

	const config_system_renounceRole = async (snAccount: Account | AccountInterface, role: BigNumberish, account: string) => {
		try {
			return await provider.execute(
				snAccount,
				build_config_system_renounceRole_calldata(role, account),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_config_system_revokeRole_calldata = (role: BigNumberish, account: string): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "revoke_role",
			calldata: [role, account],
		};
	};

	const config_system_revokeRole = async (snAccount: Account | AccountInterface, role: BigNumberish, account: string) => {
		try {
			return await provider.execute(
				snAccount,
				build_config_system_revokeRole_calldata(role, account),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_config_system_setStarEligible_calldata = (settingsId: BigNumberish, eligible: boolean): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "set_star_eligible",
			calldata: [settingsId, eligible],
		};
	};

	const config_system_setStarEligible = async (snAccount: Account | AccountInterface, settingsId: BigNumberish, eligible: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				build_config_system_setStarEligible_calldata(settingsId, eligible),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_config_system_setTreasury_calldata = (treasury: string): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "set_treasury",
			calldata: [treasury],
		};
	};

	const config_system_setTreasury = async (snAccount: Account | AccountInterface, treasury: string) => {
		try {
			return await provider.execute(
				snAccount,
				build_config_system_setTreasury_calldata(treasury),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_config_system_setZoneEnabled_calldata = (settingsId: BigNumberish, enabled: boolean): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "set_zone_enabled",
			calldata: [settingsId, enabled],
		};
	};

	const config_system_setZoneEnabled = async (snAccount: Account | AccountInterface, settingsId: BigNumberish, enabled: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				build_config_system_setZoneEnabled_calldata(settingsId, enabled),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_config_system_setZonePricing_calldata = (settingsId: BigNumberish, isFree: boolean, price: BigNumberish, paymentToken: string, starCost: BigNumberish): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "set_zone_pricing",
			calldata: [settingsId, isFree, price, paymentToken, starCost],
		};
	};

	const config_system_setZonePricing = async (snAccount: Account | AccountInterface, settingsId: BigNumberish, isFree: boolean, price: BigNumberish, paymentToken: string, starCost: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_config_system_setZonePricing_calldata(settingsId, isFree, price, paymentToken, starCost),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_config_system_setZoneTheme_calldata = (settingsId: BigNumberish, themeId: BigNumberish): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "set_zone_theme",
			calldata: [settingsId, themeId],
		};
	};

	const config_system_setZoneTheme = async (snAccount: Account | AccountInterface, settingsId: BigNumberish, themeId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_config_system_setZoneTheme_calldata(settingsId, themeId),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_config_system_setZstarAddress_calldata = (token: string): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "set_zstar_address",
			calldata: [token],
		};
	};

	const config_system_setZstarAddress = async (snAccount: Account | AccountInterface, token: string) => {
		try {
			return await provider.execute(
				snAccount,
				build_config_system_setZstarAddress_calldata(token),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_config_system_settingsCount_calldata = (): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "settings_count",
			calldata: [],
		};
	};

	const config_system_settingsCount = async () => {
		try {
			return await provider.call("zkube_v2_1_0", build_config_system_settingsCount_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_config_system_settingsDetails_calldata = (settingsId: BigNumberish): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "settings_details",
			calldata: [settingsId],
		};
	};

	const config_system_settingsDetails = async (settingsId: BigNumberish) => {
		try {
			return await provider.call("zkube_v2_1_0", build_config_system_settingsDetails_calldata(settingsId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_config_system_settingsDetailsBatch_calldata = (settingsIds: Array<BigNumberish>): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "settings_details_batch",
			calldata: [settingsIds],
		};
	};

	const config_system_settingsDetailsBatch = async (settingsIds: Array<BigNumberish>) => {
		try {
			return await provider.call("zkube_v2_1_0", build_config_system_settingsDetailsBatch_calldata(settingsIds));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_config_system_settingsExist_calldata = (settingsId: BigNumberish): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "settings_exist",
			calldata: [settingsId],
		};
	};

	const config_system_settingsExist = async (settingsId: BigNumberish) => {
		try {
			return await provider.call("zkube_v2_1_0", build_config_system_settingsExist_calldata(settingsId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_config_system_settingsExistBatch_calldata = (settingsIds: Array<BigNumberish>): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "settings_exist_batch",
			calldata: [settingsIds],
		};
	};

	const config_system_settingsExistBatch = async (settingsIds: Array<BigNumberish>) => {
		try {
			return await provider.call("zkube_v2_1_0", build_config_system_settingsExistBatch_calldata(settingsIds));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_config_system_settingsExists_calldata = (settingsId: BigNumberish): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "settings_exists",
			calldata: [settingsId],
		};
	};

	const config_system_settingsExists = async (settingsId: BigNumberish) => {
		try {
			return await provider.call("zkube_v2_1_0", build_config_system_settingsExists_calldata(settingsId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_config_system_supportsInterface_calldata = (interfaceId: BigNumberish): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "supports_interface",
			calldata: [interfaceId],
		};
	};

	const config_system_supportsInterface = async (interfaceId: BigNumberish) => {
		try {
			return await provider.call("zkube_v2_1_0", build_config_system_supportsInterface_calldata(interfaceId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_config_system_unlockZoneWithStars_calldata = (settingsId: BigNumberish): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "unlock_zone_with_stars",
			calldata: [settingsId],
		};
	};

	const config_system_unlockZoneWithStars = async (snAccount: Account | AccountInterface, settingsId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_config_system_unlockZoneWithStars_calldata(settingsId),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_daily_challenge_system_getCurrentChallenge_calldata = (): DojoCall => {
		return {
			contractName: "daily_challenge_system",
			entrypoint: "get_current_challenge",
			calldata: [],
		};
	};

	const daily_challenge_system_getCurrentChallenge = async () => {
		try {
			return await provider.call("zkube_v2_1_0", build_daily_challenge_system_getCurrentChallenge_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_daily_challenge_system_getPlayerEntry_calldata = (challengeId: BigNumberish, player: string): DojoCall => {
		return {
			contractName: "daily_challenge_system",
			entrypoint: "get_player_entry",
			calldata: [challengeId, player],
		};
	};

	const daily_challenge_system_getPlayerEntry = async (challengeId: BigNumberish, player: string) => {
		try {
			return await provider.call("zkube_v2_1_0", build_daily_challenge_system_getPlayerEntry_calldata(challengeId, player));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_daily_challenge_system_replayDailyLevel_calldata = (level: BigNumberish): DojoCall => {
		return {
			contractName: "daily_challenge_system",
			entrypoint: "replay_daily_level",
			calldata: [level],
		};
	};

	const daily_challenge_system_replayDailyLevel = async (snAccount: Account | AccountInterface, level: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_daily_challenge_system_replayDailyLevel_calldata(level),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_daily_challenge_system_settleChallenge_calldata = (challengeId: BigNumberish, rankedPlayers: Array<string>): DojoCall => {
		return {
			contractName: "daily_challenge_system",
			entrypoint: "settle_challenge",
			calldata: [challengeId, rankedPlayers],
		};
	};

	const daily_challenge_system_settleChallenge = async (snAccount: Account | AccountInterface, challengeId: BigNumberish, rankedPlayers: Array<string>) => {
		try {
			return await provider.execute(
				snAccount,
				build_daily_challenge_system_settleChallenge_calldata(challengeId, rankedPlayers),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_daily_challenge_system_settleWeeklyEndless_calldata = (weekId: BigNumberish, settingsId: BigNumberish, rankedPlayers: Array<string>): DojoCall => {
		return {
			contractName: "daily_challenge_system",
			entrypoint: "settle_weekly_endless",
			calldata: [weekId, settingsId, rankedPlayers],
		};
	};

	const daily_challenge_system_settleWeeklyEndless = async (snAccount: Account | AccountInterface, weekId: BigNumberish, settingsId: BigNumberish, rankedPlayers: Array<string>) => {
		try {
			return await provider.execute(
				snAccount,
				build_daily_challenge_system_settleWeeklyEndless_calldata(weekId, settingsId, rankedPlayers),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_daily_challenge_system_startDailyGame_calldata = (): DojoCall => {
		return {
			contractName: "daily_challenge_system",
			entrypoint: "start_daily_game",
			calldata: [],
		};
	};

	const daily_challenge_system_startDailyGame = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_daily_challenge_system_startDailyGame_calldata(),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_applyBonus_calldata = (gameId: BigNumberish, rowIndex: BigNumberish, blockIndex: BigNumberish): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "apply_bonus",
			calldata: [gameId, rowIndex, blockIndex],
		};
	};

	const game_system_applyBonus = async (snAccount: Account | AccountInterface, gameId: BigNumberish, rowIndex: BigNumberish, blockIndex: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_system_applyBonus_calldata(gameId, rowIndex, blockIndex),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_create_calldata = (gameId: BigNumberish, runType: BigNumberish): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "create",
			calldata: [gameId, runType],
		};
	};

	const game_system_create = async (snAccount: Account | AccountInterface, gameId: BigNumberish, runType: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_system_create_calldata(gameId, runType),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_createRun_calldata = (gameId: BigNumberish, runType: BigNumberish): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "create_run",
			calldata: [gameId, runType],
		};
	};

	const game_system_createRun = async (snAccount: Account | AccountInterface, gameId: BigNumberish, runType: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_system_createRun_calldata(gameId, runType),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_gameOver_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "game_over",
			calldata: [tokenId],
		};
	};

	const game_system_gameOver = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("zkube_v2_1_0", build_game_system_gameOver_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_gameOverBatch_calldata = (tokenIds: Array<BigNumberish>): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "game_over_batch",
			calldata: [tokenIds],
		};
	};

	const game_system_gameOverBatch = async (tokenIds: Array<BigNumberish>) => {
		try {
			return await provider.call("zkube_v2_1_0", build_game_system_gameOverBatch_calldata(tokenIds));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_getGameData_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "get_game_data",
			calldata: [gameId],
		};
	};

	const game_system_getGameData = async (gameId: BigNumberish) => {
		try {
			return await provider.call("zkube_v2_1_0", build_game_system_getGameData_calldata(gameId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_getGrid_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "get_grid",
			calldata: [gameId],
		};
	};

	const game_system_getGrid = async (gameId: BigNumberish) => {
		try {
			return await provider.call("zkube_v2_1_0", build_game_system_getGrid_calldata(gameId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_getPlayerName_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "get_player_name",
			calldata: [gameId],
		};
	};

	const game_system_getPlayerName = async (gameId: BigNumberish) => {
		try {
			return await provider.call("zkube_v2_1_0", build_game_system_getPlayerName_calldata(gameId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_getScore_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "get_score",
			calldata: [gameId],
		};
	};

	const game_system_getScore = async (gameId: BigNumberish) => {
		try {
			return await provider.call("zkube_v2_1_0", build_game_system_getScore_calldata(gameId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_mintGame_calldata = (playerName: CairoOption<BigNumberish>, settingsId: CairoOption<BigNumberish>, start: CairoOption<BigNumberish>, end: CairoOption<BigNumberish>, objectiveId: CairoOption<BigNumberish>, context: CairoOption<GameContextDetails>, clientUrl: CairoOption<string>, rendererAddress: CairoOption<string>, skillsAddress: CairoOption<string>, to: string, soulbound: boolean, paymaster: boolean, salt: BigNumberish, metadata: BigNumberish): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "mint_game",
			calldata: [playerName, settingsId, start, end, objectiveId, context, clientUrl, rendererAddress, skillsAddress, to, soulbound, paymaster, salt, metadata],
		};
	};

	const game_system_mintGame = async (playerName: CairoOption<BigNumberish>, settingsId: CairoOption<BigNumberish>, start: CairoOption<BigNumberish>, end: CairoOption<BigNumberish>, objectiveId: CairoOption<BigNumberish>, context: CairoOption<GameContextDetails>, clientUrl: CairoOption<string>, rendererAddress: CairoOption<string>, skillsAddress: CairoOption<string>, to: string, soulbound: boolean, paymaster: boolean, salt: BigNumberish, metadata: BigNumberish) => {
		try {
			return await provider.call("zkube_v2_1_0", build_game_system_mintGame_calldata(playerName, settingsId, start, end, objectiveId, context, clientUrl, rendererAddress, skillsAddress, to, soulbound, paymaster, salt, metadata));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_mintGameBatch_calldata = (mints: Array<MintGameParams>): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "mint_game_batch",
			calldata: [mints],
		};
	};

	const game_system_mintGameBatch = async (mints: Array<MintGameParams>) => {
		try {
			return await provider.call("zkube_v2_1_0", build_game_system_mintGameBatch_calldata(mints));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_objectivesAddress_calldata = (): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "objectives_address",
			calldata: [],
		};
	};

	const game_system_objectivesAddress = async () => {
		try {
			return await provider.call("zkube_v2_1_0", build_game_system_objectivesAddress_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_score_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "score",
			calldata: [tokenId],
		};
	};

	const game_system_score = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("zkube_v2_1_0", build_game_system_score_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_scoreBatch_calldata = (tokenIds: Array<BigNumberish>): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "score_batch",
			calldata: [tokenIds],
		};
	};

	const game_system_scoreBatch = async (tokenIds: Array<BigNumberish>) => {
		try {
			return await provider.call("zkube_v2_1_0", build_game_system_scoreBatch_calldata(tokenIds));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_settingsAddress_calldata = (): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "settings_address",
			calldata: [],
		};
	};

	const game_system_settingsAddress = async () => {
		try {
			return await provider.call("zkube_v2_1_0", build_game_system_settingsAddress_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_supportsInterface_calldata = (interfaceId: BigNumberish): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "supports_interface",
			calldata: [interfaceId],
		};
	};

	const game_system_supportsInterface = async (interfaceId: BigNumberish) => {
		try {
			return await provider.call("zkube_v2_1_0", build_game_system_supportsInterface_calldata(interfaceId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_surrender_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "surrender",
			calldata: [gameId],
		};
	};

	const game_system_surrender = async (snAccount: Account | AccountInterface, gameId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_system_surrender_calldata(gameId),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_tokenAddress_calldata = (): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "token_address",
			calldata: [],
		};
	};

	const game_system_tokenAddress = async () => {
		try {
			return await provider.call("zkube_v2_1_0", build_game_system_tokenAddress_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_grid_system_initializeGrid_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "grid_system",
			entrypoint: "initialize_grid",
			calldata: [gameId],
		};
	};

	const grid_system_initializeGrid = async (snAccount: Account | AccountInterface, gameId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_grid_system_initializeGrid_calldata(gameId),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_grid_system_insertLineIfEmpty_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "grid_system",
			entrypoint: "insert_line_if_empty",
			calldata: [gameId],
		};
	};

	const grid_system_insertLineIfEmpty = async (snAccount: Account | AccountInterface, gameId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_grid_system_insertLineIfEmpty_calldata(gameId),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_grid_system_resetGridForLevel_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "grid_system",
			entrypoint: "reset_grid_for_level",
			calldata: [gameId],
		};
	};

	const grid_system_resetGridForLevel = async (snAccount: Account | AccountInterface, gameId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_grid_system_resetGridForLevel_calldata(gameId),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_level_system_finalizeLevel_calldata = (gameId: BigNumberish, player: string): DojoCall => {
		return {
			contractName: "level_system",
			entrypoint: "finalize_level",
			calldata: [gameId, player],
		};
	};

	const level_system_finalizeLevel = async (snAccount: Account | AccountInterface, gameId: BigNumberish, player: string) => {
		try {
			return await provider.execute(
				snAccount,
				build_level_system_finalizeLevel_calldata(gameId, player),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_level_system_initializeEndlessLevel_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "level_system",
			entrypoint: "initialize_endless_level",
			calldata: [gameId],
		};
	};

	const level_system_initializeEndlessLevel = async (snAccount: Account | AccountInterface, gameId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_level_system_initializeEndlessLevel_calldata(gameId),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_level_system_initializeLevel_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "level_system",
			entrypoint: "initialize_level",
			calldata: [gameId],
		};
	};

	const level_system_initializeLevel = async (snAccount: Account | AccountInterface, gameId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_level_system_initializeLevel_calldata(gameId),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_level_system_insertLineIfEmpty_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "level_system",
			entrypoint: "insert_line_if_empty",
			calldata: [gameId],
		};
	};

	const level_system_insertLineIfEmpty = async (snAccount: Account | AccountInterface, gameId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_level_system_insertLineIfEmpty_calldata(gameId),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_level_system_startNextLevel_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "level_system",
			entrypoint: "start_next_level",
			calldata: [gameId],
		};
	};

	const level_system_startNextLevel = async (snAccount: Account | AccountInterface, gameId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_level_system_startNextLevel_calldata(gameId),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_move_system_move_calldata = (gameId: BigNumberish, rowIndex: BigNumberish, startIndex: BigNumberish, finalIndex: BigNumberish): DojoCall => {
		return {
			contractName: "move_system",
			entrypoint: "move",
			calldata: [gameId, rowIndex, startIndex, finalIndex],
		};
	};

	const move_system_move = async (snAccount: Account | AccountInterface, gameId: BigNumberish, rowIndex: BigNumberish, startIndex: BigNumberish, finalIndex: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_move_system_move_calldata(gameId, rowIndex, startIndex, finalIndex),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_progress_system_emitProgress_calldata = (player: string, taskId: BigNumberish, count: BigNumberish, settingsId: BigNumberish): DojoCall => {
		return {
			contractName: "progress_system",
			entrypoint: "emit_progress",
			calldata: [player, taskId, count, settingsId],
		};
	};

	const progress_system_emitProgress = async (snAccount: Account | AccountInterface, player: string, taskId: BigNumberish, count: BigNumberish, settingsId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_progress_system_emitProgress_calldata(player, taskId, count, settingsId),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_progress_system_emitProgressBulk_calldata = (player: string, tasks: Array<[BigNumberish, BigNumberish]>, settingsId: BigNumberish): DojoCall => {
		return {
			contractName: "progress_system",
			entrypoint: "emit_progress_bulk",
			calldata: [player, tasks, settingsId],
		};
	};

	const progress_system_emitProgressBulk = async (snAccount: Account | AccountInterface, player: string, tasks: Array<[BigNumberish, BigNumberish]>, settingsId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_progress_system_emitProgressBulk_calldata(player, tasks, settingsId),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_progress_system_progress_calldata = (playerId: BigNumberish, taskId: BigNumberish, count: BigNumberish): DojoCall => {
		return {
			contractName: "progress_system",
			entrypoint: "progress",
			calldata: [playerId, taskId, count],
		};
	};

	const progress_system_progress = async (snAccount: Account | AccountInterface, playerId: BigNumberish, taskId: BigNumberish, count: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_progress_system_progress_calldata(playerId, taskId, count),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_progress_system_questClaim_calldata = (player: string, questId: BigNumberish, intervalId: BigNumberish): DojoCall => {
		return {
			contractName: "progress_system",
			entrypoint: "quest_claim",
			calldata: [player, questId, intervalId],
		};
	};

	const progress_system_questClaim = async (snAccount: Account | AccountInterface, player: string, questId: BigNumberish, intervalId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_progress_system_questClaim_calldata(player, questId, intervalId),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_progress_system_supportsInterface_calldata = (interfaceId: BigNumberish): DojoCall => {
		return {
			contractName: "progress_system",
			entrypoint: "supports_interface",
			calldata: [interfaceId],
		};
	};

	const progress_system_supportsInterface = async (interfaceId: BigNumberish) => {
		try {
			return await provider.call("zkube_v2_1_0", build_progress_system_supportsInterface_calldata(interfaceId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_renderer_systems_createMetadata_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "renderer_systems",
			entrypoint: "create_metadata",
			calldata: [gameId],
		};
	};

	const renderer_systems_createMetadata = async (gameId: BigNumberish) => {
		try {
			return await provider.call("zkube_v2_1_0", build_renderer_systems_createMetadata_calldata(gameId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_renderer_systems_gameDetails_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "renderer_systems",
			entrypoint: "game_details",
			calldata: [tokenId],
		};
	};

	const renderer_systems_gameDetails = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("zkube_v2_1_0", build_renderer_systems_gameDetails_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_renderer_systems_gameDetailsBatch_calldata = (tokenIds: Array<BigNumberish>): DojoCall => {
		return {
			contractName: "renderer_systems",
			entrypoint: "game_details_batch",
			calldata: [tokenIds],
		};
	};

	const renderer_systems_gameDetailsBatch = async (tokenIds: Array<BigNumberish>) => {
		try {
			return await provider.call("zkube_v2_1_0", build_renderer_systems_gameDetailsBatch_calldata(tokenIds));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_renderer_systems_gameDetailsSvg_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "renderer_systems",
			entrypoint: "game_details_svg",
			calldata: [tokenId],
		};
	};

	const renderer_systems_gameDetailsSvg = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("zkube_v2_1_0", build_renderer_systems_gameDetailsSvg_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_renderer_systems_generateDetails_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "renderer_systems",
			entrypoint: "generate_details",
			calldata: [gameId],
		};
	};

	const renderer_systems_generateDetails = async (gameId: BigNumberish) => {
		try {
			return await provider.call("zkube_v2_1_0", build_renderer_systems_generateDetails_calldata(gameId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_renderer_systems_generateSvg_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "renderer_systems",
			entrypoint: "generate_svg",
			calldata: [gameId],
		};
	};

	const renderer_systems_generateSvg = async (gameId: BigNumberish) => {
		try {
			return await provider.call("zkube_v2_1_0", build_renderer_systems_generateSvg_calldata(gameId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_renderer_systems_tokenDescription_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "renderer_systems",
			entrypoint: "token_description",
			calldata: [tokenId],
		};
	};

	const renderer_systems_tokenDescription = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("zkube_v2_1_0", build_renderer_systems_tokenDescription_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_renderer_systems_tokenDescriptionBatch_calldata = (tokenIds: Array<BigNumberish>): DojoCall => {
		return {
			contractName: "renderer_systems",
			entrypoint: "token_description_batch",
			calldata: [tokenIds],
		};
	};

	const renderer_systems_tokenDescriptionBatch = async (tokenIds: Array<BigNumberish>) => {
		try {
			return await provider.call("zkube_v2_1_0", build_renderer_systems_tokenDescriptionBatch_calldata(tokenIds));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_renderer_systems_tokenName_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "renderer_systems",
			entrypoint: "token_name",
			calldata: [tokenId],
		};
	};

	const renderer_systems_tokenName = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("zkube_v2_1_0", build_renderer_systems_tokenName_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_renderer_systems_tokenNameBatch_calldata = (tokenIds: Array<BigNumberish>): DojoCall => {
		return {
			contractName: "renderer_systems",
			entrypoint: "token_name_batch",
			calldata: [tokenIds],
		};
	};

	const renderer_systems_tokenNameBatch = async (tokenIds: Array<BigNumberish>) => {
		try {
			return await provider.call("zkube_v2_1_0", build_renderer_systems_tokenNameBatch_calldata(tokenIds));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_story_system_claimZonePerfection_calldata = (zoneId: BigNumberish): DojoCall => {
		return {
			contractName: "story_system",
			entrypoint: "claim_zone_perfection",
			calldata: [zoneId],
		};
	};

	const story_system_claimZonePerfection = async (snAccount: Account | AccountInterface, zoneId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_story_system_claimZonePerfection_calldata(zoneId),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_story_system_replayStoryLevel_calldata = (zoneId: BigNumberish, level: BigNumberish): DojoCall => {
		return {
			contractName: "story_system",
			entrypoint: "replay_story_level",
			calldata: [zoneId, level],
		};
	};

	const story_system_replayStoryLevel = async (snAccount: Account | AccountInterface, zoneId: BigNumberish, level: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_story_system_replayStoryLevel_calldata(zoneId, level),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_story_system_startStoryAttempt_calldata = (zoneId: BigNumberish): DojoCall => {
		return {
			contractName: "story_system",
			entrypoint: "start_story_attempt",
			calldata: [zoneId],
		};
	};

	const story_system_startStoryAttempt = async (snAccount: Account | AccountInterface, zoneId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_story_system_startStoryAttempt_calldata(zoneId),
				"zkube_v2_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};



	return {
		config_system: {
			addCustomGameSettings: config_system_addCustomGameSettings,
			buildAddCustomGameSettingsCalldata: build_config_system_addCustomGameSettings_calldata,
			getGameSettings: config_system_getGameSettings,
			buildGetGameSettingsCalldata: build_config_system_getGameSettings_calldata,
			getGameSettingsMetadata: config_system_getGameSettingsMetadata,
			buildGetGameSettingsMetadataCalldata: build_config_system_getGameSettingsMetadata_calldata,
			getRoleAdmin: config_system_getRoleAdmin,
			buildGetRoleAdminCalldata: build_config_system_getRoleAdmin_calldata,
			getTreasury: config_system_getTreasury,
			buildGetTreasuryCalldata: build_config_system_getTreasury_calldata,
			getZstarAddress: config_system_getZstarAddress,
			buildGetZstarAddressCalldata: build_config_system_getZstarAddress_calldata,
			grantRole: config_system_grantRole,
			buildGrantRoleCalldata: build_config_system_grantRole_calldata,
			hasRole: config_system_hasRole,
			buildHasRoleCalldata: build_config_system_hasRole_calldata,
			hasZoneAccess: config_system_hasZoneAccess,
			buildHasZoneAccessCalldata: build_config_system_hasZoneAccess_calldata,
			isStarEligible: config_system_isStarEligible,
			buildIsStarEligibleCalldata: build_config_system_isStarEligible_calldata,
			purchaseZoneAccess: config_system_purchaseZoneAccess,
			buildPurchaseZoneAccessCalldata: build_config_system_purchaseZoneAccess_calldata,
			renounceRole: config_system_renounceRole,
			buildRenounceRoleCalldata: build_config_system_renounceRole_calldata,
			revokeRole: config_system_revokeRole,
			buildRevokeRoleCalldata: build_config_system_revokeRole_calldata,
			setStarEligible: config_system_setStarEligible,
			buildSetStarEligibleCalldata: build_config_system_setStarEligible_calldata,
			setTreasury: config_system_setTreasury,
			buildSetTreasuryCalldata: build_config_system_setTreasury_calldata,
			setZoneEnabled: config_system_setZoneEnabled,
			buildSetZoneEnabledCalldata: build_config_system_setZoneEnabled_calldata,
			setZonePricing: config_system_setZonePricing,
			buildSetZonePricingCalldata: build_config_system_setZonePricing_calldata,
			setZoneTheme: config_system_setZoneTheme,
			buildSetZoneThemeCalldata: build_config_system_setZoneTheme_calldata,
			setZstarAddress: config_system_setZstarAddress,
			buildSetZstarAddressCalldata: build_config_system_setZstarAddress_calldata,
			settingsCount: config_system_settingsCount,
			buildSettingsCountCalldata: build_config_system_settingsCount_calldata,
			settingsDetails: config_system_settingsDetails,
			buildSettingsDetailsCalldata: build_config_system_settingsDetails_calldata,
			settingsDetailsBatch: config_system_settingsDetailsBatch,
			buildSettingsDetailsBatchCalldata: build_config_system_settingsDetailsBatch_calldata,
			settingsExist: config_system_settingsExist,
			buildSettingsExistCalldata: build_config_system_settingsExist_calldata,
			settingsExistBatch: config_system_settingsExistBatch,
			buildSettingsExistBatchCalldata: build_config_system_settingsExistBatch_calldata,
			settingsExists: config_system_settingsExists,
			buildSettingsExistsCalldata: build_config_system_settingsExists_calldata,
			supportsInterface: config_system_supportsInterface,
			buildSupportsInterfaceCalldata: build_config_system_supportsInterface_calldata,
			unlockZoneWithStars: config_system_unlockZoneWithStars,
			buildUnlockZoneWithStarsCalldata: build_config_system_unlockZoneWithStars_calldata,
		},
		daily_challenge_system: {
			getCurrentChallenge: daily_challenge_system_getCurrentChallenge,
			buildGetCurrentChallengeCalldata: build_daily_challenge_system_getCurrentChallenge_calldata,
			getPlayerEntry: daily_challenge_system_getPlayerEntry,
			buildGetPlayerEntryCalldata: build_daily_challenge_system_getPlayerEntry_calldata,
			replayDailyLevel: daily_challenge_system_replayDailyLevel,
			buildReplayDailyLevelCalldata: build_daily_challenge_system_replayDailyLevel_calldata,
			settleChallenge: daily_challenge_system_settleChallenge,
			buildSettleChallengeCalldata: build_daily_challenge_system_settleChallenge_calldata,
			settleWeeklyEndless: daily_challenge_system_settleWeeklyEndless,
			buildSettleWeeklyEndlessCalldata: build_daily_challenge_system_settleWeeklyEndless_calldata,
			startDailyGame: daily_challenge_system_startDailyGame,
			buildStartDailyGameCalldata: build_daily_challenge_system_startDailyGame_calldata,
		},
		game_system: {
			applyBonus: game_system_applyBonus,
			buildApplyBonusCalldata: build_game_system_applyBonus_calldata,
			create: game_system_create,
			buildCreateCalldata: build_game_system_create_calldata,
			createRun: game_system_createRun,
			buildCreateRunCalldata: build_game_system_createRun_calldata,
			gameOver: game_system_gameOver,
			buildGameOverCalldata: build_game_system_gameOver_calldata,
			gameOverBatch: game_system_gameOverBatch,
			buildGameOverBatchCalldata: build_game_system_gameOverBatch_calldata,
			getGameData: game_system_getGameData,
			buildGetGameDataCalldata: build_game_system_getGameData_calldata,
			getGrid: game_system_getGrid,
			buildGetGridCalldata: build_game_system_getGrid_calldata,
			getPlayerName: game_system_getPlayerName,
			buildGetPlayerNameCalldata: build_game_system_getPlayerName_calldata,
			getScore: game_system_getScore,
			buildGetScoreCalldata: build_game_system_getScore_calldata,
			mintGame: game_system_mintGame,
			buildMintGameCalldata: build_game_system_mintGame_calldata,
			mintGameBatch: game_system_mintGameBatch,
			buildMintGameBatchCalldata: build_game_system_mintGameBatch_calldata,
			objectivesAddress: game_system_objectivesAddress,
			buildObjectivesAddressCalldata: build_game_system_objectivesAddress_calldata,
			score: game_system_score,
			buildScoreCalldata: build_game_system_score_calldata,
			scoreBatch: game_system_scoreBatch,
			buildScoreBatchCalldata: build_game_system_scoreBatch_calldata,
			settingsAddress: game_system_settingsAddress,
			buildSettingsAddressCalldata: build_game_system_settingsAddress_calldata,
			supportsInterface: game_system_supportsInterface,
			buildSupportsInterfaceCalldata: build_game_system_supportsInterface_calldata,
			surrender: game_system_surrender,
			buildSurrenderCalldata: build_game_system_surrender_calldata,
			tokenAddress: game_system_tokenAddress,
			buildTokenAddressCalldata: build_game_system_tokenAddress_calldata,
		},
		grid_system: {
			initializeGrid: grid_system_initializeGrid,
			buildInitializeGridCalldata: build_grid_system_initializeGrid_calldata,
			insertLineIfEmpty: grid_system_insertLineIfEmpty,
			buildInsertLineIfEmptyCalldata: build_grid_system_insertLineIfEmpty_calldata,
			resetGridForLevel: grid_system_resetGridForLevel,
			buildResetGridForLevelCalldata: build_grid_system_resetGridForLevel_calldata,
		},
		level_system: {
			finalizeLevel: level_system_finalizeLevel,
			buildFinalizeLevelCalldata: build_level_system_finalizeLevel_calldata,
			initializeEndlessLevel: level_system_initializeEndlessLevel,
			buildInitializeEndlessLevelCalldata: build_level_system_initializeEndlessLevel_calldata,
			initializeLevel: level_system_initializeLevel,
			buildInitializeLevelCalldata: build_level_system_initializeLevel_calldata,
			insertLineIfEmpty: level_system_insertLineIfEmpty,
			buildInsertLineIfEmptyCalldata: build_level_system_insertLineIfEmpty_calldata,
			startNextLevel: level_system_startNextLevel,
			buildStartNextLevelCalldata: build_level_system_startNextLevel_calldata,
		},
		move_system: {
			move: move_system_move,
			buildMoveCalldata: build_move_system_move_calldata,
		},
		progress_system: {
			emitProgress: progress_system_emitProgress,
			buildEmitProgressCalldata: build_progress_system_emitProgress_calldata,
			emitProgressBulk: progress_system_emitProgressBulk,
			buildEmitProgressBulkCalldata: build_progress_system_emitProgressBulk_calldata,
			progress: progress_system_progress,
			buildProgressCalldata: build_progress_system_progress_calldata,
			questClaim: progress_system_questClaim,
			buildQuestClaimCalldata: build_progress_system_questClaim_calldata,
			supportsInterface: progress_system_supportsInterface,
			buildSupportsInterfaceCalldata: build_progress_system_supportsInterface_calldata,
		},
		renderer_systems: {
			createMetadata: renderer_systems_createMetadata,
			buildCreateMetadataCalldata: build_renderer_systems_createMetadata_calldata,
			gameDetails: renderer_systems_gameDetails,
			buildGameDetailsCalldata: build_renderer_systems_gameDetails_calldata,
			gameDetailsBatch: renderer_systems_gameDetailsBatch,
			buildGameDetailsBatchCalldata: build_renderer_systems_gameDetailsBatch_calldata,
			gameDetailsSvg: renderer_systems_gameDetailsSvg,
			buildGameDetailsSvgCalldata: build_renderer_systems_gameDetailsSvg_calldata,
			generateDetails: renderer_systems_generateDetails,
			buildGenerateDetailsCalldata: build_renderer_systems_generateDetails_calldata,
			generateSvg: renderer_systems_generateSvg,
			buildGenerateSvgCalldata: build_renderer_systems_generateSvg_calldata,
			tokenDescription: renderer_systems_tokenDescription,
			buildTokenDescriptionCalldata: build_renderer_systems_tokenDescription_calldata,
			tokenDescriptionBatch: renderer_systems_tokenDescriptionBatch,
			buildTokenDescriptionBatchCalldata: build_renderer_systems_tokenDescriptionBatch_calldata,
			tokenName: renderer_systems_tokenName,
			buildTokenNameCalldata: build_renderer_systems_tokenName_calldata,
			tokenNameBatch: renderer_systems_tokenNameBatch,
			buildTokenNameBatchCalldata: build_renderer_systems_tokenNameBatch_calldata,
		},
		story_system: {
			claimZonePerfection: story_system_claimZonePerfection,
			buildClaimZonePerfectionCalldata: build_story_system_claimZonePerfection_calldata,
			replayStoryLevel: story_system_replayStoryLevel,
			buildReplayStoryLevelCalldata: build_story_system_replayStoryLevel_calldata,
			startStoryAttempt: story_system_startStoryAttempt,
			buildStartStoryAttemptCalldata: build_story_system_startStoryAttempt_calldata,
		},
	};
}
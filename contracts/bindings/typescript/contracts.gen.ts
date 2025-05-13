import { DojoProvider, DojoCall } from "@dojoengine/core";
import { Account, AccountInterface, BigNumberish, CairoOption, CairoCustomEnum, ByteArray } from "starknet";
import * as models from "./models.gen";

export function setupWorld(provider: DojoProvider) {

	const build_config_system_addGameSettings_calldata = (name: BigNumberish, description: ByteArray, difficulty: CairoCustomEnum): DojoCall => {
		return {
			contractName: "config_system",
			entrypoint: "add_game_settings",
			calldata: [name, description, difficulty],
		};
	};

	const config_system_addGameSettings = async (snAccount: Account | AccountInterface, name: BigNumberish, description: ByteArray, difficulty: CairoCustomEnum) => {
		try {
			return await provider.execute(
				snAccount,
				build_config_system_addGameSettings_calldata(name, description, difficulty),
				"zkube_budo_v1_1_0",
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
			return await provider.call("zkube_budo_v1_1_0", build_config_system_getGameSettings_calldata(settingsId));
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
			return await provider.call("zkube_budo_v1_1_0", build_config_system_getGameSettingsMetadata_calldata(settingsId));
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
			return await provider.call("zkube_budo_v1_1_0", build_config_system_settingsExists_calldata(settingsId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_applyBonus_calldata = (gameId: BigNumberish, bonus: CairoCustomEnum, rowIndex: BigNumberish, lineIndex: BigNumberish): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "apply_bonus",
			calldata: [gameId, bonus, rowIndex, lineIndex],
		};
	};

	const game_system_applyBonus = async (snAccount: Account | AccountInterface, gameId: BigNumberish, bonus: CairoCustomEnum, rowIndex: BigNumberish, lineIndex: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_system_applyBonus_calldata(gameId, bonus, rowIndex, lineIndex),
				"zkube_budo_v1_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_approve_calldata = (to: string, tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "approve",
			calldata: [to, tokenId],
		};
	};

	const game_system_approve = async (snAccount: Account | AccountInterface, to: string, tokenId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_system_approve_calldata(to, tokenId),
				"zkube_budo_v1_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_balanceOf_calldata = (account: string): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "balanceOf",
			calldata: [account],
		};
	};

	const game_system_balanceOf = async (account: string) => {
		try {
			return await provider.call("zkube_budo_v1_1_0", build_game_system_balanceOf_calldata(account));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_create_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "create",
			calldata: [gameId],
		};
	};

	const game_system_create = async (snAccount: Account | AccountInterface, gameId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_system_create_calldata(gameId),
				"zkube_budo_v1_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_emitMetadataUpdate_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "emit_metadata_update",
			calldata: [gameId],
		};
	};

	const game_system_emitMetadataUpdate = async (snAccount: Account | AccountInterface, gameId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_system_emitMetadataUpdate_calldata(gameId),
				"zkube_budo_v1_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_gameCount_calldata = (): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "game_count",
			calldata: [],
		};
	};

	const game_system_gameCount = async () => {
		try {
			return await provider.call("zkube_budo_v1_1_0", build_game_system_gameCount_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_gameMetadata_calldata = (): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "game_metadata",
			calldata: [],
		};
	};

	const game_system_gameMetadata = async () => {
		try {
			return await provider.call("zkube_budo_v1_1_0", build_game_system_gameMetadata_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_getApproved_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "getApproved",
			calldata: [tokenId],
		};
	};

	const game_system_getApproved = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("zkube_budo_v1_1_0", build_game_system_getApproved_calldata(tokenId));
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
			return await provider.call("zkube_budo_v1_1_0", build_game_system_getGameData_calldata(gameId));
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
			return await provider.call("zkube_budo_v1_1_0", build_game_system_getPlayerName_calldata(gameId));
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
			return await provider.call("zkube_budo_v1_1_0", build_game_system_getScore_calldata(gameId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_isApprovedForAll_calldata = (owner: string, operator: string): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "isApprovedForAll",
			calldata: [owner, operator],
		};
	};

	const game_system_isApprovedForAll = async (owner: string, operator: string) => {
		try {
			return await provider.call("zkube_budo_v1_1_0", build_game_system_isApprovedForAll_calldata(owner, operator));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_mint_calldata = (playerName: BigNumberish, settingsId: BigNumberish, start: CairoOption<BigNumberish>, end: CairoOption<BigNumberish>, to: string): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "mint",
			calldata: [playerName, settingsId, start, end, to],
		};
	};

	const game_system_mint = async (snAccount: Account | AccountInterface, playerName: BigNumberish, settingsId: BigNumberish, start: CairoOption<BigNumberish>, end: CairoOption<BigNumberish>, to: string) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_system_mint_calldata(playerName, settingsId, start, end, to),
				"zkube_budo_v1_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_move_calldata = (gameId: BigNumberish, rowIndex: BigNumberish, startIndex: BigNumberish, finalIndex: BigNumberish): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "move",
			calldata: [gameId, rowIndex, startIndex, finalIndex],
		};
	};

	const game_system_move = async (snAccount: Account | AccountInterface, gameId: BigNumberish, rowIndex: BigNumberish, startIndex: BigNumberish, finalIndex: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_system_move_calldata(gameId, rowIndex, startIndex, finalIndex),
				"zkube_budo_v1_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_name_calldata = (): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "name",
			calldata: [],
		};
	};

	const game_system_name = async () => {
		try {
			return await provider.call("zkube_budo_v1_1_0", build_game_system_name_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_ownerOf_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "ownerOf",
			calldata: [tokenId],
		};
	};

	const game_system_ownerOf = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("zkube_budo_v1_1_0", build_game_system_ownerOf_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_safeTransferFrom_calldata = (from: string, to: string, tokenId: BigNumberish, data: Array<BigNumberish>): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "safeTransferFrom",
			calldata: [from, to, tokenId, data],
		};
	};

	const game_system_safeTransferFrom = async (snAccount: Account | AccountInterface, from: string, to: string, tokenId: BigNumberish, data: Array<BigNumberish>) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_system_safeTransferFrom_calldata(from, to, tokenId, data),
				"zkube_budo_v1_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_score_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "score",
			calldata: [gameId],
		};
	};

	const game_system_score = async (gameId: BigNumberish) => {
		try {
			return await provider.call("zkube_budo_v1_1_0", build_game_system_score_calldata(gameId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_scoreAttribute_calldata = (): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "score_attribute",
			calldata: [],
		};
	};

	const game_system_scoreAttribute = async () => {
		try {
			return await provider.call("zkube_budo_v1_1_0", build_game_system_scoreAttribute_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_scoreModel_calldata = (): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "score_model",
			calldata: [],
		};
	};

	const game_system_scoreModel = async () => {
		try {
			return await provider.call("zkube_budo_v1_1_0", build_game_system_scoreModel_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_setApprovalForAll_calldata = (operator: string, approved: boolean): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "setApprovalForAll",
			calldata: [operator, approved],
		};
	};

	const game_system_setApprovalForAll = async (snAccount: Account | AccountInterface, operator: string, approved: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_system_setApprovalForAll_calldata(operator, approved),
				"zkube_budo_v1_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_settingExists_calldata = (settingsId: BigNumberish): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "setting_exists",
			calldata: [settingsId],
		};
	};

	const game_system_settingExists = async (settingsId: BigNumberish) => {
		try {
			return await provider.call("zkube_budo_v1_1_0", build_game_system_settingExists_calldata(settingsId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_settingsModel_calldata = (): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "settings_model",
			calldata: [],
		};
	};

	const game_system_settingsModel = async () => {
		try {
			return await provider.call("zkube_budo_v1_1_0", build_game_system_settingsModel_calldata());
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
			return await provider.call("zkube_budo_v1_1_0", build_game_system_supportsInterface_calldata(interfaceId));
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
				"zkube_budo_v1_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_symbol_calldata = (): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "symbol",
			calldata: [],
		};
	};

	const game_system_symbol = async () => {
		try {
			return await provider.call("zkube_budo_v1_1_0", build_game_system_symbol_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_tokenMetadata_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "token_metadata",
			calldata: [tokenId],
		};
	};

	const game_system_tokenMetadata = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("zkube_budo_v1_1_0", build_game_system_tokenMetadata_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_tokenUri_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "token_uri",
			calldata: [tokenId],
		};
	};

	const game_system_tokenUri = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("zkube_budo_v1_1_0", build_game_system_tokenUri_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_system_transferFrom_calldata = (from: string, to: string, tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "game_system",
			entrypoint: "transferFrom",
			calldata: [from, to, tokenId],
		};
	};

	const game_system_transferFrom = async (snAccount: Account | AccountInterface, from: string, to: string, tokenId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_system_transferFrom_calldata(from, to, tokenId),
				"zkube_budo_v1_1_0",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};



	return {
		config_system: {
			addGameSettings: config_system_addGameSettings,
			buildAddGameSettingsCalldata: build_config_system_addGameSettings_calldata,
			getGameSettings: config_system_getGameSettings,
			buildGetGameSettingsCalldata: build_config_system_getGameSettings_calldata,
			getGameSettingsMetadata: config_system_getGameSettingsMetadata,
			buildGetGameSettingsMetadataCalldata: build_config_system_getGameSettingsMetadata_calldata,
			settingsExists: config_system_settingsExists,
			buildSettingsExistsCalldata: build_config_system_settingsExists_calldata,
		},
		game_system: {
			applyBonus: game_system_applyBonus,
			buildApplyBonusCalldata: build_game_system_applyBonus_calldata,
			approve: game_system_approve,
			buildApproveCalldata: build_game_system_approve_calldata,
			balanceOf: game_system_balanceOf,
			buildBalanceOfCalldata: build_game_system_balanceOf_calldata,
			create: game_system_create,
			buildCreateCalldata: build_game_system_create_calldata,
			emitMetadataUpdate: game_system_emitMetadataUpdate,
			buildEmitMetadataUpdateCalldata: build_game_system_emitMetadataUpdate_calldata,
			gameCount: game_system_gameCount,
			buildGameCountCalldata: build_game_system_gameCount_calldata,
			gameMetadata: game_system_gameMetadata,
			buildGameMetadataCalldata: build_game_system_gameMetadata_calldata,
			getApproved: game_system_getApproved,
			buildGetApprovedCalldata: build_game_system_getApproved_calldata,
			getGameData: game_system_getGameData,
			buildGetGameDataCalldata: build_game_system_getGameData_calldata,
			getPlayerName: game_system_getPlayerName,
			buildGetPlayerNameCalldata: build_game_system_getPlayerName_calldata,
			getScore: game_system_getScore,
			buildGetScoreCalldata: build_game_system_getScore_calldata,
			isApprovedForAll: game_system_isApprovedForAll,
			buildIsApprovedForAllCalldata: build_game_system_isApprovedForAll_calldata,
			mint: game_system_mint,
			buildMintCalldata: build_game_system_mint_calldata,
			move: game_system_move,
			buildMoveCalldata: build_game_system_move_calldata,
			name: game_system_name,
			buildNameCalldata: build_game_system_name_calldata,
			ownerOf: game_system_ownerOf,
			buildOwnerOfCalldata: build_game_system_ownerOf_calldata,
			safeTransferFrom: game_system_safeTransferFrom,
			buildSafeTransferFromCalldata: build_game_system_safeTransferFrom_calldata,
			score: game_system_score,
			buildScoreCalldata: build_game_system_score_calldata,
			scoreAttribute: game_system_scoreAttribute,
			buildScoreAttributeCalldata: build_game_system_scoreAttribute_calldata,
			scoreModel: game_system_scoreModel,
			buildScoreModelCalldata: build_game_system_scoreModel_calldata,
			setApprovalForAll: game_system_setApprovalForAll,
			buildSetApprovalForAllCalldata: build_game_system_setApprovalForAll_calldata,
			settingExists: game_system_settingExists,
			buildSettingExistsCalldata: build_game_system_settingExists_calldata,
			settingsModel: game_system_settingsModel,
			buildSettingsModelCalldata: build_game_system_settingsModel_calldata,
			supportsInterface: game_system_supportsInterface,
			buildSupportsInterfaceCalldata: build_game_system_supportsInterface_calldata,
			surrender: game_system_surrender,
			buildSurrenderCalldata: build_game_system_surrender_calldata,
			symbol: game_system_symbol,
			buildSymbolCalldata: build_game_system_symbol_calldata,
			tokenMetadata: game_system_tokenMetadata,
			buildTokenMetadataCalldata: build_game_system_tokenMetadata_calldata,
			tokenUri: game_system_tokenUri,
			buildTokenUriCalldata: build_game_system_tokenUri_calldata,
			transferFrom: game_system_transferFrom,
			buildTransferFromCalldata: build_game_system_transferFrom_calldata,
		},
	};
}
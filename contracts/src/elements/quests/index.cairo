/// Quest index - enumerates all quests and their properties

// External imports
pub use quest::types::metadata::{QuestMetadata, QuestMetadataTrait};
pub use quest::types::reward::QuestReward;
pub use quest::types::task::Task as QuestTask;
use starknet::ContractAddress;

// Internal imports
use crate::elements::quests;
pub use crate::elements::quests::interface::QuestTrait;
pub use crate::elements::tasks::index::{Task, TaskTrait};

// Constants

pub const QUEST_COUNT: u8 = 10;
pub const ONE_DAY: u64 = 24 * 60 * 60; // 86400 seconds

// Quest rewards (in CUBE tokens)
pub const REWARD_PLAYER_ONE: u8 = 3;
pub const REWARD_PLAYER_TWO: u8 = 6;
pub const REWARD_PLAYER_THREE: u8 = 12;
pub const REWARD_CLEARER_ONE: u8 = 3;
pub const REWARD_CLEARER_TWO: u8 = 6;
pub const REWARD_CLEARER_THREE: u8 = 12;
pub const REWARD_COMBO_ONE: u8 = 5;
pub const REWARD_COMBO_TWO: u8 = 10;
pub const REWARD_COMBO_THREE: u8 = 20;
pub const REWARD_FINISHER: u8 = 25;

/// Icon URL for quest rewards display
pub fn ICON() -> ByteArray {
    "https://zkube.gg/assets/cube-icon.png"
}

// Types

/// Quest type enumeration
#[derive(Copy, Drop)]
pub enum QuestType {
    None,
    DailyPlayerOne,
    DailyPlayerTwo,
    DailyPlayerThree,
    DailyClearerOne,
    DailyClearerTwo,
    DailyClearerThree,
    DailyComboOne,
    DailyComboTwo,
    DailyComboThree,
    DailyFinisher,
}

/// Quest properties structure
#[derive(Clone, Drop, Serde)]
pub struct QuestProps {
    pub id: felt252,
    pub start: u64,
    pub end: u64,
    pub duration: u64,
    pub interval: u64,
    pub tasks: Array<QuestTask>,
    pub conditions: Array<felt252>,
    pub metadata: QuestMetadata,
}

// Implementations

#[generate_trait]
pub impl QuestImpl of IQuest {
    /// Get the unique identifier for this quest type
    fn identifier(self: QuestType) -> felt252 {
        match self {
            QuestType::DailyPlayerOne => quests::player::DailyPlayerOne::identifier(),
            QuestType::DailyPlayerTwo => quests::player::DailyPlayerTwo::identifier(),
            QuestType::DailyPlayerThree => quests::player::DailyPlayerThree::identifier(),
            QuestType::DailyClearerOne => quests::clearer::DailyClearerOne::identifier(),
            QuestType::DailyClearerTwo => quests::clearer::DailyClearerTwo::identifier(),
            QuestType::DailyClearerThree => quests::clearer::DailyClearerThree::identifier(),
            QuestType::DailyComboOne => quests::combo::DailyComboOne::identifier(),
            QuestType::DailyComboTwo => quests::combo::DailyComboTwo::identifier(),
            QuestType::DailyComboThree => quests::combo::DailyComboThree::identifier(),
            QuestType::DailyFinisher => quests::finisher::DailyFinisher::identifier(),
            QuestType::None => 0,
        }
    }

    /// Get the quest properties for this quest type
    fn props(self: QuestType, registry: ContractAddress) -> QuestProps {
        match self {
            QuestType::DailyPlayerOne => quests::player::DailyPlayerOne::props(registry),
            QuestType::DailyPlayerTwo => quests::player::DailyPlayerTwo::props(registry),
            QuestType::DailyPlayerThree => quests::player::DailyPlayerThree::props(registry),
            QuestType::DailyClearerOne => quests::clearer::DailyClearerOne::props(registry),
            QuestType::DailyClearerTwo => quests::clearer::DailyClearerTwo::props(registry),
            QuestType::DailyClearerThree => quests::clearer::DailyClearerThree::props(registry),
            QuestType::DailyComboOne => quests::combo::DailyComboOne::props(registry),
            QuestType::DailyComboTwo => quests::combo::DailyComboTwo::props(registry),
            QuestType::DailyComboThree => quests::combo::DailyComboThree::props(registry),
            QuestType::DailyFinisher => quests::finisher::DailyFinisher::props(registry),
            _ => Default::default(),
        }
    }

    /// Get the reward amount and optional achievement task for this quest
    fn reward(self: QuestType) -> (u8, Task) {
        match self {
            QuestType::DailyPlayerOne => (REWARD_PLAYER_ONE, Task::None),
            QuestType::DailyPlayerTwo => (REWARD_PLAYER_TWO, Task::None),
            QuestType::DailyPlayerThree => (REWARD_PLAYER_THREE, Task::None),
            QuestType::DailyClearerOne => (REWARD_CLEARER_ONE, Task::None),
            QuestType::DailyClearerTwo => (REWARD_CLEARER_TWO, Task::None),
            QuestType::DailyClearerThree => (REWARD_CLEARER_THREE, Task::None),
            QuestType::DailyComboOne => (REWARD_COMBO_ONE, Task::None),
            QuestType::DailyComboTwo => (REWARD_COMBO_TWO, Task::None),
            QuestType::DailyComboThree => (REWARD_COMBO_THREE, Task::None),
            // DailyFinisher also unlocks the DailyMaster achievement
            QuestType::DailyFinisher => (REWARD_FINISHER, Task::DailyMaster),
            _ => (0, Task::None),
        }
    }

    /// Check if this quest is a daily quest (resets every day)
    fn is_daily(self: QuestType) -> bool {
        match self {
            QuestType::None => false,
            _ => true,
        }
    }
}

// Into<QuestType, u8>
impl IntoQuestU8 of core::traits::Into<QuestType, u8> {
    fn into(self: QuestType) -> u8 {
        match self {
            QuestType::None => 0,
            QuestType::DailyPlayerOne => 1,
            QuestType::DailyPlayerTwo => 2,
            QuestType::DailyPlayerThree => 3,
            QuestType::DailyClearerOne => 4,
            QuestType::DailyClearerTwo => 5,
            QuestType::DailyClearerThree => 6,
            QuestType::DailyComboOne => 7,
            QuestType::DailyComboTwo => 8,
            QuestType::DailyComboThree => 9,
            QuestType::DailyFinisher => 10,
        }
    }
}

// Into<u8, QuestType>
impl IntoU8Quest of core::traits::Into<u8, QuestType> {
    fn into(self: u8) -> QuestType {
        match self {
            0 => QuestType::None,
            1 => QuestType::DailyPlayerOne,
            2 => QuestType::DailyPlayerTwo,
            3 => QuestType::DailyPlayerThree,
            4 => QuestType::DailyClearerOne,
            5 => QuestType::DailyClearerTwo,
            6 => QuestType::DailyClearerThree,
            7 => QuestType::DailyComboOne,
            8 => QuestType::DailyComboTwo,
            9 => QuestType::DailyComboThree,
            10 => QuestType::DailyFinisher,
            _ => QuestType::None,
        }
    }
}

// Into<felt252, QuestType>
impl IntoFelt252Quest of core::traits::Into<felt252, QuestType> {
    fn into(self: felt252) -> QuestType {
        if self == quests::player::DailyPlayerOne::identifier() {
            return QuestType::DailyPlayerOne;
        } else if self == quests::player::DailyPlayerTwo::identifier() {
            return QuestType::DailyPlayerTwo;
        } else if self == quests::player::DailyPlayerThree::identifier() {
            return QuestType::DailyPlayerThree;
        } else if self == quests::clearer::DailyClearerOne::identifier() {
            return QuestType::DailyClearerOne;
        } else if self == quests::clearer::DailyClearerTwo::identifier() {
            return QuestType::DailyClearerTwo;
        } else if self == quests::clearer::DailyClearerThree::identifier() {
            return QuestType::DailyClearerThree;
        } else if self == quests::combo::DailyComboOne::identifier() {
            return QuestType::DailyComboOne;
        } else if self == quests::combo::DailyComboTwo::identifier() {
            return QuestType::DailyComboTwo;
        } else if self == quests::combo::DailyComboThree::identifier() {
            return QuestType::DailyComboThree;
        } else if self == quests::finisher::DailyFinisher::identifier() {
            return QuestType::DailyFinisher;
        } else {
            return QuestType::None;
        }
    }
}

// Default implementation for QuestProps
pub impl QuestPropsDefault of core::traits::Default<QuestProps> {
    fn default() -> QuestProps {
        QuestProps {
            id: 0,
            start: 0,
            end: 0,
            duration: 0,
            interval: 0,
            tasks: array![],
            conditions: array![],
            metadata: QuestMetadataTrait::new(
                name: "",
                description: "",
                icon: "",
                registry: 0.try_into().unwrap(),
                rewards: array![].span(),
            ),
        }
    }
}

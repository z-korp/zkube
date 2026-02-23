pub mod constants;
pub mod events;

pub mod models {
    pub mod config;
    pub mod draft;
    pub mod game;
    pub mod player;
}

pub mod types {
    pub mod block;
    pub mod bonus;
    pub mod constraint;
    pub mod consumable;
    pub mod difficulty;
    pub mod level;
    pub mod width;
}

mod elements {
    pub mod bonuses {
        pub mod harvest;
        pub mod interface;
        pub mod wave;
    }
    pub mod difficulties {
        pub mod data;
        pub mod interface;
    }
    pub mod tasks {
        pub mod clearer;
        pub mod combo;
        pub mod combo_streak;
        pub mod grinder;
        pub mod index;
        pub mod interface;
        pub mod level;
        pub mod master;
        pub mod scorer;
        pub mod victory;
    }
    pub mod achievements {
        pub mod cascade;
        pub mod champion;
        pub mod clearer;
        pub mod combo;
        pub mod grinder;
        pub mod index;
        pub mod interface;
        pub mod master;
        pub mod streak;
    }
    pub mod quests {
        pub mod clearer;
        pub mod combo;
        pub mod combo_streak;
        pub mod finisher;
        pub mod index;
        pub mod interface;
        pub mod player;
    }
}

pub mod interfaces {
    pub mod vrf;
}

pub mod helpers {
    pub mod bonus_logic;
    pub mod boss;
    pub mod config;
    pub mod controller;
    pub mod dispatchers;
    pub mod encoding;
    pub mod game_helpers;
    pub mod game_libs;
    pub mod game_over;
    pub mod gravity;
    pub mod grid_utils;
    pub mod level;
    pub mod level_check;
    pub mod math;
    pub mod packer;
    pub mod packing;
    pub mod random;
    pub mod renderer;
    pub mod scoring;
    pub mod token;
}

pub mod systems {
    pub mod achievement;
    pub mod bonus;
    pub mod config;
    pub mod cube_token;
    pub mod draft;
    pub mod game;
    pub mod grid;
    pub mod level;
    pub mod moves;
    pub mod quest;
    pub mod renderer;
    pub mod shop;
}

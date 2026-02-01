pub mod constants;
pub mod events;

pub mod models {
    pub mod config;
    pub mod game;
    pub mod player;
}

pub mod types {
    pub mod bonus;
    pub mod width;
    pub mod block;
    pub mod difficulty;
    pub mod constraint;
    pub mod level;
    pub mod consumable;
}

mod elements {
    pub mod bonuses {
        pub mod interface;
        pub mod hammer;
        pub mod totem;
        pub mod wave;
        pub mod shrink;
        pub mod shuffle;
    }
    pub mod difficulties {
        pub mod data;
        pub mod interface;
    }
    pub mod tasks {
        pub mod interface;
        pub mod index;
        pub mod grinder;
        pub mod clearer;
        pub mod combo;
        pub mod master;
    }
    pub mod quests {
        pub mod interface;
        pub mod index;
        pub mod player;
        pub mod clearer;
        pub mod combo;
        pub mod finisher;
    }
}

pub mod interfaces {
    pub mod vrf;
}

pub mod helpers {
    pub mod math;
    pub mod packer;
    pub mod controller;
    pub mod gravity;
    pub mod grid_utils;
    pub mod game_helpers;
    pub mod random;
    pub mod config;
    pub mod encoding;
    pub mod renderer;
    pub mod token;
    pub mod packing;
    pub mod level;
    pub mod level_check;
    pub mod dispatchers;
    pub mod game_libs;
    pub mod game_over;
    pub mod scoring;
    pub mod bonus_logic;
}

pub mod systems {
    pub mod game;
    pub mod moves;
    pub mod bonus;
    pub mod grid;
    pub mod level;
    pub mod config;
    pub mod shop;
    pub mod cube_token;
    pub mod quest;
    pub mod renderer;
}

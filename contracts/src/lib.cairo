pub mod constants;
pub mod events;

pub mod models {
    pub mod config;
    pub mod cosmetic;
    pub mod daily;
    pub mod entitlement;
    pub mod game;
    pub mod mutator;
    pub mod player;
    pub mod story;
    pub mod weekly;
}

pub mod types {
    pub mod block;
    pub mod bonus;
    pub mod constraint;
    pub mod difficulty;
    pub mod level;
    pub mod mutator;
    pub mod width;
}

pub mod elements {
    pub mod achievements {
        pub mod index;
    }

    pub mod bonuses {
        pub mod hammer;
        pub mod interface;
        pub mod totem;
        pub mod wave;
    }

    pub mod difficulties {
        pub mod data;
        pub mod interface;
    }

    pub mod tasks {
        pub mod index;
        pub mod interface;
    }

    pub mod quests {
        pub mod index;
    }
}

pub mod interfaces {
    pub mod vrf;
}

pub mod helpers {
    pub mod boss;
    pub mod config;
    pub mod controller;
    pub mod daily;
    pub mod encoding;
    pub mod game_creation;
    pub mod game_libs;
    pub mod game_over;
    pub mod gravity;
    pub mod level;
    pub mod level_check;
    pub mod mutator;
    pub mod packer;
    pub mod packing;
    pub mod prize;
    pub mod random;
    pub mod renderer;
    pub mod scoring;
    pub mod token;
    pub mod weekly;
}

pub mod systems {
    pub mod config;
    pub mod daily_challenge;
    pub mod game;
    pub mod grid;
    pub mod level;
    pub mod moves;
    pub mod progress;
    pub mod renderer;
    pub mod story;
}

pub mod external {
    pub mod zstar_token;
}

#[cfg(test)]
mod tests {
    mod test_config_auth;
    mod test_daily_scores;
    mod test_run_data;
}

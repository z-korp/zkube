pub mod constants;
pub mod events;

pub mod models {
    pub mod config;
    pub mod entitlement;
    pub mod game;
    pub mod player;
    pub mod daily;
}

pub mod types {
    pub mod block;
    pub mod bonus;
    pub mod constraint;

    pub mod difficulty;
    pub mod mode;
    pub mod level;
    pub mod width;
    pub mod daily;
}

mod elements {
    pub mod difficulties {
        pub mod data;
        pub mod interface;
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
    pub mod dispatchers;
    pub mod encoding;
    pub mod game_helpers;
    pub mod game_libs;
    pub mod game_over;
    pub mod gravity;
    pub mod level;
    pub mod level_check;
    pub mod math;
    pub mod packer;
    pub mod prize;
    pub mod packing;
    pub mod random;
    pub mod renderer;
    pub mod scoring;
    pub mod token;
}

pub mod systems {
    pub mod config;
    pub mod game;
    pub mod grid;
    pub mod level;
    pub mod moves;
    pub mod renderer;
    pub mod daily_challenge;
}

pub mod external {
    pub mod full_token_contract;
    pub mod minigame_registry_contract;
}

#[cfg(test)]
mod tests {
    mod test_run_data;
}

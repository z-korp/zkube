pub mod constants;
pub mod events;

pub mod models {
    pub mod config;
    pub mod game;
}

pub mod types {
    pub mod bonus;
    pub mod width;
    pub mod block;
    pub mod difficulty;
    pub mod task;
    pub mod trophy;
}

mod elements {
    pub mod bonuses {
        pub mod interface;
        pub mod hammer;
        pub mod totem;
        pub mod wave;
    }
    pub mod difficulties {
        pub mod veryeasy;
        pub mod easy;
        pub mod medium;
        pub mod mediumhard;
        pub mod hard;
        pub mod veryhard;
        pub mod expert;
        pub mod master;
        pub mod interface;
    }
    pub mod tasks {
        pub mod interface;
        pub mod mastering;
        pub mod chaining;
        pub mod playing;
    }
    pub mod trophies {
        pub mod interface;
        pub mod mastery;
        pub mod chainer;
        pub mod player;
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
    pub mod random;
    pub mod config;
    pub mod encoding;
    pub mod renderer;
}

pub mod systems {
    pub mod game;
    pub mod config;
}

#[cfg(test)]
mod tests {
    mod setup;
    mod test_create;
    mod test_move;
    mod test_play;
    mod test_bonus_hammer;
    mod test_bonus_wave;
    mod test_bonus_totem;
    mod test_admin;
    mod test_chest;
    mod test_bonus;
    mod test_minter;
    mod test_erc721;
    mod test_pause;

    mod mocks {
        mod erc20;
        mod erc721;
    }
}


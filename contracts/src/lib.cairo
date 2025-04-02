mod constants;
mod events;

mod models {
    mod config;
    mod game;
}

mod types {
    mod bonus;
    mod width;
    mod block;
    mod difficulty;
    mod task;
    mod trophy;
}

mod elements {
    mod bonuses {
        mod interface;
        mod hammer;
        mod totem;
        mod wave;
    }
    mod difficulties {
        mod veryeasy;
        mod easy;
        mod medium;
        mod mediumhard;
        mod hard;
        mod veryhard;
        mod expert;
        mod master;
        mod interface;
    }
    mod tasks {
        mod interface;
        mod breaking;
        mod mastering;
        mod chaining;
        mod playing;
        mod streaking;
        mod leveling;
    }
    mod trophies {
        mod interface;
        mod breaker;
        mod mastery;
        mod chainer;
        mod player;
        mod streaker;
        mod leveler;
    }
}

mod interfaces {
    mod vrf;
}

mod helpers {
    mod math;
    mod packer;
    mod controller;
    mod gravity;
    mod random;
    mod config;
    mod encoding;
    mod renderer;
}

mod systems {
    mod game;
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


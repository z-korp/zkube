mod constants;
mod events;
mod store;

mod models {
    mod index;
    mod game;
    mod player;
    mod tournament;
    mod settings;
    mod chest;
    mod admin;
    mod mint;
    mod participation;
}

mod types {
    mod bonus;
    mod width;
    mod block;
    mod mode;
    mod difficulty;
    mod level;
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
}

mod helpers {
    mod math;
    mod packer;
    mod controller;
    mod gravity;
    mod timestamp;
}

mod components {
    mod hostable;
    mod manageable;
    mod payable;
    mod playable;
}

mod systems {
    mod account;
    mod play;
    mod chest;
    mod settings;
    mod tournament;
    mod zkorp;
    mod minter;
}

mod interfaces {
    mod ierc20;
    mod ierc721;
    mod ierc721_game_credits;
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

    mod mocks {
        mod erc20;
        mod erc721;
    }
}


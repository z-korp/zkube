mod constants;
mod events;
mod store;

mod models {
    mod index;
    mod game;
    mod player;
}

mod types {
    mod bonus;
    mod color;
    mod width;
    mod block;
    mod difficulty;
}

mod elements {
    mod bonuses {
        mod interface;
        mod hammer;
    }
    mod difficulties {
        mod easy;
        mod interface;
    }
}

mod helpers {
    mod packer;
    mod controller;
    mod gravity;
}

mod components {
    mod initializable;
    mod manageable;
    mod playable;
}

mod systems {
    mod actions;
}

#[cfg(test)]
mod tests {
    mod setup;
    mod test_create;
}


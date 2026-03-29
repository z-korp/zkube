use core::traits::Into;

#[derive(Copy, Drop, Serde, PartialEq, Introspect, Debug)]
pub enum GameMode {
    Map, // 0 — 10-level progression with constraints
    Endless, // 1 — Pure survival, score-based difficulty
}

#[generate_trait]
pub impl GameModeImpl of GameModeTrait {
    fn to_u8(self: GameMode) -> u8 {
        match self {
            GameMode::Map => 0,
            GameMode::Endless => 1,
        }
    }

    fn from_u8(value: u8) -> GameMode {
        if value == 1 {
            GameMode::Endless
        } else {
            GameMode::Map
        }
    }
}

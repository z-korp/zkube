#[derive(Copy, Drop, Serde, PartialEq, Introspect, Debug)]
pub enum RunType {
    Zone, // 0 — Story zone progression run
    Endless // 1 — Pure survival, score-based difficulty
}

#[generate_trait]
pub impl RunTypeImpl of RunTypeTrait {
    fn to_u8(self: RunType) -> u8 {
        match self {
            RunType::Zone => 0,
            RunType::Endless => 1,
        }
    }

    fn from_u8(value: u8) -> RunType {
        if value == 1 {
            RunType::Endless
        } else {
            RunType::Zone
        }
    }
}

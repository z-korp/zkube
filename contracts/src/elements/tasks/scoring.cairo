use zkube::elements::tasks::interface::TaskTrait;

pub impl Scoring of TaskTrait {
    #[inline]
    fn identifier(level: u8) -> felt252 {
        'SCORING' * 256 + level.into() + 48
    }

    #[inline]
    fn description(count: u32) -> ByteArray {
        format!("Reach a score of {} in a single game", count)
    }
}

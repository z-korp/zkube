use zkube::elements::tasks::interface::TaskTrait;

pub impl CumulativeScoring of TaskTrait {
    #[inline]
    fn identifier(level: u8) -> felt252 {
        'CUMULATIVE_SCORE'
    }

    #[inline]
    fn description(count: u32) -> ByteArray {
        format!("Accumulate a total of {} points across all games", count)
    }
}

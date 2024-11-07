use zkube::elements::tasks::interface::TaskTrait;

impl Streaking of TaskTrait {
    #[inline]
    fn identifier(level: u8) -> felt252 {
        'STREAKING' * 256 + level.into() + 48
    }

    #[inline]
    fn description(count: u32) -> ByteArray {
        format!("Reach a {}-day streak", count)
    }
}

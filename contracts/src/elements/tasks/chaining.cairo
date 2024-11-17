use zkube::elements::tasks::interface::TaskTrait;

impl Chaining of TaskTrait {
    #[inline]
    fn identifier(level: u8) -> felt252 {
        'CHAINING' * 256 + level.into() + 48
    }

    #[inline]
    fn description(count: u32) -> ByteArray {
        format!("Clear {} lines in one combo", count)
    }
}

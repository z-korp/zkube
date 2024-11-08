use zkube::elements::tasks::interface::TaskTrait;

impl Mastering of TaskTrait {
    #[inline]
    fn identifier(level: u8) -> felt252 {
        'MASTERING' * 256 + level.into() + 48
    }

    #[inline]
    fn description(count: u32) -> ByteArray {
        format!("Achieve a combo total of {} in one game", count)
    }
}

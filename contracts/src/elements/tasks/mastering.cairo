use zkube::elements::tasks::interface::TaskTrait;

pub impl Mastering of TaskTrait {
    #[inline]
    fn identifier(level: u8) -> felt252 {
        'MASTERING' * 256 + level.into() + 48
    }

    #[inline]
    fn description(count: u32) -> ByteArray {
        format!("Reach a combo total of {} in a single game", count)
    }
}

use zkube::elements::tasks::interface::TaskTrait;

impl Leveling of TaskTrait {
    #[inline]
    fn identifier(level: u8) -> felt252 {
        'LEVELING' * 256 + level.into() + 48
    }

    #[inline]
    fn description(count: u32) -> ByteArray {
        format!("Reach level {}", count)
    }
}

use zkube::elements::tasks::interface::TaskTrait;

impl Breaking of TaskTrait {
    #[inline]
    fn identifier(level: u8) -> felt252 {
        'BREAKING'
    }

    #[inline]
    fn description(count: u32) -> ByteArray {
        format!("Break {} lines in total", count)
    }
}

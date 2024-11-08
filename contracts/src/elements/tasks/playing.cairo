use zkube::elements::tasks::interface::TaskTrait;

impl Playing of TaskTrait {
    #[inline]
    fn identifier(level: u8) -> felt252 {
        'PLAYING'
    }

    #[inline]
    fn description(count: u32) -> ByteArray {
        format!("Play {} games", count)
    }
}

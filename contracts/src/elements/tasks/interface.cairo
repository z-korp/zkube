pub trait TaskTrait<T> {
    fn identifier(self: @T) -> felt252;
    fn description(self: @T, count: u32) -> ByteArray;
}

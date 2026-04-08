/// Weekly settlement tracker.
/// Used to prevent double-settlement of weekly endless rewards.
/// Key is composite: week_id * 1000 + settings_id (to support per-zone settlement).
#[derive(Copy, Drop, Serde, Introspect)]
#[dojo::model]
pub struct WeeklyEndless {
    #[key]
    pub week_id: u32,
    pub total_participants: u32,
    pub settled: bool,
}

pub const SECONDS_PER_WEEK: u64 = 604800;
/// Monday-aligned epoch offset (Unix epoch was Thursday; +4 days = Monday)
pub const EPOCH: u64 = 345600;

pub fn current_week_id(timestamp: u64) -> u32 {
    ((timestamp - EPOCH) / SECONDS_PER_WEEK).try_into().unwrap()
}

// Core imports
use core::traits::TryInto;

// Internal imports
use zkube::constants;

#[generate_trait]
impl Timestamp of TimestampTrait {
    #[inline(always)]
    fn timestamp_to_day(timestamp: u64) -> u32 {
        (timestamp / constants::SECONDS_PER_DAY).try_into().unwrap()
    }
}

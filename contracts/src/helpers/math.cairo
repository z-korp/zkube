// External imports

use alexandria_math::fast_power::fast_power;

#[generate_trait]
impl Math of MathTrait {
    #[inline(always)]
    fn two_power(power: u256) -> u256 {
        fast_power(2, power)
    }
}

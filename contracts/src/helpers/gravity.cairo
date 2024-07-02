// Core imports

use core::debug::PrintTrait;

// Internal imports

use zkube::constants;
use zkube::helpers::packer::Packer;

#[generate_trait]
impl Gravity of GravityTrait {
    fn apply(mut top: u32, mut bottom: u32) -> (u32, u32) {
        let mut pointer: u32 = 1;
        let mut new_top: u32 = top;
        let mut new_bottom: u32 = bottom;
        loop {
            if top == 0 {
                break;
            };
            let upper = top % constants::BLOCK_SIZE.into();
            if upper == 0 {
                top /= constants::BLOCK_SIZE.into();
                bottom /= constants::BLOCK_SIZE.into();
                pointer *= constants::BLOCK_SIZE.into();
                continue;
            };
            let size = Self::two_power(upper * constants::BLOCK_BIT_COUNT.into());
            let lower = bottom % size;
            let lower_mask = pointer - 1;
            pointer *= size;
            let upper_mask = pointer - 1;
            if lower == 0 {
                let mask = upper_mask - lower_mask;
                new_bottom = new_bottom | (mask & new_top);
                new_top = new_top & ~mask;
            };
            top /= size;
            bottom /= size;
        };
        (new_top, new_bottom)
    }

    fn two_power(power: u32) -> u32 {
        match power {
            0 => 1,
            1 => 2,
            2 => 4,
            3 => 8,
            4 => 16,
            5 => 32,
            6 => 64,
            7 => 128,
            8 => 256,
            _ => 0,
        }
    }
}

#[cfg(test)]
mod tests {
    // Local imports

    use super::Gravity;

    #[test]
    fn test_gravity_apply_01() {
        let top: u32 = 0b000_000_000_000_010_010_000_001;
        let bottom: u32 = 0b000_000_000_000_000_000_000_000;
        let (new_top, new_bottom) = Gravity::apply(top, bottom);
        assert_eq!(new_top, 0b000_000_000_000_000_000_000_000);
        assert_eq!(new_bottom, 0b000_000_000_000_010_010_000_001);
    }

    #[test]
    fn test_gravity_apply_02() {
        let top: u32 = 0b000_000_000_000_010_010_000_001;
        let bottom: u32 = 0b000_000_000_000_001_000_000_000;
        let (new_top, new_bottom) = Gravity::apply(top, bottom);
        assert_eq!(new_top, 0b000_000_000_000_010_010_000_000);
        assert_eq!(new_bottom, 0b000_000_000_000_001_000_000_001);
    }

    #[test]
    fn test_gravity_apply_03() {
        let top: u32 = 0b001_001_001_001_001_001_001_001;
        let bottom: u32 = 0b000_000_000_000_001_000_000_000;
        let (new_top, new_bottom) = Gravity::apply(top, bottom);
        assert_eq!(new_top, 0b000_000_000_000_001_000_000_000);
        assert_eq!(new_bottom, 0b001_001_001_001_001_001_001_001);
    }
}

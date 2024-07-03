#[generate_trait]
impl Math of MathTrait {
    #[inline(always)]
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
            9 => 512,
            10 => 1024,
            11 => 2048,
            12 => 4096,
            13 => 8192,
            14 => 16384,
            15 => 32768,
            16 => 65536,
            _ => 0,
        }
    }
}

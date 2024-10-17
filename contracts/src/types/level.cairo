#[derive(Copy, Drop, Serde)]
enum Level {
    One,
    Two,
    Three,
    Four,
    Five,
    Six,
    Seven,
    Eight,
    Nine,
    Ten,
    Eleven,
    Twelve,
    Thirteen,
    Fourteen,
    Fifteen,
    Sixteen,
    Seventeen,
    Eighteen,
    Nineteen,
    Twenty,
}

#[generate_trait]
impl LevelImpl of LevelTrait {
    #[inline(always)]
    fn get_points(self: Level) -> u32 {
        match self {
            Level::One => 0, // 0-299
            Level::Two => 300, // 300-599
            Level::Three => 600,
            Level::Four => 1_000,
            Level::Five => 1_500,
            Level::Six => 2_200,
            Level::Seven => 3_100,
            Level::Eight => 4_300,
            Level::Nine => 5_800,
            Level::Ten => 7_800,
            Level::Eleven => 10_300,
            Level::Twelve => 13_500,
            Level::Thirteen => 17_500,
            Level::Fourteen => 22_500,
            Level::Fifteen => 28_500,
            Level::Sixteen => 36_000,
            Level::Seventeen => 45_000,
            Level::Eighteen => 56_000,
            Level::Nineteen => 70_000,
            Level::Twenty => 100_000,
        }
    }

    #[inline(always)]
    fn from_points(points: u32) -> Level {
        if points < 300 {
            Level::One
        } else if points < 600 {
            Level::Two
        } else if points < 1_000 {
            Level::Three
        } else if points < 1_500 {
            Level::Four
        } else if points < 2_200 {
            Level::Five
        } else if points < 3_100 {
            Level::Six
        } else if points < 4_300 {
            Level::Seven
        } else if points < 5_800 {
            Level::Eight
        } else if points < 7_800 {
            Level::Nine
        } else if points < 10_300 {
            Level::Ten
        } else if points < 13_500 {
            Level::Eleven
        } else if points < 17_500 {
            Level::Twelve
        } else if points < 22_500 {
            Level::Thirteen
        } else if points < 28_500 {
            Level::Fourteen
        } else if points < 36_000 {
            Level::Fifteen
        } else if points < 45_000 {
            Level::Sixteen
        } else if points < 56_000 {
            Level::Seventeen
        } else if points < 70_000 {
            Level::Eighteen
        } else if points < 100_000 {
            Level::Nineteen
        } else {
            Level::Twenty
        }
    }

    #[inline(always)]
    fn next(self: Level) -> Option<Level> {
        match self {
            Level::One => Option::Some(Level::Two),
            Level::Two => Option::Some(Level::Three),
            Level::Three => Option::Some(Level::Four),
            Level::Four => Option::Some(Level::Five),
            Level::Five => Option::Some(Level::Six),
            Level::Six => Option::Some(Level::Seven),
            Level::Seven => Option::Some(Level::Eight),
            Level::Eight => Option::Some(Level::Nine),
            Level::Nine => Option::Some(Level::Ten),
            Level::Ten => Option::Some(Level::Eleven),
            Level::Eleven => Option::Some(Level::Twelve),
            Level::Twelve => Option::Some(Level::Thirteen),
            Level::Thirteen => Option::Some(Level::Fourteen),
            Level::Fourteen => Option::Some(Level::Fifteen),
            Level::Fifteen => Option::Some(Level::Sixteen),
            Level::Sixteen => Option::Some(Level::Seventeen),
            Level::Seventeen => Option::Some(Level::Eighteen),
            Level::Eighteen => Option::Some(Level::Nineteen),
            Level::Nineteen => Option::Some(Level::Twenty),
            Level::Twenty => Option::None,
        }
    }
}

impl U8IntoLevel of core::Into<u8, Level> {
    #[inline(always)]
    fn into(self: u8) -> Level {
        match self {
            0 => Level::One,
            1 => Level::One,
            2 => Level::Two,
            3 => Level::Three,
            4 => Level::Four,
            5 => Level::Five,
            6 => Level::Six,
            7 => Level::Seven,
            8 => Level::Eight,
            9 => Level::Nine,
            10 => Level::Ten,
            11 => Level::Eleven,
            12 => Level::Twelve,
            13 => Level::Thirteen,
            14 => Level::Fourteen,
            15 => Level::Fifteen,
            16 => Level::Sixteen,
            17 => Level::Seventeen,
            18 => Level::Eighteen,
            19 => Level::Nineteen,
            20 => Level::Twenty,
            _ => Level::Twenty,
        }
    }
}

impl LevelIntoU8 of core::Into<Level, u8> {
    #[inline(always)]
    fn into(self: Level) -> u8 {
        match self {
            Level::One => 1,
            Level::Two => 2,
            Level::Three => 3,
            Level::Four => 4,
            Level::Five => 5,
            Level::Six => 6,
            Level::Seven => 7,
            Level::Eight => 8,
            Level::Nine => 9,
            Level::Ten => 10,
            Level::Eleven => 11,
            Level::Twelve => 12,
            Level::Thirteen => 13,
            Level::Fourteen => 14,
            Level::Fifteen => 15,
            Level::Sixteen => 16,
            Level::Seventeen => 17,
            Level::Eighteen => 18,
            Level::Nineteen => 19,
            Level::Twenty => 20,
        }
    }
}

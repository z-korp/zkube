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
            Level::One => 100,
            Level::Two => 300,
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

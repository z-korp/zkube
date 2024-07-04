// Internal imports

use zkube::types::width::Width;

// Constants

const COLOR_COUNT: u8 = 4;

#[derive(Copy, Drop, Serde)]
enum Color {
    None,
    Blue,
    Red,
    Yellow,
    Green,
}

#[generate_trait]
impl ColorImpl of ColorTrait {
    #[inline(always)]
    fn get_bits(self: Color, width: Width) -> u32 {
        match self {
            Color::None => 0,
            Color::Blue => match width {
                Width::One => 0b001,
                Width::Two => 0b001001,
                Width::Three => 0b001001001,
                Width::Four => 0b001001001001,
                _ => 0,
            },
            Color::Red => match width {
                Width::One => 0b010,
                Width::Two => 0b010010,
                Width::Three => 0b010010010,
                Width::Four => 0b010010010010,
                _ => 0,
            },
            Color::Yellow => match width {
                Width::One => 0b011,
                Width::Two => 0b011011,
                Width::Three => 0b011011011,
                Width::Four => 0b011011011011,
                _ => 0,
            },
            Color::Green => match width {
                Width::One => 0b100,
                Width::Two => 0b100100,
                Width::Three => 0b100100100,
                Width::Four => 0b100100100100,
                _ => 0,
            },
        }
    }
}

impl IntoColorFelt252 of core::Into<Color, felt252> {
    #[inline(always)]
    fn into(self: Color) -> felt252 {
        match self {
            Color::None => 'NONE',
            Color::Blue => 'BLUE',
            Color::Red => 'RED',
            Color::Yellow => 'YELLOW',
            Color::Green => 'GREEN',
        }
    }
}

impl IntoColorU8 of core::Into<Color, u8> {
    #[inline(always)]
    fn into(self: Color) -> u8 {
        match self {
            Color::None => 0,
            Color::Blue => 1,
            Color::Red => 2,
            Color::Yellow => 3,
            Color::Green => 4,
        }
    }
}

impl IntoU8Color of core::Into<u8, Color> {
    #[inline(always)]
    fn into(self: u8) -> Color {
        let action: felt252 = self.into();
        match action {
            0 => Color::None,
            1 => Color::Blue,
            2 => Color::Red,
            3 => Color::Yellow,
            4 => Color::Green,
            _ => Color::None,
        }
    }
}

impl ColorPrint of core::debug::PrintTrait<Color> {
    #[inline(always)]
    fn print(self: Color) {
        let felt: felt252 = self.into();
        felt.print();
    }
}


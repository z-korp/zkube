#[derive(Drop)]
enum Color {
    None,
    Blue,
    Red,
    Yellow,
    Black,
}

impl IntoColorFelt252 of core::Into<Color, felt252> {
    #[inline(always)]
    fn into(self: Color) -> felt252 {
        match self {
            Color::None => 'NONE',
            Color::Blue => 'BLUE',
            Color::Red => 'RED',
            Color::Yellow => 'YELLOW',
            Color::Black => 'FOUR',
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
            Color::Black => 4,
        }
    }
}

impl IntoU8Color of core::Into<u8, Color> {
    #[inline(always)]
    fn into(self: u8) -> Color {
        let action: felt252 = self.into();
        match action {
            0 => Color::None,
            1 => Color::blue,
            2 => Color::Red,
            3 => Color::Yellow,
            4 => Color::Black,
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


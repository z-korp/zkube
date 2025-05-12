#[derive(Copy, Drop, Serde)]
pub enum Width {
    None,
    One,
    Two,
    Three,
    Four,
}

impl WidthPartialEq of PartialEq<Width> {
    #[inline(always)]
    fn eq(lhs: @Width, rhs: @Width) -> bool {
        let lhs_u8: u8 = (*lhs).into();
        let rhs_u8: u8 = (*rhs).into();
        lhs_u8 == rhs_u8
    }
}

impl IntoWidthFelt252 of Into<Width, felt252> {
    #[inline(always)]
    fn into(self: Width) -> felt252 {
        match self {
            Width::None => 'NONE',
            Width::One => 'ONE',
            Width::Two => 'TWO',
            Width::Three => 'THREE',
            Width::Four => 'FOUR',
        }
    }
}

impl IntoWidthU8 of Into<Width, u8> {
    #[inline(always)]
    fn into(self: Width) -> u8 {
        match self {
            Width::None => 0,
            Width::One => 1,
            Width::Two => 2,
            Width::Three => 3,
            Width::Four => 4,
        }
    }
}

impl IntoU8Width of Into<u8, Width> {
    #[inline(always)]
    fn into(self: u8) -> Width {
        let action: felt252 = self.into();
        match action {
            0 => Width::None,
            1 => Width::One,
            2 => Width::Two,
            3 => Width::Three,
            4 => Width::Four,
            _ => Width::None,
        }
    }
}

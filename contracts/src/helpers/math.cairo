#[generate_trait]
pub impl Math<T, +PartialOrd<T>, +Copy<T>, +Drop<T>,> of MathTrait<T> {
    #[inline(always)]
    fn min(lhs: T, rhs: T) -> T {
        if lhs < rhs {
            return lhs;
        }
        return rhs;
    }

    #[inline(always)]
    fn max(lhs: T, rhs: T) -> T {
        if lhs > rhs {
            return lhs;
        }
        return rhs;
    }
}

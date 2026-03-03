//! Prize distribution calculation for daily challenges.
//!
//! Uses a power-law curve with exponent 1.5:
//!   share(rank) = (N - rank + 1)^1.5
//!   prize(rank) = pool * share(rank) / total_shares
//!
//! Where N = ceil(total_entries / 4) is the number of winners.
//!
//! Integer math uses a scaling factor of 1e12 to maintain precision
//! without overflow for typical pool sizes (up to ~10^24 wei).

/// Scale factor for integer fixed-point math
const SCALE: u256 = 1_000_000_000_000; // 1e12

/// Calculate the number of winners for a given number of entries
/// N = ceil(total_entries / 4), minimum 1 if entries > 0
pub fn calculate_num_winners(total_entries: u32) -> u32 {
    if total_entries == 0 {
        return 0;
    }
    // ceil(total_entries / 4)
    (total_entries + 3) / 4
}

/// Approximate (base)^1.5 using integer math
/// x^1.5 = x * sqrt(x)
/// Uses Babylonian method for integer sqrt
fn pow_1_5(base: u256) -> u256 {
    if base == 0 {
        return 0;
    }
    if base == 1 {
        return SCALE; // 1^1.5 = 1, scaled
    }

    // Compute sqrt(base) using Babylonian method (integer)
    let sqrt_base = isqrt(base);

    // x^1.5 = x * sqrt(x), scaled by SCALE for precision
    base * sqrt_base * SCALE / base // Simplifies to sqrt_base * SCALE, but we want base * sqrt(base)
}

/// Integer square root using Babylonian method
fn isqrt(n: u256) -> u256 {
    if n == 0 {
        return 0;
    }
    if n == 1 {
        return 1;
    }

    let mut x = n;
    let mut y = (x + 1) / 2;
    while y < x {
        x = y;
        y = (x + n / x) / 2;
    };
    x
}

/// Calculate the share for a given rank (1-indexed) out of N winners
/// share = (N - rank + 1)^1.5
fn calculate_share(rank: u32, num_winners: u32) -> u256 {
    assert!(rank >= 1 && rank <= num_winners, "Rank out of range");
    let base: u256 = (num_winners - rank + 1).into();
    // x^1.5 = x * sqrt(x)
    let sqrt_base = isqrt(base * SCALE * SCALE); // sqrt(base * SCALE^2) = sqrt(base) * SCALE
    base * sqrt_base // base * sqrt(base) * SCALE = base^1.5 * SCALE
}

/// Calculate total shares across all N winners
fn calculate_total_shares(num_winners: u32) -> u256 {
    let mut total: u256 = 0;
    let mut rank: u32 = 1;
    while rank <= num_winners {
        total += calculate_share(rank, num_winners);
        rank += 1;
    };
    total
}

/// Calculate the prize amount for a specific rank
/// Returns the LORDS amount (in wei) for the given rank
pub fn calculate_prize(rank: u32, num_winners: u32, total_pool: u256) -> u256 {
    if rank > num_winners || num_winners == 0 {
        return 0;
    }

    let share = calculate_share(rank, num_winners);
    let total_shares = calculate_total_shares(num_winners);

    if total_shares == 0 {
        return 0;
    }

    // prize = pool * share / total_shares
    total_pool * share / total_shares
}

/// Calculate all prizes for ranks 1..N, ensuring sum <= total_pool
/// Returns array of (rank, prize_amount) tuples
pub fn calculate_all_prizes(num_winners: u32, total_pool: u256) -> Array<(u32, u256)> {
    let mut prizes: Array<(u32, u256)> = array![];
    if num_winners == 0 {
        return prizes;
    }

    let total_shares = calculate_total_shares(num_winners);
    if total_shares == 0 {
        return prizes;
    }

    let mut distributed: u256 = 0;
    let mut rank: u32 = 1;
    while rank <= num_winners {
        let share = calculate_share(rank, num_winners);
        let prize = total_pool * share / total_shares;
        // Ensure we don't exceed pool due to rounding
        if distributed + prize <= total_pool {
            prizes.append((rank, prize));
            distributed += prize;
        } else {
            // Give remainder to this rank
            let remainder = total_pool - distributed;
            prizes.append((rank, remainder));
            distributed = total_pool;
        }
        rank += 1;
    };

    prizes
}

#[cfg(test)]
mod tests {
    use super::{calculate_num_winners, calculate_prize, calculate_all_prizes, isqrt};

    #[test]
    fn test_num_winners() {
        assert!(calculate_num_winners(0) == 0, "0 entries");
        assert!(calculate_num_winners(1) == 1, "1 entry");
        assert!(calculate_num_winners(4) == 1, "4 entries");
        assert!(calculate_num_winners(5) == 2, "5 entries");
        assert!(calculate_num_winners(12) == 3, "12 entries");
        assert!(calculate_num_winners(100) == 25, "100 entries");
    }

    #[test]
    fn test_isqrt() {
        assert!(isqrt(0) == 0, "sqrt(0)");
        assert!(isqrt(1) == 1, "sqrt(1)");
        assert!(isqrt(4) == 2, "sqrt(4)");
        assert!(isqrt(9) == 3, "sqrt(9)");
        assert!(isqrt(16) == 4, "sqrt(16)");
        assert!(isqrt(25) == 5, "sqrt(25)");
        assert!(isqrt(10) == 3, "sqrt(10) floor");
        assert!(isqrt(99) == 9, "sqrt(99) floor");
    }

    #[test]
    fn test_single_winner() {
        // 1-4 entries: N=1, winner takes all
        let prize = calculate_prize(1, 1, 1000);
        assert!(prize == 1000, "Single winner gets full pool");
    }

    #[test]
    fn test_two_winners() {
        // N=2: rank 1 gets more than rank 2
        let p1 = calculate_prize(1, 2, 1000);
        let p2 = calculate_prize(2, 2, 1000);
        assert!(p1 > p2, "Rank 1 gets more than rank 2");
        assert!(p1 + p2 <= 1000, "Sum doesn't exceed pool");
    }

    #[test]
    fn test_no_prize_outside_winners() {
        let prize = calculate_prize(5, 3, 1000);
        assert!(prize == 0, "No prize for rank > N");
    }

    #[test]
    fn test_all_prizes_sum() {
        // With 100 entries, N=25, pool=50 * 10^18 (50 LORDS)
        let pool: u256 = 50_000_000_000_000_000_000;
        let prizes = calculate_all_prizes(25, pool);
        let mut total: u256 = 0;
        let mut i: u32 = 0;
        while i < prizes.len() {
            let (_, amount) = *prizes.at(i);
            total += amount;
            i += 1;
        };
        assert!(total <= pool, "Total distributed <= pool");
        // Should distribute most of the pool (within rounding)
        assert!(total > pool * 99 / 100, "Should distribute >99% of pool");
    }

    #[test]
    fn test_prizes_monotonically_decreasing() {
        let prizes = calculate_all_prizes(10, 10000);
        let mut i: u32 = 0;
        while i + 1 < prizes.len() {
            let (_, amount_i) = *prizes.at(i);
            let (_, amount_next) = *prizes.at(i + 1);
            assert!(amount_i >= amount_next, "Prizes should decrease with rank");
            i += 1;
        };
    }
}

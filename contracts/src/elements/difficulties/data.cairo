use zkube::types::block::Block;
use zkube::types::difficulty::Difficulty;

/// Centralized block distribution data for all difficulties
/// Each difficulty maps 16 IDs (0-15) to Block types
/// ID 0 is always None, IDs 1-15 define the block distribution

/// Get the count of valid block IDs for any difficulty (always 15)
#[inline(always)]
pub fn get_count() -> u32 {
    15
}

/// Get the block type for a given difficulty and ID
/// Uses a data-driven approach instead of separate files per difficulty
#[inline(always)]
pub fn get_block(difficulty: Difficulty, id: u8) -> Block {
    match difficulty {
        Difficulty::None => Block::None,
        Difficulty::Increasing => Block::None,
        Difficulty::VeryEasy => get_veryeasy_block(id),
        Difficulty::Easy => get_easy_block(id),
        Difficulty::Medium => get_medium_block(id),
        Difficulty::MediumHard => get_mediumhard_block(id),
        Difficulty::Hard => get_hard_block(id),
        Difficulty::VeryHard => get_veryhard_block(id),
        Difficulty::Expert => get_expert_block(id),
        Difficulty::Master => get_master_block(id),
    }
}

/// VeryEasy: Heavy on small blocks (Zero, One), few large blocks
/// Distribution: 5 Zero, 5 One, 3 Two, 1 Three, 1 Four
#[inline(always)]
fn get_veryeasy_block(id: u8) -> Block {
    match id {
        0 => Block::None,
        1 | 2 | 3 | 4 | 5 => Block::Zero,
        6 | 7 | 8 | 9 | 10 => Block::One,
        11 | 12 | 13 => Block::Two,
        14 => Block::Three,
        15 => Block::Four,
        _ => Block::Zero,
    }
}

/// Easy: Still favors small blocks but with more variety
/// Distribution: 3 Zero, 5 One, 4 Two, 2 Three, 1 Four
#[inline(always)]
fn get_easy_block(id: u8) -> Block {
    match id {
        0 => Block::None,
        1 | 2 | 3 => Block::Zero,
        4 | 5 | 6 | 7 | 8 => Block::One,
        9 | 10 | 11 | 12 => Block::Two,
        13 | 14 => Block::Three,
        15 => Block::Four,
        _ => Block::Zero,
    }
}

/// Medium: Balanced distribution
/// Distribution: 2 Zero, 5 One, 5 Two, 2 Three, 1 Four
#[inline(always)]
fn get_medium_block(id: u8) -> Block {
    match id {
        0 => Block::None,
        1 | 2 => Block::Zero,
        3 | 4 | 5 | 6 | 7 => Block::One,
        8 | 9 | 10 | 11 | 12 => Block::Two,
        13 | 14 => Block::Three,
        15 => Block::Four,
        _ => Block::Zero,
    }
}

/// MediumHard: Shifts toward larger blocks
/// Distribution: 2 Zero, 4 One, 5 Two, 2 Three, 2 Four
#[inline(always)]
fn get_mediumhard_block(id: u8) -> Block {
    match id {
        0 => Block::None,
        1 | 2 => Block::Zero,
        3 | 4 | 5 | 6 => Block::One,
        7 | 8 | 9 | 10 | 11 => Block::Two,
        12 | 13 => Block::Three,
        14 | 15 => Block::Four,
        _ => Block::Zero,
    }
}

/// Hard: More large blocks
/// Distribution: 2 Zero, 3 One, 5 Two, 3 Three, 2 Four
#[inline(always)]
fn get_hard_block(id: u8) -> Block {
    match id {
        0 => Block::None,
        1 | 2 => Block::Zero,
        3 | 4 | 5 => Block::One,
        6 | 7 | 8 | 9 | 10 => Block::Two,
        11 | 12 | 13 => Block::Three,
        14 | 15 => Block::Four,
        _ => Block::Zero,
    }
}

/// VeryHard: Emphasis on medium-large blocks
/// Distribution: 1 Zero, 3 One, 5 Two, 3 Three, 3 Four
#[inline(always)]
fn get_veryhard_block(id: u8) -> Block {
    match id {
        0 => Block::None,
        1 => Block::Zero,
        2 | 3 | 4 => Block::One,
        5 | 6 | 7 | 8 | 9 => Block::Two,
        10 | 11 | 12 => Block::Three,
        13 | 14 | 15 => Block::Four,
        _ => Block::Zero,
    }
}

/// Expert: Heavy on large blocks
/// Distribution: 1 Zero, 2 One, 4 Two, 4 Three, 4 Four
#[inline(always)]
fn get_expert_block(id: u8) -> Block {
    match id {
        0 => Block::None,
        1 => Block::Zero,
        2 | 3 => Block::One,
        4 | 5 | 6 | 7 => Block::Two,
        8 | 9 | 10 | 11 => Block::Three,
        12 | 13 | 14 | 15 => Block::Four,
        _ => Block::Zero,
    }
}

/// Master: Maximum difficulty - dominated by large blocks
/// Distribution: 1 Zero, 2 One, 3 Two, 4 Three, 5 Four
#[inline(always)]
fn get_master_block(id: u8) -> Block {
    match id {
        0 => Block::None,
        1 => Block::Zero,
        2 | 3 => Block::One,
        4 | 5 | 6 => Block::Two,
        7 | 8 | 9 | 10 => Block::Three,
        11 | 12 | 13 | 14 | 15 => Block::Four,
        _ => Block::Zero,
    }
}

#[cfg(test)]
mod tests {
    use super::{get_count, get_block};
    use zkube::types::block::Block;
    use zkube::types::difficulty::Difficulty;

    #[test]
    fn test_count_is_15() {
        assert_eq!(get_count(), 15);
    }

    #[test]
    fn test_id_0_is_always_none() {
        assert_eq!(get_block(Difficulty::VeryEasy, 0), Block::None);
        assert_eq!(get_block(Difficulty::Easy, 0), Block::None);
        assert_eq!(get_block(Difficulty::Medium, 0), Block::None);
        assert_eq!(get_block(Difficulty::MediumHard, 0), Block::None);
        assert_eq!(get_block(Difficulty::Hard, 0), Block::None);
        assert_eq!(get_block(Difficulty::VeryHard, 0), Block::None);
        assert_eq!(get_block(Difficulty::Expert, 0), Block::None);
        assert_eq!(get_block(Difficulty::Master, 0), Block::None);
    }

    #[test]
    fn test_veryeasy_distribution() {
        // VeryEasy should have more small blocks
        assert_eq!(get_block(Difficulty::VeryEasy, 1), Block::Zero);
        assert_eq!(get_block(Difficulty::VeryEasy, 5), Block::Zero);
        assert_eq!(get_block(Difficulty::VeryEasy, 6), Block::One);
        assert_eq!(get_block(Difficulty::VeryEasy, 15), Block::Four);
    }

    #[test]
    fn test_master_distribution() {
        // Master should have more large blocks
        assert_eq!(get_block(Difficulty::Master, 1), Block::Zero);
        assert_eq!(get_block(Difficulty::Master, 7), Block::Three);
        assert_eq!(get_block(Difficulty::Master, 11), Block::Four);
        assert_eq!(get_block(Difficulty::Master, 15), Block::Four);
    }

    #[test]
    fn test_none_difficulty_returns_none() {
        assert_eq!(get_block(Difficulty::None, 0), Block::None);
        assert_eq!(get_block(Difficulty::None, 5), Block::None);
        assert_eq!(get_block(Difficulty::None, 15), Block::None);
    }

    #[test]
    fn test_increasing_returns_none() {
        // Increasing difficulty is handled at a higher level
        assert_eq!(get_block(Difficulty::Increasing, 0), Block::None);
        assert_eq!(get_block(Difficulty::Increasing, 5), Block::None);
    }
}

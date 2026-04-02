/// Ranking metric for daily challenges
/// Determines how players are ranked on the leaderboard
#[derive(Copy, Drop, Serde, PartialEq, Debug)]
pub enum RankingMetric {
    /// Highest total_score from run_data
    Score,
    /// Highest level reached
    Level,
    /// Composite ranking value (mode-aware):
    /// - Map: (total_stars << 16) | total_score
    /// - Endless: total_score
    Composite,
}

pub impl RankingMetricIntoU8 of Into<RankingMetric, u8> {
    fn into(self: RankingMetric) -> u8 {
        match self {
            RankingMetric::Score => 0,
            RankingMetric::Level => 1,
            RankingMetric::Composite => 2,
        }
    }
}

pub impl U8IntoRankingMetric of Into<u8, RankingMetric> {
    fn into(self: u8) -> RankingMetric {
        match self {
            0 => RankingMetric::Score,
            1 => RankingMetric::Level,
            2 => RankingMetric::Composite,
            _ => panic!("Invalid RankingMetric value: {}", self),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{RankingMetric, RankingMetricIntoU8, U8IntoRankingMetric};

    #[test]
    fn test_ranking_metric_to_u8() {
        let score: u8 = RankingMetric::Score.into();
        let level: u8 = RankingMetric::Level.into();
        let composite: u8 = RankingMetric::Composite.into();
        assert!(score == 0, "Score should be 0");
        assert!(level == 1, "Level should be 1");
        assert!(composite == 2, "Composite should be 2");
    }

    #[test]
    fn test_u8_to_ranking_metric() {
        let score: RankingMetric = 0_u8.into();
        let level: RankingMetric = 1_u8.into();
        let composite: RankingMetric = 2_u8.into();
        assert!(score == RankingMetric::Score, "0 should be Score");
        assert!(level == RankingMetric::Level, "1 should be Level");
        assert!(composite == RankingMetric::Composite, "2 should be Composite");
    }

    #[test]
    fn test_ranking_metric_roundtrip() {
        let metrics = array![RankingMetric::Score, RankingMetric::Level, RankingMetric::Composite];
        let mut i: u32 = 0;
        while i < metrics.len() {
            let metric = *metrics.at(i);
            let val: u8 = metric.into();
            let back: RankingMetric = val.into();
            assert!(back == metric, "Roundtrip failed");
            i += 1;
        };
    }

    #[test]
    #[should_panic(expected: "Invalid RankingMetric value: 3")]
    fn test_invalid_ranking_metric_panics() {
        let _metric: RankingMetric = 3_u8.into();
    }
}

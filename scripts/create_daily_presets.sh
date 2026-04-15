#!/bin/bash
# Create 10 daily challenge settings presets (IDs 100-109)
# Run after deploying the world: ./scripts/create_daily_presets.sh <profile>
#
# These presets use add_custom_game_settings() on the config_system.
# Each preset has a unique theme with different difficulty, draft configs,
# and constraint settings.
#
# Preset Themes:
#   100 - "Sprint"      : Easy, lots of moves, no constraints, fast fun
#   101 - "Endurance"    : Progressive difficulty, fewer moves, full constraints
#   102 - "Expert Rush"  : Expert difficulty, tight moves, score challenge
#   103 - "Combo Master" : Medium, constraints focus on combos
#   104 - "Harvest Moon" : Easy-Medium, harvest-focused draft, earn cubes
#   105 - "Minimalist"   : Hard, very few skills, test pure play
#   106 - "Chaos"        : Master difficulty, lots of moves, high variance
#   107 - "Puzzle Sprint": VeryEasy, very few moves, precision play
#   108 - "Boss Rush"    : VeryHard, constraints on everything
#   109 - "Balanced"     : Medium, standard defaults, fair for everyone

set -e

PROFILE="${1:-slot}"

echo "Creating daily challenge presets for profile: $PROFILE"
echo "These will be registered as GameSettings IDs 100-109"
echo ""

# The add_custom_game_settings function takes many parameters.
# Since the exact parameter list depends on the config_system interface,
# this script documents the preset designs.
# 
# Actual creation should be done via sozo execute calls or
# a Cairo script that calls config_system.add_custom_game_settings()
# with the specific settings_id values.
#
# For now, presets are documented here for manual creation via
# the frontend admin panel or sozo CLI.

cat << 'EOF'

=== Daily Challenge Presets ===

ID 100 - "Sprint"
  Difficulty: Easy (fixed)
  Moves: 30 base / 60 max
  Constraints: disabled
  Draft: 3 picks, all skills, level 1
  Theme: Fast, casual daily

ID 101 - "Endurance"
  Difficulty: Increasing (progressive)
  Moves: 15 base / 40 max
  Constraints: enabled, start at level 3
  Draft: 3 picks, all skills, level 0 (upgradeable)
  Theme: Long strategic runs

ID 102 - "Expert Rush"
  Difficulty: Expert (fixed)
  Moves: 25 base / 50 max
  Constraints: enabled, start at level 1
  Draft: 2 picks, all skills, level 2
  Theme: Hardcore speed challenge

ID 103 - "Combo Master"
  Difficulty: MediumHard (fixed)
  Moves: 25 base / 55 max
  Constraints: enabled, start at level 2
  Draft: 3 picks, Tempo+Scaling only (mask 0x0F3), level 1
  Theme: Combo-focused gameplay

ID 104 - "Harvest Moon"
  Difficulty: Easy (fixed)
  Moves: 30 base / 60 max
  Constraints: disabled
  Draft: 3 picks, Risk archetype only (mask 0x1C4), level 2
  Theme: Maximum cube farming

ID 105 - "Minimalist"
  Difficulty: Hard (fixed)
  Moves: 20 base / 45 max
  Constraints: enabled, start at level 5
  Draft: 1 pick, all skills, level 1
  Theme: One skill, pure puzzle

ID 106 - "Chaos"
  Difficulty: Master (fixed)
  Moves: 40 base / 80 max
  Constraints: enabled, start at level 1
  Draft: 3 picks, all skills, level 3 (maxed)
  Theme: Maximum difficulty, maximum power

ID 107 - "Puzzle Sprint"
  Difficulty: VeryEasy (fixed)
  Moves: 10 base / 20 max
  Constraints: disabled
  Draft: 2 picks, all skills, level 1
  Theme: Precision play with few moves

ID 108 - "Boss Rush"
  Difficulty: VeryHard (fixed)
  Moves: 20 base / 50 max
  Constraints: enabled, start at level 1
  Draft: 3 picks, all skills, level 0
  Theme: Every level feels like a boss

ID 109 - "Balanced"
  Difficulty: Increasing (progressive)
  Moves: 20 base / 60 max (default)
  Constraints: enabled, start at level 3 (default)
  Draft: 3 picks, all skills except Control (mask 0x3F7), level 0
  Theme: Fair baseline challenge

EOF

echo ""
echo "To create these presets, call config_system.add_custom_game_settings()"
echo "with the appropriate parameters for each preset."
echo ""
echo "Example sozo execute call:"
echo "  sozo execute -P $PROFILE config_system add_custom_game_settings ..."

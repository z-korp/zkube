# zKube Scripts

## Overview

Python utility scripts for transaction analysis, player analytics, and testing.

## Scripts

### Transaction Checking

**check_tx*.py** - Various transaction checking utilities for debugging deployed contracts:
- Verify transaction status
- Decode transaction data
- Debug failed transactions

### Player Analytics

**count_player.py** - Count and analyze player statistics:
- Total player count
- Active players
- Game statistics

### Encoding Utilities

**encode_full_token_calldata.py** - Generate calldata for token operations:
- Encode complex function calls
- Generate multicall data
- Test contract interactions

### Comparison Tools

**comparison.py** - Compare data between environments:
- State comparison across networks
- Contract verification
- Data validation

## Usage

```bash
cd scripts
python <script_name>.py
```

## Requirements

Ensure you have Python 3.x installed with necessary dependencies for Starknet interaction.

## Notes

These scripts are primarily for:
- Development debugging
- Deployment verification
- Analytics and monitoring
- Testing contract interactions

They are not part of the production application.

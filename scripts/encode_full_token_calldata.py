#!/usr/bin/env python3
"""
Utility to build calldata for the FullTokenContract constructor.

Usage example:
python scripts/encode_full_token_calldata.py \
  --name "zKube" \
  --symbol "ZKUBE" \
  --base-uri "https://zkube.xyz/api/token/" \
  --royalty-receiver 0x0 \
  --royalty-fraction 0 \
  --game-registry-address none \
  --event-relayer-address none
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import List, Optional


def felt_from_address(value: str) -> int:
    if value.lower() == "none":
        raise ValueError("address provided as 'none'; use the dedicated flag instead")
    return int(value, 16) if value.startswith(("0x", "0X")) else int(value)


def serialize_bytearray(value: str) -> List[int]:
    encoded = value.encode("utf-8")
    return [len(encoded), *encoded]


def serialize_option_address(value: Optional[str]) -> List[int]:
    if value is None or value.lower() == "none":
        return [1]  # None variant
    return [0, felt_from_address(value)]


def main() -> None:
    parser = argparse.ArgumentParser(description="Encode FullTokenContract constructor calldata.")
    parser.add_argument("--name", required=True, help="ERC721 name (string)")
    parser.add_argument("--symbol", required=True, help="ERC721 symbol (string)")
    parser.add_argument("--base-uri", required=True, help="ERC721 base URI (string)")
    parser.add_argument("--royalty-receiver", required=True, help="Royalty receiver address (felt)")
    parser.add_argument("--royalty-fraction", required=True, type=int, help="Royalty fraction (u128)")
    parser.add_argument(
        "--game-registry-address",
        default="none",
        help="Game registry contract address or 'none'",
    )
    parser.add_argument(
        "--event-relayer-address",
        default="none",
        help="Event relayer contract address or 'none'",
    )
    args = parser.parse_args()

    calldata: List[int] = []
    calldata += serialize_bytearray(args.name)
    calldata += serialize_bytearray(args.symbol)
    calldata += serialize_bytearray(args.base_uri)
    calldata.append(felt_from_address(args.royalty_receiver))
    calldata.append(args.royalty_fraction)
    calldata += serialize_option_address(args.game_registry_address)
    calldata += serialize_option_address(args.event_relayer_address)

    json.dump(calldata, sys.stdout)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()

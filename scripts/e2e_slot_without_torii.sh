#!/bin/bash
set -euo pipefail

WORKDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROFILE="slot"
GAME_TAG="zkube_v2_1_0-game_system"
MOVE_TAG="zkube_v2_1_0-move_system"
GAME_MODEL_TAG="zkube_v2_1_0-Game"
PLAYER_NAME="${PLAYER_NAME:-dj}"
SETTINGS_ID="${SETTINGS_ID:-0}"
MODE="${MODE:-0}"

run_execute() {
  sozo execute -P "$PROFILE" "$@" --wait --receipt
}

extract_receipt_json() {
  python3 - "$1" <<'PY'
import json
import re
import sys

raw = open(sys.argv[1], "r", encoding="utf-8").read()
m = re.search(r"Receipt:\s*(\{.*\})\s*$", raw, re.S)
if not m:
    raise SystemExit("Could not find receipt JSON in sozo output")

obj = json.loads(m.group(1))
print(json.dumps(obj))
PY
}

extract_game_id_from_receipt() {
  python3 - "$1" <<'PY'
import json
import sys

receipt = json.loads(open(sys.argv[1], "r", encoding="utf-8").read())

transfer = None
for ev in receipt.get("events", []):
    keys = ev.get("keys", [])
    data = ev.get("data", [])
    if len(keys) == 5 and len(data) == 0:
        transfer = ev
        break

if transfer is None:
    raise SystemExit("Transfer event not found in mint receipt")

low = int(transfer["keys"][3], 16)
high = int(transfer["keys"][4], 16)
game_id = low + (high << 128)
print(hex(game_id))
PY
}

extract_blocks_hex_from_model() {
  python3 - "$1" <<'PY'
import re
import sys

raw = open(sys.argv[1], "r", encoding="utf-8").read()
m = re.search(r"blocks\s*:\s*(0x[0-9a-fA-F]+)", raw)
if not m:
    raise SystemExit("Could not parse blocks from sozo model output")
print(m.group(1))
PY
}

select_simple_move() {
  python3 - "$1" <<'PY'
import sys

blocks = int(sys.argv[1], 16)
WIDTH = 8
HEIGHT = 10
BITS = 3
ROW_BITS = WIDTH * BITS

for r in range(HEIGHT):
    row = (blocks >> (r * ROW_BITS)) & ((1 << ROW_BITS) - 1)
    cells = [((row >> (c * BITS)) & 0x7) for c in range(WIDTH)]

    # Prefer width-1 block with adjacent empty cell for a low-risk move.
    for c in range(WIDTH):
        if cells[c] != 1:
            continue
        if c > 0 and cells[c - 1] == 0:
            print(f"{r} {c} {c-1}")
            raise SystemExit(0)
        if c < WIDTH - 1 and cells[c + 1] == 0:
            print(f"{r} {c} {c+1}")
            raise SystemExit(0)

raise SystemExit("No simple width-1 adjacent-empty move found")
PY
}

echo "[E2E] Minting game token via ${GAME_TAG}.mint_game ..."
MINT_OUT="$(mktemp)"
MINT_RECEIPT_JSON="$(mktemp)"

run_execute "$GAME_TAG" mint_game \
  0 sstr:"$PLAYER_NAME" \
  0 "$SETTINGS_ID" \
  1 1 1 1 1 1 1 \
  0x127fd5f1fe78a71f8bcd1fec63e3fe2f0486b6ecd5c86a0466c3a21fa5cfcec \
  0 0 0 0 > "$MINT_OUT"

extract_receipt_json "$MINT_OUT" > "$MINT_RECEIPT_JSON"
GAME_ID="$(extract_game_id_from_receipt "$MINT_RECEIPT_JSON")"
echo "[E2E] game_id (felt252 from Transfer low/high): ${GAME_ID}"

echo "[E2E] Creating run via ${GAME_TAG}.create(game_id, mode=${MODE}) ..."
CREATE_OUT="$(mktemp)"
run_execute "$GAME_TAG" create "$GAME_ID" "$MODE" > "$CREATE_OUT"
echo "[E2E] create succeeded"

echo "[E2E] Reading game model for move selection ..."
MODEL_OUT="$(mktemp)"
sozo model get -P "$PROFILE" "$GAME_MODEL_TAG" "$GAME_ID" > "$MODEL_OUT"
BLOCKS_HEX="$(extract_blocks_hex_from_model "$MODEL_OUT")"
MOVE_TRIPLE="$(select_simple_move "$BLOCKS_HEX")"
ROW_INDEX="$(printf "%s" "$MOVE_TRIPLE" | cut -d' ' -f1)"
START_INDEX="$(printf "%s" "$MOVE_TRIPLE" | cut -d' ' -f2)"
FINAL_INDEX="$(printf "%s" "$MOVE_TRIPLE" | cut -d' ' -f3)"

echo "[E2E] Executing move(row=${ROW_INDEX}, start=${START_INDEX}, final=${FINAL_INDEX}) ..."
MOVE_OUT="$(mktemp)"
run_execute "$MOVE_TAG" move "$GAME_ID" "$ROW_INDEX" "$START_INDEX" "$FINAL_INDEX" > "$MOVE_OUT"
echo "[E2E] move succeeded"

echo "[E2E] SUCCESS: deploy-independent mint/create/move flow works without Torii"
echo "[E2E] game_id=${GAME_ID}"

#!/bin/bash
set -e

# zkube Deployment Script for Slot
# This script handles the full deployment including FullTokenContract
#
# Workflow:
# 1. Build contracts
# 2. Declare FullTokenContract and MinigameRegistryContract classes
# 3. Deploy MinigameRegistryContract
# 4. Deploy FullTokenContract with registry address
# 5. Update dojo_slot.toml with denshokan address
# 6. Run sozo migrate to deploy Dojo world and initialize systems
# 7. Update torii config and client .env.slot with deployed addresses

NAMESPACE="zkube_budo_v1_2_0"
PROFILE="slot"
CONTRACTS_DIR="./contracts"
# Dojo 1.8+ stores manifest at workspace root as manifest_<profile>.json
MANIFEST_FILE="./manifest_slot.json"
DOJO_CONFIG="./dojo_slot.toml"
TORII_CONFIG="${CONTRACTS_DIR}/torii_slot.toml"
CLIENT_ENV="./client-budokan/.env.slot"
MOBILE_ENV="./mobile-app/.env.slot"
TARGET_DIR="./target/slot"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

ensure_model_writers() {
    # Ensure DraftState writers include all systems that modify it
    local draft_key="\"${NAMESPACE}-DraftState\""
    local draft_writers="${draft_key} = [\"${NAMESPACE}-draft_system\", \"${NAMESPACE}-game_system\", \"${NAMESPACE}-move_system\", \"${NAMESPACE}-bonus_system\", \"${NAMESPACE}-level_system\"]"
    if grep -q "^${draft_key} =" "$DOJO_CONFIG"; then
        sed -i "s|^${draft_key} = .*|${draft_writers}|" "$DOJO_CONFIG"
    else
        sed -i "/^\[writers\]$/a ${draft_writers}" "$DOJO_CONFIG"
    fi

    # Ensure Game model writers include draft_system
    local game_key="\"${NAMESPACE}-Game\""
    local game_writers="${game_key} = [\"${NAMESPACE}-game_system\", \"${NAMESPACE}-move_system\", \"${NAMESPACE}-bonus_system\", \"${NAMESPACE}-level_system\", \"${NAMESPACE}-grid_system\", \"${NAMESPACE}-draft_system\"]"
    if grep -q "^${game_key} =" "$DOJO_CONFIG"; then
        sed -i "s|^${game_key} = .*|${game_writers}|" "$DOJO_CONFIG"
    else
        sed -i "/^\[writers\]$/a ${game_writers}" "$DOJO_CONFIG"
    fi
}

# Get credentials from dojo config
get_credentials() {
    RPC_URL=$(grep "rpc_url" "$DOJO_CONFIG" | head -1 | cut -d'"' -f2)
    ACCOUNT_ADDRESS=$(grep "account_address" "$DOJO_CONFIG" | head -1 | cut -d'"' -f2)
    PRIVATE_KEY=$(grep "private_key" "$DOJO_CONFIG" | head -1 | cut -d'"' -f2)
}

get_config_cube_token_address() {
    sed -n "/\"${NAMESPACE}-config_system\" = \[/,/\]/p" "$DOJO_CONFIG" \
        | grep -oE '0x[0-9a-fA-F]+' \
        | sed -n '2p'
}

resolve_cube_token_address() {
    if [ -n "$CUBE_TOKEN_ADDRESS" ]; then
        EXTERNAL_CUBE_TOKEN="$CUBE_TOKEN_ADDRESS"
        print_info "Using external CubeToken from CUBE_TOKEN_ADDRESS: $EXTERNAL_CUBE_TOKEN"
        return
    fi

    EXTERNAL_CUBE_TOKEN=$(get_config_cube_token_address)
    if [ -z "$EXTERNAL_CUBE_TOKEN" ]; then
        print_error "Could not resolve external CubeToken address."
        print_error "Set CUBE_TOKEN_ADDRESS env var or add second address in ${NAMESPACE}-config_system init_call_args."
        exit 1
    fi

    print_info "Using external CubeToken from $DOJO_CONFIG: $EXTERNAL_CUBE_TOKEN"
}

# Extract address from sozo deploy output
extract_address() {
    local output="$1"
    # Look for "Address   : 0x..." pattern (sozo deploy output format)
    local addr=$(echo "$output" | grep -E "^\s*Address\s*:" | grep -oE '0x[0-9a-fA-F]+' | head -1)
    if [ -z "$addr" ]; then
        # Fallback: look for "deployed at" pattern
        addr=$(echo "$output" | grep -i "deployed at" | grep -oE '0x[0-9a-fA-F]+' | tail -1)
    fi
    echo "$addr"
}

# Extract class hash from sozo output
extract_class_hash() {
    local output="$1"
    # Try "class hash" pattern
    local hash=$(echo "$output" | grep -i "class hash" | grep -oE '0x[0-9a-fA-F]+' | tail -1)
    if [ -z "$hash" ]; then
        # Fallback
        hash=$(echo "$output" | grep -oE '0x[0-9a-fA-F]{64}' | head -1)
    fi
    echo "$hash"
}

echo "============================================"
echo "zkube Deployment to Slot"
echo "Namespace: $NAMESPACE"
echo "============================================"

#-----------------
# Step 1: Build
#-----------------
print_info "Step 1: Building contracts..."
sozo clean -P $PROFILE
sozo build -P $PROFILE
print_info "Build complete!"

#-----------------
# Step 2: Get credentials
#-----------------
get_credentials
print_info "Using RPC: $RPC_URL"
print_info "Account: $ACCOUNT_ADDRESS"
resolve_cube_token_address

#-----------------
# Step 3: Declare classes
#-----------------
print_info "Step 2: Declaring contract classes..."

# Declare MinigameRegistryContract
print_info "  Declaring MinigameRegistryContract..."
REGISTRY_OUTPUT=$(sozo declare -P $PROFILE \
    --account-address "$ACCOUNT_ADDRESS" \
    --private-key "$PRIVATE_KEY" \
    --rpc-url "$RPC_URL" \
    "${TARGET_DIR}/zkube_MinigameRegistryContract.contract_class.json" 2>&1) || true

REGISTRY_CLASS=$(extract_class_hash "$REGISTRY_OUTPUT")
if [ -z "$REGISTRY_CLASS" ]; then
    print_error "Failed to get MinigameRegistryContract class hash"
    echo "$REGISTRY_OUTPUT"
    exit 1
fi
print_info "  MinigameRegistryContract class: $REGISTRY_CLASS"

# Declare FullTokenContract
print_info "  Declaring FullTokenContract..."
TOKEN_OUTPUT=$(sozo declare -P $PROFILE \
    --account-address "$ACCOUNT_ADDRESS" \
    --private-key "$PRIVATE_KEY" \
    --rpc-url "$RPC_URL" \
    "${TARGET_DIR}/zkube_FullTokenContract.contract_class.json" 2>&1) || true

TOKEN_CLASS=$(extract_class_hash "$TOKEN_OUTPUT")
if [ -z "$TOKEN_CLASS" ]; then
    print_error "Failed to get FullTokenContract class hash"
    echo "$TOKEN_OUTPUT"
    exit 1
fi
print_info "  FullTokenContract class: $TOKEN_CLASS"

# Wait for nonce to sync after declares
sleep 2

#-----------------
# Step 4: Deploy MinigameRegistryContract
#-----------------
print_info "Step 3: Deploying MinigameRegistryContract..."

REGISTRY_DEPLOY_OUTPUT=$(sozo deploy -P $PROFILE \
    --account-address "$ACCOUNT_ADDRESS" \
    --private-key "$PRIVATE_KEY" \
    --rpc-url "$RPC_URL" \
    "$REGISTRY_CLASS" \
    --constructor-calldata \
        str:'zKube Registry' \
        str:'ZKUBEREG' \
        str:'' \
        1 \
    2>&1) || true

REGISTRY_ADDRESS=$(extract_address "$REGISTRY_DEPLOY_OUTPUT")
if [ -z "$REGISTRY_ADDRESS" ]; then
    print_error "Failed to get MinigameRegistryContract address"
    echo "$REGISTRY_DEPLOY_OUTPUT"
    exit 1
fi
print_info "  MinigameRegistryContract deployed at: $REGISTRY_ADDRESS"

# Wait for nonce to sync
sleep 1

#-----------------
# Step 5: Deploy FullTokenContract
#-----------------
print_info "Step 4: Deploying FullTokenContract..."

# Constructor: name, symbol, base_uri, royalty_receiver, royalty_fraction, game_registry (Option::Some), event_relayer (Option::None)
TOKEN_DEPLOY_OUTPUT=$(sozo deploy -P $PROFILE \
    --account-address "$ACCOUNT_ADDRESS" \
    --private-key "$PRIVATE_KEY" \
    --rpc-url "$RPC_URL" \
    "$TOKEN_CLASS" \
    --constructor-calldata \
        str:'zKube' \
        str:'ZK' \
        str:'' \
        "$ACCOUNT_ADDRESS" \
        500 \
        0 "$REGISTRY_ADDRESS" \
        1 \
    2>&1) || true

TOKEN_ADDRESS=$(extract_address "$TOKEN_DEPLOY_OUTPUT")
if [ -z "$TOKEN_ADDRESS" ]; then
    print_error "Failed to get FullTokenContract address"
    echo "$TOKEN_DEPLOY_OUTPUT"
    exit 1
fi
print_info "  FullTokenContract deployed at: $TOKEN_ADDRESS"

# Wait for contracts to be properly indexed by katana before migration
print_info "  Waiting for contracts to be indexed..."
sleep 5

#-----------------
# Step 6: Update dojo configs with denshokan address
#-----------------
print_info "Step 5: Updating dojo configuration..."

if [ -f "$DOJO_CONFIG" ]; then
    sed -i "s|\"0x[0-9a-fA-F]*\",  # denshokan_address|\"$TOKEN_ADDRESS\",  # denshokan_address|" "$DOJO_CONFIG"
    sed -i "/\"${NAMESPACE}-config_system\" = \[/,/\]/{/account address/ {n; s|\"0x[0-9a-fA-F]*\"|\"$EXTERNAL_CUBE_TOKEN\"|;}}" "$DOJO_CONFIG"
    ensure_model_writers
    print_info "  Updated $DOJO_CONFIG"
fi

#-----------------
# Step 7: Run sozo migrate (with retry loop)
#-----------------
print_info "Step 6: Running sozo migrate (from workspace root)..."

# CRITICAL: Must run from workspace root, NOT from contracts/
# Remote slot katana needs time to index newly deployed contracts.
MAX_ATTEMPTS=6
ATTEMPT=1
MIGRATE_SUCCESS=false

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    print_info "  Migration attempt $ATTEMPT/$MAX_ATTEMPTS..."
    MIGRATE_OUTPUT=$(sozo migrate -P $PROFILE 2>&1) || true
    echo "$MIGRATE_OUTPUT"

    if echo "$MIGRATE_OUTPUT" | grep -q "Migration failed"; then
        if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
            WAIT_TIME=$((30 + (ATTEMPT - 1) * 30))
            print_warn "Attempt $ATTEMPT failed. Waiting ${WAIT_TIME}s before retry..."
            sleep $WAIT_TIME
        else
            print_error "All $MAX_ATTEMPTS migration attempts failed."
        fi
        ATTEMPT=$((ATTEMPT + 1))
    else
        MIGRATE_SUCCESS=true
        break
    fi
done

if [ "$MIGRATE_SUCCESS" != "true" ]; then
    print_error "Migration failed after $MAX_ATTEMPTS attempts. Aborting."
    exit 1
fi

# Extract world address
WORLD_ADDRESS=$(echo "$MIGRATE_OUTPUT" | grep -oE 'world at address 0x[0-9a-fA-F]+' | grep -oE '0x[0-9a-fA-F]+')
if [ -z "$WORLD_ADDRESS" ]; then
    # Try from manifest
    if [ -f "$MANIFEST_FILE" ]; then
        WORLD_ADDRESS=$(cat "$MANIFEST_FILE" | jq -r '.world.address // empty' 2>/dev/null)
    fi
fi

if [ -z "$WORLD_ADDRESS" ]; then
    print_error "Failed to get world address"
    exit 1
fi
print_info "  World deployed at: $WORLD_ADDRESS"

#-----------------
# Step 8: Update dojo configs with world address
#-----------------
print_info "Step 7: Updating world address in configs..."

if [ -f "$DOJO_CONFIG" ]; then
    # Check if world_address exists, update or add
    if grep -q "^world_address = \"0x[0-9a-fA-F]*\"" "$DOJO_CONFIG"; then
        sed -i "s|world_address = \"0x[0-9a-fA-F]*\"|world_address = \"$WORLD_ADDRESS\"|" "$DOJO_CONFIG"
    else
        sed -i "/^private_key = /a world_address = \"$WORLD_ADDRESS\"" "$DOJO_CONFIG"
    fi
    print_info "  Updated $DOJO_CONFIG"
fi

#-----------------
# Step 9: Extract system addresses from manifest
#-----------------
print_info "Step 8: Extracting system addresses..."

GAME_SYSTEM=""
CONFIG_SYSTEM=""
MANIFEST_CUBE_TOKEN=""
MOVE_SYSTEM=""
QUEST_SYSTEM=""
SKILL_TREE_SYSTEM=""
CUBE_TOKEN="$EXTERNAL_CUBE_TOKEN"
if [ -f "$MANIFEST_FILE" ]; then
    GAME_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-game_system\") | .address" 2>/dev/null)
    CONFIG_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-config_system\") | .address" 2>/dev/null)
    MANIFEST_CUBE_TOKEN=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-cube_token\") | .address" 2>/dev/null)
    MOVE_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-move_system\") | .address" 2>/dev/null)
    QUEST_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-quest_system\") | .address" 2>/dev/null)
    SKILL_TREE_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-skill_tree_system\") | .address" 2>/dev/null)
fi

print_info "  External CubeToken configured at: $CUBE_TOKEN"
if [ -n "$MANIFEST_CUBE_TOKEN" ] && [ "$MANIFEST_CUBE_TOKEN" != "null" ] && [ "$MANIFEST_CUBE_TOKEN" != "$CUBE_TOKEN" ]; then
    print_warn "  Manifest world cube_token differs ($MANIFEST_CUBE_TOKEN). Using external CubeToken: $CUBE_TOKEN"
fi

#-----------------
# Step 9b: Grant MINTER_ROLE on world's cube_token (post-init fix for dojo_init race condition)
#-----------------
print_info "Step 8b: Granting MINTER_ROLE on world cube_token (via tag)..."
GRANT_WORLD_OUTPUT=$(sozo execute -P $PROFILE \
    --account-address "$ACCOUNT_ADDRESS" \
    --private-key "$PRIVATE_KEY" \
    --rpc-url "$RPC_URL" \
    "${NAMESPACE}-cube_token" \
    grant_minter_roles 2>&1) || true
if echo "$GRANT_WORLD_OUTPUT" | grep -q "Transaction hash"; then
    print_info "  MINTER_ROLE granted on world cube_token to all systems"
else
    print_warn "  Failed to grant MINTER_ROLE on world cube_token"
    echo "$GRANT_WORLD_OUTPUT"
fi

#-----------------
# Step 9c: Grant MINTER_ROLE on external CubeToken using explicit system addresses
# NOTE: grant_minter_roles resolves addresses via DNS from the cube_token's own world,
# which may differ from the current deployment. Use direct grant_role instead.
#-----------------
MINTER_ROLE_FELT="0x4d494e5445525f524f4c45"  # felt252 encoding of 'MINTER_ROLE'

grant_role_on_cube_token() {
    local system_name="$1"
    local system_addr="$2"
    if [ -z "$system_addr" ] || [ "$system_addr" = "null" ]; then
        print_warn "  Skipping $system_name (address not found in manifest)"
        return
    fi
    local OUTPUT=$(sozo execute -P $PROFILE \
        --account-address "$ACCOUNT_ADDRESS" \
        --private-key "$PRIVATE_KEY" \
        --rpc-url "$RPC_URL" \
        "$CUBE_TOKEN" \
        grant_role "$MINTER_ROLE_FELT" "$system_addr" 2>&1) || true
    if echo "$OUTPUT" | grep -q "Transaction hash"; then
        print_info "  MINTER_ROLE granted to $system_name ($system_addr)"
    else
        print_warn "  Failed to grant MINTER_ROLE to $system_name"
        echo "$OUTPUT"
    fi
}

if [ -n "$CUBE_TOKEN" ] && [ "$CUBE_TOKEN" != "$MANIFEST_CUBE_TOKEN" ]; then
    print_info "Step 8c: Granting MINTER_ROLE on external CubeToken ($CUBE_TOKEN)..."
    grant_role_on_cube_token "game_system" "$GAME_SYSTEM"
    grant_role_on_cube_token "move_system" "$MOVE_SYSTEM"
    grant_role_on_cube_token "quest_system" "$QUEST_SYSTEM"
    grant_role_on_cube_token "skill_tree_system" "$SKILL_TREE_SYSTEM"
elif [ -n "$CUBE_TOKEN" ]; then
    print_info "  External CubeToken matches world cube_token — roles already granted via tag"
fi

#-----------------
# Step 10: Update torii config (after extracting CUBE_TOKEN)
#-----------------
print_info "Step 9: Updating torii configuration..."

# Build contracts array for Torii config
TORII_CONTRACTS="\"erc721:$TOKEN_ADDRESS\""
if [ -n "$CUBE_TOKEN" ] && [ "$CUBE_TOKEN" != "null" ]; then
    TORII_CONTRACTS="$TORII_CONTRACTS,
  \"erc20:$CUBE_TOKEN\""
fi
if [ -n "$MANIFEST_CUBE_TOKEN" ] && [ "$MANIFEST_CUBE_TOKEN" != "null" ] && [ "$MANIFEST_CUBE_TOKEN" != "$CUBE_TOKEN" ]; then
    TORII_CONTRACTS="$TORII_CONTRACTS,
  \"erc20:$MANIFEST_CUBE_TOKEN\""
fi

cat > "$TORII_CONFIG" << EOF
world_address = "$WORLD_ADDRESS"
rpc = "$RPC_URL"

[indexing]
pending = true
transactions = true
namespaces = ["$NAMESPACE"]
contracts = [
  $TORII_CONTRACTS
]

[events]
raw = true

[sql]
historical = [
  "$NAMESPACE-TrophyProgression",
]
EOF

print_info "  Updated $TORII_CONFIG"

#-----------------
# Step 11: Copy manifest to contracts root (for client import)
#-----------------
print_info "Step 10: Copying manifest..."

# Client imports from contracts/manifest_slot.json
CONTRACTS_MANIFEST="${CONTRACTS_DIR}/manifest_slot.json"
if [ -f "$MANIFEST_FILE" ]; then
    cp "$MANIFEST_FILE" "$CONTRACTS_MANIFEST"
    print_info "  Copied manifest to $CONTRACTS_MANIFEST"
else
    print_warn "  Manifest not found at $MANIFEST_FILE"
fi

#-----------------
# Step 12: Update client .env.slot
#-----------------
print_info "Step 11: Updating client configuration..."

# Extract slot name from RPC URL (e.g., zkube-djizus from https://api.cartridge.gg/x/zkube-djizus/katana)
SLOT_NAME=$(echo "$RPC_URL" | sed 's|.*/x/\([^/]*\)/.*|\1|')
TORII_URL="${RPC_URL/katana/torii}"

cat > "$CLIENT_ENV" << EOF
# Slot deployment configuration
# Generated by deploy_slot.sh on $(date)
VITE_PUBLIC_DEPLOY_TYPE=slot
VITE_PUBLIC_SLOT=$SLOT_NAME
VITE_PUBLIC_NAMESPACE=$NAMESPACE
VITE_PUBLIC_NODE_URL=$RPC_URL
VITE_PUBLIC_TORII=$TORII_URL
VITE_PUBLIC_MASTER_ADDRESS=$ACCOUNT_ADDRESS
VITE_PUBLIC_MASTER_PRIVATE_KEY=$PRIVATE_KEY
VITE_PUBLIC_ACCOUNT_CLASS_HASH=0x05400e90f7e0ae78bd02c77cd75527280470e2fe19c54970dd79dc37a9d3645c
VITE_PUBLIC_FEE_TOKEN_ADDRESS=0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7

# Contract addresses
VITE_PUBLIC_WORLD_ADDRESS=$WORLD_ADDRESS
VITE_PUBLIC_GAME_TOKEN_ADDRESS=$TOKEN_ADDRESS
VITE_PUBLIC_CUBE_TOKEN_ADDRESS=$CUBE_TOKEN
EOF

print_info "  Updated $CLIENT_ENV"

if [ -d "$(dirname "$MOBILE_ENV")" ]; then
cat > "$MOBILE_ENV" << EOF
# Slot deployment configuration
# Generated by deploy_slot.sh on $(date)
VITE_PUBLIC_DEPLOY_TYPE=slot
VITE_PUBLIC_SLOT=$SLOT_NAME
VITE_PUBLIC_NAMESPACE=$NAMESPACE
VITE_PUBLIC_NODE_URL=$RPC_URL
VITE_PUBLIC_TORII=$TORII_URL

# Burner account (deployer) for local testing
VITE_PUBLIC_MASTER_ADDRESS=$ACCOUNT_ADDRESS
VITE_PUBLIC_MASTER_PRIVATE_KEY=$PRIVATE_KEY

# Contract addresses
VITE_PUBLIC_WORLD_ADDRESS=$WORLD_ADDRESS
VITE_PUBLIC_GAME_TOKEN_ADDRESS=$TOKEN_ADDRESS
VITE_PUBLIC_CUBE_TOKEN_ADDRESS=$CUBE_TOKEN
EOF

print_info "  Updated $MOBILE_ENV"
else
    print_warn "  Skipping mobile env update (directory missing): $(dirname "$MOBILE_ENV")"
fi

#-----------------
# Summary
#-----------------
echo ""
echo "============================================"
echo -e "${GREEN}DEPLOYMENT COMPLETE!${NC}"
echo "============================================"
echo ""
echo "Deployed Addresses:"
echo "-------------------"
echo "World:                    $WORLD_ADDRESS"
echo "FullTokenContract:        $TOKEN_ADDRESS"
echo "MinigameRegistryContract: $REGISTRY_ADDRESS"
echo "CubeToken (ERC20):        $CUBE_TOKEN"
echo "game_system:              $GAME_SYSTEM"
echo "config_system:            $CONFIG_SYSTEM"
echo ""
echo "Configuration files updated:"
echo "- $DOJO_CONFIG"
echo "- $TORII_CONFIG"
echo "- $CLIENT_ENV"
echo "- $MOBILE_ENV"
echo "- $CONTRACTS_MANIFEST"
echo ""
echo "Torii config world_address: $WORLD_ADDRESS"
echo ""
echo "Next steps:"
echo "  1. Start Torii indexer:"
echo "     torii --config $TORII_CONFIG"
echo ""
echo "  2. Start the client:"
echo "     cd client-budokan && pnpm slot"
echo ""

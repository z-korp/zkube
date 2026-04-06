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
# 7. Deploy ZStarToken with admin = account
# 8. Update dojo_slot.toml init args with zstar address
# 9. Update torii config and client .env.slot with deployed addresses

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
    :
}

get_namespace() {
    NAMESPACE=$(grep "^default" "$DOJO_CONFIG" | head -1 | cut -d'"' -f2)
    if [ -z "$NAMESPACE" ]; then
        print_error "Failed to read namespace.default from $DOJO_CONFIG"
        exit 1
    fi
}

# Get credentials from dojo config
get_credentials() {
    RPC_URL=$(grep "rpc_url" "$DOJO_CONFIG" | head -1 | cut -d'"' -f2)
    ACCOUNT_ADDRESS=$(grep "account_address" "$DOJO_CONFIG" | head -1 | cut -d'"' -f2)
    PRIVATE_KEY=$(grep "private_key" "$DOJO_CONFIG" | head -1 | cut -d'"' -f2)
}

resolve_cube_token_address() {
    EXTERNAL_CUBE_TOKEN="0x0"
    print_info "CubeToken removed in v1.3 — using zero address"
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

get_namespace

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
get_namespace
get_credentials
print_info "Using RPC: $RPC_URL"
print_info "Account: $ACCOUNT_ADDRESS"
print_info "Namespace: $NAMESPACE"
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
        "$ACCOUNT_ADDRESS" \
        500 \
        0 "$REGISTRY_ADDRESS" \
    2>&1) || true

TOKEN_ADDRESS=$(extract_address "$TOKEN_DEPLOY_OUTPUT")
if [ -z "$TOKEN_ADDRESS" ]; then
    print_error "Failed to get FullTokenContract address"
    echo "$TOKEN_DEPLOY_OUTPUT"
    exit 1
fi
print_info "  FullTokenContract deployed at: $TOKEN_ADDRESS"

# Wait for nonce to sync
sleep 2

#-----------------
# Step 5: Declare and deploy ZStarToken
#-----------------
print_info "Step 5: Declaring ZStarToken..."
ZSTAR_OUTPUT=$(sozo declare -P $PROFILE \
    --account-address "$ACCOUNT_ADDRESS" \
    --private-key "$PRIVATE_KEY" \
    --rpc-url "$RPC_URL" \
    "${TARGET_DIR}/zkube_ZStarToken.contract_class.json" 2>&1) || true

ZSTAR_CLASS=$(extract_class_hash "$ZSTAR_OUTPUT")
if [ -z "$ZSTAR_CLASS" ]; then
    print_error "Failed to get ZStarToken class hash"
    echo "$ZSTAR_OUTPUT"
    exit 1
fi
print_info "  ZStarToken class: $ZSTAR_CLASS"

sleep 1

print_info "  Deploying ZStarToken (admin=$ACCOUNT_ADDRESS)..."
ZSTAR_DEPLOY_OUTPUT=$(sozo deploy -P $PROFILE \
    --account-address "$ACCOUNT_ADDRESS" \
    --private-key "$PRIVATE_KEY" \
    --rpc-url "$RPC_URL" \
    "$ZSTAR_CLASS" \
    --constructor-calldata "$ACCOUNT_ADDRESS" \
    2>&1) || true

ZSTAR_ADDRESS=$(extract_address "$ZSTAR_DEPLOY_OUTPUT")
if [ -z "$ZSTAR_ADDRESS" ]; then
    print_error "Failed to get ZStarToken address"
    echo "$ZSTAR_DEPLOY_OUTPUT"
    exit 1
fi
print_info "  ZStarToken deployed at: $ZSTAR_ADDRESS"

print_info "  Waiting for contracts to be indexed..."
sleep 5

#-----------------
# Step 6: Update dojo configs with deployed addresses
#-----------------
print_info "Step 6: Updating dojo configuration..."

if [ -f "$DOJO_CONFIG" ]; then
    sed -i "s|\"0x[0-9a-fA-F]*\", # denshokan.*|\"$TOKEN_ADDRESS\", # denshokan|" "$DOJO_CONFIG"
    sed -i "s|\"0x[0-9a-fA-F]*\", # cube_token_address|\"$ZSTAR_ADDRESS\", # cube_token_address|" "$DOJO_CONFIG"
    print_info "  Updated $DOJO_CONFIG with denshokan + zstar addresses"
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
LEVEL_SYSTEM=""
STORY_SYSTEM=""
DAILY_CHALLENGE_SYSTEM=""
if [ -f "$MANIFEST_FILE" ]; then
    GAME_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-game_system\") | .address" 2>/dev/null)
    CONFIG_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-config_system\") | .address" 2>/dev/null)
    LEVEL_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-level_system\") | .address" 2>/dev/null)
    STORY_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-story_system\") | .address" 2>/dev/null)
    DAILY_CHALLENGE_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-daily_challenge_system\") | .address" 2>/dev/null)
fi

#-----------------
# Step 10: Grant ZStar roles to systems
#-----------------
print_info "Step 9: Granting ZStar roles..."

MINTER_ROLE_FELT="0x4d494e5445525f524f4c45"
BURNER_ROLE_FELT="0x4255524e45525f524f4c45"

grant_zstar_role() {
    local role_name="$1"
    local role_felt="$2"
    local system_name="$3"
    local system_addr="$4"

    if [ -z "$system_addr" ] || [ "$system_addr" = "null" ]; then
        print_warn "  Skipping $role_name for $system_name (address not found)"
        return
    fi

    local OUTPUT=$(sozo execute -P $PROFILE \
        --account-address "$ACCOUNT_ADDRESS" \
        --private-key "$PRIVATE_KEY" \
        --rpc-url "$RPC_URL" \
        "$ZSTAR_ADDRESS" \
        grant_role "$role_felt" "$system_addr" 2>&1) || true

    if echo "$OUTPUT" | grep -q "Transaction hash"; then
        print_info "  Granted $role_name to $system_name ($system_addr)"
    else
        print_warn "  Failed to grant $role_name to $system_name"
        echo "$OUTPUT"
    fi
    sleep 5
}

grant_zstar_role "MINTER_ROLE" "$MINTER_ROLE_FELT" "game_system" "$GAME_SYSTEM"
grant_zstar_role "MINTER_ROLE" "$MINTER_ROLE_FELT" "level_system" "$LEVEL_SYSTEM"
grant_zstar_role "MINTER_ROLE" "$MINTER_ROLE_FELT" "story_system" "$STORY_SYSTEM"
grant_zstar_role "MINTER_ROLE" "$MINTER_ROLE_FELT" "daily_challenge_system" "$DAILY_CHALLENGE_SYSTEM"
grant_zstar_role "MINTER_ROLE" "$MINTER_ROLE_FELT" "config_system" "$CONFIG_SYSTEM"
grant_zstar_role "BURNER_ROLE" "$BURNER_ROLE_FELT" "config_system" "$CONFIG_SYSTEM"

#-----------------
# Step 11: Update torii config
#-----------------
print_info "Step 10: Updating torii configuration..."

# Build contracts array for Torii config
cat > "$TORII_CONFIG" << EOF
world_address = "$WORLD_ADDRESS"
rpc = "$RPC_URL"

[indexing]
pending = true
transactions = true
namespaces = ["$NAMESPACE"]
contracts = [
  "erc721:$TOKEN_ADDRESS",
  "erc20:$ZSTAR_ADDRESS",
]

[events]
raw = true
EOF

print_info "  Updated $TORII_CONFIG"

#-----------------
# Step 12: Copy manifest to contracts root (for client import)
#-----------------
print_info "Step 11: Copying manifest..."

# Client imports from contracts/manifest_slot.json
CONTRACTS_MANIFEST="${CONTRACTS_DIR}/manifest_slot.json"
if [ -f "$MANIFEST_FILE" ]; then
    cp "$MANIFEST_FILE" "$CONTRACTS_MANIFEST"
    print_info "  Copied manifest to $CONTRACTS_MANIFEST"
else
    print_warn "  Manifest not found at $MANIFEST_FILE"
fi

#-----------------
# Step 13: Update client .env.slot
#-----------------
print_info "Step 12: Updating client configuration..."

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
VITE_PUBLIC_ZSTAR_TOKEN_ADDRESS=$ZSTAR_ADDRESS
EOF

print_info "  Updated $CLIENT_ENV"

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
echo "ZStarToken:               $ZSTAR_ADDRESS"
echo "game_system:              $GAME_SYSTEM"
echo "level_system:             $LEVEL_SYSTEM"
echo "story_system:             $STORY_SYSTEM"
echo "daily_challenge_system:   $DAILY_CHALLENGE_SYSTEM"
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

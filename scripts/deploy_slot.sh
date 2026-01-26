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
DOJO_CONFIG="${CONTRACTS_DIR}/dojo_slot.toml"
DOJO_CONFIG_ROOT="./dojo_slot.toml"
TORII_CONFIG="${CONTRACTS_DIR}/torii_slot.toml"
CLIENT_ENV="./client-budokan/.env.slot"
TARGET_DIR="./target/slot"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Get credentials from dojo config
get_credentials() {
    RPC_URL=$(grep "rpc_url" "$DOJO_CONFIG" | head -1 | cut -d'"' -f2)
    ACCOUNT_ADDRESS=$(grep "account_address" "$DOJO_CONFIG" | head -1 | cut -d'"' -f2)
    PRIVATE_KEY=$(grep "private_key" "$DOJO_CONFIG" | head -1 | cut -d'"' -f2)
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
    if [ -z "$addr" ]; then
        # Last fallback: find the last 64-char hex (usually the address)
        addr=$(echo "$output" | grep -oE '0x[0-9a-fA-F]{64}' | tail -1)
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
cd "$CONTRACTS_DIR"
sozo clean -P $PROFILE
sozo build -P $PROFILE
cd ..
print_info "Build complete!"

#-----------------
# Step 2: Get credentials
#-----------------
get_credentials
print_info "Using RPC: $RPC_URL"
print_info "Account: $ACCOUNT_ADDRESS"

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

#-----------------
# Step 6: Update dojo configs with denshokan address
#-----------------
print_info "Step 5: Updating dojo configuration..."

# Update denshokan_address in both config files using sed
for CONFIG in "$DOJO_CONFIG" "$DOJO_CONFIG_ROOT"; do
    if [ -f "$CONFIG" ]; then
        # Replace the denshokan_address line (second line in game_system init_call_args)
        sed -i "s|\"0x[0-9a-fA-F]*\",  # denshokan_address|\"$TOKEN_ADDRESS\",  # denshokan_address|" "$CONFIG"
        print_info "  Updated $CONFIG"
    fi
done

#-----------------
# Step 7: Run sozo migrate
#-----------------
print_info "Step 6: Running sozo migrate..."
cd "$CONTRACTS_DIR"

# First attempt
MIGRATE_OUTPUT=$(sozo migrate -P $PROFILE 2>&1) || true
echo "$MIGRATE_OUTPUT"

# Check if we need to retry (sometimes init fails first time)
if echo "$MIGRATE_OUTPUT" | grep -q "Migration failed"; then
    print_warn "First migration attempt failed, retrying..."
    sleep 2
    MIGRATE_OUTPUT=$(sozo migrate -P $PROFILE 2>&1) || true
    echo "$MIGRATE_OUTPUT"
fi

cd ..

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

for CONFIG in "$DOJO_CONFIG" "$DOJO_CONFIG_ROOT"; do
    if [ -f "$CONFIG" ]; then
        # Check if world_address exists, update or add
        if grep -q "world_address" "$CONFIG"; then
            sed -i "s|world_address = \"0x[0-9a-fA-F]*\"|world_address = \"$WORLD_ADDRESS\"|" "$CONFIG"
        else
            # Add after private_key line
            sed -i "/private_key/a world_address = \"$WORLD_ADDRESS\"" "$CONFIG"
        fi
        print_info "  Updated $CONFIG"
    fi
done

#-----------------
# Step 9: Update torii config
#-----------------
print_info "Step 8: Updating torii configuration..."

cat > "$TORII_CONFIG" << EOF
world_address = "$WORLD_ADDRESS"
rpc = "$RPC_URL"

[indexing]
pending = true
transactions = true
namespaces = ["$NAMESPACE"]
contracts = [
  "erc721:$TOKEN_ADDRESS"
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
# Step 10: Extract system addresses from manifest
#-----------------
print_info "Step 9: Extracting system addresses..."

GAME_SYSTEM=""
CONFIG_SYSTEM=""
if [ -f "$MANIFEST_FILE" ]; then
    GAME_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-game_system\") | .address" 2>/dev/null)
    CONFIG_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-config_system\") | .address" 2>/dev/null)
fi

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
echo "game_system:              $GAME_SYSTEM"
echo "config_system:            $CONFIG_SYSTEM"
echo ""
echo "Configuration files updated:"
echo "- $DOJO_CONFIG"
echo "- $DOJO_CONFIG_ROOT"
echo "- $TORII_CONFIG"
echo "- $CLIENT_ENV"
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

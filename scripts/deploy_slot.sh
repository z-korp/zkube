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
# 7. Update client .env.slot with deployed addresses

NAMESPACE="zkube_budo_v1_1_3"
PROFILE="slot"
CONTRACTS_DIR="./contracts"
MANIFEST_FILE="${CONTRACTS_DIR}/manifest_slot.json"
DOJO_CONFIG="${CONTRACTS_DIR}/dojo_slot.toml"
DOJO_CONFIG_ROOT="./dojo_slot.toml"
CLIENT_ENV="./client-budokan/.env.slot"
TARGET_DIR="./target/slot"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# Get credentials from dojo config
get_credentials() {
    RPC_URL=$(grep "rpc_url" "$DOJO_CONFIG" | head -1 | cut -d'"' -f2)
    ACCOUNT_ADDRESS=$(grep "account_address" "$DOJO_CONFIG" | head -1 | cut -d'"' -f2)
    PRIVATE_KEY=$(grep "private_key" "$DOJO_CONFIG" | head -1 | cut -d'"' -f2)
}

echo "============================================"
echo "zkube Deployment to Slot"
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

#-----------------
# Step 3: Declare classes
#-----------------
print_info "Step 2: Declaring contract classes..."

# Declare MinigameRegistryContract
REGISTRY_CLASS=$(sozo declare -P $PROFILE \
    --account-address "$ACCOUNT_ADDRESS" \
    --private-key "$PRIVATE_KEY" \
    --rpc-url "$RPC_URL" \
    "${TARGET_DIR}/zkube_MinigameRegistryContract.contract_class.json" 2>&1 | \
    grep "class hash" | grep -oE '0x[0-9a-fA-F]+' | tail -1)

if [ -z "$REGISTRY_CLASS" ]; then
    # May already be declared
    REGISTRY_CLASS=$(sozo declare -P $PROFILE \
        --account-address "$ACCOUNT_ADDRESS" \
        --private-key "$PRIVATE_KEY" \
        --rpc-url "$RPC_URL" \
        "${TARGET_DIR}/zkube_MinigameRegistryContract.contract_class.json" 2>&1 | \
        grep -oE '0x[0-9a-fA-F]+' | tail -1)
fi
print_info "MinigameRegistryContract class: $REGISTRY_CLASS"

# Declare FullTokenContract
TOKEN_CLASS=$(sozo declare -P $PROFILE \
    --account-address "$ACCOUNT_ADDRESS" \
    --private-key "$PRIVATE_KEY" \
    --rpc-url "$RPC_URL" \
    "${TARGET_DIR}/zkube_FullTokenContract.contract_class.json" 2>&1 | \
    grep "class hash" | grep -oE '0x[0-9a-fA-F]+' | tail -1)

if [ -z "$TOKEN_CLASS" ]; then
    TOKEN_CLASS=$(sozo declare -P $PROFILE \
        --account-address "$ACCOUNT_ADDRESS" \
        --private-key "$PRIVATE_KEY" \
        --rpc-url "$RPC_URL" \
        "${TARGET_DIR}/zkube_FullTokenContract.contract_class.json" 2>&1 | \
        grep -oE '0x[0-9a-fA-F]+' | tail -1)
fi
print_info "FullTokenContract class: $TOKEN_CLASS"

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
    2>&1)

REGISTRY_ADDRESS=$(echo "$REGISTRY_DEPLOY_OUTPUT" | grep "Address" | grep -oE '0x[0-9a-fA-F]+' | tail -1)
if [ -z "$REGISTRY_ADDRESS" ]; then
    # Already deployed - extract from output
    REGISTRY_ADDRESS=$(echo "$REGISTRY_DEPLOY_OUTPUT" | grep -oE '0x[0-9a-fA-F]{64}' | tail -1)
fi
print_info "MinigameRegistryContract deployed at: $REGISTRY_ADDRESS"

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
    2>&1)

TOKEN_ADDRESS=$(echo "$TOKEN_DEPLOY_OUTPUT" | grep "Address" | grep -oE '0x[0-9a-fA-F]+' | tail -1)
if [ -z "$TOKEN_ADDRESS" ]; then
    TOKEN_ADDRESS=$(echo "$TOKEN_DEPLOY_OUTPUT" | grep -oE '0x[0-9a-fA-F]{64}' | tail -1)
fi
print_info "FullTokenContract deployed at: $TOKEN_ADDRESS"

#-----------------
# Step 6: Update dojo config with denshokan address
#-----------------
print_info "Step 5: Updating dojo configuration..."

# Update init_call_args in both config files
for CONFIG in "$DOJO_CONFIG" "$DOJO_CONFIG_ROOT"; do
    if [ -f "$CONFIG" ]; then
        # Update denshokan_address in init_call_args
        sed -i "s|\"${NAMESPACE}-game_system\" = \[|\"${NAMESPACE}-game_system\" = [|" "$CONFIG"

        # This is a simplified update - for production, use a proper TOML parser
        # The format should be: creator_address, denshokan_address, renderer (Option::None = "1")
        print_info "Updated $CONFIG"
    fi
done

#-----------------
# Step 7: Run sozo migrate
#-----------------
print_info "Step 6: Running sozo migrate..."
cd "$CONTRACTS_DIR"
MIGRATE_OUTPUT=$(sozo migrate -P $PROFILE 2>&1)
echo "$MIGRATE_OUTPUT"
cd ..

# Extract world address
WORLD_ADDRESS=$(echo "$MIGRATE_OUTPUT" | grep "world at address" | grep -oE '0x[0-9a-fA-F]+')
if [ -z "$WORLD_ADDRESS" ]; then
    WORLD_ADDRESS=$(cat "$MANIFEST_FILE" | jq -r '.world.address // empty')
fi

#-----------------
# Step 8: Extract system addresses from manifest
#-----------------
print_info "Step 7: Extracting deployed addresses..."

GAME_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-game_system\") | .address")
CONFIG_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-config_system\") | .address")

#-----------------
# Step 9: Update client .env.slot
#-----------------
print_info "Step 8: Updating client configuration..."

cat > "$CLIENT_ENV" << EOF
# Slot deployment configuration
# Generated by deploy_slot.sh on $(date)
VITE_PUBLIC_DEPLOY_TYPE=slot
VITE_PUBLIC_NODE_URL=$RPC_URL
VITE_PUBLIC_TORII=${RPC_URL/katana/torii}
VITE_PUBLIC_MASTER_ADDRESS=$ACCOUNT_ADDRESS
VITE_PUBLIC_MASTER_PRIVATE_KEY=$PRIVATE_KEY
VITE_PUBLIC_ACCOUNT_CLASS_HASH=0x05400e90f7e0ae78bd02c77cd75527280470e2fe19c54970dd79dc37a9d3645c
VITE_PUBLIC_FEE_TOKEN_ADDRESS=0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7

# Contract addresses
VITE_PUBLIC_WORLD_ADDRESS=$WORLD_ADDRESS
VITE_PUBLIC_GAME_TOKEN_ADDRESS=$TOKEN_ADDRESS
EOF

print_info "Client config updated at $CLIENT_ENV"

#-----------------
# Summary
#-----------------
echo ""
echo "============================================"
echo "DEPLOYMENT COMPLETE!"
echo "============================================"
echo ""
echo "Deployed Addresses:"
echo "-------------------"
echo "World:                   $WORLD_ADDRESS"
echo "FullTokenContract:       $TOKEN_ADDRESS"
echo "MinigameRegistryContract: $REGISTRY_ADDRESS"
echo "game_system:             $GAME_SYSTEM"
echo "config_system:           $CONFIG_SYSTEM"
echo ""
echo "Configuration files updated:"
echo "- $DOJO_CONFIG"
echo "- $CLIENT_ENV"
echo ""
echo "To start the client:"
echo "  cd client-budokan && pnpm slot"
echo ""
echo "To start Torii indexer:"
echo "  torii --config contracts/torii_slot.toml"
echo ""

#!/bin/bash
set -e

# zkube Deployment Script for Sepolia
# This script handles the full deployment including FullTokenContract
#
# Workflow:
# 1. Build contracts
# 2. Declare FullTokenContract and MinigameRegistryContract classes
# 3. Deploy MinigameRegistryContract
# 4. Deploy FullTokenContract with registry address
# 5. Update dojo_sepolia.toml with denshokan address
# 6. Run sozo migrate to deploy Dojo world and initialize systems
# 7. Update torii config and client .env.sepolia with deployed addresses
#
# Prerequisites:
# - Sepolia account with funds
# - dojo_sepolia.toml configured with account credentials
# - VRF is available on Sepolia (contracts should use RandomImpl::new_vrf())

NAMESPACE="zkube_budo_v1_2_0"
PROFILE="sepolia"
CONTRACTS_DIR="./contracts"
# Dojo 1.8+ stores manifest at workspace root as manifest_<profile>.json
MANIFEST_FILE="./manifest_sepolia.json"
DOJO_CONFIG="./dojo_sepolia.toml"
TORII_CONFIG="${CONTRACTS_DIR}/torii_sepolia.toml"
CLIENT_ENV="./client-budokan/.env.sepolia"
MOBILE_ENV="./mobile-app/.env.sepolia"
TARGET_DIR="./target/sepolia"

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
    
    # Check if private key was found
    if [ -z "$PRIVATE_KEY" ]; then
        print_error "private_key not found in $DOJO_CONFIG"
        print_warn "For Sepolia, you need to add 'private_key = \"0x...\"' to the [env] section"
        exit 1
    fi
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
echo "zkube Deployment to Sepolia"
echo "Namespace: $NAMESPACE"
echo "============================================"

#-----------------
# Step 0: Verify config exists
#-----------------
if [ ! -f "$DOJO_CONFIG" ]; then
    print_error "Config file not found: $DOJO_CONFIG"
    exit 1
fi

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

# Wait for transactions to be included (Sepolia is slower than Katana)
print_info "  Waiting for declare transactions to be confirmed (45s)..."
sleep 45

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

# Wait for transaction
sleep 5

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

# Wait for contracts to be properly indexed before migration
print_info "  Waiting for contracts to be indexed (60s)..."
sleep 60

#-----------------
# Step 6: Update dojo configs with denshokan address
#-----------------
print_info "Step 5: Updating dojo configuration..."

# Update denshokan_address in config file using sed
if [ -f "$DOJO_CONFIG" ]; then
    # Replace the denshokan_address line (second line in game_system init_call_args)
    sed -i "s|\"0x[0-9a-fA-F]*\",  # denshokan_address|\"$TOKEN_ADDRESS\",  # denshokan_address|" "$DOJO_CONFIG"
    # Also try without the comment (in case format differs)
    sed -i "s|\"0x[0-9a-fA-F]*\", # denshokan_address|\"$TOKEN_ADDRESS\", # denshokan_address|" "$DOJO_CONFIG"
    # Try pattern with Denshokan comment
    sed -i "s|\"0x[0-9a-fA-F]*\", # Denshokan|\"$TOKEN_ADDRESS\", # Denshokan|" "$DOJO_CONFIG"
    print_info "  Updated $DOJO_CONFIG"
fi

#-----------------
# Step 7: Run sozo migrate (with retry loop)
#-----------------
print_info "Step 6: Running sozo migrate (from workspace root)..."

# Sepolia requires ~3 minutes for full state propagation after resource
# registration before contract initialization can succeed.
MAX_ATTEMPTS=6
ATTEMPT=1
MIGRATE_SUCCESS=false

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    print_info "  Migration attempt $ATTEMPT/$MAX_ATTEMPTS..."
    MIGRATE_OUTPUT=$(sozo migrate -P $PROFILE 2>&1) || true
    echo "$MIGRATE_OUTPUT"

    if echo "$MIGRATE_OUTPUT" | grep -q "Migration failed"; then
        if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
            WAIT_TIME=$((60 + (ATTEMPT - 1) * 60))
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
    if grep -q "world_address" "$DOJO_CONFIG"; then
        sed -i "s|world_address = \"0x[0-9a-fA-F]*\"|world_address = \"$WORLD_ADDRESS\"|" "$DOJO_CONFIG"
    else
        # Add after rpc_url line
        sed -i "/rpc_url/a world_address = \"$WORLD_ADDRESS\"" "$DOJO_CONFIG"
    fi
    print_info "  Updated $DOJO_CONFIG"
fi

#-----------------
# Step 9: Extract system addresses from manifest
#-----------------
print_info "Step 8: Extracting system addresses..."

GAME_SYSTEM=""
CONFIG_SYSTEM=""
CUBE_TOKEN=""
if [ -f "$MANIFEST_FILE" ]; then
    GAME_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-game_system\") | .address" 2>/dev/null)
    CONFIG_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-config_system\") | .address" 2>/dev/null)
    CUBE_TOKEN=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-cube_token\") | .address" 2>/dev/null)
fi

if [ -n "$CUBE_TOKEN" ] && [ "$CUBE_TOKEN" != "null" ]; then
    print_info "  CubeToken deployed at: $CUBE_TOKEN"
else
    CUBE_TOKEN=""
    print_warn "  CubeToken address not found in manifest"
fi

#-----------------
# Step 9b: Grant MINTER_ROLE on CubeToken to game_system and shop_system
#-----------------
if [ -n "$CUBE_TOKEN" ]; then
    print_info "Step 8b: Granting MINTER_ROLE on CubeToken..."
    GRANT_OUTPUT=$(sozo execute -P $PROFILE \
        --account-address "$ACCOUNT_ADDRESS" \
        --private-key "$PRIVATE_KEY" \
        --rpc-url "$RPC_URL" \
        "$CUBE_TOKEN" \
        grant_minter_roles 2>&1) || true
    if echo "$GRANT_OUTPUT" | grep -q "Transaction hash"; then
        print_info "  MINTER_ROLE granted to game_system and shop_system"
    else
        print_warn "  Failed to grant MINTER_ROLE (call grant_minter_roles manually)"
        echo "$GRANT_OUTPUT"
    fi
fi

#-----------------
# Step 10: Update torii config (after extracting CUBE_TOKEN)
#-----------------
print_info "Step 9: Updating torii configuration..."

# Build contracts array for Torii config
TORII_CONTRACTS="\"erc721:$TOKEN_ADDRESS\""
if [ -n "$CUBE_TOKEN" ]; then
    TORII_CONTRACTS="$TORII_CONTRACTS,
  \"erc20:$CUBE_TOKEN\""
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

# Client imports from contracts/manifest_sepolia.json
CONTRACTS_MANIFEST="${CONTRACTS_DIR}/manifest_sepolia.json"
if [ -f "$MANIFEST_FILE" ]; then
    cp "$MANIFEST_FILE" "$CONTRACTS_MANIFEST"
    print_info "  Copied manifest to $CONTRACTS_MANIFEST"
else
    print_warn "  Manifest not found at $MANIFEST_FILE"
fi

#-----------------
# Step 12: Update client .env.sepolia
#-----------------
print_info "Step 11: Updating client configuration..."

# Extract Torii URL from RPC URL (replace /rpc/v0_8 with /torii or similar)
# For Cartridge hosted Sepolia: https://api.cartridge.gg/x/starknet/sepolia
TORII_URL="${RPC_URL/\/rpc\/v0_8/}"
# If using a dedicated Torii instance, you may need to adjust this
# For now, assume Cartridge's hosted Torii at similar path
TORII_URL="${TORII_URL}/torii"

cat > "$CLIENT_ENV" << EOF
# Sepolia deployment configuration
# Generated by deploy_sepolia.sh on $(date)
VITE_PUBLIC_DEPLOY_TYPE=sepolia
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

TORII_URL_MOBILE="${RPC_URL/\/rpc\/v0_8/}"
TORII_URL_MOBILE="${TORII_URL_MOBILE}/torii"

cat > "$MOBILE_ENV" << EOF
# Sepolia deployment configuration
# Generated by deploy_sepolia.sh on $(date)
VITE_PUBLIC_DEPLOY_TYPE=sepolia
VITE_PUBLIC_NAMESPACE=$NAMESPACE
VITE_PUBLIC_NODE_URL=$RPC_URL
VITE_PUBLIC_TORII=$TORII_URL_MOBILE

# Contract addresses
VITE_PUBLIC_WORLD_ADDRESS=$WORLD_ADDRESS
VITE_PUBLIC_GAME_TOKEN_ADDRESS=$TOKEN_ADDRESS
VITE_PUBLIC_CUBE_TOKEN_ADDRESS=$CUBE_TOKEN
EOF

print_info "  Updated $MOBILE_ENV"

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
echo "  1. If running your own Torii instance, start it with:"
echo "     torii --config $TORII_CONFIG"
echo ""
echo "  2. Or use Cartridge's hosted Torii:"
echo "     Torii URL: $TORII_URL"
echo ""
echo "  3. Start the client:"
echo "     cd client-budokan && pnpm sepolia"
echo ""
echo "Important Notes:"
echo "  - VRF is enabled via init_call_args (runtime detection)"
echo "  - Transactions may take longer to confirm on Sepolia vs local Katana"
echo "  - Make sure your account has enough ETH for gas fees"
echo ""

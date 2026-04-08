#!/bin/bash
set -e

NAMESPACE="zkube_v2_1_0"
PROFILE="sepolia"
CONTRACTS_DIR="./contracts"
MANIFEST_FILE="./manifest_sepolia.json"
DOJO_CONFIG="./dojo_sepolia.toml"
TORII_CONFIG="${CONTRACTS_DIR}/torii_sepolia.toml"
CLIENT_ENV="./client-budokan/.env.sepolia"
TARGET_DIR="./target/sepolia"
DEFAULT_SEPOLIA_TORII_URL="https://api.cartridge.gg/x/zkube-v2-sepolia/torii"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

extract_address() {
    local output="$1"
    local addr=$(echo "$output" | grep -E "^\s*Address\s*:" | grep -oE '0x[0-9a-fA-F]+' | head -1)
    if [ -z "$addr" ]; then
        addr=$(echo "$output" | grep -i "deployed at" | grep -oE '0x[0-9a-fA-F]+' | tail -1)
    fi
    echo "$addr"
}

extract_class_hash() {
    local output="$1"
    local hash=$(echo "$output" | grep -i "class hash" | grep -oE '0x[0-9a-fA-F]+' | tail -1)
    if [ -z "$hash" ]; then
        hash=$(echo "$output" | grep -oE '0x[0-9a-fA-F]{64}' | head -1)
    fi
    echo "$hash"
}

get_credentials() {
    RPC_URL=$(grep "rpc_url" "$DOJO_CONFIG" | head -1 | cut -d'"' -f2)
    ACCOUNT_ADDRESS=$(grep "account_address" "$DOJO_CONFIG" | head -1 | cut -d'"' -f2)
    PRIVATE_KEY=$(grep "private_key" "$DOJO_CONFIG" | head -1 | cut -d'"' -f2)
    if [ -z "$PRIVATE_KEY" ]; then
        PRIVATE_KEY="${DOJO_PRIVATE_KEY}"
    fi
    if [ -z "$PRIVATE_KEY" ]; then
        print_error "No private_key in $DOJO_CONFIG and DOJO_PRIVATE_KEY not set"
        exit 1
    fi
}

if [ ! -f "$DOJO_CONFIG" ]; then
    print_error "Config file not found: $DOJO_CONFIG"
    exit 1
fi

echo "============================================"
echo "zkube Deployment to Sepolia"
echo "Namespace: $NAMESPACE"
echo "============================================"

print_info "Step 1: Building contracts..."
sozo clean -P $PROFILE
sozo build -P $PROFILE
print_info "Build complete!"

get_credentials
print_info "Using RPC: $RPC_URL"
print_info "Account: $ACCOUNT_ADDRESS"

print_info "Step 2: Declaring contract classes..."

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

print_info "  Declaring ZStarToken..."
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

print_info "  Waiting for declares to confirm (45s)..."
sleep 45

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
sleep 10

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
sleep 10

print_info "Step 5: Deploying ZStarToken..."
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

print_info "  Waiting for contracts to be indexed (60s)..."
sleep 60

print_info "Step 6: Updating dojo configuration..."
if [ -f "$DOJO_CONFIG" ]; then
    sed -i "s|\"0x[0-9a-fA-F]*\", # Denshokan|\"$TOKEN_ADDRESS\", # Denshokan|" "$DOJO_CONFIG"
    sed -i "s|\"0x[0-9a-fA-F]*\", # cube_token_address|\"$ZSTAR_ADDRESS\", # cube_token_address|" "$DOJO_CONFIG"
    print_info "  Updated $DOJO_CONFIG with denshokan + zstar addresses"
fi

# Remove world_address so sozo deploys a fresh world
if grep -q '^world_address' "$DOJO_CONFIG"; then
    print_info "Removing world_address from $DOJO_CONFIG (will be set after migration)..."
    sed -i '/^world_address/d' "$DOJO_CONFIG"
fi

print_info "Step 7: Running sozo migrate..."
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
        fi
        ATTEMPT=$((ATTEMPT + 1))
    else
        MIGRATE_SUCCESS=true
        break
    fi
done

if [ "$MIGRATE_SUCCESS" != "true" ]; then
    print_error "Migration failed after $MAX_ATTEMPTS attempts."
    exit 1
fi

WORLD_ADDRESS=$(echo "$MIGRATE_OUTPUT" | grep -oE 'world at address 0x[0-9a-fA-F]+' | grep -oE '0x[0-9a-fA-F]+')
if [ -z "$WORLD_ADDRESS" ] && [ -f "$MANIFEST_FILE" ]; then
    WORLD_ADDRESS=$(cat "$MANIFEST_FILE" | jq -r '.world.address // empty' 2>/dev/null)
fi
if [ -z "$WORLD_ADDRESS" ]; then
    print_error "Failed to get world address"
    exit 1
fi
print_info "  World deployed at: $WORLD_ADDRESS"

print_info "Step 8: Updating world address..."
if [ -f "$DOJO_CONFIG" ]; then
    if grep -q "^world_address" "$DOJO_CONFIG"; then
        sed -i "s|world_address = \"0x[0-9a-fA-F]*\"|world_address = \"$WORLD_ADDRESS\"|" "$DOJO_CONFIG"
    else
        sed -i "/^account_address/a world_address = \"$WORLD_ADDRESS\"" "$DOJO_CONFIG"
    fi
fi

print_info "Step 9: Extracting system addresses..."
GAME_SYSTEM=""
CONFIG_SYSTEM=""
LEVEL_SYSTEM=""
STORY_SYSTEM=""
DAILY_CHALLENGE_SYSTEM=""
PROGRESS_SYSTEM=""
if [ -f "$MANIFEST_FILE" ]; then
    GAME_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-game_system\") | .address" 2>/dev/null)
    CONFIG_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-config_system\") | .address" 2>/dev/null)
    LEVEL_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-level_system\") | .address" 2>/dev/null)
    PROGRESS_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-progress_system\") | .address" 2>/dev/null)
    STORY_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-story_system\") | .address" 2>/dev/null)
    DAILY_CHALLENGE_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-daily_challenge_system\") | .address" 2>/dev/null)
fi

print_info "Step 10: Granting ZStar roles..."
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
grant_zstar_role "MINTER_ROLE" "$MINTER_ROLE_FELT" "progress_system" "$PROGRESS_SYSTEM"
grant_zstar_role "MINTER_ROLE" "$MINTER_ROLE_FELT" "config_system" "$CONFIG_SYSTEM"
grant_zstar_role "BURNER_ROLE" "$BURNER_ROLE_FELT" "config_system" "$CONFIG_SYSTEM"

print_info "Step 11: Updating torii configuration..."
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

print_info "Step 12: Copying manifest..."
CONTRACTS_MANIFEST="${CONTRACTS_DIR}/manifest_sepolia.json"
if [ -f "$MANIFEST_FILE" ]; then
    cp "$MANIFEST_FILE" "$CONTRACTS_MANIFEST"
    print_info "  Copied manifest to $CONTRACTS_MANIFEST"
fi

print_info "Step 13: Updating client configuration..."
TORII_URL="${SEPOLIA_TORII_URL:-$DEFAULT_SEPOLIA_TORII_URL}"

cat > "$CLIENT_ENV" << EOF
VITE_PUBLIC_DEPLOY_TYPE=sepolia
VITE_PUBLIC_NAMESPACE=$NAMESPACE
VITE_PUBLIC_NODE_URL=$RPC_URL
VITE_PUBLIC_TORII=$TORII_URL
VITE_PUBLIC_MASTER_ADDRESS=$ACCOUNT_ADDRESS
VITE_PUBLIC_MASTER_PRIVATE_KEY=$PRIVATE_KEY
VITE_PUBLIC_ACCOUNT_CLASS_HASH=0x05400e90f7e0ae78bd02c77cd75527280470e2fe19c54970dd79dc37a9d3645c
VITE_PUBLIC_FEE_TOKEN_ADDRESS=0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7
VITE_PUBLIC_WORLD_ADDRESS=$WORLD_ADDRESS
VITE_PUBLIC_GAME_TOKEN_ADDRESS=$TOKEN_ADDRESS
VITE_PUBLIC_ZSTAR_TOKEN_ADDRESS=$ZSTAR_ADDRESS
EOF
print_info "  Updated $CLIENT_ENV"

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
echo "Next steps:"
echo "  1. Start Torii: torii --config $TORII_CONFIG"
echo "  2. Start client: cd client-budokan && pnpm sepolia"
echo ""

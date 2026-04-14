#!/bin/bash
set -e

NAMESPACE="zkube_v2_1_1"
PROFILE="mainnet"
CONTRACTS_DIR="./contracts"
MANIFEST_FILE="./manifest_mainnet.json"
DOJO_CONFIG="./dojo_mainnet.toml"
TORII_CONFIG="${CONTRACTS_DIR}/torii_mainnet.toml"
CLIENT_ENV="./client-budokan/.env.mainnet"
TARGET_DIR="./target/mainnet"

# Shared Denshokan (MinigameToken) on mainnet — no need to deploy our own
DENSHOKAN_ADDRESS="0x00263cc540dac11334470a64759e03952ee2f84a290e99ba8cbc391245cd0bf9"

# Treasury receives zone-purchase payments
TREASURY_ADDRESS="0x0629627561dF41f2d1A53538446eD9EE702943EDC6927BfE2fE7D26A3C8B7C57"

# USDC token on Starknet mainnet (6 decimals)
USDC_ADDRESS="0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb"

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
echo "zkube Deployment to MAINNET"
echo "Namespace: $NAMESPACE"
echo "Denshokan: $DENSHOKAN_ADDRESS"
echo "Treasury:  $TREASURY_ADDRESS"
echo "USDC:      $USDC_ADDRESS"
echo "============================================"
echo ""
echo "⚠️  THIS IS MAINNET — double-check addresses before proceeding!"
echo ""
read -p "Press ENTER to continue or Ctrl-C to abort..."

print_info "Step 1: Building contracts..."
sozo clean -P $PROFILE
sozo build -P $PROFILE
print_info "Build complete!"

get_credentials
print_info "Using RPC: $RPC_URL"
print_info "Account: $ACCOUNT_ADDRESS"

#-----------------
# Step 2-3: Deploy ZStarToken (skip if ZSTAR_ADDRESS already set)
#-----------------
if [ -n "$ZSTAR_ADDRESS" ] && [ "$ZSTAR_ADDRESS" != "0x0" ]; then
    print_info "Step 2-3: Skipping ZStarToken deploy — using existing: $ZSTAR_ADDRESS"
else
    print_info "Step 2: Declaring ZStarToken..."
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

    print_info "  Waiting for declare to confirm (60s)..."
    sleep 60

    print_info "Step 3: Deploying ZStarToken..."
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

    print_info "  Waiting for contract to be indexed (60s)..."
    sleep 60
fi

#-----------------
# Step 4: Update dojo config with ZStar address
#-----------------
print_info "Step 4: Updating dojo configuration..."
if [ -f "$DOJO_CONFIG" ]; then
    sed -i "s|\"0x[0-9a-fA-F]*\", # cube_token_address|\"$ZSTAR_ADDRESS\", # cube_token_address|" "$DOJO_CONFIG"
    print_info "  Updated $DOJO_CONFIG with zstar address"
fi

# Remove world_address so sozo deploys a fresh world
if grep -q '^world_address' "$DOJO_CONFIG"; then
    print_info "Removing world_address from $DOJO_CONFIG (will be set after migration)..."
    sed -i '/^world_address/d' "$DOJO_CONFIG"
fi

#-----------------
# Step 5: Run sozo migrate
#-----------------
print_info "Step 5: Running sozo migrate..."
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

#-----------------
# Step 6: Update world address
#-----------------
print_info "Step 6: Updating world address..."
if [ -f "$DOJO_CONFIG" ]; then
    if grep -q "^world_address" "$DOJO_CONFIG"; then
        sed -i "s|world_address = \"0x[0-9a-fA-F]*\"|world_address = \"$WORLD_ADDRESS\"|" "$DOJO_CONFIG"
    else
        sed -i "/^account_address/a world_address = \"$WORLD_ADDRESS\"" "$DOJO_CONFIG"
    fi
fi

#-----------------
# Step 7: Extract system addresses
#-----------------
print_info "Step 7: Extracting system addresses..."
GAME_SYSTEM=""
CONFIG_SYSTEM=""
LEVEL_SYSTEM=""
STORY_SYSTEM=""
DAILY_CHALLENGE_SYSTEM=""
WEEKLY_ENDLESS_SYSTEM=""
PROGRESS_SYSTEM=""
if [ -f "$MANIFEST_FILE" ]; then
    GAME_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-game_system\") | .address" 2>/dev/null)
    CONFIG_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-config_system\") | .address" 2>/dev/null)
    LEVEL_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-level_system\") | .address" 2>/dev/null)
    PROGRESS_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-progress_system\") | .address" 2>/dev/null)
    STORY_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-story_system\") | .address" 2>/dev/null)
    DAILY_CHALLENGE_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-daily_challenge_system\") | .address" 2>/dev/null)
    WEEKLY_ENDLESS_SYSTEM=$(cat "$MANIFEST_FILE" | jq -r ".contracts[] | select(.tag == \"${NAMESPACE}-weekly_endless_system\") | .address" 2>/dev/null)
fi

#-----------------
# Step 8: Grant ZStar roles
#-----------------
print_info "Step 8: Granting ZStar roles..."

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
grant_zstar_role "MINTER_ROLE" "$MINTER_ROLE_FELT" "weekly_endless_system" "$WEEKLY_ENDLESS_SYSTEM"
grant_zstar_role "MINTER_ROLE" "$MINTER_ROLE_FELT" "progress_system" "$PROGRESS_SYSTEM"
grant_zstar_role "MINTER_ROLE" "$MINTER_ROLE_FELT" "config_system" "$CONFIG_SYSTEM"
grant_zstar_role "BURNER_ROLE" "$BURNER_ROLE_FELT" "config_system" "$CONFIG_SYSTEM"

#-----------------
# Step 9: Set treasury
#-----------------
print_info "Step 9: Setting treasury..."
if [ -n "$CONFIG_SYSTEM" ] && [ "$CONFIG_SYSTEM" != "null" ]; then
    OUTPUT=$(sozo execute -P $PROFILE \
        --account-address "$ACCOUNT_ADDRESS" \
        --private-key "$PRIVATE_KEY" \
        --rpc-url "$RPC_URL" \
        "$CONFIG_SYSTEM" \
        set_treasury "$TREASURY_ADDRESS" 2>&1) || true
    if echo "$OUTPUT" | grep -q "Transaction hash"; then
        print_info "  Treasury set to $TREASURY_ADDRESS"
    else
        print_warn "  Failed to set treasury"
        echo "$OUTPUT"
    fi
    sleep 5
fi

#-----------------
# Step 10: Set zone pricing (USDC, 6 decimals)
#-----------------
print_info "Step 10: Setting zone pricing..."

# 5 USDC = 5_000_000 (6 decimals), star_cost = 100
# 10 USDC = 10_000_000 (6 decimals), star_cost = 200
set_zone_pricing() {
    local settings_id="$1"
    local zone_name="$2"
    local price="$3"
    local star_cost="$4"

    if [ -z "$CONFIG_SYSTEM" ] || [ "$CONFIG_SYSTEM" = "null" ]; then
        print_warn "  Skipping zone pricing (config_system address not found)"
        return
    fi

    # set_zone_pricing(settings_id, is_free=false, price, payment_token=USDC, star_cost)
    local OUTPUT=$(sozo execute -P $PROFILE \
        --account-address "$ACCOUNT_ADDRESS" \
        --private-key "$PRIVATE_KEY" \
        --rpc-url "$RPC_URL" \
        "$CONFIG_SYSTEM" \
        set_zone_pricing "$settings_id" 0 "$price" "$USDC_ADDRESS" "$star_cost" 2>&1) || true

    if echo "$OUTPUT" | grep -q "Transaction hash"; then
        print_info "  Set $zone_name (id=$settings_id) → price=$price, star_cost=$star_cost"
    else
        print_warn "  Failed to set pricing for $zone_name"
        echo "$OUTPUT"
    fi
    sleep 5
}

# Zone 1 (id=0) is free — skip
# Tier 1: Zones 2-4 at 5 USDC + 100 stars
set_zone_pricing 2  "Zone 2 (Egypt)"   5000000 100
set_zone_pricing 4  "Zone 3 (Norse)"   5000000 100
set_zone_pricing 6  "Zone 4 (Greece)"  5000000 100
# Tier 2: Zones 5-7 at 10 USDC + 200 stars (disabled at launch)
set_zone_pricing 8  "Zone 5 (China)"   10000000 200
set_zone_pricing 10 "Zone 6 (Persia)"  10000000 200
set_zone_pricing 12 "Zone 7 (Japan)"   10000000 200
# Tier 3: Zones 8-10 at 10 USDC + 200 stars (disabled at launch)
set_zone_pricing 14 "Zone 8 (Mayan)"   10000000 200
set_zone_pricing 16 "Zone 9 (Tribal)"  10000000 200
set_zone_pricing 18 "Zone 10 (Inca)"   10000000 200

#-----------------
# Step 11: Disable settings not live at launch
#-----------------
print_info "Step 11: Disabling settings not live at launch..."

disable_settings() {
    local settings_id="$1"
    local desc="$2"

    if [ -z "$CONFIG_SYSTEM" ] || [ "$CONFIG_SYSTEM" = "null" ]; then
        print_warn "  Skipping disable (config_system address not found)"
        return
    fi

    local OUTPUT=$(sozo execute -P $PROFILE \
        --account-address "$ACCOUNT_ADDRESS" \
        --private-key "$PRIVATE_KEY" \
        --rpc-url "$RPC_URL" \
        "$CONFIG_SYSTEM" \
        set_zone_enabled "$settings_id" 0 2>&1) || true

    if echo "$OUTPUT" | grep -q "Transaction hash"; then
        print_info "  Disabled $desc (id=$settings_id)"
    else
        print_warn "  Failed to disable $desc"
        echo "$OUTPUT"
    fi
    sleep 5
}

# Disable all endless settings (odd IDs 1-19)
disable_settings 1  "Z1 endless"
disable_settings 3  "Z2 endless"
disable_settings 5  "Z3 endless"
disable_settings 7  "Z4 endless"
disable_settings 9  "Z5 endless"
disable_settings 11 "Z6 endless"
disable_settings 13 "Z7 endless"
disable_settings 15 "Z8 endless"
disable_settings 17 "Z9 endless"
disable_settings 19 "Z10 endless"

# Disable Z5-Z10 map settings (even IDs 8-18)
disable_settings 8  "Z5 map (China)"
disable_settings 10 "Z6 map (Persia)"
disable_settings 12 "Z7 map (Japan)"
disable_settings 14 "Z8 map (Mayan)"
disable_settings 16 "Z9 map (Tribal)"
disable_settings 18 "Z10 map (Inca)"

#-----------------
# Step 12: Update torii config
#-----------------
print_info "Step 12: Updating torii configuration..."
cat > "$TORII_CONFIG" << EOF
world_address = "$WORLD_ADDRESS"
rpc = "$RPC_URL"

[indexing]
pending = true
transactions = true
namespaces = ["$NAMESPACE"]
contracts = [
  "erc721:$DENSHOKAN_ADDRESS",
  "erc20:$ZSTAR_ADDRESS",
]

[events]
raw = true
EOF
print_info "  Updated $TORII_CONFIG"

#-----------------
# Step 13: Copy manifest
#-----------------
print_info "Step 13: Copying manifest..."
CONTRACTS_MANIFEST="${CONTRACTS_DIR}/manifest_mainnet.json"
if [ -f "$MANIFEST_FILE" ]; then
    cp "$MANIFEST_FILE" "$CONTRACTS_MANIFEST"
    print_info "  Copied manifest to $CONTRACTS_MANIFEST"
fi

#-----------------
# Step 14: Update client config
#-----------------
print_info "Step 14: Updating client configuration..."
TORII_URL="${MAINNET_TORII_URL:-https://api.cartridge.gg/x/zkube-mainnet/torii}"

cat > "$CLIENT_ENV" << EOF
VITE_PUBLIC_DEPLOY_TYPE=mainnet
VITE_PUBLIC_NAMESPACE=$NAMESPACE
VITE_PUBLIC_NODE_URL=$RPC_URL
VITE_PUBLIC_TORII=$TORII_URL
VITE_PUBLIC_MASTER_ADDRESS=$ACCOUNT_ADDRESS
VITE_PUBLIC_ACCOUNT_CLASS_HASH=0x05400e90f7e0ae78bd02c77cd75527280470e2fe19c54970dd79dc37a9d3645c
VITE_PUBLIC_FEE_TOKEN_ADDRESS=0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7
VITE_PUBLIC_WORLD_ADDRESS=$WORLD_ADDRESS
VITE_PUBLIC_GAME_TOKEN_ADDRESS=$DENSHOKAN_ADDRESS
VITE_PUBLIC_ZSTAR_TOKEN_ADDRESS=$ZSTAR_ADDRESS
EOF
print_info "  Updated $CLIENT_ENV"

echo ""
echo "============================================"
echo -e "${GREEN}MAINNET DEPLOYMENT COMPLETE!${NC}"
echo "============================================"
echo ""
echo "Deployed Addresses:"
echo "-------------------"
echo "World:                    $WORLD_ADDRESS"
echo "Denshokan (shared):       $DENSHOKAN_ADDRESS"
echo "ZStarToken:               $ZSTAR_ADDRESS"
echo "Treasury:                 $TREASURY_ADDRESS"
echo "game_system:              $GAME_SYSTEM"
echo "level_system:             $LEVEL_SYSTEM"
echo "story_system:             $STORY_SYSTEM"
echo "daily_challenge_system:   $DAILY_CHALLENGE_SYSTEM"
echo "weekly_endless_system:    $WEEKLY_ENDLESS_SYSTEM"
echo "config_system:            $CONFIG_SYSTEM"
echo ""
echo "Enabled at launch:"
echo "  - Z1 Tiki (free)"
echo "  - Z2 Egypt, Z3 Norse, Z4 Greece (5 USDC / 100 stars)"
echo "  - Tournament Tiki (free, settings_id=51)"
echo ""
echo "Disabled (enable later via set_zone_enabled):"
echo "  - All endless modes (1,3,5,...,19)"
echo "  - Z5-Z10 maps (8,10,12,14,16,18)"
echo ""
echo "Next steps:"
echo "  1. Start Torii: torii --config $TORII_CONFIG"
echo "  2. Start client: cd client-budokan && pnpm mainnet"
echo ""

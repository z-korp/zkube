# Fake LORD Token

ERC20 token with faucet for testing/development.

For detailed documentation, see [CLAUDE.md](./CLAUDE.md).

## Build & Deploy

```bash
cd packages/token
scarb build

# Deploy using starkli
starkli declare --watch target/dev/token_token.contract_class.json
starkli deploy <class_hash> <owner_address>
```

## Notes

- Development/testing only - production uses real LORD token
- Faucet: 1000 tokens per claim, 24-hour cooldown

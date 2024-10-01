# token

This is a token contract with a faucet mechanism that is goin to be used on devnets

- `asdf global scarb 2.7.0`
- `scarb build``
- `starkli declare --watch target/dev/token_token.contract_class.json --compiler-version 2.7.1``
- `starkli deploy <class_hash> <owner_address>`
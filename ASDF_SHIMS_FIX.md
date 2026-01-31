# ASDF Shims Fix

## Problem

The asdf shims at `~/.asdf/shims/` were broken because they called `exec asdf exec ...` but the `asdf` command itself wasn't in the PATH (incomplete asdf installation - only shims and installs existed, no asdf binary).

```bash
# Broken shim content:
#!/usr/bin/env bash
exec asdf exec "sozo" "$@"
# ERROR: asdf: not found
```

## Solution

Replace the shims with direct calls to the installed binaries.

### Fixed Shims

| Tool | Shim Path | Points To |
|------|-----------|-----------|
| sozo | `~/.asdf/shims/sozo` | `~/.asdf/installs/sozo/1.8.6/bin/sozo` |
| scarb | `~/.asdf/shims/scarb` | `~/.asdf/installs/scarb/2.15.1/bin/scarb` |
| torii | `~/.asdf/shims/torii` | `~/.asdf/installs/torii/1.8.14/bin/torii` |
| katana | `~/.asdf/shims/katana` | `~/.asdf/installs/katana/1.7.1/bin/katana` |
| scarb-* | `~/.asdf/shims/scarb-*` | `~/.asdf/installs/scarb/2.15.1/bin/scarb-*` |

### Fix Commands

```bash
# Fix sozo
cat > ~/.asdf/shims/sozo << 'EOF'
#!/usr/bin/env bash
exec "$HOME/.asdf/installs/sozo/1.8.6/bin/sozo" "$@"
EOF
chmod +x ~/.asdf/shims/sozo

# Fix scarb
cat > ~/.asdf/shims/scarb << 'EOF'
#!/usr/bin/env bash
exec "$HOME/.asdf/installs/scarb/2.15.1/bin/scarb" "$@"
EOF
chmod +x ~/.asdf/shims/scarb

# Fix torii
cat > ~/.asdf/shims/torii << 'EOF'
#!/usr/bin/env bash
exec "$HOME/.asdf/installs/torii/1.8.14/bin/torii" "$@"
EOF
chmod +x ~/.asdf/shims/torii

# Fix katana
cat > ~/.asdf/shims/katana << 'EOF'
#!/usr/bin/env bash
exec "$HOME/.asdf/installs/katana/1.7.1/bin/katana" "$@"
EOF
chmod +x ~/.asdf/shims/katana

# Fix scarb-related tools
SCARB_BIN="$HOME/.asdf/installs/scarb/2.15.1/bin"
for tool in scarb-cairo-language-server scarb-cairo-test scarb-doc scarb-execute scarb-mdbook scarb-prove scarb-verify; do
    cat > ~/.asdf/shims/$tool << EOF
#!/usr/bin/env bash
exec "$SCARB_BIN/$tool" "\$@"
EOF
    chmod +x ~/.asdf/shims/$tool
done
```

## Updating Versions

When installing new versions via asdf, you'll need to update the shims manually:

```bash
# After: asdf install sozo 1.9.0
cat > ~/.asdf/shims/sozo << 'EOF'
#!/usr/bin/env bash
exec "$HOME/.asdf/installs/sozo/1.9.0/bin/sozo" "$@"
EOF
chmod +x ~/.asdf/shims/sozo
```

## Current Installed Versions

- sozo: 1.8.6
- scarb: 2.15.1
- torii: 1.8.14
- katana: 1.7.1

## Verification

```bash
sozo --version   # sozo 1.8.6
scarb --version  # scarb 2.15.1
torii --version  # torii 1.8.14
katana --version # katana 1.7.1
```

# zKube Assets

## Overview

Game assets including graphics, sounds, and branding materials.

## Directory Structure

```
assets/
├── zkube.png              # Main logo (508KB)
├── gameplay.png           # Gameplay screenshot
├── overview.png           # Overview screenshot
├── palmtree.png           # Background element (302KB)
├── items/                 # Game item sprites
├── bonus/                 # Bonus effect visuals
├── graphics/              # Game graphics and UI elements
├── identity/              # Branding materials
├── scenes/                # Scene backgrounds
├── sounds/                # Audio files
│   ├── background music
│   └── sound effects
└── gimp/                  # GIMP source files (.xcf)
```

## Usage in Frontend

Assets are referenced in the React frontend:

```typescript
// Example: importing assets
import logo from '@/assets/zkube.png';

// Sound files used via use-sound hook
import useSound from 'use-sound';
const [playEffect] = useSound('/assets/sounds/effect.mp3');
```

## Asset Types

### Images
- PNG format for transparency support
- Optimized for web delivery

### Audio
- Background music for gameplay
- Sound effects for:
  - Block movements
  - Line clears
  - Combos
  - Bonus activation
  - Game over

### Source Files
GIMP (.xcf) source files in `gimp/` for editing original artwork.

## Notes

- Large assets may impact load times
- Audio files should be compressed appropriately
- Consider lazy loading for non-critical assets

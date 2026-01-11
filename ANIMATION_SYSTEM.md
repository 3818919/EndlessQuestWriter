# Character Animation System

This document explains how the animated character preview works in the EO Pub Editor.

## Overview

The character animator displays equipment items on a male character sprite with appropriate animations:
- **Armor items** (type 12): Walking animation (4 frames)
- **Weapon items** (type 10): Attacking animation (2 frames)
- **Shield/Back items** (type 11): Attacking animation

## Architecture

### CharacterAnimator Class
Located in `src/character-animator.js`, this class handles:
- Loading character sprite sheets from multiple GFX files
- Compositing layered sprites (skin + equipment)
- Animating between frames
- Rendering to HTML5 canvas

### Sprite Layers
Character sprites are rendered in layers (bottom to top):
1. **Skin**: Base character skin from GFX008
2. **Armor**: Armor sprites from GFX013 (male)
3. **Weapon**: Weapon sprites from GFX017 (male)
4. **Back/Shield**: Shield sprites from GFX019 (male)

### Animation States

#### Standing
- Single static sprite for each layer
- Used for non-equippable items

#### Walking
- 4 frames of animation
- Frame delay: 9 game ticks per frame
- Direction: Down (facing camera)
- Sprites:
  - Skin: GFX008 #2 (sprite sheet with 16 columns)
  - Armor: Base graphic + offsets 3-6

#### Attacking
- 2 frames for melee weapons
- 1 frame for ranged weapons (bow)
- Frame delay: 12 game ticks per frame
- Direction: Down (facing camera)
- Sprites:
  - Skin: GFX008 #3 (melee) or #7 (bow)
  - Weapon: Base graphic + offsets 13-14 (SwingFrame1/2)

## GFX Resource Mapping

### Skin Sprites (GFX008)
The skin sprite sheet contains multiple GFX resources:
- **GFX 1**: Standing poses (4 directions, 2 genders, 7 races)
- **GFX 2**: Walking animation (16 columns: 4 directions × 4 frames)
- **GFX 3**: Melee attacking (8 columns: 4 directions × 2 frames)
- **GFX 7**: Bow/ranged attacking (4 columns: 4 directions × 1 frame)

Each skin sheet has:
- **7 rows**: One for each race (0-6)
- **Multiple columns**: Organized by gender, direction, and frame

### Equipment Sprites
Equipment graphics are organized with a base offset calculation:

**Armor** (50 sprites per item):
```
baseGraphic = (graphicId - 1) * 50 + 1
```

Sprite types (offsets from base):
- Standing: +1
- WalkFrame1: +3
- WalkFrame2: +4
- WalkFrame3: +5
- WalkFrame4: +6

**Weapons** (100 sprites per item):
```
baseGraphic = (graphicId - 1) * 100 + 1
```

Sprite types (offsets from base):
- Standing: +1
- SwingFrame1: +13
- SwingFrame2: +14

**Shields/Back Items** (50 sprites per item):
```
baseGraphic = (graphicId - 1) * 50 + 1
```

Sprite types (offsets from base):
- Standing: +1
- ShieldItemOnBack_AttackingWithBow: +3

## Canvas Rendering

The animator uses an HTML5 canvas with:
- Size: 400x400 pixels
- Image smoothing: Disabled (pixelated rendering)
- Compositing: Layers drawn sequentially

### Drawing Process

1. Clear canvas
2. Calculate center position
3. Draw skin sprite (with frame calculation for sprite sheets)
4. Draw equipment sprites (centered over character)
5. Request next animation frame

### Frame Updates

The animation loop uses `requestAnimationFrame` and tracks:
- `currentFrame`: Current animation frame (0-3 for walking, 0-1 for attacking)
- `frameTimer`: Counter to delay frame changes
- `state`: Current animation state ('standing', 'walking', 'attacking')

## Integration with UI

### Preview Mode Toggle
Two buttons in the preview panel:
- **Static**: Shows item's inventory graphic (default)
- **Animated**: Shows character with equipment and animation

### Mode Switching
When switching to animated mode:
1. Create canvas element (400x400)
2. Initialize animator with canvas
3. Load character sprites based on item type
4. Start animation loop

When switching to static mode:
1. Stop animation loop
2. Clear canvas
3. Display item graphic as static image

## Performance Considerations

- **Caching**: GFX data is cached after first load
- **Lazy Loading**: Character sprites only load in animated mode
- **Resource Cleanup**: Animator stops when preview is cleared or mode changes
- **Efficient Rendering**: Only redraws on frame changes

## Future Enhancements

Possible improvements to the animation system:
- [ ] Add direction controls (up, down, left, right)
- [ ] Support female character sprites
- [ ] Add race selection
- [ ] Include boots, gloves, hats in preview
- [ ] Add spell casting animation
- [ ] Support sitting animations
- [ ] Customize background color/image
- [ ] Add zoom controls
- [ ] Export animation as GIF

## References

Based on EndlessClient's character rendering system:
- `CharacterSpriteCalculator.cs`: Sprite offset calculations
- `CharacterAnimator.cs`: Animation timing and state management
- `ArmorShieldSpriteType.cs`, `WeaponSpriteType.cs`: Sprite type enums

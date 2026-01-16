/**
 * Character animation renderer
 * Handles drawing sprite layers to canvas with proper positioning and offsets
 */

import {
  BOOTS_OFFSETS,
  ARMOR_OFFSETS,
  HAT_OFFSETS,
  WEAPON_OFFSETS,
  SHIELD_OFFSETS,
  HAIR_OFFSETS,
  BACK_OFFSETS
} from './offsets';

import {
  Gender,
  CharacterFrame,
  WEAPON_VISIBLE,
  WEAPON_FRAME_MAP,
  GenderType,
  CharacterFrameType
} from './constants';

interface SpriteData {
  image: HTMLImageElement | null;
  width: number;
  height: number;
}

type AnimationState = 'standing' | 'walking' | 'attacking' | 'sitting' | 'spell';
type Direction = 'down' | 'up' | 'left' | 'right';

/**
 * Get the current CharacterFrame enum value based on state, direction, and frame
 */
export function getCurrentCharacterFrame(state: AnimationState, direction: Direction, currentFrame: number): CharacterFrameType {
  if (state === 'standing') {
    // Standing: only 2 frames (down/right or up/left based on direction)
    return direction === 'down' || direction === 'right' 
      ? CharacterFrame.StandingDownRight 
      : CharacterFrame.StandingUpLeft;
  } else if (state === 'walking') {
    // Walking: 4 frames per direction
    const isDownRight = direction === 'down' || direction === 'right';
    const baseFrame = isDownRight ? CharacterFrame.WalkingDownRight1 : CharacterFrame.WalkingUpLeft1;
    return (baseFrame + currentFrame) as CharacterFrameType;
  } else if (state === 'attacking') {
    // Attacking: 2 frames per direction
    const isDownRight = direction === 'down' || direction === 'right';
    const baseFrame = isDownRight ? CharacterFrame.MeleeAttackDownRight1 : CharacterFrame.MeleeAttackUpLeft1;
    return (baseFrame + currentFrame) as CharacterFrameType;
  }
  return CharacterFrame.StandingDownRight; // default
}

/**
 * Get offset for a specific equipment type
 */
export function getEquipmentOffset(
  offsetTable: Record<GenderType, Partial<Record<CharacterFrameType, { x: number; y: number }>>>,
  gender: GenderType,
  state: AnimationState,
  direction: Direction,
  currentFrame: number
): { x: number; y: number } {
  const frame = getCurrentCharacterFrame(state, direction, currentFrame);
  const genderKey = gender === 0 ? Gender.Female : Gender.Male;
  const offset = offsetTable?.[genderKey]?.[frame];
  return offset || { x: 0, y: 0 };
}

/**
 * Draw a sprite from a sprite sheet (for skin with multiple rows/columns)
 */
export function drawSkinSprite(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  centerX: number,
  centerY: number,
  frame: number,
  gender: GenderType,
  skinTone: number,
  direction: Direction,
  totalColumns: number,
  zoomLevel: number
): void {
  if (!img) return;
  
  // Skin sprite sheets are organized in a grid
  // 7 rows (races/skin tones), multiple columns (directions + frames)
  // Row is selected by skinTone, gender and direction determine column
  
  const rows = 7;
  const cols = totalColumns;
  const frameWidth = img.width / cols;
  const frameHeight = img.height / rows;
  
  // Gender offset: male = 1 column offset per state
  // Direction: down = 0, left = 1, up = 2, right = 3
  const directionMap = { down: 0, left: 1, up: 2, right: 3 };
  const dirOffset = directionMap[direction] || 0;
  
  // For walking: each direction has 4 frames laid out horizontally
  // Column layout: male_down_frame0, male_down_frame1, male_down_frame2, male_down_frame3, ...
  const srcX = (gender * (cols / 2) + dirOffset * 4 + frame) * frameWidth;
  const srcY = (skinTone || 0) * frameHeight; // Use skinTone to select row
  
  ctx.drawImage(
    img,
    srcX, srcY, frameWidth, frameHeight,
    centerX - (frameWidth * zoomLevel) / 2, 
    centerY - (frameHeight * zoomLevel) / 2, 
    frameWidth * zoomLevel, 
    frameHeight * zoomLevel
  );
}

/**
 * Draw a single sprite with offset
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  centerX: number,
  centerY: number,
  offsetX: number,
  offsetY: number,
  zoomLevel: number
): void {
  if (!img) return;
  
  const scaledWidth = img.width * zoomLevel;
  const scaledHeight = img.height * zoomLevel;
  const x = centerX - scaledWidth / 2 + (offsetX * zoomLevel);
  const y = centerY - scaledHeight / 2 + (offsetY * zoomLevel);
  
  ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
}

/**
 * Draw standing pose layers
 */
export function drawStanding(
  ctx: CanvasRenderingContext2D,
  sprites: any,
  gender: GenderType,
  skinTone: number,
  direction: Direction,
  state: AnimationState,
  currentFrame: number,
  zoomLevel: number,
  centerX: number,
  centerY: number
): void {
  // Render order (bottom to top):
  // 1. Back items (wings, arrows, quiver)
  // 2. Skin
  // 3. Boots
  // 4. Armor
  // 5. Weapon
  // 6. Shield (side)
  // 7. Hair
  // 8. Helmet
  
  // Layer 1: Back items (behind character)
  if (sprites.back?.standing) {
    const offset = getEquipmentOffset(BACK_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.back.standing, centerX, centerY, offset.x, offset.y, zoomLevel);
  }
  
  // Layer 2: Skin standing
  if (sprites.skin?.standing) {
    drawSkinSprite(ctx, sprites.skin.standing, centerX, centerY, 0, gender, skinTone, direction, 1, zoomLevel);
  }
  
  // Layer 3: Boots
  if (sprites.boots?.standing) {
    const offset = getEquipmentOffset(BOOTS_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.boots.standing, centerX, centerY, offset.x, offset.y, zoomLevel);
  }
  
  // Layer 4: Armor standing
  if (sprites.armor?.standing) {
    const offset = getEquipmentOffset(ARMOR_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.armor.standing, centerX, centerY, offset.x, offset.y, zoomLevel);
  }
  
  // Layer 5: Weapon standing
  const frameType = currentFrame as CharacterFrameType;
  if (sprites.weapon?.frames && WEAPON_VISIBLE[frameType]) {
    const weaponFrameIndex = WEAPON_FRAME_MAP[frameType];
    if (weaponFrameIndex !== undefined && sprites.weapon.frames[weaponFrameIndex]) {
      const offset = getEquipmentOffset(WEAPON_OFFSETS, gender, state, direction, currentFrame);
      drawSprite(ctx, sprites.weapon.frames[weaponFrameIndex], centerX, centerY, offset.x, offset.y, zoomLevel);
    }
  }
  
  // Layer 6: Shield (side shields, not back items)
  if (sprites.shield?.standing) {
    const offset = getEquipmentOffset(SHIELD_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.shield.standing, centerX, centerY, offset.x, offset.y, zoomLevel);
  }
  
  // Layer 7: Hair
  if (sprites.hair) {
    const offset = getEquipmentOffset(HAIR_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.hair, centerX, centerY, offset.x, offset.y, zoomLevel);
  }
  
  // Layer 8: Helmet (on top of hair)
  if (sprites.helmet?.standing) {
    const offset = getEquipmentOffset(HAT_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.helmet.standing, centerX, centerY, offset.x, offset.y, zoomLevel);
  }
}

/**
 * Draw walking animation layers
 */
export function drawWalking(
  ctx: CanvasRenderingContext2D,
  sprites: any,
  gender: GenderType,
  skinTone: number,
  direction: Direction,
  state: AnimationState,
  currentFrame: number,
  zoomLevel: number,
  centerX: number,
  centerY: number
): void {
  // Layer 1: Back items
  if (sprites.back?.standing) {
    const offset = getEquipmentOffset(BACK_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.back.standing, centerX, centerY, offset.x, offset.y, zoomLevel);
  }
  
  // Layer 2: Skin walking frame
  if (sprites.skin?.walking) {
    drawSkinSprite(ctx, sprites.skin.walking, centerX, centerY, currentFrame, gender, skinTone, direction, 16, zoomLevel);
  }
  
  // Layer 3: Boots walking
  if (sprites.boots?.walkFrames && sprites.boots.walkFrames[currentFrame]) {
    const offset = getEquipmentOffset(BOOTS_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.boots.walkFrames[currentFrame], centerX, centerY, offset.x, offset.y, zoomLevel);
  }
  
  // Layer 4: Armor walking
  if (sprites.armor?.walkFrames && sprites.armor.walkFrames[currentFrame]) {
    const offset = getEquipmentOffset(ARMOR_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.armor.walkFrames[currentFrame], centerX, centerY, offset.x, offset.y, zoomLevel);
  }
  
  // Layer 5: Weapon
  const walkFrameType = getCurrentCharacterFrame(state, direction, currentFrame);
  if (sprites.weapon?.frames && WEAPON_VISIBLE[walkFrameType]) {
    const weaponFrameIndex = WEAPON_FRAME_MAP[walkFrameType];
    if (weaponFrameIndex !== undefined && sprites.weapon.frames[weaponFrameIndex]) {
      const offset = getEquipmentOffset(WEAPON_OFFSETS, gender, state, direction, currentFrame);
      drawSprite(ctx, sprites.weapon.frames[weaponFrameIndex], centerX, centerY, offset.x, offset.y, zoomLevel);
    }
  }
  
  // Layer 6: Side shield
  if (sprites.shield?.standing) {
    const offset = getEquipmentOffset(SHIELD_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.shield.standing, centerX, centerY, offset.x, offset.y, zoomLevel);
  }
  
  // Layer 7: Hair
  if (sprites.hair) {
    const offset = getEquipmentOffset(HAIR_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.hair, centerX, centerY, offset.x, offset.y, zoomLevel);
  }
  
  // Layer 8: Helmet walking
  if (sprites.helmet?.walkFrames && sprites.helmet.walkFrames[currentFrame]) {
    const offset = getEquipmentOffset(HAT_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.helmet.walkFrames[currentFrame], centerX, centerY, offset.x, offset.y, zoomLevel);
  } else if (sprites.helmet?.standing) {
    // Fallback to standing frame if walk frames not available
    const offset = getEquipmentOffset(HAT_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.helmet.standing, centerX, centerY, offset.x, offset.y, zoomLevel);
  }
}

/**
 * Draw attacking animation layers
 */
export function drawAttacking(
  ctx: CanvasRenderingContext2D,
  sprites: any,
  gender: GenderType,
  skinTone: number,
  direction: Direction,
  state: AnimationState,
  currentFrame: number,
  armorFrame: number,
  zoomLevel: number,
  centerX: number,
  centerY: number
): void {
  // Layer 1: Draw back item first (behind character)
  if (sprites.back?.attackFrames && sprites.back.attackFrames[0]) {
    const offset = getEquipmentOffset(BACK_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.back.attackFrames[0], centerX, centerY, offset.x, offset.y, zoomLevel);
  } else if (sprites.back?.standing) {
    const offset = getEquipmentOffset(BACK_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.back.standing, centerX, centerY, offset.x, offset.y, zoomLevel);
  }
  
  // Layer 2: Draw skin attacking frame
  if (sprites.skin?.attacking) {
    drawSkinSprite(ctx, sprites.skin.attacking, centerX, centerY, currentFrame, gender, skinTone, direction, 8, zoomLevel);
  }
  
  // Layer 2.5: Draw boots with proper attack frames
  // Based on EndlessClient/EOWeb: boots use attack frames 11/12 for MeleeAttackFrame2 and RangeAttack
  // but standing frame for MeleeAttackFrame1
  if (sprites.boots) {
    const offset = getEquipmentOffset(BOOTS_OFFSETS, gender, state, direction, currentFrame);
    let bootsSprite = sprites.boots.standing; // Default to standing
    
    // Determine if we should use attack boot sprites
    // Attack frames used for: MeleeAttackDownRight2 (11), MeleeAttackUpLeft2 (13), RangeAttackDownRight (20), RangeAttackUpLeft (21)
    if (currentFrame === 11 || currentFrame === 20) {
      // Down/Right attack frames - use attack frame 0
      bootsSprite = sprites.boots.attackFrames?.[0] || sprites.boots.standing;
    } else if (currentFrame === 13 || currentFrame === 21) {
      // Up/Left attack frames - use attack frame 1
      bootsSprite = sprites.boots.attackFrames?.[1] || sprites.boots.standing;
    }
    // For frames 10 (MeleeAttackDownRight1) and 12 (MeleeAttackUpLeft1), use standing frame
    
    if (bootsSprite) {
      drawSprite(ctx, bootsSprite, centerX, centerY, offset.x, offset.y, zoomLevel);
    }
  }
  
  // Layer 3: Draw armor attack frame on top of skin
  if (sprites.armor?.attackFrames && sprites.armor.attackFrames[armorFrame]) {
    const offset = getEquipmentOffset(ARMOR_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.armor.attackFrames[armorFrame], centerX, centerY, offset.x, offset.y, zoomLevel);
  } else if (sprites.armor?.standing) {
    // Fallback to standing frame if attack frames not available
    const offset = getEquipmentOffset(ARMOR_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.armor.standing, centerX, centerY, offset.x, offset.y, zoomLevel);
  }
  
  // Layer 4: Hair
  if (sprites.hair) {
    const offset = getEquipmentOffset(HAIR_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.hair, centerX, centerY, offset.x, offset.y, zoomLevel);
  }
  
  // Layer 4.5: Helmet (on top of hair)
  if (sprites.helmet?.standing) {
    const offset = getEquipmentOffset(HAT_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.helmet.standing, centerX, centerY, offset.x, offset.y, zoomLevel);
  }
  
  // Layer 5: Draw weapon attacking frame (on top of everything)
  // Special case: MeleeAttackDownRight2 (frame 11) uses weapon frame 16 (graphicId + 17) drawn on top
  const attackFrameType = getCurrentCharacterFrame(state, direction, currentFrame);
  if (sprites.weapon?.frames && WEAPON_VISIBLE[attackFrameType]) {
    const weaponFrameIndex = WEAPON_FRAME_MAP[attackFrameType];
    if (weaponFrameIndex !== undefined && sprites.weapon.frames[weaponFrameIndex]) {
      const offset = getEquipmentOffset(WEAPON_OFFSETS, gender, state, direction, currentFrame);
      drawSprite(ctx, sprites.weapon.frames[weaponFrameIndex], centerX, centerY, offset.x, offset.y, zoomLevel);
    }
    
    // Special "front" weapon rendering for MeleeAttackDownRight2
    if (currentFrame === CharacterFrame.MeleeAttackDownRight2 && sprites.weapon.frames[16]) {
      const offset = getEquipmentOffset(WEAPON_OFFSETS, gender, state, direction, currentFrame);
      drawSprite(ctx, sprites.weapon.frames[16], centerX, centerY, offset.x, offset.y, zoomLevel);
    }
  }
}

/**
 * Draw sitting animation layers
 * Sitting has two modes: chair (frame 16/17) and floor (frame 18/19)
 */
export function drawSitting(
  ctx: CanvasRenderingContext2D,
  sprites: any,
  gender: GenderType,
  skinTone: number,
  direction: Direction,
  state: AnimationState,
  currentFrame: number,
  sittingType: string,
  zoomLevel: number,
  centerX: number,
  centerY: number
): void {
  // Determine which skin sprite sheet to use (chair or floor)
  const skinSheet = sittingType === 'floor' ? sprites.skin?.sittingFloor : sprites.skin?.sittingChair;
  
  // Layer 1: Draw back item first (behind character)
  if (sprites.back?.standing) {
    const offset = getEquipmentOffset(BACK_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.back.standing, centerX, centerY, offset.x, offset.y, zoomLevel);
  }
  
  // Layer 2: Draw skin sitting frame
  if (skinSheet) {
    drawSkinSprite(ctx, skinSheet, centerX, centerY, currentFrame, gender, skinTone, direction, 8, zoomLevel);
  }
  
  // Layer 2.5: Draw boots
  if (sprites.boots?.standing) {
    const offset = getEquipmentOffset(BOOTS_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.boots.standing, centerX, centerY, offset.x, offset.y, zoomLevel);
  }
  
  // Layer 3: Draw armor
  if (sprites.armor?.standing) {
    const offset = getEquipmentOffset(ARMOR_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.armor.standing, centerX, centerY, offset.x, offset.y, zoomLevel);
  }
  
  // Layer 4: Draw shield on top of armor
  if (sprites.shield?.standing) {
    const offset = getEquipmentOffset(SHIELD_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.shield.standing, centerX, centerY, offset.x, offset.y, zoomLevel);
  }
  
  // Layer 5: Hair
  if (sprites.hair) {
    const offset = getEquipmentOffset(HAIR_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.hair, centerX, centerY, offset.x, offset.y, zoomLevel);
  }
  
  // Layer 6: Helmet (on top of hair)
  if (sprites.helmet?.standing) {
    const offset = getEquipmentOffset(HAT_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.helmet.standing, centerX, centerY, offset.x, offset.y, zoomLevel);
  }
}

/**
 * Draw spell casting animation layers
 * Spell animation alternates between standing (frame 0/1) and raised hand (frame 14/15)
 */
export function drawSpell(
  ctx: CanvasRenderingContext2D,
  sprites: any,
  gender: GenderType,
  skinTone: number,
  direction: Direction,
  state: AnimationState,
  currentFrame: number,
  zoomLevel: number,
  centerX: number,
  centerY: number
): void {
  // Layer 1: Draw back item first (behind character)
  if (sprites.back?.standing) {
    const offset = getEquipmentOffset(BACK_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.back.standing, centerX, centerY, offset.x, offset.y, zoomLevel);
  }
  
  // Layer 2: Draw skin (uses standing sprite sheet)
  if (sprites.skin?.standing) {
    drawSkinSprite(ctx, sprites.skin.standing, centerX, centerY, currentFrame, gender, skinTone, direction, 8, zoomLevel);
  }
  
  // Layer 2.5: Draw boots
  if (sprites.boots?.standing) {
    const offset = getEquipmentOffset(BOOTS_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.boots.standing, centerX, centerY, offset.x, offset.y, zoomLevel);
  }
  
  // Layer 3: Draw armor
  if (sprites.armor?.standing) {
    const offset = getEquipmentOffset(ARMOR_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.armor.standing, centerX, centerY, offset.x, offset.y, zoomLevel);
  }
  
  // Layer 4: Draw shield on top of armor
  if (sprites.shield?.standing) {
    const offset = getEquipmentOffset(SHIELD_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.shield.standing, centerX, centerY, offset.x, offset.y, zoomLevel);
  }
  
  // Layer 5: Hair
  if (sprites.hair) {
    const offset = getEquipmentOffset(HAIR_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.hair, centerX, centerY, offset.x, offset.y, zoomLevel);
  }
  
  // Layer 6: Helmet (on top of hair)
  if (sprites.helmet?.standing) {
    const offset = getEquipmentOffset(HAT_OFFSETS, gender, state, direction, currentFrame);
    drawSprite(ctx, sprites.helmet.standing, centerX, centerY, offset.x, offset.y, zoomLevel);
  }
  
  // Layer 7: Weapon (spell casting uses raised hand weapon frames)
  const spellFrameType = currentFrame === 0 
    ? (direction === 'down' || direction === 'right' ? CharacterFrame.RaisedHandDownRight : CharacterFrame.RaisedHandUpLeft)
    : (direction === 'down' || direction === 'right' ? CharacterFrame.StandingDownRight : CharacterFrame.StandingUpLeft);
  
  if (sprites.weapon?.frames && WEAPON_VISIBLE[spellFrameType]) {
    const weaponFrameIndex = WEAPON_FRAME_MAP[spellFrameType];
    if (weaponFrameIndex !== undefined && sprites.weapon.frames[weaponFrameIndex]) {
      const offset = getEquipmentOffset(WEAPON_OFFSETS, gender, state, direction, currentFrame);
      drawSprite(ctx, sprites.weapon.frames[weaponFrameIndex], centerX, centerY, offset.x, offset.y, zoomLevel);
    }
  }
}

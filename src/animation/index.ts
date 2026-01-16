/**
 * Animation System - Main Entry Point
 * 
 * Export all public APIs from the animation system for easy importing
 */

// Main animator class
export { CharacterAnimator } from './character-animator';

// Constants and enums
export {
  Gender,
  CharacterFrame,
  GFX_FILES,
  ANIMATION_TIMING,
  ITEM_TYPE,
  getBaseArmorGraphic,
  getBaseWeaponGraphic,
  getBaseShieldGraphic,
  getBaseBootsGraphic,
  getBaseHatGraphic
} from './constants';

// Offset tables
export {
  BOOTS_OFFSETS,
  ARMOR_OFFSETS,
  HAT_OFFSETS,
  WEAPON_OFFSETS,
  SHIELD_OFFSETS,
  HAIR_OFFSETS,
  BACK_OFFSETS
} from './offsets';

// Sprite loading utilities
export {
  loadGFXFile,
  createImageFromData,
  loadSkinSprites,
  loadHairSprites,
  loadArmorSprite,
  loadWeaponSprite,
  loadBackSprite,
  loadShieldSprite,
  loadBootsSprite,
  loadHelmetSprite
} from './sprite-loader';

// Rendering functions
export {
  getCurrentCharacterFrame,
  getEquipmentOffset,
  drawSkinSprite,
  drawSprite,
  drawStanding,
  drawWalking,
  drawAttacking
} from './renderer';

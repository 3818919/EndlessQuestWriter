/**
 * Animation system constants
 * Contains enums and constant values used throughout the character animation system
 */

// Gender enum
export const Gender = {
  Female: 0,
  Male: 1
} as const;

export type GenderType = typeof Gender[keyof typeof Gender];

// Character frame enum - matches the offset tables
// Represents all possible character poses/actions
export const CharacterFrame = {
  StandingDownRight: 0,
  StandingUpLeft: 1,
  WalkingDownRight1: 2,
  WalkingDownRight2: 3,
  WalkingDownRight3: 4,
  WalkingDownRight4: 5,
  WalkingUpLeft1: 6,
  WalkingUpLeft2: 7,
  WalkingUpLeft3: 8,
  WalkingUpLeft4: 9,
  MeleeAttackDownRight1: 10,
  MeleeAttackDownRight2: 11,
  MeleeAttackUpLeft1: 12,
  MeleeAttackUpLeft2: 13,
  RaisedHandDownRight: 14,
  RaisedHandUpLeft: 15,
  ChairDownRight: 16,
  ChairUpLeft: 17,
  FloorDownRight: 18,
  FloorUpLeft: 19,
  RangeAttackDownRight: 20,
  RangeAttackUpLeft: 21
} as const;

export type CharacterFrameType = typeof CharacterFrame[keyof typeof CharacterFrame];

// GFX file numbers (from EndlessClient GFXTypes.cs - see GFX_FILE_REFERENCE.md)
export const GFX_FILES = {
  SKIN: 8,
  MALE_HAIR: 9,
  FEMALE_HAIR: 10,
  MALE_BOOTS: 11,
  FEMALE_BOOTS: 12,
  MALE_ARMOR: 13,
  FEMALE_ARMOR: 14,
  MALE_HAT: 15,
  FEMALE_HAT: 16,
  MALE_WEAPONS: 17,
  FEMALE_WEAPONS: 18,
  MALE_BACK: 19,
  FEMALE_BACK: 20
};

// Animation timing (in frames)
export const ANIMATION_TIMING = {
  WALK_FRAME_DELAY: 18,    // Doubled from 9
  ATTACK_FRAME_DELAY: 24,  // Doubled from 12
  SPELL_FRAME_DELAY: 20,   // Spell casting animation
  SIT_FRAME_DELAY: 30      // Sitting animation
};

// Weapon visibility by character frame (weapons are hidden when sitting)
export const WEAPON_VISIBLE: Record<CharacterFrameType, boolean> = {
  [CharacterFrame.StandingDownRight]: true,
  [CharacterFrame.StandingUpLeft]: true,
  [CharacterFrame.WalkingDownRight1]: true,
  [CharacterFrame.WalkingDownRight2]: true,
  [CharacterFrame.WalkingDownRight3]: true,
  [CharacterFrame.WalkingDownRight4]: true,
  [CharacterFrame.WalkingUpLeft1]: true,
  [CharacterFrame.WalkingUpLeft2]: true,
  [CharacterFrame.WalkingUpLeft3]: true,
  [CharacterFrame.WalkingUpLeft4]: true,
  [CharacterFrame.MeleeAttackDownRight1]: true,
  [CharacterFrame.MeleeAttackDownRight2]: true,
  [CharacterFrame.MeleeAttackUpLeft1]: true,
  [CharacterFrame.MeleeAttackUpLeft2]: true,
  [CharacterFrame.RaisedHandDownRight]: true,
  [CharacterFrame.RaisedHandUpLeft]: true,
  [CharacterFrame.ChairDownRight]: false,
  [CharacterFrame.ChairUpLeft]: false,
  [CharacterFrame.FloorDownRight]: false,
  [CharacterFrame.FloorUpLeft]: false,
  [CharacterFrame.RangeAttackDownRight]: true,
  [CharacterFrame.RangeAttackUpLeft]: true
};

// Weapon sprite frame mapping by character frame
export const WEAPON_FRAME_MAP: Partial<Record<CharacterFrameType, number>> = {
  [CharacterFrame.StandingDownRight]: 0,
  [CharacterFrame.StandingUpLeft]: 1,
  [CharacterFrame.WalkingDownRight1]: 2,
  [CharacterFrame.WalkingDownRight2]: 3,
  [CharacterFrame.WalkingDownRight3]: 4,
  [CharacterFrame.WalkingDownRight4]: 5,
  [CharacterFrame.WalkingUpLeft1]: 6,
  [CharacterFrame.WalkingUpLeft2]: 7,
  [CharacterFrame.WalkingUpLeft3]: 8,
  [CharacterFrame.WalkingUpLeft4]: 9,
  [CharacterFrame.RaisedHandDownRight]: 10,
  [CharacterFrame.RaisedHandUpLeft]: 11,
  [CharacterFrame.MeleeAttackDownRight1]: 12,
  [CharacterFrame.MeleeAttackDownRight2]: 13,
  [CharacterFrame.MeleeAttackUpLeft1]: 14,
  [CharacterFrame.MeleeAttackUpLeft2]: 15,
  [CharacterFrame.RangeAttackDownRight]: 17,
  [CharacterFrame.RangeAttackUpLeft]: 18
};

// Item type constants (from EIF spec)
export const ITEM_TYPE = {
  STATIC: 0,
  UNUSED: 1,
  MONEY: 2,
  HEAL: 3,
  TELEPORT: 4,
  SPELL: 5,
  EXP_REWARD: 6,
  STAT_REWARD: 7,
  SKILL_REWARD: 8,
  KEY: 9,
  WEAPON: 10,
  SHIELD: 11,
  ARMOR: 12,
  HAT: 13,
  BOOTS: 14,
  GLOVES: 15,
  ACCESSORY: 16,
  BELT: 17,
  NECKLACE: 18,
  RING: 19,
  ARMLET: 20,
  BRACER: 21,
  BEER: 22,
  EFFECT_POTION: 23,
  HAIR_DYE: 24,
  CURL: 25
} as const;

// Base graphic calculation functions
export function getBaseArmorGraphic(graphicId: number): number {
  // Each armor has 50 sprites (various states and directions)
  return (graphicId - 1) * 50;
}

export function getBaseWeaponGraphic(graphicId: number): number {
  // Each weapon has 100 sprites
  return (graphicId - 1) * 100;
}

export function getBaseShieldGraphic(graphicId: number): number {
  // Each shield/back item has 50 sprites
  return (graphicId - 1) * 50;
}

export function getBaseBootsGraphic(graphicId: number): number {
  // Each boots item has 40 sprites (not 50 like other equipment)
  return (graphicId - 1) * 40;
}

export function getBaseHatGraphic(graphicId: number): number {
  // Each hat has 50 sprites
  return (graphicId - 1) * 50;
}

/**
 * Equipment offset tables for character animation
 * 
 * These tables define the pixel offsets for each equipment type relative to the character sprite.
 * The offsets ensure that equipment items align properly with the character's body in different poses.
 * 
 * Source: https://gist.github.com/sorokya/dd4a98fa6a421dce7a71eb26fec119af
 */

import { Gender, CharacterFrame, GenderType, CharacterFrameType } from './constants';

type OffsetTable = Record<GenderType, Partial<Record<CharacterFrameType, { x: number; y: number }>>>;

export const BOOTS_OFFSETS: OffsetTable = {
  [Gender.Female]: {
    [CharacterFrame.StandingDownRight]: { x: 0, y: 21 },
    [CharacterFrame.StandingUpLeft]: { x: 0, y: 21 },
    [CharacterFrame.WalkingDownRight1]: { x: 0, y: 21 },
    [CharacterFrame.WalkingDownRight2]: { x: 0, y: 21 },
    [CharacterFrame.WalkingDownRight3]: { x: 0, y: 21 },
    [CharacterFrame.WalkingDownRight4]: { x: 0, y: 21 },
    [CharacterFrame.WalkingUpLeft1]: { x: 0, y: 21 },
    [CharacterFrame.WalkingUpLeft2]: { x: 0, y: 21 },
    [CharacterFrame.WalkingUpLeft3]: { x: 0, y: 21 },
    [CharacterFrame.WalkingUpLeft4]: { x: 0, y: 20 },
    [CharacterFrame.MeleeAttackDownRight1]: { x: 1, y: 21 },
    [CharacterFrame.MeleeAttackDownRight2]: { x: -1, y: 21 },
    [CharacterFrame.MeleeAttackUpLeft1]: { x: 1, y: 21 },
    [CharacterFrame.MeleeAttackUpLeft2]: { x: -1, y: 21 },
    [CharacterFrame.RaisedHandDownRight]: { x: 0, y: 23 },
    [CharacterFrame.RaisedHandUpLeft]: { x: 0, y: 23 }
  },
  [Gender.Male]: {
    [CharacterFrame.StandingDownRight]: { x: 0, y: 20 },
    [CharacterFrame.StandingUpLeft]: { x: 0, y: 20 },
    [CharacterFrame.WalkingDownRight1]: { x: 1, y: 19 },
    [CharacterFrame.WalkingDownRight2]: { x: 1, y: 19 },
    [CharacterFrame.WalkingDownRight3]: { x: 1, y: 19 },
    [CharacterFrame.WalkingDownRight4]: { x: 1, y: 19 },
    [CharacterFrame.WalkingUpLeft1]: { x: 0, y: 19 },
    [CharacterFrame.WalkingUpLeft2]: { x: 0, y: 19 },
    [CharacterFrame.WalkingUpLeft3]: { x: 0, y: 19 },
    [CharacterFrame.WalkingUpLeft4]: { x: 0, y: 19 },
    [CharacterFrame.MeleeAttackDownRight1]: { x: 2, y: 20 },
    [CharacterFrame.MeleeAttackDownRight2]: { x: -2, y: 20 },
    [CharacterFrame.MeleeAttackUpLeft1]: { x: 2, y: 20 },
    [CharacterFrame.MeleeAttackUpLeft2]: { x: -2, y: 20 },
    [CharacterFrame.RaisedHandDownRight]: { x: 0, y: 22 },
    [CharacterFrame.RaisedHandUpLeft]: { x: 0, y: 22 }
  }
};

export const ARMOR_OFFSETS: OffsetTable = {
  [Gender.Female]: {
    [CharacterFrame.StandingDownRight]: { x: 0, y: -3 },
    [CharacterFrame.StandingUpLeft]: { x: 0, y: -3 },
    [CharacterFrame.WalkingDownRight1]: { x: 0, y: -4 },
    [CharacterFrame.WalkingDownRight2]: { x: 0, y: -4 },
    [CharacterFrame.WalkingDownRight3]: { x: 0, y: -4 },
    [CharacterFrame.WalkingDownRight4]: { x: 0, y: -4 },
    [CharacterFrame.WalkingUpLeft1]: { x: 0, y: -4 },
    [CharacterFrame.WalkingUpLeft2]: { x: 0, y: -4 },
    [CharacterFrame.WalkingUpLeft3]: { x: 0, y: -4 },
    [CharacterFrame.WalkingUpLeft4]: { x: 0, y: -4 },
    [CharacterFrame.MeleeAttackDownRight1]: { x: 1, y: -3 },
    [CharacterFrame.MeleeAttackDownRight2]: { x: -1, y: -3 },
    [CharacterFrame.MeleeAttackUpLeft1]: { x: 1, y: -3 },
    [CharacterFrame.MeleeAttackUpLeft2]: { x: -1, y: -3 },
    [CharacterFrame.RaisedHandDownRight]: { x: 0, y: -1 },
    [CharacterFrame.RaisedHandUpLeft]: { x: 0, y: -1 }
  },
  [Gender.Male]: {
    [CharacterFrame.StandingDownRight]: { x: 0, y: -4 },
    [CharacterFrame.StandingUpLeft]: { x: 0, y: -4 },
    [CharacterFrame.WalkingDownRight1]: { x: 1, y: -5 },
    [CharacterFrame.WalkingDownRight2]: { x: 1, y: -5 },
    [CharacterFrame.WalkingDownRight3]: { x: 1, y: -5 },
    [CharacterFrame.WalkingDownRight4]: { x: 1, y: -5 },
    [CharacterFrame.WalkingUpLeft1]: { x: 0, y: -5 },
    [CharacterFrame.WalkingUpLeft2]: { x: 0, y: -5 },
    [CharacterFrame.WalkingUpLeft3]: { x: 0, y: -5 },
    [CharacterFrame.WalkingUpLeft4]: { x: 0, y: -5 },
    [CharacterFrame.MeleeAttackDownRight1]: { x: 2, y: -4 },
    [CharacterFrame.MeleeAttackDownRight2]: { x: -2, y: -4 },
    [CharacterFrame.MeleeAttackUpLeft1]: { x: 2, y: -4 },
    [CharacterFrame.MeleeAttackUpLeft2]: { x: -2, y: -4 },
    [CharacterFrame.RaisedHandDownRight]: { x: 0, y: -2 },
    [CharacterFrame.RaisedHandUpLeft]: { x: 0, y: -2 }
  }
};

export const HAT_OFFSETS: OffsetTable = {
  [Gender.Female]: {
    [CharacterFrame.StandingDownRight]: { x: 0, y: 23 },
    [CharacterFrame.StandingUpLeft]: { x: 0, y: 23 },
    [CharacterFrame.WalkingDownRight1]: { x: 0, y: 23 },
    [CharacterFrame.WalkingDownRight2]: { x: 0, y: 23 },
    [CharacterFrame.WalkingDownRight3]: { x: 0, y: 23 },
    [CharacterFrame.WalkingDownRight4]: { x: 0, y: 23 },
    [CharacterFrame.WalkingUpLeft1]: { x: 0, y: 23 },
    [CharacterFrame.WalkingUpLeft2]: { x: 0, y: 23 },
    [CharacterFrame.WalkingUpLeft3]: { x: 0, y: 23 },
    [CharacterFrame.WalkingUpLeft4]: { x: 0, y: 23 },
    [CharacterFrame.MeleeAttackDownRight1]: { x: 1, y: 23 },
    [CharacterFrame.MeleeAttackDownRight2]: { x: -3, y: 28 },
    [CharacterFrame.MeleeAttackUpLeft1]: { x: 1, y: 23 },
    [CharacterFrame.MeleeAttackUpLeft2]: { x: -3, y: 24 },
    [CharacterFrame.RaisedHandDownRight]: { x: 0, y: 25 },
    [CharacterFrame.RaisedHandUpLeft]: { x: 0, y: 25 }
  },
  [Gender.Male]: {
    [CharacterFrame.StandingDownRight]: { x: 0, y: 22 },
    [CharacterFrame.StandingUpLeft]: { x: 0, y: 22 },
    [CharacterFrame.WalkingDownRight1]: { x: 1, y: 22 },
    [CharacterFrame.WalkingDownRight2]: { x: 1, y: 22 },
    [CharacterFrame.WalkingDownRight3]: { x: 1, y: 22 },
    [CharacterFrame.WalkingDownRight4]: { x: 1, y: 22 },
    [CharacterFrame.WalkingUpLeft1]: { x: 0, y: 22 },
    [CharacterFrame.WalkingUpLeft2]: { x: 0, y: 22 },
    [CharacterFrame.WalkingUpLeft3]: { x: 0, y: 22 },
    [CharacterFrame.WalkingUpLeft4]: { x: 0, y: 22 },
    [CharacterFrame.MeleeAttackDownRight1]: { x: 2, y: 22 },
    [CharacterFrame.MeleeAttackDownRight2]: { x: -4, y: 26 },
    [CharacterFrame.MeleeAttackUpLeft1]: { x: 2, y: 22 },
    [CharacterFrame.MeleeAttackUpLeft2]: { x: -2, y: 23 },
    [CharacterFrame.RaisedHandDownRight]: { x: 0, y: 24 },
    [CharacterFrame.RaisedHandUpLeft]: { x: 0, y: 24 }
  }
};

export const WEAPON_OFFSETS: OffsetTable = {
  [Gender.Female]: {
    [CharacterFrame.StandingDownRight]: { x: -9, y: -6 },
    [CharacterFrame.StandingUpLeft]: { x: -9, y: -6 },
    [CharacterFrame.WalkingDownRight1]: { x: -9, y: -7 },
    [CharacterFrame.WalkingDownRight2]: { x: -9, y: -7 },
    [CharacterFrame.WalkingDownRight3]: { x: -9, y: -7 },
    [CharacterFrame.WalkingDownRight4]: { x: -9, y: -7 },
    [CharacterFrame.WalkingUpLeft1]: { x: -9, y: -7 },
    [CharacterFrame.WalkingUpLeft2]: { x: -9, y: -7 },
    [CharacterFrame.WalkingUpLeft3]: { x: -9, y: -7 },
    [CharacterFrame.WalkingUpLeft4]: { x: -9, y: -7 },
    [CharacterFrame.MeleeAttackDownRight1]: { x: -8, y: -6 },
    [CharacterFrame.MeleeAttackDownRight2]: { x: -10, y: -6 },
    [CharacterFrame.MeleeAttackUpLeft1]: { x: -8, y: -6 },
    [CharacterFrame.MeleeAttackUpLeft2]: { x: -10, y: -6 },
    [CharacterFrame.RaisedHandDownRight]: { x: -9, y: -4 },
    [CharacterFrame.RaisedHandUpLeft]: { x: -9, y: -4 }
  },
  [Gender.Male]: {
    [CharacterFrame.StandingDownRight]: { x: -9, y: -7 },
    [CharacterFrame.StandingUpLeft]: { x: -9, y: -7 },
    [CharacterFrame.WalkingDownRight1]: { x: -8, y: -8 },
    [CharacterFrame.WalkingDownRight2]: { x: -8, y: -8 },
    [CharacterFrame.WalkingDownRight3]: { x: -8, y: -8 },
    [CharacterFrame.WalkingDownRight4]: { x: -8, y: -8 },
    [CharacterFrame.WalkingUpLeft1]: { x: -9, y: -8 },
    [CharacterFrame.WalkingUpLeft2]: { x: -9, y: -8 },
    [CharacterFrame.WalkingUpLeft3]: { x: -9, y: -8 },
    [CharacterFrame.WalkingUpLeft4]: { x: -9, y: -8 },
    [CharacterFrame.MeleeAttackDownRight1]: { x: -7, y: -7 },
    [CharacterFrame.MeleeAttackDownRight2]: { x: -11, y: -7 },
    [CharacterFrame.MeleeAttackUpLeft1]: { x: -7, y: -7 },
    [CharacterFrame.MeleeAttackUpLeft2]: { x: -11, y: -7 },
    [CharacterFrame.RaisedHandDownRight]: { x: -9, y: -5 },
    [CharacterFrame.RaisedHandUpLeft]: { x: -9, y: -5 }
  }
};

export const SHIELD_OFFSETS: OffsetTable = {
  [Gender.Female]: {
    [CharacterFrame.StandingDownRight]: { x: -5, y: 5 },
    [CharacterFrame.StandingUpLeft]: { x: -5, y: 5 },
    [CharacterFrame.WalkingDownRight1]: { x: -5, y: 4 },
    [CharacterFrame.WalkingDownRight2]: { x: -5, y: 4 },
    [CharacterFrame.WalkingDownRight3]: { x: -5, y: 4 },
    [CharacterFrame.WalkingDownRight4]: { x: -5, y: 4 },
    [CharacterFrame.WalkingUpLeft1]: { x: -5, y: 4 },
    [CharacterFrame.WalkingUpLeft2]: { x: -5, y: 4 },
    [CharacterFrame.WalkingUpLeft3]: { x: -5, y: 4 },
    [CharacterFrame.WalkingUpLeft4]: { x: -5, y: 4 },
    [CharacterFrame.MeleeAttackDownRight1]: { x: -4, y: 5 },
    [CharacterFrame.MeleeAttackDownRight2]: { x: -6, y: 5 },
    [CharacterFrame.MeleeAttackUpLeft1]: { x: -4, y: 5 },
    [CharacterFrame.MeleeAttackUpLeft2]: { x: -6, y: 5 },
    [CharacterFrame.RaisedHandDownRight]: { x: -5, y: 7 },
    [CharacterFrame.RaisedHandUpLeft]: { x: -5, y: 7 }
  },
  [Gender.Male]: {
    [CharacterFrame.StandingDownRight]: { x: -5, y: 4 },
    [CharacterFrame.StandingUpLeft]: { x: -5, y: 4 },
    [CharacterFrame.WalkingDownRight1]: { x: -4, y: 3 },
    [CharacterFrame.WalkingDownRight2]: { x: -4, y: 3 },
    [CharacterFrame.WalkingDownRight3]: { x: -4, y: 3 },
    [CharacterFrame.WalkingDownRight4]: { x: -4, y: 3 },
    [CharacterFrame.WalkingUpLeft1]: { x: -5, y: 3 },
    [CharacterFrame.WalkingUpLeft2]: { x: -5, y: 3 },
    [CharacterFrame.WalkingUpLeft3]: { x: -5, y: 3 },
    [CharacterFrame.WalkingUpLeft4]: { x: -5, y: 3 },
    [CharacterFrame.MeleeAttackDownRight1]: { x: -3, y: 4 },
    [CharacterFrame.MeleeAttackDownRight2]: { x: -7, y: 4 },
    [CharacterFrame.MeleeAttackUpLeft1]: { x: -3, y: 4 },
    [CharacterFrame.MeleeAttackUpLeft2]: { x: -7, y: 4 },
    [CharacterFrame.RaisedHandDownRight]: { x: -5, y: 6 },
    [CharacterFrame.RaisedHandUpLeft]: { x: -5, y: 6 }
  }
};

export const HAIR_OFFSETS: OffsetTable = {
  [Gender.Female]: {
    [CharacterFrame.StandingDownRight]: { x: -1, y: -14 },
    [CharacterFrame.StandingUpLeft]: { x: -1, y: -14 },
    [CharacterFrame.WalkingDownRight1]: { x: -1, y: -14 },
    [CharacterFrame.WalkingDownRight2]: { x: -1, y: -14 },
    [CharacterFrame.WalkingDownRight3]: { x: -1, y: -14 },
    [CharacterFrame.WalkingDownRight4]: { x: -1, y: -14 },
    [CharacterFrame.WalkingUpLeft1]: { x: -1, y: -14 },
    [CharacterFrame.WalkingUpLeft2]: { x: -1, y: -14 },
    [CharacterFrame.WalkingUpLeft3]: { x: -1, y: -14 },
    [CharacterFrame.WalkingUpLeft4]: { x: -1, y: -14 },
    [CharacterFrame.MeleeAttackDownRight1]: { x: 0, y: -14 },
    [CharacterFrame.MeleeAttackDownRight2]: { x: -4, y: -9 },
    [CharacterFrame.MeleeAttackUpLeft1]: { x: 0, y: -14 },
    [CharacterFrame.MeleeAttackUpLeft2]: { x: -4, y: -13 },
    [CharacterFrame.RaisedHandDownRight]: { x: -1, y: -12 },
    [CharacterFrame.RaisedHandUpLeft]: { x: -1, y: -12 }
  },
  [Gender.Male]: {
    [CharacterFrame.StandingDownRight]: { x: -1, y: -15 },
    [CharacterFrame.StandingUpLeft]: { x: -1, y: -15 },
    [CharacterFrame.WalkingDownRight1]: { x: 0, y: -15 },
    [CharacterFrame.WalkingDownRight2]: { x: 0, y: -15 },
    [CharacterFrame.WalkingDownRight3]: { x: 0, y: -15 },
    [CharacterFrame.WalkingDownRight4]: { x: 0, y: -15 },
    [CharacterFrame.WalkingUpLeft1]: { x: -1, y: -15 },
    [CharacterFrame.WalkingUpLeft2]: { x: -1, y: -15 },
    [CharacterFrame.WalkingUpLeft3]: { x: -1, y: -15 },
    [CharacterFrame.WalkingUpLeft4]: { x: -1, y: -15 },
    [CharacterFrame.MeleeAttackDownRight1]: { x: 1, y: -15 },
    [CharacterFrame.MeleeAttackDownRight2]: { x: -5, y: -11 },
    [CharacterFrame.MeleeAttackUpLeft1]: { x: 1, y: -15 },
    [CharacterFrame.MeleeAttackUpLeft2]: { x: -3, y: -14 },
    [CharacterFrame.RaisedHandDownRight]: { x: -1, y: -13 },
    [CharacterFrame.RaisedHandUpLeft]: { x: -1, y: -13 }
  }
};

export const BACK_OFFSETS: OffsetTable = {
  [Gender.Female]: {
    [CharacterFrame.StandingDownRight]: { x: 0, y: -17 },
    [CharacterFrame.StandingUpLeft]: { x: 0, y: -17 },
    [CharacterFrame.WalkingDownRight1]: { x: 0, y: -17 },
    [CharacterFrame.WalkingDownRight2]: { x: 0, y: -17 },
    [CharacterFrame.WalkingDownRight3]: { x: 0, y: -17 },
    [CharacterFrame.WalkingDownRight4]: { x: 0, y: -17 },
    [CharacterFrame.WalkingUpLeft1]: { x: 0, y: -17 },
    [CharacterFrame.WalkingUpLeft2]: { x: 0, y: -17 },
    [CharacterFrame.WalkingUpLeft3]: { x: 0, y: -17 },
    [CharacterFrame.WalkingUpLeft4]: { x: 0, y: -17 },
    [CharacterFrame.MeleeAttackDownRight1]: { x: 0, y: -17 },
    [CharacterFrame.MeleeAttackDownRight2]: { x: 0, y: -17 },
    [CharacterFrame.MeleeAttackUpLeft1]: { x: 0, y: -17 },
    [CharacterFrame.MeleeAttackUpLeft2]: { x: 0, y: -17 },
    [CharacterFrame.RaisedHandDownRight]: { x: 0, y: -15 },
    [CharacterFrame.RaisedHandUpLeft]: { x: 0, y: -15 }
  },
  [Gender.Male]: {
    [CharacterFrame.StandingDownRight]: { x: 0, y: -18 },
    [CharacterFrame.StandingUpLeft]: { x: 0, y: -18 },
    [CharacterFrame.WalkingDownRight1]: { x: 1, y: -18 },
    [CharacterFrame.WalkingDownRight2]: { x: 1, y: -18 },
    [CharacterFrame.WalkingDownRight3]: { x: 1, y: -18 },
    [CharacterFrame.WalkingDownRight4]: { x: 1, y: -18 },
    [CharacterFrame.WalkingUpLeft1]: { x: 0, y: -18 },
    [CharacterFrame.WalkingUpLeft2]: { x: 0, y: -18 },
    [CharacterFrame.WalkingUpLeft3]: { x: 0, y: -18 },
    [CharacterFrame.WalkingUpLeft4]: { x: 0, y: -18 },
    [CharacterFrame.MeleeAttackDownRight1]: { x: 2, y: -18 },
    [CharacterFrame.MeleeAttackDownRight2]: { x: -2, y: -18 },
    [CharacterFrame.MeleeAttackUpLeft1]: { x: 2, y: -18 },
    [CharacterFrame.MeleeAttackUpLeft2]: { x: -2, y: -18 },
    [CharacterFrame.RaisedHandDownRight]: { x: 0, y: -16 },
    [CharacterFrame.RaisedHandUpLeft]: { x: 0, y: -16 }
  }
};

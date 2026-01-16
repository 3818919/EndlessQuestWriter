/**
 * Sprite loading utilities for character animation
 * Handles loading sprite data from GFX files and creating Image objects
 */

import { GFXLoader } from '../gfx-loader';
import {
  GFX_FILES,
  getBaseArmorGraphic,
  getBaseWeaponGraphic,
  getBaseShieldGraphic,
  getBaseBootsGraphic,
  getBaseHatGraphic
} from './constants';

interface SpriteData {
  image: HTMLImageElement | null;
  width: number;
  height: number;
}

export interface SkinSpriteSet {
  standing?: any;
  walking?: any;
  attacking?: any;
  bow?: any;
  sittingChair?: any;
  sittingFloor?: any;
  [key: number]: any;
}

interface ArmorSpriteSet {
  standing: any;
  walkFrames: any[];
  attackFrames: any[];
}

export interface WeaponSpriteSet {
  frames: any[];
}

export interface ShieldSpriteSet {
  shield?: {
    standing: any;
    attackFrames: any[];
  } | null;
  back?: {
    standing: any;
    attackFrames: any[];
  } | null;
}

/**
 * Load GFX file data
 */
export async function loadGFXFile(gfxFolder: string, gfxNumber: number): Promise<Uint8Array | null> {
  try {
    if (!window.electronAPI) {
      console.error('Electron API not available');
      return null;
    }
    const result = await window.electronAPI.readGFX(gfxFolder, gfxNumber);
    if (!result.success) {
      console.error(`Failed to load GFX ${gfxNumber}:`, result.error);
      return null;
    }
    return new Uint8Array(result.data);
  } catch (error) {
    console.error(`Error loading GFX ${gfxNumber}:`, error);
    return null;
  }
}

/**
 * Create an Image object from bitmap data with transparency processing
 */
export function createImageFromData(bitmapData: Uint8Array | null): Promise<HTMLImageElement | null> {
  return new Promise((resolve, reject) => {
    if (!bitmapData) {
      resolve(null);
      return;
    }
    
    const dataUrl = GFXLoader.createImageDataURL(bitmapData);
    const img = new Image();
    img.onload = () => {
      // Convert black pixels (0,0,0) to transparent
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // DEBUG: Check what pixel values we actually have
      let pixelTypes = { black: 0, magenta: 0, other: 0 };
      let sampleOther = [];
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        if (r === 0 && g === 0 && b === 0) {
          pixelTypes.black++;
        } else if (r === 255 && g === 0 && b === 255) {
          pixelTypes.magenta++;
        } else {
          pixelTypes.other++;
          if (sampleOther.length < 3) {
            sampleOther.push(`RGB(${r},${g},${b})`);
          }
        }
      }
      
      console.log(`Pixel analysis: ${pixelTypes.black} black, ${pixelTypes.magenta} magenta, ${pixelTypes.other} other`, sampleOther);
      
      // Make black pixels transparent
      let transparentCount = 0;
      let opaqueCount = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        if (r === 0 && g === 0 && b === 0) {
          data[i + 3] = 0; // Set alpha to 0
          transparentCount++;
        } else if (data[i + 3] > 0) {
          opaqueCount++;
        }
      }
      
      console.log(`Image processed: ${opaqueCount} opaque pixels, ${transparentCount} black pixels made transparent`);
      
      ctx.putImageData(imageData, 0, 0);
      
      // Create new image from processed canvas
      const processedImg = new Image();
      processedImg.onload = () => resolve(processedImg);
      processedImg.onerror = () => reject(new Error('Failed to load processed image'));
      processedImg.src = canvas.toDataURL();
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

/**
 * Load skin sprite sheets from GFX008
 */
export async function loadSkinSprites(gfxData: Uint8Array | null, skinTone: number = 0): Promise<SkinSpriteSet> {
  const sprites: SkinSpriteSet = {};
  
  // Skin sprites in GFX008 are stored as sprite sheets where each sheet contains
  // all races/skin tones as rows. We load the sheets and use drawSkinSprite to
  // extract the correct row based on skinTone.
  // Resource IDs: 101 (standing), 102 (walking), 103 (attacking), 107 (bow)
  
  // First, try to find what resources exist by scanning
  console.log('Scanning GFX008 for available resources...');
  const foundResources: number[] = [];
  for (let id = 100; id <= 110; id++) {
    const testData = GFXLoader.extractBitmapByID(gfxData, id);
    if (testData) {
      foundResources.push(id);
    }
  }
  console.log('Found skin sprite resources:', foundResources);
  
  // Load standing sprite (resource 101)
  const standingData = GFXLoader.extractBitmapByID(gfxData, 101);
  if (standingData) {
    sprites.standing = await createImageFromData(standingData);
    console.log('Loaded standing sprite sheet');
  } else {
    console.warn('Failed to load standing sprite (resource 101)');
  }
  
  // Load walking sprite (resource 102)
  const walkingData = GFXLoader.extractBitmapByID(gfxData, 102);
  if (walkingData) {
    sprites.walking = await createImageFromData(walkingData);
    console.log('Loaded walking sprite sheet');
  } else {
    console.warn('Failed to load walking sprite (resource 102)');
  }
  
  // Load attacking sprite (resource 103)
  const attackingData = GFXLoader.extractBitmapByID(gfxData, 103);
  if (attackingData) {
    sprites.attacking = await createImageFromData(attackingData);
    console.log('Loaded attacking sprite sheet');
  } else {
    console.warn('Failed to load attacking sprite (resource 103)');
  }
  
  // Load bow sprite (resource 107)
  const bowData = GFXLoader.extractBitmapByID(gfxData, 107);
  if (bowData) {
    sprites.bow = await createImageFromData(bowData);
    console.log('Loaded bow sprite sheet');
  } else {
    console.warn('Failed to load bow sprite (resource 107)');
  }
  
  // Load sitting sprites
  // Resource 105: chair sitting
  const chairData = GFXLoader.extractBitmapByID(gfxData, 105);
  if (chairData) {
    sprites.sittingChair = await createImageFromData(chairData);
    console.log('Loaded chair sitting sprite sheet');
  } else {
    console.warn('Failed to load chair sitting sprite (resource 105)');
  }
  
  // Resource 106: floor sitting
  const floorData = GFXLoader.extractBitmapByID(gfxData, 106);
  if (floorData) {
    sprites.sittingFloor = await createImageFromData(floorData);
    console.log('Loaded floor sitting sprite sheet');
  } else {
    console.warn('Failed to load floor sitting sprite (resource 106)');
  }
  
  return sprites;
}

/**
 * Load hair sprites from GFX009 (male) or GFX010 (female)
 */
export async function loadHairSprites(gfxData: Uint8Array | null, hairStyle: number = 0, hairColor: number = 0, direction: string = 'down'): Promise<HTMLImageElement | null> {
  // Hair sprites calculation from EndlessClient:
  // Base graphic: (hairStyle - 1) * 40 + hairColor * 4
  // Direction offset: 0 for down/right, 1 for up/left
  // Final resource ID: baseGraphic + 2 + (directionOffset * 2) + 100
  // Each hair sprite is a SINGLE image, not a sprite sheet
  // See GFX_FILE_REFERENCE.md for details
  
  if (hairStyle === 0) {
    return null; // No hair
  }
  
  const baseGraphic = (hairStyle - 1) * 40 + hairColor * 4;
  const directionOffset = (direction === 'down' || direction === 'right') ? 0 : 1;
  const resourceId = baseGraphic + 2 + (directionOffset * 2) + 100;
  
  console.log(`Loading hair: style ${hairStyle}, color ${hairColor}, direction ${direction}, resourceId ${resourceId}`);
  
  // Load single hair sprite for this direction
  const hairData = GFXLoader.extractBitmapByID(gfxData, resourceId);
  if (hairData) {
    const hairSprite = await createImageFromData(hairData);
    console.log('Loaded hair sprite:', hairSprite.width, 'x', hairSprite.height);
    return hairSprite;
  } else {
    console.warn('Failed to load hair sprite (resource', resourceId, ')');
    return null;
  }
}

/**
 * Load armor sprites
 */
export async function loadArmorSprite(gfxFolder: string, graphicId: number, gender: number = 1): Promise<ArmorSpriteSet | null> {
  if (graphicId === 0) {
    return null;
  }
  
  // Load appropriate armor GFX file based on gender
  const armorGfxFile = gender === 0 ? GFX_FILES.FEMALE_ARMOR : GFX_FILES.MALE_ARMOR;
  const armorData = await loadGFXFile(gfxFolder, armorGfxFile);
  if (!armorData) {
    console.error(`Failed to load armor GFX file ${armorGfxFile}`);
    return null;
  }
  
  // Armor graphics: base + sprite type offset
  const baseGraphic = getBaseArmorGraphic(graphicId);
  console.log(`Loading armor graphic ${graphicId}, base: ${baseGraphic}, gender: ${gender === 0 ? 'female' : 'male'}`);
  
  const armor = {
    standing: null,
    walkFrames: [],
    attackFrames: []
  };
  
  // Load standing sprite (offset 1, +100 for PE resource ID)
  const standingResourceId = baseGraphic + 1 + 100;
  console.log(`Attempting to load armor standing from resource ${standingResourceId}`);
  const standingData = GFXLoader.extractBitmapByID(armorData, standingResourceId);
  if (standingData) {
    armor.standing = await createImageFromData(standingData);
    console.log('✓ Loaded armor standing sprite, dimensions:', armor.standing.width, 'x', armor.standing.height);
  } else {
    console.warn('✗ Failed to load armor standing sprite (resource', standingResourceId, ')');
    // Try scanning nearby resource IDs to find available sprites
    console.log('Scanning for available armor sprites...');
    for (let offset = 0; offset < 50; offset++) {
      const testId = baseGraphic + offset + 100;
      const testData = GFXLoader.extractBitmapByID(armorData, testId);
      if (testData) {
        console.log(`Found armor sprite at offset ${offset} (resource ${testId})`);
      }
    }
  }
  
  // Load walk frames: WalkFrame1=3, WalkFrame2=4, WalkFrame3=5, WalkFrame4=6
  const walkFrameEnums = [3, 4, 5, 6];
  for (let i = 0; i < walkFrameEnums.length; i++) {
    const resourceId = baseGraphic + walkFrameEnums[i] + 100;
    const frameData = GFXLoader.extractBitmapByID(armorData, resourceId);
    if (frameData) {
      armor.walkFrames[i] = await createImageFromData(frameData);
      console.log(`✓ Loaded armor walk frame ${i + 1} (enum ${walkFrameEnums[i]}) from offset ${walkFrameEnums[i]}`);
    }
  }
  
  // Load attack frames: PunchFrame1=13, PunchFrame2=14
  const punchFrameEnums = [13, 14];
  for (let i = 0; i < punchFrameEnums.length; i++) {
    const resourceId = baseGraphic + punchFrameEnums[i] + 100;
    const frameData = GFXLoader.extractBitmapByID(armorData, resourceId);
    if (frameData) {
      armor.attackFrames[i] = await createImageFromData(frameData);
      console.log(`✓ Loaded armor attack frame ${i + 1} (enum ${punchFrameEnums[i]}) from offset ${punchFrameEnums[i]}`);
    }
  }
  
  console.log('Armor loading complete. Walk frames:', armor.walkFrames.length, 'Attack frames:', armor.attackFrames.length);
  return armor;
}

/**
 * Load weapon sprites
 */
export async function loadWeaponSprite(gfxFolder: string, graphicId: number, gender: number = 1): Promise<WeaponSpriteSet | null> {
  if (graphicId === 0) {
    return null;
  }
  
  const weaponGfxFile = gender === 0 ? GFX_FILES.FEMALE_WEAPONS : GFX_FILES.MALE_WEAPONS;
  const weaponData = await loadGFXFile(gfxFolder, weaponGfxFile);
  if (!weaponData) return null;
  
  const baseGraphic = getBaseWeaponGraphic(graphicId);
  
  const weapon = {
    frames: []  // Weapon frames indexed by WEAPON_FRAME_MAP values
  };
  
  // Load all weapon frames (0-18)
  // Frame mapping: 0-1 (standing), 2-9 (walking), 10-11 (raised hand/spell), 12-15 (melee attack), 17-18 (ranged attack)
  // Frame 16 is not used, frame 13 has special "front" rendering
  for (let frameOffset = 0; frameOffset <= 18; frameOffset++) {
    const resourceId = baseGraphic + frameOffset + 1 + 100;
    const frameData = GFXLoader.extractBitmapByID(weaponData, resourceId);
    if (frameData) {
      weapon.frames[frameOffset] = await createImageFromData(frameData);
      console.log(`Loaded weapon frame ${frameOffset} (resource ${resourceId})`);
    }
  }
  
  return weapon;
}

/**
 * Load back/shield sprites
 */
export async function loadBackSprite(gfxFolder: string, graphicId: number, gender: number = 1): Promise<WeaponSpriteSet | null> {
  if (graphicId === 0) {
    return null;
  }
  
  const backGfxFile = gender === 0 ? GFX_FILES.FEMALE_BACK : GFX_FILES.MALE_BACK;
  const backData = await loadGFXFile(gfxFolder, backGfxFile);
  if (!backData) return null;
  
  const baseGraphic = getBaseShieldGraphic(graphicId);
  
  const back = {
    frames: []
  };
  
  // Load standing sprite (+100 for PE resource ID)
  const standingData = GFXLoader.extractBitmapByID(backData, baseGraphic + 1 + 100);
  if (standingData) {
    back.frames[0] = await createImageFromData(standingData);
    console.log('Loaded back/shield standing sprite');
  } else {
    console.warn('Failed to load back/shield standing sprite (resource', baseGraphic + 1 + 100, ')');
  }
  
  // Load attack frame (ShieldItemOnBack_AttackingWithBow = 3, +100 for PE resource ID)
  const attackData = GFXLoader.extractBitmapByID(backData, baseGraphic + 3 + 100);
  if (attackData) {
    back.frames[1] = await createImageFromData(attackData);
    console.log('Loaded back/shield attack frame');
  } else {
    console.warn('Failed to load back/shield attack frame (resource', baseGraphic + 3 + 100, ')');
  }
  
  return back;
}

/**
 * Load shield sprite (distinguishes between back items and side shields)
 */
export async function loadShieldSprite(gfxFolder: string, graphicId: number, subType: number = 0, gender: number = 1): Promise<ShieldSpriteSet> {
  if (graphicId === 0) {
    return { shield: null, back: null };
  }
  
  // SubType determines if it's a back item or side shield
  // SubType 0-3 are typically shields (side), 4+ are back items (wings, arrows, quiver)
  const isBackItem = subType >= 4;
  
  const shieldGfxFile = gender === 0 ? GFX_FILES.FEMALE_BACK : GFX_FILES.MALE_BACK;
  const shieldData = await loadGFXFile(gfxFolder, shieldGfxFile);
  if (!shieldData) return { shield: null, back: null };
  
  const baseGraphic = getBaseShieldGraphic(graphicId);
  
  if (isBackItem) {
    // Load as back item (wings, arrows, etc.)
    const back = {
      standing: null,
      attackFrames: []
    };
    
    const standingData = GFXLoader.extractBitmapByID(shieldData, baseGraphic + 1 + 100);
    if (standingData) {
      back.standing = await createImageFromData(standingData);
    }
    
    const attackData = GFXLoader.extractBitmapByID(shieldData, baseGraphic + 3 + 100);
    if (attackData) {
      back.attackFrames[0] = await createImageFromData(attackData);
    }
    
    return { shield: null, back };
  } else {
    // Load as side shield
    const shield = {
      standing: null,
      attackFrames: []
    };
    
    const standingData = GFXLoader.extractBitmapByID(shieldData, baseGraphic + 1 + 100);
    if (standingData) {
      shield.standing = await createImageFromData(standingData);
    }
    
    return { shield, back: null };
  }
}

/**
 * Load boots sprites
 */
export async function loadBootsSprite(gfxFolder: string, graphicId: number, gender: number = 1): Promise<ArmorSpriteSet | null> {
  console.log('Loading boots with graphicId:', graphicId);
  if (graphicId === 0) {
    console.log('Boots graphicId is 0, skipping');
    return null;
  }
  
  const bootsGfxFile = gender === 0 ? GFX_FILES.FEMALE_BOOTS : GFX_FILES.MALE_BOOTS;
  const bootsData = await loadGFXFile(gfxFolder, bootsGfxFile);
  if (!bootsData) {
    console.log(`Failed to load GFX${String(bootsGfxFile).padStart(3, '0')} for boots`);
    return null;
  }
  
  // Boots use 40 sprites per item (not 50 like other equipment)
  const baseGraphic = getBaseBootsGraphic(graphicId);
  console.log('Boots baseGraphic:', baseGraphic, 'for graphicId:', graphicId, 'gender:', gender === 0 ? 'female' : 'male');
  
  const boots = {
    standing: null,
    walkFrames: [],
    attackFrames: []
  };
  
  // Load standing sprite (BootsSpriteType.Standing = 1, facing down offset = 0)
  const standingResourceId = baseGraphic + 1 + 100;
  console.log('Loading boots standing sprite, resourceId:', standingResourceId);
  const standingData = GFXLoader.extractBitmapByID(bootsData, standingResourceId);
  if (standingData) {
    boots.standing = await createImageFromData(standingData);
    console.log('Boots standing sprite loaded');
  } else {
    console.log('Failed to load standing, scanning for available sprites...');
    // Scan for available sprites
    for (let offset = 0; offset < 10; offset++) {
      const testId = baseGraphic + offset + 100;
      const testData = GFXLoader.extractBitmapByID(bootsData, testId);
      if (testData) {
        console.log(`Found boots sprite at offset ${offset} (ID ${testId})`);
        if (!boots.standing) {
          boots.standing = await createImageFromData(testData);
        }
      }
    }
  }
  
  // Walk frames: WalkFrame1-4 enum values are 3, 4, 5, 6
  const walkFrameEnumValues = [3, 4, 5, 6];
  for (let i = 0; i < 4; i++) {
    const walkResourceId = baseGraphic + walkFrameEnumValues[i] + 100;
    const walkData = GFXLoader.extractBitmapByID(bootsData, walkResourceId);
    if (walkData) {
      boots.walkFrames.push(await createImageFromData(walkData));
      console.log(`Boots walk frame ${i + 1} loaded (resourceId: ${walkResourceId})`);
    }
  }
  
  // Attack frames: offset 11 for down/right direction, offset 12 for up/left direction
  // Based on EOWeb: MeleeAttackDownRight2/RangeAttackDownRight = baseId + 11
  //                  MeleeAttackUpLeft2/RangeAttackUpLeft = baseId + 12
  const attackResourceId1 = baseGraphic + 11 + 100;
  const attackData1 = GFXLoader.extractBitmapByID(bootsData, attackResourceId1);
  if (attackData1) {
    boots.attackFrames[0] = await createImageFromData(attackData1);
    console.log(`Boots attack frame 1 loaded (resourceId: ${attackResourceId1})`);
  }
  
  const attackResourceId2 = baseGraphic + 12 + 100;
  const attackData2 = GFXLoader.extractBitmapByID(bootsData, attackResourceId2);
  if (attackData2) {
    boots.attackFrames[1] = await createImageFromData(attackData2);
    console.log(`Boots attack frame 2 loaded (resourceId: ${attackResourceId2})`);
  }
  
  console.log('Boots loading complete. Walk frames:', boots.walkFrames.length, 'Attack frames:', boots.attackFrames.length);
  return boots;
}

/**
 * Load helmet/hat sprites
 */
export async function loadHelmetSprite(gfxFolder: string, graphicId: number, gender: number = 1): Promise<ArmorSpriteSet | null> {
  if (graphicId === 0) {
    return null;
  }
  
  const hatGfxFile = gender === 0 ? GFX_FILES.FEMALE_HAT : GFX_FILES.MALE_HAT;
  const helmetData = await loadGFXFile(gfxFolder, hatGfxFile);
  if (!helmetData) return null;
  
  const baseGraphic = getBaseHatGraphic(graphicId);
  
  const helmet = {
    standing: null,
    walkFrames: [],
    attackFrames: []
  };
  
  // Load standing sprite
  const standingData = GFXLoader.extractBitmapByID(helmetData, baseGraphic + 1 + 100);
  if (standingData) {
    helmet.standing = await createImageFromData(standingData);
  }
  
  // Load walk frames
  for (let i = 2; i <= 5; i++) {
    const walkData = GFXLoader.extractBitmapByID(helmetData, baseGraphic + i + 100);
    if (walkData) {
      helmet.walkFrames.push(await createImageFromData(walkData));
    }
  }
  
  return helmet;
}

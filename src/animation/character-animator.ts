/**
 * Character Animation System
 * 
 * Main orchestrator for character sprite animation.
 * Loads character sprites, manages animation state, and renders to canvas.
 */

import {
  ITEM_TYPE,
  GFX_FILES,
  ANIMATION_TIMING,
  GenderType
} from './constants';

import {
  loadGFXFile as _loadGFXFile,
  loadSkinSprites as _loadSkinSprites,
  loadHairSprites as _loadHairSprites,
  loadArmorSprite as _loadArmorSprite,
  loadWeaponSprite as _loadWeaponSprite,
  loadBackSprite as _loadBackSprite,
  loadShieldSprite as _loadShieldSprite,
  loadBootsSprite as _loadBootsSprite,
  loadHelmetSprite as _loadHelmetSprite,
  SkinSpriteSet,
  WeaponSpriteSet
} from './sprite-loader';

import {
  drawStanding,
  drawWalking,
  drawAttacking,
  drawSitting,
  drawSpell
} from './renderer';

interface SpriteData {
  image: HTMLImageElement | null;
  width: number;
  height: number;
}

interface CharacterSprites {
  skin: SkinSpriteSet | null;
  hair: HTMLImageElement | null;
  boots: { standing: any; walkFrames: any[]; attackFrames: any[] } | null;
  armor: { standing: any; walkFrames: any[]; attackFrames: any[] } | null;
  weapon: WeaponSpriteSet | null;
  back: WeaponSpriteSet | null;
  shield: { standing: any; attackFrames: any[] } | null;
  helmet: { standing: any; walkFrames: any[]; attackFrames: any[] } | null;
}

type AnimationState = 'standing' | 'walking' | 'attacking' | 'spell' | 'sitting';
type Direction = 'down' | 'up' | 'left' | 'right';
type SittingType = 'chair' | 'floor';

/**
 * CharacterAnimator class
 * Manages character sprite animation and rendering
 */
class CharacterAnimator {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  animationFrame: number | null;
  currentFrame: number;
  frameTimer: number;
  armorFrame: number;
  state: AnimationState;
  direction: Direction;
  sittingType: SittingType;
  zoomLevel: number;
  gender: GenderType;
  hairStyle: number;
  hairColor: number;
  skinTone: number;
  
  GFX_SKIN: number;
  GFX_MALE_HAIR: number;
  GFX_FEMALE_HAIR: number;
  GFX_MALE_BOOTS: number;
  GFX_FEMALE_BOOTS: number;
  GFX_MALE_ARMOR: number;
  GFX_FEMALE_ARMOR: number;
  GFX_MALE_HAT: number;
  GFX_FEMALE_HAT: number;
  GFX_MALE_WEAPONS: number;
  GFX_FEMALE_WEAPONS: number;
  GFX_MALE_BACK: number;
  GFX_FEMALE_BACK: number;
  
  sprites: CharacterSprites;
  
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.animationFrame = null;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.armorFrame = 0;
    this.state = 'standing'; // standing, walking, attacking, spell, sitting
    this.direction = 'down'; // down, up, left, right
    this.sittingType = 'chair'; // chair or floor
    this.zoomLevel = 1; // Default zoom level (1x, 2x, 3x, 4x)
    this.gender = 1; // 0 = female, 1 = male
    this.hairStyle = 0; // Hair style number
    this.hairColor = 0; // Hair color number
    this.skinTone = 0; // Skin tone (0-6)
    
    // GFX file constants (for backward compatibility)
    this.GFX_SKIN = GFX_FILES.SKIN;
    this.GFX_MALE_HAIR = GFX_FILES.MALE_HAIR;
    this.GFX_FEMALE_HAIR = GFX_FILES.FEMALE_HAIR;
    this.GFX_MALE_BOOTS = GFX_FILES.MALE_BOOTS;
    this.GFX_FEMALE_BOOTS = GFX_FILES.FEMALE_BOOTS;
    this.GFX_MALE_ARMOR = GFX_FILES.MALE_ARMOR;
    this.GFX_FEMALE_ARMOR = GFX_FILES.FEMALE_ARMOR;
    this.GFX_MALE_HAT = GFX_FILES.MALE_HAT;
    this.GFX_FEMALE_HAT = GFX_FILES.FEMALE_HAT;
    this.GFX_MALE_WEAPONS = GFX_FILES.MALE_WEAPONS;
    this.GFX_FEMALE_WEAPONS = GFX_FILES.FEMALE_WEAPONS;
    this.GFX_MALE_BACK = GFX_FILES.MALE_BACK;
    this.GFX_FEMALE_BACK = GFX_FILES.FEMALE_BACK;
    
    // Loaded sprites
    this.sprites = {
      skin: null,
      hair: null,
      boots: null,
      armor: null,
      weapon: null,
      back: null,
      shield: null,
      helmet: null
    };
  }
  
  // Wrapper methods for backward compatibility with existing code
  async loadGFXFile(gfxFolder: string, gfxNumber: number) {
    return _loadGFXFile(gfxFolder, gfxNumber);
  }
  
  async loadSkinSprites(gfxData: Uint8Array | null, skinTone: number = 0) {
    return _loadSkinSprites(gfxData, skinTone);
  }
  
  async loadHairSprites(gfxData: Uint8Array | null, hairStyle: number = 0, hairColor: number = 0, direction: string = 'down') {
    return _loadHairSprites(gfxData, hairStyle, hairColor, direction);
  }
  
  async loadArmorSprite(gfxFolder: string, graphicId: number, gender: number = 1) {
    const result = await _loadArmorSprite(gfxFolder, graphicId, gender);
    this.sprites.armor = result;
    return result;
  }
  
  async loadWeaponSprite(gfxFolder: string, graphicId: number, gender?: number) {
    const result = await _loadWeaponSprite(gfxFolder, graphicId, gender ?? this.gender);
    this.sprites.weapon = result;
    return result;
  }
  
  async loadBackSprite(gfxFolder: string, graphicId: number, gender?: number) {
    const result = await _loadBackSprite(gfxFolder, graphicId, gender ?? this.gender);
    this.sprites.back = result;
    return result;
  }
  
  async loadShieldSprite(gfxFolder: string, graphicId: number, subType: number = 0, gender?: number) {
    const result = await _loadShieldSprite(gfxFolder, graphicId, subType, gender ?? this.gender);
    if (result && typeof result === 'object') {
      if ('shield' in result) this.sprites.shield = result as any;
      if ('back' in result) this.sprites.back = result as any;
    }
    return result;
  }
  
  async loadBootsSprite(gfxFolder: string, graphicId: number, gender?: number) {
    const result = await _loadBootsSprite(gfxFolder, graphicId, gender ?? this.gender);
    this.sprites.boots = result;
    return result;
  }
  
  async loadHelmetSprite(gfxFolder: string, graphicId: number, gender?: number) {
    const result = await _loadHelmetSprite(gfxFolder, graphicId, gender ?? this.gender);
    this.sprites.helmet = result;
    return result;
  }
  
  /**
   * Initialize the animator with a canvas element
   */
  initialize(canvasElement: HTMLCanvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = false; // Pixel-perfect rendering
    }
  }
  
  /**
   * Set zoom level (1x-4x)
   */
  setZoom(level: number) {
    this.zoomLevel = Math.max(1, Math.min(4, level));
    if (!this.animationFrame) {
      this.render(); // Re-render if not animating
    }
  }
  
  /**
   * Get current zoom level
   */
  getZoom() {
    return this.zoomLevel;
  }
  
  /**
   * Load character sprites based on item type
   */
  async loadCharacterSprites(gfxFolder: string, itemType: number, graphicId: number, gender: number = 1) {
    console.log('Loading character sprites:', { gfxFolder, itemType, graphicId, gender });
    
    // Store gender for use in sprite rendering
    this.gender = gender as GenderType;
    
    // Always load skin
    const skinData = await _loadGFXFile(gfxFolder, GFX_FILES.SKIN);
    if (skinData) {
      console.log('Loaded skin data, parsing sprites...');
      this.sprites.skin = await _loadSkinSprites(skinData, this.skinTone);
      console.log('Skin sprites loaded:', this.sprites.skin);
    } else {
      console.error('Failed to load skin data from GFX', GFX_FILES.SKIN);
    }
    
    // Load equipment based on item type
    if (itemType === ITEM_TYPE.ARMOR) {
      console.log('Loading armor sprite...');
      this.sprites.armor = await _loadArmorSprite(gfxFolder, graphicId, gender);
      this.state = 'walking';
    } else if (itemType === ITEM_TYPE.WEAPON) {
      console.log('Loading weapon sprite...');
      this.sprites.weapon = await _loadWeaponSprite(gfxFolder, graphicId, gender);
      this.state = 'attacking';
    } else if (itemType === ITEM_TYPE.SHIELD) {
      console.log('Loading shield sprite...');
      this.sprites.back = await _loadBackSprite(gfxFolder, graphicId, gender);
      this.state = 'attacking';
    } else if (itemType === ITEM_TYPE.BOOTS) {
      console.log('Loading boots sprite...');
      this.sprites.boots = await _loadBootsSprite(gfxFolder, graphicId, gender);
      this.state = 'walking';
    } else if (itemType === ITEM_TYPE.HAT) {
      console.log('Loading hat sprite...');
      this.sprites.helmet = await _loadHelmetSprite(gfxFolder, graphicId, gender);
      this.state = 'walking';
    } else {
      console.log('Item type not equippable, using standing state');
      this.state = 'standing';
    }
    
    console.log('Character sprites loaded, state:', this.state);
  }
  
  /**
   * Start animation loop
   */
  start() {
    if (this.animationFrame) {
      return; // Already running
    }
    
    console.log('Starting animation with state:', this.state);
    this.currentFrame = 0;
    this.armorFrame = 0;
    this.frameTimer = 0;
    this.animate();
  }
  
  /**
   * Stop animation loop
   */
  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
  
  /**
   * Animation loop - updates frames and renders
   */
  animate() {
    this.frameTimer++;
    
    // Update frame based on state
    if (this.state === 'walking') {
      if (this.frameTimer >= ANIMATION_TIMING.WALK_FRAME_DELAY) {
        this.frameTimer = 0;
        // Walking uses 4 frames (0-3) for both skin and armor
        this.currentFrame = (this.currentFrame + 1) % 4;
        this.armorFrame = this.currentFrame;
      }
    } else if (this.state === 'attacking') {
      if (this.frameTimer >= ANIMATION_TIMING.ATTACK_FRAME_DELAY) {
        this.frameTimer = 0;
        // Attack uses 2 frames (0-1)
        this.currentFrame = (this.currentFrame + 1) % 2;
        this.armorFrame = this.currentFrame;
      }
    } else if (this.state === 'spell') {
      if (this.frameTimer >= ANIMATION_TIMING.SPELL_FRAME_DELAY) {
        this.frameTimer = 0;
        // Spell uses 2 frames (0-1): standing and raised hand
        this.currentFrame = (this.currentFrame + 1) % 2;
      }
    }
    
    this.render();
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }
  
  /**
   * Render current frame to canvas
   */
  render() {
    if (!this.canvas || !this.ctx) {
      console.error('Canvas or context not initialized');
      return;
    }
    
    // Clear canvas with background color
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#2d2d30';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    // Draw layers based on current state
    if (this.state === 'standing') {
      drawStanding(
        this.ctx,
        this.sprites,
        this.gender,
        this.skinTone,
        this.direction,
        this.state,
        this.currentFrame,
        this.zoomLevel,
        centerX,
        centerY
      );
    } else if (this.state === 'walking') {
      drawWalking(
        this.ctx,
        this.sprites,
        this.gender,
        this.skinTone,
        this.direction,
        this.state,
        this.currentFrame,
        this.zoomLevel,
        centerX,
        centerY
      );
    } else if (this.state === 'attacking') {
      drawAttacking(
        this.ctx,
        this.sprites,
        this.gender,
        this.skinTone,
        this.direction,
        this.state,
        this.currentFrame,
        this.armorFrame,
        this.zoomLevel,
        centerX,
        centerY
      );
    } else if (this.state === 'sitting') {
      // Get appropriate sitting frame based on direction and type
      // ChairDownRight: 16, ChairUpLeft: 17, FloorDownRight: 18, FloorUpLeft: 19
      const isUpLeft = this.direction === 'up' || this.direction === 'left';
      const sittingFrame = this.sittingType === 'floor'
        ? (isUpLeft ? 19 : 18) // Floor frames
        : (isUpLeft ? 17 : 16); // Chair frames
      
      drawSitting(
        this.ctx,
        this.sprites,
        this.gender,
        this.skinTone,
        this.direction,
        this.state,
        sittingFrame,
        this.sittingType,
        this.zoomLevel,
        centerX,
        centerY
      );
    } else if (this.state === 'spell') {
      // Spell animation alternates between standing and raised hand
      // RaisedHandDownRight: 14, RaisedHandUpLeft: 15
      // StandingDownRight: 0, StandingUpLeft: 1
      const isUpLeft = this.direction === 'up' || this.direction === 'left';
      const spellFrame = this.currentFrame === 0
        ? (isUpLeft ? 1 : 0)   // Standing frame
        : (isUpLeft ? 15 : 14); // Raised hand frame
      
      drawSpell(
        this.ctx,
        this.sprites,
        this.gender,
        this.skinTone,
        this.direction,
        this.state,
        spellFrame,
        this.zoomLevel,
        centerX,
        centerY
      );
    }
    
    // Debug info
    this.ctx.fillStyle = '#cccccc';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`State: ${this.state} | Frame: ${this.currentFrame} | Zoom: ${this.zoomLevel}x`, 10, 20);
    
    // Show if no sprites loaded
    if (!this.sprites.skin) {
      this.ctx.fillStyle = '#ff6666';
      this.ctx.font = '14px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('No character sprites loaded', centerX, centerY);
      this.ctx.fillText('Check console for errors', centerX, centerY + 20);
    }
  }
  
  /**
   * Clear animator and reset state
   */
  clear() {
    this.stop();
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.sprites = {
      skin: null,
      hair: null,
      boots: null,
      armor: null,
      weapon: null,
      back: null,
      shield: null,
      helmet: null
    };
  }
}

export { CharacterAnimator };

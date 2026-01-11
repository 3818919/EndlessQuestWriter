// Character animation system for previewing equipment on a character sprite
class CharacterAnimator {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.animationFrame = null;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.state = 'standing'; // standing, walking, attacking
    this.direction = 'down'; // down, up, left, right
    
    // GFX file numbers
    this.GFX_SKIN = 8;
    this.GFX_MALE_ARMOR = 13;
    this.GFX_MALE_WEAPONS = 17;
    this.GFX_MALE_BACK = 19;
    
    // Animation timing (in frames)
    this.WALK_FRAME_DELAY = 9;
    this.ATTACK_FRAME_DELAY = 12;
    
    // Loaded sprites
    this.sprites = {
      skin: null,
      armor: null,
      weapon: null,
      back: null
    };
    
    // Item type constants (from EIF spec)
    this.ITEM_TYPE = {
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
    };
  }
  
  initialize(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false; // Pixel-perfect rendering
  }
  
  async loadGFXFile(gfxFolder, gfxNumber) {
    try {
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
  
  async loadCharacterSprites(gfxFolder, itemType, graphicId) {
    console.log('Loading character sprites:', { gfxFolder, itemType, graphicId });
    
    // Always load skin (gender = 1 for male)
    const skinData = await this.loadGFXFile(gfxFolder, this.GFX_SKIN);
    if (skinData) {
      console.log('Loaded skin data, parsing sprites...');
      this.sprites.skin = await this.loadSkinSprites(skinData);
      console.log('Skin sprites loaded:', this.sprites.skin);
    } else {
      console.error('Failed to load skin data from GFX', this.GFX_SKIN);
    }
    
    // Load equipment based on item type
    if (itemType === this.ITEM_TYPE.ARMOR) {
      console.log('Loading armor sprite...');
      await this.loadArmorSprite(gfxFolder, graphicId);
      this.state = 'walking';
    } else if (itemType === this.ITEM_TYPE.WEAPON) {
      console.log('Loading weapon sprite...');
      await this.loadWeaponSprite(gfxFolder, graphicId);
      this.state = 'attacking';
    } else if (itemType === this.ITEM_TYPE.SHIELD) {
      console.log('Loading shield sprite...');
      await this.loadBackSprite(gfxFolder, graphicId);
      this.state = 'attacking';
    } else {
      console.log('Item type not armor/weapon/shield, using standing state');
      this.state = 'standing';
    }
    
    console.log('Character sprites loaded, state:', this.state);
  }
  
  async loadSkinSprites(gfxData) {
    const sprites = {};
    
    // Skin sprites in GFX files have resource IDs offset by 100
    // GFX 1 = resource 101 = standing (4 directions)
    // GFX 2 = resource 102 = walking (4 directions x 4 frames = 16 frames)
    // GFX 3 = resource 103 = attacking melee (4 directions x 2 frames = 8 frames)
    // GFX 7 = resource 107 = attacking bow (4 directions x 1 frame = 4 frames)
    
    const standingData = GFXLoader.extractBitmapByID(gfxData, 101);
    if (standingData) {
      sprites.standing = await this.createImageFromData(standingData);
      console.log('Loaded standing sprite');
    } else {
      console.warn('Failed to load standing sprite (resource 101)');
    }
    
    const walkingData = GFXLoader.extractBitmapByID(gfxData, 102);
    if (walkingData) {
      sprites.walking = await this.createImageFromData(walkingData);
      console.log('Loaded walking sprite');
    } else {
      console.warn('Failed to load walking sprite (resource 102)');
    }
    
    const attackingData = GFXLoader.extractBitmapByID(gfxData, 103);
    if (attackingData) {
      sprites.attacking = await this.createImageFromData(attackingData);
      console.log('Loaded attacking sprite');
    } else {
      console.warn('Failed to load attacking sprite (resource 103)');
    }
    
    const bowData = GFXLoader.extractBitmapByID(gfxData, 107);
    if (bowData) {
      sprites.bow = await this.createImageFromData(bowData);
      console.log('Loaded bow sprite');
    } else {
      console.warn('Failed to load bow sprite (resource 107)');
    }
    
    return sprites;
  }
  
  async loadArmorSprite(gfxFolder, graphicId) {
    if (graphicId === 0) {
      this.sprites.armor = null;
      return;
    }
    
    const armorData = await this.loadGFXFile(gfxFolder, this.GFX_MALE_ARMOR);
    if (!armorData) return;
    
    // Armor graphics: base + sprite type offset
    // For walking: WalkFrame1=3, WalkFrame2=4, WalkFrame3=5, WalkFrame4=6
    const baseGraphic = this.getBaseArmorGraphic(graphicId);
    
    this.sprites.armor = {
      standing: null,
      walkFrames: []
    };
    
    // Load standing sprite (offset 1, +100 for PE resource ID)
    const standingData = GFXLoader.extractBitmapByID(armorData, baseGraphic + 1 + 100);
    if (standingData) {
      this.sprites.armor.standing = await this.createImageFromData(standingData);
      console.log('Loaded armor standing sprite');
    } else {
      console.warn('Failed to load armor standing sprite (resource', baseGraphic + 1 + 100, ')');
    }
    
    // Load walk frames (offsets 3-6 for down direction, +100 for PE resource ID)
    for (let frame = 0; frame < 4; frame++) {
      const frameData = GFXLoader.extractBitmapByID(armorData, baseGraphic + 3 + frame + 100);
      if (frameData) {
        this.sprites.armor.walkFrames[frame] = await this.createImageFromData(frameData);
        console.log('Loaded armor walk frame', frame);
      } else {
        console.warn('Failed to load armor walk frame', frame, '(resource', baseGraphic + 3 + frame + 100, ')');
      }
    }
  }
  
  async loadWeaponSprite(gfxFolder, graphicId) {
    if (graphicId === 0) {
      this.sprites.weapon = null;
      return;
    }
    
    const weaponData = await this.loadGFXFile(gfxFolder, this.GFX_MALE_WEAPONS);
    if (!weaponData) return;
    
    const baseGraphic = this.getBaseWeaponGraphic(graphicId);
    
    this.sprites.weapon = {
      standing: null,
      attackFrames: []
    };
    
    // Load standing sprite (+100 for PE resource ID)
    const standingData = GFXLoader.extractBitmapByID(weaponData, baseGraphic + 1 + 100);
    if (standingData) {
      this.sprites.weapon.standing = await this.createImageFromData(standingData);
      console.log('Loaded weapon standing sprite');
    } else {
      console.warn('Failed to load weapon standing sprite (resource', baseGraphic + 1 + 100, ')');
    }
    
    // Load attack frames (SwingFrame1=13, SwingFrame2=14, +100 for PE resource ID)
    for (let frame = 0; frame < 2; frame++) {
      const frameData = GFXLoader.extractBitmapByID(weaponData, baseGraphic + 13 + frame + 100);
      if (frameData) {
        this.sprites.weapon.attackFrames[frame] = await this.createImageFromData(frameData);
        console.log('Loaded weapon attack frame', frame);
      } else {
        console.warn('Failed to load weapon attack frame', frame, '(resource', baseGraphic + 13 + frame + 100, ')');
      }
    }
  }
  
  async loadBackSprite(gfxFolder, graphicId) {
    if (graphicId === 0) {
      this.sprites.back = null;
      return;
    }
    
    const backData = await this.loadGFXFile(gfxFolder, this.GFX_MALE_BACK);
    if (!backData) return;
    
    const baseGraphic = this.getBaseShieldGraphic(graphicId);
    
    this.sprites.back = {
      standing: null,
      attackFrames: []
    };
    
    // Load standing sprite (+100 for PE resource ID)
    const standingData = GFXLoader.extractBitmapByID(backData, baseGraphic + 1 + 100);
    if (standingData) {
      this.sprites.back.standing = await this.createImageFromData(standingData);
      console.log('Loaded back/shield standing sprite');
    } else {
      console.warn('Failed to load back/shield standing sprite (resource', baseGraphic + 1 + 100, ')');
    }
    
    // Load attack frame (ShieldItemOnBack_AttackingWithBow = 3, +100 for PE resource ID)
    const attackData = GFXLoader.extractBitmapByID(backData, baseGraphic + 3 + 100);
    if (attackData) {
      this.sprites.back.attackFrames[0] = await this.createImageFromData(attackData);
      console.log('Loaded back/shield attack frame');
    } else {
      console.warn('Failed to load back/shield attack frame (resource', baseGraphic + 3 + 100, ')');
    }
  }
  
  getBaseArmorGraphic(graphicId) {
    // Each armor has 50 sprites (various states and directions)
    return (graphicId - 1) * 50 + 1;
  }
  
  getBaseWeaponGraphic(graphicId) {
    // Each weapon has 100 sprites
    return (graphicId - 1) * 100 + 1;
  }
  
  getBaseShieldGraphic(graphicId) {
    // Each shield/back item has 50 sprites
    return (graphicId - 1) * 50 + 1;
  }
  

  
  createImageFromData(bitmapData) {
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
        
        // Make black pixels transparent
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0) {
            data[i + 3] = 0; // Set alpha to 0
          }
        }
        
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
  
  start() {
    if (this.animationFrame) {
      return; // Already running
    }
    
    console.log('Starting animation with state:', this.state);
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.animate();
  }
  
  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
  
  animate() {
    this.frameTimer++;
    
    // Update frame based on state
    if (this.state === 'walking') {
      if (this.frameTimer >= this.WALK_FRAME_DELAY) {
        this.frameTimer = 0;
        this.currentFrame = (this.currentFrame + 1) % 4;
      }
    } else if (this.state === 'attacking') {
      if (this.frameTimer >= this.ATTACK_FRAME_DELAY) {
        this.frameTimer = 0;
        this.currentFrame = (this.currentFrame + 1) % 2;
      }
    }
    
    this.render();
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }
  
  render() {
    if (!this.canvas || !this.ctx) {
      console.error('Canvas or context not initialized');
      return;
    }
    
    // Clear canvas with a background color for visibility
    this.ctx.fillStyle = '#2d2d30';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    // Draw layers (bottom to top)
    if (this.state === 'standing') {
      this.drawStanding(centerX, centerY);
    } else if (this.state === 'walking') {
      this.drawWalking(centerX, centerY);
    } else if (this.state === 'attacking') {
      this.drawAttacking(centerX, centerY);
    }
    
    // Debug: Show state and frame
    this.ctx.fillStyle = '#cccccc';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`State: ${this.state} | Frame: ${this.currentFrame}`, 10, 20);
    
    // Show if no sprites loaded
    if (!this.sprites.skin) {
      this.ctx.fillStyle = '#ff6666';
      this.ctx.font = '14px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('No character sprites loaded', centerX, centerY);
      this.ctx.fillText('Check console for errors', centerX, centerY + 20);
    }
  }
  
  drawStanding(centerX, centerY) {
    // Draw skin standing
    if (this.sprites.skin?.standing) {
      this.drawSkinSprite(this.sprites.skin.standing, centerX, centerY, 0, 0, 1);
    }
    
    // Draw armor standing
    if (this.sprites.armor?.standing) {
      this.drawSprite(this.sprites.armor.standing, centerX, centerY);
    }
    
    // Draw weapon standing
    if (this.sprites.weapon?.standing) {
      this.drawSprite(this.sprites.weapon.standing, centerX, centerY);
    }
    
    // Draw back item standing
    if (this.sprites.back?.standing) {
      this.drawSprite(this.sprites.back.standing, centerX, centerY);
    }
  }
  
  drawWalking(centerX, centerY) {
    // Draw skin walking frame
    if (this.sprites.skin?.walking) {
      this.drawSkinSprite(this.sprites.skin.walking, centerX, centerY, this.currentFrame, 1, 16);
    }
    
    // Draw armor walking frame
    if (this.sprites.armor?.walkFrames && this.sprites.armor.walkFrames[this.currentFrame]) {
      this.drawSprite(this.sprites.armor.walkFrames[this.currentFrame], centerX, centerY);
    }
    
    // Draw weapon walking frame (weapons also have walk frames)
    if (this.sprites.weapon?.standing) {
      this.drawSprite(this.sprites.weapon.standing, centerX, centerY);
    }
  }
  
  drawAttacking(centerX, centerY) {
    // Draw skin attacking frame
    if (this.sprites.skin?.attacking) {
      this.drawSkinSprite(this.sprites.skin.attacking, centerX, centerY, this.currentFrame, 2, 8);
    }
    
    // Draw armor (usually standing during attack)
    if (this.sprites.armor?.standing) {
      this.drawSprite(this.sprites.armor.standing, centerX, centerY);
    }
    
    // Draw weapon attacking frame
    if (this.sprites.weapon?.attackFrames && this.sprites.weapon.attackFrames[this.currentFrame]) {
      this.drawSprite(this.sprites.weapon.attackFrames[this.currentFrame], centerX, centerY);
    }
    
    // Draw back item attacking frame
    if (this.sprites.back?.attackFrames && this.sprites.back.attackFrames[0]) {
      this.drawSprite(this.sprites.back.attackFrames[0], centerX, centerY);
    }
  }
  
  drawSkinSprite(img, centerX, centerY, frame, gender, totalColumns) {
    // Skin sprite sheets are organized in a grid
    // 7 rows (races), multiple columns (directions + frames)
    // We're using race 0 (first row), male gender, down direction
    
    const rows = 7;
    const cols = totalColumns;
    const frameWidth = img.width / cols;
    const frameHeight = img.height / rows;
    
    // Gender offset: male = 1 column offset per state
    // Direction: down = 0, left = 1, up = 2, right = 3
    const directionMap = { down: 0, left: 1, up: 2, right: 3 };
    const dirOffset = directionMap[this.direction] || 0;
    
    const srcX = (gender * (cols / 2) + dirOffset + frame * 4) * frameWidth;
    const srcY = 0; // Race 0
    
    this.ctx.drawImage(
      img,
      srcX, srcY, frameWidth, frameHeight,
      centerX - frameWidth / 2, centerY - frameHeight / 2, frameWidth, frameHeight
    );
  }
  
  drawSprite(img, centerX, centerY) {
    if (!img) return;
    
    this.ctx.drawImage(
      img,
      centerX - img.width / 2,
      centerY - img.height / 2
    );
  }
  
  clear() {
    this.stop();
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.sprites = {
      skin: null,
      armor: null,
      weapon: null,
      back: null
    };
  }
}

// Make available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CharacterAnimator;
}

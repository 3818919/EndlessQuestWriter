// Character animation system for previewing equipment on a character sprite
class CharacterAnimator {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.animationFrame = null;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.armorFrame = 0;
    this.state = 'standing'; // standing, walking, attacking, spell, sitting
    this.direction = 'down'; // down, up, left, right
    this.zoomLevel = 1; // Default zoom level (1x, 2x, 3x, 4x)
    this.gender = 1; // 0 = female, 1 = male
    this.hairStyle = 0; // Hair style number
    this.hairColor = 0; // Hair color number
    this.skinTone = 0; // Skin tone (0-6)
    
    // GFX file numbers
    this.GFX_SKIN = 8;
    this.GFX_HAIR = [9, 10, 11, 12]; // Hair files for different colors
    this.GFX_MALE_ARMOR = 13;
    this.GFX_FEMALE_ARMOR = 14;
    this.GFX_MALE_WEAPONS = 17;
    this.GFX_MALE_BACK = 19;
    
    // Animation timing (in frames)
    this.WALK_FRAME_DELAY = 18;  // Doubled from 9
    this.ATTACK_FRAME_DELAY = 24; // Doubled from 12
    this.SPELL_FRAME_DELAY = 20;  // Spell casting animation
    this.SIT_FRAME_DELAY = 30;    // Sitting animation
    
    // Loaded sprites
    this.sprites = {
      skin: null,
      hair: null,
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
  
  setZoom(level) {
    this.zoomLevel = Math.max(1, Math.min(4, level)); // Clamp between 1x and 4x
    if (!this.animationFrame) {
      this.render(); // Re-render if not animating
    }
  }
  
  getZoom() {
    return this.zoomLevel;
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
  
  async loadCharacterSprites(gfxFolder, itemType, graphicId, gender = 1) {
    console.log('Loading character sprites:', { gfxFolder, itemType, graphicId, gender });
    
    // Store gender for use in sprite rendering
    this.gender = gender;
    
    // Always load skin
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
      await this.loadArmorSprite(gfxFolder, graphicId, gender);
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
  
  async loadSkinSprites(gfxData, skinTone = 0) {
    const sprites = {};
    
    // Skin sprites in GFX files have resource IDs offset by 100
    // Each skin tone has its own set of sprites: (skinTone * 40) + baseId + 100
    // GFX 1 = resource 101 = standing (4 directions)
    // GFX 2 = resource 102 = walking (4 directions x 4 frames = 16 frames)
    // GFX 3 = resource 103 = attacking melee (4 directions x 2 frames = 8 frames)
    // GFX 7 = resource 107 = attacking bow (4 directions x 1 frame = 4 frames)
    
    const toneOffset = skinTone * 40;
    
    const standingData = GFXLoader.extractBitmapByID(gfxData, 101 + toneOffset);
    if (standingData) {
      sprites.standing = await this.createImageFromData(standingData);
      console.log('Loaded standing sprite');
    } else {
      console.warn('Failed to load standing sprite (resource 101)');
    }
    
    const walkingData = GFXLoader.extractBitmapByID(gfxData, 102 + toneOffset);
    if (walkingData) {
      sprites.walking = await this.createImageFromData(walkingData);
      console.log('Loaded walking sprite');
    } else {
      console.warn('Failed to load walking sprite (resource 102)');
    }
    
    const attackingData = GFXLoader.extractBitmapByID(gfxData, 103 + toneOffset);
    if (attackingData) {
      sprites.attacking = await this.createImageFromData(attackingData);
      console.log('Loaded attacking sprite');
    } else {
      console.warn('Failed to load attacking sprite (resource 103)');
    }
    
    const bowData = GFXLoader.extractBitmapByID(gfxData, 107 + toneOffset);
    if (bowData) {
      sprites.bow = await this.createImageFromData(bowData);
      console.log('Loaded bow sprite');
    } else {
      console.warn('Failed to load bow sprite (resource 107)');
    }
    
    return sprites;
  }
  
  async loadHairSprites(gfxData, hairStyle = 0) {
    const sprites = {};
    
    // Hair sprites follow similar pattern to skin/armor
    // Each hair style has its own set of sprites
    // Offset calculation: (hairStyle - 1) * 40 + baseId + 100
    
    if (hairStyle === 0) {
      return null; // No hair
    }
    
    const styleOffset = (hairStyle - 1) * 40;
    
    const standingData = GFXLoader.extractBitmapByID(gfxData, 101 + styleOffset);
    if (standingData) {
      sprites.standing = await this.createImageFromData(standingData);
      console.log('Loaded hair standing sprite');
    }
    
    const walkingData = GFXLoader.extractBitmapByID(gfxData, 102 + styleOffset);
    if (walkingData) {
      sprites.walking = await this.createImageFromData(walkingData);
      console.log('Loaded hair walking sprite');
    }
    
    const attackingData = GFXLoader.extractBitmapByID(gfxData, 103 + styleOffset);
    if (attackingData) {
      sprites.attacking = await this.createImageFromData(attackingData);
      console.log('Loaded hair attacking sprite');
    }
    
    const bowData = GFXLoader.extractBitmapByID(gfxData, 107 + styleOffset);
    if (bowData) {
      sprites.bow = await this.createImageFromData(bowData);
      console.log('Loaded hair bow sprite');
    }
    
    return sprites;
  }
  
  async loadArmorSprite(gfxFolder, graphicId, gender = 1) {
    if (graphicId === 0) {
      this.sprites.armor = null;
      return;
    }
    
    // Load appropriate armor GFX file based on gender
    const armorGfxFile = gender === 0 ? this.GFX_FEMALE_ARMOR : this.GFX_MALE_ARMOR;
    const armorData = await this.loadGFXFile(gfxFolder, armorGfxFile);
    if (!armorData) {
      console.error(`Failed to load armor GFX file ${armorGfxFile}`);
      return;
    }
    
    // Armor graphics: base + sprite type offset
    const baseGraphic = this.getBaseArmorGraphic(graphicId);
    console.log(`Loading armor graphic ${graphicId}, base: ${baseGraphic}, gender: ${gender === 0 ? 'female' : 'male'}`);
    
    this.sprites.armor = {
      standing: null,
      walkFrames: [],
      attackFrames: []
    };
    
    // Load standing sprite (offset 1, +100 for PE resource ID)
    const standingResourceId = baseGraphic + 1 + 100;
    console.log(`Attempting to load armor standing from resource ${standingResourceId}`);
    const standingData = GFXLoader.extractBitmapByID(armorData, standingResourceId);
    if (standingData) {
      this.sprites.armor.standing = await this.createImageFromData(standingData);
      console.log('✓ Loaded armor standing sprite, dimensions:', this.sprites.armor.standing.width, 'x', this.sprites.armor.standing.height);
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
    
    // Try loading walk frames for DOWN direction (offsets 3, 4, 5)
    // EO walking animation uses 3 walk frames (WalkFrame1, WalkFrame2, WalkFrame3)
    let framesLoaded = 0;
    for (let frame = 0; frame < 3; frame++) {
      const resourceId = baseGraphic + 3 + frame + 100;
      const frameData = GFXLoader.extractBitmapByID(armorData, resourceId);
      if (frameData) {
        this.sprites.armor.walkFrames[frame] = await this.createImageFromData(frameData);
        console.log(`✓ Loaded armor walk frame ${frame} (WalkFrame${frame + 1}) from offset ${3 + frame}`);
        framesLoaded++;
      }
    }
    
    // Load attack frames (PunchFrame1=7, PunchFrame2=8)
    for (let frame = 0; frame < 2; frame++) {
      const resourceId = baseGraphic + 7 + frame + 100;
      const frameData = GFXLoader.extractBitmapByID(armorData, resourceId);
      if (frameData) {
        this.sprites.armor.attackFrames[frame] = await this.createImageFromData(frameData);
        console.log(`✓ Loaded armor attack frame ${frame} from offset ${7 + frame}`);
      }
    }
    
    console.log('Armor loading complete. Walk frames available:', framesLoaded, 'Attack frames available:', this.sprites.armor.attackFrames.length);
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
        // Skin uses 4 frames (0-3), armor uses 3 frames (0-2)
        // Cycle through frames: 0, 1, 2, 0, 1, 2...
        this.currentFrame = (this.currentFrame + 1) % 3;
        this.armorFrame = this.currentFrame;
      }
    } else if (this.state === 'attacking') {
      if (this.frameTimer >= this.ATTACK_FRAME_DELAY) {
        this.frameTimer = 0;
        this.currentFrame = (this.currentFrame + 1) % 2;
        this.armorFrame = this.currentFrame;
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
    
    // Clear canvas completely with a background color for visibility
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
  
  drawStanding(centerX, centerY) {
    // Draw skin standing (use stored gender)
    if (this.sprites.skin?.standing) {
      this.drawSkinSprite(this.sprites.skin.standing, centerX, centerY, 0, this.gender, 1);
    }
    
    // Draw armor standing (raised by 4px)
    if (this.sprites.armor?.standing) {
      this.drawSprite(this.sprites.armor.standing, centerX, centerY - 4);
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
    // Layer 1: Draw skin walking frame (base, use stored gender)
    if (this.sprites.skin?.walking) {
      this.drawSkinSprite(this.sprites.skin.walking, centerX, centerY, this.currentFrame, this.gender, 16);
    }
    
    // Layer 2: Draw armor walking frame (on top of skin, raised by additional 4px to -8 total)
    // Use walkFrames directly: frame 0 = walkFrames[0], frame 1 = walkFrames[1], etc.
    let armorSprite = null;
    if (this.sprites.armor?.walkFrames && this.sprites.armor.walkFrames[this.currentFrame]) {
      armorSprite = this.sprites.armor.walkFrames[this.currentFrame];
    } else if (this.sprites.armor?.standing) {
      // Fallback to standing frame
      armorSprite = this.sprites.armor.standing;
    }
    
    if (armorSprite) {
      this.drawSprite(armorSprite, centerX + 1, centerY - 8);
    }
    
    // Layer 3: Draw weapon (on top of armor)
    if (this.sprites.weapon?.standing) {
      this.drawSprite(this.sprites.weapon.standing, centerX, centerY);
    }
    
    // Layer 4: Draw back item if present
    if (this.sprites.back?.standing) {
      this.drawSprite(this.sprites.back.standing, centerX, centerY);
    }
  }
  
  drawAttacking(centerX, centerY) {
    // Layer 1: Draw back item first (behind character)
    if (this.sprites.back?.attackFrames && this.sprites.back.attackFrames[0]) {
      this.drawSprite(this.sprites.back.attackFrames[0], centerX, centerY);
    } else if (this.sprites.back?.standing) {
      this.drawSprite(this.sprites.back.standing, centerX, centerY);
    }
    
    // Layer 2: Draw skin attacking frame (use stored gender)
    if (this.sprites.skin?.attacking) {
      this.drawSkinSprite(this.sprites.skin.attacking, centerX, centerY, this.currentFrame, this.gender, 8);
    }
    
    // Layer 3: Draw armor attack frame on top of skin (raised by 4px)
    if (this.sprites.armor?.attackFrames && this.sprites.armor.attackFrames[this.armorFrame]) {
      this.drawSprite(this.sprites.armor.attackFrames[this.armorFrame], centerX, centerY - 4);
    } else if (this.sprites.armor?.standing) {
      // Fallback to standing frame if attack frames not available
      this.drawSprite(this.sprites.armor.standing, centerX, centerY - 4);
    }
    
    // Layer 4: Draw weapon attacking frame (on top of everything)
    // Swap weapon frames (0→1, 1→0) to align with character hands
    // Move weapon 10 pixels to the left when attacking
    const weaponFrame = 1 - this.currentFrame;
    if (this.sprites.weapon?.attackFrames && this.sprites.weapon.attackFrames[weaponFrame]) {
      this.drawSprite(this.sprites.weapon.attackFrames[weaponFrame], centerX - 8, centerY + 2);
    } else if (this.sprites.weapon?.standing) {
      // Fallback to standing frame
      this.drawSprite(this.sprites.weapon.standing, centerX - 8, centerY + 2);
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
    
    // For walking: each direction has 4 frames laid out horizontally
    // Column layout: male_down_frame0, male_down_frame1, male_down_frame2, male_down_frame3, ...
    const srcX = (gender * (cols / 2) + dirOffset * 4 + frame) * frameWidth;
    const srcY = 0; // Race 0
    
    this.ctx.drawImage(
      img,
      srcX, srcY, frameWidth, frameHeight,
      centerX - (frameWidth * this.zoomLevel) / 2, 
      centerY - (frameHeight * this.zoomLevel) / 2, 
      frameWidth * this.zoomLevel, 
      frameHeight * this.zoomLevel
    );
  }
  
  drawSprite(img, centerX, centerY, offsetX = 0, offsetY = 0) {
    if (!img) return;
    
    const scaledWidth = img.width * this.zoomLevel;
    const scaledHeight = img.height * this.zoomLevel;
    const x = centerX - scaledWidth / 2 + (offsetX * this.zoomLevel);
    const y = centerY - scaledHeight / 2 + (offsetY * this.zoomLevel);
    
    // Debug: draw a red rectangle to show where sprite would be drawn
    // this.ctx.strokeStyle = 'red';
    // this.ctx.strokeRect(x, y, scaledWidth, scaledHeight);
    
    this.ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
  }
  
  clear() {
    this.stop();
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.sprites = {
      skin: null,
      hair: null,
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
// Also expose to window for browser usage
if (typeof window !== 'undefined') {
  window.CharacterAnimator = CharacterAnimator;
}
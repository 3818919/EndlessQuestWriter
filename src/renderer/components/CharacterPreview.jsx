import React, { useEffect, useRef, useState } from 'react';

export default function CharacterPreview({
  equippedItems,
  gender,
  hairStyle,
  hairColor,
  skinTone,
  gfxCache,
  loadGfx,
  gfxFolder,
  items
}) {
  const canvasRef = useRef(null);
  const animatorRef = useRef(null);
  const [animationState, setAnimationState] = useState('walking');
  const [zoom, setZoom] = useState(2);
  const [isPlaying, setIsPlaying] = useState(true);

  // Initialize animator
  useEffect(() => {
    if (canvasRef.current && !animatorRef.current) {
      animatorRef.current = new CharacterAnimator();
      animatorRef.current.initialize(canvasRef.current);
    }
  }, []);

  // Update character appearance when equipment or appearance changes
  useEffect(() => {
    if (!animatorRef.current || !gfxFolder) return;

    const updateCharacter = async () => {
      const animator = animatorRef.current;
      
      // Stop current animation
      animator.stop();
      
      // Update appearance properties
      animator.gender = gender;
      animator.hairStyle = hairStyle;
      animator.hairColor = hairColor;
      animator.skinTone = skinTone;
      animator.zoomLevel = zoom;
      
      // Load skin sprites
      const skinData = await animator.loadGFXFile(gfxFolder, animator.GFX_SKIN);
      if (skinData) {
        animator.sprites.skin = await animator.loadSkinSprites(skinData, skinTone);
      }
      
      // Load hair sprites
      if (hairStyle > 0 && hairColor >= 0 && hairColor < animator.GFX_HAIR.length) {
        const hairGfxFile = animator.GFX_HAIR[hairColor];
        const hairData = await animator.loadGFXFile(gfxFolder, hairGfxFile);
        if (hairData) {
          animator.sprites.hair = await animator.loadHairSprites(hairData, hairStyle);
        }
      } else {
        animator.sprites.hair = null;
      }
      
      // Load equipped items
      const armor = equippedItems.armor ? items[equippedItems.armor.id] : null;
      const weapon = equippedItems.weapon ? items[equippedItems.weapon.id] : null;
      const shield = equippedItems.shield ? items[equippedItems.shield.id] : null;
      
      // Load armor if equipped
      if (armor && armor.dolGraphic) {
        await animator.loadArmorSprite(gfxFolder, armor.dolGraphic, gender);
      } else {
        animator.sprites.armor = null;
      }
      
      // Load weapon if equipped
      if (weapon && weapon.dolGraphic) {
        await animator.loadWeaponSprite(gfxFolder, weapon.dolGraphic);
      } else {
        animator.sprites.weapon = null;
      }
      
      // Load shield if equipped
      if (shield && shield.dolGraphic) {
        await animator.loadBackSprite(gfxFolder, shield.dolGraphic);
      } else {
        animator.sprites.back = null;
      }
      
      // Set animation state
      animator.state = animationState;
      
      // Start animation if playing
      if (isPlaying) {
        animator.start();
      } else {
        animator.render();
      }
    };

    updateCharacter();
  }, [equippedItems, gender, hairStyle, hairColor, skinTone, gfxFolder, animationState, zoom, isPlaying, items]);

  // Handle animation state changes
  const handleAnimationChange = (newState) => {
    setAnimationState(newState);
    if (animatorRef.current) {
      animatorRef.current.state = newState;
      animatorRef.current.currentFrame = 0;
      animatorRef.current.frameTimer = 0;
    }
  };

  // Handle play/pause
  const togglePlayback = () => {
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);
    
    if (animatorRef.current) {
      if (newIsPlaying) {
        animatorRef.current.start();
      } else {
        animatorRef.current.stop();
        animatorRef.current.render();
      }
    }
  };

  // Handle zoom change
  const handleZoomChange = (newZoom) => {
    setZoom(newZoom);
    if (animatorRef.current) {
      animatorRef.current.setZoom(newZoom);
    }
  };

  return (
    <div className="character-preview">
      <h4>Character Preview</h4>
      
      <div className="preview-controls">
        <div className="animation-controls">
          <button
            className={`btn btn-small ${animationState === 'walking' ? 'active' : ''}`}
            onClick={() => handleAnimationChange('walking')}
          >
            Walk
          </button>
          <button
            className={`btn btn-small ${animationState === 'attacking' ? 'active' : ''}`}
            onClick={() => handleAnimationChange('attacking')}
          >
            Attack
          </button>
          <button
            className={`btn btn-small ${animationState === 'spell' ? 'active' : ''}`}
            onClick={() => handleAnimationChange('spell')}
          >
            Spell
          </button>
          <button
            className={`btn btn-small ${animationState === 'sitting' ? 'active' : ''}`}
            onClick={() => handleAnimationChange('sitting')}
          >
            Sit
          </button>
        </div>

        <div className="playback-controls">
          <button
            className="btn btn-small"
            onClick={togglePlayback}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
        </div>

        <div className="zoom-controls">
          <label>Zoom:</label>
          {[1, 2, 3, 4].map(level => (
            <button
              key={level}
              className={`btn btn-small ${zoom === level ? 'active' : ''}`}
              onClick={() => handleZoomChange(level)}
            >
              {level}x
            </button>
          ))}
        </div>
      </div>

      <div className="preview-canvas-container">
        <canvas
          ref={canvasRef}
          width="400"
          height="400"
          className="preview-canvas"
        />
      </div>

      {!gfxFolder && (
        <div className="preview-warning">
          <p>⚠️ Set GFX folder to preview character</p>
        </div>
      )}
    </div>
  );
}

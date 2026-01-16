import React, { useEffect, useRef, useState } from 'react';
import { CharacterAnimator } from '../../animation/character-animator';

interface CharacterPreviewProps {
  equippedItems: Record<string, any>;
  gender: number;
  hairStyle: number;
  hairColor: number;
  skinTone: number;
  loadGfx: (gfxNumber: number, resourceId?: number) => Promise<void>;
  gfxFolder: string;
  items: Record<number, any>;
}

const CharacterPreview: React.FC<CharacterPreviewProps> = ({
  equippedItems,
  gender,
  hairStyle,
  hairColor,
  skinTone,
  loadGfx,
  gfxFolder,
  items
}) => {
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
      if (hairStyle > 0) {
        const hairGfxFile = gender === 0 ? animator.GFX_FEMALE_HAIR : animator.GFX_MALE_HAIR;
        const hairData = await animator.loadGFXFile(gfxFolder, hairGfxFile);
        if (hairData) {
          animator.sprites.hair = await animator.loadHairSprites(hairData, hairStyle, hairColor, animator.direction);
        }
      } else {
        animator.sprites.hair = null;
      }
      
      // Load equipped items
      const armor = equippedItems.armor ? items[equippedItems.armor.id] : null;
      const helmet = equippedItems.helmet ? items[equippedItems.helmet.id] : null;
      const boots = equippedItems.boots ? items[equippedItems.boots.id] : null;
      const weapon = equippedItems.weapon ? items[equippedItems.weapon.id] : null;
      const shield = equippedItems.shield ? items[equippedItems.shield.id] : null;
      
      // Load armor if equipped (layer 1 - on top of skin)
      if (armor && armor.dolGraphic) {
        await animator.loadArmorSprite(gfxFolder, armor.dolGraphic, gender);
      } else {
        animator.sprites.armor = null;
      }
      
      // Load boots if equipped (layer 2)
      if (boots && boots.dolGraphic) {
        await animator.loadBootsSprite(gfxFolder, boots.dolGraphic);
      } else {
        animator.sprites.boots = null;
      }
      
      // Load shield/back items if equipped (layer 3 - can be behind or beside character)
      if (shield && shield.dolGraphic) {
        await animator.loadShieldSprite(gfxFolder, shield.dolGraphic, shield.subType || 0);
      } else {
        animator.sprites.shield = null;
        animator.sprites.back = null;
      }
      
      // Load weapon if equipped (layer 4)
      if (weapon && weapon.dolGraphic) {
        await animator.loadWeaponSprite(gfxFolder, weapon.dolGraphic);
      } else {
        animator.sprites.weapon = null;
      }
      
      // Load helmet if equipped (layer 5 - on top of hair)
      if (helmet && helmet.dolGraphic) {
        await animator.loadHelmetSprite(gfxFolder, helmet.dolGraphic);
      } else {
        animator.sprites.helmet = null;
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
};

export default CharacterPreview;

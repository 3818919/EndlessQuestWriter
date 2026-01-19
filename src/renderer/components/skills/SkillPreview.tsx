import React, { useEffect, useState, useRef } from 'react';
import { getSpellMetadata } from '../../../animation/spell-metadata';

interface SkillPreviewProps {
  skill: any;
  loadGfx: (gfxNumber: number, resourceId?: number) => Promise<string | null>;
  gfxFolder: string | null;
}

const SkillPreview: React.FC<SkillPreviewProps> = ({ skill, loadGfx, gfxFolder }) => {
  const [iconImage, setIconImage] = useState<string | null>(null);
  const [spellSpriteSheet, setSpellSpriteSheet] = useState<HTMLImageElement | null>(null);
  const [animationFrame, setAnimationFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load sprite sheet
  useEffect(() => {
    if (!skill || !skill.graphicId || !gfxFolder) {
      setSpellSpriteSheet(null);
      return;
    }

    const loadSpellGraphic = async () => {
      const baseResourceId = 101 + (skill.graphicId - 1) * 3;
      const inFrontResourceId = baseResourceId + 2;
      // Don't subtract 100 - our GFX 024 has resources in 100+ range already
      const resourceId = inFrontResourceId;
      
      console.log(`[SkillPreview] Loading spell animation for "${skill.name}" (ID: ${skill.id})`);
      console.log(`  - graphicId: ${skill.graphicId}`);
      console.log(`  - baseResourceId: ${baseResourceId}`);
      console.log(`  - inFrontResourceId: ${inFrontResourceId}`);
      console.log(`  - resourceId: ${resourceId}`);
      
      const imageUrl = await loadGfx(24, resourceId);
      console.log(`  - Result: ${imageUrl ? 'SUCCESS' : 'FAILED (null)'}`);
      
      if (imageUrl) {
        const img = new Image();
        img.onload = () => {
          console.log(`  - Image loaded successfully, dimensions: ${img.width}x${img.height}`);
          setSpellSpriteSheet(img);
        };
        img.onerror = () => {
          console.error(`  - Image failed to load from data URL`);
        };
        img.src = imageUrl;
      } else {
        console.warn(`  - No image URL returned for spell graphic`);
      }
    };

    loadSpellGraphic();
  }, [skill?.graphicId, gfxFolder, loadGfx]);

  // Load icon
  useEffect(() => {
    if (!skill || !skill.iconId || !gfxFolder) {
      setIconImage(null);
      return;
    }

    const loadSpellIcon = async () => {
      console.log(`[SkillPreview] Loading spell icon for "${skill.name}" (ID: ${skill.id})`);
      console.log(`  - iconId from ESF: ${skill.iconId}`);
      // PE resources start at 100, so we need to add 100 to the icon ID
      const resourceId = skill.iconId + 100;
      console.log(`  - PE resourceId: ${resourceId}`);
      console.log(`  - Loading from GFX 025, resourceId: ${resourceId}`);
      
      const iconUrl = await loadGfx(25, resourceId);
      console.log(`  - Icon result: ${iconUrl ? 'SUCCESS' : 'FAILED (null)'}`);
      
      if (iconUrl) {
        setIconImage(iconUrl);
      } else {
        console.warn(`  - No icon URL returned`);
      }
    };

    loadSpellIcon();
  }, [skill?.iconId, gfxFolder, loadGfx]);

  // Draw current frame to canvas
  useEffect(() => {
    if (!spellSpriteSheet || !canvasRef.current || !skill) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const metadata = getSpellMetadata(skill.graphicId);
    const frameWidth = Math.floor(spellSpriteSheet.width / metadata.frames);
    const frameHeight = spellSpriteSheet.height;

    // Set canvas size
    canvas.width = frameWidth;
    canvas.height = frameHeight;

    // Clear canvas
    ctx.clearRect(0, 0, frameWidth, frameHeight);

    // Draw the current frame
    ctx.drawImage(
      spellSpriteSheet,
      animationFrame * frameWidth, // source X
      0, // source Y
      frameWidth, // source width
      frameHeight, // source height
      0, // dest X
      0, // dest Y
      frameWidth, // dest width
      frameHeight // dest height
    );
  }, [spellSpriteSheet, animationFrame, skill]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !spellSpriteSheet || !skill) {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
        animationTimerRef.current = null;
      }
      return;
    }

    const metadata = getSpellMetadata(skill.graphicId);
    const totalFrames = metadata.frames * metadata.loops;
    
    // Animate at ~10 FPS
    animationTimerRef.current = setInterval(() => {
      setAnimationFrame((prevFrame) => {
        const nextFrame = prevFrame + 1;
        if (nextFrame >= totalFrames) {
          return 0; // Loop back to start
        }
        return nextFrame;
      });
    }, 1000 / 5);

    return () => {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
      }
    };
  }, [isPlaying, spellSpriteSheet, skill]);

  if (!skill) {
    return (
      <div className="preview-empty">
        <p>Select a skill to preview</p>
      </div>
    );
  }

  if (!gfxFolder) {
    return (
      <div className="preview-empty">
        <p>GFX folder not set</p>
      </div>
    );
  }

  return (
    <div className="skill-preview-container">
      <div className="preview-header" style={{ display: 'flex', alignItems: 'center' }}>
        {iconImage && (
          <div 
            style={{
              width: '32px',
              height: '32px',
              backgroundImage: `url(${iconImage})`,
              backgroundSize: '200% 100%',
              backgroundPosition: '0 0',
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
              marginRight: '8px'
            }}
            title={`${skill.name} icon`}
          />
        )}
        <h3>{skill.name || `Skill ${skill.id}`}</h3>
      </div>

      <div className="skill-animation-area" style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px'
      }}>
        {spellSpriteSheet ? (
          <>
            <canvas 
              ref={canvasRef}
              style={{
                imageRendering: 'pixelated',
                border: '1px solid var(--border-primary)',
                backgroundColor: 'var(--bg-input)',
                maxWidth: '300px',
                maxHeight: '300px',
                width: 'auto',
                height: 'auto'
              }}
            />
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="btn btn-secondary"
                style={{
                  padding: '5px 15px'
                }}
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <span style={{ color: '#aaa', fontSize: '12px' }}>
                Frame: {Math.floor(animationFrame % getSpellMetadata(skill.graphicId).frames) + 1} / {getSpellMetadata(skill.graphicId).frames}
              </span>
            </div>
          </>
        ) : (
          <div style={{ 
            width: '64px', 
            height: '64px', 
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-tertiary)'
          }}>
            No Animation
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillPreview;

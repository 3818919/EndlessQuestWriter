import React, { useEffect, useState, useRef } from 'react';
import { loadGFXFile, createImageFromData } from '../../animation/sprite-loader';
import { GFX_FILES } from '../../animation/constants';
import { GFXLoader } from '../../gfx-loader';

export default function HairstyleSelector({
  gender,
  hairColor,
  hairStyle,
  setHairStyle,
  gfxFolder
}) {
  const [hairstyles, setHairstyles] = useState([]);
  const [loading, setLoading] = useState(false);
  const canvasRefs = useRef({});

  useEffect(() => {
    if (!gfxFolder) {
      setHairstyles([]);
      return;
    }

    const loadHairstyles = async () => {
      setLoading(true);
      try {
        // Load the appropriate GFX file based on gender
        const hairGfxFile = gender === 0 ? GFX_FILES.FEMALE_HAIR : GFX_FILES.MALE_HAIR;
        const hairData = await loadGFXFile(gfxFolder, hairGfxFile);
        
        if (!hairData) {
          console.error('Failed to load hair GFX file');
          setLoading(false);
          return;
        }

        // Try to load hairstyles 1-30 (most EO servers have around 20-30 styles)
        const loadedStyles = [];
        
        for (let style = 1; style <= 30; style++) {
          // Calculate resource ID for this style
          // Formula: (hairStyle - 1) * 40 + hairColor * 4 + 2 (down direction) + 100
          const baseGraphic = (style - 1) * 40 + hairColor * 4;
          const resourceId = baseGraphic + 2 + 100; // +2 for down direction, +100 for PE resource offset
          
          // Try to extract this hairstyle
          const hairBitmap = GFXLoader.extractBitmapByID(hairData, resourceId);
          
          if (hairBitmap) {
            try {
              const hairImage = await createImageFromData(hairBitmap);
              loadedStyles.push({
                style,
                image: hairImage
              });
            } catch (error) {
              // Skip this style if it fails to load
              console.debug(`Hairstyle ${style} failed to load:`, error);
            }
          } else {
            // If we get 5 consecutive misses, assume we've found all styles
            if (style > 5 && loadedStyles.length > 0) {
              const lastLoaded = loadedStyles[loadedStyles.length - 1].style;
              if (style - lastLoaded >= 5) {
                break;
              }
            }
          }
        }

        setHairstyles(loadedStyles);
      } catch (error) {
        console.error('Error loading hairstyles:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHairstyles();
  }, [gender, hairColor, gfxFolder]);

  // Render each hairstyle to its canvas
  useEffect(() => {
    hairstyles.forEach(({ style, image }) => {
      const canvas = canvasRefs.current[style];
      if (canvas && image) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Fill with a neutral background to see the hair better
        ctx.fillStyle = '#3a3a3c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Center the hair sprite in the canvas
        const scale = Math.min(
          canvas.width / image.width,
          canvas.height / image.height
        ) * 0.8; // 80% to add some padding
        
        const scaledWidth = image.width * scale;
        const scaledHeight = image.height * scale;
        const x = (canvas.width - scaledWidth) / 2;
        const y = (canvas.height - scaledHeight) / 2;
        
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(image, x, y, scaledWidth, scaledHeight);
      }
    });
  }, [hairstyles]);

  if (!gfxFolder) {
    return (
      <div className="hairstyle-selector">
        <div className="hairstyle-selector-empty">
          Set GFX folder to see hairstyle previews
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="hairstyle-selector">
        <div className="hairstyle-selector-loading">
          Loading hairstyles...
        </div>
      </div>
    );
  }

  if (hairstyles.length === 0) {
    return (
      <div className="hairstyle-selector">
        <div className="hairstyle-selector-empty">
          No hairstyles found
        </div>
      </div>
    );
  }

  return (
    <div className="hairstyle-selector">
      <div className="hairstyle-grid">
        {/* Bald/No hair option */}
        <div
          className={`hairstyle-item ${hairStyle === 0 ? 'selected' : ''}`}
          onClick={() => setHairStyle(0)}
          title="No Hair"
        >
          <div className="hairstyle-preview bald">
            <span>✕</span>
          </div>
          <div className="hairstyle-label">None</div>
        </div>

        {/* All loaded hairstyles */}
        {hairstyles.map(({ style }) => (
          <div
            key={style}
            className={`hairstyle-item ${hairStyle === style ? 'selected' : ''}`}
            onClick={() => setHairStyle(style)}
            title={`Hair Style ${style}`}
          >
            <div className="hairstyle-preview">
              <canvas
                ref={(el) => canvasRefs.current[style] = el}
                width="64"
                height="64"
              />
            </div>
            <div className="hairstyle-label">{style}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

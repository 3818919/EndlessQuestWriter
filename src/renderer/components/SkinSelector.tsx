import React, { useEffect, useState } from 'react';
import { GFXLoader } from '../../gfx-loader';
import { loadGFXFile, createImageFromData } from '../../animation/sprite-loader';

const SKIN_TONES = [
  { id: 0, name: 'White' },
  { id: 1, name: 'Tan' },
  { id: 2, name: 'Yellow' },
  { id: 3, name: 'Orc' },
  { id: 4, name: 'Skeleton' },
  { id: 5, name: 'Panda' }
];

export default function SkinSelector({ gender, hairStyle, hairColor, skinTone, setSkinTone, gfxFolder, loadGfx }) {
  const [skinPreviews, setSkinPreviews] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gfxFolder || !loadGfx) return;

    const loadSkinPreviews = async () => {
      setLoading(true);
      const previews = {};

      try {
        // Load skin sprite sheet base image (GFX 8, resource 101 - standing)
        const skinDataUrl = await loadGfx(8, 101);
        if (!skinDataUrl) {
          console.error('Failed to load skin GFX');
          setLoading(false);
          return;
        }

        // Load skin image
        const standingImage = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = skinDataUrl;
        });

        // Load hair sprite if applicable
        let hairImage = null;
        if (hairStyle > 0) {
          const hairGfxFile = gender === 0 ? 10 : 9; // Female: 10, Male: 9
          const baseGraphic = (hairStyle - 1) * 40 + hairColor * 4;
          const resourceId = baseGraphic + 2 + 100; // Down direction
          
          const hairDataUrl = await loadGfx(hairGfxFile, resourceId);
          if (hairDataUrl) {
            hairImage = await new Promise((resolve) => {
              const img = new Image();
              img.onload = () => resolve(img);
              img.onerror = () => resolve(null);
              img.src = hairDataUrl;
            });
          }
        }

        // Create preview for each skin tone
        for (const skin of SKIN_TONES) {
          const canvas = document.createElement('canvas');
          canvas.width = 80;
          canvas.height = 80;
          const ctx = canvas.getContext('2d');

          // Draw transparent or dark background
          ctx.fillStyle = '#2d2d30';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Standing sprite sheet structure:
          // - 2 columns: female (left), male (right)
          // - 7 rows (skin tones 0-6)
          const cols = 2;
          const rows = 7;
          const frameWidth = standingImage.width / (cols * 2);
          const frameHeight = standingImage.height / rows;
          
          // Select column based on gender (0 = female, 1 = male)
          const col = gender;
          const row = skin.id;
          
          const srcX = (col * 2) * frameWidth;
          const srcY = row * frameHeight;
          
          // Crop to show only the head/face (top 40% of sprite)
          const cropHeight = frameHeight * 0.4;
          const zoom = 3;
          
          const destWidth = frameWidth * zoom;
          const destHeight = cropHeight * zoom;
          const destX = (canvas.width - destWidth) / 2;
          const destY = (canvas.height - destHeight) / 2;

          ctx.imageSmoothingEnabled = false;
          
          // Create temporary canvas for skin to process transparency
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = frameWidth;
          tempCanvas.height = cropHeight;
          const tempCtx = tempCanvas.getContext('2d');
          
          tempCtx.drawImage(
            standingImage,
            srcX, srcY,
            frameWidth, cropHeight,
            0, 0,
            frameWidth, cropHeight
          );
          
          // Remove black pixels from skin
          const skinData = tempCtx.getImageData(0, 0, frameWidth, cropHeight);
          const pixels = skinData.data;
          for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i] === 0 && pixels[i + 1] === 0 && pixels[i + 2] === 0) {
              pixels[i + 3] = 0;
            }
          }
          tempCtx.putImageData(skinData, 0, 0);
          
          // Draw processed skin onto main canvas
          ctx.drawImage(
            tempCanvas,
            0, 0,
            frameWidth, cropHeight,
            destX, destY,
            destWidth, destHeight
          );

          // Draw hair on top if available (already has transparency from cache)
          if (hairImage) {
            const hairZoom = 3;
            const hairWidth = hairImage.width * hairZoom;
            const hairHeight = hairImage.height * hairZoom;
            const hairX = (canvas.width - hairWidth) / 2;
            const hairY = (canvas.height - hairHeight) / 2 + 5;
            
            ctx.drawImage(
              hairImage,
              hairX, hairY,
              hairWidth, hairHeight
            );
          }

          previews[skin.id] = canvas.toDataURL();
        }

        setSkinPreviews(previews);
      } catch (error) {
        console.error('Error loading skin previews:', error);
      }

      setLoading(false);
    };

    loadSkinPreviews();
  }, [gfxFolder, gender, hairStyle, hairColor, loadGfx]);

  if (!gfxFolder) {
    return <div className="skin-selector-placeholder">Set GFX folder to preview skins</div>;
  }

  if (loading) {
    return <div className="skin-selector-loading">Loading skin previews...</div>;
  }

  return (
    <div className="skin-selector">
      {SKIN_TONES.map(skin => (
        <button
          key={skin.id}
          className={`skin-preview ${skinTone === skin.id ? 'selected' : ''}`}
          onClick={() => setSkinTone(skin.id)}
          title={skin.name}
        >
          {skinPreviews[skin.id] ? (
            <img src={skinPreviews[skin.id]} alt={skin.name} />
          ) : (
            <div className="skin-preview-empty">{skin.id}</div>
          )}
          <span className="skin-name">{skin.name}</span>
        </button>
      ))}
    </div>
  );
}

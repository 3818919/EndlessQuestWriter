import React, { useState, useEffect } from 'react';

export default function ItemPreview({ 
  item, 
  gfxFolder,
  size = 'medium' // 'small', 'medium', 'large'
}) {
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (item && item.dolGraphic && gfxFolder) {
      loadPaperdollPreview();
    } else {
      setPreviewImage(null);
    }
  }, [item?.dolGraphic, item?.type, item?.gender, gfxFolder]);

  const getGfxFileForItemType = (type) => {
    // Map item types to GFX file numbers
    const typeMap = {
      10: 17, // WEAPON -> GFX017 (male weapons)
      11: 19, // SHIELD -> GFX019 (shields/back items)
      12: 13, // ARMOR -> GFX013 (male armor) or GFX014 (female armor)
      13: 15, // HAT -> GFX015 (hats)
      14: 16, // BOOTS -> GFX016 (boots)
      15: 16, // GLOVES -> GFX016 (same as boots)
      17: 16, // BELT -> GFX016 (same as boots)
      18: 16, // NECKLACE -> GFX016 (same as boots)
      19: 16, // RING -> GFX016 (same as boots)
      20: 16, // ARMLET -> GFX016 (same as boots)
      21: 16  // BRACER -> GFX016 (same as boots)
    };
    
    return typeMap[type] || null;
  };

  const getBaseGraphic = (dolGraphic, type) => {
    // Calculate base graphic ID (matches CharacterAnimator logic)
    // Each item has 50 offsets in the GFX file
    return (dolGraphic - 1) * 50;
  };

  const loadPaperdollPreview = async () => {
    if (!item || !item.dolGraphic || item.dolGraphic === 0) {
      setPreviewImage(null);
      return;
    }

    try {
      let gfxFile = getGfxFileForItemType(item.type);
      
      // Special handling for armor with gender
      if (item.type === 12) { // ARMOR
        gfxFile = (item.gender === 0) ? 14 : 13; // Female or Male armor
      }
      
      if (!gfxFile) {
        setPreviewImage(null);
        return;
      }

      const baseGraphic = getBaseGraphic(item.dolGraphic, item.type);
      // Standing sprite is at offset 1, +100 for PE resource ID
      const resourceId = baseGraphic + 1 + 100;

      const result = await window.electronAPI.readGFX(gfxFolder, gfxFile);
      if (!result.success) {
        console.error(`Failed to load GFX ${gfxFile}:`, result.error);
        setPreviewImage(null);
        return;
      }

      const gfxData = new Uint8Array(result.data);
      const bitmapData = window.GFXLoader.extractBitmapByID(gfxData, resourceId);
      
      if (bitmapData) {
        const canvas = document.createElement('canvas');
        const width = Math.floor(bitmapData.width);
        const height = Math.floor(bitmapData.height);
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(width, height);
        imageData.data.set(bitmapData.data);
        ctx.putImageData(imageData, 0, 0);
        setPreviewImage(canvas.toDataURL());
      } else {
        console.warn(`No bitmap found for resource ${resourceId} in GFX ${gfxFile}`);
        setPreviewImage(null);
      }
    } catch (error) {
      console.error('Error loading paperdoll preview:', error);
      setPreviewImage(null);
    }
  };

  const sizeClasses = {
    small: 'preview-small',
    medium: 'preview-medium',
    large: 'preview-large'
  };

  if (!previewImage) {
    return (
      <div className={`item-preview ${sizeClasses[size]} preview-empty`}>
        <span>No Preview</span>
      </div>
    );
  }

  return (
    <div className={`item-preview ${sizeClasses[size]}`}>
      <img src={previewImage} alt="Item preview" />
    </div>
  );
}

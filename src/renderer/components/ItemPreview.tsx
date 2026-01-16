import React, { useState, useEffect, useRef } from 'react';

export default function ItemPreview({ 
  item, 
  gfxFolder,
  loadGfx, // Use cached GFX loading function
  size = 'medium', // 'small', 'medium', 'large'
  lazy = false, // Enable lazy loading for list items
  mode = 'paperdoll' // 'paperdoll' or 'icon'
}) {
  const [previewImage, setPreviewImage] = useState(null);
  const [isVisible, setIsVisible] = useState(!lazy); // If not lazy, load immediately
  const containerRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading slightly before item comes into view
        threshold: 0.01
      }
    );

    observer.observe(containerRef.current);

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [lazy]);

  useEffect(() => {
    if (!isVisible) return;

    let isMounted = true;
    
    const loadPreview = async () => {
      if (!item || !loadGfx) {
        setPreviewImage(null);
        return;
      }

      let url = null;
      if (mode === 'icon' && item.graphic) {
        url = await loadIconPreview();
      } else if (mode === 'paperdoll' && item.dolGraphic) {
        url = await loadPaperdollPreview();
      }

      if (isMounted) {
        setPreviewImage(url);
      }
    };
    
    loadPreview();
    
    return () => {
      isMounted = false;
    };
  }, [item?.dolGraphic, item?.graphic, item?.type, item?.gender, loadGfx, isVisible, mode]);

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

  const loadIconPreview = async () => {
    if (!item || !item.graphic || item.graphic === 0) {
      return null;
    }

    try {
      // Item icons are in GFX023
      const resourceId = (2 * item.graphic) + 100;
      const dataUrl = await loadGfx(23, resourceId);
      return dataUrl;
    } catch (error) {
      console.error('Error loading icon preview:', error);
      return null;
    }
  };

  const getBaseGraphic = (dolGraphic, type) => {
    // Calculate base graphic ID (matches CharacterAnimator logic)
    // Each item has 50 offsets in the GFX file
    return (dolGraphic - 1) * 50;
  };

  const loadPaperdollPreview = async () => {
    if (!item || !item.dolGraphic || item.dolGraphic === 0 || !loadGfx) {
      return null;
    }

    try {
      let gfxFile = getGfxFileForItemType(item.type);
      
      // Special handling for armor with gender
      if (item.type === 12) { // ARMOR
        gfxFile = (item.gender === 0) ? 14 : 13; // Female or Male armor
      }
      
      if (!gfxFile) {
        return null;
      }

      const baseGraphic = getBaseGraphic(item.dolGraphic, item.type);
      // Standing sprite is at offset 1, +100 for PE resource ID
      const resourceId = baseGraphic + 1 + 100;

      // Use the cached loadGfx function instead of loading directly
      const dataUrl = await loadGfx(gfxFile, resourceId);
      return dataUrl;
    } catch (error) {
      console.error('Error loading paperdoll preview:', error);
      return null;
    }
  };

  const sizeClasses = {
    small: 'preview-small',
    medium: 'preview-medium',
    large: 'preview-large',
    fill: 'preview-fill'
  };

  if (!previewImage) {
    return (
      <div 
        ref={containerRef}
        className={`item-preview ${sizeClasses[size]} preview-empty`}
      >
        <span>{isVisible ? 'No Preview' : '...'}</span>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`item-preview ${sizeClasses[size]}`}
    >
      <img src={previewImage} alt="Item preview" />
    </div>
  );
}

import { useState, useCallback } from 'react';

const GFXLoader = window.GFXLoader;

export function useGFXCache(gfxFolder) {
  const [gfxCache, setGfxCache] = useState({});

  const loadGfx = useCallback(async (gfxNumber, resourceId) => {
    if (!gfxFolder) {
      console.warn('GFX folder not set');
      return null;
    }

    const cacheKey = `${gfxNumber}_${resourceId}`;
    
    // Return cached if available
    if (gfxCache[cacheKey]) {
      return gfxCache[cacheKey];
    }

    try {
      const gfxPath = await window.electronAPI.joinPath(
        gfxFolder,
        `gfx${String(gfxNumber).padStart(3, '0')}.egf`
      );
      
      const gfxData = await window.electronAPI.readFile(gfxPath);
      const bitmap = GFXLoader.extractBitmap(gfxData, resourceId);
      
      if (bitmap) {
        const dataUrl = GFXLoader.bitmapToDataUrl(bitmap);
        
        // Cache the result
        setGfxCache(prev => ({
          ...prev,
          [cacheKey]: dataUrl
        }));
        
        return dataUrl;
      }
    } catch (error) {
      console.error(`Error loading GFX ${gfxNumber} resource ${resourceId}:`, error);
    }

    return null;
  }, [gfxFolder, gfxCache]);

  const clearCache = useCallback(() => {
    setGfxCache({});
  }, []);

  return { gfxCache, loadGfx, clearCache };
}

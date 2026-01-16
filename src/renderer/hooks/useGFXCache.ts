import { useState, useCallback, useRef } from 'react';
import { GFXLoader } from '../../gfx-loader';

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI;

// IndexedDB helpers for storing directory handle
const DB_NAME = 'OakTreeDB';
const STORE_NAME = 'directoryHandles';

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function saveDirHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(handle, 'gfxFolder');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function getDirHandle() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get('gfxFolder');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export function useGFXCache(gfxFolder) {
  // Cache GFX file data by file number
  const gfxFileCache = useRef({});
  // Cache rendered bitmaps by gfxNumber_resourceId
  const bitmapCache = useRef({});
  // Store directory handle for browser mode
  const dirHandleRef = useRef(null);

  const loadGfx = useCallback(async (gfxNumber, resourceId) => {
    if (!gfxFolder) {
      console.warn('GFX folder not set');
      return null;
    }

    const cacheKey = `${gfxNumber}_${resourceId}`;
    
    // Return cached bitmap if available
    if (bitmapCache.current[cacheKey]) {
      return bitmapCache.current[cacheKey];
    }

    try {
      // Check if we have the GFX file data cached
      if (!gfxFileCache.current[gfxNumber]) {
        let gfxData;
        
        if (isElectron && window.electronAPI) {
          // Electron: Use IPC to read file
          const result = await window.electronAPI.readGFX(gfxFolder, gfxNumber);
          
          if (!result.success) {
            console.error(`Failed to load GFX ${gfxNumber}:`, result.error);
            return null;
          }
          
          gfxData = new Uint8Array(result.data);
        } else {
          // Browser: Use File System Access API
          if (!dirHandleRef.current) {
            // Try to get stored handle
            dirHandleRef.current = await getDirHandle();
            
            if (dirHandleRef.current) {
              // Request permission if needed
              const permission = await dirHandleRef.current.queryPermission({ mode: 'read' });
              if (permission !== 'granted') {
                const newPermission = await dirHandleRef.current.requestPermission({ mode: 'read' });
                if (newPermission !== 'granted') {
                  console.error('Permission denied to read directory');
                  return null;
                }
              }
            } else {
              console.error('No directory handle available. Please select GFX folder.');
              return null;
            }
          }
          
          // Read the GFX file
          const fileName = `gfx${String(gfxNumber).padStart(3, '0')}.egf`;
          const fileHandle = await dirHandleRef.current.getFileHandle(fileName);
          const file = await fileHandle.getFile();
          const arrayBuffer = await file.arrayBuffer();
          gfxData = new Uint8Array(arrayBuffer);
        }
        
        // Cache the GFX file data
        gfxFileCache.current[gfxNumber] = gfxData;
      }
      
      // Extract bitmap from cached GFX data
      const gfxData = gfxFileCache.current[gfxNumber];
      const bitmapData = GFXLoader.extractBitmapByID(gfxData, resourceId);
      
      if (bitmapData) {
        // Convert BMP to canvas and get data URL
        const dataUrl = await bitmapToCanvasDataURL(bitmapData);
        
        // Cache the result
        bitmapCache.current[cacheKey] = dataUrl;
        
        return dataUrl;
      }
    } catch (error) {
      console.error(`Error loading GFX ${gfxNumber} resource ${resourceId}:`, error);
    }

    return null;
  }, [gfxFolder]);

  const bitmapToCanvasDataURL = (bitmapData) => {
    return new Promise((resolve) => {
      const blob = new Blob([bitmapData], { type: 'image/bmp' });
      const blobUrl = URL.createObjectURL(blob);
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/png');
        URL.revokeObjectURL(blobUrl);
        resolve(dataUrl);
      };
      img.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        resolve(null);
      };
      img.src = blobUrl;
    });
  };

  const clearCache = useCallback(() => {
    gfxFileCache.current = {};
    bitmapCache.current = {};
    dirHandleRef.current = null;
  }, []);

  return { loadGfx, clearCache, saveDirHandle };
}

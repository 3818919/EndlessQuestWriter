import { useCallback, useRef, useState } from 'react';
import { GFXLoader } from '../../gfx-loader';

/**
 * GFX Cache Hook with Background Loading Support
 * 
 * This hook implements multi-threaded behavior in Electron:
 * - Background GFX loading happens asynchronously via IPC (Inter-Process Communication)
 * - The main process (Node.js) handles file I/O without blocking the renderer (UI)
 * - Progress updates are sent via IPC events, keeping UI responsive
 * - Individual GFX requests are cached to avoid duplicate loads
 * 
 * Key Features:
 * - startBackgroundLoading(): Preloads all GFX files in background
 * - loadGfx(): On-demand loading with caching
 * - Progress tracking with percentage and status messages
 * - Graceful handling of missing files (uses null/placeholder)
 */

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
  // Track ongoing load operations to prevent duplicate requests
  const loadingPromises = useRef({});
  // Background loading state
  const [isLoadingInBackground, setIsLoadingInBackground] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const cleanupListenerRef = useRef<(() => void) | null>(null);
  // Track which gfxFolder has been loaded to prevent re-loading
  const loadedFolderRef = useRef<string | null>(null);
  const isCurrentlyLoadingRef = useRef(false);
  
  // Global queue to serialize ALL image loading operations across entire app
  const loadQueue = useRef<Promise<any>>(Promise.resolve());

  const loadGfx = useCallback(async (gfxNumber, resourceId) => {
    if (!gfxFolder) {
      console.warn('[useGFXCache] GFX folder not set');
      return null;
    }

    console.log(`[useGFXCache] Request: GFX ${gfxNumber}, resourceId ${resourceId}`);
    
    const cacheKey = `${gfxNumber}_${resourceId}`;
    
    // Return cached bitmap if available
    if (bitmapCache.current[cacheKey]) {
      console.log(`[useGFXCache] Cache HIT: ${cacheKey}`);
      return bitmapCache.current[cacheKey];
    }

    // If already loading, return the existing promise
    if (loadingPromises.current[cacheKey]) {
      console.log(`[useGFXCache] Already loading: ${cacheKey}`);
      return loadingPromises.current[cacheKey];
    }

    console.log(`[useGFXCache] Cache MISS: ${cacheKey}, initiating load...`);

    // Queue this load to ensure only 1 image decodes at a time globally
    // This prevents browser main thread blocking from concurrent BMP decoding
    const loadPromise = loadQueue.current.then(async () => {
      const startTime = performance.now();
      try {
        // Check if we have the GFX file data cached
        if (!gfxFileCache.current[gfxNumber]) {
          let gfxData;
        
        if (isElectron && window.electronAPI) {
          // Electron: Use IPC to read file
          const result = await window.electronAPI.readGFX(gfxFolder, gfxNumber);
          
          if (!result.success) {
            console.error(`[useGFXCache] Failed to load GFX ${gfxNumber}:`, result.error);
            return null;
          }
          
          gfxData = new Uint8Array(result.data);
          console.log(`[useGFXCache] Loaded GFX ${gfxNumber}, size: ${gfxData.length} bytes`);
          
          // List all resources in GFX 024 (Spells) for debugging
          if (gfxNumber === 24) {
            const allResources = GFXLoader.listAllBitmapResources(gfxData);
            console.log(`[useGFXCache] GFX 024 contains ${allResources.length} bitmap resources:`);
            console.log(`[useGFXCache] Resource IDs: ${allResources.join(', ')}`);
          }
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
      const extractStart = performance.now();
      const bitmapData = GFXLoader.extractBitmapByID(gfxData, resourceId);
      const extractTime = performance.now() - extractStart;
      
      if (bitmapData) {
        // Convert BMP to canvas and get data URL
        const convertStart = performance.now();
        const dataUrl = await bitmapToCanvasDataURL(bitmapData);
        const convertTime = performance.now() - convertStart;
        
        const totalTime = performance.now() - startTime;
        if (totalTime > 50) {
          console.warn(`🐌 Slow GFX load: ${cacheKey} took ${totalTime.toFixed(1)}ms (extract: ${extractTime.toFixed(1)}ms, convert: ${convertTime.toFixed(1)}ms)`);
        }
        
        // Cache the result
        bitmapCache.current[cacheKey] = dataUrl;
        
        return dataUrl;
      }
      } catch (error) {
        console.error(`Error loading GFX ${gfxNumber} resource ${resourceId}:`, error);
        return null;
      }
    });

    // Track the promise
    loadingPromises.current[cacheKey] = loadPromise;
    
    // Update the queue reference to chain subsequent loads
    // Catch errors so queue doesn't break on failures
    loadQueue.current = loadPromise.then(() => {}, () => {});

    // Clean up the promise reference when done
    loadPromise.finally(() => {
      delete loadingPromises.current[cacheKey];
    });

    return loadPromise;
  }, [gfxFolder]);

  // Client-side conversion of BMP to PNG data URL (keep in renderer to avoid IPC overhead)
  const bitmapToCanvasDataURL = async (bitmapData) => {
    return new Promise((resolve) => {
      const blob = new Blob([bitmapData], { type: 'image/bmp' });
      const blobUrl = URL.createObjectURL(blob);
      const img = new Image();
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          // Draw the image
          ctx.drawImage(img, 0, 0);
          
          // Remove black background (make it transparent)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            // Check if pixel is black (RGB all 0)
            if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0) {
              data[i + 3] = 0; // Set alpha to 0 (transparent)
            }
          }
          
          ctx.putImageData(imageData, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          
          URL.revokeObjectURL(blobUrl);
          resolve(dataUrl);
        } catch (error) {
          console.error('Canvas error:', error);
          URL.revokeObjectURL(blobUrl);
          resolve(null);
        }
      };
      
      img.onerror = () => {
        console.error('Image load error');
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
    loadingPromises.current = {};
    
    // Clean up progress listener
    if (cleanupListenerRef.current) {
      cleanupListenerRef.current();
      cleanupListenerRef.current = null;
    }
  }, []);

  // Batch preload function for warming cache (throttled to avoid browser overload)
  const preloadGfxBatch = useCallback(async (requests: Array<{ gfxNumber: number; resourceId: number }>) => {
    // Load sequentially to avoid overwhelming the browser's main thread
    // Legacy BMPs cause significant browser blocking when decoded concurrently
    for (const { gfxNumber, resourceId } of requests) {
      try {
        await loadGfx(gfxNumber, resourceId);
      } catch (err) {
        console.debug(`Background preload failed for GFX ${gfxNumber}/${resourceId}:`, err);
      }
    }
  }, [loadGfx]);

  // Start background loading of all GFX files
  const startBackgroundLoading = useCallback(async () => {
    if (!isElectron || !window.electronAPI || !gfxFolder) {
      console.warn('Background GFX loading only available in Electron mode');
      return;
    }

    // Prevent duplicate loading for the same folder
    if (loadedFolderRef.current === gfxFolder || isCurrentlyLoadingRef.current) {
      console.log('GFX files already loaded or currently loading for this folder');
      return;
    }

    isCurrentlyLoadingRef.current = true;
    setIsLoadingInBackground(true);
    setLoadingProgress(0);
    setLoadingMessage('Initializing GFX loader...');

    // Set up progress listener
    if (cleanupListenerRef.current) {
      cleanupListenerRef.current();
    }

    cleanupListenerRef.current = window.electronAPI.onGFXLoadProgress((data) => {
      setLoadingProgress(data.progress);
      setLoadingMessage(`Processing ${data.fileName}... (${data.current}/${data.total})`);
    });

    try {
      console.time('⏱️ Background GFX Loading');
      // Start the background loading process
      const result = await window.electronAPI.preloadAllGFX(gfxFolder);
      console.timeEnd('⏱️ Background GFX Loading');
      
      if (result.success) {
        console.log(`✅ Loaded ${result.filesLoaded}/${result.total} GFX files into memory`);
        loadedFolderRef.current = gfxFolder;
        setLoadingMessage(`Loaded ${result.filesLoaded} GFX files`);
        
        console.time('⏱️ UI Update After GFX Load');
        // Keep at 100% for a moment before hiding
        setTimeout(() => {
          console.timeEnd('⏱️ UI Update After GFX Load');
          setIsLoadingInBackground(false);
          setLoadingProgress(0);
          setLoadingMessage('');
          console.log('✅ GFX loading complete, UI ready');
        }, 1000);
      } else {
        console.error('Failed to preload GFX files:', result.error);
        setIsLoadingInBackground(false);
      }
    } catch (error) {
      console.error('Error during background GFX loading:', error);
      setIsLoadingInBackground(false);
    } finally {
      isCurrentlyLoadingRef.current = false;
      // Clean up listener
      if (cleanupListenerRef.current) {
        cleanupListenerRef.current();
        cleanupListenerRef.current = null;
      }
    }
  }, [gfxFolder]);

  return { 
    loadGfx, 
    clearCache, 
    saveDirHandle, 
    preloadGfxBatch,
    startBackgroundLoading,
    isLoadingInBackground,
    loadingProgress,
    loadingMessage
  };
}

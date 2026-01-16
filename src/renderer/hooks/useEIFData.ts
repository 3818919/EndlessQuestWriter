import { useState, useCallback, useEffect } from 'react';
import { EIFParser, EIFRecord } from '../../eif-parser';

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI;

export function useEIFData() {
  const [eifData, setEifData] = useState({ version: 1, items: {} });
  const [currentFile, setCurrentFile] = useState(
    localStorage.getItem('lastEifFile') || null
  );
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const loadFile = useCallback(async () => {
    try {
      let fileData;
      let filePath;

      if (isElectron && window.electronAPI) {
        // Electron: Use native file dialog
        filePath = await window.electronAPI.openFile([
          { name: 'Item Files', extensions: ['eif'] },
          { name: 'All Files', extensions: ['*'] }
        ]);
        
        if (!filePath) return;

        const response = await window.electronAPI.readFile(filePath);
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to read file');
        }
        
        fileData = new Uint8Array(response.data);
      } else {
        // Browser: Use HTML file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.eif';
        
        const file = await new Promise<File | null>((resolve) => {
          input.onchange = (e) => {
            const target = e.target as HTMLInputElement;
            resolve(target.files?.[0] || null);
          };
          input.click();
        });
        
        if (!file) return;
        
        filePath = file.name;
        const arrayBuffer = await file.arrayBuffer();
        fileData = new Uint8Array(arrayBuffer);
      }
      
      const parsed = EIFParser.parse(fileData);
      
      console.log('Parsed EIF data:', parsed);
      
      // Convert records array to items object keyed by ID
      // Properties are now flat on the record object
      const items = {};
      if (parsed.records) {
        parsed.records.forEach(record => {
          if (record.name.toLowerCase() !== 'eof') {
            items[record.id] = {
              id: record.id,
              name: record.name,
              graphic: record.graphic,
              type: record.type,
              subType: record.subType,
              special: record.special,
              hp: record.hp,
              tp: record.tp,
              minDamage: record.minDam,
              maxDamage: record.maxDam,
              accuracy: record.accuracy,
              evade: record.evade,
              armor: record.armor,
              str: record.str,
              int: record.int,
              wis: record.wis,
              agi: record.agi,
              con: record.con,
              cha: record.cha,
              dolGraphic: record.dollGraphic,
              gender: record.gender,
              levelReq: record.levelReq,
              classReq: record.classReq,
              strReq: record.strReq,
              intReq: record.intReq,
              wisReq: record.wisReq,
              agiReq: record.agiReq,
              conReq: record.conReq,
              chaReq: record.chaReq,
              weight: record.weight,
              // Keep reference to original record for serialization
              _record: record
            };
          }
        });
      }
      
      const data = {
        version: 1,
        items: items
      };
      
      setEifData(data);
      setCurrentFile(filePath);
      localStorage.setItem('lastEifFile', filePath);
      
      // Select first item if exists
      const itemIds = Object.keys(items);
      if (itemIds.length > 0) {
        setSelectedItemId(parseInt(itemIds[0]));
      }
    } catch (error) {
      console.error('Error loading EIF file:', error);
      alert('Error loading EIF file: ' + error.message);
    }
  }, []);

  const loadFileFromPath = useCallback(async (filePath) => {
    // Only works in Electron
    if (!isElectron) {
      console.log('Auto-load not available in browser mode');
      return;
    }

    try {
      if (!filePath) return;

      if (!window.electronAPI) {
        console.error('Electron API not available');
        return;
      }

      const response = await window.electronAPI.readFile(filePath);
      
      if (!response.success) {
        console.error('Failed to read file:', response.error);
        // Clear invalid path from localStorage
        localStorage.removeItem('lastEifFile');
        setCurrentFile(null);
        return;
      }
      
      const fileData = new Uint8Array(response.data);
      const parsed = EIFParser.parse(fileData.buffer);
      
      console.log('Parsed EIF data from path:', parsed);
      
      // Convert records array to items object keyed by ID
      // Properties are now flat on the record object
      const items = {};
      if (parsed.records) {
        parsed.records.forEach(record => {
          if (record.name.toLowerCase() !== 'eof') {
            items[record.id] = {
              id: record.id,
              name: record.name,
              graphic: record.graphic,
              type: record.type,
              subType: record.subType,
              special: record.special,
              hp: record.hp,
              tp: record.tp,
              minDamage: record.minDam,
              maxDamage: record.maxDam,
              accuracy: record.accuracy,
              evade: record.evade,
              armor: record.armor,
              str: record.str,
              int: record.int,
              wis: record.wis,
              agi: record.agi,
              con: record.con,
              cha: record.cha,
              dolGraphic: record.dollGraphic,
              gender: record.gender,
              levelReq: record.levelReq,
              classReq: record.classReq,
              strReq: record.strReq,
              intReq: record.intReq,
              wisReq: record.wisReq,
              agiReq: record.agiReq,
              conReq: record.conReq,
              chaReq: record.chaReq,
              weight: record.weight,
              // Keep reference to original record for serialization
              _record: record
            };
          }
        });
      }
      
      const data = {
        version: 1,
        items: items
      };
      
      setEifData(data);
      setCurrentFile(filePath);
      
      // Select first item if exists
      const itemIds = Object.keys(items);
      if (itemIds.length > 0) {
        setSelectedItemId(parseInt(itemIds[0]));
      }
      
      console.log(`Auto-loaded EIF file: ${filePath}`);
    } catch (error) {
      console.error('Error loading EIF file from path:', error);
      // Clear invalid path from localStorage
      localStorage.removeItem('lastEifFile');
      setCurrentFile(null);
    }
  }, []);

  // Auto-load the last opened EIF file on startup
  useEffect(() => {
    if (!isInitialized && currentFile) {
      loadFileFromPath(currentFile);
      setIsInitialized(true);
    }
  }, [isInitialized, currentFile, loadFileFromPath]);

  const saveFile = useCallback(async () => {
    if (!currentFile) {
      alert('No file loaded to save');
      return;
    }

    try {
      // Convert flattened items back to EIFRecord format for serialization
      const records = Object.values(eifData.items).map((item: any) => {
        // Use the stored _record if available, otherwise create new
        const record = item._record || new EIFRecord(item.id);
        
        // Update record properties from flattened item
        record.name = item.name;
        record.graphic = item.graphic || 0;
        record.type = item.type || 0;
        record.subType = item.subType || 0;
        record.special = item.special || 0;
        record.hp = item.hp || 0;
        record.tp = item.tp || 0;
        record.minDam = item.minDamage || 0;
        record.maxDam = item.maxDamage || 0;
        record.accuracy = item.accuracy || 0;
        record.evade = item.evade || 0;
        record.armor = item.armor || 0;
        record.str = item.str || 0;
        record.int = item.int || 0;
        record.wis = item.wis || 0;
        record.agi = item.agi || 0;
        record.con = item.con || 0;
        record.cha = item.cha || 0;
        record.dollGraphic = item.dolGraphic || 0;
        record.gender = item.gender || 0;
        record.levelReq = item.levelReq || 0;
        record.classReq = item.classReq || 0;
        record.strReq = item.strReq || 0;
        record.intReq = item.intReq || 0;
        record.wisReq = item.wisReq || 0;
        record.agiReq = item.agiReq || 0;
        record.conReq = item.conReq || 0;
        record.chaReq = item.chaReq || 0;
        record.weight = item.weight || 0;
        
        return record;
      });
      
      const dataToSave = {
        fileType: 'EIF',
        checksum: [0, 0],
        totalLength: records.length,
        records: records
      };
      
      const fileData = EIFParser.serialize(dataToSave);
      
      if (isElectron && window.electronAPI) {
        // Electron: Save using native file API
        await window.electronAPI.writeFile(currentFile, fileData);
        alert('File saved successfully!');
      } else {
        // Browser: Download as file
        const blob = new Blob([fileData as BlobPart], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = currentFile;
        a.click();
        URL.revokeObjectURL(url);
        alert('File downloaded successfully!');
      }
    } catch (error) {
      console.error('Error saving EIF file:', error);
      alert('Error saving EIF file: ' + error.message);
    }
  }, [currentFile, eifData]);

  const addItem = useCallback(() => {
    const newId = Math.max(0, ...Object.keys(eifData.items).map(Number)) + 1;
    const newItem = {
      id: newId,
      name: `New Item ${newId}`,
      graphic: 1,
      type: 1,
      subType: 0,
      special: 0,
      hp: 0,
      tp: 0,
      minDamage: 0,
      maxDamage: 0,
      accuracy: 0,
      evade: 0,
      armor: 0,
      str: 0,
      int: 0,
      wis: 0,
      agi: 0,
      con: 0,
      cha: 0,
      levelReq: 0,
      classReq: 0,
      strReq: 0,
      intReq: 0,
      wisReq: 0,
      agiReq: 0,
      conReq: 0,
      chaReq: 0,
      weight: 0,
      size: 1,
      dolGraphic: 0,
      gender: 0,
      dualWieldGraphicId: 0
    };

    setEifData(prev => ({
      ...prev,
      items: { ...prev.items, [newId]: newItem }
    }));
    setSelectedItemId(newId);
  }, [eifData]);

  const deleteItem = useCallback((itemId) => {
    if (!confirm(`Delete item ${itemId}?`)) return;

    setEifData(prev => {
      const newItems = { ...prev.items };
      delete newItems[itemId];
      return { ...prev, items: newItems };
    });

    if (selectedItemId === itemId) {
      const remainingIds = Object.keys(eifData.items).filter(id => parseInt(id) !== itemId);
      setSelectedItemId(remainingIds.length > 0 ? parseInt(remainingIds[0]) : null);
    }
  }, [eifData, selectedItemId]);

  const duplicateItem = useCallback((itemId) => {
    const item = eifData.items[itemId];
    if (!item) return;

    const newId = Math.max(0, ...Object.keys(eifData.items).map(Number)) + 1;
    const newItem = { ...item, id: newId, name: `${item.name} (Copy)` };

    setEifData(prev => ({
      ...prev,
      items: { ...prev.items, [newId]: newItem }
    }));
    setSelectedItemId(newId);
  }, [eifData]);

  const updateItem = useCallback((itemId, updates) => {
    setEifData(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [itemId]: { ...prev.items[itemId], ...updates }
      }
    }));
  }, []);

  return {
    eifData,
    currentFile,
    selectedItemId,
    setSelectedItemId,
    loadFile,
    loadFileFromPath,
    saveFile,
    addItem,
    deleteItem,
    duplicateItem,
    updateItem,
    setEifData,
    setCurrentFile
  };
}

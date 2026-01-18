import { useState, useCallback, useEffect } from 'react';
import { EIFParser } from '../../eif-parser';
import { ENFParser } from '../../enf-parser';
import { ECFParser } from '../../ecf-parser';
import { ESFParser } from '../../esf-parser';

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI;

export function usePubData(onChangeCallback?: () => void) {
  const [eifData, setEifData] = useState({ version: 1, items: {} });
  const [enfData, setEnfData] = useState({ version: 1, npcs: {} });
  const [ecfData, setEcfData] = useState({ version: 1, classes: {} });
  const [esfData, setEsfData] = useState({ version: 1, skills: {} });
  const [pubDirectory, setPubDirectory] = useState(
    localStorage.getItem('lastPubDirectory') || null
  );
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedNpcId, setSelectedNpcId] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedSkillId, setSelectedSkillId] = useState(null);
  const [activeTab, setActiveTab] = useState<'items' | 'npcs' | 'classes' | 'skills'>('items');
  const [isInitialized, setIsInitialized] = useState(false);

  const loadDirectory = useCallback(async () => {
    try {
      let dirPath;

      if (isElectron && window.electronAPI) {
        // Electron: Use native directory dialog
        dirPath = await window.electronAPI.openDirectory();
        
        if (!dirPath) return;

        // Load EIF file
        const eifPath = `${dirPath}/dat001.eif`;
        const eifResponse = await window.electronAPI.readFile(eifPath);
        
        if (!eifResponse.success) {
          throw new Error('Could not find dat001.eif in selected directory');
        }
        
        const eifFileData = new Uint8Array(eifResponse.data);
        const parsedEif = EIFParser.parse(eifFileData.buffer);
        
        // Load ENF file
        const enfPath = `${dirPath}/dtn001.enf`;
        const enfResponse = await window.electronAPI.readFile(enfPath);
        
        let parsedEnf = { records: [] };
        if (enfResponse.success) {
          const enfFileData = new Uint8Array(enfResponse.data);
          parsedEnf = ENFParser.parse(enfFileData.buffer);
        }
        
        // Convert EIF records to items
        const items = {};
        if (parsedEif.records) {
          parsedEif.records.forEach(record => {
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
                minDamage: record.minDamage,
                maxDamage: record.maxDamage,
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
                _record: record
              };
            }
          });
        }
        
        // Convert ENF records to npcs
        const npcs = {};
        if (parsedEnf.records) {
          parsedEnf.records.forEach(record => {
            if (record.name.toLowerCase() !== 'eof') {
              npcs[record.id] = {
                id: record.id,
                name: record.name,
                graphic: record.graphic,
                hp: record.hp,
                minDamage: record.minDam,
                maxDamage: record.maxDam,
                accuracy: record.accuracy,
                evade: record.evade,
                armor: record.armor,
                exp: record.exp,
                _record: record
              };
            }
          });
        }
        
        setEifData({ version: 1, items });
        setEnfData({ version: 1, npcs });
        setPubDirectory(dirPath);
        localStorage.setItem('lastPubDirectory', dirPath);
        
        // Select first item if exists
        const itemIds = Object.keys(items);
        if (itemIds.length > 0) {
          setSelectedItemId(parseInt(itemIds[0]));
        }
        
        // Select first NPC if exists
        const npcIds = Object.keys(npcs);
        if (npcIds.length > 0) {
          setSelectedNpcId(parseInt(npcIds[0]));
        }
        
        console.log(`Loaded ${Object.keys(items).length} items and ${Object.keys(npcs).length} NPCs from ${dirPath}`);
      } else {
        alert('Directory selection is only available in Electron mode');
      }
    } catch (error) {
      console.error('Error loading pub directory:', error);
      alert('Error loading pub directory: ' + error.message);
    }
  }, []);

  const loadDirectoryFromPath = useCallback(async (dirPath: string) => {
    if (!isElectron) {
      console.log('Auto-load not available in browser mode');
      return;
    }

    try {
      if (!dirPath) return;

      if (!window.electronAPI) {
        console.error('Electron API not available');
        return;
      }

      // Check if directory still exists
      const isDir = await window.electronAPI.isDirectory(dirPath);
      if (!isDir) {
        console.error('Directory no longer exists:', dirPath);
        localStorage.removeItem('lastPubDirectory');
        setPubDirectory(null);
        return;
      }

      // Load both EIF and ENF files
      const eifPath = `${dirPath}/dat001.eif`;
      const enfPath = `${dirPath}/dtn001.enf`;

      const eifResponse = await window.electronAPI.readFile(eifPath);
      if (!eifResponse.success) {
        console.error('Failed to read EIF file:', eifResponse.error);
        return;
      }

      const enfResponse = await window.electronAPI.readFile(enfPath);
      if (!enfResponse.success) {
        console.error('Failed to read ENF file:', enfResponse.error);
        return;
      }

      const eifData = new Uint8Array(eifResponse.data);
      const enfData = new Uint8Array(enfResponse.data);

      const parsedEif = EIFParser.parse(eifData.buffer);
      const parsedEnf = ENFParser.parse(enfData.buffer);

      // Convert EIF records to items
      const items = {};
      if (parsedEif.records) {
        parsedEif.records.forEach(record => {
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
              minDamage: record.minDamage,
              maxDamage: record.maxDamage,
              accuracy: record.accuracy,
              evade: record.evade,
              armor: record.armor,
              str: record.str,
              int: record.int,
              wis: record.wis,
              agi: record.agi,
              con: record.con,
              cha: record.cha,
              dollGraphic: record.dollGraphic,
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
              _record: record
            };
          }
        });
      }

      // Convert ENF records to npcs
      const npcs = {};
      if (parsedEnf.records) {
        parsedEnf.records.forEach(record => {
          if (record.name.toLowerCase() !== 'eof') {
            npcs[record.id] = {
              id: record.id,
              name: record.name,
              graphic: record.graphic,
              hp: record.hp,
              minDamage: record.minDamage,
              maxDamage: record.maxDamage,
              accuracy: record.accuracy,
              evade: record.evade,
              armor: record.armor,
              exp: record.exp,
              _record: record
            };
          }
        });
      }

      setEifData({ version: 1, items });
      setEnfData({ version: 1, npcs });
      setPubDirectory(dirPath);
      localStorage.setItem('lastPubDirectory', dirPath);

      // Select first item/npc if exists
      const itemIds = Object.keys(items);
      if (itemIds.length > 0) {
        setSelectedItemId(parseInt(itemIds[0]));
      }
      const npcIds = Object.keys(npcs);
      if (npcIds.length > 0) {
        setSelectedNpcId(parseInt(npcIds[0]));
      }

      console.log(`Auto-loaded pub directory: ${dirPath}`);
    } catch (error) {
      console.error('Error loading pub directory from path:', error);
      localStorage.removeItem('lastPubDirectory');
      setPubDirectory(null);
    }
  }, []);

  // Auto-load disabled - we now use JSON project files
  // Projects are loaded via App.tsx loadFromJSON()
  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const saveFiles = useCallback(async () => {
    if (!pubDirectory) {
      alert('No directory loaded to save');
      return;
    }

    try {
      // Convert items to parser format
      const eifRecords = Object.values(eifData.items);

      // Convert NPCs to parser format  
      const enfRecords = Object.values(enfData.npcs);
      
      const eifDataToSave = {
        fileType: 'EIF',
        version: 1,
        records: eifRecords
      };

      const enfDataToSave = {
        fileType: 'ENF',
        version: 1,
        records: enfRecords
      };
      
      const eifFileData = EIFParser.serialize(eifDataToSave);
      const enfFileData = ENFParser.serialize(enfDataToSave);
      
      if (isElectron && window.electronAPI) {
        const eifPath = `${pubDirectory}/dat001.eif`;
        const enfPath = `${pubDirectory}/dtn001.enf`;
        
        await window.electronAPI.writeFile(eifPath, eifFileData);
        await window.electronAPI.writeFile(enfPath, enfFileData);
        alert('Files saved successfully!');
      } else {
        // Browser: Download both files
        const eifBlob = new Blob([eifFileData as BlobPart], { type: 'application/octet-stream' });
        const eifUrl = URL.createObjectURL(eifBlob);
        const eifLink = document.createElement('a');
        eifLink.href = eifUrl;
        eifLink.download = 'dat001.eif';
        eifLink.click();
        URL.revokeObjectURL(eifUrl);

        const enfBlob = new Blob([enfFileData as BlobPart], { type: 'application/octet-stream' });
        const enfUrl = URL.createObjectURL(enfBlob);
        const enfLink = document.createElement('a');
        enfLink.href = enfUrl;
        enfLink.download = 'dtn001.enf';
        enfLink.click();
        URL.revokeObjectURL(enfUrl);

        alert('Files downloaded successfully!');
      }
    } catch (error) {
      console.error('Error saving pub files:', error);
      alert('Error saving pub files: ' + error.message);
    }
  }, [pubDirectory, eifData, enfData]);

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
    if (onChangeCallback) {
      onChangeCallback();
    }
  }, [onChangeCallback]);

  const addNpc = useCallback(() => {
    const newId = Math.max(0, ...Object.keys(enfData.npcs).map(Number)) + 1;
    const newNpc = {
      id: newId,
      name: `New NPC ${newId}`,
      graphic: 1,
      hp: 10,
      minDamage: 1,
      maxDamage: 2,
      accuracy: 5,
      evade: 5,
      armor: 0,
      exp: 10
    };

    setEnfData(prev => ({
      ...prev,
      npcs: { ...prev.npcs, [newId]: newNpc }
    }));
    setSelectedNpcId(newId);
  }, [enfData]);

  const deleteNpc = useCallback((npcId) => {
    if (!confirm(`Delete NPC ${npcId}?`)) return;

    setEnfData(prev => {
      const newNpcs = { ...prev.npcs };
      delete newNpcs[npcId];
      return { ...prev, npcs: newNpcs };
    });

    if (selectedNpcId === npcId) {
      const remainingIds = Object.keys(enfData.npcs).filter(id => parseInt(id) !== npcId);
      setSelectedNpcId(remainingIds.length > 0 ? parseInt(remainingIds[0]) : null);
    }
  }, [enfData, selectedNpcId]);

  const duplicateNpc = useCallback((npcId) => {
    const npc = enfData.npcs[npcId];
    if (!npc) return;

    const newId = Math.max(0, ...Object.keys(enfData.npcs).map(Number)) + 1;
    const newNpc = { ...npc, id: newId, name: `${npc.name} (Copy)` };

    setEnfData(prev => ({
      ...prev,
      npcs: { ...prev.npcs, [newId]: newNpc }
    }));
    setSelectedNpcId(newId);
  }, [enfData]);

  const updateNpc = useCallback((npcId, updates) => {
    setEnfData(prev => ({
      ...prev,
      npcs: {
        ...prev.npcs,
        [npcId]: { ...prev.npcs[npcId], ...updates }
      }
    }));
    if (onChangeCallback) {
      onChangeCallback();
    }
  }, [onChangeCallback]);

  // Class CRUD operations
  const addClass = useCallback(() => {
    const newId = Math.max(0, ...Object.keys(ecfData.classes).map(Number)) + 1;
    const newClass = {
      id: newId,
      name: `New Class ${newId}`,
      parentType: 0,
      statGroup: 0,
      str: 0,
      int: 0,
      wis: 0,
      agi: 0,
      con: 0,
      cha: 0
    };

    setEcfData(prev => ({
      ...prev,
      classes: { ...prev.classes, [newId]: newClass }
    }));
    setSelectedClassId(newId);
  }, [ecfData]);

  const deleteClass = useCallback((classId) => {
    if (!confirm(`Delete class ${classId}?`)) return;

    setEcfData(prev => {
      const newClasses = { ...prev.classes };
      delete newClasses[classId];
      return { ...prev, classes: newClasses };
    });

    if (selectedClassId === classId) {
      const remainingIds = Object.keys(ecfData.classes).filter(id => parseInt(id) !== classId);
      setSelectedClassId(remainingIds.length > 0 ? parseInt(remainingIds[0]) : null);
    }
  }, [ecfData, selectedClassId]);

  const duplicateClass = useCallback((classId) => {
    const cls = ecfData.classes[classId];
    if (!cls) return;

    const newId = Math.max(0, ...Object.keys(ecfData.classes).map(Number)) + 1;
    const newClass = { ...cls, id: newId, name: `${cls.name} (Copy)` };

    setEcfData(prev => ({
      ...prev,
      classes: { ...prev.classes, [newId]: newClass }
    }));
    setSelectedClassId(newId);
  }, [ecfData]);

  const updateClass = useCallback((classId, updates) => {
    setEcfData(prev => ({
      ...prev,
      classes: {
        ...prev.classes,
        [classId]: { ...prev.classes[classId], ...updates }
      }
    }));
    if (onChangeCallback) {
      onChangeCallback();
    }
  }, [onChangeCallback]);

  // Skills (ESF) operations
  const addSkill = useCallback(() => {
    const newId = Math.max(0, ...Object.keys(esfData.skills).map(Number)) + 1;
    const newSkill = {
      id: newId,
      name: `New Skill ${newId}`,
      chant: '',
      iconId: 0,
      graphicId: 0,
      tpCost: 0,
      spCost: 0,
      castTime: 0,
      nature: 0,
      type: 0,
      element: 0,
      elementPower: 0,
      targetRestrict: 0,
      targetType: 0,
      targetTime: 0,
      maxSkillLevel: 1,
      minDamage: 0,
      maxDamage: 0,
      accuracy: 0,
      evade: 0,
      armor: 0,
      returnDamage: 0,
      hpHeal: 0,
      tpHeal: 0,
      spHeal: 0,
      str: 0,
      intl: 0,
      wis: 0,
      agi: 0,
      con: 0,
      cha: 0
    };
    setEsfData(prev => ({
      ...prev,
      skills: { ...prev.skills, [newId]: newSkill }
    }));
    setSelectedSkillId(newId);
  }, [esfData]);

  const deleteSkill = useCallback((skillId) => {
    if (!confirm(`Delete skill ${skillId}?`)) return;

    setEsfData(prev => {
      const newSkills = { ...prev.skills };
      delete newSkills[skillId];
      return { ...prev, skills: newSkills };
    });

    if (selectedSkillId === skillId) {
      const remainingIds = Object.keys(esfData.skills).filter(id => parseInt(id) !== skillId);
      setSelectedSkillId(remainingIds.length > 0 ? parseInt(remainingIds[0]) : null);
    }
  }, [esfData, selectedSkillId]);

  const duplicateSkill = useCallback((skillId) => {
    const skill = esfData.skills[skillId];
    if (!skill) return;

    const newId = Math.max(0, ...Object.keys(esfData.skills).map(Number)) + 1;
    const newSkill = { ...skill, id: newId, name: `${skill.name} (Copy)` };

    setEsfData(prev => ({
      ...prev,
      skills: { ...prev.skills, [newId]: newSkill }
    }));
    setSelectedSkillId(newId);
  }, [esfData]);

  const updateSkill = useCallback((skillId, updates) => {
    setEsfData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [skillId]: { ...prev.skills[skillId], ...updates }
      }
    }));
    if (onChangeCallback) {
      onChangeCallback();
    }
  }, [onChangeCallback]);

  return {
    eifData,
    enfData,
    ecfData,
    esfData,
    pubDirectory,
    selectedItemId,
    selectedNpcId,
    selectedClassId,
    selectedSkillId,
    activeTab,
    setSelectedItemId,
    setSelectedNpcId,
    setSelectedClassId,
    setSelectedSkillId,
    setActiveTab,
    loadDirectory,
    loadDirectoryFromPath,
    saveFiles,
    addItem,
    deleteItem,
    duplicateItem,
    updateItem,
    addNpc,
    deleteNpc,
    duplicateNpc,
    updateNpc,
    addClass,
    deleteClass,
    duplicateClass,
    updateClass,
    addSkill,
    deleteSkill,
    duplicateSkill,
    updateSkill,
    setEifData,
    setEnfData,
    setEcfData,
    setEsfData,
    setPubDirectory
  };
}


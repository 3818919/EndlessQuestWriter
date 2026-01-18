import { useState, useCallback, useEffect } from 'react';
import { EIFParser } from '../../eif-parser';
import { ENFParser } from '../../enf-parser';
import { ECFParser } from '../../ecf-parser';
import { ESFParser } from '../../esf-parser';
import { recordToArray, arrayToRecord } from '../../utils/dataTransforms';

interface ProjectConfig {
  name: string;
  gfxPath: string;
  createdAt: string;
  lastModified: string;
}

interface ProjectData {
  items?: Record<number, any>;
  npcs?: Record<number, any>;
  classes?: Record<number, any>;
  skills?: Record<number, any>;
  drops?: Map<number, any[]>;
  equipment?: {
    equippedItems: Record<string, any>;
    appearance: {
      gender: number;
      hairStyle: number;
      hairColor: number;
      skinTone: number;
    };
  };
}

interface UseProjectReturn {
  currentProject: string;
  dataFolder: string;
  gfxFolder: string;
  createProject: (projectName: string, gfxPath: string, eifPath?: string, enfPath?: string, ecfPath?: string, esfPath?: string, dropsPath?: string) => Promise<void>;
  selectProject: (projectName: string) => Promise<ProjectData | null>;
  deleteProject: (projectName: string) => Promise<void>;
  setCurrentProject: (projectName: string) => void;
  setGfxFolder: (path: string) => void;
}

export const useProject = (): UseProjectReturn => {
  const [currentProject, setCurrentProject] = useState('');
  const [dataFolder, setDataFolder] = useState('');
  const [gfxFolder, setGfxFolder] = useState('');

  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

  // Initialize data folder on mount
  useEffect(() => {
    const initializeDataFolder = async () => {
      if (isElectron && window.electronAPI) {
        const cwd = await window.electronAPI.getCwd();
        const folder = `${cwd}/.oaktree`;
        setDataFolder(folder);
        await window.electronAPI.ensureDir(folder);
      }
    };
    initializeDataFolder();
  }, []);

  const createProject = useCallback(async (
    projectName: string,
    gfxPath: string,
    eifPath?: string,
    enfPath?: string,
    ecfPath?: string,
    esfPath?: string,
    dropsPath?: string
  ) => {
    if (!dataFolder || !isElectron || !window.electronAPI) {
      throw new Error('Data folder not available');
    }

    // Validate project name
    const invalidChars = /[<>:"/\\|?*]/g;
    if (invalidChars.test(projectName)) {
      throw new Error('Project name contains invalid characters. Please use only letters, numbers, spaces, hyphens, and underscores.');
    }

    const projectFolder = `${dataFolder}/${projectName}`;
    console.log('Creating project folder:', projectFolder);
    await window.electronAPI.ensureDir(projectFolder);

    // Create config.json
    const config: ProjectConfig = {
      name: projectName,
      gfxPath: gfxPath,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    const configPath = `${projectFolder}/config.json`;
    const result = await window.electronAPI.writeTextFile(configPath, JSON.stringify(config, null, 2));

    if (!result.success) {
      throw new Error(result.error);
    }

    const importedFiles: string[] = [];

    // Import EIF if provided
    if (eifPath) {
      console.log('Importing EIF from:', eifPath);
      const fileData = await window.electronAPI.readFile(eifPath);
      if (fileData.success) {
        const eifArray = new Uint8Array(fileData.data);
        console.log('EIF file read successfully, size:', eifArray.byteLength);
        const parsedData = EIFParser.parse(eifArray.buffer);
        console.log('Parsed EIF data:', parsedData);
        console.log('Number of records:', parsedData.records?.length);
        
        const items: Record<number, any> = {};
        for (const item of parsedData.records) {
          items[item.id] = item;
        }
        console.log('Items object created, keys:', Object.keys(items).length);
        
        const itemsArray = recordToArray(items);
        console.log('Items array created, length:', itemsArray.length);
        const itemsPath = `${projectFolder}/items.json`;
        const writeResult = await window.electronAPI.writeTextFile(itemsPath, JSON.stringify(itemsArray, null, 2));
        console.log('Items write result:', writeResult);
        console.log('Items imported during project creation');
        importedFiles.push('Items');
      } else {
        console.error('Failed to read EIF file:', fileData.error);
      }
    }

    // Import ENF if provided
    if (enfPath) {
      console.log('Importing ENF from:', enfPath);
      const fileData = await window.electronAPI.readFile(enfPath);
      if (fileData.success) {
        const enfArray = new Uint8Array(fileData.data);
        console.log('ENF file read successfully, size:', enfArray.byteLength);
        const parsedData = ENFParser.parse(enfArray.buffer);
        console.log('Parsed ENF data:', parsedData);
        console.log('Number of records:', parsedData.records?.length);
        
        const npcs: Record<number, any> = {};
        for (const npc of parsedData.records) {
          npcs[npc.id] = npc;
        }
        console.log('NPCs object created, keys:', Object.keys(npcs).length);
        
        const npcsArray = recordToArray(npcs);
        console.log('NPCs array created, length:', npcsArray.length);
        const npcsPath = `${projectFolder}/npcs.json`;
        const writeResult = await window.electronAPI.writeTextFile(npcsPath, JSON.stringify(npcsArray, null, 2));
        console.log('NPCs write result:', writeResult);
        console.log('NPCs imported during project creation');
        importedFiles.push('NPCs');
      } else {
        console.error('Failed to read ENF file:', fileData.error);
      }
    }

    // Import ECF if provided
    if (ecfPath) {
      console.log('Importing ECF from:', ecfPath);
      const fileData = await window.electronAPI.readFile(ecfPath);
      if (fileData.success) {
        const ecfArray = new Uint8Array(fileData.data);
        console.log('ECF file read successfully, size:', ecfArray.byteLength);
        const parsedData = ECFParser.parse(ecfArray.buffer);
        console.log('Parsed ECF data:', parsedData);
        console.log('Number of records:', parsedData.records?.length);
        
        const classes: Record<number, any> = {};
        for (const classRecord of parsedData.records) {
          classes[classRecord.id] = classRecord;
        }
        console.log('Classes object created, keys:', Object.keys(classes).length);
        
        const classesArray = recordToArray(classes);
        console.log('Classes array created, length:', classesArray.length);
        const classesPath = `${projectFolder}/classes.json`;
        const writeResult = await window.electronAPI.writeTextFile(classesPath, JSON.stringify(classesArray, null, 2));
        console.log('Classes write result:', writeResult);
        console.log('Classes imported during project creation');
        importedFiles.push('Classes');
      } else {
        console.error('Failed to read ECF file:', fileData.error);
      }
    }

    // Import ESF if provided
    if (esfPath) {
      console.log('Importing ESF from:', esfPath);
      const fileData = await window.electronAPI.readFile(esfPath);
      if (fileData.success) {
        const esfArray = new Uint8Array(fileData.data);
        console.log('ESF file read successfully, size:', esfArray.byteLength);
        const parsedData = ESFParser.parse(esfArray.buffer);
        console.log('Parsed ESF data:', parsedData);
        console.log('Number of records:', parsedData.records?.length);
        
        const skills: Record<number, any> = {};
        for (const skillRecord of parsedData.records) {
          skills[skillRecord.id] = skillRecord;
        }
        console.log('Skills object created, keys:', Object.keys(skills).length);
        
        const skillsArray = recordToArray(skills);
        console.log('Skills array created, length:', skillsArray.length);
        const skillsPath = `${projectFolder}/skills.json`;
        const writeResult = await window.electronAPI.writeTextFile(skillsPath, JSON.stringify(skillsArray, null, 2));
        console.log('Skills write result:', writeResult);
        console.log('Skills imported during project creation');
        importedFiles.push('Skills');
      } else {
        console.error('Failed to read ESF file:', fileData.error);
      }
    }

    // Import drops.txt if provided
    if (dropsPath) {
      console.log('Importing drops from:', dropsPath);
      const result = await window.electronAPI.readTextFile(dropsPath);
      if (result.success) {
        console.log('Drops file read successfully, length:', result.data.length);
        const content = result.data;
        const dropsMap = new Map();
        const lines = content.split('\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          
          const parts = trimmed.split('=');
          if (parts.length !== 2) continue;
          
          const npcId = parseInt(parts[0].trim());
          if (isNaN(npcId)) continue;
          
          const dropItems = [];
          const itemsStr = parts[1].trim();
          const itemParts = itemsStr.split(',').map(s => s.trim());
          
          for (let i = 0; i + 3 < itemParts.length; i += 4) {
            const itemId = parseInt(itemParts[i]);
            const min = parseInt(itemParts[i + 1]);
            const max = parseInt(itemParts[i + 2]);
            const percentage = parseFloat(itemParts[i + 3]);
            
            if (!isNaN(itemId) && !isNaN(min) && !isNaN(max) && !isNaN(percentage)) {
              dropItems.push({ itemId, min, max, percentage });
            }
          }
          
          if (dropItems.length > 0) {
            dropsMap.set(npcId, dropItems);
          }
        }
        
        console.log('Drops parsed, entries:', dropsMap.size);
        const dropsArray = Array.from(dropsMap.entries()).map(([npcId, drops]) => ({ npcId, drops }));
        console.log('Drops array created, length:', dropsArray.length);
        const dropsJsonPath = `${projectFolder}/drops.json`;
        const writeResult = await window.electronAPI.writeTextFile(dropsJsonPath, JSON.stringify(dropsArray, null, 2));
        console.log('Drops write result:', writeResult);
        console.log('Drops imported during project creation');
        importedFiles.push('Drops');
      } else {
        console.error('Failed to read drops file:', result.error);
      }
    }

    // Update state
    setCurrentProject(projectName);
    setGfxFolder(gfxPath);
  }, [dataFolder]);

  const selectProject = useCallback(async (projectName: string): Promise<ProjectData | null> => {
    if (!dataFolder || !isElectron || !window.electronAPI) return null;

    try {
      console.log(`Selecting project: "${projectName}" in folder: ${dataFolder}`);
      
      const projectFolder = `${dataFolder}/${projectName}`;
      const projectData: ProjectData = {};
      let jsonFilesFound = false;
      
      // Load config to get gfxPath
      const configPath = `${projectFolder}/config.json`;
      const configResult = await window.electronAPI.readTextFile(configPath);
      if (configResult.success) {
        const config: ProjectConfig = JSON.parse(configResult.data);
        console.log('Loaded config:', config);
        setGfxFolder(config.gfxPath);
      }
      
      // Load items.json
      const itemsPath = `${projectFolder}/items.json`;
      let result = await window.electronAPI.readTextFile(itemsPath);
      if (result.success) {
        const itemsData = JSON.parse(result.data);
        if (Array.isArray(itemsData)) {
          projectData.items = arrayToRecord(itemsData);
          console.log('items.json loaded successfully');
        } else {
          projectData.items = {};
          console.log('items.json is not an array, initialized as empty');
        }
        jsonFilesFound = true;
      } else {
        projectData.items = {};
        console.log('items.json not found, initialized as empty');
      }
      
      // Load npcs.json
      const npcsPath = `${projectFolder}/npcs.json`;
      result = await window.electronAPI.readTextFile(npcsPath);
      if (result.success) {
        const npcsData = JSON.parse(result.data);
        if (Array.isArray(npcsData)) {
          projectData.npcs = arrayToRecord(npcsData);
          console.log('npcs.json loaded successfully');
        } else {
          projectData.npcs = {};
          console.log('npcs.json is not an array, initialized as empty');
        }
        jsonFilesFound = true;
      } else {
        projectData.npcs = {};
        console.log('npcs.json not found, initialized as empty');
      }
      
      // Load classes.json
      const classesPath = `${projectFolder}/classes.json`;
      result = await window.electronAPI.readTextFile(classesPath);
      if (result.success) {
        const classesData = JSON.parse(result.data);
        if (Array.isArray(classesData)) {
          projectData.classes = arrayToRecord(classesData);
          console.log('classes.json loaded successfully');
        } else {
          projectData.classes = {};
          console.log('classes.json is not an array, initialized as empty');
        }
        jsonFilesFound = true;
      } else {
        projectData.classes = {};
        console.log('classes.json not found, initialized as empty');
      }
      
      // Load skills.json
      const skillsPath = `${projectFolder}/skills.json`;
      result = await window.electronAPI.readTextFile(skillsPath);
      if (result.success) {
        const skillsData = JSON.parse(result.data);
        if (Array.isArray(skillsData)) {
          projectData.skills = arrayToRecord(skillsData);
          console.log('skills.json loaded successfully');
        } else {
          projectData.skills = {};
          console.log('skills.json is not an array, initialized as empty');
        }
        jsonFilesFound = true;
      } else {
        projectData.skills = {};
        console.log('skills.json not found, initialized as empty');
      }
      
      // Load drops.json
      const dropsPath = `${projectFolder}/drops.json`;
      result = await window.electronAPI.readTextFile(dropsPath);
      if (result.success) {
        const dropsData = JSON.parse(result.data);
        // Handle both array format and old object format
        if (Array.isArray(dropsData)) {
          // New format: [{npcId: 1, drops: [...]}, {npcId: 2, drops: [...]}]
          projectData.drops = new Map(dropsData.map((item: any) => [item.npcId, item.drops]));
          console.log('drops.json loaded successfully (array format)');
        } else if (typeof dropsData === 'object' && dropsData !== null) {
          // Old format: {"1": [...], "2": [...]}
          projectData.drops = new Map(
            Object.entries(dropsData).map(([npcId, drops]) => [parseInt(npcId), drops as any[]])
          );
          console.log('drops.json loaded successfully (legacy object format - will be converted on save)');
        } else {
          // If neither array nor object, initialize as empty Map
          projectData.drops = new Map();
          console.log('drops.json is invalid format, initialized as empty');
        }
        jsonFilesFound = true;
      } else {
        // If file doesn't exist, initialize as empty Map
        projectData.drops = new Map();
        console.log('drops.json not found, initialized as empty');
      }
      
      // Load equipment.json
      const equipmentPath = `${projectFolder}/equipment.json`;
      result = await window.electronAPI.readTextFile(equipmentPath);
      if (result.success) {
        projectData.equipment = JSON.parse(result.data);
        console.log('equipment.json loaded successfully');
        jsonFilesFound = true;
      } else {
        console.log('equipment.json not found');
      }
      
      // Update state
      setCurrentProject(projectName);
      localStorage.setItem('currentProject', projectName);
      
      // Update window title
      if (window.electronAPI) {
        await window.electronAPI.setTitle(`OakTree - EO Pub Editor - ${projectName}`);
      }
      
      if (jsonFilesFound) {
        console.log(`Project "${projectName}" loaded successfully`);
        return projectData;
      } else {
        console.warn(`Project "${projectName}" has no data files yet`);
        return null;
      }
    } catch (error) {
      console.error('Error selecting project:', error);
      throw error;
    }
  }, [dataFolder]);

  const deleteProject = useCallback(async (projectName: string) => {
    if (!dataFolder || !isElectron || !window.electronAPI) return;

    try {
      const projectFolder = `${dataFolder}/${projectName}`;
      await window.electronAPI.deleteDirectory(projectFolder);
      
      // If deleting the currently open project, clear state
      if (projectName === currentProject) {
        setCurrentProject('');
        setGfxFolder('');
        localStorage.removeItem('currentProject');
        
        // Reset window title
        if (window.electronAPI) {
          await window.electronAPI.setTitle('OakTree - EO Pub Editor');
        }
      }
      
      console.log(`Project "${projectName}" deleted successfully`);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }, [dataFolder, currentProject]);

  return {
    currentProject,
    dataFolder,
    gfxFolder,
    createProject,
    selectProject,
    deleteProject,
    setCurrentProject,
    setGfxFolder
  };
};

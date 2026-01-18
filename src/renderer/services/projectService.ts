import { recordToArray } from '../../utils/dataTransforms';

interface SaveProjectOptions {
  dataFolder: string;
  currentProject: string;
  eifData: any;
  enfData: any;
  ecfData: any;
  esfData: any;
  dropsData: Map<number, any[]>;
  equippedItems: Record<string, any>;
  appearance: {
    gender: number;
    hairStyle: number;
    hairColor: number;
    skinTone: number;
  };
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

/**
 * Service for managing project data persistence
 */
export class ProjectService {
  /**
   * Saves all project data (items, npcs, drops, equipment) to JSON files
   */
  static async saveProject(options: SaveProjectOptions): Promise<void> {
    const {
      dataFolder,
      currentProject,
      eifData,
      enfData,
      ecfData,
      esfData,
      dropsData,
      equippedItems,
      appearance
    } = options;

    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    // Create project folder
    const projectFolder = `${dataFolder}/${currentProject}`;
    await window.electronAPI.ensureDir(projectFolder);

    // Update config with last modified time
    const configPath = `${projectFolder}/config.json`;
    const configResult = await window.electronAPI.readTextFile(configPath);
    if (configResult.success) {
      const config = JSON.parse(configResult.data);
      config.lastModified = new Date().toISOString();
      await window.electronAPI.writeTextFile(configPath, JSON.stringify(config, null, 2));
    }

    // Save items.json
    const itemsArray = recordToArray(eifData.items);
    const itemsPath = `${projectFolder}/items.json`;
    let result = await window.electronAPI.writeTextFile(itemsPath, JSON.stringify(itemsArray, null, 2));
    if (!result.success) {
      throw new Error(`Failed to save items.json: ${result.error}`);
    }
    console.log('items.json saved successfully');

    // Save npcs.json
    const npcsArray = recordToArray(enfData.npcs);
    const npcsPath = `${projectFolder}/npcs.json`;
    result = await window.electronAPI.writeTextFile(npcsPath, JSON.stringify(npcsArray, null, 2));
    if (!result.success) {
      throw new Error(`Failed to save npcs.json: ${result.error}`);
    }
    console.log('npcs.json saved successfully');

    // Save classes.json
    const classesArray = recordToArray(ecfData.classes);
    const classesPath = `${projectFolder}/classes.json`;
    result = await window.electronAPI.writeTextFile(classesPath, JSON.stringify(classesArray, null, 2));
    if (!result.success) {
      throw new Error(`Failed to save classes.json: ${result.error}`);
    }
    console.log('classes.json saved successfully');

    // Save skills.json
    const skillsArray = recordToArray(esfData.skills);
    const skillsPath = `${projectFolder}/skills.json`;
    result = await window.electronAPI.writeTextFile(skillsPath, JSON.stringify(skillsArray, null, 2));
    if (!result.success) {
      throw new Error(`Failed to save skills.json: ${result.error}`);
    }
    console.log('skills.json saved successfully');

    // Save drops.json
    const dropsArray = Array.from(dropsData.entries()).map(([npcId, drops]) => ({ npcId, drops }));
    const dropsPath = `${projectFolder}/drops.json`;
    result = await window.electronAPI.writeTextFile(dropsPath, JSON.stringify(dropsArray, null, 2));
    if (!result.success) {
      throw new Error(`Failed to save drops.json: ${result.error}`);
    }
    console.log('drops.json saved successfully');

    // Save equipment.json with currently equipped items and appearance
    const equipmentData = {
      equippedItems,
      appearance
    };
    const equipmentPath = `${projectFolder}/equipment.json`;
    result = await window.electronAPI.writeTextFile(equipmentPath, JSON.stringify(equipmentData, null, 2));
    if (!result.success) {
      throw new Error(`Failed to save equipment.json: ${result.error}`);
    }
    console.log('equipment.json saved successfully');
  }

  /**
   * Restores project state from loaded project data
   */
  static restoreProjectState(
    projectData: ProjectData,
    callbacks: {
      setEifData: (data: any) => void;
      setEnfData: (data: any) => void;
      setEcfData: (data: any) => void;
      setEsfData: (data: any) => void;
      setDropsData: (data: Map<number, any[]>) => void;
      restoreEquipment: (equipment: Record<string, any>) => void;
      setGender: (gender: number) => void;
      setHairStyle: (style: number) => void;
      setHairColor: (color: number) => void;
      setSkinTone: (tone: number) => void;
    }
  ): void {
    const {
      setEifData,
      setEnfData,
      setEcfData,
      setEsfData,
      setDropsData,
      restoreEquipment,
      setGender,
      setHairStyle,
      setHairColor,
      setSkinTone
    } = callbacks;

    if (projectData.items) {
      setEifData({ version: 1, items: projectData.items });
    }
    
    if (projectData.npcs) {
      setEnfData({ version: 1, npcs: projectData.npcs });
    }
    
    if (projectData.classes) {
      setEcfData({ version: 1, classes: projectData.classes });
    }
    
    if (projectData.skills) {
      setEsfData({ version: 1, skills: projectData.skills });
    }
    
    if (projectData.drops) {
      setDropsData(projectData.drops);
    }

    // Restore equipment and appearance if available
    if (projectData.equipment) {
      if (projectData.equipment.equippedItems) {
        restoreEquipment(projectData.equipment.equippedItems);
      }
      if (projectData.equipment.appearance) {
        const { gender, hairStyle, hairColor, skinTone } = projectData.equipment.appearance;
        if (gender !== undefined) setGender(gender);
        if (hairStyle !== undefined) setHairStyle(hairStyle);
        if (hairColor !== undefined) setHairColor(hairColor);
        if (skinTone !== undefined) setSkinTone(skinTone);
      }
    }
  }
}

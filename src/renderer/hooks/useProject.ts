import { useState, useCallback, useEffect, useRef } from 'react';
import { EQFParser, QuestData, QuestAction, QuestRule } from '../../eqf-parser';

// Actions that use npcQuestId as first parameter
const NPC_QUEST_ID_ACTIONS = ['AddNpcText', 'AddNpcInput', 'AddNpcChat', 'AddNpcPM'];
const NPC_QUEST_ID_RULES = ['TalkedToNpc'];

// Helper function to replace placeholder npcQuestId (1) with actual quest ID
function replaceNpcQuestIds(quest: QuestData, questId: number): QuestData {
  return {
    ...quest,
    states: quest.states.map(state => ({
      ...state,
      actions: state.actions.map(action => {
        if (NPC_QUEST_ID_ACTIONS.includes(action.type) && action.params[0] === 1) {
          const newParams = [questId, ...action.params.slice(1)];
          return {
            ...action,
            params: newParams,
            rawText: `${action.type}(${newParams.map(p => typeof p === 'string' ? `"${p}"` : p).join(', ')});`
          };
        }
        return action;
      }),
      rules: state.rules.map(rule => {
        if (NPC_QUEST_ID_RULES.includes(rule.type) && rule.params[0] === 1) {
          const newParams = [questId, ...rule.params.slice(1)];
          return {
            ...rule,
            params: newParams,
            rawText: `${rule.type}(${newParams.map(p => typeof p === 'string' ? `"${p}"` : p).join(', ')}) goto ${rule.gotoState}`
          };
        }
        return rule;
      })
    }))
  };
}

export type TabType = 'quests' | 'credits';

interface ProjectConfig {
  name: string;
  serverPath: string;
  createdAt: string;
  lastModified: string;
}

interface ProjectData {
  quests?: Record<number, QuestData>;
}

interface UseProjectReturn {
  currentProject: string;
  projectName: string;
  serverPath: string;
  linkProject: (projectName: string, serverPath: string) => Promise<void>;
  selectProject: (projectName: string) => Promise<ProjectData | null>;
  deleteProject: (projectName: string) => Promise<void>;
  updateProjectSettings: (settings: { projectName?: string; serverPath?: string }) => Promise<void>;
  setCurrentProject: (projectPath: string) => void;
  setServerPath: (path: string) => void;
  createQuest: (questData: { id: number; name: string; version: number; hidden: boolean }, templateName?: string) => Promise<number>;
  updateQuest: (questId: number, updates: Partial<QuestData>) => Promise<void>;
  deleteQuest: (questId: number) => Promise<void>;
  importQuest: (eqfPath: string) => Promise<number>;
  exportQuest: (questId: number, savePath?: string) => Promise<void>;
  duplicateQuest: (questId: number) => Promise<number>;
  loadAllQuests: () => Promise<Record<number, QuestData>>;
}

export const useProject = (): UseProjectReturn => {
  const [currentProject, setCurrentProject] = useState('');
  const [projectName, setProjectName] = useState('');
  const [serverPath, setServerPath] = useState('');
  const [appDataDir, setAppDataDir] = useState('');
  
  // Cache for loaded quest IDs to avoid re-scanning
  const questIdsCache = useRef<Set<number>>(new Set());

  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

  // Initialize app data directory on mount
  useEffect(() => {
    const initializeAppDataDir = async () => {
      if (isElectron && window.electronAPI) {
        const homeDir = await window.electronAPI.getHomeDir();
        const folder = `${homeDir}/.endless-quest-writer`;
        setAppDataDir(folder);
        await window.electronAPI.ensureDir(folder);
      }
    };
    initializeAppDataDir();
  }, []);

  const getQuestsPath = useCallback(() => {
    return serverPath ? `${serverPath}/data/quests` : '';
  }, [serverPath]);

  // Optimized: Load all quests using directory listing and batch read
  const loadAllQuests = useCallback(async (): Promise<Record<number, QuestData>> => {
    if (!serverPath || !window.electronAPI) return {};

    const questsDir = `${serverPath}/data/quests`;
    const quests: Record<number, QuestData> = {};
    
    try {
      // List all .eqf files in one call
      const listResult = await window.electronAPI.listFiles(questsDir, '.eqf');
      
      if (!listResult.success || listResult.files.length === 0) {
        questIdsCache.current = new Set();
        return {};
      }

      // Extract quest IDs from filenames and build file paths
      const questFiles: { id: number; path: string }[] = [];
      for (const filename of listResult.files) {
        const match = filename.match(/^(\d+)\.eqf$/i);
        if (match) {
          const id = parseInt(match[1], 10);
          questFiles.push({ id, path: `${questsDir}/${filename}` });
        }
      }

      if (questFiles.length === 0) {
        questIdsCache.current = new Set();
        return {};
      }

      // Batch read all quest files at once
      const filePaths = questFiles.map(q => q.path);
      const batchResults = await window.electronAPI.readTextBatch(filePaths);

      // Parse all quests
      for (const { id, path } of questFiles) {
        const result = batchResults[path];
        if (result?.success && result.data) {
          try {
            const quest = EQFParser.parse(result.data, id);
            quests[id] = quest;
          } catch (parseError) {
            console.warn(`Failed to parse quest ${id}:`, parseError);
          }
        }
      }

      // Update cache
      questIdsCache.current = new Set(Object.keys(quests).map(Number));
      console.log(`Loaded ${Object.keys(quests).length} quests`);
      
      return quests;
    } catch (error) {
      console.error('Error loading quests:', error);
      return {};
    }
  }, [serverPath]);

  const linkProject = useCallback(async (projectName: string, serverPath: string) => {
    if (!appDataDir || !isElectron || !window.electronAPI) {
      throw new Error('.oaktree directory not available');
    }

    const invalidChars = /[<>:"/\\|?*]/g;
    if (invalidChars.test(projectName)) {
      throw new Error('Project name contains invalid characters.');
    }

    const projectFolder = `${appDataDir}/${projectName}`;
    await window.electronAPI.ensureDir(projectFolder);

    const config: ProjectConfig = {
      name: projectName,
      serverPath: serverPath,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    const configPath = `${projectFolder}/config.json`;
    const result = await window.electronAPI.writeTextFile(configPath, JSON.stringify(config, null, 2));

    if (!result.success) {
      throw new Error(result.error);
    }

    const questsDir = `${serverPath}/data/quests`;
    await window.electronAPI.ensureDir(questsDir);

    setCurrentProject(projectFolder);
    setProjectName(projectName);
    setServerPath(serverPath);
    questIdsCache.current = new Set();
  }, [appDataDir]);

  const selectProject = useCallback(async (projectName: string): Promise<ProjectData | null> => {
    if (!appDataDir || !isElectron || !window.electronAPI) return null;

    try {
      const projectFolder = `${appDataDir}/${projectName}`;
      
      // Load config
      const configPath = `${projectFolder}/config.json`;
      const configResult = await window.electronAPI.readTextFile(configPath);
      if (!configResult.success) {
        throw new Error('Could not read project config');
      }
      
      const config: ProjectConfig = JSON.parse(configResult.data);
      
      // Update state first so loadAllQuests can use serverPath
      setCurrentProject(projectFolder);
      setProjectName(projectName);
      setServerPath(config.serverPath);
      localStorage.setItem('currentProject', projectName);
      
      // Update window title
      await window.electronAPI.setTitle(`Quest Editor - ${projectName}`);
      
      // Load quests using optimized batch loading
      const questsDir = `${config.serverPath}/data/quests`;
      const questsDirExists = await window.electronAPI.fileExists(questsDir);
      
      let quests: Record<number, QuestData> = {};
      if (questsDirExists) {
        // Use the optimized loading with the config's serverPath directly
        const listResult = await window.electronAPI.listFiles(questsDir, '.eqf');
        
        if (listResult.success && listResult.files.length > 0) {
          const questFiles: { id: number; path: string }[] = [];
          for (const filename of listResult.files) {
            const match = filename.match(/^(\d+)\.eqf$/i);
            if (match) {
              const id = parseInt(match[1], 10);
              questFiles.push({ id, path: `${questsDir}/${filename}` });
            }
          }

          if (questFiles.length > 0) {
            const filePaths = questFiles.map(q => q.path);
            const batchResults = await window.electronAPI.readTextBatch(filePaths);

            for (const { id, path } of questFiles) {
              const result = batchResults[path];
              if (result?.success && result.data) {
                try {
                  const quest = EQFParser.parse(result.data, id);
                  quests[id] = quest;
                } catch (parseError) {
                  console.warn(`Failed to parse quest ${id}:`, parseError);
                }
              }
            }
          }
        }
        
        questIdsCache.current = new Set(Object.keys(quests).map(Number));
        console.log(`Loaded ${Object.keys(quests).length} quests from ${questsDir}`);
      }
      
      return { quests };
    } catch (error) {
      console.error('Error selecting project:', error);
      throw error;
    }
  }, [appDataDir]);

  const updateProjectSettings = useCallback(async (settings: { projectName?: string; serverPath?: string }) => {
    if (!currentProject || !isElectron || !window.electronAPI) {
      throw new Error('No active project');
    }

    const configPath = `${currentProject}/config.json`;
    const configResult = await window.electronAPI.readTextFile(configPath);
    
    if (!configResult.success) {
      throw new Error(`Failed to read config: ${configResult.error}`);
    }

    const config = JSON.parse(configResult.data);
    
    if (settings.projectName && settings.projectName !== config.name) {
      const newProjectPath = `${appDataDir}/${settings.projectName}`;
      const exists = await window.electronAPI.pathExists(newProjectPath);
      if (exists) {
        throw new Error(`A project named "${settings.projectName}" already exists`);
      }
      
      await window.electronAPI.renameFile(currentProject, newProjectPath);
      setCurrentProject(newProjectPath);
      setProjectName(settings.projectName);
      config.name = settings.projectName;
    }
    
    if (settings.serverPath !== undefined) {
      config.serverPath = settings.serverPath;
      setServerPath(settings.serverPath);
      questIdsCache.current = new Set(); // Clear cache when server path changes
    }
    
    config.lastModified = new Date().toISOString();
    
    const writeResult = await window.electronAPI.writeTextFile(
      `${currentProject}/config.json`,
      JSON.stringify(config, null, 2)
    );
    
    if (!writeResult.success) {
      throw new Error(`Failed to save config: ${writeResult.error}`);
    }
  }, [currentProject, appDataDir]);

  const deleteProject = useCallback(async (projectName: string) => {
    if (!appDataDir || !isElectron || !window.electronAPI) return;

      const projectFolder = `${appDataDir}/${projectName}`;
      await window.electronAPI.deleteDirectory(projectFolder);
      
      if (projectFolder === currentProject) {
        setCurrentProject('');
        setProjectName('');
      setServerPath('');
      questIdsCache.current = new Set();
        localStorage.removeItem('currentProject');
      await window.electronAPI.setTitle('Quest Editor');
    }
  }, [appDataDir, currentProject]);

  // Optimized: Find next available ID using cached IDs
  const findNextQuestId = useCallback(async (): Promise<number> => {
    const questsDir = getQuestsPath();
    if (!questsDir || !window.electronAPI) return 1;

    // If cache is empty, refresh it
    if (questIdsCache.current.size === 0) {
      const listResult = await window.electronAPI.listFiles(questsDir, '.eqf');
      if (listResult.success) {
        for (const filename of listResult.files) {
          const match = filename.match(/^(\d+)\.eqf$/i);
          if (match) {
            questIdsCache.current.add(parseInt(match[1], 10));
          }
        }
      }
    }

    // Find first available ID
    let nextId = 1;
    while (questIdsCache.current.has(nextId)) {
      nextId++;
    }
    return nextId;
  }, [getQuestsPath]);

  const createQuest = useCallback(async (questData: { id: number; name: string; version: number; hidden: boolean }, templateName?: string): Promise<number> => {
    if (!serverPath || !isElectron || !window.electronAPI) {
      throw new Error('No project selected');
    }

    const questsDir = getQuestsPath();
    await window.electronAPI.ensureDir(questsDir);
    
    const nextId = questData.id;

    // Check if quest already exists
    if (questIdsCache.current.has(nextId)) {
      throw new Error(`Quest ${nextId} already exists`);
    }

      let newQuest: QuestData;
      if (templateName) {
      const { loadTemplates } = await import('../services/templateService');
      const templates = await loadTemplates();
      const template = templates[templateName];
        if (template) {
        // Replace npcQuestId placeholders with the quest ID
        newQuest = replaceNpcQuestIds({ 
          ...template, 
          id: nextId,
          questName: questData.name,
          version: questData.version,
          hidden: questData.hidden || undefined
        }, nextId);
        } else {
          throw new Error(`Template "${templateName}" not found`);
        }
      } else {
      // Create default quest with npcQuestId set to quest ID
        newQuest = {
          id: nextId,
        questName: questData.name,
        version: questData.version,
        hidden: questData.hidden || undefined,
          states: [{
            name: 'Begin',
            description: 'Quest start',
          actions: [
            {
              type: 'AddNpcText',
              params: [nextId, 'Hello! How can I help you?'],
              rawText: `AddNpcText(${nextId}, "Hello! How can I help you?");`
            },
            {
              type: 'AddNpcInput',
              params: [nextId, 1, 'Tell me more.'],
              rawText: `AddNpcInput(${nextId}, 1, "Tell me more.");`
            }
          ],
          rules: [
            {
              type: 'TalkedToNpc',
              params: [nextId],
              gotoState: 'Begin',
              rawText: `TalkedToNpc(${nextId}) goto Begin`
            }
          ]
          }],
          randomBlocks: []
        };
      }

    const eqfContent = EQFParser.serialize(newQuest);
    const questFileName = String(nextId).padStart(5, '0') + '.eqf';
    const questPath = `${questsDir}/${questFileName}`;
    
    const writeResult = await window.electronAPI.writeTextFile(questPath, eqfContent);

      if (!writeResult.success) {
        throw new Error(`Failed to save quest: ${writeResult.error}`);
      }

    // Update cache
    questIdsCache.current.add(nextId);
    
      return nextId;
  }, [serverPath, getQuestsPath, findNextQuestId]);

  const updateQuest = useCallback(async (questId: number, updates: Partial<QuestData>) => {
    if (!serverPath || !isElectron || !window.electronAPI) {
      throw new Error('No project selected');
    }

    const questsDir = getQuestsPath();
    const questFileName = String(questId).padStart(5, '0') + '.eqf';
    const questPath = `${questsDir}/${questFileName}`;

    const result = await window.electronAPI.readTextFile(questPath);
    if (!result.success) {
        throw new Error(`Quest ${questId} not found`);
      }

    const existingQuest = EQFParser.parse(result.data, questId);
    const updatedQuest = { ...existingQuest, ...updates, id: questId };
    const eqfContent = EQFParser.serialize(updatedQuest);
    
    const writeResult = await window.electronAPI.writeTextFile(questPath, eqfContent);

      if (!writeResult.success) {
        throw new Error(`Failed to update quest: ${writeResult.error}`);
      }
  }, [serverPath, getQuestsPath]);

  const deleteQuest = useCallback(async (questId: number) => {
    if (!serverPath || !isElectron || !window.electronAPI) {
      throw new Error('No project selected');
    }

    const questsDir = getQuestsPath();
    const questFileName = String(questId).padStart(5, '0') + '.eqf';
    const questPath = `${questsDir}/${questFileName}`;

    const result = await window.electronAPI.deleteFile(questPath);
    if (!result.success) {
      throw new Error(`Failed to delete quest: ${result.error}`);
    }

    // Update cache
    questIdsCache.current.delete(questId);
  }, [serverPath, getQuestsPath]);

  const importQuest = useCallback(async (eqfPath: string): Promise<number> => {
    if (!serverPath || !isElectron || !window.electronAPI) {
      throw new Error('No project selected');
    }

      const fileResult = await window.electronAPI.readTextFile(eqfPath);
      if (!fileResult.success) {
        throw new Error(`Failed to read quest file: ${fileResult.error}`);
      }

      const filename = eqfPath.split('/').pop() || eqfPath.split('\\').pop() || '';
      const match = filename.match(/(\d+)\.eqf$/i);
    let questId = match ? parseInt(match[1], 10) : null;

    const questsDir = getQuestsPath();
    await window.electronAPI.ensureDir(questsDir);

    // If no ID from filename or ID already exists, find next available
    if (!questId || questIdsCache.current.has(questId)) {
      questId = await findNextQuestId();
    }

      const parsedQuest = EQFParser.parse(fileResult.data, questId);
    const eqfContent = EQFParser.serialize(parsedQuest);

    const questFileName = String(questId).padStart(5, '0') + '.eqf';
    const questPath = `${questsDir}/${questFileName}`;
    
    const writeResult = await window.electronAPI.writeTextFile(questPath, eqfContent);

      if (!writeResult.success) {
        throw new Error(`Failed to save quest: ${writeResult.error}`);
      }

    questIdsCache.current.add(questId);
      return questId;
  }, [serverPath, getQuestsPath, findNextQuestId]);

  const exportQuest = useCallback(async (questId: number, savePath?: string) => {
    if (!serverPath || !isElectron || !window.electronAPI) {
      throw new Error('No project selected');
    }

    const questsDir = getQuestsPath();
    const questFileName = String(questId).padStart(5, '0') + '.eqf';
    const questPath = `${questsDir}/${questFileName}`;

    const result = await window.electronAPI.readTextFile(questPath);
    if (!result.success) {
        throw new Error(`Quest ${questId} not found`);
      }

      let finalPath = savePath;
      if (!finalPath) {
      const dialogResult = await window.electronAPI.saveFile(questFileName, [
          { name: 'EQF Files', extensions: ['eqf'] }
        ]);
      if (!dialogResult) return;
      finalPath = dialogResult;
    }

    const writeResult = await window.electronAPI.writeTextFile(finalPath, result.data);

      if (!writeResult.success) {
        throw new Error(`Failed to export quest: ${writeResult.error}`);
      }
  }, [serverPath, getQuestsPath]);

  const duplicateQuest = useCallback(async (questId: number): Promise<number> => {
    if (!serverPath || !isElectron || !window.electronAPI) {
      throw new Error('No project selected');
    }

    const questsDir = getQuestsPath();
    const questFileName = String(questId).padStart(5, '0') + '.eqf';
    const questPath = `${questsDir}/${questFileName}`;

    const result = await window.electronAPI.readTextFile(questPath);
    if (!result.success) {
        throw new Error(`Quest ${questId} not found`);
      }

    const originalQuest = EQFParser.parse(result.data, questId);
    const newId = await findNextQuestId();
      
      const duplicate: QuestData = {
      ...JSON.parse(JSON.stringify(originalQuest)),
        id: newId,
      questName: `${originalQuest.questName} (Copy)`
    };

    const eqfContent = EQFParser.serialize(duplicate);
    const newFileName = String(newId).padStart(5, '0') + '.eqf';
    const newPath = `${questsDir}/${newFileName}`;
    
    const writeResult = await window.electronAPI.writeTextFile(newPath, eqfContent);

      if (!writeResult.success) {
        throw new Error(`Failed to duplicate quest: ${writeResult.error}`);
      }

    questIdsCache.current.add(newId);
      return newId;
  }, [serverPath, getQuestsPath, findNextQuestId]);

  return {
    currentProject,
    projectName,
    serverPath,
    linkProject,
    selectProject,
    deleteProject,
    updateProjectSettings,
    setCurrentProject,
    setServerPath,
    createQuest,
    updateQuest,
    deleteQuest,
    importQuest,
    exportQuest,
    duplicateQuest,
    loadAllQuests
  };
};

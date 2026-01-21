import React, { useState, useCallback, useEffect } from 'react';
import LandingScreen from './pages/LandingScreen';
import EditorPage from './pages/EditorPage';
import { useProject } from './hooks/useProject';
import { QuestData, EQFParser } from '../eqf-parser';

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

const App: React.FC = () => {
  const [questData, setQuestData] = useState<Record<number, QuestData>>({});
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [configInitialized, setConfigInitialized] = useState(false);
  
  // Initialize config directory on startup (copies defaults to user config if needed)
  useEffect(() => {
    const initConfig = async () => {
      if (isElectron && window.electronAPI) {
        try {
          const result = await window.electronAPI.initializeConfig();
          if (result.success) {
            console.log('Config initialized at:', result.configDir);
          } else {
            console.warn('Config initialization warning:', result.error);
          }
        } catch (error) {
          console.error('Failed to initialize config:', error);
        }
      }
      setConfigInitialized(true);
    };
    initConfig();
  }, []);
  
  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);
  
  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  // Toggle theme function
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  // Project management hook
  const {
    currentProject,
    projectName,
    serverPath,
    linkProject,
    selectProject: selectProjectHook,
    deleteProject: deleteProjectHook,
    updateProjectSettings,
    setCurrentProject,
    setServerPath,
    createQuest: createQuestHook,
    updateQuest: updateQuestHook,
    deleteQuest: deleteQuestHook,
    importQuest: importQuestHook,
    exportQuest: exportQuestHook,
    duplicateQuest: duplicateQuestHook,
    loadAllQuests
  } = useProject();

  // Wrapper for selectProject hook to update local state
  const selectProject = async (projectName: string) => {
    try {
      const projectData = await selectProjectHook(projectName);
      if (projectData?.quests) {
        setQuestData(projectData.quests);
      }
    } catch (error) {
      console.error('Error selecting project:', error);
      alert('Error selecting project: ' + (error as Error).message);
    }
  };

  // Optimized: Only reload the specific quest that was created
  const createQuest = async (questData: { id: number; name: string; version: number; hidden: boolean }, templateName?: string) => {
    const newQuestId = await createQuestHook(questData, templateName);
    
    // Load just the new quest instead of reloading everything
    if (serverPath && window.electronAPI) {
      const questsDir = `${serverPath}/data/quests`;
      const questFileName = String(newQuestId).padStart(5, '0') + '.eqf';
      const questPath = `${questsDir}/${questFileName}`;
      
      const result = await window.electronAPI.readTextFile(questPath);
      if (result.success && result.data) {
        const quest = EQFParser.parse(result.data, newQuestId);
        setQuestData(prev => ({ ...prev, [newQuestId]: quest }));
      }
    }
    
    return newQuestId;
  };

  // Optimized: Update local state directly without reloading
  const updateQuest = async (questId: number, updates: Partial<QuestData>) => {
    await updateQuestHook(questId, updates);
    
    // Update local state directly
    setQuestData(prev => {
      const existing = prev[questId];
      if (existing) {
        return { ...prev, [questId]: { ...existing, ...updates, id: questId } };
      }
      return prev;
    });
  };

  // Optimized: Remove from local state directly
  const deleteQuest = async (questId: number) => {
    await deleteQuestHook(questId);
    
    // Remove from local state
    setQuestData(prev => {
      const { [questId]: _, ...rest } = prev;
      return rest;
    });
  };

  // Optimized: Load just the imported quest
  const importQuest = async (eqfPath: string) => {
    const questId = await importQuestHook(eqfPath);
    
    // Load just the imported quest
    if (serverPath && window.electronAPI) {
      const questsDir = `${serverPath}/data/quests`;
      const questFileName = String(questId).padStart(5, '0') + '.eqf';
      const questPath = `${questsDir}/${questFileName}`;
      
      const result = await window.electronAPI.readTextFile(questPath);
      if (result.success && result.data) {
        const quest = EQFParser.parse(result.data, questId);
        setQuestData(prev => ({ ...prev, [questId]: quest }));
      }
    }
    
    return questId;
  };

  const exportQuest = async (questId: number, savePath?: string) => {
    await exportQuestHook(questId, savePath);
  };

  // Optimized: Load just the duplicated quest
  const duplicateQuest = async (questId: number) => {
    const newQuestId = await duplicateQuestHook(questId);
    
    // Load just the new quest
    if (serverPath && window.electronAPI) {
      const questsDir = `${serverPath}/data/quests`;
      const questFileName = String(newQuestId).padStart(5, '0') + '.eqf';
      const questPath = `${questsDir}/${questFileName}`;
      
      const result = await window.electronAPI.readTextFile(questPath);
      if (result.success && result.data) {
        const quest = EQFParser.parse(result.data, newQuestId);
        setQuestData(prev => ({ ...prev, [newQuestId]: quest }));
      }
    }
    
    return newQuestId;
  };

  // Update window title with project name
  useEffect(() => {
    if (isElectron && window.electronAPI && currentProject && projectName) {
      window.electronAPI.setTitle(`Endless Quest Writer - ${projectName}`);
    }
  }, [currentProject, projectName]);

  const returnToProjects = () => {
    setCurrentProject('');
    setServerPath('');
    setQuestData({});
    
    if (window.electronAPI) {
      window.electronAPI.setTitle('Endless Quest Writer');
    }
  };

  const deleteProject = async (projectName: string) => {
    try {
      await deleteProjectHook(projectName);
      if (projectName === currentProject) {
        returnToProjects();
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error deleting project: ' + (error as Error).message);
    }
  };

  const showLandingScreen = !currentProject;

  if (showLandingScreen) {
    return (
      <LandingScreen
        onSelectProject={selectProject}
        onLinkProject={linkProject}
        onDeleteProject={deleteProject}
      />
    );
  }

  return (
    <EditorPage
      questData={questData}
      projectName={projectName}
      currentProject={currentProject}
      serverPath={serverPath}
      updateProjectSettings={updateProjectSettings}
      theme={theme}
      toggleTheme={toggleTheme}
      returnToProjects={returnToProjects}
      createQuest={createQuest}
      updateQuest={updateQuest}
      deleteQuest={deleteQuest}
      importQuest={importQuest}
      exportQuest={exportQuest}
      duplicateQuest={duplicateQuest}
    />
  );
};

export default App;

import React, { useState, useCallback, useEffect } from 'react';
import LandingScreen from './pages/LandingScreen';
import EditorPage from './pages/EditorPage';
import { useProject } from './hooks/useProject';
import { QuestData, EQFParser } from '../eqf-parser';

const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

const App: React.FC = () => {
  const [questData, setQuestData] = useState<Record<number, QuestData>>({});
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  useEffect(() => {
    const initConfig = async () => {
      if (isElectron && window.electronAPI) {
        try {
          const result = await window.electronAPI.initializeConfig();
          if (result.success) {
            console.log('Config initialized, templates at:', result.templatesDir);
          } else {
            console.warn('Config initialization warning:', result.error);
          }
        } catch (error) {
          console.error('Failed to initialize config:', error);
        }
      }
    };
    initConfig();
  }, []);
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const {
    currentProject,
    projectName,
    serverPath,
    questsPathType,
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
    duplicateQuest: duplicateQuestHook
  } = useProject();

  // Helper to get the correct quests directory path
  const getQuestsDir = useCallback(() => {
    if (!serverPath) return '';
    return questsPathType === 'quests-direct' ? serverPath : `${serverPath}/data/quests`;
  }, [serverPath, questsPathType]);

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

  const createQuest = async (questData: { id: number; name: string; version: number; hidden: boolean }, templateName?: string) => {
    const newQuestId = await createQuestHook(questData, templateName);
      
    if (serverPath && window.electronAPI) {
      const questsDir = getQuestsDir();
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

  const updateQuest = async (questId: number, updates: Partial<QuestData>) => {
    await updateQuestHook(questId, updates);
      
    setQuestData(prev => {
      const existing = prev[questId];
      if (existing) {
        return { ...prev, [questId]: { ...existing, ...updates, id: questId } };
      }
      return prev;
    });
  };

  const deleteQuest = async (questId: number) => {
    await deleteQuestHook(questId);
      
    setQuestData(prev => {
      const { [questId]: _, ...rest } = prev;
      return rest;
    });
  };

  const importQuest = async (eqfPath: string) => {
    const questId = await importQuestHook(eqfPath);
      
    if (serverPath && window.electronAPI) {
      const questsDir = getQuestsDir();
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

  const duplicateQuest = async (questId: number) => {
    const newQuestId = await duplicateQuestHook(questId);
      
    if (serverPath && window.electronAPI) {
      const questsDir = getQuestsDir();
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

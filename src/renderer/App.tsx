import React, { useState, useCallback, useEffect } from 'react';
import LandingScreen from './pages/LandingScreen';
import EditorPage from './pages/EditorPage';
import { usePubData } from './hooks/usePubData';
import { useGFXCache } from './hooks/useGFXCache';
import { useEquipment } from './hooks/useEquipment';
import { useAppearance } from './hooks/useAppearance';
import { useProject } from './hooks/useProject';
import { useFileImportExport } from './hooks/useFileImportExport';
import { ProjectService } from './services/projectService';

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

const App: React.FC = () => {
  const [dropsData, setDropsData] = useState<Map<number, any[]>>(new Map());
  const [questData, setQuestData] = useState<Record<number, any>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
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
  
  // Mark changes as unsaved
  const markAsUnsaved = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);
  
  const { 
    eifData, 
    enfData,
    ecfData,
    esfData,
    innData,
    pubDirectory, 
    activeTab,
    setActiveTab,
    loadDirectory,
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
    addInn,
    deleteInn,
    duplicateInn,
    updateInn,
    setEifData,
    setEnfData,
    setEcfData,
    setEsfData,
    setInnData,
    setPubDirectory
  } = usePubData(markAsUnsaved);

  // Project management hook
  const {
    currentProject,
    projectName,
    gfxFolder,
    pubDirectory: projectPubDirectory,
    tabOrder,
    createProject: createProjectHook,
    selectProject: selectProjectHook,
    deleteProject: deleteProjectHook,
    updateProjectSettings,
    saveTabOrder,
    setCurrentProject,
    setGfxFolder,
    setPubDirectory: setProjectPubDirectory,
    createQuest: createQuestHook,
    updateQuest: updateQuestHook,
    deleteQuest: deleteQuestHook,
    importQuest: importQuestHook,
    exportQuest: exportQuestHook,
    duplicateQuest: duplicateQuestHook
  } = useProject();

  const { 
    loadGfx, 
    preloadGfxBatch,
    startBackgroundLoading,
    isLoadingInBackground,
    loadingProgress,
    loadingMessage
  } = useGFXCache(gfxFolder);

  // File import/export hook
  const {
    exportItems,
    exportNpcs,
    exportDrops,
    exportClasses,
    exportSkills,
    exportInns,
    importItems,
    importNpcs,
    importDrops,
    importClasses,
    importSkills,
    importInns
  } = useFileImportExport({
    eifData,
    enfData,
    ecfData,
    esfData,
    innData,
    dropsData,
    currentProject,
    setEifData,
    setEnfData,
    setEcfData,
    setEsfData,
    setInnData,
    setDropsData
  });
  
  // Wrapper for createProject hook to update local state
  const createProject = async (projectName: string, gfxPath: string, eifPath?: string, enfPath?: string, ecfPath?: string, esfPath?: string, dropsPath?: string) => {
    try {
      await createProjectHook(projectName, gfxPath, eifPath, enfPath, ecfPath, esfPath, dropsPath);
      
      // Load the project data into local state
      const projectData = await selectProjectHook(projectName);
      if (projectData) {
        if (projectData.items) setEifData({ version: 1, items: projectData.items });
        if (projectData.npcs) setEnfData({ version: 1, npcs: projectData.npcs });
        if (projectData.classes) setEcfData({ version: 1, classes: projectData.classes });
        if (projectData.skills) setEsfData({ version: 1, skills: projectData.skills });
        if (projectData.drops) setDropsData(projectData.drops);
      }
      
      const importMsg = [];
      if (eifPath) importMsg.push('Items');
      if (enfPath) importMsg.push('NPCs');
      if (ecfPath) importMsg.push('Classes');
      if (esfPath) importMsg.push('Skills');
      if (dropsPath) importMsg.push('Drops');
      const imported = importMsg.length > 0 ? `\n\nImported: ${importMsg.join(', ')}` : '';
      
      alert(`Project "${projectName}" created successfully!${imported}`);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project: ' + (error as Error).message);
    }
  };

  // Wrapper for selectProject hook to update local state
  const selectProject = async (projectName: string) => {
    try {
      const projectData = await selectProjectHook(projectName);
      if (projectData) {
        ProjectService.restoreProjectState(projectData, {
          setEifData,
          setEnfData,
          setEcfData,
          setEsfData,
          setInnData,
          setDropsData,
          setQuestData,
          restoreEquipment,
          setGender,
          setHairStyle,
          setHairColor,
          setSkinTone
        });
      }
    } catch (error) {
      console.error('Error selecting project:', error);
      alert('Error selecting project: ' + (error as Error).message);
    }
  };

  // Helper to reload quest data
  const reloadQuestData = async () => {
    if (!currentProject || !window.electronAPI) return;
    
    try {
      const questsPath = `${currentProject}/quests.json`;
      const result = await window.electronAPI.readTextFile(questsPath);
      
      if (result.success) {
        const questsArray = JSON.parse(result.data);
        const quests: Record<number, any> = {};
        questsArray.forEach((quest: any) => {
          quests[quest.id] = quest;
        });
        setQuestData(quests);
      } else {
        setQuestData({});
      }
    } catch (error) {
      console.error('Error reloading quest data:', error);
      setQuestData({});
    }
  };

  // Quest operation wrappers that update local state
  const createQuest = async (templateName?: string) => {
    const questId = await createQuestHook(templateName);
    await reloadQuestData();
    return questId;
  };

  const updateQuest = async (questId: number, updates: any) => {
    await updateQuestHook(questId, updates);
    await reloadQuestData();
  };

  const deleteQuest = async (questId: number) => {
    await deleteQuestHook(questId);
    await reloadQuestData();
  };

  const importQuest = async (eqfPath: string) => {
    const questId = await importQuestHook(eqfPath);
    await reloadQuestData();
    return questId;
  };

  const exportQuest = async (questId: number, savePath?: string) => {
    await exportQuestHook(questId, savePath);
  };

  const duplicateQuest = async (questId: number) => {
    const newQuestId = await duplicateQuestHook(questId);
    await reloadQuestData();
    return newQuestId;
  };

  // Tab reordering handler
  const handleTabReorder = async (newOrder: typeof tabOrder) => {
    try {
      await saveTabOrder(newOrder);
    } catch (error) {
      console.error('Error saving tab order:', error);
      alert('Error saving tab order: ' + (error as Error).message);
    }
  };

  // When project changes, set active tab to first in order
  useEffect(() => {
    if (currentProject && tabOrder.length > 0) {
      setActiveTab(tabOrder[0]);
    }
  }, [currentProject]);

  // Start background GFX loading when gfxFolder is set
  useEffect(() => {
    if (gfxFolder && !isLoadingInBackground) {
      console.log('📦 GFX folder set, starting background loading in 500ms...');
      // Small delay to let UI render first
      const timer = setTimeout(() => {
        console.log('🚀 Starting background GFX loading');
        startBackgroundLoading();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [gfxFolder, startBackgroundLoading, isLoadingInBackground]);

  const { 
    equippedItems, 
    equipItem, 
    unequipSlot,
    clearAll,
    restoreEquipment
  } = useEquipment();
  
  const {
    gender,
    setGender,
    hairStyle,
    setHairStyle,
    hairColor,
    setHairColor,
    skinTone,
    setSkinTone,
    presets,
    savePreset,
    loadPreset,
    deletePreset
  } = useAppearance();

  // Update window title with asterisk when there are unsaved changes
  React.useEffect(() => {
    if (isElectron && window.electronAPI && currentProject && projectName) {
      const title = `OakTree - EO Pub Editor - ${projectName}${hasUnsavedChanges ? ' *' : ''}`;
      window.electronAPI.setTitle(title);
    }
  }, [hasUnsavedChanges, currentProject, projectName]);

  const updateNpcDrops = (npcId: number, drops: any[]) => {
    const newDropsData = new Map(dropsData);
    if (drops.length === 0) {
      newDropsData.delete(npcId);
    } else {
      newDropsData.set(npcId, drops);
    }
    setDropsData(newDropsData);
    setHasUnsavedChanges(true);
  };

  const saveDropsFile = async () => {
    if (!currentProject || !isElectron || !window.electronAPI) return;
    
    try {
      let content = '# NPC Drop Table Configuration\n';
      content += '# Format: npc_id = item_id,min,max,percentage, item_id,min,max,percentage, ...\n';
      content += '# Percentage is 0-100 (supports decimals like 0.5)\n\n';
      
      const sortedNpcIds = Array.from(dropsData.keys()).sort((a, b) => a - b);
      
      for (const npcId of sortedNpcIds) {
        const drops = dropsData.get(npcId);
        if (!drops || drops.length === 0) continue;
        
        const dropStrs = drops.map(d => `${d.itemId},${d.min},${d.max},${d.percentage}`);
        content += `${npcId} = ${dropStrs.join(', ')}\n`;
      }
      
      const dropsPath = `${currentProject}/drops.txt`;
      const result = await window.electronAPI.writeTextFile(dropsPath, content);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      console.log('Drops file saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving drops file:', error);
      alert('Error saving drops file: ' + error.message);
      return false;
    }
  };

  const saveAllFiles = async () => {
    if (!currentProject || !isElectron || !window.electronAPI) return;
    
    try {
      await ProjectService.saveProject({
        currentProject,
        eifData,
        enfData,
        ecfData,
        esfData,
        innData,
        dropsData,
        questData,
        equippedItems,
        appearance: {
          gender,
          hairStyle,
          hairColor,
          skinTone
        }
      });
      setHasUnsavedChanges(false);
      console.log('All files saved successfully!');
    } catch (error) {
      console.error('Error saving files:', error);
      alert('Error saving files: ' + (error as Error).message);
    }
  };

  // Add keyboard shortcut for save (Cmd+S on Mac, Ctrl+S on Windows/Linux)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (currentProject) {
          saveAllFiles();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentProject, saveAllFiles]);

  const returnToProjects = () => {
    // Clear current project to return to landing screen
    setCurrentProject('');
    setGfxFolder('');
    // Clear data to free memory
    setEifData({ version: 1, items: {} });
    setEnfData({ version: 1, npcs: {} });
    setEcfData({ version: 1, classes: {} });
    setEsfData({ version: 1, skills: {} });
    setDropsData(new Map());
    setPubDirectory(null);
    
    // Reset window title
    if (window.electronAPI) {
      window.electronAPI.setTitle('OakTree');
    }
  };

  // Wrapper for deleteProject hook
  const deleteProject = async (projectName: string) => {
    try {
      await deleteProjectHook(projectName);
      // If deleting the currently open project, return to projects screen
      if (projectName === currentProject) {
        returnToProjects();
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error deleting project: ' + (error as Error).message);
    }
  };

  // Check if we need to show the landing screen
  const showLandingScreen = !currentProject;

  // Render landing screen or editor
  if (showLandingScreen) {
    return (
      <LandingScreen
        onSelectProject={selectProject}
        onCreateProject={createProject}
        onDeleteProject={deleteProject}
      />
    );
  }

  return (
    <EditorPage
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      tabOrder={tabOrder}
      onTabReorder={handleTabReorder}
      eifData={eifData}
      enfData={enfData}
      ecfData={ecfData}
      esfData={esfData}
      innData={innData}
      dropsData={dropsData}
      questData={questData}
      pubDirectory={pubDirectory}
      projectName={projectName}
      currentProject={currentProject}
      updateProjectSettings={updateProjectSettings}
      theme={theme}
      toggleTheme={toggleTheme}
      addItem={addItem}
      deleteItem={deleteItem}
      duplicateItem={duplicateItem}
      updateItem={updateItem}
      addNpc={addNpc}
      deleteNpc={deleteNpc}
      duplicateNpc={duplicateNpc}
      updateNpc={updateNpc}
      addClass={addClass}
      deleteClass={deleteClass}
      duplicateClass={duplicateClass}
      updateClass={updateClass}
      addSkill={addSkill}
      deleteSkill={deleteSkill}
      duplicateSkill={duplicateSkill}
      updateSkill={updateSkill}
      addInn={addInn}
      deleteInn={deleteInn}
      duplicateInn={duplicateInn}
      updateInn={updateInn}
      updateNpcDrops={updateNpcDrops}
      saveDropsFile={saveDropsFile}
      equippedItems={equippedItems}
      equipItem={equipItem}
      unequipSlot={unequipSlot}
      clearAll={clearAll}
      gender={gender}
      setGender={setGender}
      hairStyle={hairStyle}
      setHairStyle={setHairStyle}
      hairColor={hairColor}
      setHairColor={setHairColor}
      skinTone={skinTone}
      setSkinTone={setSkinTone}
      presets={presets}
      savePreset={savePreset}
      loadPreset={loadPreset}
      deletePreset={deletePreset}
      gfxFolder={gfxFolder}
      setGfxFolder={setGfxFolder}
      loadGfx={loadGfx}
      preloadGfxBatch={preloadGfxBatch}
      isLoadingInBackground={isLoadingInBackground}
      loadingProgress={loadingProgress}
      loadingMessage={loadingMessage}
      saveAllFiles={saveAllFiles}
      returnToProjects={returnToProjects}
      importItems={importItems}
      importNpcs={importNpcs}
      importDrops={importDrops}
      importClasses={importClasses}
      importSkills={importSkills}
      importInns={importInns}
      exportItems={exportItems}
      exportNpcs={exportNpcs}
      exportDrops={exportDrops}
      exportClasses={exportClasses}
      exportSkills={exportSkills}
      exportInns={exportInns}
      loadDirectory={loadDirectory}
      createQuest={createQuest}
      updateQuest={updateQuest}
      deleteQuest={deleteQuest}
      importQuest={importQuest}
      exportQuest={exportQuest}
      duplicateQuest={duplicateQuest}
    />
  );
}

export default App;

import React, { useState } from 'react';
import QuestList from '../components/quests/QuestList';
import QuestEditor from '../components/quests/QuestEditor';
import StatusBar from '../components/StatusBar';
import ProjectSettings from '../components/ProjectSettings';
import CreditsPage from './CreditsPage';
import SettingsIcon from '@mui/icons-material/Settings';
import ReplyIcon from '@mui/icons-material/Reply';
import InfoIcon from '@mui/icons-material/Info';
import QuestIcon from '../components/icons/QuestIcon';
import { QuestData } from '../../eqf-parser';

interface NewQuestData {
  id: number;
  name: string;
  version: number;
  hidden: boolean;
}

interface EditorPageProps {
  // Data
  questData: Record<number, QuestData>;
  
  // Project settings
  projectName: string;
  currentProject: string;
  serverPath: string;
  updateProjectSettings: (settings: { projectName?: string; serverPath?: string }) => Promise<void>;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  
  // Project operations
  returnToProjects: () => void;
  
  // Quest operations
  createQuest: (questData: NewQuestData) => Promise<number>;
  deleteQuest: (id: number) => Promise<void>;
  duplicateQuest: (id: number) => Promise<number>;
  updateQuest: (id: number, updates: Partial<QuestData>) => Promise<void>;
  importQuest: (eqfPath: string) => Promise<number>;
  exportQuest: (id: number, savePath?: string) => Promise<void>;
}

const EditorPage: React.FC<EditorPageProps> = ({
  projectName,
  currentProject,
  serverPath,
  updateProjectSettings,
  theme,
  toggleTheme,
  returnToProjects,
  questData,
  createQuest,
  deleteQuest,
  duplicateQuest,
  updateQuest,
  importQuest,
  exportQuest
}) => {
  // UI state
  const [activeTab, setActiveTab] = useState<'quests' | 'credits'>('quests');
  const [leftPanelMinimized, setLeftPanelMinimized] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedQuestId, setSelectedQuestId] = useState<number | null>(null);

  // Derived values
  const selectedQuest = selectedQuestId !== null ? questData[selectedQuestId] : null;

  const handleSaveProjectSettings = async (settings: { projectName: string; serverPath: string | null }) => {
    try {
      await updateProjectSettings({
        projectName: settings.projectName,
        serverPath: settings.serverPath || undefined
      });
      setShowSettingsModal(false);
      alert('Project settings updated successfully!');
    } catch (error) {
      console.error('Failed to update project settings:', error);
      alert(`Failed to update settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleImportQuest = async () => {
    if (!window.electronAPI) {
      console.error('Electron API not available');
      return;
    }

    try {
      const file = await window.electronAPI.openFile([
        { name: 'Quest Files', extensions: ['eqf'] }
      ]);

      if (file) {
        const questId = await importQuest(file);
        setSelectedQuestId(questId);
      }
    } catch (error) {
      console.error('Error importing quest:', error);
      alert('Error importing quest: ' + (error as Error).message);
    }
  };

  const handleCreateQuest = async (questData: NewQuestData) => {
    try {
      const questId = await createQuest(questData);
      setSelectedQuestId(questId);
      return questId;
    } catch (error) {
      console.error('Error creating quest:', error);
      alert('Error creating quest: ' + (error as Error).message);
      throw error;
    }
  };

  const handleTabClick = (tab: 'quests' | 'credits') => {
    if (tab === 'quests' && activeTab === 'quests') {
      setLeftPanelMinimized(!leftPanelMinimized);
    } else {
      setActiveTab(tab);
      if (leftPanelMinimized && tab === 'quests') {
        setLeftPanelMinimized(false);
      }
    }
  };

  return (
    <div className="app">
      {/* Left Sidebar */}
      <div className="left-vertical-sidebar">
        <button
          className={`left-sidebar-button ${activeTab === 'quests' ? 'active' : ''}`}
          onClick={() => handleTabClick('quests')}
          title="Quests"
        >
          <QuestIcon size={24} />
        </button>
        
        <div className="sidebar-spacer"></div>
        
        <button
          className={`left-sidebar-button ${activeTab === 'credits' ? 'active' : ''}`}
          onClick={() => handleTabClick('credits')}
          title="Credits"
        >
          <InfoIcon />
        </button>
        <button
          className="left-sidebar-button"
          onClick={returnToProjects}
          title="Return to Projects"
        >
          <ReplyIcon />
        </button>
        <button
          className="left-sidebar-button"
          onClick={() => setShowSettingsModal(true)}
          title="Settings"
        >
          <SettingsIcon />
        </button>
      </div>
      
      {activeTab === 'credits' ? (
        <CreditsPage theme={theme} />
      ) : (
        <div className="main-content">
          <div className={`left-panel ${leftPanelMinimized ? 'minimized' : ''}`}>
            <QuestList
              quests={questData}
              selectedQuestId={selectedQuestId}
              onSelectQuest={setSelectedQuestId}
              onCreateQuest={handleCreateQuest}
              onDeleteQuest={deleteQuest}
              onDuplicateQuest={duplicateQuest}
              onImportQuest={handleImportQuest}
              currentProject={currentProject}
              leftPanelMinimized={leftPanelMinimized}
            />
          </div>
          
          <div className="center-panel">
            <QuestEditor
              quest={selectedQuest}
              onSave={updateQuest}
              onExport={exportQuest}
              onDelete={deleteQuest}
              theme={theme}
            />
          </div>
        </div>
      )}
      
      <StatusBar 
        isLoading={false}
        progress={0}
        message=""
      />

      {showSettingsModal && (
        <ProjectSettings
          projectName={projectName}
          serverPath={serverPath}
          theme={theme}
          toggleTheme={toggleTheme}
          onClose={() => setShowSettingsModal(false)}
          onSave={handleSaveProjectSettings}
        />
      )}
    </div>
  );
};

export default EditorPage;

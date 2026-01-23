import React, { useState } from 'react';
import QuestList from '../components/quests/QuestList';
import QuestEditor from '../components/quests/QuestEditor';
import StatusBar from '../components/StatusBar';
import ProjectSettings from '../components/ProjectSettings';
import CreditsPage from './CreditsPage';
import ActionsEditorPage from './ActionsEditorPage';
import RulesEditorPage from './RulesEditorPage';
import QuestTemplatesPage from './QuestTemplatesPage';
import StateTemplatesPage from './StateTemplatesPage';
import SettingsIcon from '@mui/icons-material/Settings';
import ReplyIcon from '@mui/icons-material/Reply';
import InfoIcon from '@mui/icons-material/Info';
import CodeIcon from '@mui/icons-material/Code';
import GavelIcon from '@mui/icons-material/Gavel';
import DescriptionIcon from '@mui/icons-material/Description';
import FolderIcon from '@mui/icons-material/Folder';
import LayersIcon from '@mui/icons-material/Layers';
import { QuestData, QuestState } from '../../eqf-parser';
import { clearStateTemplatesCache } from '../services/stateTemplateService';

interface NewQuestData {
  id: number;
  name: string;
  version: number;
  hidden: boolean;
}

interface EditorPageProps {
  questData: Record<number, QuestData>;
  
  projectName: string;
  currentProject: string;
  serverPath: string;
  updateProjectSettings: (settings: { projectName?: string; serverPath?: string }) => Promise<void>;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  
  returnToProjects: () => void;
  
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
  const [activeTab, setActiveTab] = useState<'quests' | 'actions' | 'rules' | 'questTemplates' | 'stateTemplates' | 'credits'>('quests');
  const [leftPanelMinimized, setLeftPanelMinimized] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedQuestId, setSelectedQuestId] = useState<number | null>(null);

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

  const handleTabClick = (tab: 'quests' | 'actions' | 'rules' | 'questTemplates' | 'stateTemplates' | 'credits') => {
    if (tab === 'quests' && activeTab === 'quests') {
      setLeftPanelMinimized(!leftPanelMinimized);
    } else {
      setActiveTab(tab);
      if (leftPanelMinimized && tab === 'quests') {
        setLeftPanelMinimized(false);
      }
    }
  };

  const [templateSaveStatus, setTemplateSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Callback when a state is saved as template (from StateNodeEditor)
  const handleSaveStateAsTemplate = (_state: QuestState) => {
    // Clear cache so the new template shows up in the templates list
    clearStateTemplatesCache();
  };

  const handleSaveAsTemplate = async (questId: number, questData: QuestData) => {
    try {
      const templateName = questData.questName;
      if (!templateName.trim()) {
        return;
      }
      
      const sanitizedTemplateName = templateName.replace(/[<>:"/\\|?*]/g, '_').trim();
      
      if (!sanitizedTemplateName) {
        return;
      }
      
      setTemplateSaveStatus('saving');
      
      const eqfContent = generateEQFContent(questData);
      const configDir = await window.electronAPI.getConfigDir();
      const templatesDir = `${configDir}/templates`;
      const templateFileName = `${sanitizedTemplateName}.eqf`;
      const templatePath = `${templatesDir}/${templateFileName}`;
      
      await window.electronAPI.ensureDir(templatesDir);
      await window.electronAPI.writeTextFile(templatePath, eqfContent);
      
      setTemplateSaveStatus('saved');
      setTimeout(() => setTemplateSaveStatus('idle'), 1500);
    } catch (err) {
      setTemplateSaveStatus('error');
      setTimeout(() => setTemplateSaveStatus('idle'), 2000);
      console.error('Error saving template:', err);
    }
  };
  
  const generateEQFContent = (questData: QuestData): string => {
    let content = `quest "${questData.questName}"\nversion ${questData.version}\n`;
    if (questData.hidden) content += 'hidden\n';
    if (questData.hiddenEnd) content += 'hiddenend\n';
    if (questData.disabled) content += 'disabled\n';
    if (questData.minLevel !== undefined) content += `minlevel ${questData.minLevel}\n`;
    if (questData.maxLevel !== undefined) content += `maxlevel ${questData.maxLevel}\n`;
    if (questData.needAdmin !== undefined) content += `needadmin ${questData.needAdmin}\n`;
    if (questData.needClass !== undefined) content += `needclass ${questData.needClass}\n`;
    if (questData.needQuest !== undefined) content += `needquest ${questData.needQuest}\n`;
    
    if (questData.startNpc && questData.startNpc.length > 0) {
      content += `startnpc ${questData.startNpc.join(' ')}\n`;
    }
    
    content += '\n';
    
    questData.states.forEach(state => {
      content += `State ${state.name}\n{\n`;
      content += `    desc "${state.description}"\n`;
      
      // Use items array if present (preserves interleaved order), otherwise fall back to actions then rules
      if (state.items && state.items.length > 0) {
        state.items.forEach(item => {
          if (item.kind === 'action') {
            content += `    action ${item.data.rawText}\n`;
          } else {
            content += `    rule ${item.data.rawText}\n`;
          }
        });
      } else {
        state.actions.forEach(action => {
          content += `    action ${action.rawText}\n`;
        });
        state.rules.forEach(rule => {
          content += `    rule ${rule.rawText}\n`;
        });
      }

      content += '}\n\n';
    });
    
    if (questData.randomBlocks && questData.randomBlocks.length > 0) {
      questData.randomBlocks.forEach(block => {
        content += `Random ${block.name}\n{\n`;
        block.entries.forEach(entry => {
          if (entry.type === 'coord') {
            content += `    coord ${entry.params.join(' ')}\n`;
          } else if (entry.type === 'item') {
            content += `    item ${entry.params.join(' ')}\n`;
          }
        });
        content += '}\n\n';
      });
    }
    
    return content.trim();
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
          <DescriptionIcon />
        </button>
        
        <button
          className={`left-sidebar-button ${activeTab === 'actions' ? 'active' : ''}`}
          onClick={() => handleTabClick('actions')}
          title="Actions Editor"
        >
          <CodeIcon />
        </button>
        
        <button
          className={`left-sidebar-button ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => handleTabClick('rules')}
          title="Rules Editor"
        >
          <GavelIcon />
        </button>
        
        <button
          className={`left-sidebar-button ${activeTab === 'questTemplates' ? 'active' : ''}`}
          onClick={() => handleTabClick('questTemplates')}
          title="Quest Templates"
        >
          <FolderIcon />
        </button>
        
        <button
          className={`left-sidebar-button ${activeTab === 'stateTemplates' ? 'active' : ''}`}
          onClick={() => handleTabClick('stateTemplates')}
          title="State Templates"
        >
          <LayersIcon />
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
      
      <div className="main-content">
        {activeTab === 'credits' ? (
          <CreditsPage theme={theme} />
        ) : activeTab === 'actions' ? (
          <ActionsEditorPage theme={theme} />
        ) : activeTab === 'rules' ? (
          <RulesEditorPage theme={theme} />
        ) : activeTab === 'questTemplates' ? (
          <QuestTemplatesPage theme={theme} />
        ) : activeTab === 'stateTemplates' ? (
          <StateTemplatesPage theme={theme} />
        ) : (
          <>
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
                onSaveAsTemplate={handleSaveAsTemplate}
                onSaveStateAsTemplate={handleSaveStateAsTemplate}
                templateSaveStatus={templateSaveStatus}
                theme={theme}
              />
            </div>
          </>
        )}
      </div>
      
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

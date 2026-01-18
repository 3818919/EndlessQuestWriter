import React from 'react';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import HomeIcon from '@mui/icons-material/Home';
import FileMenu from './FileMenu';
import { CrossedSwordsIcon, SkullCrossedBonesIcon, SpellBookIcon } from './icons';

interface VerticalSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSave: () => void;
  onImportItems: () => void;
  onImportNpcs: () => void;
  onImportDrops: () => void;
  onImportClasses: () => void;
  onImportSkills: () => void;
  onExportNpcs: () => void;
  onExportItems: () => void;
  onExportDrops: () => void;
  onExportClasses: () => void;
  onExportSkills: () => void;
  onSettings: () => void;
  onReturnToProjects: () => void;
  isSaveDisabled: boolean;
  leftPanelMinimized: boolean;
  setLeftPanelMinimized: (minimized: boolean) => void;
}

const VerticalSidebar: React.FC<VerticalSidebarProps> = ({
  activeTab,
  onTabChange,
  onSave,
  onImportItems,
  onImportNpcs,
  onImportDrops,
  onImportClasses,
  onImportSkills,
  onExportNpcs,
  onExportItems,
  onExportDrops,
  onExportClasses,
  onExportSkills,
  onSettings,
  onReturnToProjects,
  isSaveDisabled,
  leftPanelMinimized,
  setLeftPanelMinimized
}) => {
  const handleTabClick = (tab: string) => {
    if (tab === activeTab) {
      // Clicking the active tab toggles minimization
      setLeftPanelMinimized(!leftPanelMinimized);
    } else {
      // Switching to a different tab
      onTabChange(tab);
      // Ensure panel is not minimized when switching tabs
      if (leftPanelMinimized) {
        setLeftPanelMinimized(false);
      }
    }
  };

  return (
    <div className="left-vertical-sidebar">
      <FileMenu
        onSave={onSave}
        onImportItems={onImportItems}
        onImportNpcs={onImportNpcs}
        onImportDrops={onImportDrops}
        onImportClasses={onImportClasses}
        onImportSkills={onImportSkills}
        onExportNpcs={onExportNpcs}
        onExportItems={onExportItems}
        onExportDrops={onExportDrops}
        onExportClasses={onExportClasses}
        onExportSkills={onExportSkills}
        disabled={isSaveDisabled}
      />
      <button
        className={`left-sidebar-button ${activeTab === 'items' && !leftPanelMinimized ? 'active' : ''}`}
        onClick={() => handleTabClick('items')}
        title="Items"
      >
        <ListAltIcon />
      </button>
      <button
        className={`left-sidebar-button ${activeTab === 'npcs' && !leftPanelMinimized ? 'active' : ''}`}
        onClick={() => handleTabClick('npcs')}
        title="NPCs / Monsters"
      >
        <SkullCrossedBonesIcon />
      </button>
      <button
        className={`left-sidebar-button ${activeTab === 'classes' && !leftPanelMinimized ? 'active' : ''}`}
        onClick={() => handleTabClick('classes')}
        title="Classes"
      >
        <CrossedSwordsIcon />
      </button>
      <button
        className={`left-sidebar-button ${activeTab === 'skills' && !leftPanelMinimized ? 'active' : ''}`}
        onClick={() => handleTabClick('skills')}
        title="Skills / Spells"
      >
        <SpellBookIcon />
      </button>
      <div className="sidebar-spacer"></div>
      <button
        className="left-sidebar-button"
        onClick={onReturnToProjects}
        title="Return to Projects"
      >
        <HomeIcon />
      </button>
      <button
        className="left-sidebar-button"
        onClick={onSettings}
        title="Settings"
      >
        <SettingsIcon />
      </button>
    </div>
  );
};

export default VerticalSidebar;

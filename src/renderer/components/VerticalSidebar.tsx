import React, { useState } from 'react';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import ReplyIcon from '@mui/icons-material/Reply';
import HouseIcon from '@mui/icons-material/House';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import FileMenu from './FileMenu';
import { CrossedSwordsIcon, SkullCrossedBonesIcon, SpellBookIcon } from './icons';
import QuestIcon from './icons/QuestIcon';
import DraggableTabButton from './DraggableTabButton';
import type { TabType } from '../hooks/useProject';

interface VerticalSidebarProps {
  activeTab: string;
  tabOrder: TabType[];
  onTabChange: (tab: string) => void;
  onTabReorder: (newOrder: TabType[]) => void;
  onSave: () => void;
  onImportItems: () => void;
  onImportNpcs: () => void;
  onImportDrops: () => void;
  onImportClasses: () => void;
  onImportSkills: () => void;
  onImportInns: () => void;
  onImportQuest: () => void;
  onExportNpcs: () => void;
  onExportItems: () => void;
  onExportDrops: () => void;
  onExportClasses: () => void;
  onExportSkills: () => void;
  onExportInns: () => void;
  onSettings: () => void;
  onReturnToProjects: () => void;
  isSaveDisabled: boolean;
  leftPanelMinimized: boolean;
  setLeftPanelMinimized: (minimized: boolean) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const VerticalSidebar: React.FC<VerticalSidebarProps> = ({
  activeTab,
  tabOrder,
  onTabChange,
  onTabReorder,
  onSave,
  onImportItems,
  onImportNpcs,
  onImportDrops,
  onImportClasses,
  onImportSkills,
  onImportInns,
  onImportQuest,
  onExportNpcs,
  onExportItems,
  onExportDrops,
  onExportClasses,
  onExportSkills,
  onExportInns,
  onSettings,
  onReturnToProjects,
  isSaveDisabled,
  leftPanelMinimized,
  setLeftPanelMinimized,
  theme,
  toggleTheme
}) => {
  const [draggingTab, setDraggingTab] = useState<string | null>(null);

  // Tab configuration mapping
  const tabConfig: Record<TabType, { title: string; icon: React.ReactNode }> = {
    items: { title: 'Items', icon: <ListAltIcon /> },
    npcs: { title: 'NPCs / Monsters', icon: <SkullCrossedBonesIcon /> },
    classes: { title: 'Classes', icon: <CrossedSwordsIcon /> },
    skills: { title: 'Skills / Spells', icon: <SpellBookIcon /> },
    inns: { title: 'Inns / Spawn Points', icon: <HouseIcon /> },
    quests: { title: 'Quests', icon: <QuestIcon size={24} /> }
  };

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

  const handleDragStart = (tabId: string) => {
    setDraggingTab(tabId);
  };

  const handleDragEnd = () => {
    setDraggingTab(null);
  };

  const handleDrop = (targetTabId: string) => {
    if (!draggingTab || draggingTab === targetTabId) {
      setDraggingTab(null);
      return;
    }

    const currentIndex = tabOrder.indexOf(draggingTab as TabType);
    const targetIndex = tabOrder.indexOf(targetTabId as TabType);

    if (currentIndex === -1 || targetIndex === -1) {
      setDraggingTab(null);
      return;
    }

    const newOrder = [...tabOrder];
    newOrder.splice(currentIndex, 1);
    newOrder.splice(targetIndex, 0, draggingTab as TabType);

    onTabReorder(newOrder);
    setDraggingTab(null);
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
        onImportInns={onImportInns}
        onImportQuest={onImportQuest}
        onExportNpcs={onExportNpcs}
        onExportItems={onExportItems}
        onExportDrops={onExportDrops}
        onExportClasses={onExportClasses}
        onExportSkills={onExportSkills}
        onExportInns={onExportInns}
        disabled={isSaveDisabled}
      />
      {tabOrder.map((tab) => (
        <DraggableTabButton
          key={tab}
          id={tab}
          isActive={activeTab === tab}
          isMinimized={leftPanelMinimized}
          title={tabConfig[tab].title}
          icon={tabConfig[tab].icon}
          onClick={() => handleTabClick(tab)}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          isDragging={draggingTab === tab}
        />
      ))}
      <div className="sidebar-spacer"></div>
      <button
        className="left-sidebar-button"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {theme === 'dark' ? <DarkModeIcon /> : <LightModeIcon />}
      </button>
      <button
        className="left-sidebar-button"
        onClick={onReturnToProjects}
        title="Return to Projects"
      >
        <ReplyIcon />
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

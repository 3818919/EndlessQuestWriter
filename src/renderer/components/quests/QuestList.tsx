import React, { useState, useMemo } from 'react';
import GenericList, { ListItem } from '../GenericList';
import ListFilter from '../ListFilter';
import { QuestData } from '../../../eqf-parser';

interface QuestListProps {
  quests: Record<number, QuestData>;
  selectedQuestId: number | null;
  onSelectQuest: (id: number) => void;
  onCreateQuest: (templateName?: string) => Promise<number>;
  onDeleteQuest: (id: number) => void;
  onDuplicateQuest: (id: number) => void;
  onImportQuest: () => void;
  currentProject?: string;
  leftPanelMinimized?: boolean;
}

export default function QuestList({
  quests,
  selectedQuestId,
  onSelectQuest,
  onCreateQuest,
  onDeleteQuest,
  onDuplicateQuest,
  onImportQuest,
  currentProject,
  leftPanelMinimized = false
}: QuestListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Memoize filtered quests
  const filteredQuests = useMemo(() => {
    const questArray = Object.values(quests);
    
    return questArray.filter(quest => {
      // Search filter
      const matchesSearch = !searchQuery || 
        quest.questName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quest.id.toString().includes(searchQuery);
      
      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'disabled') {
        matchesStatus = quest.disabled === true;
      } else if (statusFilter === 'hidden') {
        matchesStatus = quest.hidden === true;
      } else if (statusFilter === 'active') {
        matchesStatus = !quest.disabled && !quest.hidden;
      }
      
      return matchesSearch && matchesStatus;
    }).sort((a, b) => a.id - b.id);
  }, [quests, searchQuery, statusFilter]);

  // Convert to list items
  const listItems: ListItem[] = filteredQuests.map(quest => ({
    id: quest.id,
    name: quest.questName || `Quest ${quest.id}`,
    secondaryText: `ID: ${quest.id} | Version: ${quest.version}`,
    hoverText: quest.states[0]?.description || quest.questName,
    data: quest
  }));

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All Quests' },
    { value: 'active', label: 'Active' },
    { value: 'disabled', label: 'Disabled' },
    { value: 'hidden', label: 'Hidden' }
  ];

  return (
    <div className="quest-list" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      borderRight: '1px solid var(--border-primary)'
    }}>
      <ListFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search quests..."
        minimized={leftPanelMinimized}
      />

      <GenericList
        items={listItems}
        selectedId={selectedQuestId}
        onSelectItem={onSelectQuest}
        minimized={leftPanelMinimized}
        emptyMessage="No quests found"
      />

      {currentProject && (
        <div style={{
          padding: '8px',
          borderTop: '1px solid var(--border-primary)',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <button
            onClick={() => onCreateQuest()}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--text-primary)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>+</span>
            {!leftPanelMinimized && <span>New Quest</span>}
          </button>
        </div>
      )}
    </div>
  );
}

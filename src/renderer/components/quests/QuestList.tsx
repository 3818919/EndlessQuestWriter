import React, { useState, useMemo } from 'react';
import GenericList, { ListItem } from '../GenericList';
import ListFilter from '../ListFilter';
import { QuestData } from '../../../eqf-parser';

interface NewQuestData {
  id: number;
  name: string;
  version: number;
  hidden: boolean;
}

interface QuestListProps {
  quests: Record<number, QuestData>;
  selectedQuestId: number | null;
  onSelectQuest: (id: number) => void;
  onCreateQuest: (questData: NewQuestData) => Promise<number>;
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
  const [showNewQuestDialog, setShowNewQuestDialog] = useState(false);
  const [newQuestId, setNewQuestId] = useState('');
  const [newQuestName, setNewQuestName] = useState('');
  const [newQuestVersion, setNewQuestVersion] = useState('1');
  const [newQuestHidden, setNewQuestHidden] = useState(false);
  const [newQuestIdError, setNewQuestIdError] = useState('');

  // Find the next available quest ID
  const nextAvailableId = useMemo(() => {
    const existingIds = Object.keys(quests).map(Number);
    let nextId = 1;
    while (existingIds.includes(nextId)) {
      nextId++;
    }
    return nextId;
  }, [quests]);

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
    secondaryText: `ID: ${quest.id} | Version: ${quest.version}${quest.hidden ? ' | Hidden' : ''}`,
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

  const handleOpenNewQuestDialog = () => {
    const nextId = nextAvailableId;
    setNewQuestId(String(nextId));
    setNewQuestName(`Quest ${nextId}`);
    setNewQuestVersion('1');
    setNewQuestHidden(false);
    setNewQuestIdError('');
    setShowNewQuestDialog(true);
  };

  const handleCreateQuest = async () => {
    const questId = parseInt(newQuestId, 10);
    const version = parseInt(newQuestVersion, 10) || 1;
    
    if (isNaN(questId) || questId < 1 || questId > 99999) {
      setNewQuestIdError('Quest ID must be between 1 and 99999');
      return;
    }
    
    if (quests[questId]) {
      setNewQuestIdError(`Quest ${questId} already exists`);
      return;
    }

    if (!newQuestName.trim()) {
      setNewQuestIdError('Quest name is required');
      return;
    }
    
    setShowNewQuestDialog(false);
    await onCreateQuest({
      id: questId,
      name: newQuestName.trim(),
      version: version,
      hidden: newQuestHidden
    });
    onSelectQuest(questId);
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-primary)',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    color: 'var(--text-secondary)',
    fontSize: '13px'
  };

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
            onClick={handleOpenNewQuestDialog}
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

      {/* New Quest Dialog */}
      {showNewQuestDialog && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowNewQuestDialog(false)}
        >
          <div 
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px',
              padding: '24px',
              minWidth: '400px',
              maxWidth: '500px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-primary)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ 
              margin: '0 0 20px 0', 
              color: 'var(--text-primary)',
              fontSize: '18px'
            }}>
              Create New Quest
            </h3>
            
            {/* Quest ID */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>
                Quest ID <span style={{ color: 'var(--accent-danger)' }}>*</span>
              </label>
              <input
                type="number"
                value={newQuestId}
                onChange={(e) => {
                  setNewQuestId(e.target.value);
                  setNewQuestIdError('');
                }}
                min={1}
                max={99999}
                style={{
                  ...inputStyle,
                  border: newQuestIdError ? '1px solid var(--accent-danger)' : '1px solid var(--border-primary)'
                }}
                autoFocus
              />
              <div style={{ 
                color: 'var(--text-tertiary)', 
                fontSize: '11px',
                marginTop: '4px'
              }}>
                Next available: {nextAvailableId} (Range: 1-99999)
              </div>
            </div>

            {/* Quest Name */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>
                Quest Name <span style={{ color: 'var(--accent-danger)' }}>*</span>
              </label>
              <input
                type="text"
                value={newQuestName}
                onChange={(e) => setNewQuestName(e.target.value)}
                placeholder="Enter quest name"
                style={inputStyle}
              />
            </div>

            {/* Version */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>
                Version
              </label>
              <input
                type="number"
                value={newQuestVersion}
                onChange={(e) => setNewQuestVersion(e.target.value)}
                min={1}
                style={{ ...inputStyle, width: '100px' }}
              />
            </div>

            {/* Hidden Checkbox */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                fontSize: '14px'
              }}>
                <input
                  type="checkbox"
                  checked={newQuestHidden}
                  onChange={(e) => setNewQuestHidden(e.target.checked)}
                  style={{ 
                    width: '16px', 
                    height: '16px',
                    cursor: 'pointer'
                  }}
                />
                Hidden Quest
              </label>
              <div style={{ 
                color: 'var(--text-tertiary)', 
                fontSize: '11px',
                marginTop: '4px',
                marginLeft: '24px'
              }}>
                Hidden quests don't appear in the player's quest log
              </div>
            </div>

            {/* Error Message */}
            {newQuestIdError && (
              <div style={{ 
                color: 'var(--accent-danger)', 
                fontSize: '13px',
                marginBottom: '16px',
                padding: '8px 12px',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                borderRadius: '4px'
              }}>
                {newQuestIdError}
              </div>
            )}
            
            {/* Buttons */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowNewQuestDialog(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateQuest}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--text-primary)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                Create Quest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

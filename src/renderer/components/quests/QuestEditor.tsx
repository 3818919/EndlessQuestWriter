import React, { useState, useEffect } from 'react';
import { QuestData, QuestState } from '../../../eqf-parser';
import QuestTextEditor from './QuestTextEditor';
import QuestFlowDiagram from './QuestFlowDiagram';
import { loadTemplates, getTemplateNames } from '../../services/templateService';
import EditIcon from '@mui/icons-material/Edit';
import SaveAsIcon from '@mui/icons-material/SaveAs';

interface QuestEditorProps {
  quest: QuestData | null;
  onSave: (questId: number, updates: Partial<QuestData>) => void;
  onExport: (questId: number) => void;
  onDelete: (questId: number) => void;
  onSaveAsTemplate?: (questId: number, questData: QuestData) => void;
  onSaveStateAsTemplate?: (state: QuestState) => void;
  templateSaveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  isTemplateMode?: boolean;
  theme?: 'dark' | 'light';
}

export default function QuestEditor({ quest, onSave, onExport, onDelete, onSaveAsTemplate, onSaveStateAsTemplate, templateSaveStatus = 'idle', isTemplateMode = false, theme = 'dark' }: QuestEditorProps) {
  const [editorMode, setEditorMode] = useState<'text' | 'visual' | 'split'>('visual');
  const [navigateToState, setNavigateToState] = useState<string | null>(null);
  const [highlightStateInVisual, setHighlightStateInVisual] = useState<string | null>(null);
  const [templateNames, setTemplateNames] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showMetadataDialog, setShowMetadataDialog] = useState(false);
  const [editedMetadata, setEditedMetadata] = useState({
    questName: '',
    version: 1,
    hidden: false
  });

  // Load template names on mount
  useEffect(() => {
    getTemplateNames().then(setTemplateNames);
  }, []);

  // Update edited metadata when quest changes
  useEffect(() => {
    if (quest) {
      setEditedMetadata({
        questName: quest.questName,
        version: quest.version,
        hidden: quest.hidden || false
      });
    }
  }, [quest?.id]);

  const handleNavigateToState = (stateName: string) => {
    setNavigateToState(stateName);
    
    if (editorMode === 'visual') {
      setEditorMode('split');
      setTimeout(() => {
        setNavigateToState(null);
        setTimeout(() => setNavigateToState(stateName), 100);
      }, 300);
    }
    
    setTimeout(() => {
      setNavigateToState(null);
    }, 1000);
  };

  const handleNavigateToVisual = (stateName: string) => {
    if (editorMode === 'text') {
      setEditorMode('split');
    }
    
    setHighlightStateInVisual(stateName);
    setTimeout(() => setHighlightStateInVisual(null), 2000);
  };

  const handleLoadTemplate = async (templateName: string) => {
    if (!quest || templateName === '') return;
    
    const templates = await loadTemplates();
    const template = templates[templateName];
    if (template) {
      const updatedTemplate = replaceNpcQuestIds(template, quest.id);
      
      onSave(quest.id, {
        ...updatedTemplate,
        id: quest.id
      });
    }
  };

  const replaceNpcQuestIds = (template: Omit<QuestData, 'id'>, questId: number): Omit<QuestData, 'id'> => {
    const NPC_QUEST_ID_ACTIONS = ['AddNpcText', 'AddNpcInput', 'AddNpcChat', 'AddNpcPM'];
    const NPC_QUEST_ID_RULES = ['TalkedToNpc'];
    
    return {
      ...template,
      states: template.states.map(state => ({
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
  };

  const handleOpenMetadataDialog = () => {
    if (quest) {
      setEditedMetadata({
        questName: quest.questName,
        version: quest.version,
        hidden: quest.hidden || false
      });
      setShowMetadataDialog(true);
    }
  };

  const handleSaveMetadata = () => {
    if (quest) {
      onSave(quest.id, {
        questName: editedMetadata.questName,
        version: editedMetadata.version,
        hidden: editedMetadata.hidden || undefined
      });
      setShowMetadataDialog(false);
      setLastSaved(new Date());
    }
  };

  if (!quest) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-secondary)',
        fontSize: '14px'
      }}>
        Select a quest to edit
      </div>
    );
  }

  const handleSave = (updates: Partial<QuestData>) => {
    onSave(quest.id, updates);
    setLastSaved(new Date());
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    onSave(quest.id, quest);
    setLastSaved(new Date());
    setTimeout(() => setIsSaving(false), 500);
  };

  const handleVisualChange = (updates: Partial<QuestData>) => {
    onSave(quest.id, updates);
    setLastSaved(new Date());
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
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      backgroundColor: 'var(--bg-primary)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-primary)',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1 1 200px', minWidth: '150px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: '16px', 
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>
              {quest.questName || `Quest ${quest.id}`}
            </h2>
            <button
              onClick={handleOpenMetadataDialog}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '4px'
              }}
              title="Edit quest properties"
            >
              <EditIcon fontSize="small" />
            </button>
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginTop: '4px'
          }}>
            ID: {quest.id} | v{quest.version} | {quest.states.length} states{quest.hidden ? ' | Hidden' : ''}
            {lastSaved && (
              <span style={{ marginLeft: '12px', color: 'var(--text-tertiary)' }}>
                Saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Template Selector (only in regular mode) */}
        {!isTemplateMode && (editorMode === 'visual' || editorMode === 'split') && templateNames.length > 0 && (
          <select
            onChange={(e) => handleLoadTemplate(e.target.value)}
            value=""
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              outline: 'none'
            }}
          >
            <option value="">Load Template...</option>
            {templateNames.map(templateName => (
              <option key={templateName} value={templateName}>
                {templateName}
              </option>
            ))}
          </select>
        )}

        {/* Mode Toggle (only in regular mode) */}
        {!isTemplateMode && (
          <div style={{
            display: 'flex',
            gap: '4px',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '4px',
            padding: '2px'
          }}>
            <button
              onClick={() => setEditorMode('visual')}
              style={{
                padding: '6px 12px',
                backgroundColor: editorMode === 'visual' ? 'var(--accent-primary)' : 'transparent',
                color: 'var(--text-primary)',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
                transition: 'background-color 0.2s'
              }}
            >
              Visual
            </button>
            <button
              onClick={() => setEditorMode('split')}
              style={{
                padding: '6px 12px',
                backgroundColor: editorMode === 'split' ? 'var(--accent-primary)' : 'transparent',
                color: 'var(--text-primary)',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
                transition: 'background-color 0.2s'
              }}
            >
              Split
            </button>
            <button
              onClick={() => setEditorMode('text')}
              style={{
                padding: '6px 12px',
                backgroundColor: editorMode === 'text' ? 'var(--accent-primary)' : 'transparent',
                color: 'var(--text-primary)',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
                transition: 'background-color 0.2s'
              }}
            >
              Text
            </button>
          </div>
        )}

        {/* Save as Template Button (only in regular mode, moved to left) */}
        {!isTemplateMode && onSaveAsTemplate && (
          <button
            onClick={() => {
              if (quest && templateSaveStatus === 'idle') {
                onSaveAsTemplate(quest.id, quest);
              }
            }}
            disabled={templateSaveStatus === 'saving'}
            style={{
              padding: '6px 16px',
              backgroundColor: templateSaveStatus === 'saved' ? 'var(--accent-success)' : 
                              templateSaveStatus === 'error' ? 'var(--accent-danger)' : 
                              'var(--accent-primary)',
              color: 'var(--text-primary)',
              border: 'none',
              borderRadius: '4px',
              cursor: templateSaveStatus === 'saving' ? 'default' : 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: templateSaveStatus === 'saving' ? 0.7 : 1,
              transition: 'background-color 0.2s'
            }}
            title="Save current quest as a template"
          >
            <SaveAsIcon fontSize="small" />
            {templateSaveStatus === 'saving' ? 'Saving...' : 
             templateSaveStatus === 'saved' ? 'Saved!' : 
             templateSaveStatus === 'error' ? 'Error' : 
             'Save as Template'}
          </button>
        )}

        {/* Save Button */}
        <button
          onClick={handleManualSave}
          disabled={isSaving}
          style={{
            padding: '6px 16px',
            backgroundColor: 'var(--accent-success)',
            color: 'var(--text-primary)',
            border: 'none',
            borderRadius: '4px',
            cursor: isSaving ? 'default' : 'pointer',
            fontSize: '13px',
            opacity: isSaving ? 0.7 : 1
          }}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>

        {/* Delete Button (only in regular mode) */}
        {!isTemplateMode && (
          <button
            onClick={() => {
              if (confirm(`Delete quest "${quest.questName}" (ID: ${quest.id})?`)) {
                onDelete(quest.id);
              }
            }}
            style={{
              padding: '6px 16px',
              backgroundColor: 'var(--accent-danger)',
              color: 'var(--text-primary)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Delete
          </button>
        )}
      </div>

      {/* Editor Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {editorMode === 'text' ? (
          <QuestTextEditor quest={quest} onSave={handleSave} navigateToState={navigateToState} onNavigateToVisual={handleNavigateToVisual} theme={theme} />
        ) : editorMode === 'visual' ? (
          <QuestFlowDiagram quest={quest} onQuestChange={handleVisualChange} onNavigateToState={handleNavigateToState} highlightState={highlightStateInVisual} onSaveStateAsTemplate={onSaveStateAsTemplate} />
        ) : (
          // Split view
          <div style={{ display: 'flex', height: '100%', gap: '1px', backgroundColor: 'var(--border-primary)' }}>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <QuestTextEditor quest={quest} onSave={handleSave} navigateToState={navigateToState} onNavigateToVisual={handleNavigateToVisual} theme={theme} />
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <QuestFlowDiagram quest={quest} onQuestChange={handleVisualChange} onNavigateToState={handleNavigateToState} highlightState={highlightStateInVisual} onSaveStateAsTemplate={onSaveStateAsTemplate} />
            </div>
          </div>
        )}
      </div>

      {/* Metadata Edit Dialog */}
      {showMetadataDialog && (
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
          onClick={() => setShowMetadataDialog(false)}
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
              Edit Quest Properties
            </h3>
            
            {/* Quest ID (read-only) */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>
                Quest ID
              </label>
              <input
                type="text"
                value={quest.id}
                disabled
                style={{
                  ...inputStyle,
                  opacity: 0.6,
                  cursor: 'not-allowed'
                }}
              />
              <div style={{ 
                color: 'var(--text-tertiary)', 
                fontSize: '11px',
                marginTop: '4px'
              }}>
                Quest ID cannot be changed after creation
              </div>
            </div>

            {/* Quest Name */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>
                Quest Name
              </label>
              <input
                type="text"
                value={editedMetadata.questName}
                onChange={(e) => setEditedMetadata({ ...editedMetadata, questName: e.target.value })}
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
                value={editedMetadata.version}
                onChange={(e) => setEditedMetadata({ ...editedMetadata, version: parseInt(e.target.value) || 1 })}
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
                  checked={editedMetadata.hidden}
                  onChange={(e) => setEditedMetadata({ ...editedMetadata, hidden: e.target.checked })}
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
            
            {/* Buttons */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowMetadataDialog(false)}
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
                onClick={handleSaveMetadata}
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
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

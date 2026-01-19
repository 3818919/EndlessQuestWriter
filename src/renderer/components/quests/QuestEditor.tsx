import React, { useState } from 'react';
import { QuestData } from '../../../eqf-parser';
import QuestTextEditor from './QuestTextEditor';
import QuestFlowDiagram from './QuestFlowDiagram';
import { QUEST_TEMPLATES } from '../../utils/questTemplates';

interface QuestEditorProps {
  quest: QuestData | null;
  onSave: (questId: number, updates: Partial<QuestData>) => void;
  onExport: (questId: number) => void;
  onDelete: (questId: number) => void;
  theme?: 'dark' | 'light';
}

export default function QuestEditor({ quest, onSave, onExport, onDelete, theme = 'dark' }: QuestEditorProps) {
  const [editorMode, setEditorMode] = useState<'text' | 'visual' | 'split'>('text');
  const [navigateToState, setNavigateToState] = useState<string | null>(null);
  const [highlightStateInVisual, setHighlightStateInVisual] = useState<string | null>(null);

  const handleNavigateToState = (stateName: string) => {
    console.log('[QuestEditor] handleNavigateToState called with:', stateName);
    console.log('[QuestEditor] Current editorMode:', editorMode);
    
    // Set the state to navigate to FIRST
    console.log('[QuestEditor] Setting navigateToState to:', stateName);
    setNavigateToState(stateName);
    
    // Switch to split mode if in visual-only mode
    if (editorMode === 'visual') {
      console.log('[QuestEditor] Switching from visual to split mode');
      setEditorMode('split');
      // Give extra time for the text editor to mount and load text
      setTimeout(() => {
        console.log('[QuestEditor] Re-triggering navigation after mode switch');
        setNavigateToState(null);
        setTimeout(() => setNavigateToState(stateName), 100);
      }, 300);
    }
    
    // Clear after allowing text editor to process
    setTimeout(() => {
      console.log('[QuestEditor] Clearing navigateToState');
      setNavigateToState(null);
    }, 1000);
  };

  const handleNavigateToVisual = (stateName: string) => {
    console.log('[QuestEditor] handleNavigateToVisual called with:', stateName);
    console.log('[QuestEditor] Current editorMode:', editorMode);
    
    // Switch to split or visual mode if in text-only mode
    if (editorMode === 'text') {
      console.log('[QuestEditor] Switching from text to split mode');
      setEditorMode('split');
    }
    
    // Highlight the state in the visual editor
    // Note: This would require adding support in QuestFlowDiagram to highlight a specific node
    // For now, we just ensure the visual editor is visible
    setHighlightStateInVisual(stateName);
    setTimeout(() => setHighlightStateInVisual(null), 2000);
  };

  const handleLoadTemplate = (templateName: string) => {
    if (!quest || templateName === '') return;
    
    const template = QUEST_TEMPLATES[templateName];
    if (template) {
      // Load template data into current quest
      onSave(quest.id, {
        ...template,
        id: quest.id // Preserve the current quest ID
      });
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
        gap: '12px'
      }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '16px', 
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>
            {quest.questName || `Quest ${quest.id}`}
          </h2>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginTop: '4px'
          }}>
            Quest ID: {quest.id} | Version: {quest.version} | {quest.states.length} states
          </div>
        </div>

        {/* Template Selector (only in visual/split mode) */}
        {(editorMode === 'visual' || editorMode === 'split') && (
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
            {Object.keys(QUEST_TEMPLATES).map(templateName => (
              <option key={templateName} value={templateName}>
                {templateName}
              </option>
            ))}
          </select>
        )}

        {/* Mode Toggle */}
        <div style={{
          display: 'flex',
          gap: '4px',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '4px',
          padding: '2px'
        }}>
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
        </div>

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
      </div>

      {/* Editor Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {editorMode === 'text' ? (
          <QuestTextEditor quest={quest} onSave={handleSave} navigateToState={navigateToState} onNavigateToVisual={handleNavigateToVisual} theme={theme} />
        ) : editorMode === 'visual' ? (
          <QuestFlowDiagram quest={quest} onQuestChange={handleSave} onNavigateToState={handleNavigateToState} highlightState={highlightStateInVisual} />
        ) : (
          // Split view
          <div style={{ display: 'flex', height: '100%', gap: '1px', backgroundColor: 'var(--border-primary)' }}>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <QuestTextEditor quest={quest} onSave={handleSave} navigateToState={navigateToState} onNavigateToVisual={handleNavigateToVisual} theme={theme} />
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <QuestFlowDiagram quest={quest} onQuestChange={handleSave} onNavigateToState={handleNavigateToState} highlightState={highlightStateInVisual} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

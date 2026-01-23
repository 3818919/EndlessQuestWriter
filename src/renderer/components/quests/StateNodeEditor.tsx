import React, { useState, useEffect, useRef } from 'react';
import { QuestState, QuestAction, QuestRule, StateItem } from '../../../eqf-parser';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { loadConfig, ConfigData, ParamInfo } from '../../services/configService';
import { loadStateTemplates, StateTemplateData } from '../../services/stateTemplateService';

interface StateNodeEditorProps {
  state: QuestState;
  stateIndex: number;
  originalStateName: string;
  allStates: QuestState[];
  onClose: () => void;
  onSave: (updates: Partial<QuestState>, nameChanged: boolean, oldName: string) => void;
  onCreateState?: (stateName: string) => void;
  isTemplateMode?: boolean; // When true, we're editing a state template (not inside a quest)
  onSaveAsTemplate?: (state: QuestState) => void; // Callback to save current state as template
}

// Default action/rule types if config not loaded (matches config/actions.ini and config/rules.ini)
const DEFAULT_ACTION_TYPES = [
  'AddNpcText', 'AddNpcInput', 'AddNpcChat', 'AddNpcPM', 'Roll', 'GiveItem', 'RemoveItem',
  'GiveExp', 'ShowHint', 'PlaySound', 'SetCoord', 'Quake', 'QuakeWorld', 'SetClass',
  'SetRace', 'SetHome', 'SetTitle', 'GiveKarma', 'RemoveKarma', 'StartQuest',
  'SetQuestState', 'ResetQuest', 'GiveStat', 'RemoveStat', 'ResetDaily', 'Reset', 'End'
];

const DEFAULT_RULE_TYPES = [
  'TalkedToNpc', 'InputNpc', 'Rolled', 'KilledNpcs', 'KilledPlayers', 'GotItems',
  'LostItems', 'UsedItem', 'EnterCoord', 'LeaveCoord', 'EnterMap', 'LeaveMap',
  'IsClass', 'IsRace', 'IsGender', 'CitizenOf', 'GotSpell', 'LostSpell', 'UsedSpell',
  'IsWearing', 'StatGreater', 'StatLess', 'StatIs', 'StatNot', 'StatBetween',
  'StatRpn', 'DoneDaily', 'Always'
];

// Parameter configuration for actions (fallback - matches config/actions.ini)
const DEFAULT_ACTION_PARAMS: Record<string, string[]> = {
  AddNpcText: ['npcQuestId', 'message'],
  AddNpcInput: ['npcQuestId', 'inputId', 'message'],
  AddNpcChat: ['npcQuestId', 'message'],
  AddNpcPM: ['npcQuestId', 'message'],
  Roll: ['amount'],
  GiveItem: ['itemId', 'amount'],
  RemoveItem: ['itemId', 'amount'],
  GiveExp: ['amount'],
  ShowHint: ['message'],
  PlaySound: ['soundId'],
  SetCoord: ['mapId', 'x', 'y'],
  Quake: ['magnitude'],
  QuakeWorld: ['magnitude'],
  SetClass: ['classId'],
  SetRace: ['raceId'],
  SetHome: ['home'],
  SetTitle: ['title'],
  GiveKarma: ['amount'],
  RemoveKarma: ['amount'],
  StartQuest: ['questId', 'quest state'],
  SetQuestState: ['questId', 'quest state'],
  ResetQuest: ['questId'],
  GiveStat: ['stat', 'amount'],
  RemoveStat: ['stat', 'amount'],
  ResetDaily: [],
  Reset: [],
  End: []
};

// Parameter configuration for rules (fallback - matches config/rules.ini)
const DEFAULT_RULE_PARAMS: Record<string, string[]> = {
  TalkedToNpc: ['npcQuestId'],
  InputNpc: ['inputId'],
  Rolled: ['roll'],
  KilledNpcs: ['npcId', 'amount'],
  KilledPlayers: ['amount'],
  GotItems: ['itemId', 'amount'],
  LostItems: ['itemId', 'amount'],
  UsedItem: ['itemId', 'amount'],
  EnterCoord: ['mapId', 'x', 'y'],
  LeaveCoord: ['mapId', 'x', 'y'],
  EnterMap: ['mapId'],
  LeaveMap: ['mapId'],
  IsClass: ['classId'],
  IsRace: ['raceId'],
  IsGender: ['genderId'],
  CitizenOf: ['homeName'],
  GotSpell: ['spellId'],
  LostSpell: ['spellId'],
  UsedSpell: ['spellId', 'amount'],
  IsWearing: ['itemId'],
  StatGreater: ['statName', 'value'],
  StatLess: ['statName', 'value'],
  StatIs: ['statName', 'value'],
  StatNot: ['statName', 'value'],
  StatBetween: ['statName', 'low_value', 'high_value'],
  StatRpn: ['Reverse Polish Notion Formula'],
  DoneDaily: ['value'],
  Always: []
};

// Check if signature includes a semicolon at the end (for actions)
function signatureHasSemicolon(signature: string): boolean {
  // Remove backticks and check for semicolon
  const clean = signature.replace(/`/g, '').trim();
  return clean.endsWith(';');
}

export default function StateNodeEditor({ state, stateIndex, originalStateName, allStates, onClose, onSave, onCreateState, isTemplateMode = false, onSaveAsTemplate }: StateNodeEditorProps) {
  // Build items list from state - use existing items if present, otherwise build from actions/rules
  const buildItemsList = (s: QuestState): StateItem[] => {
    if (s.items && s.items.length > 0) {
      return [...s.items];
    }
    // Fallback: build from separate arrays (actions first, then rules)
    const items: StateItem[] = [];
    s.actions.forEach(action => items.push({ kind: 'action', data: action }));
    s.rules.forEach(rule => items.push({ kind: 'rule', data: rule }));
    return items;
  };

  const [editedState, setEditedState] = useState<QuestState>({
    name: state.name,
    description: state.description,
    actions: [...state.actions],
    rules: [...state.rules],
    items: buildItemsList(state)
  });
  
  // Items list for display and reordering
  const [unifiedItems, setUnifiedItems] = useState<StateItem[]>(() => 
    buildItemsList(state)
  );
  
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [actionTypes, setActionTypes] = useState<string[]>(DEFAULT_ACTION_TYPES);
  const [ruleTypes, setRuleTypes] = useState<string[]>(DEFAULT_RULE_TYPES);
  const [actionParams, setActionParams] = useState<Record<string, ParamInfo[]>>({});
  const [ruleParams, setRuleParams] = useState<Record<string, ParamInfo[]>>({});
  const [actionHasSemicolon, setActionHasSemicolon] = useState<Record<string, boolean>>({});
  const [stateTemplates, setStateTemplates] = useState<Record<string, StateTemplateData>>({});
  
  // Save as template dialog state
  const [saveTemplateDialog, setSaveTemplateDialog] = useState<{ open: boolean; templateName: string }>({
    open: false,
    templateName: ''
  });
  
  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  // Sync unified list back to editedState - preserves order in items array
  const syncUnifiedToState = (items: StateItem[]) => {
    const newActions: QuestAction[] = [];
    const newRules: QuestRule[] = [];
    
    items.forEach(item => {
      if (item.kind === 'action') {
        newActions.push(item.data);
      } else {
        newRules.push(item.data);
      }
    });
    
    setEditedState(prev => ({
      ...prev,
      actions: newActions,
      rules: newRules,
      items: [...items] // Preserve the interleaved order
    }));
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    // Add a slight delay to allow the drag image to be captured
    setTimeout(() => {
      if (dragNodeRef.current) {
        dragNodeRef.current.style.opacity = '0.5';
      }
    }, 0);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '1';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }

    const newItems = [...unifiedItems];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);
    
    setUnifiedItems(newItems);
    syncUnifiedToState(newItems);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Load config and state templates on mount
  useEffect(() => {
    // Load config
    loadConfig().then(loadedConfig => {
      setConfig(loadedConfig);
      
      // Extract action types and params from config
      if (Object.keys(loadedConfig.actions).length > 0) {
        const types = Object.keys(loadedConfig.actions);
        setActionTypes(types);
        
        // Build params from config (already parsed)
        const params: Record<string, ParamInfo[]> = {};
        const semicolons: Record<string, boolean> = {};
        for (const [name, data] of Object.entries(loadedConfig.actions)) {
          params[name] = data.params;
          semicolons[name] = signatureHasSemicolon(data.rawSignature);
        }
        setActionParams(params);
        setActionHasSemicolon(semicolons);
      }
      
      // Extract rule types and params from config
      if (Object.keys(loadedConfig.rules).length > 0) {
        const types = Object.keys(loadedConfig.rules);
        setRuleTypes(types);
        
        // Build params from config (already parsed)
        const params: Record<string, ParamInfo[]> = {};
        for (const [name, data] of Object.entries(loadedConfig.rules)) {
          params[name] = data.params;
        }
        setRuleParams(params);
      }
    });
    
    // Load state templates
    loadStateTemplates().then(templates => {
      setStateTemplates(templates);
    });
  }, []);

  // Helper function to generate rawText for an action
  const generateActionRawText = (action: QuestAction): string => {
    // Get param info to determine which params should be strings
    const paramInfos = actionParams[action.type] || [];
    
    const paramsStr = action.params.map((p, idx) => {
      const paramInfo = paramInfos[idx];
      // If param info says it's a string type, wrap in quotes
      // Otherwise, if it's already a string but should be an integer, don't wrap
      if (paramInfo?.type === 'string') {
        return `"${p}"`;
      } else {
        // It's an integer type - return as-is (no quotes)
        return p;
      }
    }).join(', ');
    
    // Check if this action type should have a semicolon
    const hasSemicolon = actionHasSemicolon[action.type] ?? true; // Default to true
    return `${action.type}(${paramsStr})${hasSemicolon ? ';' : ''}`;
  };

  // Helper function to generate rawText for a rule
  const generateRuleRawText = (rule: QuestRule): string => {
    // Get param info to determine which params should be strings
    const paramInfos = ruleParams[rule.type] || [];
    
    const paramsStr = rule.params.map((p, idx) => {
      const paramInfo = paramInfos[idx];
      // If param info says it's a string type, wrap in quotes
      if (paramInfo?.type === 'string') {
        return `"${p}"`;
      } else {
        // It's an integer type - return as-is (no quotes)
        return p;
      }
    }).join(', ');
    
    return `${rule.type}(${paramsStr}) goto ${rule.gotoState}`;
  };

  const handleSave = () => {
    const nameChanged = editedState.name !== originalStateName;
    onSave(editedState, nameChanged, originalStateName);
    onClose();
  };

  const handleResetState = () => {
    if (confirm('Are you sure you want to clear all actions and rules from this state?')) {
      setUnifiedItems([]);
      setEditedState({
        ...editedState,
        actions: [],
        rules: [],
        items: []
      });
    }
  };

  const handleSaveAsTemplate = () => {
    // Open the dialog with the state name as default
    setSaveTemplateDialog({
      open: true,
      templateName: editedState.name || 'NewTemplate'
    });
  };

  const handleConfirmSaveTemplate = async () => {
    if (!saveTemplateDialog.templateName.trim()) {
      return;
    }
    
    try {
      const sanitizedTemplateName = saveTemplateDialog.templateName.replace(/[<>:"/\\|?*]/g, '_').trim();
      if (!sanitizedTemplateName) {
        return;
      }
      
      // Generate state template content
      let content = `desc "${editedState.description || ''}"\n`;
      
      // Use items array if present (preserves interleaved order)
      if (editedState.items && editedState.items.length > 0) {
        editedState.items.forEach(item => {
          if (item.kind === 'action') {
            if (item.data.rawText) {
              content += `action ${item.data.rawText}\n`;
            }
          } else {
            if (item.data.rawText) {
              content += `rule ${item.data.rawText}\n`;
            }
          }
        });
      } else {
        editedState.actions.forEach(action => {
          if (action.rawText) {
            content += `action ${action.rawText}\n`;
          }
        });
        editedState.rules.forEach(rule => {
          if (rule.rawText) {
            content += `rule ${rule.rawText}\n`;
          }
        });
      }
      
      const configDir = await window.electronAPI.getConfigDir();
      const statesDir = `${configDir}/templates/states`;
      const templateFileName = `${sanitizedTemplateName}.eqf`;
      const templatePath = `${statesDir}/${templateFileName}`;
      
      const ensureResult = await window.electronAPI.ensureDir(statesDir);
      if (!ensureResult.success) {
        throw new Error(`Failed to create directory: ${ensureResult.error}`);
      }
      
      const writeResult = await window.electronAPI.writeTextFile(templatePath, content.trim());
      if (!writeResult.success) {
        throw new Error(`Failed to write file: ${writeResult.error}`);
      }
      
      // Close dialog
      setSaveTemplateDialog({ open: false, templateName: '' });
      
      // Notify parent if callback provided (optional)
      if (onSaveAsTemplate) {
        onSaveAsTemplate(editedState);
      }
    } catch (err: any) {
      console.error('Error saving state template:', err);
      // Keep dialog open on error so user can retry
    }
  };

  const handleAddAction = () => {
    const defaultType = actionTypes[0] || 'AddNpcText';
    const paramConfig = actionParams[defaultType] || [];
    const newAction: QuestAction = { 
      type: defaultType, 
      params: paramConfig.map(() => ''), // Start with empty params
      rawText: '' 
    };
    newAction.rawText = generateActionRawText(newAction);
    
    const newItem: StateItem = { kind: 'action', data: newAction };
    const newItems = [...unifiedItems, newItem];
    setUnifiedItems(newItems);
    syncUnifiedToState(newItems);
  };

  const handleRemoveItem = (unifiedIndex: number) => {
    const newItems = unifiedItems.filter((_, i) => i !== unifiedIndex);
    setUnifiedItems(newItems);
    syncUnifiedToState(newItems);
  };

  const handleUpdateAction = (unifiedIndex: number, field: 'type' | 'params', value: any) => {
    const newItems = [...unifiedItems];
    const item = newItems[unifiedIndex];
    if (item.kind !== 'action') return;
    
    if (field === 'type') {
      const paramConfig = actionParams[value] || [];
      const newAction: QuestAction = { type: value, params: paramConfig.map(() => ''), rawText: '' };
      newAction.rawText = generateActionRawText(newAction);
      newItems[unifiedIndex] = { ...item, data: newAction };
    } else {
      const newAction = { ...item.data, params: value };
      newAction.rawText = generateActionRawText(newAction);
      newItems[unifiedIndex] = { ...item, data: newAction };
    }
    setUnifiedItems(newItems);
    syncUnifiedToState(newItems);
  };

  const handleAddRule = () => {
    const defaultType = ruleTypes[0] || 'Always';
    const paramConfig = ruleParams[defaultType] || [];
    // In template mode, use a placeholder goto state that can be changed later
    const defaultGotoState = isTemplateMode ? 'NextState' : '';
    const newRule: QuestRule = { 
      type: defaultType, 
      params: paramConfig.map(() => ''), // Start with empty params
      gotoState: defaultGotoState, 
      rawText: '' 
    };
    newRule.rawText = generateRuleRawText(newRule);
    
    const newItem: StateItem = { kind: 'rule', data: newRule };
    const newItems = [...unifiedItems, newItem];
    setUnifiedItems(newItems);
    syncUnifiedToState(newItems);
  };

  const handleUpdateRule = (unifiedIndex: number, field: 'type' | 'params' | 'gotoState', value: any) => {
    const newItems = [...unifiedItems];
    const item = newItems[unifiedIndex];
    if (item.kind !== 'rule') return;
    
    if (field === 'type') {
      const paramConfig = ruleParams[value] || [];
      const newRule: QuestRule = { type: value, params: paramConfig.map(() => ''), gotoState: item.data.gotoState, rawText: '' };
      newRule.rawText = generateRuleRawText(newRule);
      newItems[unifiedIndex] = { ...item, data: newRule };
    } else if (field === 'gotoState') {
      const newRule = { ...item.data, gotoState: value };
      newRule.rawText = generateRuleRawText(newRule);
      newItems[unifiedIndex] = { ...item, data: newRule };
    } else {
      const newRule = { ...item.data, params: value };
      newRule.rawText = generateRuleRawText(newRule);
      newItems[unifiedIndex] = { ...item, data: newRule };
    }
    setUnifiedItems(newItems);
    syncUnifiedToState(newItems);
  };

  const handleParamChange = (unifiedIndex: number, paramIndex: number, value: string) => {
    const newItems = [...unifiedItems];
    const item = newItems[unifiedIndex];
    
    if (item.kind === 'action') {
      const newParams = [...item.data.params];
      const paramInfos = actionParams[item.data.type] || [];
      const paramInfo = paramInfos[paramIndex];
      
      // Parse based on expected type from config
      let parsedValue: string | number;
      if (paramInfo?.type === 'string') {
        parsedValue = value; // Keep as string
      } else {
        // Integer type - allow empty string, otherwise parse as number
        if (value.trim() === '') {
          parsedValue = ''; // Allow empty
        } else {
          parsedValue = !isNaN(Number(value)) ? Number(value) : value;
        }
      }
      
      newParams[paramIndex] = parsedValue;
      const newAction = { ...item.data, params: newParams };
      newAction.rawText = generateActionRawText(newAction);
      newItems[unifiedIndex] = { ...item, data: newAction };
    } else {
      const newParams = [...item.data.params];
      const paramInfos = ruleParams[item.data.type] || [];
      const paramInfo = paramInfos[paramIndex];
      
      // Parse based on expected type from config
      let parsedValue: string | number;
      if (paramInfo?.type === 'string') {
        parsedValue = value; // Keep as string
      } else {
        // Integer type - allow empty string, otherwise parse as number
        if (value.trim() === '') {
          parsedValue = ''; // Allow empty
        } else {
          parsedValue = !isNaN(Number(value)) ? Number(value) : value;
        }
      }
      
      newParams[paramIndex] = parsedValue;
      const newRule = { ...item.data, params: newParams };
      newRule.rawText = generateRuleRawText(newRule);
      newItems[unifiedIndex] = { ...item, data: newRule };
    }
    
    setUnifiedItems(newItems);
    syncUnifiedToState(newItems);
  };

  // Get description for an action or rule from config
  const getDescription = (type: 'action' | 'rule', name: string): string | null => {
    if (!config) return null;
    if (type === 'action') {
      return config.actions[name]?.description || null;
    } else {
      return config.rules[name]?.description || null;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '15px',
          borderBottom: '1px solid var(--border-primary)'
        }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Edit State: {state.name}</h2>
            <p style={{ margin: '5px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
              State #{stateIndex + 1}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* State Info */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 500,
            color: 'var(--text-primary)'
          }}>
            State Name
          </label>
          <input
            type="text"
            value={editedState.name}
            onChange={(e) => setEditedState({ ...editedState, name: e.target.value })}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 500,
            color: 'var(--text-primary)'
          }}>
            Description
          </label>
          <textarea
            value={editedState.description}
            onChange={(e) => setEditedState({ ...editedState, description: e.target.value })}
            rows={2}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        {/* State Templates Section - only show in quest mode (not template editing mode) */}
        {!isTemplateMode && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 500,
              color: 'var(--text-primary)'
            }}>
              State Templates
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                defaultValue=""
                onChange={(e) => {
                  const templateName = e.target.value;
                  if (templateName && stateTemplates[templateName]) {
                    const template = stateTemplates[templateName];
                    // Use the template's items array to preserve order
                    const newItems = template.items && template.items.length > 0 
                      ? [...template.items]
                      : buildItemsList({ 
                          name: editedState.name, 
                          description: template.description || '', 
                          actions: [...template.actions], 
                          rules: [...template.rules] 
                        });
                    setEditedState({
                      ...editedState,
                      description: template.description || editedState.description,
                      actions: [...template.actions],
                      rules: [...template.rules],
                      items: newItems
                    });
                    setUnifiedItems(newItems);
                    // Reset the select
                    e.target.value = '';
                  }
                }}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '8px',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <option value="">-- Apply State Template --</option>
                {Object.keys(stateTemplates).map(name => (
                  <option key={name} value={name.replace(/\.eqf$/i, '')}>{name.replace(/\.eqf$/i, '')}</option>
                ))}
              </select>
              {onSaveAsTemplate && (
                <button
                  onClick={handleSaveAsTemplate}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--text-primary)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap'
                  }}
                  title="Save current state as a template"
                >
                  <SaveAsIcon fontSize="small" />
                  Save as Template
                </button>
              )}
              <button
                onClick={handleResetState}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'var(--accent-warning)',
                  color: 'var(--text-primary)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap'
                }}
                title="Clear all actions and rules"
              >
                <RestartAltIcon fontSize="small" />
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Unified Actions & Rules Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>
              Actions & Rules ({unifiedItems.length})
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleAddAction}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <AddIcon fontSize="small" />
                Add Action
              </button>
              <button
                onClick={handleAddRule}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <AddIcon fontSize="small" />
                Add Rule
              </button>
            </div>
          </div>

          {/* Legend */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            marginBottom: '12px',
            fontSize: '12px',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#4caf50', borderRadius: '2px' }} />
              <span>Action</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#2196f3', borderRadius: '2px' }} />
              <span>Rule</span>
            </div>
            <div style={{ marginLeft: 'auto', fontStyle: 'italic', color: 'var(--text-tertiary)' }}>
              Drag to reorder
            </div>
          </div>

          {unifiedItems.map((item, index) => {
            const isAction = item.kind === 'action';
            const borderColor = isAction ? '#4caf50' : '#2196f3';
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index && draggedIndex !== index;
            
            // Determine if the drop would place the item above or below current position
            const wouldDropAbove = draggedIndex !== null && draggedIndex > index;
            
            return (
              <div 
                key={`${item.kind}-${index}`}
                ref={isDragging ? dragNodeRef : null}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                style={{
                  position: 'relative',
                  padding: '12px',
                  backgroundColor: isDragging ? 'var(--bg-tertiary)' : isDragOver ? 'var(--bg-hover)' : 'var(--bg-secondary)',
                  border: `2px solid ${isDragOver ? '#ff9800' : borderColor}`,
                  borderRadius: '4px',
                  marginBottom: isDragOver ? '16px' : '8px',
                  marginTop: isDragOver && wouldDropAbove ? '8px' : '0',
                  opacity: isDragging ? 0.4 : 1,
                  transform: isDragOver ? 'scale(1.02)' : 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: isDragOver ? '0 4px 12px rgba(255, 152, 0, 0.3)' : 'none'
                }}
              >
                {/* Drop indicator line - shows where the item will be inserted */}
                {isDragOver && (
                  <div style={{
                    position: 'absolute',
                    left: '-2px',
                    right: '-2px',
                    height: '4px',
                    backgroundColor: '#ff9800',
                    borderRadius: '2px',
                    top: wouldDropAbove ? '-10px' : 'auto',
                    bottom: wouldDropAbove ? 'auto' : '-10px',
                    boxShadow: '0 0 8px rgba(255, 152, 0, 0.6)'
                  }}>
                    {/* Arrow indicators */}
                    <div style={{
                      position: 'absolute',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      top: wouldDropAbove ? '-8px' : '4px',
                      width: 0,
                      height: 0,
                      borderLeft: '8px solid transparent',
                      borderRight: '8px solid transparent',
                      borderTop: wouldDropAbove ? 'none' : '8px solid #ff9800',
                      borderBottom: wouldDropAbove ? '8px solid #ff9800' : 'none'
                    }} />
                  </div>
                )}
                {isAction ? (
                  // Action Item
                  <>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div 
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          color: 'var(--text-tertiary)',
                          cursor: 'grab',
                          padding: '4px 0'
                        }}
                        title="Drag to reorder"
                      >
                        <DragIndicatorIcon fontSize="small" />
                      </div>
                      <div style={{ 
                        padding: '4px 8px', 
                        backgroundColor: '#4caf50', 
                        color: 'white', 
                        borderRadius: '3px',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        Action
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '4px', 
                          fontSize: '12px',
                          color: 'var(--text-secondary)'
                        }}>
                          Action Type
                        </label>
                        <select
                          value={(item.data as QuestAction).type}
                          onChange={(e) => handleUpdateAction(index, 'type', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px',
                            backgroundColor: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                        >
                          {actionTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                        {getDescription('action', (item.data as QuestAction).type) && (
                          <div style={{ 
                            fontSize: '11px', 
                            color: 'var(--text-tertiary)', 
                            marginTop: '4px',
                            fontStyle: 'italic'
                          }}>
                            {getDescription('action', (item.data as QuestAction).type)}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveItem(index)}
                        style={{
                          marginTop: '18px',
                          padding: '6px',
                          backgroundColor: 'var(--accent-danger)',
                          color: 'var(--text-primary)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        title="Remove action"
                      >
                        <DeleteIcon fontSize="small" />
                      </button>
                    </div>

                    {(item.data as QuestAction).params.length > 0 && (
                      <div style={{ marginLeft: '32px' }}>
                        <label style={{ 
                          display: 'block',
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          marginBottom: '4px'
                        }}>
                          Parameters
                        </label>
                        {(item.data as QuestAction).params.map((param, paramIndex) => {
                          const paramInfos = actionParams[(item.data as QuestAction).type] || [];
                          const paramInfo = paramInfos[paramIndex];
                          const placeholder = paramInfo?.name || `Parameter ${paramIndex + 1}`;
                          const isString = paramInfo?.type === 'string';
                          return (
                            <div key={paramIndex} style={{ marginBottom: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ 
                                  fontSize: '11px', 
                                  color: 'var(--text-secondary)',
                                  minWidth: '80px'
                                }}>
                                  {placeholder}:
                                </span>
                                <input
                                  type="text"
                                  value={param}
                                  onChange={(e) => handleParamChange(index, paramIndex, e.target.value)}
                                  placeholder={isString ? 'Enter text...' : 'Enter number...'}
                                  style={{
                                    flex: 1,
                                    padding: '4px 8px',
                                    backgroundColor: 'var(--bg-input)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-primary)',
                                    borderRadius: '3px',
                                    fontSize: '12px'
                                  }}
                                />
                                <span style={{ 
                                  fontSize: '10px', 
                                  color: 'var(--text-tertiary)',
                                  minWidth: '30px'
                                }}>
                                  {isString ? 'text' : 'int'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  // Rule Item
                  <>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div 
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          color: 'var(--text-tertiary)',
                          cursor: 'grab',
                          padding: '4px 0'
                        }}
                        title="Drag to reorder"
                      >
                        <DragIndicatorIcon fontSize="small" />
                      </div>
                      <div style={{ 
                        padding: '4px 8px', 
                        backgroundColor: '#2196f3', 
                        color: 'white', 
                        borderRadius: '3px',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        Rule
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '4px', 
                          fontSize: '12px',
                          color: 'var(--text-secondary)'
                        }}>
                          Rule Type
                        </label>
                        <select
                          value={(item.data as QuestRule).type}
                          onChange={(e) => handleUpdateRule(index, 'type', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px',
                            backgroundColor: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                        >
                          {ruleTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                        {getDescription('rule', (item.data as QuestRule).type) && (
                          <div style={{ 
                            fontSize: '11px', 
                            color: 'var(--text-tertiary)', 
                            marginTop: '4px',
                            fontStyle: 'italic'
                          }}>
                            {getDescription('rule', (item.data as QuestRule).type)}
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '4px', 
                          fontSize: '12px',
                          color: 'var(--text-secondary)'
                        }}>
                          Goto State
                        </label>
                        {isTemplateMode ? (
                          // In template mode, show a text input for the goto state
                          <input
                            type="text"
                            value={(item.data as QuestRule).gotoState}
                            onChange={(e) => handleUpdateRule(index, 'gotoState', e.target.value)}
                            placeholder="NextState"
                            style={{
                              width: '100%',
                              padding: '6px',
                              backgroundColor: 'var(--bg-input)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border-primary)',
                              borderRadius: '4px',
                              fontSize: '13px',
                              boxSizing: 'border-box'
                            }}
                          />
                        ) : (
                          // In quest mode, show a dropdown to select existing states
                          <select
                            value={(item.data as QuestRule).gotoState}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '__NEW_STATE__') {
                                // Generate a unique new state name
                                let counter = 1;
                                let newStateName = `NewState${counter}`;
                                while (allStates.some(s => s.name === newStateName) || editedState.name === newStateName) {
                                  counter++;
                                  newStateName = `NewState${counter}`;
                                }
                                // Create the new state if callback is provided
                                if (onCreateState) {
                                  onCreateState(newStateName);
                                }
                                // Set the rule to go to this new state
                                handleUpdateRule(index, 'gotoState', newStateName);
                              } else {
                                handleUpdateRule(index, 'gotoState', value);
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '6px',
                              backgroundColor: 'var(--bg-input)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border-primary)',
                              borderRadius: '4px',
                              fontSize: '13px',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="">-- Select State --</option>
                            {allStates.map((s) => (
                              <option key={s.name} value={s.name}>
                                {s.name}
                              </option>
                            ))}
                            <option value="__NEW_STATE__" style={{ fontStyle: 'italic' }}>+ New State...</option>
                          </select>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveItem(index)}
                        style={{
                          marginTop: '18px',
                          padding: '6px',
                          backgroundColor: 'var(--accent-danger)',
                          color: 'var(--text-primary)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        title="Remove rule"
                      >
                        <DeleteIcon fontSize="small" />
                      </button>
                    </div>

                    {(item.data as QuestRule).params.length > 0 && (
                      <div style={{ marginLeft: '32px' }}>
                        <label style={{ 
                          display: 'block',
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          marginBottom: '4px'
                        }}>
                          Parameters
                        </label>
                        {(item.data as QuestRule).params.map((param, paramIndex) => {
                          const paramInfos = ruleParams[(item.data as QuestRule).type] || [];
                          const paramInfo = paramInfos[paramIndex];
                          const placeholder = paramInfo?.name || `Parameter ${paramIndex + 1}`;
                          const isString = paramInfo?.type === 'string';
                          return (
                            <div key={paramIndex} style={{ marginBottom: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ 
                                  fontSize: '11px', 
                                  color: 'var(--text-secondary)',
                                  minWidth: '80px'
                                }}>
                                  {placeholder}:
                                </span>
                                <input
                                  type="text"
                                  value={param}
                                  onChange={(e) => handleParamChange(index, paramIndex, e.target.value)}
                                  placeholder={isString ? 'Enter text...' : 'Enter number...'}
                                  style={{
                                    flex: 1,
                                    padding: '4px 8px',
                                    backgroundColor: 'var(--bg-input)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-primary)',
                                    borderRadius: '3px',
                                    fontSize: '12px'
                                  }}
                                />
                                <span style={{ 
                                  fontSize: '10px', 
                                  color: 'var(--text-tertiary)',
                                  minWidth: '30px'
                                }}>
                                  {isString ? 'text' : 'int'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {unifiedItems.length === 0 && (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              fontStyle: 'italic',
              border: '1px dashed var(--border-primary)',
              borderRadius: '4px'
            }}>
              No actions or rules defined. Click the buttons above to add some.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          justifyContent: 'flex-end',
          paddingTop: '15px',
          borderTop: '1px solid var(--border-primary)'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
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
            onClick={handleSave}
            style={{
              padding: '8px 16px',
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

      {/* Save as Template Dialog - rendered inside the modal for proper z-index */}
      {saveTemplateDialog.open && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200000
          }}
          onClick={() => setSaveTemplateDialog({ open: false, templateName: '' })}
        >
          <div 
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px',
              padding: '24px',
              minWidth: '400px',
              maxWidth: '500px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-primary)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ 
              margin: '0 0 16px 0', 
              color: 'var(--text-primary)',
              fontSize: '18px'
            }}>
              Save State as Template
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                color: 'var(--text-secondary)',
                fontSize: '13px'
              }}>
                Template Name
              </label>
              <input
                type="text"
                value={saveTemplateDialog.templateName}
                onChange={(e) => setSaveTemplateDialog(prev => ({ ...prev, templateName: e.target.value }))}
                autoFocus
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmSaveTemplate();
                  } else if (e.key === 'Escape') {
                    setSaveTemplateDialog({ open: false, templateName: '' });
                  }
                }}
              />
              <div style={{ 
                color: 'var(--text-tertiary)', 
                fontSize: '11px',
                marginTop: '4px'
              }}>
                The template will be saved to config/templates/states/
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSaveTemplateDialog({ open: false, templateName: '' })}
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
                onClick={handleConfirmSaveTemplate}
                disabled={!saveTemplateDialog.templateName.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: saveTemplateDialog.templateName.trim() ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: saveTemplateDialog.templateName.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 500,
                  opacity: saveTemplateDialog.templateName.trim() ? 1 : 0.5
                }}
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

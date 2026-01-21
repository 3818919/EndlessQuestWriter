import React, { useState, useEffect } from 'react';
import { QuestState, QuestAction, QuestRule } from '../../../eqf-parser';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { loadConfig, ConfigData } from '../../services/configService';

interface StateNodeEditorProps {
  state: QuestState;
  stateIndex: number;
  originalStateName: string;
  allStates: QuestState[];
  onClose: () => void;
  onSave: (updates: Partial<QuestState>, nameChanged: boolean, oldName: string) => void;
  onCreateState?: (stateName: string) => void;
}

// Default action/rule types if config not loaded
const DEFAULT_ACTION_TYPES = [
  'AddNpcText', 'AddNpcInput', 'AddNpcChat', 'AddNpcPM', 'Reset', 'End', 'SetState',
  'GiveItem', 'RemoveItem', 'GiveExp', 'GiveBankItem', 'RemoveBankItem',
  'SetClass', 'SetRace', 'ShowHint', 'PlaySound', 'PlayEffect', 'PlayMusic',
  'SetCoord', 'SetMap', 'Quake', 'QuakeWorld', 'SetHome', 'SetTitle',
  'GiveKarma', 'RemoveKarma', 'AddKillNpc', 'RemoveKillNpc', 'ResetKillNpc',
  'StartQuest', 'ResetQuest'
];

const DEFAULT_RULE_TYPES = [
  'Always', 'TalkedToNpc', 'InputNpc', 'KilledNpcs', 'KilledPlayers',
  'GotItems', 'LostItems', 'EnterCoord', 'LeaveCoord', 'EnterMap', 'LeaveMap',
  'EnterArea', 'LeaveArea', 'IsClass', 'IsRace', 'IsGender', 'IsNamed',
  'CitizenOf', 'GotSpell', 'LostSpell', 'UsedItem', 'UsedSpell',
  'IsWearing', 'NotWearing', 'Unequipped', 'Stepped', 'Die',
  'TimeElapsed', 'WaitMinutes', 'WaitSeconds', 'FinishedQuest', 'Disconnected'
];

// Parameter configuration for actions (fallback)
const DEFAULT_ACTION_PARAMS: Record<string, string[]> = {
  AddNpcText: ['NPC ID', 'Text to display'],
  AddNpcInput: ['NPC ID', 'Input ID', 'Text to display'],
  AddNpcChat: ['NPC ID', 'Chat message'],
  AddNpcPM: ['Name', 'Private message'],
  GiveItem: ['Item ID', 'Amount'],
  RemoveItem: ['Item ID', 'Amount'],
  GiveExp: ['Amount'],
  GiveBankItem: ['Item ID', 'Amount'],
  RemoveBankItem: ['Item ID', 'Amount'],
  SetClass: ['Class ID'],
  SetRace: ['Race ID'],
  SetState: ['State name'],
  ShowHint: ['Hint message'],
  PlaySound: ['Sound ID'],
  PlayEffect: ['Effect ID'],
  PlayMusic: ['Music ID'],
  Reset: [],
  End: [],
  SetCoord: ['Map ID', 'X', 'Y'],
  SetMap: ['Map ID', 'X', 'Y'],
  Quake: ['Magnitude', 'Map ID (optional)'],
  QuakeWorld: ['Magnitude'],
  SetHome: ['Home town'],
  SetTitle: ['Title'],
  GiveKarma: ['Amount'],
  RemoveKarma: ['Amount'],
  AddKillNpc: ['NPC ID'],
  RemoveKillNpc: ['NPC ID'],
  ResetKillNpc: ['NPC ID'],
  StartQuest: ['Quest ID'],
  ResetQuest: ['Quest ID']
};

// Parameter configuration for rules (fallback)
const DEFAULT_RULE_PARAMS: Record<string, string[]> = {
  Always: [],
  TalkedToNpc: ['NPC ID'],
  InputNpc: ['Input ID'],
  KilledNpcs: ['NPC ID', 'Amount'],
  KilledPlayers: ['Amount'],
  GotItems: ['Item ID', 'Amount'],
  LostItems: ['Item ID', 'Amount'],
  EnterCoord: ['Map ID', 'X', 'Y'],
  LeaveCoord: ['Map ID', 'X', 'Y'],
  EnterMap: ['Map ID'],
  LeaveMap: ['Map ID'],
  EnterArea: ['Map ID', 'X', 'Y', 'Radius'],
  LeaveArea: ['Map ID', 'X', 'Y', 'Radius'],
  IsClass: ['Class ID'],
  IsRace: ['Race ID'],
  IsGender: ['Gender ID (0=male, 1=female)'],
  IsNamed: ['Player name'],
  CitizenOf: ['Home town'],
  GotSpell: ['Spell ID'],
  LostSpell: ['Spell ID'],
  UsedItem: ['Item ID', 'Amount'],
  UsedSpell: ['Spell ID', 'Amount'],
  IsWearing: ['Item ID'],
  NotWearing: ['Item ID'],
  Unequipped: [],
  Stepped: ['Amount'],
  Die: ['Count (optional)'],
  TimeElapsed: ['Time (e.g., "30m", "2h")'],
  WaitMinutes: ['Minutes'],
  WaitSeconds: ['Seconds'],
  FinishedQuest: ['Quest ID'],
  Disconnected: []
};

// Parse parameter names from signature like `ActionName(param1, param2)`
function parseParamsFromSignature(signature: string): string[] {
  const match = signature.match(/\(([^)]*)\)/);
  if (!match || !match[1].trim()) return [];
  
  // Split by comma and clean up
  return match[1].split(',').map(p => {
    // Remove backticks, quotes, and trim
    return p.replace(/[`"']/g, '').trim();
  }).filter(p => p.length > 0);
}

export default function StateNodeEditor({ state, stateIndex, originalStateName, allStates, onClose, onSave, onCreateState }: StateNodeEditorProps) {
  const [editedState, setEditedState] = useState<QuestState>({
    name: state.name,
    description: state.description,
    actions: [...state.actions],
    rules: [...state.rules]
  });
  
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [actionTypes, setActionTypes] = useState<string[]>(DEFAULT_ACTION_TYPES);
  const [ruleTypes, setRuleTypes] = useState<string[]>(DEFAULT_RULE_TYPES);
  const [actionParams, setActionParams] = useState<Record<string, string[]>>(DEFAULT_ACTION_PARAMS);
  const [ruleParams, setRuleParams] = useState<Record<string, string[]>>(DEFAULT_RULE_PARAMS);

  // Load config on mount
  useEffect(() => {
    loadConfig().then(loadedConfig => {
      setConfig(loadedConfig);
      
      // Extract action types and params from config
      if (Object.keys(loadedConfig.actions).length > 0) {
        const types = Object.keys(loadedConfig.actions);
        setActionTypes(types);
        
        // Build params from signatures
        const params: Record<string, string[]> = {};
        for (const [name, data] of Object.entries(loadedConfig.actions)) {
          params[name] = parseParamsFromSignature(data.signature);
        }
        setActionParams(params);
      }
      
      // Extract rule types and params from config
      if (Object.keys(loadedConfig.rules).length > 0) {
        const types = Object.keys(loadedConfig.rules);
        setRuleTypes(types);
        
        // Build params from signatures
        const params: Record<string, string[]> = {};
        for (const [name, data] of Object.entries(loadedConfig.rules)) {
          params[name] = parseParamsFromSignature(data.signature);
        }
        setRuleParams(params);
      }
    });
  }, []);

  // Helper function to generate rawText for an action
  const generateActionRawText = (action: QuestAction): string => {
    const paramsStr = action.params.map(p => 
      typeof p === 'string' ? `"${p}"` : p
    ).join(', ');
    return `${action.type}(${paramsStr})`;
  };

  // Helper function to generate rawText for a rule
  const generateRuleRawText = (rule: QuestRule): string => {
    const paramsStr = rule.params.map(p => 
      typeof p === 'string' ? `"${p}"` : p
    ).join(', ');
    return `${rule.type}(${paramsStr}) goto ${rule.gotoState}`;
  };

  const handleSave = () => {
    const nameChanged = editedState.name !== originalStateName;
    onSave(editedState, nameChanged, originalStateName);
    onClose();
  };

  const handleAddAction = () => {
    const defaultType = actionTypes[0] || 'AddNpcText';
    const paramConfig = actionParams[defaultType] || [];
    const newAction = { 
      type: defaultType, 
      params: paramConfig.map(() => ''), 
      rawText: '' 
    };
    newAction.rawText = generateActionRawText(newAction);
    setEditedState({
      ...editedState,
      actions: [
        ...editedState.actions,
        newAction
      ]
    });
  };

  const handleRemoveAction = (index: number) => {
    setEditedState({
      ...editedState,
      actions: editedState.actions.filter((_, i) => i !== index)
    });
  };

  const handleUpdateAction = (index: number, field: 'type' | 'params', value: any) => {
    const newActions = [...editedState.actions];
    if (field === 'type') {
      const paramConfig = actionParams[value] || [];
      newActions[index] = { type: value, params: paramConfig.map(() => ''), rawText: '' };
      newActions[index].rawText = generateActionRawText(newActions[index]);
    } else {
      newActions[index] = { ...newActions[index], params: value };
      newActions[index].rawText = generateActionRawText(newActions[index]);
    }
    setEditedState({ ...editedState, actions: newActions });
  };

  const handleAddRule = () => {
    const defaultType = ruleTypes[0] || 'Always';
    const paramConfig = ruleParams[defaultType] || [];
    const newRule = { 
      type: defaultType, 
      params: paramConfig.map(() => ''), 
      gotoState: '', 
      rawText: '' 
    };
    newRule.rawText = generateRuleRawText(newRule);
    setEditedState({
      ...editedState,
      rules: [
        ...editedState.rules,
        newRule
      ]
    });
  };

  const handleRemoveRule = (index: number) => {
    setEditedState({
      ...editedState,
      rules: editedState.rules.filter((_, i) => i !== index)
    });
  };

  const handleUpdateRule = (index: number, field: 'type' | 'params' | 'gotoState', value: any) => {
    const newRules = [...editedState.rules];
    if (field === 'type') {
      const paramConfig = ruleParams[value] || [];
      newRules[index] = { type: value, params: paramConfig.map(() => ''), gotoState: newRules[index].gotoState, rawText: '' };
      newRules[index].rawText = generateRuleRawText(newRules[index]);
    } else if (field === 'gotoState') {
      newRules[index] = { ...newRules[index], gotoState: value };
      newRules[index].rawText = generateRuleRawText(newRules[index]);
    } else {
      newRules[index] = { ...newRules[index], params: value };
      newRules[index].rawText = generateRuleRawText(newRules[index]);
    }
    setEditedState({ ...editedState, rules: newRules });
  };

  const handleParamChange = (actionOrRule: 'action' | 'rule', index: number, paramIndex: number, value: string) => {
    if (actionOrRule === 'action') {
      const newActions = [...editedState.actions];
      const newParams = [...newActions[index].params];
      // Try to parse as number if possible
      const parsedValue = !isNaN(Number(value)) && value.trim() !== '' ? Number(value) : value;
      newParams[paramIndex] = parsedValue;
      newActions[index] = { ...newActions[index], params: newParams };
      newActions[index].rawText = generateActionRawText(newActions[index]);
      setEditedState({ ...editedState, actions: newActions });
    } else {
      const newRules = [...editedState.rules];
      const newParams = [...newRules[index].params];
      const parsedValue = !isNaN(Number(value)) && value.trim() !== '' ? Number(value) : value;
      newParams[paramIndex] = parsedValue;
      newRules[index] = { ...newRules[index], params: newParams };
      newRules[index].rawText = generateRuleRawText(newRules[index]);
      setEditedState({ ...editedState, rules: newRules });
    }
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

        {/* Actions Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>
              Actions ({editedState.actions.length})
            </h3>
            <button
              onClick={handleAddAction}
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--accent-success)',
                color: 'var(--text-primary)',
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
          </div>

          {editedState.actions.map((action, index) => (
            <div 
              key={index}
              style={{
                padding: '12px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '4px',
                marginBottom: '8px'
              }}
            >
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>
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
                    value={action.type}
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
                  {getDescription('action', action.type) && (
                    <div style={{ 
                      fontSize: '11px', 
                      color: 'var(--text-tertiary)', 
                      marginTop: '4px',
                      fontStyle: 'italic'
                    }}>
                      {getDescription('action', action.type)}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveAction(index)}
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

              {action.params.length > 0 && (
                <div>
                  <label style={{ 
                    display: 'block',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    marginBottom: '4px'
                  }}>
                    Parameters
                  </label>
                  {action.params.map((param, paramIndex) => {
                    const paramConfig = actionParams[action.type] || [];
                    const placeholder = paramConfig[paramIndex] || `Parameter ${paramIndex + 1}`;
                    return (
                      <div key={paramIndex} style={{ marginBottom: '4px' }}>
                        <input
                          type="text"
                          value={param}
                          onChange={(e) => handleParamChange('action', index, paramIndex, e.target.value)}
                          placeholder={placeholder}
                          style={{
                            width: '100%',
                            padding: '4px 8px',
                            backgroundColor: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '3px',
                            fontSize: '12px'
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          ))}

          {editedState.actions.length === 0 && (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              fontStyle: 'italic'
            }}>
              No actions defined
            </div>
          )}
        </div>

        {/* Rules Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>
              Rules ({editedState.rules.length})
            </h3>
            <button
              onClick={handleAddRule}
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--accent-warning)',
                color: 'var(--text-primary)',
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

          {editedState.rules.map((rule, index) => (
            <div 
              key={index}
              style={{
                padding: '12px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '4px',
                marginBottom: '8px'
              }}
            >
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
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
                    value={rule.type}
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
                  {getDescription('rule', rule.type) && (
                    <div style={{ 
                      fontSize: '11px', 
                      color: 'var(--text-tertiary)', 
                      marginTop: '4px',
                      fontStyle: 'italic'
                    }}>
                      {getDescription('rule', rule.type)}
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
                  <select
                    value={rule.gotoState}
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
                </div>
                <button
                  onClick={() => handleRemoveRule(index)}
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

              {rule.params.length > 0 && (
                <div>
                  <label style={{ 
                    display: 'block',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    marginBottom: '4px'
                  }}>
                    Parameters
                  </label>
                  {rule.params.map((param, paramIndex) => {
                    const paramConfig = ruleParams[rule.type] || [];
                    const placeholder = paramConfig[paramIndex] || `Parameter ${paramIndex + 1}`;
                    return (
                      <div key={paramIndex} style={{ marginBottom: '4px' }}>
                        <input
                          type="text"
                          value={param}
                          onChange={(e) => handleParamChange('rule', index, paramIndex, e.target.value)}
                          placeholder={placeholder}
                          style={{
                            width: '100%',
                            padding: '4px 8px',
                            backgroundColor: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '3px',
                            fontSize: '12px'
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          ))}

          {editedState.rules.length === 0 && (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              fontStyle: 'italic'
            }}>
              No rules defined
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
    </div>
  );
}

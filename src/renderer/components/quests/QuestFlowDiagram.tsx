import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  MarkerType,
  Handle,
  Position,
  ReactFlowInstance
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { QuestData, QuestState } from '../../../eqf-parser';
import dagre from 'dagre';
import { toPng } from 'html-to-image';
import StateNodeEditor from './StateNodeEditor';

interface QuestFlowDiagramProps {
  quest: QuestData;
  onQuestChange: (updates: Partial<QuestData>) => void;
  onNavigateToState?: (stateName: string) => void;
  highlightState?: string | null;
}


const StateNode = ({ data }: { data: any }) => {
  const handleOpenInEditor = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[StateNode] Open in editor clicked for state:', data.label);
    if (data.onNavigateToState) {
      console.log('[StateNode] Calling onNavigateToState with:', data.label);
      data.onNavigateToState(data.label);
    } else {
      console.warn('[StateNode] No onNavigateToState callback available');
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete state "${data.label}"?\n\nThis will remove the state and update all references to it.`)) {
      if (data.onDeleteState) {
        data.onDeleteState(data.stateIndex);
      }
    }
  };

  return (
    <div style={{
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid var(--accent-primary)',
      backgroundColor: 'var(--bg-secondary)',
      color: 'var(--text-primary)',
      minWidth: '220px',
      maxWidth: '320px',
      boxShadow: '0 4px 6px var(--shadow)',
      position: 'relative'
    }}>
      {/* Connection handles */}
      <Handle type="target" position={Position.Top} style={{ background: 'var(--accent-primary)' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: 'var(--accent-primary)' }} />
      
      {/* Delete button in top right */}
      <button
        onClick={handleDelete}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          fontSize: '14px',
          transition: 'color 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-danger)'}
        onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        title="Delete state"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </button>
      
      {/* State Name with Open Icon */}
      <div style={{ 
        fontWeight: 600, 
        fontSize: '14px', 
        marginBottom: '4px', 
        color: 'var(--accent-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        paddingRight: '24px' 
      }}>
        <span>{data.label}</span>
        <button
          onClick={handleOpenInEditor}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '12px',
            transition: 'color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
          onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          title="Open in text editor"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </button>
      </div>
      
      {/* Description */}
      {data.description && (
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px', fontStyle: 'italic' }}>
          {data.description}
        </div>
      )}
      
      {/* Actions */}
      {data.actions && data.actions.length > 0 && (
        <div style={{ marginTop: '8px', fontSize: '11px' }}>
          <div style={{ color: 'var(--accent-success)', fontWeight: 600, marginBottom: '4px' }}>Actions:</div>
          <div style={{ 
            maxHeight: '120px', 
            overflowY: 'auto', 
            paddingLeft: '8px',
            borderLeft: '2px solid var(--border-primary)'
          }}>
            {data.actions
              .filter((action: any) => action.type !== 'End' && action.type !== 'Reset') 
              .map((action: any, idx: number) => (
                <div key={idx} style={{ 
                  marginBottom: '3px', 
                  color: 'var(--text-tertiary)',
                  fontSize: '10px',
                  wordBreak: 'break-word'
                }}>
                  {action.display}
                </div>
              ))}
          </div>
        </div>
      )}
      
      {/* Rules */}
      {data.rules && data.rules.length > 0 && (
        <div style={{ marginTop: '8px', fontSize: '11px' }}>
          <div style={{ color: 'var(--accent-warning)', fontWeight: 600, marginBottom: '4px' }}>Rules:</div>
          <div style={{ 
            paddingLeft: '8px',
            borderLeft: '2px solid var(--border-primary)'
          }}>
            {data.rules.map((rule: any, idx: number) => (
              <div 
                key={idx} 
                style={{ 
                  marginBottom: '3px', 
                  color: 'var(--text-tertiary)',
                  fontSize: '10px',
                  wordBreak: 'break-word',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{rule.display}</span>
                <span style={{ color: 'var(--accent-warning)', fontSize: '12px' }}>→ {rule.gotoState}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


const EndNode = () => {
  return (
    <div style={{
      padding: '16px 24px',
      borderRadius: '50%',
      border: '3px solid var(--accent-danger)',
      backgroundColor: 'var(--bg-secondary)',
      color: 'var(--accent-danger)',
      minWidth: '100px',
      minHeight: '100px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 6px var(--shadow)',
      position: 'relative',
      fontWeight: 700,
      fontSize: '16px'
    }}>
      <Handle type="target" position={Position.Top} style={{ background: 'var(--accent-danger)' }} />
      END
    </div>
  );
};


const ResetNode = () => {
  return (
    <div style={{
      padding: '16px 24px',
      borderRadius: '50%',
      border: '3px solid var(--accent-warning)',
      backgroundColor: 'var(--bg-secondary)',
      color: 'var(--accent-warning)',
      minWidth: '100px',
      minHeight: '100px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 6px var(--shadow)',
      position: 'relative',
      fontWeight: 700,
      fontSize: '16px'
    }}>
      <Handle type="target" position={Position.Top} style={{ background: 'var(--accent-warning)' }} />
      RESET
    </div>
  );
};

const nodeTypes = {
  stateNode: StateNode,
  endNode: EndNode,
  resetNode: ResetNode
};


const formatActionDisplay = (action: any): string => {
  const paramStr = action.params.map((p: any) => 
    typeof p === 'string' ? `"${p}"` : p
  ).join(', ');
  return `${action.type}(${paramStr})`;
};

const formatRuleDisplay = (rule: any): string => {
  const paramStr = rule.params.map((p: any) => 
    typeof p === 'string' ? `"${p}"` : p
  ).join(', ');
  return `${rule.type}(${paramStr})`;
};


const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 150 });

  nodes.forEach((node) => {
    
    const baseHeight = 80;
    const actionCount = typeof node.data.actionCount === 'number' ? node.data.actionCount : 0;
    const ruleCount = typeof node.data.ruleCount === 'number' ? node.data.ruleCount : 0;
    const actionHeight = actionCount * 15;
    const ruleHeight = ruleCount * 15;
    const height = Math.min(baseHeight + actionHeight + ruleHeight, 300);
    
    dagreGraph.setNode(node.id, { width: 260, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const nodeData = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeData.width / 2,
        y: nodeWithPosition.y - nodeData.height / 2
      }
    };
  });

  return { nodes: layoutedNodes, edges };
};

export default function QuestFlowDiagram({ quest, onQuestChange, onNavigateToState, highlightState }: QuestFlowDiagramProps) {
  const [editingState, setEditingState] = useState<{ state: QuestState; index: number } | null>(null);

  
  const handleDeleteState = useCallback((stateIndex: number) => {
    const newStates = [...quest.states];
    const deletedStateName = newStates[stateIndex].name;
    
    
    newStates.splice(stateIndex, 1);
    
    
    newStates.forEach((state, idx) => {
      
      const updatedRules = state.rules.filter(rule => rule.gotoState !== deletedStateName);
      
      
      const updatedActions = state.actions.filter(action => {
        if ((action.type === 'SetState' || action.type === 'Goto') && 
            action.params.length > 0 && 
            action.params[0] === deletedStateName) {
          return false; 
        }
        return true;
      });
      
      newStates[idx] = {
        ...newStates[idx],
        rules: updatedRules,
        actions: updatedActions
      };
    });
    
    onQuestChange({ states: newStates });
  }, [quest.states, onQuestChange]);

  
  const hasEndAction = useMemo(() => {
    return quest.states.some(state => 
      state.actions.some(action => action.type === 'End')
    );
  }, [quest.states]);

  
  const hasResetAction = useMemo(() => {
    return quest.states.some(state => 
      state.actions.some(action => action.type === 'Reset')
    );
  }, [quest.states]);

  
  const initialNodes: Node[] = useMemo(() => {
    const nodes: Node[] = quest.states.map((state, index) => ({
      id: state.name,
      type: 'stateNode',
      data: {
        label: state.name,
        description: state.description,
        actionCount: state.actions.length,
        ruleCount: state.rules.length,
        actions: state.actions.map(action => ({
          ...action,
          display: formatActionDisplay(action)
        })),
        rules: state.rules.map(rule => ({
          ...rule,
          display: formatRuleDisplay(rule)
        })),
        stateIndex: index,
        onNavigateToState,
        onDeleteState: handleDeleteState
      },
      position: { x: 0, y: 0 }
    }));

    
    if (hasEndAction) {
      nodes.push({
        id: '__END__',
        type: 'endNode',
        data: {} as any,
        position: { x: 0, y: 0 }
      });
    }

    
    if (hasResetAction) {
      nodes.push({
        id: '__RESET__',
        type: 'resetNode',
        data: {} as any,
        position: { x: 0, y: 0 }
      });
    }

    return nodes;
  }, [quest.states, hasEndAction, hasResetAction, onNavigateToState, handleDeleteState]);

  
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    
    quest.states.forEach((state) => {
      
      state.rules.forEach((rule, ruleIdx) => {
        const targetState = rule.gotoState;
        
        
        if (quest.states.some(s => s.name === targetState)) {
          
          const isConditional = rule.type !== 'Always';
          
          edges.push({
            id: `${state.name}-rule${ruleIdx}-${targetState}`,
            source: state.name,
            target: targetState,
            animated: !isConditional,
            label: rule.type,
            style: { 
              stroke: isConditional ? 'var(--accent-warning)' : 'var(--accent-success)', 
              strokeWidth: 2,
              strokeDasharray: isConditional ? '5,5' : '0'
            },
            labelStyle: {
              fill: 'var(--text-primary)',
              fontSize: 10,
              fontWeight: 500
            },
            labelBgStyle: {
              fill: 'var(--bg-secondary)',
              fillOpacity: 0.8
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isConditional ? 'var(--accent-warning)' : 'var(--accent-success)'
            }
          });
        }
      });
      
      
      state.actions.forEach((action, actionIdx) => {
        if ((action.type === 'SetState' || action.type === 'Goto') && action.params.length > 0) {
          const targetState = action.params[0] as string;
          if (quest.states.some(s => s.name === targetState)) {
            edges.push({
              id: `${state.name}-action${actionIdx}-${targetState}`,
              source: state.name,
              target: targetState,
              animated: action.type === 'Goto',
              label: action.type,
              style: { stroke: 'var(--accent-primary)', strokeWidth: 2 },
              labelStyle: {
                fill: 'var(--text-primary)',
                fontSize: 10,
                fontWeight: 500
              },
              labelBgStyle: {
                fill: 'var(--bg-secondary)',
                fillOpacity: 0.8
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: 'var(--accent-primary)'
              }
            });
          }
        } else if (action.type === 'End') {
          
          edges.push({
            id: `${state.name}-action${actionIdx}-end`,
            source: state.name,
            target: '__END__',
            animated: true,
            label: 'End',
            style: { stroke: 'var(--accent-danger)', strokeWidth: 3 },
            labelStyle: {
              fill: 'var(--text-primary)',
              fontSize: 10,
              fontWeight: 600
            },
            labelBgStyle: {
              fill: 'var(--bg-secondary)',
              fillOpacity: 0.8
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: 'var(--accent-danger)'
            }
          });
        } else if (action.type === 'Reset') {
          
          edges.push({
            id: `${state.name}-action${actionIdx}-reset`,
            source: state.name,
            target: '__RESET__',
            animated: true,
            label: 'Reset',
            style: { stroke: 'var(--accent-warning)', strokeWidth: 3 },
            labelStyle: {
              fill: 'var(--text-primary)',
              fontSize: 10,
              fontWeight: 600
            },
            labelBgStyle: {
              fill: 'var(--bg-secondary)',
              fillOpacity: 0.8
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: 'var(--accent-warning)'
            }
          });
        }
      });
    });

    return edges;
  }, [quest.states]);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(initialNodes, initialEdges),
    [initialNodes, initialEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  
  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
  }, []);

  
  useEffect(() => {
    if (highlightState && reactFlowInstance.current) {
      const node = reactFlowInstance.current.getNode(highlightState);
      if (node) {
        reactFlowInstance.current.fitView({
          nodes: [node],
          duration: 500,
          padding: 0.5,
          maxZoom: 1.5
        });
      }
    }
  }, [highlightState]);

  
  React.useEffect(() => {
    const { nodes: newLayoutedNodes, edges: newLayoutedEdges } = getLayoutedElements(initialNodes, initialEdges);
    setNodes(newLayoutedNodes);
    setEdges(newLayoutedEdges);
    
    
    setTimeout(() => {
      if (reactFlowInstance.current) {
        reactFlowInstance.current.fitView({
          padding: 0.2,
          duration: 300,
          maxZoom: 1.5
        });
      }
    }, 100);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    
    if (node.id === '__END__') return;
    
    const stateIndex = node.data.stateIndex as number;
    const state = quest.states[stateIndex];
    if (state) {
      console.log('Opening editor for state:', state.name);
      setEditingState({ state, index: stateIndex });
    }
  }, [quest.states]);

  const handleStateUpdate = useCallback((stateIndex: number, updates: Partial<QuestState>, nameChanged: boolean, oldName: string) => {
    const newStates = [...quest.states];
    
    
    newStates[stateIndex] = {
      ...newStates[stateIndex],
      ...updates
    };
    
    
    if (nameChanged && updates.name) {
      const newName = updates.name;
      
      
      newStates.forEach((state, idx) => {
        const updatedRules = state.rules.map(rule => {
          if (rule.gotoState === oldName) {
            
            const paramsStr = rule.params.map(p => 
              typeof p === 'string' ? `"${p}"` : p
            ).join(', ');
            const rawText = `${rule.type}(${paramsStr}) goto ${newName}`;
            return { ...rule, gotoState: newName, rawText };
          }
          return rule;
        });
        
        
        const updatedActions = state.actions.map(action => {
          if ((action.type === 'SetState' || action.type === 'Goto') && 
              action.params.length > 0 && 
              action.params[0] === oldName) {
            const newParams = [...action.params];
            newParams[0] = newName;
            
            const paramsStr = newParams.map(p => 
              typeof p === 'string' ? `"${p}"` : p
            ).join(', ');
            const rawText = `${action.type}(${paramsStr})`;
            return { ...action, params: newParams, rawText };
          }
          return action;
        });
        
        newStates[idx] = {
          ...newStates[idx],
          rules: updatedRules,
          actions: updatedActions
        };
      });
    }
    
    onQuestChange({ states: newStates });
  }, [quest.states, onQuestChange]);

  const handleAddState = useCallback(() => {
    
    const existingStateNames = quest.states.map(s => s.name);
    let newStateName = 'NewState';
    let counter = 1;
    while (existingStateNames.includes(newStateName)) {
      newStateName = `NewState${counter}`;
      counter++;
    }

    
    const newState: QuestState = {
      name: newStateName,
      description: '',
      actions: [],
      rules: []
    };

    
    onQuestChange({
      states: [...quest.states, newState]
    });
  }, [quest.states, onQuestChange]);

  const handleCreateState = useCallback((stateName: string) => {
    
    const newState: QuestState = {
      name: stateName,
      description: '',
      actions: [],
      rules: []
    };

    
    onQuestChange({
      states: [...quest.states, newState]
    });
  }, [quest.states, onQuestChange]);

  const handleExportPNG = useCallback(() => {
    if (nodes.length === 0) return;

    
    const nodesBounds = nodes.reduce(
      (bounds, node) => ({
        x: Math.min(bounds.x, node.position.x),
        y: Math.min(bounds.y, node.position.y),
        x2: Math.max(bounds.x2, node.position.x + (node.width || 260)),
        y2: Math.max(bounds.y2, node.position.y + (node.height || 200)),
      }),
      { x: Infinity, y: Infinity, x2: -Infinity, y2: -Infinity }
    );

    const contentWidth = nodesBounds.x2 - nodesBounds.x;
    const contentHeight = nodesBounds.y2 - nodesBounds.y;
    const padding = 100;
    const exportWidth = contentWidth + padding * 2;
    const exportHeight = contentHeight + padding * 2;

    
    const currentViewport = reactFlowInstance.current?.getViewport();

    
    if (reactFlowInstance.current) {
      reactFlowInstance.current.setViewport({
        x: -nodesBounds.x + padding,
        y: -nodesBounds.y + padding,
        zoom: 1
      });
    }

    
    setTimeout(() => {
      
      const reactFlowWrapper = document.querySelector('.react-flow') as HTMLElement;
      if (!reactFlowWrapper) return;

      
      const rootStyle = getComputedStyle(document.documentElement);
      const bgColor = rootStyle.getPropertyValue('--bg-secondary').trim() || '#252526';

      
      
      const svgElements = reactFlowWrapper.querySelectorAll('svg path, svg line, svg polyline, svg marker path');
      const originalStyles: { element: Element; stroke: string; fill: string; markerEnd: string }[] = [];
      
      svgElements.forEach((el) => {
        const element = el as SVGElement;
        const computedStyle = getComputedStyle(element);
        const stroke = computedStyle.stroke;
        const fill = computedStyle.fill;
        
        
        originalStyles.push({
          element: el,
          stroke: element.style.stroke,
          fill: element.style.fill,
          markerEnd: element.style.markerEnd || ''
        });
        
        
        if (stroke && stroke !== 'none') {
          element.style.stroke = stroke;
        }
        if (fill && fill !== 'none') {
          element.style.fill = fill;
        }
      });

      
      const markers = reactFlowWrapper.querySelectorAll('marker');
      const markerOriginalStyles: { element: Element; fill: string; stroke: string }[] = [];
      markers.forEach((marker) => {
        const path = marker.querySelector('path, polyline');
        if (path) {
          const pathEl = path as SVGElement;
          const computedStyle = getComputedStyle(pathEl);
          markerOriginalStyles.push({
            element: path,
            fill: pathEl.style.fill,
            stroke: pathEl.style.stroke
          });
          
          if (computedStyle.fill && computedStyle.fill !== 'none') {
            pathEl.style.fill = computedStyle.fill;
          }
          if (computedStyle.stroke && computedStyle.stroke !== 'none') {
            pathEl.style.stroke = computedStyle.stroke;
          }
        }
      });

      
      const edgeLabels = reactFlowWrapper.querySelectorAll('.react-flow__edge-textwrapper, .react-flow__edge-text, .react-flow__edgelabel-renderer');
      const labelOriginalStyles: { element: HTMLElement; bg: string; color: string; fill: string }[] = [];
      edgeLabels.forEach((label) => {
        const el = label as HTMLElement;
        const computedStyle = getComputedStyle(el);
        labelOriginalStyles.push({
          element: el,
          bg: el.style.background || el.style.backgroundColor,
          color: el.style.color,
          fill: el.style.fill
        });
        
        if (computedStyle.backgroundColor) {
          el.style.backgroundColor = computedStyle.backgroundColor;
        }
        if (computedStyle.color) {
          el.style.color = computedStyle.color;
        }
        if (computedStyle.fill) {
          el.style.fill = computedStyle.fill;
        }
      });

      
      const svgTexts = reactFlowWrapper.querySelectorAll('svg text, svg tspan');
      const textOriginalStyles: { element: SVGElement; fill: string }[] = [];
      svgTexts.forEach((text) => {
        const el = text as SVGElement;
        const computedStyle = getComputedStyle(el);
        textOriginalStyles.push({
          element: el,
          fill: el.style.fill
        });
        if (computedStyle.fill) {
          el.style.fill = computedStyle.fill;
        }
      });

      
      const svgRects = reactFlowWrapper.querySelectorAll('svg rect');
      const rectOriginalStyles: { element: SVGElement; fill: string; fillOpacity: string }[] = [];
      svgRects.forEach((rect) => {
        const el = rect as SVGElement;
        const computedStyle = getComputedStyle(el);
        rectOriginalStyles.push({
          element: el,
          fill: el.style.fill,
          fillOpacity: el.style.fillOpacity
        });
        if (computedStyle.fill) {
          el.style.fill = computedStyle.fill;
        }
        if (computedStyle.fillOpacity) {
          el.style.fillOpacity = computedStyle.fillOpacity;
        }
      });

      
      reactFlowWrapper.classList.add('export-mode');
      
      
      const style = document.createElement('style');
      style.id = 'export-style';
      style.textContent = `
        .export-mode, .export-mode * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
          overflow: visible !important;
        }
        .export-mode::-webkit-scrollbar,
        .export-mode *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
        }
        .export-mode .react-flow__node > div {
          overflow: visible !important;
          max-height: none !important;
        }
      `;
      document.head.appendChild(style);

      toPng(reactFlowWrapper, {
        backgroundColor: bgColor,
        width: exportWidth,
        height: exportHeight,
        style: {
          width: `${exportWidth}px`,
          height: `${exportHeight}px`,
        },
        filter: (node) => {
          
          if (node.classList) {
            if (node.classList.contains('react-flow__panel') ||
                node.classList.contains('react-flow__controls') ||
                node.classList.contains('react-flow__minimap') ||
                node.classList.contains('react-flow__background')) {
              return false;
            }
          }
          return true;
        },
        pixelRatio: 2, 
      }).then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${quest.questName || 'quest'}-diagram.png`;
        link.href = dataUrl;
        link.click();

        
        originalStyles.forEach(({ element, stroke, fill, markerEnd }) => {
          const el = element as SVGElement;
          el.style.stroke = stroke;
          el.style.fill = fill;
          el.style.markerEnd = markerEnd;
        });
        markerOriginalStyles.forEach(({ element, fill, stroke }) => {
          const el = element as SVGElement;
          el.style.fill = fill;
          el.style.stroke = stroke;
        });
        labelOriginalStyles.forEach(({ element, bg, color, fill }) => {
          element.style.background = bg;
          element.style.backgroundColor = bg;
          element.style.color = color;
          element.style.fill = fill;
        });
        textOriginalStyles.forEach(({ element, fill }) => {
          element.style.fill = fill;
        });
        rectOriginalStyles.forEach(({ element, fill, fillOpacity }) => {
          element.style.fill = fill;
          element.style.fillOpacity = fillOpacity;
        });
        
        reactFlowWrapper.classList.remove('export-mode');
        document.getElementById('export-style')?.remove();

        
        if (currentViewport && reactFlowInstance.current) {
          reactFlowInstance.current.setViewport(currentViewport);
        }
      }).catch((error) => {
        console.error('Failed to export PNG:', error);
        
        
        originalStyles.forEach(({ element, stroke, fill, markerEnd }) => {
          const el = element as SVGElement;
          el.style.stroke = stroke;
          el.style.fill = fill;
          el.style.markerEnd = markerEnd;
        });
        markerOriginalStyles.forEach(({ element, fill, stroke }) => {
          const el = element as SVGElement;
          el.style.fill = fill;
          el.style.stroke = stroke;
        });
        labelOriginalStyles.forEach(({ element, bg, color, fill }) => {
          element.style.background = bg;
          element.style.backgroundColor = bg;
          element.style.color = color;
          element.style.fill = fill;
        });
        textOriginalStyles.forEach(({ element, fill }) => {
          element.style.fill = fill;
        });
        rectOriginalStyles.forEach(({ element, fill, fillOpacity }) => {
          element.style.fill = fill;
          element.style.fillOpacity = fillOpacity;
        });
        
        reactFlowWrapper.classList.remove('export-mode');
        document.getElementById('export-style')?.remove();
        
        
        if (currentViewport && reactFlowInstance.current) {
          reactFlowInstance.current.setViewport(currentViewport);
        }
      });
    }, 150);
  }, [nodes, quest.questName]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Action Buttons */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        zIndex: 10,
        display: 'flex',
        gap: '8px'
      }}>
        <button
          onClick={handleExportPNG}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--accent-success)',
            color: 'var(--text-primary)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          📷 Export PNG
        </button>
        <button
          onClick={handleAddState}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--text-primary)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span style={{ fontSize: '16px' }}>+</span>
          Add State
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onInit={onInit}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="var(--border-secondary)" />
      </ReactFlow>

      {/* State Editor Modal */}
      {editingState && (
        <StateNodeEditor
          state={editingState.state}
          stateIndex={editingState.index}
          originalStateName={editingState.state.name}
          allStates={quest.states}
          onClose={() => setEditingState(null)}
          onSave={(updates, nameChanged, oldName) => handleStateUpdate(editingState.index, updates, nameChanged, oldName)}
          onCreateState={handleCreateState}
        />
      )}
    </div>
  );
}

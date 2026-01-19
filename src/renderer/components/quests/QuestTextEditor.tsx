import React, { useEffect, useRef, useState } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { QuestData, EQFParser } from '../../../eqf-parser';
import { registerEQFLanguage, EQF_LANGUAGE_ID } from '../../utils/eqfLanguage';

interface QuestTextEditorProps {
  quest: QuestData;
  onSave: (updates: Partial<QuestData>) => void;
  navigateToState?: string | null;
}

export default function QuestTextEditor({ quest, onSave, navigateToState }: QuestTextEditorProps) {
  const [eqfText, setEqfText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<any>(null);

  // Initialize EQF text from quest data
  useEffect(() => {
    try {
      const text = EQFParser.serialize(quest);
      setEqfText(text);
      setHasChanges(false);
      setError(null);
    } catch (err) {
      setError(`Failed to serialize quest: ${err}`);
    }
  }, [quest.id]); // Only update when quest ID changes

  // Navigate to a specific state when requested
  useEffect(() => {
    console.log('[QuestTextEditor] Navigation effect triggered', {
      navigateToState,
      hasEditor: !!editorRef.current,
      hasText: !!eqfText,
      textLength: eqfText.length
    });
    
    if (navigateToState && editorRef.current && eqfText) {
      console.log('[QuestTextEditor] Attempting to navigate to state:', navigateToState);
      const lines = eqfText.split('\n');
      // Match "State StateName" (brace is on next line in EQF format)
      const statePattern = new RegExp(`^State\\s+${navigateToState}\\s*$`, 'i');
      console.log('[QuestTextEditor] Pattern:', statePattern.toString());
      
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (statePattern.test(trimmed)) {
          const lineNumber = i + 1;
          console.log('[QuestTextEditor] Found state at line:', lineNumber, 'Content:', trimmed);
          editorRef.current.revealLineInCenter(lineNumber);
          editorRef.current.setPosition({ lineNumber, column: 1 });
          editorRef.current.focus();
          
          // Highlight the line temporarily
          if (monacoRef.current) {
            const decorations = editorRef.current.deltaDecorations([], [
              {
                range: new monacoRef.current.Range(lineNumber, 1, lineNumber, 1),
                options: {
                  isWholeLine: true,
                  className: 'highlighted-line',
                  glyphMarginClassName: 'highlighted-line-glyph'
                }
              }
            ]);
            
            console.log('[QuestTextEditor] Applied decorations:', decorations);
            
            // Remove highlight after 2 seconds
            setTimeout(() => {
              if (editorRef.current) {
                console.log('[QuestTextEditor] Removing decorations');
                editorRef.current.deltaDecorations(decorations, []);
              }
            }, 2000);
          } else {
            console.warn('[QuestTextEditor] Monaco ref not available for decorations');
          }
          
          break;
        }
      }
    }
  }, [navigateToState, eqfText]);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Register EQF language
    registerEQFLanguage(monaco);
    
    // Set theme
    monaco.editor.setTheme('eqf-theme');

    // Add save shortcut (Ctrl+S / Cmd+S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    // Helper function to navigate to a state
    const navigateToStateInEditor = (stateName: string) => {
      console.log('[QuestTextEditor] Navigating to state in editor:', stateName);
      const text = editor.getValue();
      const lines = text.split('\n');
      // Match "State StateName" (brace is on next line in EQF format)
      const statePattern = new RegExp(`^State\\s+${stateName}\\s*$`, 'i');
      
      console.log('[QuestTextEditor] Searching through', lines.length, 'lines');
      console.log('[QuestTextEditor] Pattern:', statePattern.toString());
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        // Log lines that start with "State"
        if (trimmed.toLowerCase().startsWith('state')) {
          console.log('[QuestTextEditor] Found State line at', i + 1, ':', trimmed);
        }
        
        if (statePattern.test(trimmed)) {
          const lineNumber = i + 1;
          console.log('[QuestTextEditor] MATCH! Found state at line:', lineNumber);
          editor.revealLineInCenter(lineNumber);
          editor.setPosition({ lineNumber, column: 1 });
          editor.focus();
          
          // Highlight the line
          const decorations = editor.deltaDecorations([], [
            {
              range: new monaco.Range(lineNumber, 1, lineNumber, 1),
              options: {
                isWholeLine: true,
                className: 'highlighted-line',
                glyphMarginClassName: 'highlighted-line-glyph'
              }
            }
          ]);
          
          setTimeout(() => {
            editor.deltaDecorations(decorations, []);
          }, 2000);
          
          return true;
        }
      }
      console.warn('[QuestTextEditor] State not found:', stateName);
      console.log('[QuestTextEditor] All State lines found:', 
        lines.map((l, i) => ({ line: i + 1, text: l.trim() }))
          .filter(l => l.text.toLowerCase().startsWith('state'))
      );
      return false;
    };

    // Handle Ctrl/Cmd+Click on goto statements
    editor.onMouseDown((e: any) => {
      // Check if Ctrl/Cmd key is pressed
      if (!e.event.ctrlKey && !e.event.metaKey) return;
      
      const position = e.target.position;
      if (!position) return;

      const model = editor.getModel();
      if (!model) return;

      const line = model.getLineContent(position.lineNumber);
      const column = position.column;

      // Check if we clicked on a goto statement
      const gotoPattern = /\bgoto\s+(\w+)/gi;
      let match;
      
      while ((match = gotoPattern.exec(line)) !== null) {
        const stateName = match[1];
        const startCol = match.index + match[0].indexOf(stateName) + 1;
        const endCol = startCol + stateName.length;
        
        // Check if click is within the state name
        if (column >= startCol && column <= endCol) {
          console.log('[QuestTextEditor] Ctrl/Cmd+Click on goto:', stateName);
          e.event.preventDefault();
          e.event.stopPropagation();
          navigateToStateInEditor(stateName);
          return;
        }
      }
    });

    // Add visual indication for goto statements (make them look like links)
    const updateGotoDecorations = () => {
      const model = editor.getModel();
      if (!model) return;

      const decorations: any[] = [];
      const text = model.getValue();
      const lines = text.split('\n');
      const gotoPattern = /\bgoto\s+(\w+)/gi;

      lines.forEach((line: string, lineIndex: number) => {
        let match;
        while ((match = gotoPattern.exec(line)) !== null) {
          const stateName = match[1];
          const startColumn = match.index + match[0].indexOf(stateName) + 1;
          const endColumn = startColumn + stateName.length;
          
          decorations.push({
            range: new monaco.Range(lineIndex + 1, startColumn, lineIndex + 1, endColumn),
            options: {
              inlineClassName: 'goto-link',
              hoverMessage: { value: `**${stateName}** - Ctrl/Cmd+Click to navigate` }
            }
          });
        }
        gotoPattern.lastIndex = 0;
      });

      editor.deltaDecorations([], decorations);
    };

    // Update decorations on content change
    updateGotoDecorations();
    editor.onDidChangeModelContent(() => {
      updateGotoDecorations();
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEqfText(value);
      setHasChanges(true);
      setError(null);
    }
  };

  const handleSave = () => {
    if (!hasChanges) return;

    try {
      // Parse the text to validate and convert to QuestData
      const parsedQuest = EQFParser.parse(eqfText, quest.id);
      
      // Save updates
      onSave(parsedQuest);
      setHasChanges(false);
      setError(null);
    } catch (err) {
      setError(`Parse error: ${err}`);
    }
  };

  const handleRevert = () => {
    try {
      const text = EQFParser.serialize(quest);
      setEqfText(text);
      setHasChanges(false);
      setError(null);
    } catch (err) {
      setError(`Failed to revert: ${err}`);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      backgroundColor: 'var(--bg-primary)'
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-primary)'
      }}>
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          style={{
            padding: '6px 16px',
            backgroundColor: hasChanges ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
            color: hasChanges ? 'var(--text-primary)' : 'var(--text-disabled)',
            border: 'none',
            borderRadius: '4px',
            cursor: hasChanges ? 'pointer' : 'not-allowed',
            fontSize: '13px',
            fontWeight: '500'
          }}
        >
          Save (Ctrl+S)
        </button>

        <button
          onClick={handleRevert}
          disabled={!hasChanges}
          style={{
            padding: '6px 16px',
            backgroundColor: hasChanges ? 'var(--border-primary)' : 'var(--bg-tertiary)',
            color: hasChanges ? 'var(--text-primary)' : 'var(--text-disabled)',
            border: 'none',
            borderRadius: '4px',
            cursor: hasChanges ? 'pointer' : 'not-allowed',
            fontSize: '13px'
          }}
        >
          Revert
        </button>

        {hasChanges && (
          <span style={{
            marginLeft: '8px',
            color: 'var(--accent-warning)',
            fontSize: '12px'
          }}>
            ● Unsaved changes
          </span>
        )}

        {error && (
          <span style={{
            marginLeft: '8px',
            color: 'var(--accent-danger)',
            fontSize: '12px'
          }}>
            ⚠ {error}
          </span>
        )}

        <div style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '12px' }}>
          Quest ID: {quest.id} | {quest.questName}
        </div>
      </div>

      {/* Monaco Editor */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Editor
          height="100%"
          language={EQF_LANGUAGE_ID}
          value={eqfText}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="eqf-theme"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            fontFamily: "'Cascadia Code', 'Fira Code', 'Monaco', 'Menlo', 'Courier New', monospace",
            fontLigatures: true,
            lineNumbers: 'on',
            rulers: [],
            wordWrap: 'off',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: false,
            detectIndentation: false,
            renderWhitespace: 'selection',
            bracketPairColorization: {
              enabled: true
            }
          }}
        />
      </div>
    </div>
  );
}

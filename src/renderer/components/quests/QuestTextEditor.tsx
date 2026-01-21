import React, { useEffect, useRef, useState, useCallback } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { QuestData, EQFParser } from '../../../eqf-parser';
import { registerEQFLanguage, EQF_LANGUAGE_ID } from '../../utils/eqfLanguage';
import { loadConfig, getDocumentation, ConfigData } from '../../services/configService';

interface QuestTextEditorProps {
  quest: QuestData;
  onSave: (updates: Partial<QuestData>) => void;
  navigateToState?: string | null;
  onNavigateToVisual?: (stateName: string) => void;
  theme?: 'dark' | 'light';
}

export default function QuestTextEditor({ quest, onSave, navigateToState, onNavigateToVisual, theme = 'dark' }: QuestTextEditorProps) {
  const [eqfText, setEqfText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [config, setConfig] = useState<ConfigData | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<any>(null);
  const hoverProvidersRef = useRef<any[]>([]);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load config on mount
  useEffect(() => {
    loadConfig().then(setConfig);
  }, []);

  // Initialize EQF text from quest data
  useEffect(() => {
    // Cancel any pending auto-save when quest changes externally
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    
    // Only update if there are no unsaved local changes
    if (!hasChanges) {
      try {
        const text = EQFParser.serialize(quest);
        setEqfText(text);
        setError(null);
      } catch (err) {
        setError(`Failed to serialize quest: ${err}`);
      }
    } else {
      // If we had changes but quest changed externally, discard local changes
      setHasChanges(false);
      try {
        const text = EQFParser.serialize(quest);
        setEqfText(text);
        setError(null);
      } catch (err) {
        setError(`Failed to serialize quest: ${err}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quest]);

  // Save function
  const handleSave = useCallback(() => {
    if (!hasChanges) return;

    try {
      const parsedQuest = EQFParser.parse(eqfText, quest.id);
      onSave(parsedQuest);
      setHasChanges(false);
      setError(null);
    } catch (err) {
      setError(`Parse error: ${err}`);
    }
  }, [hasChanges, eqfText, quest.id, onSave]);

  // Auto-save text changes after user stops typing
  useEffect(() => {
    if (hasChanges) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave();
      }, 1000);
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [hasChanges, eqfText, handleSave]);

  // Navigate to a specific state when requested
  useEffect(() => {
    if (navigateToState && editorRef.current && eqfText) {
      const lines = eqfText.split('\n');
      const statePattern = new RegExp(`^State\\s+${navigateToState}\\s*$`, 'i');
      
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (statePattern.test(trimmed)) {
          const lineNumber = i + 1;
          editorRef.current.revealLineInCenter(lineNumber);
          editorRef.current.setPosition({ lineNumber, column: 1 });
          editorRef.current.focus();
          
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
            
            setTimeout(() => {
              if (editorRef.current) {
                editorRef.current.deltaDecorations(decorations, []);
              }
            }, 2000);
          }
          
          break;
        }
      }
    }
  }, [navigateToState, eqfText]);

  // Update Monaco theme when app theme changes
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(theme === 'light' ? 'eqf-light' : 'eqf-dark');
    }
  }, [theme]);

  // Cleanup hover providers on unmount
  useEffect(() => {
    return () => {
      hoverProvidersRef.current.forEach(disposable => {
        if (disposable && disposable.dispose) {
          disposable.dispose();
        }
      });
      hoverProvidersRef.current = [];
    };
  }, []);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Clean up any previously registered hover providers
    hoverProvidersRef.current.forEach(disposable => {
      if (disposable && disposable.dispose) {
        disposable.dispose();
      }
    });
    hoverProvidersRef.current = [];
    
    // Register EQF language with config-based keywords
    registerEQFLanguage(monaco, config);
    
    // Set theme based on app theme
    monaco.editor.setTheme(theme === 'light' ? 'eqf-light' : 'eqf-dark');

    // Register hover provider for action and rule documentation
    const docsHoverProvider = monaco.languages.registerHoverProvider(EQF_LANGUAGE_ID, {
      provideHover: (model, position) => {
        if (!config) return null;
        
        const word = model.getWordAtPosition(position);
        if (!word) return null;
        
        const wordText = word.word;
        const docs = getDocumentation(config, wordText);
        
        if (docs) {
          return {
            range: new monaco.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn
            ),
            contents: [
              { value: `**${wordText}**` },
              { value: docs.signature },
              { value: docs.description }
            ]
          };
        }
        
        return null;
      }
    });
    hoverProvidersRef.current.push(docsHoverProvider);

    // Add save shortcut (Ctrl+S / Cmd+S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    // Helper function to navigate to a state
    const navigateToStateInEditor = (stateName: string) => {
      const text = editor.getValue();
      const lines = text.split('\n');
      const statePattern = new RegExp(`^State\\s+${stateName}\\s*$`, 'i');
      
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        
        if (statePattern.test(trimmed)) {
          const lineNumber = i + 1;
          editor.revealLineInCenter(lineNumber);
          editor.setPosition({ lineNumber, column: 1 });
          editor.focus();
          
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
      return false;
    };

    // Handle Ctrl/Cmd+Click on goto statements
    editor.onMouseDown((e: any) => {
      if (!e.event.ctrlKey && !e.event.metaKey) return;
      
      const position = e.target.position;
      if (!position) return;

      const model = editor.getModel();
      if (!model) return;

      const line = model.getLineContent(position.lineNumber);
      const column = position.column;

      const gotoPattern = /\bgoto\s+(\w+)/gi;
      let match;
      
      while ((match = gotoPattern.exec(line)) !== null) {
        const stateName = match[1];
        const startCol = match.index + match[0].indexOf(stateName) + 1;
        const endCol = startCol + stateName.length;
        
        if (column >= startCol && column <= endCol) {
          e.event.preventDefault();
          e.event.stopPropagation();
          navigateToStateInEditor(stateName);
          return;
        }
      }
    });

    // Add visual indication for goto statements
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
      {/* Monaco Editor */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Editor
          height="100%"
          language={EQF_LANGUAGE_ID}
          value={eqfText}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme={theme === 'light' ? 'eqf-light' : 'eqf-dark'}
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

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
  const lastQuestIdRef = useRef<number | null>(null);
  const lastSerializedTextRef = useRef<string>('');
  const handleSaveRef = useRef<() => void>(() => {});
  const isOwnSaveRef = useRef(false);
  const gotoDecorationsRef = useRef<string[]>([]);

  
  useEffect(() => {
    loadConfig().then(setConfig);
  }, []);

  useEffect(() => {
    if (isOwnSaveRef.current) {
      isOwnSaveRef.current = false;
      return;
    }
    const isNewQuest = quest.id !== lastQuestIdRef.current;
    if (isNewQuest && autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    try {
      const serializedText = EQFParser.serialize(quest);
      const textChanged = serializedText !== lastSerializedTextRef.current;
      if (isNewQuest || (textChanged && !hasChanges)) {
        
        const cursorPosition = editorRef.current?.getPosition();
        const scrollTop = editorRef.current?.getScrollTop();
        
        lastQuestIdRef.current = quest.id;
        lastSerializedTextRef.current = serializedText;
        setEqfText(serializedText);
        setError(null);
        setHasChanges(false);
        if (cursorPosition && !isNewQuest) {
          setTimeout(() => {
            if (editorRef.current) {
              editorRef.current.setPosition(cursorPosition);
              if (scrollTop !== undefined) {
                editorRef.current.setScrollTop(scrollTop);
              }
            }
          }, 0);
        }
      }
    } catch (err) {
      setError(`Failed to serialize quest: ${err}`);
    }
  }, [quest, hasChanges]);

  
  const handleSave = useCallback(() => {
    if (!hasChanges) return;
    try {
      const parsedQuest = EQFParser.parse(eqfText, quest.id);
      lastSerializedTextRef.current = EQFParser.serialize(parsedQuest);
      isOwnSaveRef.current = true;
      onSave(parsedQuest);
      setHasChanges(false);
      setError(null);
    } catch (err) {
      setError(`Parse error: ${err}`);
    }
  }, [hasChanges, eqfText, quest.id, onSave]);

  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  useEffect(() => {
    if (hasChanges) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave();
      }, 1500); 
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [hasChanges, eqfText, handleSave]);

  
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

  
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(theme === 'light' ? 'eqf-light' : 'eqf-dark');
    }
  }, [theme]);

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
    
    
    hoverProvidersRef.current.forEach(disposable => {
      if (disposable && disposable.dispose) {
        disposable.dispose();
      }
    });
    hoverProvidersRef.current = [];
    registerEQFLanguage(monaco, config);
    monaco.editor.setTheme(theme === 'light' ? 'eqf-light' : 'eqf-dark');
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
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSaveRef.current();
    });
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

    
    editor.onMouseDown((e: any) => {
      if (!e.event.ctrlKey && !e.event.metaKey) return;
      
      const position = e.target.position;
      if (!position) return;

      const model = editor.getModel();
      if (!model) return;

      const line = model.getLineContent(position.lineNumber);
      const column = position.column;

      // Use [ \t]+ instead of \s+ to avoid matching across newlines
      const gotoPattern = /\bgoto[ \t]+(\w+)/gi;
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

    
    const updateGotoDecorations = () => {
      const model = editor.getModel();
      if (!model) return;

      const decorations: any[] = [];
      const text = model.getValue();
      const lines = text.split('\n');
      // Use [ \t]+ instead of \s+ to avoid matching across newlines
      const gotoPattern = /\bgoto[ \t]+(\w+)/gi;

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

      // Remove old decorations and add new ones
      gotoDecorationsRef.current = editor.deltaDecorations(gotoDecorationsRef.current, decorations);
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

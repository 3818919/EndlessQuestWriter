import React, { useEffect, useRef, useState, useCallback } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { QuestData, EQFParser } from '../../../eqf-parser';
import { registerEQFLanguage, EQF_LANGUAGE_ID } from '../../utils/eqfLanguage';

// EO+ Action and Rule documentation
function getEQFDocumentation(word: string): { signature: string; description: string } | null {
  const docs: Record<string, { signature: string; description: string }> = {
    // Actions
    AddNpcText: { signature: '`AddNpcText(npcQuestId, "message")`', description: 'Displays dialog text from an NPC in the quest dialog window.' },
    AddNpcInput: { signature: '`AddNpcInput(npcQuestId, inputId, "message")`', description: 'Adds a clickable link option in the dialog window. Use with InputNpc() rule.' },
    AddNpcChat: { signature: '`AddNpcChat(npcQuestId, "message")`', description: 'Displays an NPC chat balloon (random chance) during the quest state.' },
    AddNpcPM: { signature: '`AddNpcPM("name", "message")`', description: 'Displays a private message in the dialog window with a custom name.' },
    GiveItem: { signature: '`GiveItem(itemId, amount)`', description: 'Rewards the player with an item added to their inventory.' },
    RemoveItem: { signature: '`RemoveItem(itemId, amount)`', description: 'Removes an item from the player\'s inventory.' },
    GiveExp: { signature: '`GiveExp(amount)`', description: 'Rewards the player with experience points.' },
    GiveBankItem: { signature: '`GiveBankItem(itemId, amount)`', description: 'Rewards the player with an item stored directly in their bank locker.' },
    RemoveBankItem: { signature: '`RemoveBankItem(itemId, amount)`', description: 'Removes an item from the player\'s bank locker.' },
    SetClass: { signature: '`SetClass(classId)`', description: 'Changes the player\'s class to the specified class ID.' },
    SetRace: { signature: '`SetRace(raceId)`', description: 'Changes the player\'s race to the specified race ID.' },
    SetState: { signature: '`SetState("stateName")`', description: 'Forces a state change without requiring rules to be satisfied.' },
    ShowHint: { signature: '`ShowHint("message")`', description: 'Displays a hint message in the client\'s information bar.' },
    PlaySound: { signature: '`PlaySound(soundId)`', description: 'Plays a sound effect for the player.' },
    PlayEffect: { signature: '`PlayEffect(effectId)`', description: 'Plays a special effect on the player.' },
    PlayMusic: { signature: '`PlayMusic(musicId)`', description: 'Plays a MIDI music file for the player.' },
    Reset: { signature: '`Reset()`', description: 'Resets the quest back to the Begin state, allowing it to be repeated.' },
    End: { signature: '`End()`', description: 'Ends the quest permanently. The quest will display in the player\'s quest history as completed.' },
    SetCoord: { signature: '`SetCoord(mapId, x, y)`', description: 'Teleports the player to the specified map coordinates.' },
    SetMap: { signature: '`SetMap(mapId, x, y)`', description: 'Moves the player to the specified map and coordinates.' },
    Quake: { signature: '`Quake(magnitude)` or `Quake(magnitude, mapId)`', description: 'Creates an earthquake effect on the specified map or the player\'s current map.' },
    QuakeWorld: { signature: '`QuakeWorld(magnitude)`', description: 'Creates an earthquake effect on all maps.' },
    SetHome: { signature: '`SetHome(home)`', description: 'Sets the player\'s home town.' },
    SetTitle: { signature: '`SetTitle(title)`', description: 'Sets the player\'s title.' },
    GiveKarma: { signature: '`GiveKarma(amount)`', description: 'Awards karma points to the player.' },
    RemoveKarma: { signature: '`RemoveKarma(amount)`', description: 'Removes karma points from the player.' },
    AddKillNpc: { signature: '`AddKillNpc(npcId)`', description: 'Adds an NPC to the kill count tracker for the quest.' },
    RemoveKillNpc: { signature: '`RemoveKillNpc(npcId)`', description: 'Removes an NPC from the kill count tracker.' },
    ResetKillNpc: { signature: '`ResetKillNpc(npcId)`', description: 'Resets the kill count for a specific NPC.' },
    StartQuest: { signature: '`StartQuest(questId)`', description: 'Starts another quest if not already active.' },
    ResetQuest: { signature: '`ResetQuest(questId)`', description: 'Resets the specified quest.' },
    
    // Rules
    Always: { signature: '`Always()`', description: 'Rule always satisfied - immediately advances to next state with no requirements.' },
    TalkedToNpc: { signature: '`TalkedToNpc(npcQuestId)`', description: 'Satisfied when the player opens a dialog with the specified NPC.' },
    InputNpc: { signature: '`InputNpc(inputId)`', description: 'Satisfied when the player clicks a dialog link with the specified input ID. Use with AddNpcInput().' },
    KilledNpcs: { signature: '`KilledNpcs(npcId, amount)`', description: 'Satisfied when the player has killed the specified amount of NPCs.' },
    KilledPlayers: { signature: '`KilledPlayers(amount)`', description: 'Satisfied when the player has killed the specified amount of players in PK zones.' },
    GotItems: { signature: '`GotItems(itemId, amount)`', description: 'Satisfied when the player has the specified amount of items in their inventory.' },
    LostItems: { signature: '`LostItems(itemId, amount)`', description: 'Returns to previous state if player loses required items. Use after GotItems() to verify they still have items.' },
    EnterCoord: { signature: '`EnterCoord(mapId, x, y)`', description: 'Satisfied when the player stands on the specified map coordinates.' },
    LeaveCoord: { signature: '`LeaveCoord(mapId, x, y)`', description: 'Satisfied when the player leaves the specified map coordinates.' },
    EnterMap: { signature: '`EnterMap(mapId)`', description: 'Satisfied when the player enters the specified map.' },
    LeaveMap: { signature: '`LeaveMap(mapId)`', description: 'Satisfied when the player leaves the specified map.' },
    EnterArea: { signature: '`EnterArea(mapId, x, y, radius)`', description: 'Satisfied when the player enters a circular area around the specified coordinates.' },
    LeaveArea: { signature: '`LeaveArea(mapId, x, y, radius)`', description: 'Satisfied when the player leaves a circular area around the specified coordinates.' },
    IsClass: { signature: '`IsClass(classId)`', description: 'Satisfied if the player\'s class matches the specified class ID.' },
    IsRace: { signature: '`IsRace(raceId)`', description: 'Satisfied if the player\'s race matches the specified race ID.' },
    IsGender: { signature: '`IsGender(genderId)`', description: 'Satisfied if the player\'s gender matches the specified ID (0=male, 1=female).' },
    IsNamed: { signature: '`IsNamed(name)`', description: 'Satisfied if the player\'s name matches the specified name.' },
    CitizenOf: { signature: '`CitizenOf(homeName)`', description: 'Satisfied if the player is a citizen of the specified home town.' },
    GotSpell: { signature: '`GotSpell(spellId)`', description: 'Satisfied when the player has learned the specified spell.' },
    LostSpell: { signature: '`LostSpell(spellId)`', description: 'Returns to previous state if player forgets the required spell.' },
    UsedItem: { signature: '`UsedItem(itemId, amount)`', description: 'Satisfied when the player has used the specified item the required number of times.' },
    UsedSpell: { signature: '`UsedSpell(spellId, amount)`', description: 'Satisfied when the player has cast the specified spell the required number of times.' },
    IsWearing: { signature: '`IsWearing(itemId)`', description: 'Satisfied if the player has the specified item equipped.' },
    NotWearing: { signature: '`NotWearing(itemId)`', description: 'Satisfied if the player does NOT have the specified item equipped.' },
    Unequipped: { signature: '`Unequipped()`', description: 'Satisfied if the player has nothing equipped.' },
    Stepped: { signature: '`Stepped(amount)`', description: 'Satisfied when the player has taken the specified number of steps since entering the state.' },
    Die: { signature: '`Die()` or `Die(count)`', description: 'Satisfied when the player dies (optionally a specific number of times).' },
    TimeElapsed: { signature: '`TimeElapsed(time)`', description: 'Satisfied when the specified time has passed since entering the state. Format: number + h/m/s (e.g., "30m", "2h").' },
    WaitMinutes: { signature: '`WaitMinutes(minutes)`', description: 'Satisfied when the specified minutes have passed since entering the state.' },
    WaitSeconds: { signature: '`WaitSeconds(seconds)`', description: 'Satisfied when the specified seconds have passed since entering the state.' },
    FinishedQuest: { signature: '`FinishedQuest(questId)`', description: 'Satisfied if the player has completed the specified quest.' },
    Disconnected: { signature: '`Disconnected()`', description: 'Satisfied when the player disconnects (check occurs at next login).' },
  };
  
  return docs[word] || null;
}

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
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<any>(null);
  const hoverProvidersRef = useRef<any[]>([]);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize EQF text from quest data
  useEffect(() => {
    // Cancel any pending auto-save when quest changes externally
    // This ensures visual editor changes take priority
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    
    // Only update if there are no unsaved local changes
    // This allows changes from the visual editor to flow through while preserving text edits
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
      // and sync to the new quest state from visual editor
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
  }, [quest]); // Only run when quest changes from visual editor

  // Save function
  const handleSave = useCallback(() => {
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
  }, [hasChanges, eqfText, quest.id, onSave]);

  // Auto-save text changes after user stops typing
  useEffect(() => {
    if (hasChanges) {
      // Clear any existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      // Set a new timer to auto-save after 1 second of inactivity
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave();
      }, 1000);
    }
    
    // Cleanup timer on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [hasChanges, eqfText, handleSave]); // Trigger when changes occur

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

  // Update Monaco theme when app theme changes
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(theme === 'light' ? 'eqf-light' : 'eqf-dark');
    }
  }, [theme]);

  // Cleanup hover providers on unmount
  useEffect(() => {
    return () => {
      // Dispose all hover providers when component unmounts
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
    
    // Register EQF language
    registerEQFLanguage(monaco);
    
    // Set theme based on app theme
    monaco.editor.setTheme(theme === 'light' ? 'eqf-light' : 'eqf-dark');

    // Register hover provider for action and rule documentation
    const docsHoverProvider = monaco.languages.registerHoverProvider(EQF_LANGUAGE_ID, {
      provideHover: (model, position) => {
        const line = model.getLineContent(position.lineNumber);
        const word = model.getWordAtPosition(position);
        
        if (!word) return null;
        
        const wordText = word.word;
        
        // Check if word is an action or rule type
        const docs = getEQFDocumentation(wordText);
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
              { value: docs.description },
              { value: `[View EO+ Documentation](https://apollo-games.com/eoplus/)` }
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

import React, { useState } from 'react';
import ItemList from './components/ItemList';
import ItemEditor from './components/ItemEditor';
import CharacterPreview from './components/CharacterPreview';
import PaperdollSlots from './components/PaperdollSlots';
import AppearanceControls from './components/AppearanceControls';
import { useEIFData } from './hooks/useEIFData';
import { useGFXCache } from './hooks/useGFXCache';
import { useEquipment } from './hooks/useEquipment';
import { useAppearance } from './hooks/useAppearance';
import FaceIcon from '@mui/icons-material/Face';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SettingsIcon from '@mui/icons-material/Settings';

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

const App: React.FC = () => {
  const [gfxFolder, setGfxFolder] = useState(
    localStorage.getItem('gfxFolder') || ''
  );
  const [activeTab, setActiveTab] = useState('appearance');
  const [rightPanelWidth, setRightPanelWidth] = useState(
    parseInt(localStorage.getItem('rightPanelWidth') || '400')
  );
  const [isResizing, setIsResizing] = useState(false);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  const { 
    eifData, 
    currentFile, 
    selectedItemId, 
    setSelectedItemId,
    loadFile,
    saveFile,
    addItem,
    deleteItem,
    duplicateItem,
    updateItem
  } = useEIFData();

  const { loadGfx, saveDirHandle } = useGFXCache(gfxFolder);
  
  // Auto-load default files on mount
  React.useEffect(() => {
    const autoLoadDefaults = async () => {
      // Auto-load EIF file if not already loaded
      if (!currentFile && isElectron && window.electronAPI) {
        try {
          const defaultEifPath = 'data/pub/dat001.eif';
          const exists = await window.electronAPI.fileExists(defaultEifPath);
          if (exists) {
            console.log('Auto-loading default EIF file:', defaultEifPath);
            await loadFile(defaultEifPath);
          }
        } catch (error) {
          console.log('Could not auto-load default EIF file:', error);
        }
      }
      
      // Auto-select GFX folder if not already set
      const storedGfxFolder = localStorage.getItem('gfxFolder');
      if (!storedGfxFolder && isElectron && window.electronAPI) {
        try {
          const defaultGfxPath = 'data/gfx';
          const exists = await window.electronAPI.fileExists(defaultGfxPath);
          if (exists) {
            console.log('Auto-selecting default GFX folder:', defaultGfxPath);
            setGfxFolder(defaultGfxPath);
            localStorage.setItem('gfxFolder', defaultGfxPath);
          }
        } catch (error) {
          console.log('Could not auto-select default GFX folder:', error);
        }
      }
    };
    
    autoLoadDefaults();
  }, [currentFile, loadFile]); // Run when currentFile changes or on mount
  
  const selectGfxFolder = async () => {
    try {
      if (!isElectron) {
        // Browser: Use File System Access API
        if ('showDirectoryPicker' in window) {
          const dirHandle = await (window as any).showDirectoryPicker();
          
          // Save the handle to IndexedDB for persistence
          await saveDirHandle(dirHandle);
          
          const path = dirHandle.name;
          setGfxFolder(path);
          localStorage.setItem('gfxFolder', path);
          alert(`Selected folder: ${path}\n\nGFX graphics loading is now enabled! The folder will be remembered across sessions.`);
        } else {
          alert('Folder selection requires a modern browser (Chrome 86+, Edge 86+). For full functionality, use the Electron app: npm run dev');
        }
        return;
      }
      
      if (!window.electronAPI) {
        alert('Electron API not available');
        return;
      }
      
      const folder = await window.electronAPI.openDirectory();
      if (folder) {
        setGfxFolder(folder);
        localStorage.setItem('gfxFolder', folder);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        // User cancelled the picker
        return;
      }
      console.error('Error selecting GFX folder:', error);
      alert('Error selecting GFX folder: ' + error.message);
    }
  };
  
  const { 
    equippedItems, 
    equipItem, 
    unequipSlot,
    clearAll 
  } = useEquipment();
  
  const {
    gender,
    setGender,
    hairStyle,
    setHairStyle,
    hairColor,
    setHairColor,
    skinTone,
    setSkinTone,
    presets,
    savePreset,
    loadPreset,
    deletePreset
  } = useAppearance();
  
  // Handle resize
  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };
  
  React.useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 300 && newWidth <= 800) {
        setRightPanelWidth(newWidth);
        localStorage.setItem('rightPanelWidth', newWidth.toString());
      }
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const selectedItem = selectedItemId !== null ? eifData.items[selectedItemId] : null;

  return (
    <div className="app">
      <div className="main-content">
        <div className=\"left-panel\">
          <ItemList
            items={eifData.items}
            selectedItemId={selectedItemId}
            onSelectItem={setSelectedItemId}
            onAddItem={addItem}
            onDeleteItem={deleteItem}
            onDuplicateItem={duplicateItem}
            onLoadFile={loadFile}
            onSaveFile={saveFile}
            currentFile={currentFile}
            onSelectGfxFolder={selectGfxFolder}
            gfxFolder={gfxFolder}
            loadGfx={loadGfx}
            onEquipItem={equipItem}
            showSettingsModal={showSettingsModal}
            setShowSettingsModal={setShowSettingsModal}
          />
        </div>
        
        <div className="center-panel">
          {selectedItem && (
            <ItemEditor
              item={selectedItem}
              onUpdateItem={updateItem}
              loadGfx={loadGfx}
              gfxFolder={gfxFolder}
              onSetGfxFolder={setGfxFolder}
            />
          )}
        </div>
        
        <div 
          className={`right-panel ${isResizing ? 'resizing' : ''} ${isPanelMinimized ? 'minimized' : ''}`}
          style={{ width: isPanelMinimized ? '60px' : `${rightPanelWidth}px` }}
        >
          <div className="resize-handle" onMouseDown={handleMouseDown} />
          
          <div className="right-panel-content">
            {activeTab === 'appearance' && (
              <AppearanceControls
                gender={gender}
                setGender={setGender}
                hairStyle={hairStyle}
                setHairStyle={setHairStyle}
                hairColor={hairColor}
                setHairColor={setHairColor}
                skinTone={skinTone}
                setSkinTone={setSkinTone}
                gfxFolder={gfxFolder}
                loadGfx={loadGfx}
                presets={presets}
                onSavePreset={savePreset}
                onLoadPreset={loadPreset}
                onDeletePreset={deletePreset}
              />
            )}
            
            {activeTab === 'equipment' && (
              <PaperdollSlots
                equippedItems={equippedItems}
                onEquipItem={equipItem}
                onUnequipSlot={unequipSlot}
                onClearAll={clearAll}
                items={eifData.items}
                onAutoGenderSwitch={setGender}
                loadGfx={loadGfx}
                gfxFolder={gfxFolder}
              />
            )}
            
            {activeTab === 'preview' && (
              <CharacterPreview
                equippedItems={equippedItems}
                gender={gender}
                hairStyle={hairStyle}
                hairColor={hairColor}
                skinTone={skinTone}
                loadGfx={loadGfx}
                gfxFolder={gfxFolder}
                items={eifData.items}
              />
            )}
          </div>
          
          <div className="vertical-sidebar">
            <button
              className={`sidebar-button ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => {
                if (activeTab === 'appearance' && !isPanelMinimized) {
                  setIsPanelMinimized(true);
                } else {
                  setActiveTab('appearance');
                  setIsPanelMinimized(false);
                }
              }}
              title="Appearance"
            >
              <FaceIcon />
              <span className="sidebar-label">Appearance</span>
            </button>
            <button
              className={`sidebar-button ${activeTab === 'equipment' ? 'active' : ''}`}
              onClick={() => {
                if (activeTab === 'equipment' && !isPanelMinimized) {
                  setIsPanelMinimized(true);
                } else {
                  setActiveTab('equipment');
                  setIsPanelMinimized(false);
                }
              }}
              title="Equipment"
            >
              <CheckroomIcon />
              <span className="sidebar-label">Equipment</span>
            </button>
            <button
              className={`sidebar-button ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => {
                if (activeTab === 'preview' && !isPanelMinimized) {
                  setIsPanelMinimized(true);
                } else {
                  setActiveTab('preview');
                  setIsPanelMinimized(false);
                }
              }}
              title="Preview"
            >
              <VisibilityIcon />
              <span className="sidebar-label">Preview</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

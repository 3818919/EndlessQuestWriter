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
        <div className="left-panel">
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
          className={`right-panel ${isResizing ? 'resizing' : ''}`}
          style={{ width: `${rightPanelWidth}px` }}
        >
          <div className="resize-handle" onMouseDown={handleMouseDown} />
          
          <div className="right-panel-tabs">
            <button
              className={`tab ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              Appearance
            </button>
            <button
              className={`tab ${activeTab === 'equipment' ? 'active' : ''}`}
              onClick={() => setActiveTab('equipment')}
            >
              Equipment
            </button>
            <button
              className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              Character Preview
            </button>
          </div>
          
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
        </div>
      </div>
    </div>
  );
}

export default App;

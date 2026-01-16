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

function App() {
  const [gfxFolder, setGfxFolder] = useState(
    localStorage.getItem('gfxFolder') || ''
  );
  
  const selectGfxFolder = async () => {
    try {
      const folder = await window.electronAPI.openDirectory();
      if (folder) {
        setGfxFolder(folder);
        localStorage.setItem('gfxFolder', folder);
      }
    } catch (error) {
      console.error('Error selecting GFX folder:', error);
      alert('Error selecting GFX folder: ' + error.message);
    }
  };
  
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

  const { gfxCache, loadGfx } = useGFXCache(gfxFolder);
  
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
          />
        </div>
        
        <div className="center-panel">
          {selectedItem && (
            <ItemEditor
              item={selectedItem}
              onUpdateItem={updateItem}
              gfxCache={gfxCache}
              loadGfx={loadGfx}
              gfxFolder={gfxFolder}
              onSetGfxFolder={setGfxFolder}
            />
          )}
        </div>
        
        <div className="right-panel">
          <div className="paperdoll-section">
            <h3>Character Paperdoll</h3>
            
            <AppearanceControls
              gender={gender}
              setGender={setGender}
              hairStyle={hairStyle}
              setHairStyle={setHairStyle}
              hairColor={hairColor}
              setHairColor={setHairColor}
              skinTone={skinTone}
              setSkinTone={setSkinTone}
              presets={presets}
              onSavePreset={savePreset}
              onLoadPreset={loadPreset}
              onDeletePreset={deletePreset}
            />
            
            <PaperdollSlots
              equippedItems={equippedItems}
              onEquipItem={equipItem}
              onUnequipSlot={unequipSlot}
              onClearAll={clearAll}
              items={eifData.items}
              onAutoGenderSwitch={setGender}
            />
            
            <CharacterPreview
              equippedItems={equippedItems}
              gender={gender}
              hairStyle={hairStyle}
              hairColor={hairColor}
              skinTone={skinTone}
              gfxCache={gfxCache}
              loadGfx={loadGfx}
              gfxFolder={gfxFolder}
              items={eifData.items}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

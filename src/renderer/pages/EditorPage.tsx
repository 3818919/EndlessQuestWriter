import React, { useState, useCallback, useEffect } from 'react';
import ItemList from '../components/items/ItemList';
import NpcList from '../components/npcs/NpcList';
import ClassList from '../components/classes/ClassList';
import ItemEditor from '../components/items/ItemEditor';
import NpcEditor from '../components/npcs/NpcEditor';
import ClassEditor from '../components/classes/ClassEditor';
import DropsEditor from '../components/npcs/DropsEditor';
import ItemDroppedBy from '../components/items/ItemDroppedBy';
import CharacterPreview from '../components/items/CharacterPreview';
import NpcPreview from '../components/npcs/NpcPreview';
import PaperdollSlots from '../components/items/PaperdollSlots';
import AppearanceControls from '../components/items/AppearanceControls';
import VerticalSidebar from '../components/VerticalSidebar';
import StatusBar from '../components/StatusBar';
import { useResizablePanel } from '../hooks/useResizablePanel';
import FaceIcon from '@mui/icons-material/Face';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';

interface EditorPageProps {
  // Data
  eifData: any;
  enfData: any;
  ecfData: any;
  dropsData: Map<number, any[]>;
  pubDirectory: string | null;
  activeTab: 'items' | 'npcs' | 'classes';
  setActiveTab: (tab: 'items' | 'npcs' | 'classes') => void;
  
  // Items operations
  addItem: () => void;
  deleteItem: (id: number) => void;
  duplicateItem: (id: number) => void;
  updateItem: (id: number, updates: any) => void;
  
  // NPCs operations
  addNpc: () => void;
  deleteNpc: (id: number) => void;
  duplicateNpc: (id: number) => void;
  updateNpc: (id: number, updates: any) => void;
  
  // Classes operations
  addClass: () => void;
  deleteClass: (id: number) => void;
  duplicateClass: (id: number) => void;
  updateClass: (id: number, updates: any) => void;
  
  // Drops operations
  updateNpcDrops: (npcId: number, drops: any[]) => void;
  saveDropsFile: () => Promise<boolean | undefined>;
  
  // Equipment
  equippedItems: Record<string, any>;
  equipItem: (item: any, slotKey?: string) => void;
  unequipSlot: (slotKey: string) => void;
  clearAll: () => void;
  
  // Appearance
  gender: number;
  setGender: (gender: number) => void;
  hairStyle: number;
  setHairStyle: (style: number) => void;
  hairColor: number;
  setHairColor: (color: number) => void;
  skinTone: number;
  setSkinTone: (tone: number) => void;
  presets: any[];
  savePreset: (name: string) => void;
  loadPreset: (preset: any) => void;
  deletePreset: (name: string) => void;
  
  // GFX
  gfxFolder: string;
  setGfxFolder: (folder: string) => void;
  loadGfx: (gfxNumber: number, resourceId?: number) => Promise<string | null>;
  preloadGfxBatch: (requests: Array<{ gfxNumber: number; resourceId: number }>) => Promise<void>;
  isLoadingInBackground: boolean;
  loadingProgress: number;
  loadingMessage: string;
  
  // Project operations
  saveAllFiles: () => Promise<void>;
  returnToProjects: () => void;
  importItems: () => Promise<void>;
  importNpcs: () => Promise<void>;
  importDrops: () => Promise<void>;
  importClasses: () => Promise<void>;
  exportItems: () => Promise<void>;
  exportNpcs: () => Promise<void>;
  exportDrops: () => Promise<void>;
  exportClasses: () => Promise<void>;
  
  // Legacy stubs
  loadDirectory: () => void;
}

const EditorPage: React.FC<EditorPageProps> = ({
  eifData,
  enfData,
  ecfData,
  dropsData,
  pubDirectory,
  activeTab,
  setActiveTab,
  addItem,
  deleteItem,
  duplicateItem,
  updateItem,
  addNpc,
  deleteNpc,
  duplicateNpc,
  updateNpc,
  addClass,
  deleteClass,
  duplicateClass,
  updateClass,
  updateNpcDrops,
  saveDropsFile,
  equippedItems,
  equipItem,
  unequipSlot,
  clearAll,
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
  deletePreset,
  gfxFolder,
  setGfxFolder,
  loadGfx,
  preloadGfxBatch,
  isLoadingInBackground,
  loadingProgress,
  loadingMessage,
  saveAllFiles,
  returnToProjects,
  importItems,
  importNpcs,
  importDrops,
  importClasses,
  exportItems,
  exportNpcs,
  exportDrops,
  exportClasses,
  loadDirectory
}) => {
  // UI state - lives in EditorPage since it's editor-specific
  const [appearanceTab, setAppearanceTab] = useState('appearance');
  const [npcTab, setNpcTab] = useState('drops');
  const [leftPanelMinimized, setLeftPanelMinimized] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedNpcId, setSelectedNpcId] = useState<number | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  // Select first NPC when switching to NPCs tab
  useEffect(() => {
    if (activeTab === 'npcs' && selectedNpcId === null && enfData.npcs) {
      const npcIds = Object.keys(enfData.npcs).map(Number).filter(id => id > 0);
      if (npcIds.length > 0) {
        const firstNpcId = Math.min(...npcIds);
        setSelectedNpcId(firstNpcId);
      }
    }
  }, [activeTab, selectedNpcId, enfData.npcs]);

  // Resizable panel hook - only used in editor
  const {
    panelWidth: rightPanelWidth,
    isResizing,
    isMinimized: isPanelMinimized,
    handleMouseDown,
    setIsMinimized: setIsPanelMinimized
  } = useResizablePanel(400, 300, 'rightPanelWidth');

  // Derived values
  const selectedItem = selectedItemId !== null ? eifData.items[selectedItemId] : null;
  const selectedNpc = selectedNpcId !== null ? enfData.npcs[selectedNpcId] : null;
  const selectedClass = selectedClassId !== null ? ecfData.classes[selectedClassId] : null;

  // Wrapper for equipItem to match PaperdollSlots signature
  const handleEquipItemFromId = useCallback((itemId: number, slotKey: string) => {
    const item = eifData.items[itemId];
    if (item) {
      equipItem(item, slotKey);
    }
  }, [eifData.items, equipItem]);

  // Legacy stubs
  const selectDataFolder = () => {};
  const handleResetFileSelection = () => {};
  const handleLoadDataFromPath = () => {};

  return (
    <div className="app">
      <VerticalSidebar
        activeTab={activeTab}
        onTabChange={(tab: string) => setActiveTab(tab as 'items' | 'npcs' | 'classes')}
        onSave={saveAllFiles}
        onImportItems={importItems}
        onImportNpcs={importNpcs}
        onImportDrops={importDrops}
        onImportClasses={importClasses}
        onExportNpcs={exportNpcs}
        onExportItems={exportItems}
        onExportDrops={exportDrops}
        onExportClasses={exportClasses}
        onSettings={() => setShowSettingsModal(true)}
        onReturnToProjects={returnToProjects}
        isSaveDisabled={!pubDirectory}
        leftPanelMinimized={leftPanelMinimized}
        setLeftPanelMinimized={setLeftPanelMinimized}
      />
      
      <div className="main-content">
        <div className={`left-panel ${leftPanelMinimized ? 'minimized' : ''}`}>
          <div style={{ 
            display: activeTab === 'items' ? 'flex' : 'none', 
            flex: 1,
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <ItemList
              items={eifData.items}
              selectedItemId={selectedItemId}
              onSelectItem={setSelectedItemId}
              onAddItem={addItem}
              onDeleteItem={deleteItem}
              onDuplicateItem={duplicateItem}
              onLoadFile={loadDirectory}
              currentFile={pubDirectory}
              onSelectGfxFolder={selectDataFolder}
              gfxFolder={gfxFolder}
              loadGfx={loadGfx}
              preloadGfxBatch={preloadGfxBatch}
              onEquipItem={equipItem}
              showSettingsModal={showSettingsModal}
              setShowSettingsModal={setShowSettingsModal}
              leftPanelMinimized={leftPanelMinimized}
              onResetFileSelection={handleResetFileSelection}
              onLoadEIFFromPath={handleLoadDataFromPath}
              onSelectGfxFromPath={handleLoadDataFromPath}
            />
          </div>
          
          <div style={{ 
            display: activeTab === 'npcs' ? 'flex' : 'none', 
            flex: 1,
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <NpcList
              npcs={enfData.npcs}
              selectedNpcId={selectedNpcId}
              onSelectNpc={setSelectedNpcId}
              onAddNpc={addNpc}
              onDeleteNpc={deleteNpc}
              onDuplicateNpc={duplicateNpc}
              currentFile={pubDirectory}
              showSettingsModal={showSettingsModal}
              setShowSettingsModal={setShowSettingsModal}
              leftPanelMinimized={leftPanelMinimized}
              onResetFileSelection={handleResetFileSelection}
              loadGfx={loadGfx}
              gfxFolder={gfxFolder}
              preloadGfxBatch={preloadGfxBatch}
            />
          </div>
          
          <div style={{ 
            display: activeTab === 'classes' ? 'flex' : 'none', 
            flex: 1,
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <ClassList
              classes={ecfData.classes}
              selectedClassId={selectedClassId}
              onSelectClass={setSelectedClassId}
              onAddClass={addClass}
              onDeleteClass={deleteClass}
              onDuplicateClass={duplicateClass}
              showSettingsModal={showSettingsModal}
              setShowSettingsModal={setShowSettingsModal}
              leftPanelMinimized={leftPanelMinimized}
            />
          </div>
        </div>
        
        <div className="center-panel">
          {activeTab === 'items' && selectedItem && (
            <ItemEditor
              item={selectedItem}
              onUpdateItem={updateItem}
              onDuplicateItem={duplicateItem}
              onDeleteItem={deleteItem}
              loadGfx={loadGfx}
              gfxFolder={gfxFolder}
              onSetGfxFolder={setGfxFolder}
              onEquipItem={equipItem}
            />
          )}
          
          {activeTab === 'npcs' && selectedNpc && (
            <NpcEditor
              npc={selectedNpc}
              onUpdate={updateNpc}
              onDuplicateNpc={duplicateNpc}
              onDeleteNpc={deleteNpc}
            />
          )}
          
          {activeTab === 'classes' && selectedClass && (
            <ClassEditor
              classData={selectedClass}
              onUpdateClass={updateClass}
              onDuplicateClass={duplicateClass}
              onDeleteClass={deleteClass}
            />
          )}
        </div>
        
        {activeTab !== 'classes' && (
        <div 
          className={`right-panel ${isResizing ? 'resizing' : ''} ${(isPanelMinimized || (activeTab === 'npcs' && !showPreview && npcTab !== 'drops') || (activeTab === 'items' && appearanceTab === 'droppedBy' && !selectedItem)) ? 'minimized' : ''}`}
          style={{ width: (isPanelMinimized || (activeTab === 'npcs' && !showPreview && npcTab !== 'drops') || (activeTab === 'items' && appearanceTab === 'droppedBy' && !selectedItem)) ? '60px' : `${rightPanelWidth}px` }}
        >
          <div className="resize-handle" onMouseDown={handleMouseDown} />
          
          <div className="right-panel-content">
            <div className="right-panel-top">
              {activeTab === 'items' && appearanceTab === 'appearance' && (
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
              
              {activeTab === 'items' && appearanceTab === 'equipment' && (
                <PaperdollSlots
                  equippedItems={equippedItems}
                  onEquipItem={handleEquipItemFromId}
                  onUnequipSlot={unequipSlot}
                  onClearAll={clearAll}
                  items={eifData.items}
                  onAutoGenderSwitch={setGender}
                  loadGfx={loadGfx}
                  gfxFolder={gfxFolder}
                />
              )}

              {activeTab === 'items' && appearanceTab === 'droppedBy' && selectedItem && (
                <ItemDroppedBy
                  itemId={selectedItem.id}
                  dropsData={dropsData}
                  npcs={enfData.npcs}
                  onNavigateToNpc={(npcId) => {
                    setActiveTab('npcs');
                    setSelectedNpcId(npcId);
                  }}
                  onAddToNpcDrops={(npcId) => {
                    const currentDrops = dropsData.get(npcId) || [];
                    const newDrop = {
                      itemId: selectedItem.id,
                      min: 1,
                      max: 1,
                      percentage: 10
                    };
                    updateNpcDrops(npcId, [...currentDrops, newDrop]);
                    saveDropsFile();
                  }}
                />
              )}
              
              {activeTab === 'npcs' && npcTab === 'drops' && selectedNpc && (
                <DropsEditor
                  npcId={selectedNpc.id}
                  drops={dropsData.get(selectedNpc.id) || []}
                  onUpdateDrops={(npcId, drops) => {
                    updateNpcDrops(npcId, drops);
                    saveDropsFile();
                  }}
                  items={eifData.items}
                  onNavigateToItem={(itemId) => {
                    setActiveTab('items');
                    setSelectedItemId(itemId);
                  }}
                />
              )}
            </div>
            
            {showPreview && activeTab === 'items' && (
            <div className="right-panel-bottom">
              <CharacterPreview
                equippedItems={equippedItems}
                gender={gender}
                hairStyle={hairStyle}
                hairColor={hairColor}
                skinTone={skinTone}
                loadGfx={loadGfx}
                gfxFolder={gfxFolder}
              />
            </div>
            )}
            
            {showPreview && activeTab === 'npcs' && selectedNpc && (
            <div className="right-panel-bottom">
              <NpcPreview
                npc={selectedNpc}
                loadGfx={loadGfx}
                gfxFolder={gfxFolder}
              />
            </div>
            )}
          </div>
          
          <div className="vertical-sidebar">
            {activeTab === 'items' && (
              <>
                <button
                  className={`sidebar-button ${appearanceTab === 'appearance' && !isPanelMinimized ? 'active' : ''}`}
                  onClick={() => {
                    if (appearanceTab === 'appearance' && !isPanelMinimized) {
                      setIsPanelMinimized(true);
                    } else {
                      setAppearanceTab('appearance');
                      setIsPanelMinimized(false);
                    }
                  }}
                  title="Appearance"
                >
                  <FaceIcon />
                  <span className="sidebar-label">Appearance</span>
                </button>
                <button
                  className={`sidebar-button ${appearanceTab === 'equipment' && !isPanelMinimized ? 'active' : ''}`}
                  onClick={() => {
                    if (appearanceTab === 'equipment' && !isPanelMinimized) {
                      setIsPanelMinimized(true);
                    } else {
                      setAppearanceTab('equipment');
                      setIsPanelMinimized(false);
                    }
                  }}
                  title="Equipment"
                >
                  <CheckroomIcon />
                  <span className="sidebar-label">Equipment</span>
                </button>
                <button
                  className={`sidebar-button ${appearanceTab === 'droppedBy' && !isPanelMinimized ? 'active' : ''}`}
                  onClick={() => {
                    if (appearanceTab === 'droppedBy' && !isPanelMinimized) {
                      setIsPanelMinimized(true);
                    } else {
                      setAppearanceTab('droppedBy');
                      setIsPanelMinimized(false);
                    }
                  }}
                  title="Dropped By"
                >
                  <DownloadIcon />
                  <span className="sidebar-label">Dropped By</span>
                </button>
              </>
            )}
            {activeTab === 'npcs' && (
              <button
                className={`sidebar-button ${npcTab === 'drops' && !isPanelMinimized ? 'active' : ''}`}
                onClick={() => {
                  if (npcTab === 'drops' && !isPanelMinimized) {
                    setIsPanelMinimized(true);
                  } else {
                    setNpcTab('drops');
                    setIsPanelMinimized(false);
                  }
                }}
                title="Drops"
              >
                <DownloadIcon />
                <span className="sidebar-label">Drops</span>
              </button>
            )}
            <div className="sidebar-spacer"></div>
            <button
              className={`sidebar-button ${showPreview ? 'active' : ''}`}
              onClick={() => setShowPreview(!showPreview)}
              title="Toggle Preview"
            >
              <VisibilityIcon />
              <span className="sidebar-label">Preview</span>
            </button>
          </div>
        </div>
        )}
      </div>
      
      <StatusBar 
        isLoading={isLoadingInBackground}
        progress={loadingProgress}
        message={loadingMessage}
      />
    </div>
  );
};

export default EditorPage;

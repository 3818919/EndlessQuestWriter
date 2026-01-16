import React, { useState, useMemo } from 'react';
import ItemPreview from './ItemPreview';
import SearchIcon from '@mui/icons-material/Search';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import SaveIcon from '@mui/icons-material/Save';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

const ITEM_TYPES = {
  0: 'Static',
  1: 'UnknownType1',
  2: 'Money',
  3: 'Heal',
  4: 'Teleport',
  5: 'Spell',
  6: 'EXPReward',
  7: 'StatReward',
  8: 'SkillReward',
  9: 'Key',
  10: 'Weapon',
  11: 'Shield',
  12: 'Armor',
  13: 'Hat',
  14: 'Boots',
  15: 'Gloves',
  16: 'Accessory',
  17: 'Belt',
  18: 'Necklace',
  19: 'Ring',
  20: 'Armlet',
  21: 'Bracer',
  22: 'Beer',
  23: 'EffectPotion',
  24: 'HairDye',
  25: 'CureCurse'
};

export default function ItemList({
  items,
  selectedItemId,
  onSelectItem,
  onAddItem,
  onDeleteItem,
  onDuplicateItem,
  onLoadFile,
  onSaveFile,
  currentFile,
  onSelectGfxFolder,
  gfxFolder,
  loadGfx,
  onEquipItem,
  showSettingsModal,
  setShowSettingsModal,
  leftPanelMinimized,
  setLeftPanelMinimized,
  onResetFileSelection,
  onLoadEIFFromPath,
  onSelectGfxFromPath
}: {
  items: Record<number, any>;
  selectedItemId: number | null;
  onSelectItem: (id: number) => void;
  onAddItem: () => void;
  onDeleteItem: (id: number) => void;
  onDuplicateItem: (id: number) => void;
  onLoadFile: () => void;
  onSaveFile: () => void;
  currentFile: string | null;
  onSelectGfxFolder: () => void;
  gfxFolder: string | null;
  loadGfx: (gfxNumber: number, resourceId?: number) => Promise<any>;
  onEquipItem?: (item: any) => void;
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;
  leftPanelMinimized: boolean;
  setLeftPanelMinimized: (minimized: boolean) => void;
  onResetFileSelection: () => void;
  onLoadEIFFromPath: (path: string) => void;
  onSelectGfxFromPath: (path: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeLeftTab, setActiveLeftTab] = useState('items');
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [eifDragOver, setEifDragOver] = useState(false);
  const [gfxDragOver, setGfxDragOver] = useState(false);

  // Drag and drop handlers for EIF
  const handleEifDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEifDragOver(true);
  };

  const handleEifDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEifDragOver(false);
  };

  const handleEifDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEifDragOver(false);

    if (isElectron && window.electronAPI) {
      const files = Array.from(e.dataTransfer.files);
      const eifFile = files.find(f => f.name.endsWith('.eif'));
      if (eifFile && 'path' in eifFile) {
        onLoadEIFFromPath((eifFile as ElectronFile).path);
      }
    } else {
      const files = Array.from(e.dataTransfer.files);
      const eifFile = files.find(f => f.name.endsWith('.eif'));
      if (eifFile) {
        onLoadFile();
      }
    }
  };

  // Drag and drop handlers for GFX
  const handleGfxDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setGfxDragOver(true);
  };

  const handleGfxDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setGfxDragOver(false);
  };

  const handleGfxDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setGfxDragOver(false);

    if (isElectron && window.electronAPI) {
      const items = Array.from(e.dataTransfer.items);
      if (items.length > 0) {
        const item = items[0];
        const file = item.getAsFile();
        if (file && 'path' in file) {
          let path = (file as ElectronFile).path;
          const isDir = await window.electronAPI.isDirectory(path);
          if (isDir) {
            onSelectGfxFromPath(path);
          } else {
            const dirPath = path.substring(0, path.lastIndexOf('/'));
            onSelectGfxFromPath(dirPath);
          }
        }
      }
    }
  };

  const filteredItems = useMemo(() => {
    const itemArray = Object.values(items);
    
    return itemArray.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.id.toString().includes(searchQuery);
      const matchesType = typeFilter === 'all' || (item.type !== undefined && item.type.toString() === typeFilter);
      
      return matchesSearch && matchesType;
    });
  }, [items, searchQuery, typeFilter]);

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDoubleClick = (item) => {
    // Only equip if it's an equippable item type (10-21)
    if (item.type >= 10 && item.type <= 21 && onEquipItem) {
      onEquipItem(item);
    }
  };

  return (
    <>
      <div className="left-vertical-sidebar">
        <button
          className={`left-sidebar-button ${(activeLeftTab === 'items' && !leftPanelMinimized) ? 'active' : ''}`}
          onClick={() => setLeftPanelMinimized(!leftPanelMinimized)}
          title="Items"
        >
          <ListAltIcon />
        </button>
        <button
          className="left-sidebar-button save-button"
          onClick={onSaveFile}
          disabled={!currentFile}
          title="Save EIF File"
        >
          <SaveIcon />
        </button>
        <div className="sidebar-spacer"></div>
        <button
          className="left-sidebar-button"
          onClick={() => setShowSettingsModal(true)}
          title="Settings"
        >
          <SettingsIcon />
        </button>
      </div>
      
      {showFilterPopup && (
        <div className="filter-popup-overlay" onClick={() => setShowFilterPopup(false)}>
          <div className="filter-popup" onClick={(e) => e.stopPropagation()}>
            <div className="filter-popup-content">
              <h3>Search & Filter</h3>
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="type-filter"
              >
                <option value="all">All Types</option>
                {Object.entries(ITEM_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <button 
                onClick={() => setShowFilterPopup(false)}
                className="btn btn-secondary btn-small"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className={`item-list-content ${leftPanelMinimized ? 'minimized' : ''}`}>
        <div className="item-list-filters">
          {leftPanelMinimized ? (
            <button
              className="search-filter-button"
              onClick={() => setShowFilterPopup(!showFilterPopup)}
              title="Search & Filter"
            >
              <SearchIcon />
            </button>
          ) : (
            <>
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="type-filter"
              >
                <option value="all">All Types</option>
                {Object.entries(ITEM_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              <button 
                onClick={onAddItem}
                className="btn btn-success btn-small"
                disabled={!currentFile}
              >
                + Add Item
              </button>
            </>
          )}
        </div>

        <div className="items-scroll">
          {filteredItems.length === 0 ? (
            <div className="empty-state">
              <p>{currentFile ? 'No items match your search' : 'No file loaded'}</p>
            </div>
          ) : (
            <ul className="items-list">
              {filteredItems.map(item => (
                <li
                  key={item.id}
                  className={`item-row ${selectedItemId === item.id ? 'selected' : ''}`}
                  onClick={() => onSelectItem(item.id)}
                  onDoubleClick={() => handleDoubleClick(item)}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, item)}
                  title={leftPanelMinimized ? `${item.name} (#${item.id})` : undefined}
                >
                  <ItemPreview 
                    item={item} 
                    gfxFolder={gfxFolder} 
                    loadGfx={loadGfx}
                    size="small"
                    lazy={true}
                    mode="icon"
                  />
                  {!leftPanelMinimized && (
                  <div className="item-info">
                    <span className="item-id">#{item.id}</span>
                    <span className="item-name" title={item.name}>{item.name}</span>
                    <span className="item-type" title={ITEM_TYPES[item.type] || 'Unknown'}>{ITEM_TYPES[item.type] || 'Unknown'}</span>
                  </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
            <h2>File Settings</h2>
            
            <div className="settings-drop-zones">
              <div 
                className={`settings-drop-zone ${currentFile ? 'has-file' : ''} ${eifDragOver ? 'drag-over' : ''}`}
                onClick={onLoadFile}
                onDragOver={handleEifDragOver}
                onDragLeave={handleEifDragLeave}
                onDrop={handleEifDrop}
              >
                <div className="drop-zone-icon">
                  <InsertDriveFileIcon />
                </div>
                <div className="drop-zone-text">
                  {currentFile ? (
                    <>
                      <div className="drop-zone-title">Item File</div>
                      <div className="drop-zone-file">{currentFile}</div>
                      <div className="drop-zone-hint">Click to change</div>
                    </>
                  ) : (
                    <>
                      <div className="drop-zone-title">Item File (EIF)</div>
                      <div className="drop-zone-hint">Click or drop .eif file</div>
                    </>
                  )}
                </div>
              </div>

              <div 
                className={`settings-drop-zone ${gfxFolder ? 'has-file' : ''} ${gfxDragOver ? 'drag-over' : ''}`}
                onClick={onSelectGfxFolder}
                onDragOver={handleGfxDragOver}
                onDragLeave={handleGfxDragLeave}
                onDrop={handleGfxDrop}
              >
                <div className="drop-zone-icon">
                  <FolderOpenIcon />
                </div>
                <div className="drop-zone-text">
                  {gfxFolder ? (
                    <>
                      <div className="drop-zone-title">Graphics Folder</div>
                      <div className="drop-zone-file">{gfxFolder}</div>
                      <div className="drop-zone-hint">Click to change</div>
                    </>
                  ) : (
                    <>
                      <div className="drop-zone-title">Graphics Folder (GFX)</div>
                      <div className="drop-zone-hint">Click or drop folder</div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => {
                  if (confirm('This will clear your file selections and return to the landing page. Continue?')) {
                    onResetFileSelection();
                    setShowSettingsModal(false);
                  }
                }} 
                className="btn btn-danger modal-action-btn"
              >
                Reset File Selection
              </button>
              <button 
                onClick={() => setShowSettingsModal(false)} 
                className="btn btn-secondary modal-action-btn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

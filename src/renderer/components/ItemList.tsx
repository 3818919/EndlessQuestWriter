import React, { useState, useMemo } from 'react';
import ItemPreview from './ItemPreview';
import SearchIcon from '@mui/icons-material/Search';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SettingsIcon from '@mui/icons-material/Settings';

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
  setShowSettingsModal
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
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeLeftTab, setActiveLeftTab] = useState('items');

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
          className={`left-sidebar-button ${activeLeftTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveLeftTab('items')}
          title="Items"
        >
          <ListAltIcon />
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
      
      <div className="item-list-content">
        <div className="item-list-filters">
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
                >
                  <ItemPreview 
                    item={item} 
                    gfxFolder={gfxFolder} 
                    loadGfx={loadGfx}
                    size="small"
                    lazy={true}
                    mode="icon"
                  />
                  <div className="item-info">
                    <span className="item-id">#{item.id}</span>
                    <span className="item-name">{item.name}</span>
                    <span className="item-type">{ITEM_TYPES[item.type] || 'Unknown'}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>File Settings</h2>
            
            <div className="settings-section">
              <h3>Current Files</h3>
              {currentFile && <div className="file-path">EIF: {currentFile}</div>}
              {gfxFolder && <div className="file-path">GFX: {gfxFolder}</div>}
            </div>

            <div className="settings-section">
              <h3>File Operations</h3>
              <div className="settings-buttons">
                <button onClick={onLoadFile} className="btn btn-primary">
                  Open EIF File
                </button>
                <button 
                  onClick={onSaveFile} 
                  className="btn btn-success"
                  disabled={!currentFile}
                >
                  Save EIF File
                </button>
                <button onClick={onSelectGfxFolder} className="btn btn-primary">
                  Select GFX Folder
                </button>
              </div>
            </div>

            <button 
              onClick={() => setShowSettingsModal(false)} 
              className="btn btn-secondary modal-close"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

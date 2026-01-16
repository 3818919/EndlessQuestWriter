import React, { useState, useMemo } from 'react';
import ItemPreview from './ItemPreview';

const ITEM_TYPES = {
  1: 'Static',
  2: 'UnknownType2',
  3: 'Money',
  4: 'Heal',
  5: 'Teleport',
  6: 'Spell',
  7: 'EXPReward',
  8: 'StatReward',
  9: 'SkillReward',
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
  22: 'Alcohol',
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
  loadGfx
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

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

  return (
    <div className="item-list-container">
      <div className="item-list-header">
        <h2>Items</h2>
        <div className="header-actions">
          <button onClick={onLoadFile} className="btn btn-primary">
            Open EIF
          </button>
          <button 
            onClick={onSaveFile} 
            className="btn btn-success"
            disabled={!currentFile}
          >
            Save
          </button>
          <button onClick={onSelectGfxFolder} className="btn btn-primary">
            Select GFX Folder
          </button>
        </div>
      </div>
      
      <div className="file-info">
        {currentFile && <div className="current-file">EIF: {currentFile.split('/').pop()}</div>}
        {gfxFolder && <div className="current-gfx">GFX: {gfxFolder.split('/').pop()}</div>}
      </div>

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
                draggable={true}
                onDragStart={(e) => handleDragStart(e, item)}
              >
                <ItemPreview item={item} gfxFolder={gfxFolder} size="small" />
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

      {currentFile && (
        <div className="file-info">
          <small>{currentFile}</small>
        </div>
      )}
    </div>
  );
}

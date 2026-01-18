import React, { useState, useEffect } from 'react';
import { ItemType, ItemSize, ItemSubtype, ItemSpecial } from 'eolib';

interface Item {
  id: number;
  name: string;
  graphic: number;
  type: number;
  dolGraphic?: number;
  hp?: number;
  tp?: number;
  minDamage?: number;
  maxDamage?: number;
  gender?: number;
  levelReq?: number;
  strReq?: number;
  weight?: number;
  size?: number;
  [key: string]: any;
}

interface ItemEditorProps {
  item: Item;
  onUpdateItem: (id: number, updates: Partial<Item>) => void;
  onDuplicateItem: (id: number) => void;
  onDeleteItem: (id: number) => void;
  loadGfx: (gfxNumber: number, resourceId?: number) => Promise<string | null>;
  gfxFolder: string;
  onSetGfxFolder: (folder: string) => void;
  onEquipItem?: (item: Item) => void;
}

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI;

// Helper to convert enum to dropdown options
const enumToOptions = (enumObj: any) => {
  return Object.entries(enumObj)
    .filter(([key]) => isNaN(Number(key))) // Filter out reverse mappings
    .map(([key, value]) => ({ value: value as number, label: key }));
};

export default function ItemEditor({ 
  item, 
  onUpdateItem,
  onDuplicateItem,
  onDeleteItem,
  loadGfx,
  gfxFolder,
  onSetGfxFolder,
  onEquipItem
}: ItemEditorProps) {
  const [previewImage, setPreviewImage] = useState(null);
  const [dropPreviewImage, setDropPreviewImage] = useState(null);
  const [amount, setAmount] = useState(1); // For money preview

  useEffect(() => {
    if (item && item.graphic && gfxFolder) {
      loadItemPreviews();
    }
  }, [item?.graphic, item?.type, gfxFolder, amount]);

  const loadItemPreviews = async () => {
    if (!item || !item.graphic) return;
    
    // Inventory icon formula (from InventoryPanelItem.cs): 2 * graphic + 100 (PE offset)
    let iconResourceId;
    if (item.type === 2) {
      // Money uses same drop graphic for inventory
      const gfx = amount >= 100000 ? 4 : (
        amount >= 10000 ? 3 : (
          amount >= 100 ? 2 : (
            amount >= 2 ? 1 : 0)));
      iconResourceId = 269 + (2 * gfx) + 100;
    } else {
      iconResourceId = (2 * item.graphic) + 100;
    }
    const iconDataUrl = await loadGfx(23, iconResourceId);
    setPreviewImage(iconDataUrl);

    // Drop graphic formula (from MapItemGraphicProvider.cs): 
    // - For money: 269 + 2 * gfx + 100 (PE offset)
    // - For regular items: 2 * graphic - 1 + 100 (PE offset)
    let dropResourceId;
    if (item.type === 2) {
      const gfx = amount >= 100000 ? 4 : (
        amount >= 10000 ? 3 : (
          amount >= 100 ? 2 : (
            amount >= 2 ? 1 : 0)));
      dropResourceId = 269 + (2 * gfx) + 100;
    } else {
      dropResourceId = (2 * item.graphic) - 1 + 100;
    }
    const dropDataUrl = await loadGfx(23, dropResourceId);
    setDropPreviewImage(dropDataUrl);
  };

  const handleInputChange = (field, value) => {
    onUpdateItem(item.id, { [field]: value });
  };

  const handleGFXFolderSelect = async () => {
    if (!isElectron || !window.electronAPI) {
      alert('Folder selection is only available in the Electron app.');
      return;
    }
    
    const folder = await window.electronAPI.openDirectory();
    if (folder) {
      onSetGfxFolder(folder);
      localStorage.setItem('gfxFolder', folder);
    }
  };

  if (!item) {
    return (
      <div className="editor-empty">
        <p>Select an item to edit</p>
      </div>
    );
  }

  return (
    <div className="item-editor">
      <div className="editor-header">
        <h2>Item #{item.id}</h2>
        <div className="editor-header-actions">
          <button 
            onClick={() => onDuplicateItem(item.id)} 
            className="btn btn-secondary"
            title="Duplicate this item"
          >
            Duplicate
          </button>
          <button 
            onClick={() => onDeleteItem(item.id)} 
            className="btn btn-danger"
            title="Delete this item"
          >
            Delete
          </button>
          <button 
            onClick={() => onEquipItem?.(item)}
            className="btn btn-secondary"
            title={item.type >= 10 && item.type <= 21 ? "Equip this item" : "This item cannot be equipped"}
            disabled={!onEquipItem || item.type < 10 || item.type > 21}
          >
            Equip
          </button>
          {!gfxFolder && (
            <button onClick={handleGFXFolderSelect} className="btn btn-secondary">
              Set GFX Folder
            </button>
          )}
        </div>
      </div>

      <div className="editor-content">
        <div className="form-grid">
          {/* Basic Properties */}
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={item.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Graphic ID</label>
            <input
              type="number"
              value={item.graphic || 0}
              onChange={(e) => handleInputChange('graphic', parseInt(e.target.value) || 0)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Type</label>
            <select
              value={item.type || 1}
              onChange={(e) => handleInputChange('type', parseInt(e.target.value))}
              className="form-select"
            >
              {enumToOptions(ItemType).map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Sub Type</label>
            <select
              value={item.subType || 0}
              onChange={(e) => handleInputChange('subType', parseInt(e.target.value))}
              className="form-select"
            >
              {enumToOptions(ItemSubtype).map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Special</label>
            <select
              value={item.special || 0}
              onChange={(e) => handleInputChange('special', parseInt(e.target.value))}
              className="form-select"
            >
              {enumToOptions(ItemSpecial).map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Stats */}
          <div className="form-group">
            <label>HP</label>
            <input
              type="number"
              value={item.hp || 0}
              onChange={(e) => handleInputChange('hp', parseInt(e.target.value) || 0)}
              className="form-input"
              style={{ width: '100px' }}
            />
          </div>

          <div className="form-group">
            <label>TP</label>
            <input
              type="number"
              value={item.tp || 0}
              onChange={(e) => handleInputChange('tp', parseInt(e.target.value) || 0)}
              className="form-input"
              style={{ width: '100px' }}
            />
          </div>

          <div className="form-group">
            <label>Min Damage</label>
            <input
              type="number"
              value={item.minDamage || 0}
              onChange={(e) => handleInputChange('minDamage', parseInt(e.target.value) || 0)}
              className="form-input"
              style={{ width: '100px' }}
            />
          </div>

          <div className="form-group">
            <label>Max Damage</label>
            <input
              type="number"
              value={item.maxDamage || 0}
              onChange={(e) => handleInputChange('maxDamage', parseInt(e.target.value) || 0)}
              className="form-input"
              style={{ width: '100px' }}
            />
          </div>

          <div className="form-group">
            <label>Accuracy</label>
            <input
              type="number"
              value={item.accuracy || 0}
              onChange={(e) => handleInputChange('accuracy', parseInt(e.target.value) || 0)}
              className="form-input"
              style={{ width: '80px' }}
            />
          </div>

          <div className="form-group">
            <label>Evade</label>
            <input
              type="number"
              value={item.evade || 0}
              onChange={(e) => handleInputChange('evade', parseInt(e.target.value) || 0)}
              className="form-input"
              style={{ width: '80px' }}
            />
          </div>

          <div className="form-group">
            <label>Armor</label>
            <input
              type="number"
              value={item.armor || 0}
              onChange={(e) => handleInputChange('armor', parseInt(e.target.value) || 0)}
              className="form-input"
              style={{ width: '80px' }}
            />
          </div>

          {/* Stat Bonuses */}
          <div className="form-group">
            <label>STR</label>
            <input
              type="number"
              value={item.str || 0}
              onChange={(e) => handleInputChange('str', parseInt(e.target.value) || 0)}
              className="form-input"
              style={{ width: '80px' }}
            />
          </div>

          <div className="form-group">
            <label>INT</label>
            <input
              type="number"
              value={item.int || 0}
              onChange={(e) => handleInputChange('int', parseInt(e.target.value) || 0)}
              className="form-input"
              style={{ width: '80px' }}
            />
          </div>

          <div className="form-group">
            <label>WIS</label>
            <input
              type="number"
              value={item.wis || 0}
              onChange={(e) => handleInputChange('wis', parseInt(e.target.value) || 0)}
              className="form-input"
              style={{ width: '80px' }}
            />
          </div>

          <div className="form-group">
            <label>AGI</label>
            <input
              type="number"
              value={item.agi || 0}
              onChange={(e) => handleInputChange('agi', parseInt(e.target.value) || 0)}
              className="form-input"
              style={{ width: '80px' }}
            />
          </div>

          <div className="form-group">
            <label>CON</label>
            <input
              type="number"
              value={item.con || 0}
              onChange={(e) => handleInputChange('con', parseInt(e.target.value) || 0)}
              className="form-input"
              style={{ width: '80px' }}
            />
          </div>

          <div className="form-group">
            <label>CHA</label>
            <input
              type="number"
              value={item.cha || 0}
              onChange={(e) => handleInputChange('cha', parseInt(e.target.value) || 0)}
              className="form-input"
              style={{ width: '80px' }}
            />
          </div>

          {/* Equipment Properties */}
          <div className="form-group">
            <label>DOL Graphic</label>
            <input
              type="number"
              value={item.dolGraphic || 0}
              onChange={(e) => handleInputChange('dolGraphic', parseInt(e.target.value) || 0)}
              className="form-input"
              style={{ width: '100px' }}
            />
          </div>

          <div className="form-group">
            <label>Gender</label>
            <select
              value={item.gender ?? 2}
              onChange={(e) => handleInputChange('gender', parseInt(e.target.value))}
              className="form-select"
              disabled={item.type < 10 || item.type > 21}
              title={item.type < 10 || item.type > 21 ? "Gender only applies to equippable items" : ""}
            >
              <option value="2">No Gender</option>
              <option value="0">Female</option>
              <option value="1">Male</option>
            </select>
          </div>

          {/* Requirements */}
          <div className="form-group">
            <label>Level Req</label>
            <input
              type="number"
              value={item.levelReq || 0}
              onChange={(e) => handleInputChange('levelReq', parseInt(e.target.value) || 0)}
              className="form-input"
              style={{ width: '80px' }}
            />
          </div>

          <div className="form-group">
            <label>Class Req</label>
            <input
              type="number"
              value={item.classReq || 0}
              onChange={(e) => handleInputChange('classReq', parseInt(e.target.value) || 0)}
              className="form-input"
              style={{ width: '80px' }}
            />
          </div>

          <div className="form-group">
            <label>STR Req</label>
            <input
              type="number"
              value={item.strReq || 0}
              onChange={(e) => handleInputChange('strReq', parseInt(e.target.value) || 0)}
              className="form-input"
              style={{ width: '80px' }}
            />
          </div>

          <div className="form-group">
            <label>INT Req</label>
            <input
              type="number"
              value={item.intReq || 0}
              onChange={(e) => handleInputChange('intReq', parseInt(e.target.value) || 0)}
              className="form-input"
              style={{ width: '80px' }}
            />
          </div>

          <div className="form-group">
            <label>WIS Req</label>
            <input
              type="number"
              value={item.wisReq || 0}
              onChange={(e) => handleInputChange('wisReq', parseInt(e.target.value) || 0)}
              className="form-input"
              style={{ width: '80px' }}
            />
          </div>

          <div className="form-group">
            <label>AGI Req</label>
            <input
              type="number"
              value={item.agiReq || 0}
              onChange={(e) => handleInputChange('agiReq', parseInt(e.target.value) || 0)}
              className="form-input"
              style={{ width: '80px' }}
            />
          </div>

          <div className="form-group">
            <label>CON Req</label>
            <input
              type="number"
              value={item.conReq || 0}
              onChange={(e) => handleInputChange('conReq', parseInt(e.target.value) || 0)}
              className="form-input"
              style={{ width: '80px' }}
            />
          </div>

          <div className="form-group">
            <label>CHA Req</label>
            <input
              type="number"
              value={item.chaReq || 0}
              onChange={(e) => handleInputChange('chaReq', parseInt(e.target.value) || 0)}
              className="form-input"
              style={{ width: '80px' }}
            />
          </div>

          <div className="form-group">
            <label>Weight</label>
            <input
              type="number"
              value={item.weight || 0}
              onChange={(e) => handleInputChange('weight', parseInt(e.target.value) || 0)}
              className="form-input"
              style={{ width: '80px' }}
            />
          </div>

          <div className="form-group">
            <label>Size</label>
            <select
              value={item.size || 0}
              onChange={(e) => handleInputChange('size', parseInt(e.target.value))}
              className="form-input"
              style={{ width: '100px' }}
            >
              {enumToOptions(ItemSize).map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Item Previews */}
        <div className="item-previews-section">
          <h3>Item Graphics</h3>
          
          {item.type === 2 && (
            <div className="form-group">
              <label>Amount (for money preview)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 1)}
                min="1"
                className="form-input"
              />
            </div>
          )}
          
          <div className="preview-grid">
            {previewImage && (
              <div className="preview-item">
                <label>Icon (Inventory)</label>
                <div className="preview-box">
                  <img src={previewImage} alt={`${item.name} icon`} />
                </div>
              </div>
            )}
            {dropPreviewImage && (
              <div className="preview-item">
                <label>Drop (Ground)</label>
                <div className="preview-box">
                  <img src={dropPreviewImage} alt={`${item.name} drop`} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

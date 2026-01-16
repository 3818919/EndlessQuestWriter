import React, { useState, useEffect } from 'react';
import ItemPreview from './ItemPreview';

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI;

const ITEM_TYPES = {
  0: 'Static', 1: 'UnknownType1', 2: 'Money', 3: 'Heal', 4: 'Teleport',
  5: 'Spell', 6: 'EXPReward', 7: 'StatReward', 8: 'SkillReward', 9: 'Key',
  10: 'Weapon', 11: 'Shield', 12: 'Armor', 13: 'Hat', 14: 'Boots',
  15: 'Gloves', 16: 'Accessory', 17: 'Belt', 18: 'Necklace',
  19: 'Ring', 20: 'Armlet', 21: 'Bracer', 22: 'Beer',
  23: 'EffectPotion', 24: 'HairDye', 25: 'CureCurse'
};

export default function ItemEditor({ 
  item, 
  onUpdateItem,
  loadGfx,
  gfxFolder,
  onSetGfxFolder
}) {
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
        {!gfxFolder && (
          <button onClick={handleGFXFolderSelect} className="btn btn-secondary">
            Set GFX Folder
          </button>
        )}
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
              {Object.entries(ITEM_TYPES).map(([value, label]) => (
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
            />
          </div>

          <div className="form-group">
            <label>TP</label>
            <input
              type="number"
              value={item.tp || 0}
              onChange={(e) => handleInputChange('tp', parseInt(e.target.value) || 0)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Min Damage</label>
            <input
              type="number"
              value={item.minDamage || 0}
              onChange={(e) => handleInputChange('minDamage', parseInt(e.target.value) || 0)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Max Damage</label>
            <input
              type="number"
              value={item.maxDamage || 0}
              onChange={(e) => handleInputChange('maxDamage', parseInt(e.target.value) || 0)}
              className="form-input"
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
            />
          </div>

          <div className="form-group">
            <label>Gender</label>
            <select
              value={item.gender || 0}
              onChange={(e) => handleInputChange('gender', parseInt(e.target.value))}
              className="form-select"
            >
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
            />
          </div>

          <div className="form-group">
            <label>Str Req</label>
            <input
              type="number"
              value={item.strReq || 0}
              onChange={(e) => handleInputChange('strReq', parseInt(e.target.value) || 0)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Weight</label>
            <input
              type="number"
              value={item.weight || 0}
              onChange={(e) => handleInputChange('weight', parseInt(e.target.value) || 0)}
              className="form-input"
            />
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

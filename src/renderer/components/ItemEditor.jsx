import React, { useState, useEffect } from 'react';
import ItemPreview from './ItemPreview';

const ITEM_TYPES = {
  1: 'Static', 2: 'UnknownType2', 3: 'Money', 4: 'Heal', 5: 'Teleport',
  6: 'Spell', 7: 'EXPReward', 8: 'StatReward', 9: 'SkillReward',
  10: 'Weapon', 11: 'Shield', 12: 'Armor', 13: 'Hat', 14: 'Boots',
  15: 'Gloves', 16: 'Accessory', 17: 'Belt', 18: 'Necklace',
  19: 'Ring', 20: 'Armlet', 21: 'Bracer', 22: 'Alcohol',
  23: 'EffectPotion', 24: 'HairDye', 25: 'CureCurse'
};

export default function ItemEditor({ 
  item, 
  onUpdateItem,
  gfxCache,
  loadGfx,
  gfxFolder,
  onSetGfxFolder
}) {
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (item && item.graphic && gfxFolder) {
      loadItemPreview();
    }
  }, [item?.graphic, gfxFolder]);

  const loadItemPreview = async () => {
    if (!item || !item.graphic) return;
    
    const resourceId = (2 * item.graphic) + 100;
    const dataUrl = await loadGfx(23, resourceId); // GFX023 for item icons
    setPreviewImage(dataUrl);
  };

  const handleInputChange = (field, value) => {
    onUpdateItem(item.id, { [field]: value });
  };

  const handleGFXFolderSelect = async () => {
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
        <div className="preview-section">
          <div className="preview-group">
            <label>Icon Preview</label>
            {previewImage ? (
              <img src={previewImage} alt="Item preview" className="item-preview-image" />
            ) : (
              <div className="preview-placeholder">No preview</div>
            )}
          </div>
          
          <div className="preview-group">
            <label>Paperdoll Preview</label>
            <ItemPreview 
              item={item} 
              gfxFolder={gfxFolder} 
              size="large"
            />
          </div>
        </div>
        
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

        {/* Item Preview */}
        {previewImage && (
          <div className="item-preview">
            <h3>Item Icon</h3>
            <img src={previewImage} alt={item.name} />
          </div>
        )}
      </div>
    </div>
  );
}

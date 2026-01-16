import React, { useState } from 'react';
import HairstyleSelector from './HairstyleSelector';
import SkinSelector from './SkinSelector';

// Hair color palette (0-indexed)
const HAIR_COLORS = [
  { id: 0, name: 'Brown', hex: '#8B4513' },
  { id: 1, name: 'Green', hex: '#228B22' },
  { id: 2, name: 'Pink', hex: '#FF69B4' },
  { id: 3, name: 'Red', hex: '#DC143C' },
  { id: 4, name: 'Yellow', hex: '#FFD700' },
  { id: 5, name: 'Blue', hex: '#1E90FF' },
  { id: 6, name: 'Purple', hex: '#9370DB' },
  { id: 7, name: 'Light Blue', hex: '#87CEEB' },
  { id: 8, name: 'White', hex: '#F0F0F0' },
  { id: 9, name: 'Black', hex: '#000000' }
];

export default function AppearanceControls({
  gender,
  setGender,
  hairStyle,
  setHairStyle,
  hairColor,
  setHairColor,
  skinTone,
  setSkinTone,
  gfxFolder,
  presets,
  onSavePreset,
  onLoadPreset,
  onDeletePreset
}) {
  const [presetName, setPresetName] = useState('');
  const [showPresets, setShowPresets] = useState(false);

  const handleSavePreset = () => {
    if (presetName.trim()) {
      onSavePreset(presetName);
      setPresetName('');
    }
  };

  return (
    <div className="appearance-controls">
      <h4>Appearance</h4>
      
      <div className="appearance-form">
        <div className="form-group">
          <label>Gender</label>
          <div className="gender-picker">
            <button
              className={`gender-button ${gender === 1 ? 'selected' : ''}`}
              onClick={() => setGender(1)}
              title="Male"
            >
              <span className="gender-icon">♂</span>
              <span className="gender-label">Male</span>
            </button>
            <button
              className={`gender-button ${gender === 0 ? 'selected' : ''}`}
              onClick={() => setGender(0)}
              title="Female"
            >
              <span className="gender-icon">♀</span>
              <span className="gender-label">Female</span>
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Hair Color</label>
          <div className="hair-color-picker">
            {HAIR_COLORS.map(color => (
              <button
                key={color.id}
                className={`color-swatch ${hairColor === color.id ? 'selected' : ''}`}
                style={{ backgroundColor: color.hex }}
                onClick={() => setHairColor(color.id)}
                title={`${color.name} (${color.id})`}
                aria-label={color.name}
              >
                {hairColor === color.id && (
                  <span className="checkmark">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Hair Style</label>
          <HairstyleSelector
            gender={gender}
            hairColor={hairColor}
            hairStyle={hairStyle}
            setHairStyle={setHairStyle}
            gfxFolder={gfxFolder}
          />
        </div>

        <div className="form-group">
          <label>Skin Tone</label>
          <SkinSelector
            gender={gender}
            hairStyle={hairStyle}
            hairColor={hairColor}
            skinTone={skinTone}
            setSkinTone={setSkinTone}
            gfxFolder={gfxFolder}
          />
        </div>
      </div>

      {/* Presets Section */}
      <div className="presets-section">
        <button 
          onClick={() => setShowPresets(!showPresets)}
          className="btn btn-secondary btn-small"
        >
          {showPresets ? 'Hide' : 'Show'} Presets ({presets.length})
        </button>

        {showPresets && (
          <div className="presets-panel">
            <div className="preset-save">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Preset name..."
                className="form-input"
                onKeyPress={(e) => e.key === 'Enter' && handleSavePreset()}
              />
              <button 
                onClick={handleSavePreset}
                className="btn btn-success btn-small"
              >
                Save
              </button>
            </div>

            {presets.length > 0 ? (
              <ul className="presets-list">
                {presets.map(preset => (
                  <li key={preset.id} className="preset-item">
                    <span className="preset-name">{preset.name}</span>
                    <div className="preset-actions">
                      <button
                        onClick={() => onLoadPreset(preset.id)}
                        className="btn btn-small btn-primary"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => onDeletePreset(preset.id)}
                        className="btn btn-small btn-danger"
                      >
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">No presets saved</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

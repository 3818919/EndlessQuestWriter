import React, { useState } from 'react';

export default function AppearanceControls({
  gender,
  setGender,
  hairStyle,
  setHairStyle,
  hairColor,
  setHairColor,
  skinTone,
  setSkinTone,
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
          <select
            value={gender}
            onChange={(e) => setGender(parseInt(e.target.value))}
            className="form-select"
          >
            <option value="0">Female</option>
            <option value="1">Male</option>
          </select>
        </div>

        <div className="form-group">
          <label>Hair Style</label>
          <input
            type="number"
            value={hairStyle}
            onChange={(e) => setHairStyle(Math.max(0, parseInt(e.target.value) || 0))}
            min="0"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Hair Color</label>
          <input
            type="number"
            value={hairColor}
            onChange={(e) => setHairColor(Math.max(0, parseInt(e.target.value) || 0))}
            min="0"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Skin Tone</label>
          <input
            type="number"
            value={skinTone}
            onChange={(e) => setSkinTone(Math.max(0, Math.min(6, parseInt(e.target.value) || 0)))}
            min="0"
            max="6"
            className="form-input"
          />
          <small className="form-hint">0-6 (7 skin tones available)</small>
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

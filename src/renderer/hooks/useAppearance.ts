import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'appearance_presets';

export function useAppearance() {
  const [gender, setGender] = useState(1); // 0 = female, 1 = male
  const [hairStyle, setHairStyle] = useState(0);
  const [hairColor, setHairColor] = useState(0);
  const [skinTone, setSkinTone] = useState(0);
  const [presets, setPresets] = useState([]);

  // Load presets from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPresets(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading appearance presets:', error);
    }
  }, []);

  // Save presets to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    } catch (error) {
      console.error('Error saving appearance presets:', error);
    }
  }, [presets]);

  const savePreset = useCallback((name) => {
    if (!name || !name.trim()) {
      alert('Please enter a preset name');
      return;
    }

    const preset = {
      id: Date.now(),
      name: name.trim(),
      gender,
      hairStyle,
      hairColor,
      skinTone
    };

    setPresets(prev => [...prev, preset]);
  }, [gender, hairStyle, hairColor, skinTone]);

  const loadPreset = useCallback((presetId) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;

    setGender(preset.gender);
    setHairStyle(preset.hairStyle);
    setHairColor(preset.hairColor);
    setSkinTone(preset.skinTone);
  }, [presets]);

  const deletePreset = useCallback((presetId) => {
    if (!confirm('Delete this preset?')) return;
    setPresets(prev => prev.filter(p => p.id !== presetId));
  }, []);

  return {
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
  };
}

import React, { useState } from 'react';
import FolderIcon from '@mui/icons-material/Folder';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import UpdateNotification from './UpdateNotification';

interface ProjectSettingsProps {
  projectName: string;
  serverPath: string | null;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onClose: () => void;
  onSave: (settings: { projectName: string; serverPath: string | null }) => void;
}

const ProjectSettings: React.FC<ProjectSettingsProps> = ({
  projectName,
  serverPath,
  theme,
  toggleTheme,
  onClose,
  onSave
}) => {
  const [name, setName] = useState(projectName);
  const [server, setServer] = useState(serverPath);
  const [nameError, setNameError] = useState('');

  const handleSelectServerFolder = async () => {
    if (!window.electronAPI) return;
    
    const result = await window.electronAPI.selectFolder();
    if (result.success && result.path) {
      setServer(result.path);
    }
  };

  const handleSave = () => {    
    if (!name || name.trim().length === 0) {
      setNameError('Project name cannot be empty');
      return;
    }
    
    if (!/^[a-zA-Z0-9_\- ]+$/.test(name)) {
      setNameError('Project name can only contain letters, numbers, spaces, hyphens, and underscores');
      return;
    }

    onSave({
      projectName: name.trim(),
      serverPath: server
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <h2>Project Settings</h2>
        
        <div className="form-group">
          <label>Theme</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={toggleTheme}
              className="button"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                flex: 1,
                justifyContent: 'center'
              }}
            >
              {theme === 'dark' ? <DarkModeIcon /> : <LightModeIcon />}
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>
          <div className="form-help" style={{ marginTop: '4px' }}>
            Switch between dark and light themes.
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '20px' }}>
          <label>Project Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameError('');
            }}
            className="form-input"
            placeholder="Enter project name"
          />
          {nameError && <div className="form-error" style={{ color: '#e74c3c', fontSize: '12px', marginTop: '4px' }}>{nameError}</div>}
          <div className="form-help" style={{ marginTop: '4px' }}>
            The name of your project. This will be displayed in the project list.
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '20px' }}>
          <label>Updates</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <UpdateNotification />
          </div>
          <div className="form-help" style={{ marginTop: '4px' }}>
            Check for application updates from GitHub releases.
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '20px' }}>
          <label>Directory</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={server || 'No folder selected'}
              readOnly
              className="form-input"
              style={{ flex: 1, cursor: 'default' }}
            />
            <button
              onClick={handleSelectServerFolder}
              className="button"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
            >
              <FolderIcon style={{ fontSize: '18px' }} />
              Browse
            </button>
          </div>
          <div className="form-help" style={{ marginTop: '4px' }}>
            Path to your EOSERV server directory or quests folder. The application will automatically detect the directory type.
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: '24px' }}>
          <button onClick={onClose} className="button button-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="button button-primary">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectSettings;

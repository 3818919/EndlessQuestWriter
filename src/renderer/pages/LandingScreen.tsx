import React, { useState, useEffect } from 'react';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import './LandingScreen.css';

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

interface ProjectConfig {
  name: string;
  gfxPath: string;
  createdAt: string;
  lastModified: string;
}

interface LandingScreenProps {
  onSelectProject: (projectName: string) => void;
  onCreateProject: (projectName: string, gfxPath: string, eifPath?: string, enfPath?: string, ecfPath?: string, esfPath?: string, dropsPath?: string) => void;
  onDeleteProject?: (projectName: string) => void;
  dataDirectoryPath: string | null;
}

const LandingScreen: React.FC<LandingScreenProps> = ({
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  dataDirectoryPath
}) => {
  const [projects, setProjects] = useState<Array<{ name: string; config: ProjectConfig }>>([]);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectGfxPath, setNewProjectGfxPath] = useState('');
  const [newProjectEifPath, setNewProjectEifPath] = useState('');
  const [newProjectEnfPath, setNewProjectEnfPath] = useState('');
  const [newProjectEcfPath, setNewProjectEcfPath] = useState('');
  const [newProjectEsfPath, setNewProjectEsfPath] = useState('');
  const [newProjectDropsPath, setNewProjectDropsPath] = useState('');

  // Load projects when component mounts
  useEffect(() => {
    if (dataDirectoryPath && isElectron && window.electronAPI) {
      loadProjects();
    }
  }, [dataDirectoryPath]);

  const loadProjects = async () => {
    if (!window.electronAPI || !dataDirectoryPath) return;

    try {
      const oaktreePath = dataDirectoryPath;
      const exists = await window.electronAPI.fileExists(oaktreePath);
      
      if (!exists) {
        setProjects([]);
        return;
      }

      const projectDirs = await window.electronAPI.listDirectories(oaktreePath);
      const loadedProjects = [];

      for (const projectName of projectDirs) {
        const configPath = `${oaktreePath}/${projectName}/config.json`;
        const configExists = await window.electronAPI.fileExists(configPath);
        
        if (configExists) {
          const result = await window.electronAPI.readTextFile(configPath);
          if (result.success) {
            const config = JSON.parse(result.data);
            loadedProjects.push({ name: projectName, config });
          }
        }
      }

      setProjects(loadedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      alert('Please enter a project name');
      return;
    }

    if (!newProjectGfxPath.trim()) {
      alert('Please select a GFX folder');
      return;
    }

    await onCreateProject(
      newProjectName.trim(), 
      newProjectGfxPath.trim(),
      newProjectEifPath.trim(),
      newProjectEnfPath.trim(),
      newProjectEcfPath.trim(),
      newProjectEsfPath.trim(),
      newProjectDropsPath.trim()
    );
    setShowCreateProject(false);
    setNewProjectName('');
    setNewProjectGfxPath('');
    setNewProjectEifPath('');
    setNewProjectEnfPath('');
    setNewProjectEcfPath('');
    setNewProjectEsfPath('');
    setNewProjectDropsPath('');
    loadProjects();
  };

  const handleSelectGfxPath = async () => {
    if (!window.electronAPI) return;
    
    const folder = await window.electronAPI.openDirectory();
    if (folder) {
      setNewProjectGfxPath(folder);
    }
  };

  const handleSelectEifPath = async () => {
    if (!window.electronAPI) return;
    
    const file = await window.electronAPI.openFile([
      { name: 'EIF Files', extensions: ['eif'] }
    ]);
    if (file) {
      setNewProjectEifPath(file);
    }
  };

  const handleSelectEnfPath = async () => {
    if (!window.electronAPI) return;
    
    const file = await window.electronAPI.openFile([
      { name: 'ENF Files', extensions: ['enf'] }
    ]);
    if (file) {
      setNewProjectEnfPath(file);
    }
  };

  const handleSelectEcfPath = async () => {
    if (!window.electronAPI) return;
    
    const file = await window.electronAPI.openFile([
      { name: 'ECF Files', extensions: ['ecf'] }
    ]);
    if (file) {
      setNewProjectEcfPath(file);
    }
  };

  const handleSelectEsfPath = async () => {
    if (!window.electronAPI) return;
    
    const file = await window.electronAPI.openFile([
      { name: 'ESF Files', extensions: ['esf'] }
    ]);
    if (file) {
      setNewProjectEsfPath(file);
    }
  };

  const handleSelectDropsPath = async () => {
    if (!window.electronAPI) return;
    
    const file = await window.electronAPI.openFile([
      { name: 'Text Files', extensions: ['txt'] }
    ]);
    if (file) {
      setNewProjectDropsPath(file);
    }
  };

  const handleDeleteProject = async (projectName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent project selection when clicking delete
    
    if (!window.electronAPI || !dataDirectoryPath) return;
    
    const confirmed = confirm(`Are you sure you want to delete project "${projectName}"?\n\nThis will delete all project files and cannot be undone.`);
    if (!confirmed) return;
    
    try {
      const projectPath = `${dataDirectoryPath}/${projectName}`;
      await window.electronAPI.deleteDirectory(projectPath);
      
      if (onDeleteProject) {
        onDeleteProject(projectName);
      }
      
      // Reload projects list
      loadProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error deleting project: ' + error.message);
    }
  };

  return (
    <>
      <div className="landing-screen">
        <div className="landing-content">
          <h1 className="landing-title">OakTree</h1>
          
          <p className="landing-subtitle">
            Select a project or create a new one
          </p>
          
          <div className="projects-list">
            {projects.map(({ name, config }) => (
              <div 
                key={name} 
                className="project-card"
                onClick={() => onSelectProject(name)}
              >
                <div className="project-icon">
                  <InsertDriveFileIcon />
                </div>
                <div className="project-info">
                  <div className="project-name">{config.name}</div>
                  <div className="project-details">
                    GFX: {config.gfxPath}
                  </div>
                  <div className="project-date">
                    Last modified: {new Date(config.lastModified).toLocaleDateString()}
                  </div>
                </div>
                <button 
                  className="project-delete-btn"
                  onClick={(e) => handleDeleteProject(name, e)}
                  title="Delete project"
                >
                  <DeleteIcon fontSize="small" />
                </button>
              </div>
            ))}
            
            <div 
              className="project-card project-card-new"
              onClick={() => setShowCreateProject(true)}
            >
              <div className="project-icon">
                <AddIcon />
              </div>
              <div className="project-info">
                <div className="project-name">Create New Project</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCreateProject && (
        <div className="modal-overlay" onClick={() => setShowCreateProject(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Project</h2>
            
            <div className="form-group">
              <label>Project Name</label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="My Project"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>GFX Folder Path</label>
              <div className="input-with-button">
                <input
                  type="text"
                  value={newProjectGfxPath}
                  onChange={(e) => setNewProjectGfxPath(e.target.value)}
                  placeholder="/path/to/gfx"
                  className="form-control"
                  readOnly={isElectron}
                />
                {isElectron && (
                  <button onClick={handleSelectGfxPath} className="btn btn-secondary">
                    Browse
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Items File (EIF) - Optional</label>
              <div className="input-with-button">
                <input
                  type="text"
                  value={newProjectEifPath}
                  onChange={(e) => setNewProjectEifPath(e.target.value)}
                  placeholder="/path/to/items.eif"
                  className="form-control"
                  readOnly={isElectron}
                />
                {isElectron && (
                  <button onClick={handleSelectEifPath} className="btn btn-secondary">
                    Browse
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>NPCs File (ENF) - Optional</label>
              <div className="input-with-button">
                <input
                  type="text"
                  value={newProjectEnfPath}
                  onChange={(e) => setNewProjectEnfPath(e.target.value)}
                  placeholder="/path/to/npcs.enf"
                  className="form-control"
                  readOnly={isElectron}
                />
                {isElectron && (
                  <button onClick={handleSelectEnfPath} className="btn btn-secondary">
                    Browse
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Classes File (ECF) - Optional</label>
              <div className="input-with-button">
                <input
                  type="text"
                  value={newProjectEcfPath}
                  onChange={(e) => setNewProjectEcfPath(e.target.value)}
                  placeholder="/path/to/classes.ecf"
                  className="form-control"
                  readOnly={isElectron}
                />
                {isElectron && (
                  <button onClick={handleSelectEcfPath} className="btn btn-secondary">
                    Browse
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Skills File (ESF) - Optional</label>
              <div className="input-with-button">
                <input
                  type="text"
                  value={newProjectEsfPath}
                  onChange={(e) => setNewProjectEsfPath(e.target.value)}
                  placeholder="/path/to/skills.esf"
                  className="form-control"
                  readOnly={isElectron}
                />
                {isElectron && (
                  <button onClick={handleSelectEsfPath} className="btn btn-secondary">
                    Browse
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Drops File (drops.txt) - Optional</label>
              <div className="input-with-button">
                <input
                  type="text"
                  value={newProjectDropsPath}
                  onChange={(e) => setNewProjectDropsPath(e.target.value)}
                  placeholder="/path/to/drops.txt"
                  className="form-control"
                  readOnly={isElectron}
                />
                {isElectron && (
                  <button onClick={handleSelectDropsPath} className="btn btn-secondary">
                    Browse
                  </button>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={handleCreateProject} className="btn btn-primary">
                Create Project
              </button>
              <button onClick={() => setShowCreateProject(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LandingScreen;

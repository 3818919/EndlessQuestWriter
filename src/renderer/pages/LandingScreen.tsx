import React, { useState, useEffect } from 'react';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import LinkIcon from '@mui/icons-material/Link';
import DeleteIcon from '@mui/icons-material/Delete';
import './LandingScreen.css';


const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

interface ProjectConfig {
  name: string;
  serverPath: string;
  createdAt: string;
  lastModified: string;
}

interface LandingScreenProps {
  onSelectProject: (projectName: string) => void;
  onLinkProject: (projectName: string, serverPath: string) => void;
  onDeleteProject?: (projectName: string) => void;
}

const LandingScreen: React.FC<LandingScreenProps> = ({
  onSelectProject,
  onLinkProject,
  onDeleteProject
}) => {
  const [projects, setProjects] = useState<Array<{ name: string; config: ProjectConfig }>>([]);
  const [appDataPath, setAppDataPath] = useState<string | null>(null);
  const [showLinkProject, setShowLinkProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectServerPath, setNewProjectServerPath] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);

  
  useEffect(() => {
    const initAppDataPath = async () => {
      if (isElectron && window.electronAPI) {
        const homeDir = await window.electronAPI.getHomeDir();
        setAppDataPath(`${homeDir}/.endless-quest-writer`);
      }
    };
    initAppDataPath();
  }, []);

  
  useEffect(() => {
    if (appDataPath && isElectron && window.electronAPI) {
      loadProjects();
    }
  }, [appDataPath]);

  const loadProjects = async () => {
    if (!window.electronAPI || !appDataPath) return;

    setIsLoading(true);
    try {
      const exists = await window.electronAPI.fileExists(appDataPath);
      
      if (!exists) {
        setProjects([]);
        return;
      }

      const projectDirs = await window.electronAPI.listDirectories(appDataPath);
      
      if (projectDirs.length === 0) {
        setProjects([]);
        return;
      }

      
      const configPaths = projectDirs.map(name => `${appDataPath}/${name}/config.json`);
      
      
      const batchResults = await window.electronAPI.readTextBatch(configPaths);
      
      
      const loadedProjects: Array<{ name: string; config: ProjectConfig }> = [];
      
      for (let i = 0; i < projectDirs.length; i++) {
        const projectName = projectDirs[i];
        const configPath = configPaths[i];
        const result = batchResults[configPath];
        
        if (result?.success && result.data) {
          try {
            const config = JSON.parse(result.data);
            loadedProjects.push({ name: projectName, config });
          } catch (parseError) {
            console.warn(`Failed to parse config for ${projectName}:`, parseError);
          }
        }
      }

      setProjects(loadedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkProject = async () => {
    if (!newProjectName.trim()) {
      alert('Please enter a project name');
      return;
    }

    if (!newProjectServerPath.trim()) {
      alert('Please select a server directory');
      return;
    }

    
    if (window.electronAPI) {
      const questsPath = `${newProjectServerPath}/data/quests`;
      const questsExists = await window.electronAPI.fileExists(questsPath);
      
      if (!questsExists) {
        const createQuests = confirm('The selected directory does not have a "data/quests" folder. Would you like to create one?');
        if (createQuests) {
          await window.electronAPI.ensureDir(questsPath);
        }
      }
    }

    await onLinkProject(newProjectName.trim(), newProjectServerPath.trim());
    setShowLinkProject(false);
    setNewProjectName('');
    setNewProjectServerPath('');
    
    await onSelectProject(newProjectName.trim());
  };

  const handleSelectServerPath = async () => {
    if (!window.electronAPI) return;
    
    const result = await window.electronAPI.selectFolder();
    if (result.success && result.path) {
      setNewProjectServerPath(result.path);
      
      
      if (!newProjectName.trim()) {
        const folderName = result.path.split('/').pop() || result.path.split('\\').pop() || '';
        setNewProjectName(folderName);
      }
    }
  };

  const handleDeleteProject = async (projectName: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    
    if (!window.electronAPI || !appDataPath) return;
    
    const confirmed = confirm(`Are you sure you want to unlink project "${projectName}"?\n\nThis will only remove the project link, not your quest files.`);
    if (!confirmed) return;
    
    try {
      const projectPath = `${appDataPath}/${projectName}`;
      await window.electronAPI.deleteDirectory(projectPath);
      
      if (onDeleteProject) {
        onDeleteProject(projectName);
      }
      
      
      loadProjects();
    } catch (error: any) {
      console.error('Error deleting project:', error);
      alert('Error deleting project: ' + error.message);
    }
  };

  return (
    <>
      <div className="landing-screen">
        <div className="landing-content">
          <h1 className="landing-title">Endless Quest Writer</h1>
          
          <p className="landing-subtitle">
            Select a linked server or link a new one
          </p>
          
          <div className="projects-list">
            {isLoading ? (
              <div style={{ 
                padding: '40px', 
                textAlign: 'center', 
                color: '#808080',
                gridColumn: '1 / -1'
              }}>
                Loading projects...
              </div>
            ) : isSelecting ? (
              <div style={{ 
                padding: '40px', 
                textAlign: 'center', 
                color: '#808080',
                gridColumn: '1 / -1'
              }}>
                Loading quests...
              </div>
            ) : null}
            {!isLoading && projects.map(({ name, config }) => (
              <div 
                key={name} 
                className="project-card"
                onClick={async () => {
                  setIsSelecting(true);
                  await onSelectProject(name);
                  setIsSelecting(false);
                }}
                style={{ opacity: isSelecting ? 0.6 : 1, pointerEvents: isSelecting ? 'none' : 'auto' }}
              >
                <div className="project-icon">
                  <FolderOpenIcon />
                </div>
                <div className="project-info">
                  <div className="project-name">{config.name}</div>
                  <div className="project-details">
                    Server: {config.serverPath}
                  </div>
                  <div className="project-date">
                    Last modified: {new Date(config.lastModified).toLocaleDateString()}
                  </div>
                </div>
                <button 
                  className="project-delete-btn"
                  onClick={(e) => handleDeleteProject(name, e)}
                  title="Unlink project"
                >
                  <DeleteIcon fontSize="small" />
                </button>
              </div>
            ))}
            
            {!isLoading && !isSelecting && (
            <div 
              className="project-card project-card-new"
              onClick={() => setShowLinkProject(true)}
            >
              <div className="project-icon">
                <LinkIcon />
              </div>
              <div className="project-info">
                <div className="project-name">Link Server Directory</div>
                <div className="project-details">
                  Connect to an existing EOSERV server
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>

      {showLinkProject && (
        <div className="modal-overlay" onClick={() => setShowLinkProject(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Link Server Directory</h2>
            
            <div className="form-group">
              <label>Project Name</label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="My Server"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Server Directory</label>
              <p className="form-help">
                Select the root directory of your EOSERV server (contains data/, quests/, etc.)
              </p>
              <div className="input-with-button">
                <input
                  type="text"
                  value={newProjectServerPath}
                  onChange={(e) => setNewProjectServerPath(e.target.value)}
                  placeholder="/path/to/server"
                  className="form-control"
                  readOnly={isElectron}
                />
                {isElectron && (
                  <button onClick={handleSelectServerPath} className="btn btn-secondary">
                    Browse
                  </button>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={handleLinkProject} className="btn btn-primary">
                Link Server
              </button>
              <button onClick={() => setShowLinkProject(false)} className="btn btn-secondary">
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

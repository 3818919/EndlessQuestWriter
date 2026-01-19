import React, { useState } from 'react';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import '../pages/LandingScreen.css';

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

interface LandingScreenProps {
  onLoadEIFFile: () => void;
  onSelectGfxFolder: () => void;
  onLoadEIFFromPath: (path: string) => void;
  onSelectGfxFromPath: (path: string) => void;
  hasEIFFile: boolean;
  hasGfxFolder: boolean;
  eifFileName: string | null;
  gfxFolderPath: string;
}

const LandingScreen: React.FC<LandingScreenProps> = ({
  onLoadEIFFile,
  onSelectGfxFolder,
  onLoadEIFFromPath,
  onSelectGfxFromPath,
  hasEIFFile,
  hasGfxFolder,
  eifFileName,
  gfxFolderPath
}) => {
  const [eifDragOver, setEifDragOver] = useState(false);
  const [gfxDragOver, setGfxDragOver] = useState(false);

  const handleEifDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEifDragOver(true);
  };

  const handleEifDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEifDragOver(false);
  };

  const handleEifDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEifDragOver(false);

    if (isElectron && window.electronAPI) {
      // In Electron, get the file path from the drag event
      const files = Array.from(e.dataTransfer.files);
      const eifFile = files.find(f => f.name.endsWith('.eif'));
      if (eifFile && 'path' in eifFile) {
        onLoadEIFFromPath((eifFile as ElectronFile).path);
      }
    } else {
      // Browser - use File API
      const files = Array.from(e.dataTransfer.files);
      const eifFile = files.find(f => f.name.endsWith('.eif'));
      if (eifFile) {
        // Trigger file load through the existing mechanism
        onLoadEIFFile();
      }
    }
  };

  const handleGfxDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setGfxDragOver(true);
  };

  const handleGfxDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setGfxDragOver(false);
  };

  const handleGfxDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setGfxDragOver(false);

    if (isElectron && window.electronAPI) {
      // In Electron, check if we got a folder
      const items = Array.from(e.dataTransfer.items);
      if (items.length > 0) {
        const item = items[0];
        // Try to get the file path
        const file = item.getAsFile();
        if (file && 'path' in file) {
          let path = (file as File & { path?: string }).path || '';
          // Check if it's a directory
          const isDir = await window.electronAPI.isDirectory(path);
          if (isDir) {
            onSelectGfxFromPath(path);
          } else {
            // If it's a file, use its parent directory
            const dirPath = path.substring(0, path.lastIndexOf('/'));
            onSelectGfxFromPath(dirPath);
          }
        }
      }
    }
  };

  return (
    <div className="landing-screen">
      <div className="landing-content">
        <h1 className="landing-title">OakTree</h1>
        <p className="landing-subtitle">
          Select your item file and graphics folder to begin
        </p>

        <div className="landing-drop-zones">
          <div 
            className={`drop-zone ${hasEIFFile ? 'has-file' : ''} ${eifDragOver ? 'drag-over' : ''}`}
            onClick={onLoadEIFFile}
            onDragOver={handleEifDragOver}
            onDragLeave={handleEifDragLeave}
            onDrop={handleEifDrop}
          >
            <div className="drop-zone-icon">
              <InsertDriveFileIcon />
            </div>
            <div className="drop-zone-text">
              {hasEIFFile ? (
                <>
                  <div className="drop-zone-title">Item File</div>
                  <div className="drop-zone-file">{eifFileName}</div>
                  <div className="drop-zone-hint">Click to change</div>
                </>
              ) : (
                <>
                  <div className="drop-zone-title">Item File (EIF)</div>
                  <div className="drop-zone-hint">Click or drop .eif file</div>
                </>
              )}
            </div>
          </div>

          <div 
            className={`drop-zone ${hasGfxFolder ? 'has-file' : ''} ${gfxDragOver ? 'drag-over' : ''}`}
            onClick={onSelectGfxFolder}
            onDragOver={handleGfxDragOver}
            onDragLeave={handleGfxDragLeave}
            onDrop={handleGfxDrop}
          >
            <div className="drop-zone-icon">
              <FolderOpenIcon />
            </div>
            <div className="drop-zone-text">
              {hasGfxFolder ? (
                <>
                  <div className="drop-zone-title">Graphics Folder</div>
                  <div className="drop-zone-file">{gfxFolderPath}</div>
                  <div className="drop-zone-hint">Click to change</div>
                </>
              ) : (
                <>
                  <div className="drop-zone-title">Graphics Folder (GFX)</div>
                  <div className="drop-zone-hint">Click or drop folder</div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="landing-footer">
          Both selections are required to continue
        </div>
      </div>
    </div>
  );
};

export default LandingScreen;

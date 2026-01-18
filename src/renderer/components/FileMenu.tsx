import React, { useState } from 'react';
import MenuIcon from '@mui/icons-material/Menu';

interface FileMenuProps {
  onSave: () => void;
  onImportItems: () => void;
  onImportNpcs: () => void;
  onImportDrops: () => void;
  onImportClasses: () => void;
  onImportSkills: () => void;
  onExportNpcs: () => void;
  onExportItems: () => void;
  onExportDrops: () => void;
  onExportClasses: () => void;
  onExportSkills: () => void;
  disabled?: boolean;
}

const FileMenu: React.FC<FileMenuProps> = ({ 
  onSave,
  onImportItems,
  onImportNpcs,
  onImportDrops,
  onImportClasses,
  onImportSkills,
  onExportNpcs, 
  onExportItems, 
  onExportDrops,
  onExportClasses,
  onExportSkills, 
  disabled 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleImportItems = () => {
    setIsOpen(false);
    onImportItems();
  };

  const handleImportNpcs = () => {
    setIsOpen(false);
    onImportNpcs();
  };

  const handleImportDrops = () => {
    setIsOpen(false);
    onImportDrops();
  };

  const handleImportClasses = () => {
    setIsOpen(false);
    onImportClasses();
  };

  const handleImportSkills = () => {
    setIsOpen(false);
    onImportSkills();
  };

  const handleExportNpcs = () => {
    setIsOpen(false);
    onExportNpcs();
  };

  const handleExportItems = () => {
    setIsOpen(false);
    onExportItems();
  };

  const handleExportDrops = () => {
    setIsOpen(false);
    onExportDrops();
  };

  const handleExportClasses = () => {
    setIsOpen(false);
    onExportClasses();
  };

  const handleExportSkills = () => {
    setIsOpen(false);
    onExportSkills();
  };

  const handleSave = () => {
    setIsOpen(false);
    onSave();
  };

  return (
    <div className="file-menu-sidebar">
      <button
        className="left-sidebar-button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        title="File Menu"
      >
        <MenuIcon />
      </button>
      
      {isOpen && (
        <>
          <div className="file-menu-overlay" onClick={() => setIsOpen(false)} />
          <div className="file-menu-dropdown-sidebar">
            <button className="file-menu-item" onClick={handleSave}>
              <span>Save</span>
              <span className="file-menu-shortcut">{navigator.platform.includes('Mac') ? '⌘S' : 'Ctrl+S'}</span>
            </button>
            <div className="file-menu-divider"></div>
            <div className="file-menu-section">
              <div className="file-menu-section-title">Import</div>
              <button className="file-menu-item" onClick={handleImportItems}>
                <span>Items (.eif)</span>
              </button>
              <button className="file-menu-item" onClick={handleImportNpcs}>
                <span>NPCs (.enf)</span>
              </button>
              <button className="file-menu-item" onClick={handleImportClasses}>
                <span>Classes (.ecf)</span>
              </button>
              <button className="file-menu-item" onClick={handleImportSkills}>
                <span>Skills (.esf)</span>
              </button>
              <button className="file-menu-item" onClick={handleImportDrops}>
                <span>Drops (.txt)</span>
              </button>
            </div>
            <div className="file-menu-section">
              <div className="file-menu-section-title">Export</div>
              <button className="file-menu-item" onClick={handleExportItems}>
                <span>Items (.eif)</span>
              </button>
              <button className="file-menu-item" onClick={handleExportNpcs}>
                <span>NPCs (.enf)</span>
              </button>
              <button className="file-menu-item" onClick={handleExportClasses}>
                <span>Classes (.ecf)</span>
              </button>
              <button className="file-menu-item" onClick={handleExportSkills}>
                <span>Skills (.esf)</span>
              </button>
              <button className="file-menu-item" onClick={handleExportDrops}>
                <span>Drops (.txt)</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FileMenu;

import React, { useState, useMemo, useEffect } from 'react';
import { ItemType } from 'eolib';
import ItemPreview from './ItemPreview';
import ListFilter from '../ListFilter';
import GenericList, { ListItem } from '../GenericList';
import FilterPopup from '../FilterPopup';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

// Helper to get ItemType name from enum value
const getItemTypeName = (type: number): string => {
  return ItemType[type] || 'Unknown';
};

// Helper to get all item type options for filter dropdown
const getItemTypeOptions = () => {
  return Object.entries(ItemType)
    .filter(([key]) => isNaN(Number(key))) // Filter out reverse mappings
    .map(([key, value]) => ({ value: value as number, label: key }));
};

export default function ItemList({
  items,
  selectedItemId,
  onSelectItem,
  onAddItem,
  onDeleteItem: _onDeleteItem,
  onDuplicateItem: _onDuplicateItem,
  onLoadFile,
  currentFile,
  onSelectGfxFolder,
  gfxFolder,
  loadGfx,
  preloadGfxBatch,
  onEquipItem,
  showSettingsModal,
  setShowSettingsModal,
  leftPanelMinimized,
  onResetFileSelection,
  onLoadEIFFromPath,
  onSelectGfxFromPath,
  currentProject
}: {
  items: Record<number, any>;
  selectedItemId: number | null;
  onSelectItem: (id: number) => void;
  onAddItem: () => void;
  onDeleteItem: (id: number) => void;
  onDuplicateItem: (id: number) => void;
  onLoadFile: () => void;
  currentFile: string | null;
  onSelectGfxFolder: () => void;
  gfxFolder: string | null;
  loadGfx: (gfxNumber: number, resourceId?: number) => Promise<any>;
  preloadGfxBatch?: (requests: Array<{ gfxNumber: number; resourceId: number }>) => void;
  onEquipItem?: (item: any) => void;
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;
  leftPanelMinimized: boolean;
  onResetFileSelection: () => void;
  onLoadEIFFromPath: (path: string) => void;
  onSelectGfxFromPath: (path: string) => void;
  currentProject?: string;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [eifDragOver, setEifDragOver] = useState(false);
  const [gfxDragOver, setGfxDragOver] = useState(false);
  const [_scrollToSelected, setScrollToSelected] = useState(false);
  const prevSelectedItemId = React.useRef(selectedItemId);

  // Memoize filtered items
  const filteredItems = useMemo(() => {
    const itemArray = Object.values(items);
    
    return itemArray.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.id.toString().includes(searchQuery);
      const matchesType = typeFilter === 'all' || (item.type !== undefined && item.type.toString() === typeFilter);
      
      return matchesSearch && matchesType;
    });
  }, [items, searchQuery, typeFilter]);

  // Detect when item is selected externally (e.g., from drops table)
  useEffect(() => {
    if (selectedItemId !== null && selectedItemId !== prevSelectedItemId.current) {
      // Check if the selected item is in the current filtered list
      const isInFilteredList = filteredItems.some(item => item.id === selectedItemId);
      
      // Only clear search/filters if the item is NOT in the current filtered list
      // This means it was selected from an external source (like drops table)
      if (!isInFilteredList) {
        setSearchQuery('');
        setTypeFilter('all');
      }
      
      // Delay scroll to ensure DOM has updated
      setTimeout(() => {
        setScrollToSelected(true);
        // Reset after scrolling completes
        const timer = setTimeout(() => setScrollToSelected(false), 1000);
        return () => clearTimeout(timer);
      }, 100);
      
      prevSelectedItemId.current = selectedItemId;
    }
    prevSelectedItemId.current = selectedItemId;
  }, [selectedItemId, filteredItems]);

  // Preload visible items' graphics when the component mounts or items change
  useEffect(() => {
    if (!preloadGfxBatch || !gfxFolder) return;

    // Get first ~50 items to preload (visible viewport range)
    const itemsToPreload = Object.values(items).slice(0, 50);
    const preloadRequests: Array<{ gfxNumber: number; resourceId: number }> = [];

    itemsToPreload.forEach((item: any) => {
      if (item.graphic) {
        // Preload icon graphics (GFX 23)
        const iconResourceId = (2 * item.graphic) + 100;
        preloadRequests.push({ gfxNumber: 23, resourceId: iconResourceId });
      }
    });

    // Start background preloading (non-blocking)
    if (preloadRequests.length > 0) {
      // Defer slightly to not block initial render
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => {
          preloadGfxBatch(preloadRequests);
        }, { timeout: 500 });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          preloadGfxBatch(preloadRequests);
        }, 100);
      }
    }
  }, [items, gfxFolder, preloadGfxBatch]);

  // Drag and drop handlers for EIF
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
      const files = Array.from(e.dataTransfer.files);
      const eifFile = files.find(f => f.name.endsWith('.eif'));
      if (eifFile && 'path' in eifFile) {
        onLoadEIFFromPath((eifFile as ElectronFile).path);
      }
    } else {
      const files = Array.from(e.dataTransfer.files);
      const eifFile = files.find(f => f.name.endsWith('.eif'));
      if (eifFile) {
        onLoadFile();
      }
    }
  };

  // Drag and drop handlers for GFX
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
      const items = Array.from(e.dataTransfer.items);
      if (items.length > 0) {
        const item = items[0];
        const file = item.getAsFile();
        if (file && 'path' in file) {
          const path = (file as ElectronFile).path;
          const isDir = await window.electronAPI.isDirectory(path);
          if (isDir) {
            onSelectGfxFromPath(path);
          } else {
            const dirPath = path.substring(0, path.lastIndexOf('/'));
            onSelectGfxFromPath(dirPath);
          }
        }
      }
    }
  };

  const listItems: ListItem[] = useMemo(() => {
    return filteredItems.map(item => ({
      id: item.id,
      name: item.name,
      icon: (
        <ItemPreview 
          item={item} 
          gfxFolder={gfxFolder} 
          loadGfx={loadGfx}
          size="small"
          lazy={true}
          mode="icon"
        />
      ),
      secondaryText: getItemTypeName(item.type),
      hoverText: leftPanelMinimized ? `${item.name} (#${item.id})` : getItemTypeName(item.type),
      data: item
    }));
  }, [filteredItems, gfxFolder, loadGfx, leftPanelMinimized]);

  const handleDragStart = (e, listItem: ListItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(listItem.data));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDoubleClick = (listItem: ListItem) => {
    const item = listItem.data;
    // Only equip if it's an equippable item type (10-21)
    if (item.type >= 10 && item.type <= 21 && onEquipItem) {
      onEquipItem(item);
    }
  };

  return (
    <>
      <FilterPopup
        show={showFilterPopup}
        onClose={() => setShowFilterPopup(false)}
        title="Search & Filter"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search items..."
      >
        <select 
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="type-filter"
        >
          <option value="all">All Types</option>
          {getItemTypeOptions().map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </FilterPopup>
      
      <div className={`item-list-content ${leftPanelMinimized ? 'minimized' : ''}`}>
        <ListFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search items..."
          minimized={leftPanelMinimized}
          onToggleSearch={() => setShowFilterPopup(!showFilterPopup)}
        >
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="type-filter"
          >
            <option value="all">All Types</option>
            {getItemTypeOptions().map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <button 
            onClick={onAddItem}
            className="btn btn-success btn-small"
            disabled={!currentFile && !currentProject}
          >
            + Add Item
          </button>
        </ListFilter>

        <GenericList
          items={listItems}
          selectedId={selectedItemId}
          onSelectItem={onSelectItem}
          onDoubleClick={handleDoubleClick}
          minimized={leftPanelMinimized}
          emptyMessage={currentFile ? 'No items match your search' : 'No file loaded'}
          draggable={true}
          onDragStart={handleDragStart}
        />
      </div>

      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
            <h2>File Settings</h2>
            
            <div className="settings-drop-zones">
              <div 
                className={`settings-drop-zone ${currentFile ? 'has-file' : ''} ${eifDragOver ? 'drag-over' : ''}`}
                onClick={onLoadFile}
                onDragOver={handleEifDragOver}
                onDragLeave={handleEifDragLeave}
                onDrop={handleEifDrop}
              >
                <div className="drop-zone-icon">
                  <InsertDriveFileIcon />
                </div>
                <div className="drop-zone-text">
                  {currentFile ? (
                    <>
                      <div className="drop-zone-title">Item File</div>
                      <div className="drop-zone-file">{currentFile}</div>
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
                className={`settings-drop-zone ${gfxFolder ? 'has-file' : ''} ${gfxDragOver ? 'drag-over' : ''}`}
                onClick={onSelectGfxFolder}
                onDragOver={handleGfxDragOver}
                onDragLeave={handleGfxDragLeave}
                onDrop={handleGfxDrop}
              >
                <div className="drop-zone-icon">
                  <FolderOpenIcon />
                </div>
                <div className="drop-zone-text">
                  {gfxFolder ? (
                    <>
                      <div className="drop-zone-title">Graphics Folder</div>
                      <div className="drop-zone-file">{gfxFolder}</div>
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

            <div className="modal-actions">
              <button 
                onClick={() => {
                  if (confirm('This will clear your file selections and return to the landing page. Continue?')) {
                    onResetFileSelection();
                    setShowSettingsModal(false);
                  }
                }} 
                className="btn btn-danger modal-action-btn"
              >
                Reset File Selection
              </button>
              <button 
                onClick={() => setShowSettingsModal(false)} 
                className="btn btn-secondary modal-action-btn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

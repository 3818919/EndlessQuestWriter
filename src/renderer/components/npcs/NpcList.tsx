import React, { useState, useMemo, useEffect } from 'react';
import ListFilter from '../ListFilter';
import GenericList, { ListItem } from '../GenericList';
import FilterPopup from '../FilterPopup';
import NpcIcon from './NpcIcon';

interface Npc {
  id: number;
  name: string;
  graphic: number;
  hp: number;
  minDamage: number;
  maxDamage: number;
  accuracy: number;
  evade: number;
  armor: number;
  exp: number;
}

interface NpcListProps {
  npcs: { [key: number]: Npc };
  selectedNpcId: number | null;
  onSelectNpc: (id: number) => void;
  onAddNpc: () => void;
  onDeleteNpc: (id: number) => void;
  onDuplicateNpc: (id: number) => void;
  currentFile: string | null;
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;
  leftPanelMinimized: boolean;
  onResetFileSelection: () => void;
  loadGfx: (gfxNumber: number, resourceId?: number) => Promise<string | null>;
  gfxFolder: string | null;
  preloadGfxBatch?: (requests: Array<{ gfxNumber: number; resourceId: number }>) => void;
  currentProject?: string;
}

const NpcList: React.FC<NpcListProps> = ({
  npcs,
  selectedNpcId,
  onSelectNpc,
  onAddNpc,
  onDeleteNpc: _onDeleteNpc,
  onDuplicateNpc: _onDuplicateNpc,
  currentFile,
  showSettingsModal: _showSettingsModal,
  setShowSettingsModal: _setShowSettingsModal,
  leftPanelMinimized,
  onResetFileSelection: _onResetFileSelection,
  loadGfx,
  gfxFolder,
  preloadGfxBatch,
  currentProject
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPopup, setShowFilterPopup] = useState(false);

  // Preload visible NPCs' graphics progressively when component mounts
  useEffect(() => {
    if (!preloadGfxBatch || !gfxFolder) return;

    // Only preload first 10 NPCs (visible viewport) progressively
    const npcsToPreload = Object.values(npcs).slice(0, 10);
    
    // Load them one at a time with small delays to avoid blocking UI
    npcsToPreload.forEach((npc: Npc, index) => {
      if (npc.graphic) {
        const baseGfx = (npc.graphic - 1) * 40;
        const resourceId = baseGfx + 1 + 100;
        
        // Stagger each load by 50ms to prevent blocking
        setTimeout(() => {
          preloadGfxBatch([{ gfxNumber: 21, resourceId }]);
        }, index * 50);
      }
    });
  }, [npcs, gfxFolder, preloadGfxBatch]);

  const filteredNpcs = useMemo(() => {
    return Object.values(npcs)
      .filter(npc => {
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return npc.name.toLowerCase().includes(query) || 
                 npc.id.toString().includes(query);
        }
        return true;
      })
      .sort((a, b) => a.id - b.id);
  }, [npcs, searchQuery]);

  const listItems: ListItem[] = useMemo(() => {
    return filteredNpcs.map(npc => ({
      id: npc.id,
      name: npc.name,
      icon: (
        <NpcIcon 
          graphic={npc.graphic}
          loadGfx={loadGfx}
          gfxFolder={gfxFolder}
          size="small"
        />
      ),
      hoverText: leftPanelMinimized ? `${npc.name} (#${npc.id})` : `HP: ${npc.hp} | XP: ${npc.exp}`,
      data: npc
    }));
  }, [filteredNpcs, leftPanelMinimized, loadGfx, gfxFolder]);

  return (
    <>
      <FilterPopup
        show={showFilterPopup}
        onClose={() => setShowFilterPopup(false)}
        title="Search NPCs"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search NPCs..."
      />
      
      <div className={`item-list-content ${leftPanelMinimized ? 'minimized' : ''}`}>
        <ListFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search NPCs..."
          minimized={leftPanelMinimized}
          onToggleSearch={() => setShowFilterPopup(!showFilterPopup)}
        >
          <button 
            onClick={onAddNpc}
            className="btn btn-success btn-small"
            disabled={!currentFile && !currentProject}
          >
            + Add NPC
          </button>
        </ListFilter>

        <GenericList
          items={listItems}
          selectedId={selectedNpcId}
          onSelectItem={onSelectNpc}
          minimized={leftPanelMinimized}
          emptyMessage={currentFile ? 'No NPCs match your search' : 'No file loaded'}
        />
      </div>
    </>
  );
};

export default NpcList;

import React, { useState, useMemo } from 'react';
import { InnRecord } from 'eolib';
import ListFilter from '../ListFilter';
import GenericList, { ListItem } from '../GenericList';
import FilterPopup from '../FilterPopup';
import HotelIcon from '@mui/icons-material/Hotel';

interface InnListProps {
  inns: InnRecord[];
  selectedInn: InnRecord | null;
  onSelectInn: (inn: InnRecord) => void;
  onAddInn: () => void;
  onDeleteInn: (inn: InnRecord) => void;
  onDuplicateInn: (inn: InnRecord) => void;
  currentFile: string | null;
  leftPanelMinimized: boolean;
  currentProject?: string;
}

export default function InnList({ 
  inns, 
  selectedInn, 
  onSelectInn, 
  onAddInn,
  onDeleteInn: _onDeleteInn,
  onDuplicateInn: _onDuplicateInn,
  currentFile,
  leftPanelMinimized,
  currentProject
}: InnListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPopup, setShowFilterPopup] = useState(false);

  const filteredInns = useMemo(() => {
    return inns.filter(inn => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const index = inns.indexOf(inn);
        return inn.name.toLowerCase().includes(query) || 
               index.toString().includes(query) ||
               inn.spawnMap.toString().includes(query);
      }
      return true;
    });
  }, [inns, searchQuery]);

  const listItems: ListItem[] = useMemo(() => {
    return filteredInns.map(inn => {
      const index = inns.indexOf(inn);
      return {
        id: index,
        name: inn.name || 'Unnamed Inn',
        icon: <HotelIcon sx={{ fontSize: 24, color: inn.behaviorId > 0 ? '#4CAF50' : '#999' }} />,
        hoverText: leftPanelMinimized 
          ? `${inn.name} (Map ${inn.spawnMap})` 
          : `Map ${inn.spawnMap} (${inn.spawnX}, ${inn.spawnY})${inn.behaviorId > 0 ? ` • NPC ${inn.behaviorId}` : ''}`,
        data: inn
      };
    });
  }, [filteredInns, inns, leftPanelMinimized]);

  const selectedId = selectedInn ? inns.indexOf(selectedInn) : null;

  const handleSelect = (id: number) => {
    onSelectInn(inns[id]);
  };

  return (
    <>
      <FilterPopup
        show={showFilterPopup}
        onClose={() => setShowFilterPopup(false)}
        title="Search Inns"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search inns..."
      />
      
      <div className={`item-list-content ${leftPanelMinimized ? 'minimized' : ''}`}>
        <ListFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search inns..."
          minimized={leftPanelMinimized}
          onToggleSearch={() => setShowFilterPopup(!showFilterPopup)}
        />

        <GenericList
          items={listItems}
          selectedId={selectedId}
          onSelectItem={handleSelect}
          minimized={leftPanelMinimized}
          emptyMessage={currentFile ? 'No inns match your search' : 'No file loaded'}
        />

        {(currentFile || currentProject) && (
          <div style={{
            padding: '8px',
            borderTop: '1px solid var(--border-primary)',
            backgroundColor: 'var(--bg-secondary)'
          }}>
            <button 
              onClick={onAddInn}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span>+</span>
              {!leftPanelMinimized && <span>New Inn</span>}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

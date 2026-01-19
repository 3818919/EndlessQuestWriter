import React, { useState, useMemo, useEffect } from 'react';
import ListFilter from '../ListFilter';
import GenericList, { ListItem } from '../GenericList';
import FilterPopup from '../FilterPopup';

export default function ClassList({
  classes,
  selectedClassId,
  onSelectClass,
  onAddClass,
  onDeleteClass,
  onDuplicateClass,
  showSettingsModal,
  setShowSettingsModal,
  leftPanelMinimized
}: {
  classes: Record<number, any>;
  selectedClassId: number | null;
  onSelectClass: (id: number) => void;
  onAddClass: () => void;
  onDeleteClass: (id: number) => void;
  onDuplicateClass: (id: number) => void;
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;
  leftPanelMinimized: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [_scrollToSelected, setScrollToSelected] = useState(false);
  const prevSelectedClassId = React.useRef(selectedClassId);

  // Memoize filtered classes
  const filteredClasses = useMemo(() => {
    const classArray = Object.values(classes);
    
    return classArray.filter(cls => {
      const matchesSearch = cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           cls.id.toString().includes(searchQuery);
      
      return matchesSearch;
    });
  }, [classes, searchQuery]);

  // Detect when class is selected externally
  useEffect(() => {
    if (selectedClassId !== null && selectedClassId !== prevSelectedClassId.current) {
      const isInFilteredList = filteredClasses.some(cls => cls.id === selectedClassId);
      
      if (!isInFilteredList) {
        setSearchQuery('');
      }
      
      setTimeout(() => {
        setScrollToSelected(true);
        const timer = setTimeout(() => setScrollToSelected(false), 1000);
        return () => clearTimeout(timer);
      }, 100);
      
      prevSelectedClassId.current = selectedClassId;
    }
    prevSelectedClassId.current = selectedClassId;
  }, [selectedClassId, filteredClasses]);

  // Convert filtered classes to ListItem format
  const listItems: ListItem[] = filteredClasses.map(cls => ({
    id: cls.id,
    name: cls.name || `Class ${cls.id}`,
    subtitle: `ID: ${cls.id} | Parent: ${cls.parentType}`,
    icon: (
      <div style={{
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2a2a2a',
        border: '1px solid #444',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#fff'
      }}>
        {cls.id}
      </div>
    ),
    hoverText: leftPanelMinimized ? `${cls.name} (#${cls.id})` : `ID: ${cls.id} | Parent: ${cls.parentType}`
  }));

  return (
    <>
      <FilterPopup
        show={showFilterPopup}
        onClose={() => setShowFilterPopup(false)}
        title="Search Classes"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search classes..."
      />
      
      <div className={`item-list-content ${leftPanelMinimized ? 'minimized' : ''}`}>
        <ListFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search classes..."
          minimized={leftPanelMinimized}
          onToggleSearch={() => setShowFilterPopup(!showFilterPopup)}
        />

        <GenericList
          items={listItems}
          selectedId={selectedClassId}
          onSelectItem={onSelectClass}
          minimized={leftPanelMinimized}
          emptyMessage="No classes found"
        />

        <div style={{
          padding: '8px',
          borderTop: '1px solid var(--border-primary)',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <button 
            onClick={onAddClass}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0e7490'}
          >
            <span>+</span>
            {!leftPanelMinimized && <span>New Class</span>}
          </button>
        </div>
      </div>
    </>
  );
}

import React, { useState, useMemo, useEffect } from 'react';
import ListFilter from '../ListFilter';
import GenericList, { ListItem } from '../GenericList';
import FilterPopup from '../FilterPopup';

export default function SkillList({
  skills,
  selectedSkillId,
  onSelectSkill,
  onAddSkill,
  onDeleteSkill,
  onDuplicateSkill,
  showSettingsModal,
  setShowSettingsModal,
  leftPanelMinimized,
  loadGfx,
  gfxFolder
}: {
  skills: Record<number, any>;
  selectedSkillId: number | null;
  onSelectSkill: (id: number) => void;
  onAddSkill: () => void;
  onDeleteSkill: (id: number) => void;
  onDuplicateSkill: (id: number) => void;
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;
  leftPanelMinimized: boolean;
  loadGfx: (gfxNumber: number, resourceId?: number) => Promise<string | null>;
  gfxFolder: string | null;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [_scrollToSelected, setScrollToSelected] = useState(false);
  const prevSelectedSkillId = React.useRef(selectedSkillId);
  const [iconCache, setIconCache] = useState<Record<number, string>>({});

  // Memoize filtered skills
  const filteredSkills = useMemo(() => {
    const skillArray = Object.values(skills);
    
    return skillArray.filter(skill => {
      const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           skill.id.toString().includes(searchQuery);
      
      return matchesSearch;
    });
  }, [skills, searchQuery]);

  // Detect when skill is selected externally
  useEffect(() => {
    if (selectedSkillId !== null && selectedSkillId !== prevSelectedSkillId.current) {
      const isInFilteredList = filteredSkills.some(skill => skill.id === selectedSkillId);
      
      if (!isInFilteredList) {
        setSearchQuery('');
      }
      
      setTimeout(() => {
        setScrollToSelected(true);
        const timer = setTimeout(() => setScrollToSelected(false), 1000);
        return () => clearTimeout(timer);
      }, 100);
      
      prevSelectedSkillId.current = selectedSkillId;
    }
    prevSelectedSkillId.current = selectedSkillId;
  }, [selectedSkillId, filteredSkills]);

  // Load icons for visible skills
  useEffect(() => {
    if (!loadGfx || !gfxFolder) return;

    const loadIcons = async () => {
      for (const skill of filteredSkills) {
        if (skill.iconId && !iconCache[skill.id]) {
          try {
            // PE resources start at 100, so add 100 to iconId
            const resourceId = skill.iconId + 100;
            const iconUrl = await loadGfx(25, resourceId);
            if (iconUrl) {
              setIconCache(prev => ({ ...prev, [skill.id]: iconUrl }));
            }
          } catch (error) {
            console.error(`Failed to load icon for skill ${skill.id}:`, error);
          }
        }
      }
    };

    loadIcons();
  }, [filteredSkills, loadGfx, gfxFolder, iconCache]);

  // Convert filtered skills to ListItem format
  const listItems: ListItem[] = filteredSkills.map(skill => ({
    id: skill.id,
    name: skill.name || `Skill ${skill.id}`,
    subtitle: `ID: ${skill.id} | Icon: ${skill.iconId}`,
    icon: iconCache[skill.id] ? (
      <div 
        style={{
          width: '32px',
          height: '32px',
          backgroundImage: `url(${iconCache[skill.id]})`,
          backgroundSize: '200% 100%',
          backgroundPosition: '0 0',
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          border: '1px solid var(--border-primary)',
          borderRadius: '4px'
        }}
        title={`Skill ${skill.id} icon`}
      />
    ) : (
      <div style={{
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-input)',
        border: '1px solid var(--border-primary)',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#666'
      }}>
        {skill.id}
      </div>
    ),
    hoverText: leftPanelMinimized ? `${skill.name} (#${skill.id})` : `ID: ${skill.id} | Icon: ${skill.iconId}`
  }));

  return (
    <>
      <FilterPopup
        show={showFilterPopup}
        onClose={() => setShowFilterPopup(false)}
        title="Search Skills"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search skills..."
      />
      
      <div className={`item-list-content ${leftPanelMinimized ? 'minimized' : ''}`}>
        <ListFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search skills..."
          minimized={leftPanelMinimized}
          onToggleSearch={() => setShowFilterPopup(!showFilterPopup)}
        />

        <GenericList
          items={listItems}
          selectedId={selectedSkillId}
          onSelectItem={onSelectSkill}
          minimized={leftPanelMinimized}
          emptyMessage="No skills found"
        />

        <div style={{
          padding: '8px',
          borderTop: '1px solid var(--border-primary)',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <button 
            onClick={onAddSkill}
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
            {!leftPanelMinimized && <span>New Skill</span>}
          </button>
        </div>
      </div>
    </>
  );
}

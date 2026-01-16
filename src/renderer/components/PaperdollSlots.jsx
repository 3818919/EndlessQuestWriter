import React from 'react';
import { EQUIPMENT_SLOTS } from '../hooks/useEquipment';

const SLOT_DISPLAY_NAMES = {
  [EQUIPMENT_SLOTS.WEAPON]: 'Weapon',
  [EQUIPMENT_SLOTS.SHIELD]: 'Shield',
  [EQUIPMENT_SLOTS.ARMOR]: 'Armor',
  [EQUIPMENT_SLOTS.HELMET]: 'Helmet',
  [EQUIPMENT_SLOTS.BOOTS]: 'Boots',
  [EQUIPMENT_SLOTS.GLOVES]: 'Gloves',
  [EQUIPMENT_SLOTS.BELT]: 'Belt',
  [EQUIPMENT_SLOTS.NECKLACE]: 'Necklace',
  [EQUIPMENT_SLOTS.RING_1]: 'Ring 1',
  [EQUIPMENT_SLOTS.RING_2]: 'Ring 2',
  [EQUIPMENT_SLOTS.ARMLET_1]: 'Bracelet 1',
  [EQUIPMENT_SLOTS.ARMLET_2]: 'Bracelet 2',
  [EQUIPMENT_SLOTS.BRACER_1]: 'Bracer 1',
  [EQUIPMENT_SLOTS.BRACER_2]: 'Bracer 2',
  [EQUIPMENT_SLOTS.GEM]: 'Gem'
};

const VALID_TYPES_BY_SLOT = {
  [EQUIPMENT_SLOTS.WEAPON]: [10],
  [EQUIPMENT_SLOTS.SHIELD]: [11],
  [EQUIPMENT_SLOTS.ARMOR]: [12],
  [EQUIPMENT_SLOTS.HELMET]: [13],
  [EQUIPMENT_SLOTS.BOOTS]: [14],
  [EQUIPMENT_SLOTS.GLOVES]: [15],
  [EQUIPMENT_SLOTS.BELT]: [17],
  [EQUIPMENT_SLOTS.NECKLACE]: [18],
  [EQUIPMENT_SLOTS.RING_1]: [19],
  [EQUIPMENT_SLOTS.RING_2]: [19],
  [EQUIPMENT_SLOTS.ARMLET_1]: [20],
  [EQUIPMENT_SLOTS.ARMLET_2]: [20],
  [EQUIPMENT_SLOTS.BRACER_1]: [21],
  [EQUIPMENT_SLOTS.BRACER_2]: [21],
  [EQUIPMENT_SLOTS.GEM]: [16]
};

function EquipmentSlot({ 
  slotKey, 
  item, 
  onUnequip, 
  onDrop,
  onAutoGenderSwitch,
  items
}) {
  const [dragOver, setDragOver] = React.useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    
    // Check if the dragged item is valid for this slot
    try {
      const draggedItem = JSON.parse(e.dataTransfer.getData('application/json'));
      const validTypes = VALID_TYPES_BY_SLOT[slotKey];
      
      if (validTypes && validTypes.includes(draggedItem.type)) {
        setDragOver(true);
      }
    } catch (err) {
      // Ignore parse errors
    }
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    try {
      const draggedItem = JSON.parse(e.dataTransfer.getData('application/json'));
      const validTypes = VALID_TYPES_BY_SLOT[slotKey];
      
      if (validTypes && validTypes.includes(draggedItem.type)) {
        // Auto-switch gender if armor is female-only
        if (draggedItem.type === 12 && draggedItem.gender === 0) {
          onAutoGenderSwitch(0); // Switch to female
        }
        
        onDrop(items[draggedItem.id], slotKey);
      }
    } catch (err) {
      console.error('Error dropping item:', err);
    }
  };

  return (
    <div 
      className={`equipment-slot ${dragOver ? 'drag-over' : ''} ${item ? 'equipped' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-slot={slotKey}
    >
      <div className="slot-label">{SLOT_DISPLAY_NAMES[slotKey]}</div>
      {item ? (
        <div className="slot-content">
          <span className="slot-item-name">{item.name}</span>
          <button 
            onClick={() => onUnequip(slotKey)}
            className="slot-remove"
            title="Remove item"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="slot-empty">Empty</div>
      )}
    </div>
  );
}

export default function PaperdollSlots({
  equippedItems,
  onEquipItem,
  onUnequipSlot,
  onClearAll,
  items,
  onAutoGenderSwitch
}) {
  return (
    <div className="paperdoll-slots">
      <div className="paperdoll-header">
        <h4>Equipment</h4>
        <button 
          onClick={onClearAll}
          className="btn btn-small btn-danger"
        >
          Clear All
        </button>
      </div>

      <div className="paperdoll-grid">
        {/* Top Row: Helmet */}
        <div className="slot-row slot-row-top">
          <EquipmentSlot
            slotKey={EQUIPMENT_SLOTS.HELMET}
            item={equippedItems[EQUIPMENT_SLOTS.HELMET]}
            onUnequip={onUnequipSlot}
            onDrop={onEquipItem}
            onAutoGenderSwitch={onAutoGenderSwitch}
            items={items}
          />
        </div>

        {/* Second Row: Necklace */}
        <div className="slot-row">
          <EquipmentSlot
            slotKey={EQUIPMENT_SLOTS.NECKLACE}
            item={equippedItems[EQUIPMENT_SLOTS.NECKLACE]}
            onUnequip={onUnequipSlot}
            onDrop={onEquipItem}
            onAutoGenderSwitch={onAutoGenderSwitch}
            items={items}
          />
        </div>

        {/* Third Row: Weapon, Armor, Shield */}
        <div className="slot-row slot-row-main">
          <EquipmentSlot
            slotKey={EQUIPMENT_SLOTS.WEAPON}
            item={equippedItems[EQUIPMENT_SLOTS.WEAPON]}
            onUnequip={onUnequipSlot}
            onDrop={onEquipItem}
            onAutoGenderSwitch={onAutoGenderSwitch}
            items={items}
          />
          <EquipmentSlot
            slotKey={EQUIPMENT_SLOTS.ARMOR}
            item={equippedItems[EQUIPMENT_SLOTS.ARMOR]}
            onUnequip={onUnequipSlot}
            onDrop={onEquipItem}
            onAutoGenderSwitch={onAutoGenderSwitch}
            items={items}
          />
          <EquipmentSlot
            slotKey={EQUIPMENT_SLOTS.SHIELD}
            item={equippedItems[EQUIPMENT_SLOTS.SHIELD]}
            onUnequip={onUnequipSlot}
            onDrop={onEquipItem}
            onAutoGenderSwitch={onAutoGenderSwitch}
            items={items}
          />
        </div>

        {/* Fourth Row: Rings */}
        <div className="slot-row slot-row-dual">
          <EquipmentSlot
            slotKey={EQUIPMENT_SLOTS.RING_1}
            item={equippedItems[EQUIPMENT_SLOTS.RING_1]}
            onUnequip={onUnequipSlot}
            onDrop={onEquipItem}
            onAutoGenderSwitch={onAutoGenderSwitch}
            items={items}
          />
          <EquipmentSlot
            slotKey={EQUIPMENT_SLOTS.RING_2}
            item={equippedItems[EQUIPMENT_SLOTS.RING_2]}
            onUnequip={onUnequipSlot}
            onDrop={onEquipItem}
            onAutoGenderSwitch={onAutoGenderSwitch}
            items={items}
          />
        </div>

        {/* Fifth Row: Bracelets/Armlets */}
        <div className="slot-row slot-row-dual">
          <EquipmentSlot
            slotKey={EQUIPMENT_SLOTS.ARMLET_1}
            item={equippedItems[EQUIPMENT_SLOTS.ARMLET_1]}
            onUnequip={onUnequipSlot}
            onDrop={onEquipItem}
            onAutoGenderSwitch={onAutoGenderSwitch}
            items={items}
          />
          <EquipmentSlot
            slotKey={EQUIPMENT_SLOTS.ARMLET_2}
            item={equippedItems[EQUIPMENT_SLOTS.ARMLET_2]}
            onUnequip={onUnequipSlot}
            onDrop={onEquipItem}
            onAutoGenderSwitch={onAutoGenderSwitch}
            items={items}
          />
        </div>

        {/* Sixth Row: Bracers */}
        <div className="slot-row slot-row-dual">
          <EquipmentSlot
            slotKey={EQUIPMENT_SLOTS.BRACER_1}
            item={equippedItems[EQUIPMENT_SLOTS.BRACER_1]}
            onUnequip={onUnequipSlot}
            onDrop={onEquipItem}
            onAutoGenderSwitch={onAutoGenderSwitch}
            items={items}
          />
          <EquipmentSlot
            slotKey={EQUIPMENT_SLOTS.BRACER_2}
            item={equippedItems[EQUIPMENT_SLOTS.BRACER_2]}
            onUnequip={onUnequipSlot}
            onDrop={onEquipItem}
            onAutoGenderSwitch={onAutoGenderSwitch}
            items={items}
          />
        </div>

        {/* Seventh Row: Belt */}
        <div className="slot-row">
          <EquipmentSlot
            slotKey={EQUIPMENT_SLOTS.BELT}
            item={equippedItems[EQUIPMENT_SLOTS.BELT]}
            onUnequip={onUnequipSlot}
            onDrop={onEquipItem}
            onAutoGenderSwitch={onAutoGenderSwitch}
            items={items}
          />
        </div>

        {/* Eighth Row: Gloves, Boots */}
        <div className="slot-row slot-row-dual">
          <EquipmentSlot
            slotKey={EQUIPMENT_SLOTS.GLOVES}
            item={equippedItems[EQUIPMENT_SLOTS.GLOVES]}
            onUnequip={onUnequipSlot}
            onDrop={onEquipItem}
            onAutoGenderSwitch={onAutoGenderSwitch}
            items={items}
          />
          <EquipmentSlot
            slotKey={EQUIPMENT_SLOTS.BOOTS}
            item={equippedItems[EQUIPMENT_SLOTS.BOOTS]}
            onUnequip={onUnequipSlot}
            onDrop={onEquipItem}
            onAutoGenderSwitch={onAutoGenderSwitch}
            items={items}
          />
        </div>

        {/* Ninth Row: Gem */}
        <div className="slot-row">
          <EquipmentSlot
            slotKey={EQUIPMENT_SLOTS.GEM}
            item={equippedItems[EQUIPMENT_SLOTS.GEM]}
            onUnequip={onUnequipSlot}
            onDrop={onEquipItem}
            onAutoGenderSwitch={onAutoGenderSwitch}
            items={items}
          />
        </div>
      </div>

      <div className="paperdoll-hint">
        <small>💡 Drag items from the list to equip them</small>
      </div>
    </div>
  );
}

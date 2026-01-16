import { useState, useCallback } from 'react';

// Equipment slot definitions
export const EQUIPMENT_SLOTS = {
  WEAPON: 'weapon',
  SHIELD: 'shield',
  ARMOR: 'armor',
  HELMET: 'helmet',
  BOOTS: 'boots',
  GLOVES: 'gloves',
  BELT: 'belt',
  NECKLACE: 'necklace',
  RING_1: 'ring1',
  RING_2: 'ring2',
  ARMLET_1: 'armlet1',
  ARMLET_2: 'armlet2',
  BRACER_1: 'bracer1',
  BRACER_2: 'bracer2',
  GEM: 'gem'
};

// Item type to slot mapping
export const ITEM_TYPE_TO_SLOT = {
  10: EQUIPMENT_SLOTS.WEAPON,     // WEAPON
  11: EQUIPMENT_SLOTS.SHIELD,     // SHIELD
  12: EQUIPMENT_SLOTS.ARMOR,      // ARMOR
  13: EQUIPMENT_SLOTS.HELMET,     // HAT
  14: EQUIPMENT_SLOTS.BOOTS,      // BOOTS
  15: EQUIPMENT_SLOTS.GLOVES,     // GLOVES
  16: null,                        // ACCESSORY (can go in gem slot)
  17: EQUIPMENT_SLOTS.BELT,       // BELT
  18: EQUIPMENT_SLOTS.NECKLACE,   // NECKLACE
  19: null,                        // RING (goes to first available ring slot)
  20: null,                        // ARMLET (goes to first available armlet slot)
  21: null                         // BRACER (goes to first available bracer slot)
};

export function useEquipment() {
  const [equippedItems, setEquippedItems] = useState({});

  const equipItem = useCallback((item, targetSlot = null) => {
    if (!item) return;

    let slot = targetSlot;

    // If no specific slot, determine from item type
    if (!slot) {
      const itemType = item.type;
      
      if (itemType === 19) { // RING
        slot = !equippedItems[EQUIPMENT_SLOTS.RING_1] 
          ? EQUIPMENT_SLOTS.RING_1 
          : EQUIPMENT_SLOTS.RING_2;
      } else if (itemType === 20) { // ARMLET
        slot = !equippedItems[EQUIPMENT_SLOTS.ARMLET_1]
          ? EQUIPMENT_SLOTS.ARMLET_1
          : EQUIPMENT_SLOTS.ARMLET_2;
      } else if (itemType === 21) { // BRACER
        slot = !equippedItems[EQUIPMENT_SLOTS.BRACER_1]
          ? EQUIPMENT_SLOTS.BRACER_1
          : EQUIPMENT_SLOTS.BRACER_2;
      } else if (itemType === 16) { // ACCESSORY/GEM
        slot = EQUIPMENT_SLOTS.GEM;
      } else {
        slot = ITEM_TYPE_TO_SLOT[itemType];
      }
    }

    if (slot) {
      setEquippedItems(prev => ({
        ...prev,
        [slot]: item
      }));
    }
  }, [equippedItems]);

  const unequipSlot = useCallback((slot) => {
    setEquippedItems(prev => {
      const newEquipped = { ...prev };
      delete newEquipped[slot];
      return newEquipped;
    });
  }, []);

  const clearAll = useCallback(() => {
    setEquippedItems({});
  }, []);

  return {
    equippedItems,
    equipItem,
    unequipSlot,
    clearAll
  };
}

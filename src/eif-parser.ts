/**
 * EIF (Endless Item File) Parser
 * Using eolib for pub file parsing
 */

import { EifRecord, EoReader, EoWriter } from 'eolib';

// Adapter to convert eolib EifRecord to our application's format
class EIFRecord {
  id: number;
  name: string;
  graphic: number;
  type: number;
  subType: number;
  special: number;
  hp: number;
  tp: number;
  minDam: number;
  maxDam: number;
  accuracy: number;
  evade: number;
  armor: number;
  str: number;
  int: number;
  wis: number;
  agi: number;
  con: number;
  cha: number;
  light: number;
  dark: number;
  earth: number;
  air: number;
  water: number;
  fire: number;
  scrollMap: number;
  dollGraphic: number;
  expReward: number;
  hairColor: number;
  effect: number;
  key: number;
  beerPotency: number;
  gender: number;
  scrollX: number;
  scrollY: number;
  dualWieldDollGraphic: number;
  levelReq: number;
  classReq: number;
  strReq: number;
  intReq: number;
  wisReq: number;
  agiReq: number;
  conReq: number;
  chaReq: number;
  element: number;
  elementPower: number;
  weight: number;
  size: number;
  
  constructor(id = 0, eifRecord?: any) {
    this.id = id;
    
    if (eifRecord) {
      this.name = eifRecord.name || '';
      this.graphic = eifRecord.graphicId || 0;
      this.type = eifRecord.type || 0;
      this.subType = eifRecord.subtype || 0;
      this.special = eifRecord.special || 0;
      this.hp = eifRecord.hp || 0;
      this.tp = eifRecord.tp || 0;
      this.minDam = eifRecord.minDamage || 0;
      this.maxDam = eifRecord.maxDamage || 0;
      this.accuracy = eifRecord.accuracy || 0;
      this.evade = eifRecord.evade || 0;
      this.armor = eifRecord.armor || 0;
      this.str = eifRecord.str || 0;
      this.int = eifRecord.intl || 0;  // eolib uses 'intl' not 'int'
      this.wis = eifRecord.wis || 0;
      this.agi = eifRecord.agi || 0;
      this.con = eifRecord.con || 0;
      this.cha = eifRecord.cha || 0;
      this.light = eifRecord.lightResistance || 0;
      this.dark = eifRecord.darkResistance || 0;
      this.earth = eifRecord.earthResistance || 0;
      this.air = eifRecord.airResistance || 0;
      this.water = eifRecord.waterResistance || 0;
      this.fire = eifRecord.fireResistance || 0;
      
      // Handle the 3-byte union value based on type
      this.scrollMap = eifRecord.spec1 || 0;
      this.dollGraphic = eifRecord.spec1 || 0;
      this.expReward = eifRecord.spec1 || 0;
      this.hairColor = eifRecord.spec1 || 0;
      this.effect = eifRecord.spec1 || 0;
      this.key = eifRecord.spec1 || 0;
      this.beerPotency = eifRecord.spec1 || 0;
      
      this.gender = eifRecord.spec2 || 0;
      this.scrollX = eifRecord.spec2 || 0;
      this.scrollY = eifRecord.spec3 || 0;
      this.dualWieldDollGraphic = eifRecord.spec3 || 0;
      
      this.levelReq = eifRecord.levelRequirement || 0;
      this.classReq = eifRecord.classRequirement || 0;
      this.strReq = eifRecord.strRequirement || 0;
      this.intReq = eifRecord.intRequirement || 0;
      this.wisReq = eifRecord.wisRequirement || 0;
      this.agiReq = eifRecord.agiRequirement || 0;
      this.conReq = eifRecord.conRequirement || 0;
      this.chaReq = eifRecord.chaRequirement || 0;
      
      this.element = eifRecord.element || 0;
      this.elementPower = eifRecord.elementDamage || 0;
      this.weight = eifRecord.weight || 0;
      this.size = eifRecord.size || 0;
    } else {
      // Initialize defaults
      this.name = '';
      this.graphic = 0;
      this.type = 0;
      this.subType = 0;
      this.special = 0;
      this.hp = 0;
      this.tp = 0;
      this.minDam = 0;
      this.maxDam = 0;
      this.accuracy = 0;
      this.evade = 0;
      this.armor = 0;
      this.str = 0;
      this.int = 0;
      this.wis = 0;
      this.agi = 0;
      this.con = 0;
      this.cha = 0;
      this.light = 0;
      this.dark = 0;
      this.earth = 0;
      this.air = 0;
      this.water = 0;
      this.fire = 0;
      this.scrollMap = 0;
      this.dollGraphic = 0;
      this.expReward = 0;
      this.hairColor = 0;
      this.effect = 0;
      this.key = 0;
      this.beerPotency = 0;
      this.gender = 0;
      this.scrollX = 0;
      this.scrollY = 0;
      this.dualWieldDollGraphic = 0;
      this.levelReq = 0;
      this.classReq = 0;
      this.strReq = 0;
      this.intReq = 0;
      this.wisReq = 0;
      this.agiReq = 0;
      this.conReq = 0;
      this.chaReq = 0;
      this.element = 0;
      this.elementPower = 0;
      this.weight = 0;
      this.size = 0;
    }
  }
  
  // Convert back to eolib format for serialization
  toEolib() {
    return {
      name: this.name,
      graphicId: this.graphic,
      type: this.type,
      subtype: this.subType,
      special: this.special,
      hp: this.hp,
      tp: this.tp,
      minDamage: this.minDam,
      maxDamage: this.maxDam,
      accuracy: this.accuracy,
      evade: this.evade,
      armor: this.armor,
      str: this.str,
      intl: this.int,
      wis: this.wis,
      agi: this.agi,
      con: this.con,
      cha: this.cha,
      lightResistance: this.light,
      darkResistance: this.dark,
      earthResistance: this.earth,
      airResistance: this.air,
      waterResistance: this.water,
      fireResistance: this.fire,
      spec1: this.dollGraphic,
      spec2: this.gender,
      spec3: this.scrollY,
      levelRequirement: this.levelReq,
      classRequirement: this.classReq,
      strRequirement: this.strReq,
      intRequirement: this.intReq,
      wisRequirement: this.wisReq,
      agiRequirement: this.agiReq,
      conRequirement: this.conReq,
      chaRequirement: this.chaReq,
      element: this.element,
      elementDamage: this.elementPower,
      weight: this.weight,
      size: this.size
    };
  }
}

class EIFParser {
  static parse(fileData: ArrayBuffer) {
    const data = new Uint8Array(fileData);
    const reader = new EoReader(data);
    
    try {
      // Read EIF header
      const fileType = String.fromCharCode(...reader.getBytes(3)); // "EIF"
      if (fileType !== 'EIF') {
        throw new Error(`Invalid file type: expected EIF, got ${fileType}`);
      }
      
      const checksum = reader.getInt(); // CRC32 checksum
      const numItems = reader.getShort(); // Number of items
      const version = reader.getByte(); // Version byte
      
      // Parse all item records
      const records: EIFRecord[] = [];
      for (let i = 0; i < numItems; i++) {
        const eifRecord = EifRecord.deserialize(reader);
        // Skip EOF markers
        if (eifRecord.name.toLowerCase() !== 'eof') {
          records.push(new EIFRecord(i + 1, eifRecord));
        }
      }
      
      return {
        fileType: 'EIF',
        totalLength: numItems,
        records
      };
    } catch (error: any) {
      console.error('Failed to parse EIF file:', error);
      throw new Error(`Invalid EIF file: ${error.message}`);
    }
  }

  static serialize(eifData: any) {
    const writer = new EoWriter();
    
    // Write EIF header
    writer.addBytes(new Uint8Array([69, 73, 70])); // "EIF"
    writer.addInt(0); // Placeholder for checksum
    writer.addShort(eifData.records.length);
    writer.addByte(1); // Version
    
    // Write all item records
    for (const record of eifData.records) {
      const eifRecord = record.toEolib();
      EifRecord.serialize(writer, eifRecord);
    }
    
    return writer.toByteArray();
  }
}

// ES6 exports
export { EIFParser, EIFRecord };

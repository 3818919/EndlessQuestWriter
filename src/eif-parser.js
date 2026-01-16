/**
 * EIF (Endless Item File) Parser
 * Based on EndlessClient EOLib.IO implementation
 */

class NumberEncoder {
  // Decode multi-byte numbers (big-endian style)
  static decodeNumber(bytes) {
    if (!Array.isArray(bytes)) {
      bytes = [bytes];
    }
    
    let result = 0;
    let mul = 1;
    
    for (let i = 0; i < bytes.length; i++) {
      let byte = bytes[i];
      if (byte === 254) byte = 1;
      if (byte === 0) byte = 254;
      
      result += (byte - 1) * mul;
      mul *= 253;
    }
    
    return result;
  }
  
  // Encode numbers to multi-byte format
  static encodeNumber(value, size) {
    const result = new Array(size).fill(254);
    let originalValue = value;
    let div = 254;
    
    for (let i = 0; i < size; i++) {
      div = originalValue % 253;
      result[i] = div + 1;
      originalValue = Math.floor(originalValue / 253);
    }
    
    for (let i = 0; i < size; i++) {
      if (result[i] === 0) result[i] = 254;
    }
    
    return result;
  }
}

class CRC32 {
  static check(bytes) {
    let crc = 0xFFFFFFFF;
    
    for (let i = 0; i < bytes.length; i++) {
      crc ^= bytes[i];
      for (let j = 0; j < 8; j++) {
        if (crc & 1) {
          crc = (crc >>> 1) ^ 0xEDB88320;
        } else {
          crc = crc >>> 1;
        }
      }
    }
    
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
}

class EIFRecord {
  constructor(id = 0, name = '') {
    this.id = id;
    this.names = [name];
    this.properties = {
      graphic: 0,
      type: 0,
      subType: 0,
      special: 0,
      hp: 0,
      tp: 0,
      minDam: 0,
      maxDam: 0,
      accuracy: 0,
      evade: 0,
      armor: 0,
      str: 0,
      int: 0,
      wis: 0,
      agi: 0,
      con: 0,
      cha: 0,
      light: 0,
      dark: 0,
      earth: 0,
      air: 0,
      water: 0,
      fire: 0,
      scrollMap: 0,
      dollGraphic: 0,
      expReward: 0,
      hairColor: 0,
      effect: 0,
      key: 0,
      beerPotency: 0,
      gender: 0,
      scrollX: 0,
      scrollY: 0,
      dualWieldDollGraphic: 0,
      levelReq: 0,
      classReq: 0,
      strReq: 0,
      intReq: 0,
      wisReq: 0,
      agiReq: 0,
      conReq: 0,
      chaReq: 0,
      element: 0,
      elementPower: 0,
      weight: 0,
      size: 0
    };
  }

  get name() {
    return this.names[0] || '';
  }

  set name(value) {
    this.names[0] = value;
  }
}

class EIFParser {
  static parse(fileData) {
    if (!fileData || fileData.length < 10) {
      throw new Error('Invalid EIF file: too small');
    }

    const data = new Uint8Array(fileData);
    let offset = 0;

    // Read file type (3 bytes: "EIF")
    const fileType = String.fromCharCode(data[0], data[1], data[2]);
    if (fileType !== 'EIF') {
      throw new Error(`Invalid file type: expected EIF, got ${fileType}`);
    }
    offset += 3;

    // Read checksum (4 bytes)
    const checksumBytes = [data[offset], data[offset + 1], data[offset + 2], data[offset + 3]];
    const checksum1 = NumberEncoder.decodeNumber([checksumBytes[0], checksumBytes[1]]);
    const checksum2 = NumberEncoder.decodeNumber([checksumBytes[2], checksumBytes[3]]);
    offset += 4;

    // Read total length (2 bytes)
    const totalLength = NumberEncoder.decodeNumber([data[offset], data[offset + 1]]);
    offset += 2;

    // Skip version byte
    offset += 1;

    const records = [];
    
    // Parse records
    for (let i = 1; i <= totalLength && offset < data.length; i++) {
      const record = new EIFRecord(i);

      // Read name length
      const nameLength = NumberEncoder.decodeNumber(data[offset]);
      offset += 1;

      // Read name
      const nameBytes = data.slice(offset, offset + nameLength);
      record.name = new TextDecoder().decode(nameBytes);
      offset += nameLength;

      // Check for EOF marker
      if (record.name.toLowerCase() === 'eof') {
        records.push(record);
        continue;
      }

      // Read item data (58 bytes of property data)
      const itemData = data.slice(offset, offset + 58);
      
      // Parse properties based on offsets from PubRecordProperty
      record.properties.graphic = NumberEncoder.decodeNumber([itemData[0], itemData[1]]);
      record.properties.type = NumberEncoder.decodeNumber(itemData[2]);
      record.properties.subType = NumberEncoder.decodeNumber(itemData[3]);
      record.properties.special = NumberEncoder.decodeNumber(itemData[4]);
      record.properties.hp = NumberEncoder.decodeNumber([itemData[5], itemData[6]]);
      record.properties.tp = NumberEncoder.decodeNumber([itemData[7], itemData[8]]);
      record.properties.minDam = NumberEncoder.decodeNumber([itemData[9], itemData[10]]);
      record.properties.maxDam = NumberEncoder.decodeNumber([itemData[11], itemData[12]]);
      record.properties.accuracy = NumberEncoder.decodeNumber([itemData[13], itemData[14]]);
      record.properties.evade = NumberEncoder.decodeNumber([itemData[15], itemData[16]]);
      record.properties.armor = NumberEncoder.decodeNumber([itemData[17], itemData[18]]);
      
      record.properties.str = NumberEncoder.decodeNumber(itemData[20]);
      record.properties.int = NumberEncoder.decodeNumber(itemData[21]);
      record.properties.wis = NumberEncoder.decodeNumber(itemData[22]);
      record.properties.agi = NumberEncoder.decodeNumber(itemData[23]);
      record.properties.con = NumberEncoder.decodeNumber(itemData[24]);
      record.properties.cha = NumberEncoder.decodeNumber(itemData[25]);
      
      record.properties.light = NumberEncoder.decodeNumber(itemData[26]);
      record.properties.dark = NumberEncoder.decodeNumber(itemData[27]);
      record.properties.earth = NumberEncoder.decodeNumber(itemData[28]);
      record.properties.air = NumberEncoder.decodeNumber(itemData[29]);
      record.properties.water = NumberEncoder.decodeNumber(itemData[30]);
      record.properties.fire = NumberEncoder.decodeNumber(itemData[31]);
      
      // 3-byte values at offset 32 (scrollMap/dollGraphic/expReward/etc based on item type)
      const threeByteValue = NumberEncoder.decodeNumber([itemData[32], itemData[33], itemData[34]]);
      record.properties.scrollMap = threeByteValue;
      record.properties.dollGraphic = threeByteValue;
      record.properties.expReward = threeByteValue;
      record.properties.hairColor = threeByteValue;
      record.properties.effect = threeByteValue;
      record.properties.key = threeByteValue;
      record.properties.beerPotency = threeByteValue;
      
      record.properties.gender = NumberEncoder.decodeNumber(itemData[35]);
      record.properties.scrollX = NumberEncoder.decodeNumber(itemData[35]);
      
      record.properties.scrollY = NumberEncoder.decodeNumber(itemData[36]);
      record.properties.dualWieldDollGraphic = NumberEncoder.decodeNumber(itemData[36]);
      
      record.properties.levelReq = NumberEncoder.decodeNumber([itemData[37], itemData[38]]);
      record.properties.classReq = NumberEncoder.decodeNumber([itemData[39], itemData[40]]);
      record.properties.strReq = NumberEncoder.decodeNumber([itemData[41], itemData[42]]);
      record.properties.intReq = NumberEncoder.decodeNumber([itemData[43], itemData[44]]);
      record.properties.wisReq = NumberEncoder.decodeNumber([itemData[45], itemData[46]]);
      record.properties.agiReq = NumberEncoder.decodeNumber([itemData[47], itemData[48]]);
      record.properties.conReq = NumberEncoder.decodeNumber([itemData[49], itemData[50]]);
      record.properties.chaReq = NumberEncoder.decodeNumber([itemData[51], itemData[52]]);
      
      record.properties.element = NumberEncoder.decodeNumber(itemData[53]);
      record.properties.elementPower = NumberEncoder.decodeNumber(itemData[54]);
      record.properties.weight = NumberEncoder.decodeNumber(itemData[55]);
      record.properties.size = NumberEncoder.decodeNumber(itemData[57]);

      offset += 58;
      records.push(record);
    }

    return {
      fileType,
      checksum: [checksum1, checksum2],
      totalLength,
      records
    };
  }

  static serialize(eifFile) {
    const parts = [];
    
    // File type
    parts.push([69, 73, 70]); // "EIF"
    
    // Placeholder for checksum (4 bytes)
    parts.push([254, 254, 254, 254]);
    
    // Total length
    parts.push(NumberEncoder.encodeNumber(eifFile.records.length, 2));
    
    // Version byte
    parts.push([1]);
    
    // Serialize records
    for (const record of eifFile.records) {
      // Name length
      const nameBytes = new TextEncoder().encode(record.name);
      parts.push(NumberEncoder.encodeNumber(nameBytes.length, 1));
      
      // Name
      parts.push(Array.from(nameBytes));
      
      // Skip data for EOF records
      if (record.name.toLowerCase() === 'eof') {
        continue;
      }
      
      // Property data (58 bytes)
      const propData = new Array(58).fill(254);
      
      // Encode all properties
      const enc2 = (val, off) => {
        const bytes = NumberEncoder.encodeNumber(val, 2);
        propData[off] = bytes[0];
        propData[off + 1] = bytes[1];
      };
      const enc1 = (val, off) => {
        propData[off] = NumberEncoder.encodeNumber(val, 1)[0];
      };
      const enc3 = (val, off) => {
        const bytes = NumberEncoder.encodeNumber(val, 3);
        propData[off] = bytes[0];
        propData[off + 1] = bytes[1];
        propData[off + 2] = bytes[2];
      };
      
      enc2(record.properties.graphic, 0);
      enc1(record.properties.type, 2);
      enc1(record.properties.subType, 3);
      enc1(record.properties.special, 4);
      enc2(record.properties.hp, 5);
      enc2(record.properties.tp, 7);
      enc2(record.properties.minDam, 9);
      enc2(record.properties.maxDam, 11);
      enc2(record.properties.accuracy, 13);
      enc2(record.properties.evade, 15);
      enc2(record.properties.armor, 17);
      
      enc1(record.properties.str, 20);
      enc1(record.properties.int, 21);
      enc1(record.properties.wis, 22);
      enc1(record.properties.agi, 23);
      enc1(record.properties.con, 24);
      enc1(record.properties.cha, 25);
      
      enc1(record.properties.light, 26);
      enc1(record.properties.dark, 27);
      enc1(record.properties.earth, 28);
      enc1(record.properties.air, 29);
      enc1(record.properties.water, 30);
      enc1(record.properties.fire, 31);
      
      // Use dollGraphic as the primary 3-byte value
      enc3(record.properties.dollGraphic, 32);
      
      enc1(record.properties.gender, 35);
      enc1(record.properties.scrollY, 36);
      
      enc2(record.properties.levelReq, 37);
      enc2(record.properties.classReq, 39);
      enc2(record.properties.strReq, 41);
      enc2(record.properties.intReq, 43);
      enc2(record.properties.wisReq, 45);
      enc2(record.properties.agiReq, 47);
      enc2(record.properties.conReq, 49);
      enc2(record.properties.chaReq, 51);
      
      enc1(record.properties.element, 53);
      enc1(record.properties.elementPower, 54);
      enc1(record.properties.weight, 55);
      enc1(record.properties.size, 57);
      
      parts.push(propData);
    }
    
    // Flatten all parts
    const bytes = parts.flat();
    
    // Calculate and update checksum
    const crc = CRC32.check(bytes);
    const checksumBytes = NumberEncoder.encodeNumber(crc, 4);
    bytes[3] = checksumBytes[0];
    bytes[4] = checksumBytes[1];
    bytes[5] = checksumBytes[2];
    bytes[6] = checksumBytes[3];
    
    return new Uint8Array(bytes);
  }
}

// Export for use in renderer
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EIFParser, EIFRecord, NumberEncoder, CRC32 };
}
// Also expose to window for browser usage
if (typeof window !== 'undefined') {
  window.EIFParser = EIFParser;
  window.EIFRecord = EIFRecord;
  window.NumberEncoder = NumberEncoder;
  window.CRC32 = CRC32;
}
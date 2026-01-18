/**
 * ECF (Endless Class File) Parser
 * Simplified wrapper around eolib
 */

import { Ecf, EcfRecord, EoReader, EoWriter } from 'eolib';

/**
 * Convert eolib EcfRecord to application format
 * Maps eolib field names to application field names for consistency with JSON serialization
 */
function convertEcfRecord(ecfRecord: EcfRecord, id: number) {
  return {
    id,
    name: ecfRecord.name || '',
    parentType: ecfRecord.parentType || 0,
    statGroup: ecfRecord.statGroup || 0,
    str: ecfRecord.str || 0,
    int: ecfRecord.intl || 0,  // eolib uses 'intl' not 'int'
    wis: ecfRecord.wis || 0,
    agi: ecfRecord.agi || 0,
    con: ecfRecord.con || 0,
    cha: ecfRecord.cha || 0
  };
}

class ECFParser {
  static parse(fileData: ArrayBuffer) {
    try {
      const data = new Uint8Array(fileData);
      const reader = new EoReader(data);
      
      // Use eolib's built-in deserializer
      const ecf = Ecf.deserialize(reader);
      
      // Convert to application format, filtering out EOF markers
      const records = ecf.classes
        .filter(cls => cls.name.toLowerCase() !== 'eof')
        .map((cls, index) => convertEcfRecord(cls, index + 1));
      
      return {
        fileType: 'ECF',
        totalLength: ecf.totalClassesCount,
        version: ecf.version,
        records
      };
    } catch (error: any) {
      console.error('Failed to parse ECF file:', error);
      throw new Error(`Invalid ECF file: ${error.message}`);
    }
  }
  
  static serialize(data: any) {
    try {
      const writer = new EoWriter();
      
      // Handle both formats: { records: [] } and { classes: {} }
      let recordsArray: any[];
      if (data.records && Array.isArray(data.records)) {
        recordsArray = data.records;
      } else if (data.classes) {
        // Convert classes object to array
        recordsArray = Object.values(data.classes);
      } else {
        throw new Error('Invalid data format: missing records or classes');
      }
      
      // Create Ecf object
      const ecf = new Ecf();
      ecf.totalClassesCount = recordsArray.length;
      ecf.version = data.version || 1;
      ecf.rid = [recordsArray.length, recordsArray.length]; // Required by eolib for tracking
      
      // Sort records by ID to ensure correct ordering
      const sortedRecords = [...recordsArray].sort((a, b) => (a.id || 0) - (b.id || 0));
      
      // Convert records back to EcfRecord format
      ecf.classes = sortedRecords.map(record => {
        const ecfRecord = new EcfRecord();
        ecfRecord.name = record.name || '';
        ecfRecord.parentType = record.parentType || 0;
        ecfRecord.statGroup = record.statGroup || 0;
        ecfRecord.str = record.str || 0;
        ecfRecord.intl = record.int || 0;  // Convert 'int' back to 'intl'
        ecfRecord.wis = record.wis || 0;
        ecfRecord.agi = record.agi || 0;
        ecfRecord.con = record.con || 0;
        ecfRecord.cha = record.cha || 0;
        
        return ecfRecord;
      });
      
      // Serialize to writer
      Ecf.serialize(writer, ecf);
      
      // Return the raw bytes
      return writer.toByteArray();
    } catch (error: any) {
      console.error('Failed to serialize ECF data:', error);
      throw new Error(`Failed to create ECF file: ${error.message}`);
    }
  }
}

export { ECFParser };

/**
 * GFX (Graphics File) Parser for Endless Online
 * Parses .egf files which are essentially PE (Portable Executable) format
 * with embedded bitmap resources
 */

class GFXLoader {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Parse PE file header to find resource section
   */
  static parsePEHeader(data) {
    const view = new DataView(data.buffer, data.byteOffset);
    
    // Check DOS header signature "MZ"
    if (view.getUint16(0, true) !== 0x5A4D) {
      throw new Error('Invalid PE file: missing MZ signature');
    }

    // Get PE header offset (at 0x3C)
    const peOffset = view.getUint32(0x3C, true);
    
    // Check PE signature "PE\0\0"
    if (view.getUint32(peOffset, true) !== 0x00004550) {
      throw new Error('Invalid PE file: missing PE signature');
    }

    // Read COFF header
    const coffOffset = peOffset + 4;
    const numberOfSections = view.getUint16(coffOffset + 2, true);
    const sizeOfOptionalHeader = view.getUint16(coffOffset + 16, true);

    // Section table starts after optional header
    const sectionTableOffset = coffOffset + 20 + sizeOfOptionalHeader;

    // Find .rsrc section
    for (let i = 0; i < numberOfSections; i++) {
      const sectionOffset = sectionTableOffset + (i * 40);
      
      // Read section name (8 bytes)
      let sectionName = '';
      for (let j = 0; j < 8; j++) {
        const char = view.getUint8(sectionOffset + j);
        if (char === 0) break;
        sectionName += String.fromCharCode(char);
      }

      if (sectionName === '.rsrc') {
        return {
          virtualAddress: view.getUint32(sectionOffset + 12, true),
          pointerToRawData: view.getUint32(sectionOffset + 20, true),
          sizeOfRawData: view.getUint32(sectionOffset + 16, true)
        };
      }
    }

    return null;
  }

  /**
   * Create a data URL from bitmap data for display in HTML
   */
  static createImageDataURL(bitmapData) {
    if (!bitmapData) return null;
    
    try {
      // Create a blob from the bitmap data
      const blob = new Blob([bitmapData], { type: 'image/bmp' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error creating image data URL:', error);
      return null;
    }
  }

  /**
   * Extract bitmap resource by ID from PE file
   * Resources in PE files have IDs starting at 100
   * For items: inventory graphic = resourceId + 100, map graphic = resourceId + 99
   */
  static extractBitmapByID(gfxFileData, resourceId) {
    try {
      const header = this.parsePEHeader(gfxFileData);
      if (!header) {
        console.warn('No resource section found in GFX file');
        return null;
      }

      // Parse resource directory to find bitmap resources (type 2)
      const resourceOffset = header.pointerToRawData;
      const bitmapResources = this.findBitmapResources(
        gfxFileData,
        resourceOffset,
        header.virtualAddress,
        resourceId,
        header
      );

      if (bitmapResources.length === 0) {
        return null;
      }

      // Get the first matching resource
      const resource = bitmapResources[0];
      return this.convertDIBToBMP(gfxFileData, resource.dataOffset, resource.dataSize);
    } catch (error) {
      console.error('Error extracting bitmap:', error);
      return null;
    }
  }

  /**
   * Find bitmap resources in PE file
   * Bitmap resources have type ID 2 (RT_BITMAP)
   */
  static findBitmapResources(data, baseOffset, virtualAddress, targetId, header) {
    const view = new DataView(data.buffer, data.byteOffset);
    const resources = [];

    try {
      // Root resource directory
      const numberOfNamedEntries = view.getUint16(baseOffset + 12, true);
      const numberOfIdEntries = view.getUint16(baseOffset + 14, true);
      
      let entryOffset = baseOffset + 16;

      // Look for type 2 (RT_BITMAP)
      for (let i = 0; i < numberOfIdEntries; i++) {
        const typeId = view.getUint32(entryOffset, true);
        const offsetToData = view.getUint32(entryOffset + 4, true);
        entryOffset += 8;

        if (typeId === 2 && (offsetToData & 0x80000000)) {
          // Found bitmap type directory
          const typeDir = baseOffset + (offsetToData & 0x7FFFFFFF);
          
          // Parse name/ID directory
          const numNamedIds = view.getUint16(typeDir + 12, true);
          const numIds = view.getUint16(typeDir + 14, true);
          let idEntryOffset = typeDir + 16;

          for (let j = 0; j < numIds; j++) {
            const resourceId = view.getUint32(idEntryOffset, true);
            const offsetToLangDir = view.getUint32(idEntryOffset + 4, true);
            idEntryOffset += 8;

            if (resourceId === targetId && (offsetToLangDir & 0x80000000)) {
              // Found our target ID, parse language directory
              const langDir = baseOffset + (offsetToLangDir & 0x7FFFFFFF);
              const numLangIds = view.getUint16(langDir + 14, true);
              
              if (numLangIds > 0) {
                let langEntryOffset = langDir + 16;
                // Take the first language entry
                const offsetToDataEntry = view.getUint32(langEntryOffset + 4, true);
                
                if (!(offsetToDataEntry & 0x80000000)) {
                  // This is a data entry
                  const dataEntry = baseOffset + offsetToDataEntry;
                  const rva = view.getUint32(dataEntry, true);
                  const size = view.getUint32(dataEntry + 4, true);
                  
                  // Convert RVA to file offset
                  const fileOffset = rva - virtualAddress + header.pointerToRawData;
                  
                  resources.push({
                    id: resourceId,
                    dataOffset: fileOffset,
                    dataSize: size
                  });
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error parsing resource directory:', error);
    }

    return resources;
  }

  /**
   * Convert DIB (Device Independent Bitmap) to BMP format
   * PE files store bitmaps as DIB data without the BITMAPFILEHEADER
   */
  static convertDIBToBMP(data, offset, size) {
    try {
      // DIB data starts with BITMAPINFOHEADER
      const dibData = data.slice(offset, offset + size);
      const view = new DataView(dibData.buffer, dibData.byteOffset);
      
      // Read BITMAPINFOHEADER
      const headerSize = view.getUint32(0, true);
      
      // Create BMP file header (14 bytes)
      const bmpFileHeader = new Uint8Array(14);
      const bmpView = new DataView(bmpFileHeader.buffer);
      
      // Signature "BM"
      bmpView.setUint8(0, 0x42); // 'B'
      bmpView.setUint8(1, 0x4D); // 'M'
      
      // File size
      const fileSize = 14 + size;
      bmpView.setUint32(2, fileSize, true);
      
      // Reserved
      bmpView.setUint32(6, 0, true);
      
      // Offset to pixel data
      // Calculate based on header size and color table
      let pixelDataOffset = 14 + headerSize;
      
      // Check if there's a color table (for <= 8 bpp)
      if (headerSize >= 40) {
        const bpp = view.getUint16(14, true); // Bits per pixel
        const colorsUsed = view.getUint32(32, true);
        
        if (bpp <= 8) {
          const numColors = colorsUsed || (1 << bpp);
          pixelDataOffset += numColors * 4; // Each color entry is 4 bytes (RGBQUAD)
        }
      }
      
      bmpView.setUint32(10, pixelDataOffset, true);
      
      // Combine file header with DIB data
      const bmpData = new Uint8Array(fileSize);
      bmpData.set(bmpFileHeader, 0);
      bmpData.set(dibData, 14);
      
      return bmpData;
    } catch (error) {
      console.error('Error converting DIB to BMP:', error);
      return null;
    }
  }

  /**
   * Extract all available bitmap resources from GFX file
   * Returns array of {id, graphicId, data} objects
   * For items, returns inventory graphics (even resource IDs)
   */
  static extractAllBitmaps(gfxFileData) {
    const bitmaps = [];
    
    try {
      const header = this.parsePEHeader(gfxFileData);
      if (!header) {
        console.warn('No resource section found in GFX file');
        return bitmaps;
      }

      // Scan for common resource IDs (100-600 is typical range for items)
      // Items use even IDs for inventory graphics: 100, 102, 104, etc.
      // graphicId 0 -> resourceId 100, graphicId 1 -> resourceId 102, etc.
      for (let graphicId = 0; graphicId <= 250; graphicId++) {
        const resourceId = (2 * graphicId) + 100;
        const bitmap = this.extractBitmapByID(gfxFileData, resourceId);
        if (bitmap) {
          bitmaps.push({
            id: resourceId,
            graphicId: graphicId,
            data: bitmap
          });
        }
      }
    } catch (error) {
      console.error('Error extracting all bitmaps:', error);
    }
    
    return bitmaps;
  }
}

// Export for use in renderer
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GFXLoader };
}

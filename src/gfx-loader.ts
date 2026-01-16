/**
 * GFX (Graphics File) Parser for Endless Online
 * Parses .egf files which are essentially PE (Portable Executable) format
 * with embedded bitmap resources
 */

class GFXLoader {
  cache: Map<any, any>;
  
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
      const width = view.getInt32(4, true);
      const height = view.getInt32(8, true);
      const bpp = view.getUint16(14, true); // Bits per pixel
      const colorsUsed = view.getUint32(32, true);
      
      console.log(`Converting DIB: ${width}x${height}, ${bpp}bpp, ${colorsUsed} colors`);
      
      // For 8-bit palette images, convert to 24-bit RGB
      if (bpp === 8) {
        console.log('Detected 8-bit palette image, converting to 24-bit RGB...');
        return this.convertPaletteBMPTo24Bit(dibData, width, Math.abs(height), headerSize, colorsUsed);
      }
      
      // For 16-bit images, convert to 24-bit RGB (browsers often don't handle 16-bit correctly)
      if (bpp === 16) {
        console.log('Detected 16-bit image, converting to 24-bit RGB...');
        return this.convert16BitBMPTo24Bit(dibData, width, Math.abs(height), headerSize);
      }
      
      console.log('Not a palette or 16-bit image, using standard conversion');
      
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
      if (headerSize >= 40 && bpp <= 8) {
        const numColors = colorsUsed || (1 << bpp);
        pixelDataOffset += numColors * 4; // Each color entry is 4 bytes (RGBQUAD)
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
   * Convert 8-bit palette BMP to 24-bit RGB BMP
   * This ensures proper color display in browsers
   */
  static convertPaletteBMPTo24Bit(dibData, width, height, headerSize, colorsUsed) {
    try {
      const view = new DataView(dibData.buffer, dibData.byteOffset);
      
      // Read palette (right after header)
      const numColors = colorsUsed || 256;
      const palette = [];
      const paletteOffset = headerSize;
      
      for (let i = 0; i < numColors; i++) {
        const offset = paletteOffset + i * 4;
        palette.push({
          b: view.getUint8(offset),
          g: view.getUint8(offset + 1),
          r: view.getUint8(offset + 2),
          a: 255 // view.getUint8(offset + 3) - reserved, typically 0
        });
      }
      
      // Calculate pixel data offset (after header and palette)
      const pixelDataOffset = headerSize + numColors * 4;
      
      // BMP rows are padded to 4-byte boundaries
      const rowSize = Math.floor((width + 3) / 4) * 4;
      
      // Create 24-bit BMP
      const newRowSize = Math.floor((width * 3 + 3) / 4) * 4;
      const pixelDataSize = newRowSize * height;
      const newHeaderSize = 40;
      const newFileSize = 14 + newHeaderSize + pixelDataSize;
      
      const bmpData = new Uint8Array(newFileSize);
      const bmpView = new DataView(bmpData.buffer);
      
      // BMP File Header
      bmpView.setUint8(0, 0x42); // 'B'
      bmpView.setUint8(1, 0x4D); // 'M'
      bmpView.setUint32(2, newFileSize, true);
      bmpView.setUint32(6, 0, true); // Reserved
      bmpView.setUint32(10, 14 + newHeaderSize, true); // Pixel data offset
      
      // DIB Header (BITMAPINFOHEADER)
      bmpView.setUint32(14, newHeaderSize, true); // Header size
      bmpView.setInt32(18, width, true);
      bmpView.setInt32(22, height, true);
      bmpView.setUint16(26, 1, true); // Planes
      bmpView.setUint16(28, 24, true); // Bits per pixel (24-bit)
      bmpView.setUint32(30, 0, true); // Compression (none)
      bmpView.setUint32(34, pixelDataSize, true);
      bmpView.setInt32(38, 2835, true); // X pixels per meter
      bmpView.setInt32(42, 2835, true); // Y pixels per meter
      bmpView.setUint32(46, 0, true); // Colors used
      bmpView.setUint32(50, 0, true); // Important colors
      
      // Convert indexed pixels to RGB
      const outputOffset = 14 + newHeaderSize;
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          // Read palette index
          const srcOffset = pixelDataOffset + y * rowSize + x;
          const paletteIndex = view.getUint8(srcOffset);
          
          // Get color from palette
          const color = palette[paletteIndex] || { r: 0, g: 0, b: 0 };
          
          // Write RGB (BGR order in BMP)
          const dstOffset = outputOffset + y * newRowSize + x * 3;
          bmpData[dstOffset] = color.b;
          bmpData[dstOffset + 1] = color.g;
          bmpData[dstOffset + 2] = color.r;
        }
      }
      
      return bmpData;
    } catch (error) {
      console.error('Error converting palette BMP:', error);
      return null;
    }
  }

  /**
   * Convert 16-bit BMP to 24-bit RGB BMP
   * Handles RGB555 and RGB565 formats
   */
  static convert16BitBMPTo24Bit(dibData, width, height, headerSize) {
    try {
      const view = new DataView(dibData.buffer, dibData.byteOffset);
      
      // Read compression method to determine bit field format
      const compression = view.getUint32(16, true);
      
      // Default to RGB555 (standard 16-bit BMP format)
      let redMask = 0x7C00;    // 0111 1100 0000 0000 (bits 10-14)
      let greenMask = 0x03E0;  // 0000 0011 1110 0000 (bits 5-9)
      let blueMask = 0x001F;   // 0000 0000 0001 1111 (bits 0-4)
      let redShift = 10, greenShift = 5, blueShift = 0;
      let redBits = 5, greenBits = 5, blueBits = 5;
      
      // Calculate pixel data offset (after header and optional bit field masks)
      let pixelDataOffset = headerSize;
      
      // If compression == 3 (BI_BITFIELDS), read bit masks from header
      if (compression === 3) {
        // Bit field masks are stored right after the header (before pixel data)
        redMask = view.getUint32(headerSize, true);
        greenMask = view.getUint32(headerSize + 4, true);
        blueMask = view.getUint32(headerSize + 8, true);
        
        // Pixel data comes after the 3 DWORD masks (12 bytes)
        pixelDataOffset = headerSize + 12;
        
        // Calculate shifts based on masks
        redShift = this.countTrailingZeros(redMask);
        greenShift = this.countTrailingZeros(greenMask);
        blueShift = this.countTrailingZeros(blueMask);
        
        redBits = this.countBits(redMask);
        greenBits = this.countBits(greenMask);
        blueBits = this.countBits(blueMask);
      }
      
      // Calculate scale factors to convert from reduced bit depth to 8-bit
      const redScale = 255.0 / ((1 << redBits) - 1);
      const greenScale = 255.0 / ((1 << greenBits) - 1);
      const blueScale = 255.0 / ((1 << blueBits) - 1);
      
      console.log(`16-bit conversion: masks R=0x${redMask.toString(16)} G=0x${greenMask.toString(16)} B=0x${blueMask.toString(16)}, bits R=${redBits} G=${greenBits} B=${blueBits}`);
      
      // BMP rows are padded to 4-byte boundaries
      const rowSize = Math.floor((width * 2 + 3) / 4) * 4;
      
      // Create 24-bit BMP
      const newRowSize = Math.floor((width * 3 + 3) / 4) * 4;
      const pixelDataSize = newRowSize * height;
      const newHeaderSize = 40;
      const newFileSize = 14 + newHeaderSize + pixelDataSize;
      
      const bmpData = new Uint8Array(newFileSize);
      const bmpView = new DataView(bmpData.buffer);
      
      // BMP File Header
      bmpView.setUint8(0, 0x42); // 'B'
      bmpView.setUint8(1, 0x4D); // 'M'
      bmpView.setUint32(2, newFileSize, true);
      bmpView.setUint32(6, 0, true); // Reserved
      bmpView.setUint32(10, 14 + newHeaderSize, true); // Pixel data offset
      
      // DIB Header (BITMAPINFOHEADER)
      bmpView.setUint32(14, newHeaderSize, true); // Header size
      bmpView.setInt32(18, width, true);
      bmpView.setInt32(22, height, true);
      bmpView.setUint16(26, 1, true); // Planes
      bmpView.setUint16(28, 24, true); // Bits per pixel (24-bit)
      bmpView.setUint32(30, 0, true); // Compression (none)
      bmpView.setUint32(34, pixelDataSize, true);
      bmpView.setInt32(38, 2835, true); // X pixels per meter
      bmpView.setInt32(42, 2835, true); // Y pixels per meter
      bmpView.setUint32(46, 0, true); // Colors used
      bmpView.setUint32(50, 0, true); // Important colors
      
      // Convert 16-bit pixels to RGB
      const outputOffset = 14 + newHeaderSize;
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          // Read 16-bit pixel (little endian)
          const srcOffset = pixelDataOffset + y * rowSize + x * 2;
          const pixel16 = view.getUint16(srcOffset, true);
          
          // Extract RGB components using bit masks and shifts
          const rVal = (pixel16 & redMask) >>> redShift;
          const gVal = (pixel16 & greenMask) >>> greenShift;
          const bVal = (pixel16 & blueMask) >>> blueShift;
          
          // Scale to 8-bit (0-255) and clamp
          const r = Math.min(255, Math.round(rVal * redScale));
          const g = Math.min(255, Math.round(gVal * greenScale));
          const b = Math.min(255, Math.round(bVal * blueScale));
          
          // Write RGB (BGR order in BMP)
          const dstOffset = outputOffset + y * newRowSize + x * 3;
          bmpData[dstOffset] = b;
          bmpData[dstOffset + 1] = g;
          bmpData[dstOffset + 2] = r;
        }
      }
      
      return bmpData;
    } catch (error) {
      console.error('Error converting 16-bit BMP:', error);
      return null;
    }
  }
  
  /**
   * Count trailing zeros in a bit mask
   */
  static countTrailingZeros(n) {
    if (n === 0) return 32;
    let count = 0;
    while ((n & 1) === 0) {
      n >>>= 1;
      count++;
    }
    return count;
  }
  
  /**
   * Count number of set bits in a bit mask
   */
  static countBits(n) {
    let count = 0;
    while (n) {
      count += n & 1;
      n >>>= 1;
    }
    return count;
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

// ES6 export
export { GFXLoader };
# EO Pub Editor

A cross-platform visual editor for Endless Online pub files and GFX graphics, built with Electron.

## Features

- **Load and Save EIF Files**: Open and edit Endless Online item files (.eif)
- **Visual Editor**: Edit all item properties including stats, requirements, and metadata
- **GFX Preview**: Visual preview of item graphics from GFX files
  - **Static Mode**: Shows the item's inventory graphic
  - **Animated Mode**: Shows animated character preview with equipment (walking/attacking animations)
- **Add/Remove/Duplicate Items**: Full CRUD operations for items
- **Search and Filter**: Quickly find items by name or ID
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Installation

1. Install dependencies:
```bash
npm install
```

2. Run the application:
```bash
npm start
```

## Development

Run in development mode with DevTools open:
```bash
npm run dev
```

## Building

Build for your current platform:
```bash
npm run build
```

Build for specific platforms:
```bash
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## Usage

1. **Open an EIF file**: Click "Open EIF File" and select your item file (e.g., `dat001.eif`)
2. **Set GFX folder**: Click "Set GFX Folder" and select the folder containing GFX files (e.g., `gfx/`)
3. **Edit items**: Click on any item in the list to edit its properties
4. **Preview graphics**: 
   - Use the **Static/Animated** toggle buttons in the preview panel
   - **Static mode**: Shows the item's inventory graphic
   - **Animated mode**: Shows a character wearing/wielding the item with animations:
     - **Armor items**: Male character with walking animation
     - **Weapon items**: Male character with attacking animation
     - **Shield/Back items**: Male character with attacking animation
5. **Save changes**: Click "Save EIF File" to save your modifications

## File Format Information

### EIF Files
EIF (Endless Item File) files store item data including:
- Item names and IDs
- Item types and subtypes
- Stats (HP, TP, damage, armor, etc.)
- Stat modifiers (STR, INT, WIS, AGI, CON, CHA)
- Requirements (level, class, stats)
- Graphics references
- Additional metadata

### GFX Files
GFX files (`.egf`) are PE (Portable Executable) format files containing embedded bitmap resources.

**Item Graphics**: Stored in `gfx023.egf`
- Resource ID formula: `(2 * graphicId) + 100` for inventory graphics

**Character Animation Graphics**:
- `gfx008.egf`: Skin sprites (standing, walking, attacking)
- `gfx013.egf`: Male armor sprites
- `gfx014.egf`: Female armor sprites
- `gfx017.egf`: Male weapon sprites
- `gfx018.egf`: Female weapon sprites
- `gfx019.egf`: Male back/shield items
- `gfx020.egf`: Female back/shield items

## Project Structure

```
eo-pub-editor/
├── src/
│   ├── main.js              # Electron main process
│   ├── preload.js           # Preload script for IPC
│   ├── eif-parser.js        # EIF file parser
│   ├── gfx-loader.js        # GFX file loader
│   ├── character-animator.js # Character animation system
│   └── renderer/
│       ├── index.html       # Main UI
│       ├── styles.css       # Styling
│       └── app.js           # Application logic
├── package.json
└── README.md
```

## Technical Details

### Number Encoding
EO files use a custom number encoding scheme where:
- 254 represents 1
- 0 represents 254
- Numbers are encoded in base-253

### Item Properties
Items have 58 bytes of property data stored in a specific format. The parser handles:
- Multi-byte integers (2-3 bytes)
- Single-byte values
- Proper offset calculations
- CRC32 checksums

## Contributing

Feel free to open issues or submit pull requests for improvements!

## License

MIT

## Credits

Based on the file format specifications from [EndlessClient](https://github.com/ethanmoffat/EndlessClient).

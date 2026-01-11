# Quick Start Guide

## Installation

1. Navigate to the project directory:
```bash
cd c:\Users\coder\code\oaktree\eo-pub-editor
```

2. Install dependencies:
```bash
npm install
```

3. Start the application:
```bash
npm start
```

## First Time Setup

### Step 1: Prepare Your Files
You'll need:
- **EIF file**: Item definition file (e.g., `dat001.eif` from your EO client)
- **GFX folder**: Folder containing GFX files (e.g., the `gfx/` folder with files like `gfx001.egf`, `gfx023.egf`, etc.)

### Step 2: Load Your Data
1. Click **"Open EIF File"** button
2. Navigate to your EO client directory
3. Select the item file (usually in `pub/dat001.eif`)
4. Click **"Set GFX Folder"** button
5. Select your GFX folder (usually the `gfx/` directory)

### Step 3: Start Editing
- Browse items in the left panel
- Click on any item to edit its properties
- The right panel shows the visual graphic for the item
- Changes are saved when you click **"Save EIF File"**

## Common Tasks

### Adding a New Item
1. Click **"+ Add Item"** button
2. Fill in the item properties
3. Set the graphic ID to link to a GFX image
4. Click **"Save EIF File"**

### Changing Item Graphics
1. Select an item
2. In the right panel, change the Graphic ID number, OR
3. Click **"Browse..."** to visually select a graphic
4. The preview updates automatically

### Duplicating Items
1. Select an item you want to copy
2. Click **"Duplicate"** button
3. Edit the duplicated item as needed
4. Save your changes

### Deleting Items
1. Select the item to delete
2. Click **"Delete Item"** button
3. Confirm the deletion
4. Save your changes

## Tips

- **Search**: Use the search box at the top of the item list to quickly find items
- **Auto-save**: Changes are tracked - the save button enables when you have unsaved changes
- **Graphics**: Item graphics are typically in `gfx023.egf`
- **Backup**: Always backup your original files before making changes!

## Troubleshooting

### "Invalid EIF file" error
- Make sure you're opening a valid `.eif` file
- Check that the file isn't corrupted
- Try with a fresh copy from the original client

### GFX graphics not showing
- Ensure you've selected the correct GFX folder
- Verify that `gfx023.egf` exists in that folder
- Some graphics may fail to load due to file format variations

### Changes not saving
- Check that you have write permissions to the file location
- Make sure the file isn't open in another program
- Try saving to a different location

## Building for Distribution

To create an executable for distribution:

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

The built application will be in the `dist/` folder.

## Getting EO Files

If you need EO client files for testing:
1. Download an Endless Online client
2. Extract the files
3. Look for:
   - `pub/` folder (contains `.eif` files)
   - `gfx/` folder (contains `.egf` files)

## Support

For issues or questions:
- Check the main README.md for technical details
- Review the EndlessClient source code for file format details
- Open an issue on the project repository

## Next Steps

Once you're comfortable with the basics:
- Explore advanced item properties
- Create custom items for your server
- Export and share your modified item files
- Experiment with different graphics

Happy editing!

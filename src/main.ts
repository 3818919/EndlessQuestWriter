const { app, BrowserWindow, ipcMain, dialog, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs').promises;

// Set app name before ready event
app.setName('OakTree');

let mainWindow;

function createWindow() {
  // Determine icon path based on dev/prod mode and platform
  const isDev = process.argv.includes('--dev');
  let iconPath;
  
  if (process.platform === 'darwin') {
    // Use ICNS for macOS
    iconPath = isDev 
      ? path.join(process.cwd(), 'assets', 'icon.icns')
      : path.join(__dirname, '..', 'assets', 'icon.icns');
  } else if (process.platform === 'win32') {
    // Use ICO for Windows
    iconPath = isDev 
      ? path.join(process.cwd(), 'assets', 'icon.ico')
      : path.join(__dirname, '..', 'assets', 'icon.ico');
  } else {
    // Use PNG for Linux
    iconPath = isDev 
      ? path.join(process.cwd(), 'assets', 'icon.png')
      : path.join(__dirname, '..', 'assets', 'icon.png');
  }

  const icon = nativeImage.createFromPath(iconPath);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'OakTree',
    icon: icon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load Vite dev server in development, built files in production
  if (isDev) {
    // Wait a moment for Vite to be ready, then try common ports
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:5174').catch(() => {
        mainWindow.loadURL('http://localhost:5175').catch(() => {
          mainWindow.loadURL('http://localhost:5173');
        });
      });
    }, 1000);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  // Set dock icon for macOS
  if (process.platform === 'darwin') {
    const isDev = process.argv.includes('--dev');
    const iconPath = isDev 
      ? path.join(process.cwd(), 'assets', 'icon.icns')
      : path.join(__dirname, '..', 'assets', 'icon.icns');
    const icon = nativeImage.createFromPath(iconPath);
    if (!icon.isEmpty()) {
      app.dock.setIcon(icon);
    }
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('dialog:openFile', async (event, filters) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: filters || [
      { name: 'Item Files', extensions: ['eif'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select GFX Folder'
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('dialog:saveFile', async (event, defaultPath, filters) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultPath,
    filters: filters || [
      { name: 'Item Files', extensions: ['eif'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled) {
    return result.filePath;
  }
  return null;
});

ipcMain.handle('file:read', async (event, filePath) => {
  try {
    const data = await fs.readFile(filePath);
    return { success: true, data: Array.from(data) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:write', async (event, filePath, data) => {
  try {
    await fs.writeFile(filePath, Buffer.from(data));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:readGFX', async (event, gfxPath, gfxNumber) => {
  try {
    // Format: gfx001.egf, gfx002.egf, etc.
    const fileName = `gfx${String(gfxNumber).padStart(3, '0')}.egf`;
    const filePath = path.join(gfxPath, fileName);
    const data = await fs.readFile(filePath);
    return { success: true, data: Array.from(data) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:listGFXFiles', async (event, gfxPath) => {
  try {
    const files = await fs.readdir(gfxPath);
    const gfxFiles = files
      .filter(f => f.match(/^gfx\d{3}\.egf$/i))
      .map(f => {
        const match = f.match(/gfx(\d{3})\.egf/i);
        return parseInt(match[1], 10);
      })
      .sort((a, b) => a - b);
    return { success: true, files: gfxFiles };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
ipcMain.handle('path:join', async (event, ...paths) => {
  return path.join(...paths);
});

ipcMain.handle('file:exists', async (event, filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
});

ipcMain.handle('file:isDirectory', async (event, filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
});
/* eslint-disable @typescript-eslint/no-var-requires */
const { app, BrowserWindow, ipcMain, dialog, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs').promises;

// Set app name before ready event
app.setName('Endless Quest Writer');

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
    title: 'Endless Quest Writer',
    icon: icon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Set Content Security Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          isDev 
            ? "default-src 'self' 'unsafe-inline' data: blob: http://localhost:* ws://localhost:* https://cdn.jsdelivr.net; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' http://localhost:* https://cdn.jsdelivr.net; img-src 'self' data: blob: http://localhost:*; worker-src 'self' blob: https://cdn.jsdelivr.net; font-src 'self' data: https://cdn.jsdelivr.net"
            : "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: blob:; connect-src 'self'; font-src 'self' data: https://cdn.jsdelivr.net; worker-src 'self' blob: https://cdn.jsdelivr.net"
        ]
      }
    });
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
      { name: 'Quest Files', extensions: ['eqf'] },
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
    title: 'Select Directory'
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
      { name: 'Quest Files', extensions: ['eqf'] },
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

ipcMain.handle('file:readText', async (event, filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:writeText', async (event, filePath, text) => {
  try {
    await fs.writeFile(filePath, text, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('path:join', async (event, ...paths) => {
  return path.join(...paths);
});

ipcMain.handle('path:getHomeDir', async () => {
  const os = require('os');
  return os.homedir();
});

ipcMain.handle('path:getCwd', async () => {
  return process.cwd();
});

ipcMain.handle('window:setTitle', async (event, title) => {
  if (mainWindow) {
    mainWindow.setTitle(title);
  }
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

ipcMain.handle('file:ensureDir', async (event, dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return { success: true };
  } catch (error) {
    console.error('Error creating directory:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:listDirectories', async (event, dirPath) => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const directories = entries
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
      .map(entry => entry.name);
    return directories;
  } catch (error) {
    console.error('Error listing directories:', error);
    return [];
  }
});

ipcMain.handle('file:deleteDirectory', async (event, dirPath) => {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
    return { success: true };
  } catch (error) {
    console.error('Error deleting directory:', error);
    return { success: false, error: error.message };
  }
});

// Check if path exists
ipcMain.handle('file:pathExists', async (event, filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
});

// Rename file or directory
ipcMain.handle('file:rename', async (event, oldPath, newPath) => {
  try {
    await fs.rename(oldPath, newPath);
    return { success: true };
  } catch (error) {
    console.error('Error renaming:', error);
    return { success: false, error: error.message };
  }
});

// Select folder dialog
ipcMain.handle('dialog:selectFolder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'No folder selected' };
    }
    
    return { success: true, path: result.filePaths[0] };
  } catch (error) {
    console.error('Error selecting folder:', error);
    return { success: false, error: error.message };
  }
});

// Select file dialog
ipcMain.handle('dialog:selectFile', async (event, options) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: options?.filters || [
        { name: 'Quest Files', extensions: ['eqf'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'No file selected' };
    }
    
    return { success: true, path: result.filePaths[0] };
  } catch (error) {
    console.error('Error selecting file:', error);
    return { success: false, error: error.message };
  }
});

// List files in a directory with optional extension filter
ipcMain.handle('file:listFiles', async (event, dirPath, extension) => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    let files = entries
      .filter(entry => entry.isFile())
      .map(entry => entry.name);
    
    // Filter by extension if provided
    if (extension) {
      const ext = extension.startsWith('.') ? extension : `.${extension}`;
      files = files.filter(f => f.toLowerCase().endsWith(ext.toLowerCase()));
    }
    
    return { success: true, files };
  } catch (error) {
    return { success: false, error: error.message, files: [] };
  }
});

// Read multiple text files at once (batch operation)
ipcMain.handle('file:readTextBatch', async (event, filePaths) => {
  const results = {};
  
  await Promise.all(filePaths.map(async (filePath) => {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      results[filePath] = { success: true, data };
    } catch (error) {
      results[filePath] = { success: false, error: error.message };
    }
  }));
  
  return results;
});

// Delete a single file
ipcMain.handle('file:deleteFile', async (event, filePath) => {
  try {
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get the user config directory path (external, editable by user)
ipcMain.handle('path:getConfigDir', async () => {
  const isDev = process.argv.includes('--dev');
  if (isDev) {
    // In development, use the project's config folder
    return path.join(process.cwd(), 'config');
  } else {
    // In production, use user's home directory for editable config
    const homeDir = app.getPath('home');
    const userConfigDir = path.join(homeDir, '.endless-quest-writer', 'config');
    return userConfigDir;
  }
});

// Get the bundled config directory path (read-only defaults inside AppImage)
ipcMain.handle('path:getBundledConfigDir', async () => {
  const isDev = process.argv.includes('--dev');
  if (isDev) {
    return path.join(process.cwd(), 'config');
  } else {
    // In production, bundled config is in the resources folder
    return path.join((process as any).resourcesPath || path.dirname(app.getPath('exe')), 'config');
  }
});

// Initialize user config directory by copying defaults if needed
ipcMain.handle('config:initialize', async () => {
  const isDev = process.argv.includes('--dev');
  if (isDev) {
    // In dev mode, just use the project config directly
    return { success: true, configDir: path.join(process.cwd(), 'config') };
  }
  
  const homeDir = app.getPath('home');
  const userConfigDir = path.join(homeDir, '.endless-quest-writer', 'config');
  const bundledConfigDir = path.join((process as any).resourcesPath || path.dirname(app.getPath('exe')), 'config');
  
  try {
    // Create user config directory if it doesn't exist
    await fs.mkdir(userConfigDir, { recursive: true });
    
    // Copy actions.ini if it doesn't exist
    const actionsPath = path.join(userConfigDir, 'actions.ini');
    try {
      await fs.access(actionsPath);
    } catch {
      const bundledActionsPath = path.join(bundledConfigDir, 'actions.ini');
      try {
        const content = await fs.readFile(bundledActionsPath, 'utf-8');
        await fs.writeFile(actionsPath, content, 'utf-8');
      } catch (e) {
        console.log('Could not copy bundled actions.ini:', e.message);
      }
    }
    
    // Copy rules.ini if it doesn't exist
    const rulesPath = path.join(userConfigDir, 'rules.ini');
    try {
      await fs.access(rulesPath);
    } catch {
      const bundledRulesPath = path.join(bundledConfigDir, 'rules.ini');
      try {
        const content = await fs.readFile(bundledRulesPath, 'utf-8');
        await fs.writeFile(rulesPath, content, 'utf-8');
      } catch (e) {
        console.log('Could not copy bundled rules.ini:', e.message);
      }
    }
    
    // Create templates directory and copy default templates if it doesn't exist
    const templatesDir = path.join(userConfigDir, 'templates');
    try {
      await fs.access(templatesDir);
    } catch {
      await fs.mkdir(templatesDir, { recursive: true });
      
      // Copy all template files from bundled config
      const bundledTemplatesDir = path.join(bundledConfigDir, 'templates');
      try {
        const files = await fs.readdir(bundledTemplatesDir);
        for (const file of files) {
          if (file.endsWith('.eqf')) {
            const content = await fs.readFile(path.join(bundledTemplatesDir, file), 'utf-8');
            await fs.writeFile(path.join(templatesDir, file), content, 'utf-8');
          }
        }
      } catch (e) {
        console.log('Could not copy bundled templates:', e.message);
      }
    }
    
    return { success: true, configDir: userConfigDir };
  } catch (error) {
    return { success: false, error: error.message, configDir: userConfigDir };
  }
});

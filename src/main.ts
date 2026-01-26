/* eslint-disable @typescript-eslint/no-var-requires */
const { app, BrowserWindow, ipcMain, dialog, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { appUpdater } = require('./updater');


app.setName('Endless Quest Writer');

let mainWindow;
let splashWindow;

function createSplashWindow() {
  
  const isDev = process.argv.includes('--dev');
  let iconPath;
  
  if (process.platform === 'darwin') {
    
    iconPath = isDev 
      ? path.join(process.cwd(), 'assets', 'icon.icns')
      : path.join(__dirname, '..', 'assets', 'icon.icns');
  } else if (process.platform === 'win32') {
    
    iconPath = isDev 
      ? path.join(process.cwd(), 'assets', 'icon.ico')
      : path.join(__dirname, '..', 'assets', 'icon.ico');
  } else {
    
    iconPath = isDev 
      ? path.join(process.cwd(), 'assets', 'icon.png')
      : path.join(__dirname, '..', 'assets', 'icon.png');
  }

  const icon = nativeImage.createFromPath(iconPath);

  splashWindow = new BrowserWindow({
    width: 600,
    height: 400,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    resizable: false,
    icon: icon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  
  const splashHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Endless Quest Writer</title>
      <style>
        :root {
          --bg-primary: #1e1e1e;
          --bg-secondary: #252526;
          --bg-tertiary: #2d2d30;
          --text-primary: #cccccc;
          --text-secondary: #9d9d9d;
          --text-tertiary: #6f6f6f;
          --accent-primary: #007acc;
          --accent-success: #4caf50;
          --accent-warning: #ff9800;
          --accent-danger: #f44336;
          --border-primary: #3e3e42;
          --border-secondary: #464647;
          --shadow: rgba(0, 0, 0, 0.2);
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: var(--bg-primary);
          color: var(--text-primary);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          overflow: hidden;
        }
        
        .splash-container {
          text-align: center;
          padding: 40px;
        }
        
        .app-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 24px;
          background-image: url('icon.png');
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
        }
        
        .app-title {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--text-primary);
        }
        
        .app-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 40px;
        }
        
        .status-text {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 16px;
          min-height: 20px;
        }
        
        .progress-container {
          width: 300px;
          margin: 0 auto 16px;
        }
        
        .progress-bar {
          width: 100%;
          height: 6px;
          background: var(--bg-tertiary);
          border-radius: 3px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: var(--accent-primary);
          border-radius: 3px;
          transition: width 0.3s ease;
          width: 0%;
        }
        
        .progress-text {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-top: 8px;
        }
        
        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid var(--bg-tertiary);
          border-top: 2px solid var(--accent-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 24px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .version-text {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-top: 24px;
        }
      </style>
    </head>
    <body>
      <div class="splash-container">
        <div class="app-icon"></div>
        <div class="app-title">Endless Quest Writer</div>
        <div class="app-subtitle">Visual Editor for Endless Online Quest Files</div>
        
        <div class="status-text" id="status">Initializing...</div>
        
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" id="progress-fill"></div>
          </div>
          <div class="progress-text" id="progress-text">0%</div>
        </div>
        
        <div class="version-text">Version ${app.getVersion()}</div>
      </div>
      
      <script>
        
        window.electronAPI.onUpdateStatus((status, progress) => {
          document.getElementById('status').textContent = status;
          if (progress >= 0) {
            document.getElementById('progress-fill').style.width = progress + '%';
            document.getElementById('progress-text').textContent = Math.round(progress) + '%';
          }
        });
      </script>
    </body>
    </html>
  `;

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHtml)}`);

  if (isDev) {
    splashWindow.webContents.openDevTools();
  }

  return splashWindow;
}

function createWindow() {
  
  const isDev = process.argv.includes('--dev');
  let iconPath;
  
  if (process.platform === 'darwin') {
    
    iconPath = isDev 
      ? path.join(process.cwd(), 'assets', 'icon.icns')
      : path.join(__dirname, '..', 'assets', 'icon.icns');
  } else if (process.platform === 'win32') {
    
    iconPath = isDev 
      ? path.join(process.cwd(), 'assets', 'icon.ico')
      : path.join(__dirname, '..', 'assets', 'icon.ico');
  } else {
    
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
    show: false, 
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  
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

  
  if (isDev) {
    
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

  
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  
  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
  });
}


function updateSplashStatus(status, progress = -1) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send('update-status', status, progress);
  }
}


async function initializeApp() {
  const isDev = process.argv.includes('--dev');
  
  try {
    updateSplashStatus('Checking for updates...', 10);
    
    
    if (isDev) {
      updateSplashStatus('Starting application...', 90);
      setTimeout(() => {
        updateSplashStatus('Ready!', 100);
        setTimeout(() => {
          createWindow();
        }, 500);
      }, 1000);
      return;
    }

    
    const updateResult = await appUpdater.checkForUpdatesOnStartup();
    
    if (updateResult.hasUpdate && updateResult.updateInfo) {
      updateSplashStatus('Update available! Downloading...', 30);
      
      
      appUpdater.on('download-progress', (progressObj) => {
        const progress = 30 + (progressObj.percent * 0.6); 
        updateSplashStatus(`Downloading update... ${Math.round(progressObj.percent)}%`, progress);
      });
      
      
      try {
        await appUpdater.downloadAndInstallUpdate(updateResult.updateInfo);
        updateSplashStatus('Update downloaded! Restarting...', 100);
        
        
        setTimeout(() => {
          appUpdater.quitAndInstall();
        }, 1500);
        
      } catch (error) {
        console.error('Update download failed:', error);
        updateSplashStatus('Update failed. Starting application...', 90);
        setTimeout(() => {
          createWindow();
        }, 1000);
      }
    } else {
      
      updateSplashStatus('Starting application...', 90);
      setTimeout(() => {
        updateSplashStatus('Ready!', 100);
        setTimeout(() => {
          createWindow();
        }, 500);
      }, 1000);
    }
    
  } catch (error) {
    console.error('Update check failed:', error);
    updateSplashStatus('Starting application...', 90);
    setTimeout(() => {
      createWindow();
    }, 1000);
  }
}

app.whenReady().then(async () => {
  
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

  
  createSplashWindow();
  
  
  appUpdater.setMainWindow(splashWindow);
  
  
  await initializeApp();

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


ipcMain.handle('file:pathExists', async (event, filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
});


ipcMain.handle('file:rename', async (event, oldPath, newPath) => {
  try {
    await fs.rename(oldPath, newPath);
    return { success: true };
  } catch (error) {
    console.error('Error renaming:', error);
    return { success: false, error: error.message };
  }
});


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


ipcMain.handle('file:listFiles', async (event, dirPath, extension) => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    let files = entries
      .filter(entry => entry.isFile())
      .map(entry => entry.name);
    
    
    if (extension) {
      const ext = extension.startsWith('.') ? extension : `.${extension}`;
      files = files.filter(f => f.toLowerCase().endsWith(ext.toLowerCase()));
    }
    
    return { success: true, files };
  } catch (error) {
    return { success: false, error: error.message, files: [] };
  }
});


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

ipcMain.handle('file:deleteFile', async (event, filePath) => {
  try {
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('path:getTemplatesDir', async () => {
  const homeDir = app.getPath('home');
  const templatesDir = path.join(homeDir, '.endless-quest-writer', 'templates');
  return templatesDir;
});

ipcMain.handle('path:getAppDataDir', async () => {
  const homeDir = app.getPath('home');
  return path.join(homeDir, '.endless-quest-writer');
});

ipcMain.handle('path:getBundledConfigDir', async () => {
  const isDev = process.argv.includes('--dev');
  if (isDev) {
    return path.join(process.cwd(), 'config');
  } else {
    return path.join((process as any).resourcesPath || path.dirname(app.getPath('exe')), 'config');
  }
});

ipcMain.handle('path:getBundledTemplatesDir', async () => {
  const isDev = process.argv.includes('--dev');
  if (isDev) {
    return path.join(process.cwd(), 'templates');
  } else {
    return path.join((process as any).resourcesPath || path.dirname(app.getPath('exe')), 'templates');
  }
});

async function convertIniToJson(iniPath: string, jsonPath: string, isAction = true) {
  try {
    const content = await fs.readFile(iniPath, 'utf-8');
    const lines = content.split('\n');
    const result: Record<string, { description: string; params: Array<{ name: string; type: string }> }> = {};
    
    let currentSection: string | null = null;
    let currentData: { signature?: string; description?: string } = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(';')) continue;
      
      const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);
      if (sectionMatch) {
        if (currentSection && currentData.signature && currentData.description) {
          const paramMatch = currentData.signature.match(/\(([^)]*)\)/);
          const params = [];
          if (paramMatch && paramMatch[1].trim()) {
            let current = '';
            let inQuotes = false;
            const paramsStr = paramMatch[1];
            
            for (let i = 0; i < paramsStr.length; i++) {
              const char = paramsStr[i];
              if (char === '"') {
                inQuotes = !inQuotes;
                current += char;
              } else if (char === ',' && !inQuotes) {
                const param = current.trim().replace(/`/g, '');
                if (param) {
                  if (param.startsWith('"') && param.endsWith('"')) {
                    params.push({ name: param.slice(1, -1), type: 'string' });
                  } else {
                    params.push({ name: param, type: 'integer' });
                  }
                }
                current = '';
              } else {
                current += char;
              }
            }
            const lastParam = current.trim().replace(/`/g, '');
            if (lastParam) {
              if (lastParam.startsWith('"') && lastParam.endsWith('"')) {
                params.push({ name: lastParam.slice(1, -1), type: 'string' });
              } else {
                params.push({ name: lastParam, type: 'integer' });
              }
            }
          }
          
          result[currentSection] = {
            description: currentData.description,
            params: params
          };
        }
        currentSection = sectionMatch[1];
        currentData = {};
        continue;
      }
      
      const keyValueMatch = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
      if (keyValueMatch && currentSection) {
        const [, key, value] = keyValueMatch;
        if (key === 'signature') {
          currentData.signature = value;
        } else if (key === 'description') {
          currentData.description = value;
        }
      }
    }
    
    if (currentSection && currentData.signature && currentData.description) {
      const paramMatch = currentData.signature.match(/\(([^)]*)\)/);
      const params = [];
      if (paramMatch && paramMatch[1].trim()) {
        let current = '';
        let inQuotes = false;
        const paramsStr = paramMatch[1];
        
        for (let i = 0; i < paramsStr.length; i++) {
          const char = paramsStr[i];
          if (char === '"') {
            inQuotes = !inQuotes;
            current += char;
          } else if (char === ',' && !inQuotes) {
            const param = current.trim().replace(/`/g, '');
            if (param) {
              if (param.startsWith('"') && param.endsWith('"')) {
                params.push({ name: param.slice(1, -1), type: 'string' });
              } else {
                params.push({ name: param, type: 'integer' });
              }
            }
            current = '';
          } else {
            current += char;
          }
        }
        const lastParam = current.trim().replace(/`/g, '');
        if (lastParam) {
          if (lastParam.startsWith('"') && lastParam.endsWith('"')) {
            params.push({ name: lastParam.slice(1, -1), type: 'string' });
          } else {
            params.push({ name: lastParam, type: 'integer' });
          }
        }
      }
      
      result[currentSection] = {
        description: currentData.description,
        params: params
      };
    }
    
    await fs.writeFile(jsonPath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`Converted ${iniPath} to ${jsonPath}`);
    return true;
  } catch (e) {
    console.log(`Could not convert ${iniPath} to JSON:`, e.message);
    return false;
  }
}

async function copyDirectory(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      try {
        await fs.access(destPath);
      } catch {
        const content = await fs.readFile(srcPath);
        await fs.writeFile(destPath, content);
        console.log(`Copied: ${entry.name}`);
      }
    }
  }
}

ipcMain.handle('config:initialize', async () => {
  const isDev = process.argv.includes('--dev');
  
  const homeDir = app.getPath('home');
  const appDataDir = path.join(homeDir, '.endless-quest-writer');
  const userTemplatesDir = path.join(appDataDir, 'templates');
  const bundledTemplatesDir = isDev
    ? path.join(process.cwd(), 'templates')
    : path.join((process as any).resourcesPath || path.dirname(app.getPath('exe')), 'templates');
  
  try {
    await fs.mkdir(appDataDir, { recursive: true });
    await fs.mkdir(userTemplatesDir, { recursive: true });
    await fs.mkdir(path.join(userTemplatesDir, 'states'), { recursive: true });

    const oldConfigDir = path.join(appDataDir, 'config');
    try {
      await fs.access(oldConfigDir);
      console.log('Found old config directory, migrating...');

      const actionsIniPath = path.join(oldConfigDir, 'actions.ini');
      const actionsJsonPath = path.join(oldConfigDir, 'actions.json');
      let hasCustomActions = false;
      try {
        await fs.access(actionsIniPath);
        hasCustomActions = true;
        try {
          await fs.access(actionsJsonPath);
        } catch {
          await convertIniToJson(actionsIniPath, actionsJsonPath, true);
          console.log('Converted actions.ini to actions.json');
        }
      } catch (e) {
        try {
          await fs.access(actionsJsonPath);
          hasCustomActions = true;
        } catch {
        }
      }
      
      const rulesIniPath = path.join(oldConfigDir, 'rules.ini');
      const rulesJsonPath = path.join(oldConfigDir, 'rules.json');
      let hasCustomRules = false;
      try {
        await fs.access(rulesIniPath);
        hasCustomRules = true;
        try {
          await fs.access(rulesJsonPath);
        } catch {
          await convertIniToJson(rulesIniPath, rulesJsonPath, false);
          console.log('Converted rules.ini to rules.json');
        }
      } catch (e) {
        try {
          await fs.access(rulesJsonPath);
          hasCustomRules = true;
        } catch {

        }
      }

      if (hasCustomActions || hasCustomRules) {
        const entries = await fs.readdir(appDataDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && entry.name !== 'config' && entry.name !== 'templates') {
            const projectDir = path.join(appDataDir, entry.name);
            const projectConfigPath = path.join(projectDir, 'config.json');
            try {
              await fs.access(projectConfigPath);
              if (hasCustomActions) {
                const projectActionsPath = path.join(projectDir, 'actions.json');
                try {
                  await fs.access(projectActionsPath);
                } catch {
                  try {
                    const content = await fs.readFile(actionsJsonPath, 'utf-8');
                    await fs.writeFile(projectActionsPath, content, 'utf-8');
                    console.log(`Migrated custom actions.json to project: ${entry.name}`);
                  } catch (e) {
                    console.log(`Could not migrate actions.json to project ${entry.name}`);
                  }
                }
              }
              
              if (hasCustomRules) {
                const projectRulesPath = path.join(projectDir, 'rules.json');
                try {
                  await fs.access(projectRulesPath);
                } catch {
                  try {
                    const content = await fs.readFile(rulesJsonPath, 'utf-8');
                    await fs.writeFile(projectRulesPath, content, 'utf-8');
                    console.log(`Migrated custom rules.json to project: ${entry.name}`);
                  } catch (e) {
                    console.log(`Could not migrate rules.json to project ${entry.name}`);
                  }
                }
              }
            } catch (e) {

            }
          }
        }
      }
      
      const oldTemplatesInConfig = path.join(oldConfigDir, 'templates');
      try {
        await fs.access(oldTemplatesInConfig);
        const files = await fs.readdir(oldTemplatesInConfig);
        for (const file of files) {
          const oldPath = path.join(oldTemplatesInConfig, file);
          const stats = await fs.stat(oldPath);
          
          if (stats.isFile() && file.endsWith('.eqf')) {
            const newPath = path.join(userTemplatesDir, file);
            try {
              await fs.access(newPath);
            } catch {
              const content = await fs.readFile(oldPath, 'utf-8');
              await fs.writeFile(newPath, content, 'utf-8');
              console.log(`Migrated template: ${file}`);
            }
          } else if (stats.isDirectory() && file === 'states') {
            const stateFiles = await fs.readdir(oldPath);
            for (const stateFile of stateFiles) {
              if (stateFile.endsWith('.eqf')) {
                const oldStatePath = path.join(oldPath, stateFile);
                const newStatePath = path.join(userTemplatesDir, 'states', stateFile);
                try {
                  await fs.access(newStatePath);
                } catch {
                  const content = await fs.readFile(oldStatePath, 'utf-8');
                  await fs.writeFile(newStatePath, content, 'utf-8');
                  console.log(`Migrated state template: ${stateFile}`);
                }
              }
            }
          }
        }
      } catch (e) {

      }

      await fs.rm(oldConfigDir, { recursive: true, force: true });
      console.log('Migration complete - removed old config directory');
    } catch (e) {

    }

    try {
      await copyDirectory(bundledTemplatesDir, userTemplatesDir);
    } catch (e) {
      console.log('Could not copy bundled templates:', e.message);
    }
    
    return { 
      success: true, 
      templatesDir: userTemplatesDir
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      templatesDir: userTemplatesDir
    };
  }
});


ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});


ipcMain.handle('updater:checkForUpdates', async () => {
  try {
    const result = await appUpdater.checkForUpdatesOnStartup();
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});


ipcMain.handle('updater:downloadAndInstall', async () => {
  try {
    const result = await appUpdater.checkForUpdatesOnStartup();
    
    if (!result.hasUpdate || !result.updateInfo) {
      return { success: false, error: 'No update available' };
    }
    await appUpdater.downloadAndInstallUpdate(result.updateInfo);
    return { success: true, message: 'Update downloaded and will be installed on restart' };
  } catch (error) {
    console.error('Error in downloadAndInstall:', error);
    return { success: false, error: error.message };
  }
});

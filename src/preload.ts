/* eslint-disable @typescript-eslint/no-var-requires */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: (filters) => ipcRenderer.invoke('dialog:openFile', filters),
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  saveFile: (defaultPath, filters) => ipcRenderer.invoke('dialog:saveFile', defaultPath, filters),
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  selectFile: (options) => ipcRenderer.invoke('dialog:selectFile', options),
  
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('file:write', filePath, data),
  readTextFile: (filePath) => ipcRenderer.invoke('file:readText', filePath),
  writeTextFile: (filePath, text) => ipcRenderer.invoke('file:writeText', filePath, text),
  
  joinPath: (...paths) => ipcRenderer.invoke('path:join', ...paths),
  getHomeDir: () => ipcRenderer.invoke('path:getHomeDir'),
  getCwd: () => ipcRenderer.invoke('path:getCwd'),
  getConfigDir: () => ipcRenderer.invoke('path:getConfigDir'),
  getBundledConfigDir: () => ipcRenderer.invoke('path:getBundledConfigDir'),
  
  initializeConfig: () => ipcRenderer.invoke('config:initialize'),
  
  setTitle: (title: string) => ipcRenderer.invoke('window:setTitle', title),
  
  fileExists: (filePath) => ipcRenderer.invoke('file:exists', filePath),
  pathExists: (path) => ipcRenderer.invoke('file:pathExists', path),
  isDirectory: (filePath) => ipcRenderer.invoke('file:isDirectory', filePath),
  ensureDir: (dirPath) => ipcRenderer.invoke('file:ensureDir', dirPath),
  listDirectories: (dirPath) => ipcRenderer.invoke('file:listDirectories', dirPath),
  deleteDirectory: (dirPath) => ipcRenderer.invoke('file:deleteDirectory', dirPath),
  renameFile: (oldPath, newPath) => ipcRenderer.invoke('file:rename', oldPath, newPath),
  
  listFiles: (dirPath, extension) => ipcRenderer.invoke('file:listFiles', dirPath, extension),
  readTextBatch: (filePaths) => ipcRenderer.invoke('file:readTextBatch', filePaths),
  deleteFile: (filePath) => ipcRenderer.invoke('file:deleteFile', filePath),
  
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  
  checkForUpdates: () => ipcRenderer.invoke('updater:checkForUpdates'),
  downloadAndInstall: () => ipcRenderer.invoke('updater:downloadAndInstall'),
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (event, status, progress) => {
      callback(status, progress);
    });
  }
});

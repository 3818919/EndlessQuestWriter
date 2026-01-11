const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Dialog operations
  openFile: (filters) => ipcRenderer.invoke('dialog:openFile', filters),
  openGFXFolder: () => ipcRenderer.invoke('dialog:openGFXFolder'),
  saveFile: (defaultPath, filters) => ipcRenderer.invoke('dialog:saveFile', defaultPath, filters),
  
  // File operations
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('file:write', filePath, data),
  readGFX: (gfxPath, gfxNumber) => ipcRenderer.invoke('file:readGFX', gfxPath, gfxNumber),
  listGFXFiles: (gfxPath) => ipcRenderer.invoke('file:listGFXFiles', gfxPath)
});

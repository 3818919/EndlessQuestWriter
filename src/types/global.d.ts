/**
 * Global type definitions for Quest Editor
 */
interface ElectronAPI {
  openFile: (filters: Array<{ name: string; extensions: string[] }>) => Promise<string>;
  openDirectory: () => Promise<string>;
  saveFile: (defaultPath: string, filters: Array<{ name: string; extensions: string[] }>) => Promise<string>;
  selectFolder: () => Promise<{ success: boolean; path?: string; error?: string }>;
  selectFile: (options: { filters: Array<{ name: string; extensions: string[] }> }) => Promise<{ success: boolean; path?: string; error?: string }>;
  
  readFile: (filePath: string) => Promise<{ success: boolean; data?: ArrayBuffer; error?: string }>;
  writeFile: (filePath: string, data: Uint8Array) => Promise<{ success: boolean; error?: string }>;
  readTextFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
  writeTextFile: (filePath: string, text: string) => Promise<{ success: boolean; error?: string }>;
  
  joinPath: (...paths: string[]) => Promise<string>;
  getHomeDir: () => Promise<string>;
  getCwd: () => Promise<string>;
  getConfigDir: () => Promise<string>;
  getBundledConfigDir: () => Promise<string>;
  
  initializeConfig: () => Promise<{ success: boolean; configDir: string; error?: string }>;
  
  setTitle: (title: string) => Promise<void>;
  
  fileExists: (filePath: string) => Promise<boolean>;
  pathExists: (path: string) => Promise<boolean>;
  isDirectory: (filePath: string) => Promise<boolean>;
  ensureDir: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
  listDirectories: (dirPath: string) => Promise<string[]>;
  deleteDirectory: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
  renameFile: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>;
  
  listFiles: (dirPath: string, extension?: string) => Promise<{ success: boolean; files: string[]; error?: string }>;
  readTextBatch: (filePaths: string[]) => Promise<Record<string, { success: boolean; data?: string; error?: string }>>;
  deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  
  getVersion: () => Promise<string>;
  
  checkForUpdates: () => Promise<{ 
    success: boolean; 
    hasUpdate?: boolean; 
    updateInfo?: {
      version: string;
      releaseDate: string;
      releaseName?: string;
      releaseNotes?: string;
    };
    error?: string;
  }>;
  downloadAndInstall: () => Promise<{ success: boolean; error?: string }>;
  onUpdateStatus: (callback: (status: string, progress: number) => void) => void;
}

interface Window {
  electronAPI?: ElectronAPI;
  showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
}
interface ElectronFile extends File {
  path: string;
}
interface FileSystemHandle {
  readonly kind: 'file' | 'directory';
  readonly name: string;
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  readonly kind: 'directory';
}

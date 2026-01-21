/**
 * Global type definitions for Quest Editor
 */

// Electron API types
interface ElectronAPI {
  // Dialog operations
  openFile: (filters: Array<{ name: string; extensions: string[] }>) => Promise<string>;
  openDirectory: () => Promise<string>;
  saveFile: (defaultPath: string, filters: Array<{ name: string; extensions: string[] }>) => Promise<string>;
  selectFolder: () => Promise<{ success: boolean; path?: string; error?: string }>;
  selectFile: (options: { filters: Array<{ name: string; extensions: string[] }> }) => Promise<{ success: boolean; path?: string; error?: string }>;
  
  // File operations
  readFile: (filePath: string) => Promise<{ success: boolean; data?: ArrayBuffer; error?: string }>;
  writeFile: (filePath: string, data: Uint8Array) => Promise<{ success: boolean; error?: string }>;
  readTextFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
  writeTextFile: (filePath: string, text: string) => Promise<{ success: boolean; error?: string }>;
  
  // Path utilities
  joinPath: (...paths: string[]) => Promise<string>;
  getHomeDir: () => Promise<string>;
  getCwd: () => Promise<string>;
  getConfigDir: () => Promise<string>;
  getBundledConfigDir: () => Promise<string>;
  
  // Config initialization
  initializeConfig: () => Promise<{ success: boolean; configDir: string; error?: string }>;
  
  // Window operations
  setTitle: (title: string) => Promise<void>;
  
  // File system utilities
  fileExists: (filePath: string) => Promise<boolean>;
  pathExists: (path: string) => Promise<boolean>;
  isDirectory: (filePath: string) => Promise<boolean>;
  ensureDir: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
  listDirectories: (dirPath: string) => Promise<string[]>;
  deleteDirectory: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
  renameFile: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>;
  
  // File listing and batch operations
  listFiles: (dirPath: string, extension?: string) => Promise<{ success: boolean; files: string[]; error?: string }>;
  readTextBatch: (filePaths: string[]) => Promise<Record<string, { success: boolean; data?: string; error?: string }>>;
  deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
}

interface Window {
  electronAPI?: ElectronAPI;
  showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
}

// Electron extends the File interface with a path property
interface ElectronFile extends File {
  path: string;
}

// File System Access API types (for browser)
interface FileSystemHandle {
  readonly kind: 'file' | 'directory';
  readonly name: string;
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  readonly kind: 'directory';
}

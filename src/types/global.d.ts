/**
 * Global type definitions
 */

// Electron API types
interface ElectronAPI {
  readGFX: (gfxFolder: string, gfxNumber: number) => Promise<{ success: boolean; data?: ArrayBuffer; error?: string }>;
  openFile: (filters: Array<{ name: string; extensions: string[] }>) => Promise<string>;
  readFile: (filePath: string) => Promise<{ success: boolean; data?: ArrayBuffer; error?: string }>;
  writeFile: (filePath: string, data: Uint8Array) => Promise<{ success: boolean; error?: string }>;
  openDirectory: () => Promise<string>;
}

interface Window {
  electronAPI?: ElectronAPI;
  showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
}

// File System Access API types (for browser)
interface FileSystemHandle {
  readonly kind: 'file' | 'directory';
  readonly name: string;
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  readonly kind: 'directory';
}

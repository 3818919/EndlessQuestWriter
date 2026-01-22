import { autoUpdater } from 'electron-updater';
import { BrowserWindow, dialog } from 'electron';
import { EventEmitter } from 'events';

export interface UpdateProgress {
  percent: number;
  bytesPerSecond: number;
  total: number;
  transferred: number;
}

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseName?: string;
  releaseNotes?: string;
}

export class AppUpdater extends EventEmitter {
  private mainWindow: BrowserWindow | null = null;
  private updateAvailable = false;
  private updateDownloaded = false;

  constructor() {
    super();
    this.setupAutoUpdater();
  }

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  private setupAutoUpdater() {
    autoUpdater.autoDownload = false; 
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.setFeedURL({
      provider: 'github',
      owner: '3818919',
      repo: 'EndlessQuestWriter'
    });

    
    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for update...');
      this.emit('checking-for-update');
    });

    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info);
      this.updateAvailable = true;
      this.emit('update-available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseName: info.releaseName,
        releaseNotes: info.releaseNotes
      } as UpdateInfo);
    });

    autoUpdater.on('update-not-available', (info) => {
      console.log('Update not available:', info);
      this.emit('update-not-available');
    });

    autoUpdater.on('error', (err) => {
      console.error('Update error:', err);
      this.emit('error', err);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      console.log('Download progress:', progressObj);
      this.emit('download-progress', {
        percent: progressObj.percent,
        bytesPerSecond: progressObj.bytesPerSecond,
        total: progressObj.total,
        transferred: progressObj.transferred
      } as UpdateProgress);
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded:', info);
      this.updateDownloaded = true;
      this.emit('update-downloaded', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseName: info.releaseName,
        releaseNotes: info.releaseNotes
      } as UpdateInfo);
    });
  }

  async checkForUpdates(): Promise<boolean> {
    try {
      const result = await autoUpdater.checkForUpdates();
      return result !== null;
    } catch (error) {
      console.error('Error checking for updates:', error);
      this.emit('error', error);
      return false;
    }
  }

  async downloadUpdate(): Promise<void> {
    if (!this.updateAvailable) {
      throw new Error('No update available to download');
    }

    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      console.error('Error downloading update:', error);
      this.emit('error', error);
      throw error;
    }
  }

  quitAndInstall(): void {
    if (!this.updateDownloaded) {
      throw new Error('No update downloaded to install');
    }

    autoUpdater.quitAndInstall();
  }

  async showUpdateDialog(updateInfo: UpdateInfo): Promise<boolean> {
    if (!this.mainWindow) {
      return false;
    }

    const result = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `A new version (${updateInfo.version}) is available!`,
      detail: updateInfo.releaseNotes || 'Would you like to download and install it now?',
      buttons: ['Download and Install', 'Later', 'Skip This Version'],
      defaultId: 0,
      cancelId: 1
    });

    return result.response === 0;
  }

  async showUpdateReadyDialog(updateInfo: UpdateInfo): Promise<boolean> {
    if (!this.mainWindow) {
      return false;
    }

    const result = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: `Update to version ${updateInfo.version} has been downloaded.`,
      detail: 'The application will restart to apply the update.',
      buttons: ['Restart Now', 'Restart Later'],
      defaultId: 0,
      cancelId: 1
    });

    return result.response === 0;
  }

  
  async checkForUpdatesOnStartup(): Promise<{
    hasUpdate: boolean;
    updateInfo?: UpdateInfo;
  }> {
    return new Promise((resolve) => {
      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve({ hasUpdate: false });
        }
      }, 10000); 

      this.once('update-available', (updateInfo: UpdateInfo) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve({ hasUpdate: true, updateInfo });
        }
      });

      this.once('update-not-available', () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve({ hasUpdate: false });
        }
      });

      this.once('error', () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve({ hasUpdate: false });
        }
      });

      this.checkForUpdates();
    });
  }

  
  async downloadAndInstallUpdate(updateInfo: UpdateInfo): Promise<void> {
    return new Promise((resolve, reject) => {
      this.once('update-downloaded', () => {
        resolve();
      });

      this.once('error', (error) => {
        reject(error);
      });

      this.downloadUpdate().catch(reject);
    });
  }
}


export const appUpdater = new AppUpdater();
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Video processing
  selectVideo: () => ipcRenderer.invoke('select-video'),
  processVideo: (args: any) => ipcRenderer.invoke('process-video', args),
  onJobStatus: (callback: (...args: any[]) => void) => {
    ipcRenderer.on('job-status', (_, ...args) => callback(...args));
  },

  // Authentication
  getAuthToken: () => ipcRenderer.invoke('get-auth-token'),

  // Updates
  onUpdateAvailable: (callback: () => void) => {
    ipcRenderer.on('update-available', callback);
  },
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('update-downloaded', callback);
  },
  installUpdate: () => ipcRenderer.invoke('install-update'),
}); 
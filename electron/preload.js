// This file has been renamed to preload.cjs for CommonJS compatibility.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectVideo: () => ipcRenderer.invoke('select-video'),
  processVideo: (filePath) => ipcRenderer.invoke('process-video', filePath),
  onJobStatus: (callback) => ipcRenderer.on('job-status', callback),
}); 
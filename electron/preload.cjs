const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
  selectImages: () => ipcRenderer.invoke('select-images'),
  processImages: (args) => ipcRenderer.invoke('process-images', args),
  selectVideo: () => ipcRenderer.invoke('select-video'),
  processVideo: (args) => ipcRenderer.invoke('process-video', args),
  onJobStatus: (callback) => ipcRenderer.on('job-status', callback),
}); 
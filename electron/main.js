// This file has been renamed to main.cjs for CommonJS compatibility.
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the React app (assumes build output in dist/)
  win.loadFile(path.join(__dirname, '../dist/index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC: Select video file
ipcMain.handle('select-video', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Videos', extensions: ['mp4', 'mov', 'avi', 'mkv'] }],
  });
  if (canceled || !filePaths[0]) return null;
  return filePaths[0];
});

// IPC: Process video (FFmpeg + Tesseract)
ipcMain.handle('process-video', async (event, { jobId, jobName, filePath, outputDir }) => {
  // 1. Extract frames with FFmpeg
  const frameDir = path.join(outputDir, `frames_${jobId}`);
  fs.mkdirSync(frameDir, { recursive: true });
  const framePattern = path.join(frameDir, 'frame_%04d.jpg');
  const ffmpegArgs = [
    '-i', filePath,
    '-vf', 'fps=1/5,scale=1280:-1',
    '-q:v', '4',
    framePattern
  ];
  event.sender.send('job-status', { jobId, status: 'processing', message: 'Extracting frames...' });
  await new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ffmpegArgs);
    ffmpeg.stderr.on('data', data => {
      // Optionally parse progress
    });
    ffmpeg.on('close', code => {
      if (code === 0) resolve(); else reject(new Error('FFmpeg failed'));
    });
  });

  // 2. OCR each frame with Tesseract
  const frames = fs.readdirSync(frameDir).filter(f => f.endsWith('.jpg'));
  let notes = [];
  for (let i = 0; i < frames.length; i++) {
    const framePath = path.join(frameDir, frames[i]);
    event.sender.send('job-status', { jobId, status: 'processing', message: `OCR on frame ${i+1}/${frames.length}` });
    await new Promise((resolve, reject) => {
      const tesseract = spawn('tesseract', [framePath, 'stdout', '-l', 'eng']);
      let text = '';
      tesseract.stdout.on('data', data => { text += data.toString(); });
      tesseract.on('close', code => {
        if (code === 0) {
          notes.push(text.trim());
          resolve();
        } else {
          notes.push('[OCR ERROR]');
          resolve();
        }
      });
    });
  }

  // 3. Save notes to a text file
  const notesText = notes.join('\n---\n');
  const notesPath = path.join(outputDir, `notes_${jobId}.txt`);
  fs.writeFileSync(notesPath, notesText);
  event.sender.send('job-status', { jobId, status: 'done', notesPath });
  // Optionally: clean up frames
  return notesPath;
}); 
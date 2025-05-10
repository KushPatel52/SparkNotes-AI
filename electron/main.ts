import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const execAsync = promisify(exec);

// Initialize Firebase Admin
const serviceAccount = require('../service-account.json');
initializeApp({
  credential: serviceAccount,
});
const auth = getAuth();
const db = getFirestore();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
  }

  // Check for updates
  autoUpdater.checkForUpdatesAndNotify();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle video selection
ipcMain.handle('select-video', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: 'Videos', extensions: ['mp4', 'mov', 'avi', 'mkv'] },
    ],
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});

// Handle video processing
ipcMain.handle('process-video', async (_, { jobId, jobName, filePath }) => {
  try {
    // Create output directory
    const outputDir = path.join(os.homedir(), 'SnapNotes', jobId);
    fs.mkdirSync(outputDir, { recursive: true });

    // Extract frames
    await execAsync(`ffmpeg -i "${filePath}" -vf fps=1 "${path.join(outputDir, 'frame_%d.jpg')}"`);

    // Run OCR on frames
    const frames = fs.readdirSync(outputDir).filter(f => f.endsWith('.jpg'));
    const ocrResults = [];

    for (const frame of frames) {
      const result = await execAsync(`tesseract "${path.join(outputDir, frame)}" stdout`);
      ocrResults.push(result.stdout);
    }

    // Generate notes
    const notes = ocrResults.join('\n\n');
    const notesPath = path.join(outputDir, 'notes.txt');
    fs.writeFileSync(notesPath, notes);

    // Update job in Firebase
    await db.collection('jobs').doc(jobId).update({
      status: 'done',
      message: 'Notes generated successfully',
      notesPath,
      notes,  // Store notes in Firebase
      updatedAt: new Date()
    });

    // Update job status in renderer
    mainWindow?.webContents.send('job-status', {
      jobId,
      status: 'done',
      message: 'Notes generated successfully',
      notesPath,
      notes  // Send notes to renderer
    });

  } catch (error) {
    console.error('Processing failed:', error);
    
    // Update job in Firebase
    await db.collection('jobs').doc(jobId).update({
      status: 'error',
      message: 'Failed to process video',
      updatedAt: new Date()
    });

    // Update job status in renderer
    mainWindow?.webContents.send('job-status', {
      jobId,
      status: 'error',
      message: 'Failed to process video'
    });
  }
});

// Handle authentication
ipcMain.handle('get-auth-token', async () => {
  try {
    // Get the stored refresh token
    const refreshToken = fs.readFileSync(path.join(app.getPath('userData'), 'refresh-token.txt'), 'utf-8');
    
    // Get a new custom token
    const customToken = await auth.createCustomToken(refreshToken);
    return customToken;
  } catch (error) {
    console.error('Auth failed:', error);
    return null;
  }
});

// Handle app updates
autoUpdater.on('update-available', () => {
  mainWindow?.webContents.send('update-available');
});

autoUpdater.on('update-downloaded', () => {
  mainWindow?.webContents.send('update-downloaded');
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
}); 
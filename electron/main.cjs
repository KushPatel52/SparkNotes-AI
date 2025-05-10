const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const https = require('https');
const http = require('http');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const llamaCppPath = path.join(__dirname, 'llm/llama-run');
const llamaModelPath = path.join(__dirname, 'llm/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer/dist/index.html'));
  mainWindow.webContents.openDevTools();
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
ipcMain.handle('process-video', async (event, { jobId, jobName, filePath }) => {
  // Always use a safe, writable directory
  const defaultOutputDir = path.join(os.homedir(), 'SnapNotesAI');
  fs.mkdirSync(defaultOutputDir, { recursive: true });
  const frameDir = path.join(defaultOutputDir, `frames_${jobId}`);
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

  // 3. Summarize and polish notes with ChatGPT (OpenAI API)
  let notesText = notes.join('\n---\n');
  // Limit input to 4000 characters for API
  if (notesText.length > 4000) notesText = notesText.slice(0, 4000);
  event.sender.send('job-status', { jobId, status: 'processing', message: 'Polishing notes with ChatGPT...' });
  let polishedNotes = notesText;
  try {
    if (!OPENAI_API_KEY) throw new Error('No OpenAI API key set.');
    const prompt = `You are an expert note-taker. Clean up and summarize the following messy lecture transcript into clear, readable bullet points for a student.\n\n${notesText}`;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an expert note-taker.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1024,
        temperature: 0.2
      })
    });
    const data = await response.json();
    console.log('OpenAI API status:', response.status);
    console.log('OpenAI API raw response:', data);
    if (response.status !== 200) {
      throw new Error(`OpenAI API error: ${data.error ? data.error.message : 'Unknown error'}`);
    }
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      polishedNotes = data.choices[0].message.content.trim();
    } else {
      throw new Error('No response from OpenAI API. Raw response: ' + JSON.stringify(data));
    }
  } catch (err) {
    polishedNotes = '[AI Polishing failed: ' + err.message + ']';
    console.error('ChatGPT error:', err);
  }

  const notesPath = path.join(defaultOutputDir, `notes_${jobId}.txt`);
  fs.writeFileSync(notesPath, polishedNotes);
  event.sender.send('job-status', { jobId, status: 'done', notesPath });
  postJobStatusToWeb({ jobId, jobName, status: 'done', notesPath });
  // Optionally: clean up frames
  return notesPath;
});

// IPC: Select images
ipcMain.handle('select-images', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'bmp', 'tiff'] }],
  });
  if (canceled || !filePaths.length) return [];
  return filePaths;
});

// IPC: Process images (Tesseract)
ipcMain.handle('process-images', async (event, { jobId, jobName, imagePaths, outputDir }) => {
  let notes = [];
  for (let i = 0; i < imagePaths.length; i++) {
    const imagePath = imagePaths[i];
    event.sender.send('job-status', { jobId, status: 'processing', message: `OCR on image ${i+1}/${imagePaths.length}` });
    await new Promise((resolve, reject) => {
      const tesseract = spawn('tesseract', [imagePath, 'stdout', '-l', 'eng']);
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
  // Save notes to a text file
  const notesText = notes.join('\n---\n');
  const notesPath = path.join(outputDir, `notes_${jobId}.txt`);
  fs.writeFileSync(notesPath, notesText);
  event.sender.send('job-status', { jobId, status: 'done', notesPath });
  postJobStatusToWeb({ jobId, jobName, status: 'done', notesPath });
  return notesPath;
});

function postJobStatusToWeb(job) {
  // Replace with your real API endpoint and auth as needed
  const data = JSON.stringify(job);
  const url = process.env.WEB_API_URL || 'http://localhost:3000/api/jobs';
  const parsedUrl = new URL(url);
  const lib = parsedUrl.protocol === 'https:' ? https : http;
  const req = lib.request({
    hostname: parsedUrl.hostname,
    port: parsedUrl.port,
    path: parsedUrl.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  }, res => {
    // Optionally handle response
  });
  req.on('error', err => {
    // Optionally log error
  });
  req.write(data);
  req.end();
}
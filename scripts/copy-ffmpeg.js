import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const publicDir = join(__dirname, '../public');

// Create public directory if it doesn't exist
mkdirSync(publicDir, { recursive: true });

// Copy FFmpeg core files
const ffmpegFiles = [
  'ffmpeg-core.js',
  'ffmpeg-core.wasm'
];

ffmpegFiles.forEach(file => {
  const source = join(__dirname, '../node_modules/@ffmpeg/core/dist', file);
  const dest = join(publicDir, file);
  
  if (!existsSync(source)) {
    console.error(`Source file not found: ${source}`);
    process.exit(1);
  }
  
  try {
    copyFileSync(source, dest);
    console.log(`Copied ${file} to public directory`);
  } catch (error) {
    console.error(`Error copying ${file}:`, error);
    process.exit(1);
  }
}); 
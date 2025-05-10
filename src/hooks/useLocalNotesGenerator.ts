import { useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import Tesseract from 'tesseract.js';
import { jsPDF } from 'jspdf';

// Singleton FFmpeg instance
let ffmpegSingleton: FFmpeg | null = null;
function getFFmpeg() {
  if (!ffmpegSingleton) {
    ffmpegSingleton = new FFmpeg();
  }
  return ffmpegSingleton;
}

// Helper: Compare two images (Uint8ClampedArray pixel data) for difference
function isSignificantlyDifferent(data1: Uint8ClampedArray, data2: Uint8ClampedArray, threshold = 0.08) {
  if (!data1 || !data2 || data1.length !== data2.length) return true;
  let diff = 0;
  for (let i = 0; i < data1.length; i++) {
    diff += Math.abs(data1[i] - data2[i]);
  }
  const avgDiff = diff / data1.length / 255;
  return avgDiff > threshold;
}

// Helper: Preprocess image (grayscale + contrast)
async function preprocessImage(blob: Blob): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(blob);
      ctx.drawImage(img, 0, 0);
      // Grayscale
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < imageData.data.length; i += 4) {
        const avg = (imageData.data[i] + imageData.data[i+1] + imageData.data[i+2]) / 3;
        // Increase contrast
        const contrast = 1.5;
        const contrasted = (avg - 128) * contrast + 128;
        imageData.data[i] = imageData.data[i+1] = imageData.data[i+2] = contrasted;
      }
      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob((b) => resolve(b || blob), 'image/jpeg', 0.95);
    };
    img.onerror = () => resolve(blob);
    img.src = URL.createObjectURL(blob);
  });
}

export function useLocalNotesGenerator() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Main function: video file → notes
  const generateNotes = async (file: File) => {
    // Increase limit to 2GB for browser processing
    if (file.size > 2 * 1024 * 1024 * 1024) { // 2GB limit
      setError("Please upload a video smaller than 2GB for browser processing. For larger videos, please use our desktop app.");
      setStatus(null);
      return;
    }

    // Check available memory
    if ((navigator as any).deviceMemory && (navigator as any).deviceMemory < 4) {
      setError("Your device has limited memory. For best results, please use a device with at least 4GB of RAM.");
      setStatus(null);
      return;
    }

    setStatus('Extracting frames...');
    setProgress(0);
    setError(null);

    try {
      const ffmpeg = getFFmpeg();
      if (!ffmpeg.loaded) {
        setStatus('Loading video processor...');
        console.log('Loading FFmpeg WASM...');
        try {
          await ffmpeg.load();
          console.log('FFmpeg loaded');
        } catch (loadError) {
          console.error('FFmpeg load error:', loadError);
          setError('Failed to load video processor. Please refresh the page and try again.');
          return;
        }
      }

      setStatus('Writing video to memory...');
      console.log('Writing video to FFmpeg FS...');
      try {
        await ffmpeg.writeFile('input.mp4', await fetchFile(file));
        console.log('Video written to FS');
      } catch (writeError) {
        console.error('FFmpeg write error:', writeError);
        setError('Failed to process video. The file might be too large or corrupted.');
        return;
      }

      setStatus('Extracting candidate frames...');
      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-vf', 'fps=1/5,scale=854:-1',
        '-q:v', '4',
        '-threads', '1',
        '-preset', 'ultrafast',
        'frame_%04d.jpg'
      ]);
      // Get all candidate frames (limit to first 10 for memory safety)
      let files = (await ffmpeg.listDir('.'))
        .map((f: any) => f.name)
        .filter((name: string) => name.endsWith('.jpg'));
      if (files.length === 0) {
        setError('No frames were extracted. Please try a different video.');
        return { notesText: '', pdfUrl: null };
      }
      files = files.slice(0, 10);
      
      console.log(`Found ${files.length} frames`);
      setStatus(`Processing ${files.length} frames...`);
      let ocrResults: string[] = [];

      // Process frames in smaller batches to manage memory
      const BATCH_SIZE = 2; // Even smaller batch size
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        setProgress(i / files.length);
        console.log(`Processing batch ${i/BATCH_SIZE + 1}/${Math.ceil(files.length/BATCH_SIZE)}`);
        
        // Process each frame in the batch
        const batchResults = await Promise.all(batch.map(async (filename) => {
          try {
            const data = await ffmpeg.readFile(filename);
            const blob = new Blob([data], { type: 'image/jpeg' });
            const text = await Tesseract.recognize(blob, 'eng', {
              logger: m => console.log(m)
            });
            // Clean up memory
            URL.revokeObjectURL(URL.createObjectURL(blob));
            return text.data.text;
          } catch (ocrErr) {
            console.error('Tesseract OCR error:', ocrErr);
            return '[OCR ERROR]';
          }
        }));
        
        ocrResults.push(...batchResults);
        
        // Clean up batch files
        await Promise.all(batch.map(filename => ffmpeg.deleteFile(filename)));
        
        // Force garbage collection if available
        if (window.gc) {
          window.gc();
        }
      }
      setProgress(1);

      // Combine results
      const notesText = ocrResults.join('\n---\n');

      // Generate PDF
      setStatus('Generating PDF...');
      console.log('Generating PDF...');
      try {
        const pdf = new jsPDF();
        pdf.text(notesText, 10, 10);
        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setStatus('done');
        console.log('PDF generated');
        return { notesText, pdfUrl };
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
        setError('Failed to generate PDF. The extracted text might be too large.');
        // Return text only if PDF generation fails
        return { notesText, pdfUrl: null };
      }
    } catch (err: any) {
      console.error('Video processing error:', err);
      setError(err && err.message ? err.message : String(err));
      setStatus(null);
      throw err;
    } finally {
      // Cleanup
      try {
        const ffmpeg = getFFmpeg();
        await ffmpeg.deleteFile('input.mp4');
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
  };

  return { generateNotes, progress, status, error };
} 
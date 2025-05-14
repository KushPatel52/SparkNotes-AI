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
// Add this at the top of your project (e.g., in a global.d.ts file or at the top of this file)
// declare module 'file-saver';

import { useState, useRef, useEffect } from "react";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import JSZip from "jszip";
import { saveAs } from "file-saver";

// If you get a type error for 'file-saver', add a file src/global.d.ts with:
// declare module 'file-saver';

export default function FrameExtractor() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ffmpeg] = useState(() => new FFmpeg());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Load FFmpeg core
        await ffmpeg.load();
        console.log('FFmpeg loaded successfully');
      } catch (error) {
        console.error('Error loading FFmpeg:', error);
        setError('Failed to load video processor. Please refresh the page and try again.');
      }
    };
    load();
  }, [ffmpeg]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      if (!ffmpeg.loaded) {
        throw new Error('FFmpeg not loaded yet');
      }

      // Write the file to FFmpeg's virtual filesystem
      await ffmpeg.writeFile('input.mp4', await fetchFile(file));
      console.log('File written to FFmpeg');

      // Run FFmpeg command
      ffmpeg.on('progress', ({ progress }) => {
        setProgress(progress);
        console.log('Progress:', progress);
      });

      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-q:v', '2',
        '-vf', 'fps=1/2',
        'frame_%04d.jpg'
      ]);
      console.log('FFmpeg processing complete');

      // Read the output files
      const files = await ffmpeg.listDir('.');
      const jpegFiles = files.filter(f => f.name.startsWith('frame_') && f.name.endsWith('.jpg'));
      console.log('Found JPEG files:', jpegFiles.length);

      // Create ZIP file
      const zip = new JSZip();
      for (const file of jpegFiles) {
        const data = await ffmpeg.readFile(file.name);
        zip.file(file.name, data);
      }

      // Generate and download ZIP
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, 'snapnotes_frames.zip');

      // Cleanup
      await ffmpeg.deleteFile('input.mp4');
      for (const file of jpegFiles) {
        await ffmpeg.deleteFile(file.name);
      }

    } catch (error) {
      console.error('Error processing video:', error);
      setError(error instanceof Error ? error.message : 'Error processing video. Please try again.');
    } finally {
      setLoading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="flex flex-col items-start gap-6">
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        onChange={handleFile}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-emerald-50 file:text-emerald-700
          hover:file:bg-emerald-100"
      />

      {error && (
        <div className="w-full p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
          <div
            className="bg-emerald-500 h-2 transition-all"
            style={{ width: `${(progress * 100).toFixed(0)}%` }}
          />
        </div>
      )}

      {!loading && !error && progress === 0 && (
        <p className="text-sm text-gray-600">
          Select a video → frames every 2 s will download as a ZIP.
        </p>
      )}
    </div>
  );
} 
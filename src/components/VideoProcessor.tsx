import { useState } from 'react';
import { useLocalNotesGenerator } from '../hooks/useLocalNotesGenerator';
import { useNotes } from '../hooks/useNotes';
import { auth } from '../firebase';

interface VideoProcessorProps {
  onVideoUpload?: (file: File, videoUrl: string) => void;
}

export default function VideoProcessor({ onVideoUpload }: VideoProcessorProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [notesReady, setNotesReady] = useState(false);
  const [notesUrl, setNotesUrl] = useState<string | null>(null);
  const [notesText, setNotesText] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { generateNotes, progress, status, error } = useLocalNotesGenerator();
  const { addNote } = useNotes();
  const [processing, setProcessing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFile(file);
    const tempUrl = URL.createObjectURL(file);
    setVideoUrl(tempUrl);
    setNotesReady(false);
    setNotesUrl(null);
    setNotesText(null);
    setSaveError(null);
    setProcessing(true);
    setLastError(null);
    if (onVideoUpload) {
      onVideoUpload(file, tempUrl);
    }
    try {
      const result = await generateNotes(file);
      setNotesReady(true);
      setNotesUrl(result.pdfUrl);
      setNotesText(result.notesText);
      // Save to Firestore if signed in
      if (auth.currentUser) {
        await addNote(file.name.replace(/\.[^/.]+$/, '') + ' Notes', result.pdfUrl);
        setSaveError(null);
      } else {
        setSaveError('Sign in to save your notes to your account.');
      }
    } catch (err: any) {
      console.error('Processing error:', err);
      setLastError(err.message || 'Failed to process video');
      setSaveError('Failed to process or save notes. Please try again with a smaller video or different format.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    if (file) {
      handleFileUpload({ target: { files: [file] } } as any);
    }
  };

  return (
    <div className="flex flex-col items-start gap-6 w-full">
      <input
        type="file"
        accept="video/*"
        onChange={handleFileUpload}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-emerald-50 file:text-emerald-700
          hover:file:bg-emerald-100"
        disabled={processing}
      />
      {videoUrl && (
        <video src={videoUrl} controls className="w-full rounded-lg shadow-lg" />
      )}
      {status && (
        <div className="w-full">
          <div className="mb-2 text-sm text-gray-700">
            {status}
            {progress > 0 && (
              <span className="ml-2">
                ({Math.round(progress * 100)}%)
              </span>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 transition-all"
              style={{ width: `${(progress * 100).toFixed(0)}%` }}
            />
          </div>
          {file && (
            <div className="mt-2 text-xs text-gray-500">
              File size: {(file.size / (1024 * 1024)).toFixed(1)}MB
              {navigator.deviceMemory && (
                <span className="ml-2">
                  • Available memory: {(navigator as any).deviceMemory}GB
                </span>
              )}
            </div>
          )}
        </div>
      )}
      {error && (
        <div className="w-full p-4 bg-red-50 text-red-700 rounded-lg">
          <div className="font-semibold">Error: {error}</div>
          {lastError && <div className="text-sm mt-1">{lastError}</div>}
          <button
            onClick={handleRetry}
            className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
          >
            Try Again
          </button>
        </div>
      )}
      {saveError && <div className="w-full p-4 bg-red-50 text-red-700 rounded-lg">{saveError}</div>}
      {notesReady && (
        <div className="w-full mt-4">
          {notesUrl ? (
            <a
              href={notesUrl}
              download={file ? file.name.replace(/\.[^/.]+$/, '') + '-notes.pdf' : 'notes.pdf'}
              className="inline-block px-4 py-2 bg-emerald-600 text-white rounded font-semibold shadow hover:bg-emerald-700 transition"
            >
              Download Notes (PDF)
            </a>
          ) : (
            <div className="text-amber-600 mb-2">
              PDF generation failed, but you can still view the extracted text below.
            </div>
          )}
          <details className="mt-2" open={!notesUrl}>
            <summary className="cursor-pointer text-emerald-700">
              {notesUrl ? 'Preview Extracted Text' : 'View Extracted Text'}
            </summary>
            <pre className="bg-gray-100 p-2 rounded text-xs mt-2 max-h-48 overflow-auto">{notesText}</pre>
          </details>
        </div>
      )}
    </div>
  );
} 
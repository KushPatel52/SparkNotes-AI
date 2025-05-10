// This file is deprecated. All uploads now use Firebase Storage. See useFirebaseUpload.ts.

import { useState } from 'react';

// Use the correct region endpoint and password from your dashboard
const BUNNY_STORAGE_URL = 'https://ny.storage.bunnycdn.com';
const BUNNY_API_KEY = '1731ac1e-d647-4dcc-bab85414b742-1076-481d';
const BUNNY_STORAGE_ZONE = 'ai-notes';

export function useBunnyUpload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const uploadFile = async (file: File): Promise<string> => {
    console.log('Starting upload for file:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    setUploadSpeed(0);
    setTimeRemaining(0);

    const startTime = Date.now();
    let lastLoaded = 0;
    let lastTime = startTime;

    try {
      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const url = `${BUNNY_STORAGE_URL}/${BUNNY_STORAGE_ZONE}/${fileName}`;
      
      console.log('Upload URL:', url);

      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            setUploadProgress(progress);

            // Calculate upload speed
            const currentTime = Date.now();
            const timeDiff = (currentTime - lastTime) / 1000; // in seconds
            if (timeDiff >= 1) { // Update every second
              const loadedDiff = event.loaded - lastLoaded;
              const speed = loadedDiff / timeDiff; // bytes per second
              setUploadSpeed(speed);

              // Calculate time remaining
              const remainingBytes = event.total - event.loaded;
              const remainingTime = remainingBytes / speed;
              setTimeRemaining(remainingTime);

              lastLoaded = event.loaded;
              lastTime = currentTime;

              console.log('Upload progress:', {
                progress: progress.toFixed(2) + '%',
                speed: (speed / (1024 * 1024)).toFixed(2) + ' MB/s',
                remaining: (remainingTime / 60).toFixed(1) + ' minutes'
              });
            }
          }
        });

        xhr.addEventListener('load', () => {
          console.log('Upload completed with status:', xhr.status);
          if (xhr.status >= 200 && xhr.status < 300) {
            // Return the CDN URL for the uploaded file
            const cdnUrl = `https://${BUNNY_STORAGE_ZONE}.b-cdn.net/${fileName}`;
            console.log('Upload successful, CDN URL:', cdnUrl);
            resolve(cdnUrl);
          } else {
            console.error('Upload failed with status:', xhr.status);
            console.error('Response:', xhr.responseText);
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
          }
        });

        xhr.addEventListener('error', (e) => {
          console.error('Upload error:', e);
          reject(new Error('Upload failed'));
        });

        xhr.open('PUT', url);
        xhr.setRequestHeader('AccessKey', BUNNY_API_KEY);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        console.log('Starting upload with headers:', {
          AccessKey: BUNNY_API_KEY,
          'Content-Type': file.type || 'application/octet-stream'
        });
        xhr.send(file);
      });
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload file');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFile,
    uploadProgress,
    isUploading,
    error,
    uploadSpeed,
    timeRemaining
  };
} 
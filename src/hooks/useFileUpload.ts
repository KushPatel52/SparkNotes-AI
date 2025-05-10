import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../firebase';

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
const SUPPORTED_FORMATS = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/3gpp',
  'video/x-ms-wmv',
  'video/x-flv',
  'video/x-m4v',
  'video/ogg'
];

export function useFileUpload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB`;
    }
    
    // Check if the file is a video by mime type or extension
    const isVideo = SUPPORTED_FORMATS.includes(file.type) || 
                   file.name.match(/\.(mp4|webm|mov|avi|mkv|3gp|wmv|flv|m4v|ogv)$/i);
    
    if (!isVideo) {
      return 'Please upload a video file (MP4, WebM, MOV, AVI, MKV, etc.)';
    }
    
    return null;
  };

  const uploadChunk = async (
    file: File,
    start: number,
    end: number,
    storageRef: any,
    metadata: any
  ): Promise<void> => {
    const chunk = file.slice(start, end);
    const chunkRef = ref(storage, `${storageRef.fullPath}_chunk_${start}`);
    
    try {
      await uploadBytesResumable(chunkRef, chunk, metadata);
    } catch (error) {
      console.error(`Error uploading chunk ${start}-${end}:`, error);
      throw error;
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB`);
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    setUploadSpeed(0);
    setTimeRemaining(0);

    const startTime = Date.now();
    let lastLoaded = 0;
    let lastTime = startTime;

    try {
      console.log('Starting upload for file:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      const timestamp = Date.now();
      const fileName = `${user.uid}/${timestamp}_${file.name}`;
      const storageRef = ref(storage, `lectures/${fileName}`);

      const metadata = {
        contentType: file.type || 'video/mp4',
        customMetadata: {
          uploadedBy: user.uid,
          originalName: file.name,
        },
      };

      return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, file, metadata);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);

            // Calculate upload speed
            const currentTime = Date.now();
            const timeDiff = (currentTime - lastTime) / 1000; // in seconds
            if (timeDiff >= 1) { // Update every second
              const loadedDiff = snapshot.bytesTransferred - lastLoaded;
              const speed = loadedDiff / timeDiff; // bytes per second
              setUploadSpeed(speed);

              // Calculate time remaining
              const remainingBytes = snapshot.totalBytes - snapshot.bytesTransferred;
              const remainingTime = remainingBytes / speed;
              setTimeRemaining(remainingTime);

              lastLoaded = snapshot.bytesTransferred;
              lastTime = currentTime;
            }

            console.log('Upload progress:', {
              progress: progress.toFixed(2) + '%',
              speed: (speed / (1024 * 1024)).toFixed(2) + ' MB/s',
              remaining: (remainingTime / 60).toFixed(1) + ' minutes'
            });
          },
          (error) => {
            console.error('Upload error:', error);
            let errorMessage = 'Failed to upload file';
            
            switch (error.code) {
              case 'storage/unauthorized':
                errorMessage = 'You are not authorized to upload files';
                break;
              case 'storage/canceled':
                errorMessage = 'Upload was canceled';
                break;
              case 'storage/retry-limit-exceeded':
                errorMessage = 'Upload failed after multiple retries';
              case 'storage/invalid-checksum':
                errorMessage = 'File upload failed due to corruption';
                break;
              case 'storage/quota-exceeded':
                errorMessage = 'Storage quota exceeded';
                break;
              case 'storage/invalid-argument':
                errorMessage = 'Invalid file or metadata';
                break;
            }
            
            setError(errorMessage);
            reject(new Error(errorMessage));
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('Upload completed successfully:', downloadURL);
              resolve(downloadURL);
            } catch (error) {
              console.error('Error getting download URL:', error);
              setError('Failed to get download URL');
              reject(error);
            } finally {
              setIsUploading(false);
            }
          }
        );
      });
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload file');
      setIsUploading(false);
      throw error;
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
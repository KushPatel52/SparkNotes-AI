import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../firebase';

export function useFirebaseUpload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    const fileName = `${user.uid}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `lectures/${fileName}`);

    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        },
        (err) => {
          setError(err.message);
          setIsUploading(false);
          reject(err);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setIsUploading(false);
          resolve(url);
        }
      );
    });
  };

  return { uploadFile, uploadProgress, isUploading, error };
} 
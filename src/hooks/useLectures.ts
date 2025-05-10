import { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

interface Lecture {
  id: string;
  title: string;
  videoUrl: string;
  createdAt: Date;
}

export function useLectures() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    console.log('Current Firebase user:', user?.uid);
    
    if (!user) {
      console.log('No user logged in');
      setLoading(false);
      return;
    }

    console.log('Setting up Firestore listener for user:', user.uid);
    const lecturesRef = collection(db, 'users', user.uid, 'lectures');
    const q = query(lecturesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('Received Firestore update:', snapshot.docs.length, 'lectures');
        const lectureData = snapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title,
          videoUrl: doc.data().videoUrl,
          createdAt: (doc.data().createdAt as Timestamp).toDate(),
        }));
        setLectures(lectureData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching lectures:', err);
        setError('Failed to load lectures');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addLecture = async (title: string, videoUrl: string) => {
    const user = auth.currentUser;
    if (!user) {
      console.error('No user logged in when trying to add lecture');
      throw new Error('Not authenticated');
    }

    console.log('Adding new lecture:', { title, videoUrl });
    try {
      await addDoc(collection(db, 'users', user.uid, 'lectures'), {
        title,
        videoUrl,
        createdAt: Timestamp.now(),
      });
      console.log('Lecture added successfully');
    } catch (err) {
      console.error('Error adding lecture:', err);
      throw new Error('Failed to add lecture');
    }
  };

  const deleteLecture = async (lectureId: string) => {
    const user = auth.currentUser;
    if (!user) {
      console.error('No user logged in when trying to delete lecture');
      throw new Error('Not authenticated');
    }

    console.log('Deleting lecture:', lectureId);
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'lectures', lectureId));
      console.log('Lecture deleted successfully');
    } catch (err) {
      console.error('Error deleting lecture:', err);
      throw new Error('Failed to delete lecture');
    }
  };

  return {
    lectures,
    loading,
    error,
    addLecture,
    deleteLecture,
  };
} 
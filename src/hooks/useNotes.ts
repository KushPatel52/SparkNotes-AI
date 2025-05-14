import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface Note {
  id: string;
  title: string;
  url: string;
  createdAt: Date;
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    const notesRef = collection(db, 'users', user.uid, 'notes');
    const q = query(notesRef, orderBy('createdAt', 'desc'));
    getDocs(q)
      .then(snapshot => {
        const notesData = snapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title,
          url: doc.data().url,
          createdAt: (doc.data().createdAt as Timestamp).toDate(),
        }));
        setNotes(notesData);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load notes');
        setLoading(false);
      });
  }, []);

  const addNote = async (title: string, url: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    await addDoc(collection(db, 'users', user.uid, 'notes'), {
      title,
      url,
      createdAt: Timestamp.now(),
    });
  };

  return { notes, loading, error, addNote };
} 
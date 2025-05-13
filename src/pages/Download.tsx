import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { addDoc, collection } from 'firebase/firestore';
import app1 from '../assets/app-1.jpg';
import app2 from '../assets/app-2.jpg';
import app3 from '../assets/app-3.jpg';

export default function Download() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if user has a subscription
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().subscription) {
          setIsAuthenticated(true);
        } else {
          navigate('/pricing');
        }
      } else {
        navigate('/login');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  const handleDownload = async () => {
    try {
      // Get the latest version from Firebase
      const versionDoc = await getDoc(doc(db, 'versions', 'latest'));
      if (!versionDoc.exists()) {
        throw new Error('Version information not found');
      }

      const { version, downloadUrlWin } = versionDoc.data();
      // Only use the Windows download URL
      const link = document.createElement('a');
      link.href = downloadUrlWin;
      link.download = `SnapNotes-${version}-Setup.exe`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Log the download
      if (auth.currentUser) {
        await addDoc(collection(db, 'downloads'), {
          userId: auth.currentUser.uid,
          version,
          timestamp: new Date(),
          platform: 'windows'
        });
      }

      // Show the modal after download is triggered
      setShowModal(true);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again later.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-8 text-center">Download SnapNotes AI</h1>
        <div className="bg-neutral-900 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Windows App</h2>
              <p className="text-neutral-400">Version 1.0.0</p>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-full font-semibold transition-colors"
            >
              Download for Windows
            </button>
          </div>
          <div className="space-y-4 text-neutral-300">
            <h3 className="text-xl font-semibold text-white mb-4">Features</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Process videos locally on your machine
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Sync jobs with your web dashboard
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Automatic updates
              </li>
            </ul>
          </div>
          <div className="mt-8 p-4 bg-yellow-900/60 border-l-4 border-yellow-500 rounded">
            <p className="text-yellow-200 font-semibold">
              Note: SnapNotes AI Desktop is currently only available for Windows. Mac and Linux support coming soon!
            </p>
          </div>
        </div>
      </div>

      {/* Modal Popup after download */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-neutral-900 rounded-2xl shadow-2xl max-w-lg w-full p-8 relative animate-fadein">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white text-2xl font-bold focus:outline-none"
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center text-emerald-400">Thank you for downloading!</h2>
            <p className="text-neutral-200 mb-6 text-center">
              The SnapNotes AI Desktop app is fully built and ready, but future updates and broader distribution are limited by developer program costs required by Apple and Microsoft.<br />
              <span className="text-neutral-400 text-sm">(We hope to make it available for more platforms soon!)</span>
            </p>
            <div className="flex gap-4 justify-center mb-4">
              <img src={app1} alt="App Screenshot 1" className="rounded-lg shadow-lg w-32 h-20 object-cover border-2 border-emerald-600" />
              <img src={app2} alt="App Screenshot 2" className="rounded-lg shadow-lg w-32 h-20 object-cover border-2 border-emerald-600" />
              <img src={app3} alt="App Screenshot 3" className="rounded-lg shadow-lg w-32 h-20 object-cover border-2 border-emerald-600" />
            </div>
            <div className="text-center mt-2">
              <span className="text-neutral-400 text-xs">Want to see more? <a href="/dashboard" className="text-emerald-400 underline">Check out the web dashboard</a>.</span>
            </div>
          </div>
          <style>{`
            @keyframes fadein { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
            .animate-fadein { animation: fadein 0.3s cubic-bezier(.4,2,.6,1) both; }
          `}</style>
        </div>
      )}
    </div>
  );
} 
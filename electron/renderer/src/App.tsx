import React, { useState, useEffect } from "react";
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ipcRenderer } from 'electron';

// Firebase config
const firebaseConfig = {
  // Your Firebase config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

interface Job {
  id: string;
  name: string;
  status: "pending" | "processing" | "done" | "error";
  message?: string;
  notesPath?: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  isNotesExpanded?: boolean;
}

export default function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showNewJob, setShowNewJob] = useState(false);
  const [jobName, setJobName] = useState("");
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Handle authentication
  useEffect(() => {
    // Get auth token from main process
    ipcRenderer.invoke('get-auth-token').then(async (token: string) => {
      if (token) {
        try {
          await signInWithCustomToken(auth, token);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Auth failed:', error);
        }
      }
      setIsLoading(false);
    });

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });

    return () => unsubscribe();
  }, []);

  // Sync jobs with Firebase
  useEffect(() => {
    if (!isAuthenticated) return;

    const q = query(
      collection(db, 'jobs'),
      where('userId', '==', auth.currentUser?.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newJobs: Job[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        newJobs.push({
          id: doc.id,
          name: data.name,
          status: data.status,
          message: data.message,
          notesPath: data.notesPath,
          userId: data.userId,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          notes: data.notes,
          isNotesExpanded: data.isNotesExpanded,
        });
      });
      setJobs(newJobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  // Select video using Electron API
  const handleSelectVideo = async () => {
    const filePath = await window.electronAPI.selectVideo();
    if (filePath) setVideoPath(filePath);
  };

  // Submit job
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobName || !videoPath || !isAuthenticated) return;
    
    setSubmitting(true);
    try {
      // Create job in Firebase
      const jobRef = await addDoc(collection(db, 'jobs'), {
        name: jobName,
        status: 'pending',
        userId: auth.currentUser?.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Start processing
      window.electronAPI.processVideo({
        jobId: jobRef.id,
        jobName,
        filePath: videoPath,
      });

      setJobName("");
      setVideoPath(null);
      setShowNewJob(false);
    } catch (error) {
      console.error('Failed to create job:', error);
      alert('Failed to create job. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Listen for job status updates
  useEffect(() => {
    window.electronAPI.onJobStatus(async (_: any, { jobId, status, message, notesPath }: any) => {
      try {
        await updateDoc(doc(db, 'jobs', jobId), {
          status,
          message,
          notesPath,
          updatedAt: new Date(),
        });
      } catch (error) {
        console.error('Failed to update job:', error);
      }
    });
  }, []);

  // Toggle notes expansion
  const toggleNotes = (jobId: string) => {
    setJobs(jobs.map(job => 
      job.id === jobId 
        ? { ...job, isNotesExpanded: !job.isNotesExpanded }
        : job
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-neutral-400">You need to sign in to use the desktop app.</p>
          <button
            onClick={() => window.open('https://snapnotes.ai/login', '_blank')}
            className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-full font-semibold transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-black text-white">
      {/* Dummy element to force Tailwind to process classes */}
      <div className="hidden bg-black text-white p-10">TAILWIND TEST</div>

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 bg-black/90 shadow-lg sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {/* Logo (placeholder) */}
          <div className="w-8 h-8 bg-emerald-500 rounded-full shadow-lg flex items-center justify-center font-extrabold text-xl">S</div>
          <span className="text-2xl font-extrabold tracking-tight select-none">SnapNotes AI</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.open('https://snapnotes.ai/dashboard', '_blank')}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            Open Web Dashboard
          </button>
          <button
            onClick={() => setShowNewJob(true)}
            className="rounded-full bg-emerald-600 px-6 py-2 text-lg font-semibold text-white hover:bg-emerald-400 transition shadow-md"
          >
            + New Job
          </button>
        </div>
      </nav>

      {/* New Job Modal */}
      {showNewJob && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-30 animate-fadein">
          <form
            onSubmit={handleSubmit}
            className="bg-neutral-900 rounded-2xl p-8 shadow-2xl flex flex-col gap-6 min-w-[350px] max-w-[90vw]"
            style={{ boxShadow: "0 0 40px 10px #10b98155" }}
          >
            <h2 className="text-xl font-bold mb-2">Start a New Job</h2>
            <input
              type="text"
              placeholder="Job name"
              value={jobName}
              onChange={e => setJobName(e.target.value)}
              className="px-4 py-2 rounded bg-white/80 text-black font-semibold"
              required
            />
            <button
              type="button"
              onClick={handleSelectVideo}
              className={`px-4 py-2 rounded bg-indigo-700 text-white font-bold ${videoPath ? "bg-emerald-600" : ""}`}
            >
              {videoPath ? "Video Selected" : "Select Video"}
            </button>
            <div className="flex gap-4 mt-2">
              <button
                type="submit"
                className="px-6 py-2 rounded bg-emerald-600 text-white font-bold hover:bg-emerald-400 transition flex-1"
                disabled={!jobName || !videoPath || submitting}
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
              <button
                type="button"
                onClick={() => setShowNewJob(false)}
                className="px-6 py-2 rounded bg-neutral-700 text-white font-bold hover:bg-neutral-600 transition flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dashboard */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Your Jobs</h1>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map(job => (
            <div
              key={job.id}
              className={`rounded-2xl p-6 shadow-xl flex flex-col bg-emerald-900/80 border-2 border-emerald-500 relative animate-fadein ${job.status === "done" ? "glow-green" : ""}`}
              style={{ boxShadow: job.status === "done" ? "0 0 32px 8px #10b98188" : undefined }}
            >
              <div className="flex flex-col h-full">
                <h3 className="text-lg font-semibold mb-2 text-white">{job.name}</h3>
                <p className="text-neutral-300 text-xs mb-2">
                  Status: <span className="font-bold capitalize">{job.status}</span>
                </p>
                {job.message && <p className="text-xs text-emerald-300 mb-2">{job.message}</p>}
                
                {/* Notes Section */}
                {job.status === "done" && (
                  <div className="mt-2 flex-1">
                    <button
                      onClick={() => toggleNotes(job.id)}
                      className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-1"
                    >
                      {job.isNotesExpanded ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                          </svg>
                          Hide Notes
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                          Show Notes
                        </>
                      )}
                    </button>
                    
                    {job.isNotesExpanded && (
                      <div className="mt-2 bg-black/30 rounded-lg p-3 text-sm text-neutral-300 max-h-48 overflow-y-auto">
                        {job.notes ? (
                          <pre className="whitespace-pre-wrap font-mono">{job.notes}</pre>
                        ) : (
                          <p className="text-neutral-500 italic">No notes available</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  {job.status === "done" && job.notesPath && (
                    <a
                      href={`file://${job.notesPath}`}
                      className="flex-1 rounded bg-emerald-500 px-4 py-2 text-white font-bold hover:bg-emerald-400 transition shadow-lg text-center"
                      download
                    >
                      Download Notes
                    </a>
                  )}
                  {job.status === "error" && (
                    <p className="text-red-500 mt-2">Error processing job.</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Animations and Glow Effect */}
      <style>{`
        @keyframes fadein { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } }
        .animate-fadein { animation: fadein 0.8s cubic-bezier(.4,2,.6,1) both; }
        .glow-green { box-shadow: 0 0 32px 8px #10b98188 !important; border-color: #10b981 !important; }
      `}</style>
    </div>
  );
} 
import { Plus, Film, Trash2, Loader2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useState, useEffect } from "react";
import { useLectures } from "../hooks/useLectures";
import { useNotes } from "../hooks/useNotes";

interface Job {
  jobId: string;
  jobName: string;
  status: string;
  notesPath?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { lectures, loading, error, deleteLecture } = useLectures();
  const { notes, loading: notesLoading, error: notesError } = useNotes();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    console.log('Dashboard component mounted');
    console.log('Current user:', auth.currentUser?.uid);
  }, []);

  useEffect(() => {
    console.log('Upload modal state changed:', isUploadModalOpen);
  }, [isUploadModalOpen]);

  useEffect(() => {
    async function fetchJobs() {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      setJobs(data.jobs || []);
    }
    fetchJobs();
  }, []);

  async function handleSignOut() {
    console.log('Sign out clicked');
    await signOut(auth);
    navigate("/");
  }

  async function handleDeleteLecture(lectureId: string) {
    if (!confirm("Are you sure you want to delete this lecture?")) return;
    try {
      await deleteLecture(lectureId);
    } catch (err) {
      console.error("Failed to delete lecture:", err);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0f2027] via-[#232526] to-[#414345] relative overflow-hidden">
      <div className="p-4 bg-yellow-900/80 border-l-4 border-yellow-500 rounded mb-6 text-yellow-200 font-semibold text-center">
        Note: The SnapNotes AI Desktop app is built, but cannot be distributed due to developer program costs required by Apple and Microsoft. We hope to make it available soon!
      </div>
      {/* Animated background shapes */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-teal-500 opacity-20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500 opacity-10 rounded-full blur-3xl animate-pulse" />
        {/* Floating squares */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={`absolute bg-white/10 rounded-lg shadow-lg animate-float${i % 4 + 1}`}
            style={{
              width: `${60 + (i % 3) * 20}px`,
              height: `${60 + (i % 2) * 30}px`,
              top: `${10 + i * 8}%`,
              left: `${5 + (i * 12) % 80}%`,
              animationDelay: `${i * 0.7}s`,
            }}
          />
        ))}
      </div>

      {/* Navbar */}
      <nav className="w-full flex items-center justify-between px-10 py-6 bg-black/80 shadow-lg sticky top-0 z-20">
        <h1 className="text-3xl font-extrabold tracking-tight text-white select-none" style={{ fontFamily: 'cursive' }}>
          Your <span className="text-emerald-400">Lectures</span>
        </h1>
        <div className="flex gap-6 items-center">
          <a
            href="/downloads/SnapNotesAI-Desktop-mac-arm64.dmg"
            className="flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2 text-lg font-semibold text-white hover:bg-emerald-400 transition shadow-md"
            download
          >
            Download for Mac
          </a>
          <a
            href="/downloads/SnapNotesAI-Desktop-win.exe"
            className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2 text-lg font-semibold text-white hover:bg-indigo-400 transition shadow-md"
            download
          >
            Download for Windows
          </a>
          <button
            onClick={handleSignOut}
            className="rounded-full border-2 border-white px-6 py-2 text-lg font-bold text-white hover:bg-white hover:text-black transition shadow-md"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Notes Section */}
      <main className="max-w-6xl mx-auto px-6 py-16 relative z-10">
        <h2 className="text-2xl font-bold text-white mb-6">Your Notes</h2>
        {notesLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : notesError ? (
          <div className="text-red-500 text-center mb-8">{notesError}</div>
        ) : notes.length === 0 ? (
          <div className="text-center text-white/60 text-xl">
            No notes yet. Use Local Video Notes to generate and save notes!
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <article
                key={note.id}
                className="rounded-2xl bg-neutral-900/80 p-6 shadow-xl shadow-black/30 flex flex-col items-center animate-fadein"
              >
                <h3 className="text-lg font-semibold mb-2 text-white">{note.title}</h3>
                <p className="text-neutral-400 text-xs mb-4">
                  {note.createdAt.toLocaleDateString()} {note.createdAt.toLocaleTimeString()}
                </p>
                <a
                  href={note.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded bg-emerald-500 px-4 py-2 text-white font-bold hover:bg-emerald-400 transition"
                >
                  Download
                </a>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Processed Jobs Section */}
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Your Processed Jobs</h1>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map(job => (
            <div key={job.jobId} className="rounded-2xl bg-neutral-900/80 p-6 shadow-xl flex flex-col items-center">
              <h3 className="text-lg font-semibold mb-2 text-white">{job.jobName}</h3>
              <p className="text-neutral-400 text-xs mb-2">
                Status: <span className="font-bold">{job.status}</span>
              </p>
              {job.notesPath && (
                <a
                  href={job.notesPath}
                  className="mt-2 rounded bg-emerald-500 px-4 py-2 text-white font-bold hover:bg-emerald-400 transition"
                  download
                >
                  Download Notes
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes float1 { 0% { transform: translateY(0); } 50% { transform: translateY(-30px); } 100% { transform: translateY(0); } }
        @keyframes float2 { 0% { transform: translateY(0); } 50% { transform: translateY(20px); } 100% { transform: translateY(0); } }
        @keyframes float3 { 0% { transform: translateY(0); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0); } }
        @keyframes float4 { 0% { transform: translateY(0); } 50% { transform: translateY(25px); } 100% { transform: translateY(0); } }
        .animate-float1 { animation: float1 7s ease-in-out infinite; }
        .animate-float2 { animation: float2 9s ease-in-out infinite; }
        .animate-float3 { animation: float3 6s ease-in-out infinite; }
        .animate-float4 { animation: float4 8s ease-in-out infinite; }
        @keyframes fadein { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } }
        .animate-fadein { animation: fadein 0.8s cubic-bezier(.4,2,.6,1) both; }
      `}</style>
    </div>
  );
}
import NavBar from "../components/NavBar";
import VideoProcessor from "../components/VideoProcessor";
import VideoCard from "../components/VideoCard";
import { useState } from "react";

interface UploadedVideo {
  filename: string;
  status: 'pending' | 'ready';
  videoUrl: string;
}

export default function LocalVideoProcessor({ onAuthClick }: { onAuthClick: () => void }) {
  const [uploadedVideos, setUploadedVideos] = useState<UploadedVideo[]>([]);

  // Callback to add a new video card
  const handleVideoUpload = (file: File, videoUrl: string) => {
    setUploadedVideos((prev) => [
      { filename: file.name, status: 'pending', videoUrl },
      ...prev,
    ]);
  };

  return (
    <>
      <NavBar onAuthClick={onAuthClick} />
      <section className="min-h-screen bg-hero flex items-center justify-center p-10">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-10 max-w-xl w-full">
          <h1 className="text-3xl font-extrabold mb-6">Process Your Video</h1>
          <p className="text-gray-600 mb-8">
            Upload your lecture video and we'll process it locally. 
            The video will be played directly in your browser.
          </p>
          <VideoProcessor onVideoUpload={handleVideoUpload} />
        </div>
      </section>
    </>
  );
} 
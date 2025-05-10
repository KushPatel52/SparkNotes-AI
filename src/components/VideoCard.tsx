import React from 'react';

interface VideoCardProps {
  filename: string;
  status: 'pending' | 'ready';
  videoUrl?: string;
}

export default function VideoCard({ filename, status, videoUrl }: VideoCardProps) {
  return (
    <div className="w-full bg-white rounded-xl shadow p-4 flex items-center gap-4 mb-4">
      {videoUrl && (
        <video src={videoUrl} className="w-24 h-16 object-cover rounded" muted />
      )}
      <div className="flex-1">
        <div className="font-semibold text-gray-800">{filename}</div>
        <div className="text-xs text-gray-500 mt-1">
          {status === 'pending' && (
            <span className="text-yellow-600 font-medium">Pending: Preparing notes...</span>
          )}
          {status === 'ready' && (
            <span className="text-green-600 font-medium">Notes Ready!</span>
          )}
        </div>
      </div>
    </div>
  );
} 
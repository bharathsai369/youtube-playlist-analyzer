'use client';

import { useState, FormEvent, FC } from 'react';

// --- Type Definition ---
interface PlaylistData {
  playlistTitle: string;
  channelTitle: string;
  totalVideos: number;
  totalDurationSeconds: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
}

// --- Helper Functions ---
const formatDuration = (totalSeconds: number): string => {
  if (totalSeconds < 0) return "00:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [
    hours > 0 ? hours.toString().padStart(2, '0') : null,
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
  ].filter(Boolean).join(':');
};

const getPlaylistId = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    const listParam = params.get('list');
    
    // Check if it's a valid playlist ID format
    if (listParam && /^[A-Za-z0-9_-]+$/.test(listParam)) {
      return listParam;
    }
    
    return null;
  } catch {
    return null;
  }
};

// --- Child Components ---
const StatCard: FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="p-4 bg-gray-700/50 rounded-md shadow-md">
    <p className="text-sm text-gray-400">{label}</p>
    <p className="text-2xl font-bold tracking-tight">{value}</p>
  </div>
);

const PlaylistPreview: FC<{ playlistId: string }> = ({ playlistId }) => (
  <div className="w-full max-w-2xl mt-8 animate-fade-in">
     <div className="relative" style={{ paddingTop: '56.25%' /* 16:9 Aspect Ratio */ }}>
        <iframe
            className="absolute top-0 left-0 w-full h-full rounded-lg shadow-xl"
            src={`https://www.youtube.com/embed/videoseries?list=${playlistId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
        ></iframe>
    </div>
  </div>
);

const StatsDisplay: FC<{ data: PlaylistData }> = ({ data }) => (
  <div className="mt-8 w-full p-6 bg-gray-800 border border-gray-700 rounded-lg text-left animate-fade-in">
    <div className="mb-6">
        <p className="text-gray-400">Playlist</p>
        <h2 className="text-3xl font-bold text-white">{data.playlistTitle}</h2>
        <p className="text-lg text-gray-300">by {data.channelTitle}</p>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      <StatCard label="Total Videos" value={data.totalVideos.toLocaleString()} />
      <StatCard label="Total Duration" value={formatDuration(data.totalDurationSeconds)} />
      <StatCard label="Total Views" value={data.totalViews.toLocaleString()} />
      <StatCard label="Total Likes" value={data.totalLikes.toLocaleString()} />
      <StatCard label="Total Comments" value={data.totalComments.toLocaleString()} />
      {data.totalVideos > 0 && (
          <StatCard 
            label="Avg. Duration" 
            value={`${formatDuration(Math.round(data.totalDurationSeconds / data.totalVideos))}/video`} 
          />
      )}
    </div>
  </div>
);

// Add this component
const LoadingSpinner: FC = () => (
  <div className="w-full flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// --- Main Page Component ---
export default function HomePage() {
  const [url, setUrl] = useState('');
  const [data, setData] = useState<PlaylistData | null>(null);
  const [embedId, setEmbedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);
    setEmbedId(null);

    const currentPlaylistId = getPlaylistId(url);
    if (!currentPlaylistId) {
        setError("Invalid YouTube Playlist URL. Make sure it contains 'list='.");
        setLoading(false);
        return;
    }

    try {
      const response = await fetch('/api/playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistUrl: url }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'An unknown error occurred');
      
      setData(result);
      setEmbedId(currentPlaylistId); // Show preview on success

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-12 md:p-24 bg-gray-900 text-white">
      <div className="z-10 w-full max-w-2xl items-center justify-center font-mono text-center flex flex-col gap-6">
        <h1 className="text-4xl sm:text-5xl font-bold">YouTube Playlist Analyzer 📊</h1>
        <p className="text-gray-400">
          Paste a public YouTube playlist URL to instantly get its combined stats.
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/playlist?list=..."
            required
            className="flex-grow p-3 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>

        {error && <p className="mt-4 text-red-400 bg-red-900/50 p-3 rounded-md w-full">{error}</p>}
        
        {/* The order is important: show preview first, then stats */}
        {embedId && <PlaylistPreview playlistId={embedId} />}
        {data && <StatsDisplay data={data} />}
        {loading && <LoadingSpinner />}
      </div>
    </main>
  );
}
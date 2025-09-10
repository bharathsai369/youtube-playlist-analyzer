import { NextResponse } from "next/server";
import { google, youtube_v3 } from "googleapis";
import { headers } from "next/headers";

// Validate environment variables at startup
if (!process.env.YOUTUBE_API_KEY) {
  throw new Error("YOUTUBE_API_KEY is required in environment variables");
}

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

// Helper to parse ISO 8601 duration (e.g., PT1M30S) into seconds
const parseDuration = (duration: string): number => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0") || 0;
  const minutes = parseInt(match[2] || "0") || 0;
  const seconds = parseInt(match[3] || "0") || 0;
  return hours * 3600 + minutes * 60 + seconds;
};

// Helper to extract playlist ID from various URL formats
const getPlaylistId = (url: string): string | null => {
  const patterns = [
    /[&?]list=([^&]+)/, // Standard URL
    /playlist\?list=([^&]+)/, // Playlist page URL
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

// Add rate limiting map
const rateLimit = new Map();
const MAX_VIDEOS = 5000; // Reasonable limit for playlist size

export async function POST(request: Request) {
  // Add rate limiting
  const ip = headers().get("x-forwarded-for") || "unknown";
  const now = Date.now();
  const lastRequest = rateLimit.get(ip) || 0;

  if (now - lastRequest < 1000) {
    // 1 second cooldown
    return NextResponse.json(
      { error: "Please wait before making another request" },
      { status: 429 }
    );
  }

  rateLimit.set(ip, now);

  try {
    const { playlistUrl } = await request.json();
    if (!playlistUrl) {
      return NextResponse.json(
        { error: "Playlist URL is required" },
        { status: 400 }
      );
    }

    const playlistId = getPlaylistId(playlistUrl);
    if (!playlistId) {
      return NextResponse.json(
        { error: "Invalid or unsupported YouTube Playlist URL" },
        { status: 400 }
      );
    }

    // --- Step 1: Get Playlist Metadata (Title, Channel) ---
    const { data: playlistMeta }: { data: youtube_v3.Schema$PlaylistListResponse } = await youtube.playlists.list({
      part: ["snippet"],
      id: [playlistId],
    });

    if (
      !playlistMeta.items ||
      playlistMeta.items.length === 0
    ) {
      return NextResponse.json(
        { error: "Playlist not found." },
        { status: 404 }
      );
    }

    const playlistTitle =
      playlistMeta.items[0].snippet?.title || "Untitled Playlist";
    const channelTitle =
      playlistMeta.items[0].snippet?.channelTitle ||
      "Unknown Channel";

    // --- Step 2: Fetch all video IDs from the playlist (handling pagination) ---
    let videoIds: string[] = [];
    let nextPageToken: string | undefined | null = null;

    do {
      const { data }: { data: youtube_v3.Schema$PlaylistItemListResponse } = await youtube.playlistItems.list({
        part: ["contentDetails"],
        playlistId: playlistId,
        maxResults: 50,
        pageToken: nextPageToken || undefined,
      });

      const ids = data.items
        ?.map((item) => item.contentDetails?.videoId)
        .filter((id): id is string => !!id);

      if (ids) videoIds.push(...ids);

      nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    if (videoIds.length === 0) {
      return NextResponse.json(
        {
          playlistTitle,
          channelTitle,
          totalVideos: 0,
        },
        { status: 200 }
      ); // It's not an error if a playlist is just empty
    }

    if (videoIds.length > MAX_VIDEOS) {
      return NextResponse.json(
        { error: "Playlist is too large to process" },
        { status: 400 }
      );
    }

    // --- Step 3: Fetch video details in batches of 50 (CRITICAL FIX) ---
    let totalDurationSeconds = 0;
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;

    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = videoIds.slice(i, i + 50);
      const { data: videoDetails }: { data: youtube_v3.Schema$VideoListResponse } = await youtube.videos.list({
        part: ["contentDetails", "statistics"],
        id: batch,
      });

      const videos = videoDetails.items || [];
      videos.forEach((video) => {
        totalDurationSeconds += parseDuration(
          video.contentDetails?.duration || "PT0S"
        );
        totalViews += parseInt(video.statistics?.viewCount || "0");
        totalLikes += parseInt(video.statistics?.likeCount || "0");
        totalComments += parseInt(video.statistics?.commentCount || "0");
      });
    }

    return NextResponse.json({
      playlistTitle,
      channelTitle,
      totalVideos: videoIds.length,
      totalDurationSeconds,
      totalViews,
      totalLikes,
      totalComments,
    });
  } catch (error: any) {
    console.error("API Error:", error.message);
    // Provide a more user-friendly error from the API if available
    const errorMessage =
      error.response?.data?.error?.message || "Failed to fetch playlist data.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

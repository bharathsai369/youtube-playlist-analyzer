# YouTube Playlist Stats Analyzer 📊

A Next.js web application that analyzes YouTube playlist statistics including total duration, views, likes, and comments.

## Features

- 🎯 Analyze any public YouTube playlist
- 📊 Get comprehensive statistics (videos, duration, views, likes, comments)
- 🎨 Beautiful, responsive UI with dark theme
- 🔒 Secure API key handling
- ⚡ Fast data fetching with pagination support

## Prerequisites

- Node.js 18+ installed
- YouTube Data API v3 key

## Getting Started

### 1. Get YouTube API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Create credentials (API Key)
5. Copy your API key

### 2. Setup Project

1. Extract the zip file and navigate to the project directory:
```bash
cd youtube-playlist-stats
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.local.example .env.local
```

4. Add your YouTube API key to `.env.local`:
```
YOUTUBE_API_KEY="YOUR_ACTUAL_API_KEY_HERE"
```

### 3. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Copy a public YouTube playlist URL (e.g., `https://www.youtube.com/playlist?list=PLxxxxxx`)
2. Paste it into the input field
3. Click "Analyze" to get comprehensive statistics

## Project Structure

```
youtube-playlist-stats/
├── app/
│   ├── api/
│   │   └── playlist/
│   │       └── route.ts          # API endpoint for playlist analysis
│   ├── globals.css               # Global styles with Tailwind
│   ├── layout.tsx                # Root layout component
│   └── page.tsx                  # Main page component
├── .env.local.example            # Environment variables template
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **YouTube Data API v3** - Fetching playlist data
- **Google APIs Node.js Client** - API integration

## Build for Production

```bash
npm run build
npm run start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `YOUTUBE_API_KEY` | Your YouTube Data API v3 key | Yes |

## API Usage Limits

The YouTube Data API has quota limits. Each request consumes quota units:
- Playlist items list: 1 unit per request
- Videos list: 1 unit per request

For large playlists, the app handles pagination automatically.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

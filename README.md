# 🎵 Apple Music MCP Server

A Model Context Protocol (MCP) server for Apple Music. Search the entire Apple Music catalog, explore charts, get personalized recommendations, create playlists, and manage your library — all from Claude on iPhone, desktop, or Claude Code.

**Live at:** `https://music.broberg.dk`

## Features

### Catalog Tools (no auth required)

| Tool | Description |
|------|-------------|
| `search_catalog` | Search songs, artists, albums in Apple Music catalog |
| `get_artist_songs` | Get all songs by an artist (full discography) |
| `get_artist_albums` | Get all albums by an artist |
| `get_charts` | Top songs/albums/playlists, optionally by genre |
| `get_genres` | List all available genres (for chart filtering) |
| `get_catalog_playlist` | Get a curated/editorial playlist with tracks |

### Library &amp; Personal Tools (auth required)

| Tool | Description |
|------|-------------|
| `create_playlist` | Create a playlist with tracks in your library |
| `add_tracks_to_playlist` | Add tracks to an existing playlist |
| `list_playlists` | List your Apple Music playlists |
| `recently_played` | Your recent listening history |
| `recommendations` | Personalized music recommendations |
| `heavy_rotation` | Your most frequently played content |
| `search_library` | Search your personal music library |
| `auth_status` | Check if user authorization is active |

## Quick Start

### 1. Apple Developer Setup

You need an [Apple Developer account](https://developer.apple.com/account) ($99/year).

1. Go to **Certificates, Identifiers &amp; Profiles**
2. Under **Identifiers**, click **+** → choose **Media IDs**
3. Register a new Media ID (e.g., `media.music.dk.broberg`)
4. Enable **MusicKit**, **ShazamKit**, and **Apple Music Feed**
5. Under **Keys**, click **+** → create a new key
6. Enable **MusicKit** and select your Media ID
7. Download the `.p8` private key file
8. Note your **Key ID** and **Team ID**

### 2. Local Development

```bash
git clone https://github.com/cbroberg/apple-music-mcp.git
cd apple-music-mcp
npm install
cp env.example .env
```

Edit `.env` with your credentials. For the private key, convert the `.p8` file to a single line:

```bash
# Convert .p8 to single-line format for .env
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' AuthKey_XXXXXX.p8
```

Build and run:

```bash
npm run build
npm start
```

Visit `http://localhost:3000/auth` to authorize your Apple Music account.

### 3. Deploy to Fly.io

```bash
fly launch --no-deploy --name apple-music-mcp --region arn
fly certs add music.broberg.dk

# Set secrets
fly secrets set APPLE_TEAM_ID=xxx
fly secrets set APPLE_KEY_ID=xxx
fly secrets set APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIGT...\n-----END PRIVATE KEY-----"

fly deploy
```

Add DNS CNAME: `music.broberg.dk → apple-music-mcp.fly.dev`

### 4. Register on claude.ai

1. Go to **Settings** → **Integrations** → **Add MCP Server**
2. URL: `https://music.broberg.dk/sse`
3. The server will now be available in all Claude conversations, including iPhone

### 5. Authorize Apple Music

Visit `https://music.broberg.dk/auth` and sign in with your Apple Music account. This grants the server permission to create playlists and access personalized features.

> **Note:** The Music User Token is stored in memory and will be lost on server restart. Re-visit `/auth` after deploys.

## Usage Examples

From Claude (iPhone or desktop):

> "Search Apple Music for The Police"

> "Get all songs by The Police and create a playlist called 'Every Breath – Complete Police'"

> "What are the top 10 songs in Denmark right now?"

> "Show me my recently played music"

> "What does Apple Music recommend for me?"

> "Find all albums by Depeche Mode"

> "Create a playlist with the top 20 David Bowie songs"

## Architecture

```
┌─────────────┐     SSE/HTTP      ┌──────────────────┐
│  Claude.ai   │ ◄──────────────► │  MCP Server       │
│  (iPhone/    │                   │  (Fly.io)         │
│   Desktop)   │                   │                   │
└─────────────┘                   │  ┌──────────────┐ │
                                   │  │ Apple Music  │ │
                                   │  │ API (REST)   │ │
                                   │  └──────────────┘ │
                                   └──────────────────┘
                                          │
                                   ┌──────┴──────┐
                                   │ MusicKit JS  │
                                   │ (Auth page)  │
                                   └─────────────┘
```

## License

MIT — Christian Broberg / WebHouse ApS

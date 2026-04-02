# F20: Global Search (Cmd+K)

**Status:** Planned
**Priority:** High
**Blocks:** Proper playlist curation, music browsing

## Summary

Cmd+K command palette for searching artists, albums, and songs. Results navigate to dedicated pages. Replaces inline playlist search with a proper browsing experience.

## Why

Current inline search in playlists is fragile, limited, and collapses the playlist. Users need a proper music browsing experience — search for an artist, see their albums, browse tracks, play/favorite/add to playlist from anywhere.

## Cmd+K Palette

- **Trigger:** Cmd+K (Mac) / Ctrl+K (other) — or click search icon in header
- **Design:** Centered modal overlay (like reference: WebHouse CMS command palette)
- **Sections:** Artists, Albums, Songs — with type labels
- **Keyboard nav:** Arrow keys to navigate, Enter to select, ESC to close
- **Autocomplete:** Results update as you type (300ms debounce)

## Pages

### Artist Page (`#artist/{id}`)
- Hero: artist artwork + name + genres
- **Top Songs** — list with play, favorite, add-to-playlist buttons
- **Albums** — grid of album covers, click to expand
- All in-page (hash routing, no navigation, music keeps playing)

### Album Page (`#album/{id}`)
- Hero: album artwork + title + artist + year + track count
- **Track list** — numbered, with play, favorite, add-to-playlist
- "Play All" + "Add All to Playlist" buttons
- Click artist name → Artist Page

### Song Detail (optional, maybe just inline)
- Play, favorite, add to playlist
- Show album, artist links

## Integration

- **Add to Playlist:** Dropdown to pick which playlist (or create new)
- **Favorites:** Heart button on every track everywhere
- **Play:** Single click plays via Player (respects provider toggle)
- **Mini Player:** Always visible, shows current track

## Routing

Hash-based routing within Admin page (no page navigation):
```
#recent          → Recently Played tab
#playlists       → Playlists tab
#favorites       → Favorites tab
#quiz            → Quiz tab
#artist/12345    → Artist page
#album/67890     → Album page
```

## API

Existing endpoints sufficient:
- `GET /quiz/api/builder/search?q=...` → artists, albums, songs
- `GET /quiz/api/builder/album/:id/tracks` → album tracks
- New: `GET /quiz/api/artist/:id` → artist top songs + albums

## Remove

- Inline playlist search (replaced by Cmd+K → Add to Playlist)
- Quiz Builder standalone page (fully replaced by Playlists + Cmd+K)

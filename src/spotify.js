/**
 * spotify.js — frontend Spotify helpers
 *
 * Token exchange now goes through your Firebase Cloud Function (/spotifyToken)
 * so the Client Secret never ships to the browser.
 *
 * Set VITE_FUNCTIONS_BASE_URL in your .env:
 *   VITE_FUNCTIONS_BASE_URL=https://<region>-<project>.cloudfunctions.net
 *
 * During local dev with the Functions emulator:
 *   VITE_FUNCTIONS_BASE_URL=http://127.0.0.1:5001/<project-id>/<region>
 */

const FUNCTIONS_BASE = import.meta.env.VITE_FUNCTIONS_BASE_URL;

// ── Token (fetched from Cloud Function, cached for 55 min) ───────────────────
let cachedToken   = null;
let tokenExpiry   = 0;

export async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res  = await fetch(`${FUNCTIONS_BASE}/spotifyToken`);
  if (!res.ok) throw new Error("Failed to fetch Spotify token from Cloud Function");

  const data = await res.json();
  cachedToken  = data.access_token;
  tokenExpiry  = Date.now() + 55 * 60 * 1000; // 55 min (tokens last 60)
  return cachedToken;
}

// ── Currently playing ────────────────────────────────────────────────────────
export async function getCurrentlyPlaying() {
  const token = await getAccessToken();
  const res   = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing",
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (res.status === 204) return null;   // nothing playing

  const data = await res.json();
  if (!data?.item) return null;

  return {
    spotifyId: data.item.id,
    title:     data.item.name,
    artist:    data.item.artists.map(a => a.name).join(", "),
    albumArt:  data.item.album.images[0]?.url ?? null,
    uri:       data.item.uri,
    durationMs: data.item.duration_ms,
    progressMs: data.progress_ms,
  };
}

// ── Search tracks ────────────────────────────────────────────────────────────
export async function searchTracks(query) {
  const token = await getAccessToken();
  const res   = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const data = await res.json();
  return (data.tracks?.items ?? []).map(track => ({
    id:       track.id,
    title:    track.name,
    artist:   track.artists.map(a => a.name).join(", "),
    albumArt: track.album.images[0]?.url ?? null,
    uri:      track.uri,
    explicit: track.explicit,
  }));
}

// ── Add to Spotify queue ─────────────────────────────────────────────────────
export async function addToQueue(uri) {
  const token = await getAccessToken();
  await fetch(
    `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(uri)}`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` } }
  );
}

// ── Random fallback song (no explicit) ──────────────────────────────────────
export async function getRandomFallbackSong() {
  const token  = await getAccessToken();
  const genres = ["pop", "hip-hop", "rock", "jazz", "indie"];
  const genre  = genres[Math.floor(Math.random() * genres.length)];

  const res  = await fetch(
    `https://api.spotify.com/v1/search?q=genre:${genre}&type=track&limit=50`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();

  const clean = (data.tracks?.items ?? []).filter(t => !t.explicit);
  if (!clean.length) return getRandomFallbackSong(); // retry once

  const track = clean[Math.floor(Math.random() * clean.length)];
  return {
    spotifyId: track.id,
    title:     track.name,
    artist:    track.artists[0].name,
    albumArt:  track.album.images[0]?.url ?? null,
    uri:       track.uri,
    durationMs: track.duration_ms,
  };
}

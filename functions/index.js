const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

// Store secrets with: firebase functions:secrets:set SPOTIFY_CLIENT_ID etc.
const SPOTIFY_CLIENT_ID     = defineSecret("SPOTIFY_CLIENT_ID");
const SPOTIFY_CLIENT_SECRET = defineSecret("SPOTIFY_CLIENT_SECRET");
const SPOTIFY_REFRESH_TOKEN = defineSecret("SPOTIFY_REFRESH_TOKEN");

initializeApp();
const adminDb = getFirestore();

// ── Helper: get a fresh Spotify access token ────────────────────────────────
async function getSpotifyAccessToken() {
  const basic = Buffer
    .from(`${SPOTIFY_CLIENT_ID.value()}:${SPOTIFY_CLIENT_SECRET.value()}`)
    .toString("base64");

  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type:    "refresh_token",
      refresh_token: SPOTIFY_REFRESH_TOKEN.value(),
    }),
  });

  if (!r.ok) throw new Error(`Token fetch failed: ${await r.text()}`);
  const data = await r.json();
  return data.access_token;
}

/**
 * GET /spotifyToken
 * Returns a fresh Spotify access token for the frontend.
 */
exports.spotifyToken = onRequest(
  { secrets: [SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN], cors: true },
  async (req, res) => {
    try {
      const access_token = await getSpotifyAccessToken();
      return res.json({ access_token });
    } catch (e) {
      console.error("spotifyToken function error:", e);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * Runs every minute. If the current Spotify song has <90s left,
 * picks the top-voted pending song and adds it to Spotify's queue.
 */
exports.autoQueueTopVoted = onSchedule(
  {
    schedule: "every 1 minutes",
    secrets: [SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN],
  },
  async () => {
    try {
      const token = await getSpotifyAccessToken();

      // 1. Check current playback
      const playRes = await fetch("https://api.spotify.com/v1/me/player", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (playRes.status === 204 || !playRes.ok) {
        console.log("No active playback.");
        return;
      }
      const playback = await playRes.json();
      if (!playback.is_playing || !playback.item) return;

      const remainingMs = playback.item.duration_ms - playback.progress_ms;
      if (remainingMs > 60_000) {
        console.log(`Song has ${Math.round(remainingMs/1000)}s left, not queueing yet.`);
        return;
      }

      // 2. Find highest-voted pending song
      const snap = await adminDb.collection("submittedSongs")
        .where("status", "==", "pending")
        .orderBy("votes", "desc")
        .orderBy("createdAt", "asc")
        .limit(1)
        .get();

      if (snap.empty) {
        console.log("No pending songs to queue.");
        return;
      }

      const winner = snap.docs[0];
      const song = winner.data();

      // 3. Push to Spotify queue
      const queueRes = await fetch(
        `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(song.uri)}`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!queueRes.ok) {
        console.error("Spotify queue push failed:", await queueRes.text());
        return;
      }

      // 4. Mark as queued so it leaves the pending list
      await winner.ref.update({
        status: "queued",
        queuedAt: FieldValue.serverTimestamp(),
      });

      // 5. Clear requester's userState so they can request again
      if (song.submittedBy) {
        await adminDb.collection("userState").doc(song.submittedBy).delete();
      }

      console.log(`✅ Queued: ${song.title} by ${song.artist}`);
    } catch (e) {
      console.error("autoQueueTopVoted error:", e);
    }
  }
);
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

// Store secrets with: firebase functions:secrets:set SPOTIFY_CLIENT_ID etc.
const SPOTIFY_CLIENT_ID     = defineSecret("SPOTIFY_CLIENT_ID");
const SPOTIFY_CLIENT_SECRET = defineSecret("SPOTIFY_CLIENT_SECRET");
const SPOTIFY_REFRESH_TOKEN = defineSecret("SPOTIFY_REFRESH_TOKEN");

/**
 * GET /spotifyToken
 * Returns a fresh Spotify access token using the stored refresh token.
 * The Client Secret never leaves the server.
 */
exports.spotifyToken = onRequest(
  { secrets: [SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN], cors: true },
  async (req, res) => {
    try {
      const clientId     = SPOTIFY_CLIENT_ID.value();
      const clientSecret = SPOTIFY_CLIENT_SECRET.value();
      const refreshToken = SPOTIFY_REFRESH_TOKEN.value();

      const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type:    "refresh_token",
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("Spotify token error:", err);
        return res.status(502).json({ error: "Failed to refresh Spotify token" });
      }

      const data = await response.json();
      return res.json({ access_token: data.access_token });

    } catch (e) {
      console.error("spotifyToken function error:", e);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

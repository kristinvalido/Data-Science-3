import { useState } from "react";
import { searchTracks } from "./spotify";
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";

// ─── DS3-48: Toast Notification Component ────────────────────────────────────
function Toast({ message, type }) {
  if (!message) return null;
  const colors = {
    success: { bg: "#1db954", icon: "✓" },
    error:   { bg: "#e74c3c", icon: "✗" },
    warning: { bg: "#f39c12", icon: "⚠" },
    info:    { bg: "#3498db", icon: "ℹ" },
  };
  const { bg, icon } = colors[type] || colors.info;
  return (
    <div style={{
      position: "fixed", top: "20px", right: "20px", zIndex: 9999,
      background: bg, color: "#fff", padding: "12px 20px",
      borderRadius: "8px", fontWeight: "bold", fontSize: "14px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      display: "flex", alignItems: "center", gap: "8px",
      animation: "slideIn 0.3s ease",
    }}>
      <span>{icon}</span> {message}
      <style>{`@keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  );
}

// ─── DS3-49: Check Firestore for duplicate submissions ────────────────────────
async function isDuplicate(spotifyId) {
  const q = query(
    collection(db, "submittedSongs"),
    where("spotifyId", "==", spotifyId)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

// ─── DS3-47: Save submission to Firestore backend ─────────────────────────────
async function submitSongToFirestore(track, userId) {
  await addDoc(collection(db, "submittedSongs"), {
    spotifyId:  track.id,
    title:      track.title,
    artist:     track.artist,
    albumArt:   track.albumArt,
    uri:        track.uri,
    submittedBy: userId || "anonymous",
    votes:      0,
    status:     "pending",       // pending | approved | rejected
    createdAt:  serverTimestamp(),
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────
function SongSearch({ user }) {
  const [query_,    setQuery]    = useState("");
  const [results,   setResults]  = useState([]);
  const [searching, setSearching] = useState(false);

  // DS3-50: Optimistic UI — track which songs are "submitted" locally right away
  const [submittedIds, setSubmittedIds] = useState(new Set());
  const [loadingIds,   setLoadingIds]   = useState(new Set());

  // DS3-48: Toast state
  const [toast, setToast] = useState({ message: "", type: "info" });

  const showToast = (message, type = "info", duration = 3000) => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "info" }), duration);
  };

  // ── Search ──────────────────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!query_.trim()) return;
    setSearching(true);
    try {
      const tracks = await searchTracks(query_);
      setResults(tracks);
      if (tracks.length === 0) showToast("No songs found. Try a different search.", "info");
    } catch (err) {
      console.error(err);
      showToast("Search failed. Check your connection.", "error");
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (track) => {
    // DS3-50: Mark as loading immediately (optimistic feel)
    setLoadingIds((prev) => new Set(prev).add(track.id));

    try {
      // DS3-49: Duplicate check BEFORE writing to Firestore
      const alreadyExists = await isDuplicate(track.id);
      if (alreadyExists) {
        showToast(`"${track.title}" has already been submitted!`, "warning");
        setLoadingIds((prev) => { const s = new Set(prev); s.delete(track.id); return s; });
        return;
      }

      // DS3-47: Write to Firestore
      await submitSongToFirestore(track, user?.uid);

      // DS3-50: Optimistic update — mark as submitted in local state instantly
      setSubmittedIds((prev) => new Set(prev).add(track.id));

      // DS3-48: Success notification
      showToast(`"${track.title}" submitted successfully! 🎵`, "success");

    } catch (err) {
      console.error("Submission error:", err);
      // DS3-48: Error notification
      showToast("Submission failed. Please try again.", "error");
    } finally {
      setLoadingIds((prev) => { const s = new Set(prev); s.delete(track.id); return s; });
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ marginTop: "30px", maxWidth: "500px", margin: "30px auto" }}>

      {/* DS3-48: Toast notification */}
      <Toast message={toast.message} type={toast.type} />

      <h2 style={{ marginBottom: "12px" }}>🎵 Submit a Song</h2>

      {/* Search bar */}
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          placeholder="Search for a song..."
          value={query_}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: "8px",
            border: "1px solid #444", background: "#1a1a1a",
            color: "#fff", fontSize: "14px",
          }}
        />
        <button
          onClick={handleSearch}
          disabled={searching}
          style={{
            padding: "10px 18px", borderRadius: "8px",
            background: searching ? "#555" : "#646cff",
            color: "#fff", border: "none", cursor: searching ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          {searching ? "..." : "Search"}
        </button>
      </div>

      {/* Results list */}
      <div style={{ marginTop: "16px" }}>
        {results.map((track) => {
          const isSubmitted = submittedIds.has(track.id);
          const isLoading   = loadingIds.has(track.id);

          return (
            <div
              key={track.id}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "10px", borderRadius: "10px",
                background: isSubmitted ? "rgba(29,185,84,0.1)" : "rgba(255,255,255,0.04)",
                border: isSubmitted ? "1px solid #1db954" : "1px solid #333",
                marginBottom: "10px", transition: "all 0.2s ease",
              }}
            >
              {/* Album art */}
              {track.albumArt && (
                <img
                  src={track.albumArt}
                  alt={track.title}
                  width="48" height="48"
                  style={{ borderRadius: "6px", objectFit: "cover" }}
                />
              )}

              {/* Song info */}
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontWeight: "bold", fontSize: "14px" }}>{track.title}</div>
                <div style={{ color: "#aaa", fontSize: "12px" }}>{track.artist}</div>
              </div>

              {/* Submit button — DS3-50: shows optimistic "Submitted!" state immediately */}
              <button
                onClick={() => handleSubmit(track)}
                disabled={isSubmitted || isLoading}
                style={{
                  padding: "8px 14px", borderRadius: "6px", border: "none",
                  background: isSubmitted ? "#1db954" : isLoading ? "#555" : "#646cff",
                  color: "#fff", fontWeight: "bold", fontSize: "12px",
                  cursor: (isSubmitted || isLoading) ? "not-allowed" : "pointer",
                  minWidth: "90px", transition: "background 0.2s ease",
                }}
              >
                {isSubmitted ? "✓ Submitted" : isLoading ? "Checking..." : "Submit"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SongSearch;
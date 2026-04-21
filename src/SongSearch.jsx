import { useState } from "react";
import { searchTracks } from "./spotify";
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, setDoc, getDoc } from "firebase/firestore";

function Toast({ message, type }) {
  if (!message) return null;
  const icons = { success:'✓', error:'✗', warning:'⚠', info:'ℹ' };
  return <div className={`toast ${type}`}>{icons[type]} {message}</div>;
}

async function isDuplicate(spotifyId) {
  const q = query(collection(db, "submittedSongs"), where("spotifyId", "==", spotifyId));
  return !(await getDocs(q)).empty;
}

async function userHasPendingSong(userId) {
  const snap = await getDoc(doc(db, "userState", userId));
  return snap.exists() && snap.data().pendingSongId;
}

async function submitSongToFirestore(track, userId) {
  const songRef = await addDoc(collection(db, "submittedSongs"), {
    spotifyId: track.id, title: track.title, artist: track.artist,
    albumArt: track.albumArt, uri: track.uri,
    submittedBy: userId || "anonymous", votes: 0, status: "pending",
    createdAt: serverTimestamp(),
  });
  await setDoc(doc(db, "userState", userId), {
    pendingSongId: songRef.id,
    updatedAt: serverTimestamp(),
  });


}

function SongSearch({ user }) {
  const [query_, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [submittedIds, setSubmittedIds] = useState(new Set());
  const [loadingIds, setLoadingIds] = useState(new Set());
  const [toast, setToast] = useState({ message: "", type: "info" });

  const showToast = (message, type = "info", duration = 3000) => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "info" }), duration);
  };

  const handleSearch = async () => {
    if (!query_.trim()) return;
    setSearching(true);
    try {
      const tracks = await searchTracks(query_);
      setResults(tracks);
      if (!tracks.length) showToast("No songs found.", "info");
    } catch { showToast("Search failed. Check your connection.", "error"); }
    finally { setSearching(false); }
  };

  const handleSubmit = async (track) => {
    if (!user?.uid) return;
    setLoadingIds(prev => new Set(prev).add(track.id));
    try {
      if (await userHasPendingSong(user.uid)) {
        showToast("You already have a song in the queue! Wait for it to play.", "warning");
        return;
      }
      if (await isDuplicate(track.id)) {
        showToast(`"${track.title}" already submitted!`, "warning");
        return;
      }
      await submitSongToFirestore(track, user.uid);
      setSubmittedIds(prev => new Set(prev).add(track.id));
      showToast(`"${track.title}" added to the queue! 🎵`, "success");
    } catch (e) {
      console.error("Submit failed:", e);
      showToast("Submission failed. Is Spotify playing?", "error");
    }
    finally { setLoadingIds(prev => { const s = new Set(prev); s.delete(track.id); return s; }); }
  };

  return (
    <div>
      <Toast message={toast.message} type={toast.type} />
      <div className="search-bar-wrap">
        <input className="search-input" type="text" placeholder="Search for a song or artist..."
          value={query_} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key==="Enter" && handleSearch()} />
        <button className="search-btn" onClick={handleSearch} disabled={searching}>
          {searching ? "Searching..." : "Search"}
        </button>
      </div>
      <div>
        {results.length === 0 && !searching && (
          <div className="empty-state"><div style={{fontSize:'2rem',marginBottom:'8px'}}>🔍</div><p>Search for a song to add it to the queue</p></div>
        )}
        {results.map(track => {
          const isSubmitted = submittedIds.has(track.id);
          const isLoading = loadingIds.has(track.id);
          return (
            <div key={track.id} className={`track-card ${isSubmitted?'submitted':''}`}>
              {track.albumArt && <img className="track-art" src={track.albumArt} alt={track.title} />}
              <div className="track-info">
                <div className="track-title">{track.title}</div>
                <div className="track-artist">{track.artist}</div>
              </div>
              <button className={`submit-btn ${isSubmitted?'submitted':''}`}
                onClick={() => handleSubmit(track)} disabled={isSubmitted || isLoading}>
                {isSubmitted ? "✓ Added" : isLoading ? "Checking..." : "+ Request"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SongSearch;

import React, { useState, useEffect, useRef } from 'react';
import { getCurrentlyPlaying } from "./spotify";
import { voteOnCurrentSong, getUserVoteForTrack, subscribeToVotes } from "./voteSystem";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { query, where, getDocs, collection, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

const NowPlaying = ({ user }) => {
  const [song, setSong]         = useState(null);
  const [voted, setVoted]       = useState(null);   // "up" | "down" | null
  const [upvotes, setUpvotes]   = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [toastMsg, setToastMsg] = useState("");
  const currentTrackId = useRef(null);

  // ── Fetch currently-playing song every 5 s ──────────────────────────────
  useEffect(() => {
    let voteUnsub = () => {};

    const fetchSong = async () => {
      const currentSong = await getCurrentlyPlaying();

      // If track changed, update Firestore + reset local voted state
      if (currentSong?.spotifyId !== currentTrackId.current) {
        currentTrackId.current = currentSong?.spotifyId || null;
        setVoted(null);

        if (currentSong?.spotifyId) {
          // Write/update the playback/current doc so vote counters exist
          await setDoc(doc(db, "playback", "current"), {
            spotifyId: currentSong.spotifyId,
            title:     currentSong.title,
            artist:    currentSong.artist,
            albumArt:  currentSong.albumArt,
            upvotes:   0,
            downvotes: 0,
            updatedAt: serverTimestamp(),
          }, { merge: false }); // full overwrite resets counters for new song

          // Check if this user already voted on the new track
          if (user?.uid) {
            const prev = await getUserVoteForTrack(user.uid, currentSong.spotifyId);
            setVoted(prev);
          }

          // Re-subscribe to live vote counts for the new track
          voteUnsub();
          voteUnsub = subscribeToVotes(({ upvotes: u, downvotes: d }) => {
            setUpvotes(u);
            setDownvotes(d);
          });
        }
      }

      // If the currently playing song is THIS user's pending request, clear their state
        if (user?.uid && currentSong?.spotifyId) {
          const mySongs = await getDocs(query(
            collection(db, "submittedSongs"),
            where("submittedBy", "==", user.uid),
            where("spotifyId", "==", currentSong.spotifyId)
          ));
          if (!mySongs.empty) {
            await deleteDoc(doc(db, "userState", user.uid));
          }
        }

      setSong(currentSong);
    };

    fetchSong();
    const interval = setInterval(fetchSong, 5000);
    return () => { clearInterval(interval); voteUnsub(); };
  }, [user?.uid]);

  // ── Toast helper ─────────────────────────────────────────────────────────
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // ── Vote handler ─────────────────────────────────────────────────────────
  const handleVote = async (type) => {
    if (voted || !song?.spotifyId) return;

    // Optimistically update UI
    setVoted(type);
    if (type === 'up') setUpvotes(v => v + 1);
    else setDownvotes(v => v + 1);

    const result = await voteOnCurrentSong(user?.uid, type, song.spotifyId);

    if (!result.success) {
      // Roll back
      setVoted(null);
      if (type === 'up') setUpvotes(v => Math.max(0, v - 1));
      else setDownvotes(v => Math.max(0, v - 1));

      if (result.reason === "already_voted") showToast("You already voted on this song!");
      else showToast("Vote failed — please try again.");
    }
  };

  // ── Render: no song ───────────────────────────────────────────────────────
  if (!song) return (
    <div className="now-playing-card">
      <div className="waiting-state">
        <div className="waveform">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="wave-bar" style={{ opacity: 0.3, animationPlayState: 'paused' }} />
          ))}
        </div>
        <span>No song currently playing — waiting for stream...</span>
      </div>
    </div>
  );

  // ── Render: song playing ──────────────────────────────────────────────────
  return (
    <>
      {toastMsg && (
        <div className="toast warning" style={{ position:'fixed', bottom:24, right:24, zIndex:9999 }}>
          ⚠ {toastMsg}
        </div>
      )}
      <div className="now-playing-card">
        <div className="live-badge"><div className="live-dot" /> Now Playing</div>
        {song.albumArt
          ? <img className="album-art" src={song.albumArt} alt={song.title} />
          : <div className="album-art-placeholder">🎵</div>
        }
        <div className="song-details">
          <div className="song-label">On Air</div>
          <div className="song-title">{song.title}</div>
          <div className="song-artist">{song.artist}</div>
          <div className="vote-row">
            <button
              className={`vote-btn ${voted === 'up' ? 'voted' : ''}`}
              onClick={() => handleVote('up')}
              disabled={!!voted}
              title={voted ? "Already voted" : "Upvote this song"}
            >
              👍 {upvotes > 0 ? upvotes : ''}
            </button>
            <button
              className={`vote-btn ${voted === 'down' ? 'voted' : ''}`}
              onClick={() => handleVote('down')}
              disabled={!!voted}
              title={voted ? "Already voted" : "Downvote this song"}
            >
              👎 {downvotes > 0 ? downvotes : ''}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NowPlaying;

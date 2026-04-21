import React, { useState, useEffect, useRef } from 'react';
import { getCurrentlyPlaying } from "./spotify";
import {
  doc, setDoc, serverTimestamp, query, where, getDocs, collection, deleteDoc
} from "firebase/firestore";
import { db } from "./firebase";

const NowPlaying = ({ user }) => {
  const [song, setSong] = useState(null);
  const currentTrackId = useRef(null);

  // ── Fetch currently-playing song every 5 s ──────────────────────────────
  useEffect(() => {
    const fetchSong = async () => {
      const currentSong = await getCurrentlyPlaying();

      // If track changed, update Firestore
      if (currentSong?.spotifyId !== currentTrackId.current) {
        currentTrackId.current = currentSong?.spotifyId || null;

        if (currentSong?.spotifyId) {
          await setDoc(doc(db, "playback", "current"), {
            spotifyId: currentSong.spotifyId,
            title:     currentSong.title,
            artist:    currentSong.artist,
            albumArt:  currentSong.albumArt,
            updatedAt: serverTimestamp(),
          }, { merge: false });
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
    return () => clearInterval(interval);
  }, [user?.uid]);

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
      </div>
    </div>
  );
};

export default NowPlaying;
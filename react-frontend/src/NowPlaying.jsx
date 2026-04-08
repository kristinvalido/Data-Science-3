import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const NowPlaying = () => {
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const playbackRef = doc(db, 'playback', 'current');

    const unsubscribe = onSnapshot(
      playbackRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSong(snapshot.data());
        } else {
          setSong(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to playback state:', error);
        setSong(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading current song . . .</div>;
  }

  if (!song) {
    return <div>Waiting for stream . . .</div>;
  }

  return (
    <div>
      {song.albumArt && (
        <img
          src={song.albumArt}
          alt={song.title ? `${song.title} album art` : 'Album art'}
          width="120"
        />
      )}
      <h3>{song.title || 'Unknown Title'}</h3>
      <p>{song.artist || 'Unknown Artist'}</p>
    </div>
  );
};

export default NowPlaying;
import React, { useState, useEffect } from 'react';
import { db } from './firebase'; // This uses the auth/config your team already made
import { doc, onSnapshot } from "firebase/firestore";

const NowPlaying = () => {
  const [song, setSong] = useState({
    title: "Waiting for Stream...",
    artist: "Titan Tunes Radio",
    albumArt: "https://via.placeholder.com/200",
    progress: 0,
    duration: 100
  });

  useEffect(() => {
    // This is the "Live Update" logic. 
    // It listens to Firestore. When the DB changes, the UI updates instantly.
    const unsub = onSnapshot(doc(db, "playback", "current"), (snapshot) => {
      if (snapshot.exists()) {
        setSong(snapshot.data());
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="now-playing-container" style={{
      background: 'rgba(255, 255, 255, 0.05)',
      padding: '2rem',
      borderRadius: '20px',
      border: '1px solid #333',
      margin: '20px 0',
      textAlign: 'center'
    }}>
      <div style={{ color: '#f97316', fontWeight: 'bold', fontSize: '12px', marginBottom: '10px' }}>
        ● LIVE UPDATES ACTIVE
      </div>
      
      <img src={song.albumArt} alt="Album" style={{ width: '200px', height: '200px', borderRadius: '15px', objectFit: 'cover', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
      
      <h2 style={{ fontSize: '1.8rem', margin: '15px 0 5px 0' }}>{song.title}</h2>
      <p style={{ color: '#aaa', fontSize: '1.1rem', marginBottom: '20px' }}>{song.artist}</p>

      {/* Progress Bar */}
      <div style={{ background: '#333', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ 
          background: 'linear-gradient(90deg, #f97316, #fb923c)', 
          height: '100%', 
          width: `${(song.progress / song.duration) * 100}%`,
          transition: 'width 1s linear' 
        }}></div>
      </div>
    </div>
  );
};

export default NowPlaying;

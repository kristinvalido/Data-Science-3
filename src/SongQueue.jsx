import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";

function SongQueue() {
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "submittedSongs"),
      where("status", "==", "pending"),
      orderBy("votes", "desc"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, snapshot => {
      setSongs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  if (songs.length === 0) return (
    <div style={{textAlign:'center',padding:'40px',color:'#7a8aaa'}}>
      <div style={{fontSize:'2.5rem',marginBottom:'10px'}}>🎶</div>
      <p>No songs in the queue yet — be the first to request one!</p>
    </div>
  );

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
      {songs.map((song, idx) => (
        <div key={song.id} style={{display:'flex',alignItems:'center',gap:'14px',padding:'12px 16px',background:'#0e1520',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'12px'}}>
          <div style={{fontSize:'0.8rem',fontWeight:'700',color: idx===0 ? '#FF6B00' : '#7a8aaa',width:'20px',textAlign:'center'}}>
            {idx === 0 ? '🔥' : `#${idx+1}`}
          </div>
          {song.albumArt && <img src={song.albumArt} alt={song.title} style={{width:'44px',height:'44px',borderRadius:'8px',objectFit:'cover'}} />}
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:'0.9rem',fontWeight:'600',color:'#f0f4ff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{song.title}</div>
            <div style={{fontSize:'0.8rem',color:'#7a8aaa'}}>{song.artist}</div>
          </div>
          <div style={{fontSize:'0.82rem',fontWeight:'600',color:'#7a8aaa'}}>👍 {song.votes || 0}</div>
        </div>
      ))}
    </div>
  );
}

export default SongQueue;

import { useEffect, useState } from "react";
import { db, auth } from "./firebase";
import {
  collection, query, orderBy, onSnapshot, where, doc, getDoc
} from "firebase/firestore";
import { upvoteSong } from "./voteSystem";

function SongQueue() {
  const [songs, setSongs] = useState([]);
  const [userVotes, setUserVotes] = useState({});  // { songId: true }
  const [pending, setPending] = useState(new Set()); // songs mid-vote

  useEffect(() => {
    const q = query(
      collection(db, "submittedSongs"),
      where("status", "==", "pending"),
      orderBy("votes", "desc"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, async (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setSongs(list);

      // Check which of these the current user has already voted on
      const uid = auth.currentUser?.uid;
      if (uid) {
        const results = await Promise.all(list.map(s =>
          getDoc(doc(db, "votes", `${uid}_${s.id}`)).then(snap => [s.id, snap.exists()])
        ));
        setUserVotes(Object.fromEntries(results));
      }
    });
    return () => unsub();
  }, []);

  const handleUpvote = async (songId) => {
    const uid = auth.currentUser?.uid;
    if (!uid || userVotes[songId] || pending.has(songId)) return;

    setPending(prev => new Set(prev).add(songId));
    setUserVotes(prev => ({ ...prev, [songId]: true })); // optimistic

    const result = await upvoteSong(uid, songId);
    if (!result.success) {
      setUserVotes(prev => { const c = { ...prev }; delete c[songId]; return c; });
    }
    setPending(prev => { const c = new Set(prev); c.delete(songId); return c; });
  };

  if (songs.length === 0) return (
    <div style={{textAlign:'center',padding:'40px',color:'#7a8aaa'}}>
      <div style={{fontSize:'2.5rem',marginBottom:'10px'}}>🎶</div>
      <p>No songs in the queue yet — be the first to request one!</p>
    </div>
  );

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
      {songs.map((song, idx) => {
        const voted = userVotes[song.id];
        return (
          <div key={song.id} style={{display:'flex',alignItems:'center',gap:'14px',padding:'12px 16px',background:'#0e1520',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'12px'}}>
            <div style={{fontSize:'0.8rem',fontWeight:'700',color: idx===0 ? '#FF6B00' : '#7a8aaa',width:'20px',textAlign:'center'}}>
              {idx === 0 ? '🔥' : `#${idx+1}`}
            </div>
            {song.albumArt && <img src={song.albumArt} alt={song.title} style={{width:'44px',height:'44px',borderRadius:'8px',objectFit:'cover'}} />}
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'0.9rem',fontWeight:'600',color:'#f0f4ff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{song.title}</div>
              <div style={{fontSize:'0.8rem',color:'#7a8aaa'}}>{song.artist}</div>
            </div>
            <button
              onClick={() => handleUpvote(song.id)}
              disabled={voted || pending.has(song.id)}
              style={{
                background: voted ? '#FF6B00' : 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                padding: '6px 12px',
                color: voted ? '#fff' : '#f0f4ff',
                cursor: voted ? 'default' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: '600',
              }}>
              👍 {song.votes || 0}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default SongQueue;
import { useEffect, useState } from 'react';
import { auth, googleProvider } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import NowPlaying from './NowPlaying';
import SongSearch from './SongSearch';
import SongQueue from './SongQueue';
import './index.css';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('request');
  const [activeNav, setActiveNav] = useState('home');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setLoading(false); });
    return () => unsub();
  }, []);

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (!result.user.email.endsWith('@csu.fullerton.edu')) {
        await signOut(auth);
        alert("Access Denied: Please use your CSUF email (@csu.fullerton.edu).");
      }
    } catch (e) { console.error("Login Error:", e); }
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <span style={{color:'var(--text-muted)',fontSize:'0.9rem'}}>Loading Titan Tunes...</span>
    </div>
  );

  if (!user) return (
    <div className="login-page">
      <div className="login-bg-glow" />
      <div className="login-card">
        <div className="login-logo">🎵</div>
        <h1 className="login-title">Titan Tunes</h1>
        <p className="login-subtitle">Request songs and shape the campus soundtrack.<br/>Sign in with your CSUF account to get started.</p>
        <button className="login-btn" onClick={login}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="white"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="white"/>
            <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="white"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="white"/>
          </svg>
          Sign in with CSUF Account
        </button>
        <div className="csuf-badge">🏫 CSUF Students Only · @csu.fullerton.edu</div>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-logo">🎵</div>
          <div className="brand-name">Titan <span>Tunes</span></div>
        </div>
        <div className="topbar-user">
          {user.photoURL && <img className="user-avatar" src={user.photoURL} alt={user.displayName} />}
          <span className="user-name">{user.displayName}</span>
          <button className="logout-btn" onClick={() => signOut(auth)}>Sign Out</button>
        </div>
      </header>

      <aside className="sidebar">
        <div className="sidebar-label">Menu</div>
        {[
          { key:'home', icon:'🏠', label:'Home' },
          { key:'request', icon:'🎵', label:'Request a Song' },
          { key:'queue', icon:'📋', label:'Song Queue' },
        ].map(item => (
          <button key={item.key} className={`sidebar-item ${activeNav===item.key?'active':''}`}
            onClick={() => setActiveNav(item.key)}>
            <span>{item.icon}</span> {item.label}
          </button>
        ))}
      </aside>

      <main className="main-content">
        <div>
          <div className="section-title">🎙️ On Air</div>
          <NowPlaying user={user} />
        </div>

        {activeNav === 'home' && (
          <div className="stats-row">
            <div className="stat-card"><div className="stat-num">CSUF</div><div className="stat-label">Campus Radio</div></div>
            <div className="stat-card"><div className="stat-num">Live</div><div className="stat-label">Real-time Updates</div></div>
            <div className="stat-card"><div className="stat-num">∞</div><div className="stat-label">Songs Available</div></div>
          </div>
        )}

        <div>
          <div className="tab-row">
            <button className={`tab-btn ${activeTab==='request'?'active':''}`} onClick={() => setActiveTab('request')}>🎵 Request a Song</button>
            <button className={`tab-btn ${activeTab==='queue'?'active':''}`} onClick={() => setActiveTab('queue')}>📋 Song Queue</button>
          </div>
          {activeTab === 'request' && <>
            <div className="section-title">Submit a Song Request</div>
            <SongSearch user={user} />
          </>}
          {activeTab === 'queue' && <>
            <div className="section-title">Upcoming Songs</div>
            <SongQueue />
          </>}
        </div>
      </main>
    </div>
  );
}

export default App;

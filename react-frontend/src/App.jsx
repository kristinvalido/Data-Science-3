import { useEffect, useState } from 'react';
import { auth, googleProvider } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';

import NowPlaying from './NowPlaying';
import SongSearch from './SongSearch';

import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (!result.user.email.endsWith('@csu.fullerton.edu')) {
        await signOut(auth);
        alert("Access Denied: Please use your official CSUF email.");
      }
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  if (loading) return <div className="login-page"><h1>Loading...</h1></div>;

  if (user) {
    return (
      <div className="home-page">
        <div>
          <a href="https://vite.dev" target="_blank">
            <img src={viteLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>
        <h1>Titan Tunes</h1>
        <NowPlaying />
        {/* Pass user so SongSearch can store submittedBy in Firestore */}
        <SongSearch user={user} />
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
          <p>Welcome back, {user.displayName}!</p>
          <button onClick={() => signOut(auth)} style={{ marginTop: '20px', backgroundColor: '#333' }}>
            Logout
          </button>
        </div>
        <p className="read-the-docs">Campus Song Request System</p>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="card">
        <h1>Welcome to Titan Tunes</h1>
        <p style={{ marginBottom: '1.5rem', color: '#ccc' }}>
          Please enter your CSUF email to continue
        </p>
        <button onClick={login}>Login with CSUF</button>
      </div>
    </div>
  );
}

export default App;
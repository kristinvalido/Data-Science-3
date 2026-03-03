import { useState } from 'react';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // For now, any @csu.fullerton.edu email will "log in"
    if (email.endsWith('@csu.fullerton.edu')) {
      onLogin(true);
    } else {
      alert('Please use your CSUF email address.');
    }
  };

  return (
    <div className="card">
      <h2>Titan Tunes Login</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '0 auto' }}>
        <input 
          type="email" 
          placeholder="CSUF Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '0.8em', borderRadius: '8px', border: '1px solid #646cff' }}
          required 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '0.8em', borderRadius: '8px', border: '1px solid #646cff' }}
          required 
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;